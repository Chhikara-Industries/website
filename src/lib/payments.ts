import "server-only"

import {
  createEmailSubscription,
  nowPaymentsPlanIdFor,
  type NowPaymentsPayment,
} from "@/lib/nowpayments"
import { plans } from "@/lib/plans"

export type CheckoutRow = {
  id: string
  user_id: string
  mode: string
  credits: number
  plan: string | null
  amount_usd: number
  nowpayments_plan_id: string | null
  nowpayments_subscription_id: string | null
  ipn_count?: number
}

export type ServiceClient = NonNullable<
  ReturnType<typeof import("@/lib/supabase/service").createServiceClient>
>

// NOWPayments statuses mirrored to the internal order status. Only `finished`
// fulfills an order; waiting/confirming keep it awaiting payment, while
// partially_paid / sending MUST NOT auto-credit.
export const STATUS_MAP: Record<string, string> = {
  waiting: "awaiting_payment",
  confirming: "awaiting_payment",
  confirmed: "awaiting_payment",
  sending: "awaiting_payment",
  partially_paid: "awaiting_payment",
  finished: "paid",
  failed: "failed",
  refunded: "failed",
  expired: "expired",
}

export const FULFILL_STATUS = "finished"
const AMOUNT_TOLERANCE = 0.99

// NOWPayments /v1/subscriptions statuses mirrored to the internal order
// status. Only a paid/active/finished subscription fulfills the plan;
// WAITING_PAY / partially_paid MUST NOT activate anything.
const SUBSCRIPTION_STATUS_MAP: Record<string, string> = {
  waiting_pay: "awaiting_payment",
  waiting: "awaiting_payment",
  confirming: "awaiting_payment",
  confirmed: "awaiting_payment",
  sending: "awaiting_payment",
  partially_paid: "awaiting_payment",
  finished: "paid",
  paid: "paid",
  active: "paid",
  failed: "failed",
  refunded: "failed",
  cancelled: "failed",
  canceled: "failed",
  expired: "expired",
}

const SUBSCRIPTION_PAID = new Set(["finished", "paid", "active"])

// Acceptance: a full payment (finished) for at least the settled amount.
export function amountSatisfied(
  orderAmountUsd: number,
  payment: NowPaymentsPayment
): boolean {
  const received = payment.actually_paid_at_fiat ?? payment.actually_paid
  if (typeof received === "number" && received > 0) {
    return received >= orderAmountUsd * AMOUNT_TOLERANCE
  }
  if (typeof payment.price_amount === "number" && payment.price_amount > 0) {
    return payment.price_amount >= orderAmountUsd * AMOUNT_TOLERANCE
  }
  return false
}

// Mirrors a NOWPayments status onto a checkout row. Finished + amount-satisfied
// triggers atomic `fulfill_checkout` (idempotent; pays at most once). Every
// other status only updates the mirrored columns.
export async function applyPaymentStatus(
  supabase: ServiceClient,
  checkout: CheckoutRow,
  status: string,
  payment: NowPaymentsPayment | null
) {
  const fulfill =
    status === FULFILL_STATUS &&
    (payment == null || amountSatisfied(checkout.amount_usd, payment))

  if (fulfill) {
    const { error, data } = await supabase.rpc("fulfill_checkout", {
      p_order_id: checkout.id,
      p_payment_id: payment?.payment_id != null ? String(payment.payment_id) : "",
      p_nowpayments_status: status,
    })
    if (error) {
      console.error("[payments] fulfill rpc failed", {
        orderId: checkout.id,
        error: error.message,
      })
      return
    }
    if (data === true) {
      console.info("[payments] order fulfilled", { orderId: checkout.id, status })
      await attachRecurringSubscription(supabase, checkout)
    }
    return
  }

  const internalStatus = STATUS_MAP[status] ?? "awaiting_payment"
  const { error: updateError } = await supabase
    .from("checkouts")
    .update({
      status: internalStatus,
      nowpayments_status: status,
      nowpayments_payment_id:
        payment?.payment_id != null ? String(payment.payment_id) : undefined,
      ipn_count: checkout.ipn_count ? checkout.ipn_count + 1 : 1,
    })
    .eq("id", checkout.id)
  if (updateError) {
    console.warn("[payments] status update failed", {
      orderId: checkout.id,
      error: updateError.message,
    })
  }
}

