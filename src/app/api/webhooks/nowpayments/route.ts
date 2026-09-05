import { NextResponse } from "next/server"

import {
  createEmailSubscription,
  getPaymentStatus,
  nowPaymentsPlanIdFor,
  verifyIpnSignature,
  type NowPaymentsPayment,
} from "@/lib/nowpayments"
import { supabaseServiceConfigured } from "@/lib/env"
import { createServiceClient } from "@/lib/supabase/service"
import { plans } from "@/lib/plans"

type CheckoutRow = {
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

// NOWPayments statuses that should be mirrored to the order. Only `finished`
// fulfills an order; waiting/confirming keep it awaiting payment, while
// partially_paid / sending MUST NOT auto-credit.
const STATUS_MAP: Record<string, string> = {
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

const FULFILL_STATUS = "finished"
// Allow tiny tolerance for fiat rounding on fixed-rate invoices.
const AMOUNT_TOLERANCE = 0.99

export async function POST(request: Request) {
  const signature = request.headers.get("x-nowpayments-sig") ?? ""
  const raw = await request.text()

  // NOWPayments computes the signature over the raw body with all keys sorted
  // alphabetically (recursively). Verify before trusting anything.
  const payload = safeParse(raw)
  if (!payload) {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 })
  }

  if (!verifyIpnSignature(payload, signature)) {
    console.warn("[ipn] invalid signature")
    return NextResponse.json({ error: "Invalid signature" }, { status: 401 })
  }

  if (!supabaseServiceConfigured()) {
    return NextResponse.json({ ok: true }, { status: 200 })
  }
  const supabase = createServiceClient()
  if (!supabase) {
    return NextResponse.json({ ok: true }, { status: 200 })
  }

  const status =
    typeof payload.payment_status === "string"
      ? payload.payment_status
      : typeof payload.outcome_payment_status === "string"
        ? payload.outcome_payment_status
        : ""
  const rawPaymentId = payload.payment_id
  const paymentId =
    typeof rawPaymentId === "number" || typeof rawPaymentId === "string"
      ? rawPaymentId
      : undefined
  const rawOrderId = payload.order_id
  const orderId = typeof rawOrderId === "string" ? rawOrderId : undefined
  const rawSubscriptionId = payload.subscription_id ?? payload.subscription_plan_id
  const subscriptionId =
    typeof rawSubscriptionId === "number" || typeof rawSubscriptionId === "string"
      ? String(rawSubscriptionId)
      : ""

  try {
    // Cross-check the payment with NOWPayments before acting on it. A failure
    // here means we can't verify the payment is legitimate, so we do nothing.
    if (paymentId !== undefined) {
      const remote = await getPaymentStatus(paymentId)
      const remoteStatus = remote.payment_status
      if (remoteStatus !== status) {
        console.warn("[ipn] status mismatch: does not match NOWPayments API", {
          paymentId,
          local: status,
          remote: remoteStatus,
        })
        return NextResponse.json({ ok: true }, { status: 200 })
      }
      await recordIpn(supabase, orderId, subscriptionId, status, remote)
    } else {
      await recordIpn(supabase, orderId, subscriptionId, status, null)
    }
  } catch (e) {
    console.error("[ipn] processing error", {
      paymentId,
      orderId,
      subscriptionId,
      error: e instanceof Error ? e.message : "unknown",
    })
  }

  return NextResponse.json({ ok: true }, { status: 200 })
}

function safeParse(raw: string): Record<string, unknown> | null {
  try {
    const parsed = JSON.parse(raw)
    return parsed && typeof parsed === "object" ? parsed : null
  } catch {
    return null
  }
}