// Recurring renewal: extends the active subscription period for the
// NOWPayments payment id (idempotent inside the RPC).
export async function applyRenewal(
  supabase: ServiceClient,
  subscriptionId: string,
  status: string,
  payment: NowPaymentsPayment | null
) {
  if (status !== FULFILL_STATUS || payment?.payment_id == null) return
  const { error } = await supabase.rpc("renew_subscription", {
    p_nowpayments_subscription_id: subscriptionId,
    p_payment_id: String(payment.payment_id),
    p_status: status,
  })
  if (error) {
    console.warn("[payments] renewal rpc failed", {
      subscriptionId,
      error: error.message,
    })
  }
}

// Mirrors a NOWPayments subscription status onto a subscription-mode checkout.
// A paid/active/finished subscription activates the plan via the same
// idempotent fulfill_checkout RPC; WAITING_PAY / partially_paid only mirror.
export async function applySubscriptionStatus(
  supabase: ServiceClient,
  checkout: CheckoutRow,
  status: string,
  payment: Partial<NowPaymentsPayment> | null
) {
  const key = status.toLowerCase().replace(/[\s-]+/g, "_")
  const fulfilled =
    SUBSCRIPTION_PAID.has(key) ||
    (typeof payment?.payment_status === "string" &&
      SUBSCRIPTION_PAID.has(payment.payment_status.toLowerCase()))

  if (fulfilled) {
    const { error } = await supabase.rpc("fulfill_checkout", {
      p_order_id: checkout.id,
      p_payment_id:
        payment?.payment_id != null ? String(payment.payment_id) : "",
      p_nowpayments_status: "finished",
    })
    if (error) {
      console.error("[payments] subscription fulfill rpc failed", {
        orderId: checkout.id,
        error: error.message,
      })
    }
    return
  }

  const internalStatus = SUBSCRIPTION_STATUS_MAP[key] ?? "awaiting_payment"
  const { error: updateError } = await supabase
    .from("checkouts")
    .update({
      status: internalStatus,
      nowpayments_status: status,
      ipn_count: checkout.ipn_count ? checkout.ipn_count + 1 : 1,
    })
    .eq("id", checkout.id)
  if (updateError) {
    console.warn("[payments] subscription status update failed", {
      orderId: checkout.id,
      error: updateError.message,
    })
  }
}

// Best-effort: hook the initial subscription payment into NOWPayments'
// recurring billing so the next period renews automatically. In the normal
// flow the subscription was already created at checkout time, so this only
// fills the gap for pre-existing (legacy) subscription checkouts.
async function attachRecurringSubscription(
  supabase: ServiceClient,
  checkout: CheckoutRow
) {
  if (checkout.mode !== "subscription" || !checkout.nowpayments_plan_id) return
  if (checkout.nowpayments_subscription_id) return
  try {
    const profile = await supabase.auth.admin.getUserById(checkout.user_id)
    const email = profile.data.user?.email
    const planKey = checkout.plan === "ultimate" ? "ultimate" : "pro"
    const plan = plans.find((p) => p.id === planKey)
    if (!email || !plan?.intervalDays) return

    const result = await createEmailSubscription({
      planId: checkout.nowpayments_plan_id,
      email,
    })
    await supabase
      .from("checkouts")
      .update({
        nowpayments_subscription_id: result.subscriptionId,
        nowpayments_plan_id: nowPaymentsPlanIdFor(planKey),
      })
      .eq("id", checkout.id)
    console.info("[payments] recurring subscription attached", {
      orderId: checkout.id,
      subscriptionId: result.subscriptionId,
    })
  } catch (e) {
    console.warn("[payments] could not attach recurring subscription", {
      orderId: checkout.id,
      error: e instanceof Error ? e.message : "unknown",
    })
  }
}