async function recordIpn(
  supabase: NonNullable<ReturnType<typeof createServiceClient>>,
  orderId: string | undefined,
  subscriptionId: string,
  status: string,
  payment: NowPaymentsPayment | null
) {
  // Recurring renewal: no order_id, but the subscription is linked.
  if (!orderId && subscriptionId) {
    if (status === FULFILL_STATUS) {
      if (payment?.payment_id != null) {
        const { error } = await supabase.rpc("renew_subscription", {
          p_nowpayments_subscription_id: subscriptionId,
          p_payment_id: String(payment.payment_id),
          p_status: status,
        })
        if (error) {
          console.warn("[ipn] renewal rpc failed", { subscriptionId, error: error.message })
        }
      }
    }
    return
  }

  if (!orderId) {
    console.warn("[ipn] no order_id or subscription_id; ignoring")
    return
  }

  const { data: checkout, error: fetchError } = await supabase
    .from("checkouts")
    .select("*")
    .eq("id", orderId)
    .maybeSingle()

  if (fetchError || !checkout) {
    console.warn("[ipn] order not found", { orderId })
    return
  }

  const row = checkout as CheckoutRow

  // Only an verified, full payment fulfills the order.
  const fulfill =
    status === FULFILL_STATUS &&
    (payment == null || amountSatisfied(row.amount_usd, payment))

  if (fulfill) {
    const { error, data } = await supabase.rpc("fulfill_checkout", {
      p_order_id: orderId,
      p_payment_id: payment?.payment_id != null ? String(payment.payment_id) : "",
      p_nowpayments_status: status,
    })
    if (error) {
      console.error("[ipn] fulfill rpc failed", { orderId, error: error.message })
    } else if (data === true) {
      console.info("[ipn] order fulfilled", { orderId, status })

      // Best-effort: hook the initial subscription payment into NOWPayments'
      // recurring billing so the next period renews automatically.
      if (row.mode === "subscription" && row.nowpayments_plan_id) {
        await attachRecurringSubscription(supabase, row)
      }
    }
    return
  }

  // Mirrored status update only — the order is never auto-paid here.
  const internalStatus = STATUS_MAP[status] ?? "awaiting_payment"
  const { error: updateError } = await supabase
    .from("checkouts")
    .update({
      status: internalStatus,
      nowpayments_status: status,
      nowpayments_payment_id:
        payment?.payment_id != null
          ? String(payment.payment_id)
          : undefined,
      ipn_count: row.ipn_count ? row.ipn_count + 1 : 1,
    })
    .eq("id", orderId)
  if (updateError) {
    console.warn("[ipn] status update failed", { orderId, error: updateError.message })
  }
}

// Acceptance: full payment received (finished) for at least the settled amount.
function amountSatisfied(orderAmountUsd: number, payment: NowPaymentsPayment): boolean {
  const received = payment.actually_paid_at_fiat ?? payment.actually_paid
  if (typeof received === "number" && received > 0) {
    return received >= orderAmountUsd * AMOUNT_TOLERANCE
  }
  // Fixed-rate fallback: the settled fiat amount itself proves intent.
  if (typeof payment.price_amount === "number" && payment.price_amount > 0) {
    return payment.price_amount >= orderAmountUsd * AMOUNT_TOLERANCE
  }
  return false
}

async function attachRecurringSubscription(
  supabase: NonNullable<ReturnType<typeof createServiceClient>>,
  row: CheckoutRow
) {
  try {
    const profile = await supabase.auth.admin.getUserById(row.user_id)
    const email = profile.data.user?.email
    const planKey = row.plan === "ultimate" ? "ultimate" : "pro"
    const plan = plans.find((p) => p.id === planKey)
    if (!email || !plan?.intervalDays) return

    const result = await createEmailSubscription({
      planId: row.nowpayments_plan_id!,
      email,
      orderId: row.id,
    })
    await supabase
      .from("checkouts")
      .update({
        nowpayments_subscription_id: result.subscriptionId,
        nowpayments_plan_id: nowPaymentsPlanIdFor(planKey),
      })
      .eq("id", row.id)
    console.info("[ipn] recurring subscription attached", {
      orderId: row.id,
      subscriptionId: result.subscriptionId,
    })
  } catch (e) {
    console.warn("[ipn] could not attach recurring subscription", {
      orderId: row.id,
      error: e instanceof Error ? e.message : "unknown",
    })
  }
}