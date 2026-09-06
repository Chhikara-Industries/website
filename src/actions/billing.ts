"use server"

import { randomUUID } from "node:crypto"

import {
  nowPaymentsConfigured,
  nowPaymentsSubscriptionConfigured,
  supabaseConfigured,
} from "@/lib/env"
import { createClient } from "@/lib/supabase/server"
import { createServiceClient } from "@/lib/supabase/service"
import {
  cancelEmailSubscription,
  createDirectPayment,
  createEmailSubscription,
  isValidCryptoAddress,
  listSubscriptions,
  NowPaymentsError,
  nowPaymentsPlanIdFor,
} from "@/lib/nowpayments"
import { MIN_CREDITS } from "@/lib/checkout"
import { getTokenPackage } from "@/lib/token-packages"
import { plans, type PlanId } from "@/lib/plans"
import type { FormState } from "@/actions/auth"

export type CheckoutCrypto = "btc" | "eth" | "sol"

const CRYPTOS: Record<CheckoutCrypto, string> = {
  btc: "BTC",
  eth: "ETH",
  sol: "SOL",
}

export type CheckoutResult = FormState & {
  redirectUrl?: string
  orderId?: string
}

export type CheckoutState = CheckoutResult | undefined

// Server-side catalog of paid plans (subscribable). Amounts are resolved here,
// never taken from the client.
const SUBSCRIBABLE_PLANS = plans.filter((p) => p.id !== "free")

export async function createCheckout(
  _prev: CheckoutState,
  formData: FormData
): Promise<CheckoutResult> {
  if (!supabaseConfigured()) {
    return { errors: {}, message: "Billing isn't set up yet on the server." }
  }

  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return { errors: {}, message: "You must be signed in." }

  const mode = String(formData.get("mode") ?? "")
  const crypto = String(formData.get("crypto") ?? "btc")
  if (!(crypto in CRYPTOS)) {
    return { errors: {}, message: "Unsupported cryptocurrency." }
  }
  const selectedCrypto = crypto as CheckoutCrypto
  const walletAddress = String(formData.get("wallet") ?? "").trim()
  if (!isValidCryptoAddress(walletAddress, selectedCrypto)) {
    return {
      errors: {
        wallet: [`Enter a valid ${selectedCrypto.toUpperCase()} wallet address to receive payouts/refunds.`],
      },
    }
  }

  let amountUsd = 0
  let credits = 0
  let plan: PlanId | null = null
  let intervalDays: number | null = null
  let item = ""

  if (mode === "credits") {
    const packageId = String(formData.get("packageId") ?? "").trim()
    const pkg = getTokenPackage(packageId)
    if (!pkg) {
      return { errors: {}, message: "Unknown token package." }
    }
    credits = pkg.tokens
    amountUsd = pkg.priceUsd
    item = `${pkg.tokens.toLocaleString()} tokens (${pkg.name})`
  } else if (mode === "subscription") {
    const planId = String(formData.get("plan") ?? "") as PlanId
    const p = SUBSCRIBABLE_PLANS.find((x) => x.id === planId)
    if (!p) {
      return { errors: {}, message: "Unknown plan." }
    }
    if (!p.priceUsd) {
      return { errors: {}, message: "Plan is not priced yet." }
    }
    plan = p.id
    amountUsd = p.priceUsd
    intervalDays = p.intervalDays ?? 30
    item = p.name
  } else {
    return { errors: {}, message: "Unknown checkout mode." }
  }

  if (amountUsd <= 0) {
    return { errors: {}, message: "Invalid checkout amount." }
  }
  if (credits > 0 && credits < MIN_CREDITS) {
    return {
      errors: { tokens: [`Minimum purchase is ${MIN_CREDITS} credits.`] },
    }
  }

  const orderId = randomUUID()

  // One-off token purchase: crypto deposit via direct payment.
  if (mode === "credits") {
    if (!nowPaymentsConfigured()) {
      return {
        message: `Demo — ${item} costs $${amountUsd.toFixed(2)}. Set NOWPAYMENTS_API_KEY to go live.`,
      }
    }

    const row = {
      id: orderId,
      user_id: user.id,
      item,
      mode,
      crypto: selectedCrypto,
      amount_usd: amountUsd,
      currency: "usd",
      status: "pending",
      wallet_address: walletAddress,
      credits,
      plan,
      interval_days: intervalDays,
    }

    const insertError = await insertCheckout(supabase, row)
    if (typeof insertError === "string") {
      return { errors: {}, message: insertError }
    }

    let payment
    try {
      payment = await createDirectPayment({
        amountUsd,
        orderId,
        orderDescription: item,
        selectedCrypto,
        payoutAddress: walletAddress,
        payoutCurrency: selectedCrypto,
      })
    } catch (e) {
      console.error("[billing] payment creation failed", {
        orderId,
        mode,
        error: e instanceof Error ? e.message : "unknown",
      })
      return {
        errors: {},
        message: `Could not start checkout. ${
          e instanceof Error ? e.message : "Please try again later."
        }`,
      }
    }

    const update = {
      status: "awaiting_payment",
      nowpayments_payment_id: payment.paymentId,
      nowpayments_purchase_id: payment.purchaseId ?? null,
      nowpayments_status: "waiting",
      pay_address: payment.payAddress,
      pay_currency: payment.payCurrency,
      pay_amount: payment.payAmount,
    }

    const updateError = await updateCheckout(supabase, orderId, update)
    if (typeof updateError === "string") {
      return { errors: {}, message: updateError }
    }

    return {
      orderId,
      message: `Checkout started for ${item}. Send exactly ${payment.payAmount} ${payment.payCurrency.toUpperCase()} to the address shown.`,
    }
  }

  // Subscription: create the recurring subscription on NOWPayments up front.
  // NOWPayments emails the customer a payment link; the plan only activates in
  // our Supabase once that payment finishes (via IPN or status cross-check).
  if (!nowPaymentsSubscriptionConfigured()) {
    return {
      errors: {},
      message: "Subscriptions aren't set up yet on the server.",
    }
  }
  if (!user.email) {
    return {
      errors: {},
      message: "Your account needs an email address to subscribe.",
    }
  }
  const planKey = plan === "ultimate" ? "ultimate" : "pro"
  const nowPlanId = nowPaymentsPlanIdFor(planKey)
  if (!nowPlanId) {
    return {
      errors: {},
      message: "This plan isn't set up for billing yet.",
    }
  }

  // NOWPayments allows one email subscription per plan. If our records already
  // show this user subscribed to this plan, don't create a second one.
  const { data: existingSub } = await supabase
    .from("subscriptions")
    .select("plan, status, current_period_end")
    .eq("user_id", user.id)
    .maybeSingle()
  if (existingSub && existingSub.plan === plan) {
    const periodEnd = existingSub.current_period_end
    const active =
      existingSub.status === "active" &&
      (!periodEnd || new Date(periodEnd).getTime() > Date.now())
    return {
      errors: {},
      message: active
        ? `${item} is already active on your account${
            periodEnd
              ? ` through ${new Date(periodEnd).toLocaleDateString()}`
              : ""
          }. Manage it from the billing page.`
        : `${item} is already on your account. Refresh the billing page to see its status.`,
    }
  }

  // A subscription link may already be pending (owed payment, expired link),
  // which ALSO blocks re-subscribing the same email/plan on NOWPayments.
  const { data: pendingSub } = await supabase
    .from("checkouts")
    .select("id")
    .eq("user_id", user.id)
    .eq("mode", "subscription")
    .eq("plan", plan)
    .eq("status", "awaiting_payment")
    .maybeSingle()
  if (pendingSub) {
    return {
      errors: {},
      message: `${item} is already pending for ${user.email}. Open the payment link NOWPayments emailed you to finish paying.`,
    }
  }

  const SUBSCRIPTION_PAID = new Set(["finished", "paid", "active"])

  // NOWPayments registers the email the moment a subscription is created
  // (WAITING_PAY), even before any payment. That slot blocks re-subscribing,
  // so when creating a fresh subscription hits "already subscribed",
  // release the user's unpaid entries for this plan first, then retry.
  const releaseStaleSubscriptions = async (): Promise<boolean> => {
    try {
      const list = await listSubscriptions({ planId: nowPlanId, limit: 500 })
      const mine = list.filter(
        (s) =>
          s.email?.toLowerCase() === user.email!.toLowerCase() &&
          !SUBSCRIPTION_PAID.has(s.status.toLowerCase())
      )
      if (mine.length === 0) return false
      for (const item of mine) {
        await cancelEmailSubscription(item.id)
      }
      return true
    } catch {
      return false
    }
  }

  let subscription
  let staleReleased = false
  try {
    subscription = await createEmailSubscription({
      planId: nowPlanId,
      email: user.email,
    })
  } catch (e) {
    console.error("[billing] subscription creation failed", {
      orderId,
      planKey,
      error: e instanceof Error ? e.message : "unknown",
    })
    const isAuthFailure =
      e instanceof NowPaymentsError && e.status === 401
    const isAlreadySubscribed =
      e instanceof NowPaymentsError && /already subscribed/i.test(e.message)
    if (!isAuthFailure && isAlreadySubscribed) {
      staleReleased = await releaseStaleSubscriptions()
      if (staleReleased) {
        // Mark any older unpaid checkouts for this plan as cancelled so they
        // no longer count as pending.
        await supabase
          .from("checkouts")
          .update({ status: "cancelled", nowpayments_status: "cancelled" })
          .eq("user_id", user.id)
          .eq("mode", "subscription")
          .eq("plan", plan)
          .eq("status", "awaiting_payment")
        try {
          subscription = await createEmailSubscription({
            planId: nowPlanId,
            email: user.email,
          })
        } catch (e2) {
          console.error("[billing] fresh subscription failed after release", {
            orderId,
            planKey,
            error: e2 instanceof Error ? e2.message : "unknown",
          })
        }
      }
    }
    if (!subscription) {
      return {
        errors: {},
        message: `Could not start subscription. ${
          isAuthFailure
            ? "The payment provider rejected the credentials. Refresh NOWPAYMENTS_EMAIL/NOWPAYMENTS_PASSWORD and try again."
            : isAlreadySubscribed
              ? staleReleased
                ? "The old unpaid subscription was released, but creating a new one just failed. Please try again."
                : `${item} is registered to this email on NOWPayments (one subscription per email per plan) and it couldn't be released automatically. Open the payment link NOWPayments emailed to ${user.email}, or contact support to release the plan.`
              : e instanceof Error
                ? e.message
                : "Please try again later."
        }`,
      }
    }
  }

  const row = {
    id: orderId,
    user_id: user.id,
    item,
    mode,
    crypto: selectedCrypto,
    amount_usd: amountUsd,
    currency: "usd",
    status: "awaiting_payment",
    wallet_address: walletAddress,
    credits: 0,
    plan,
    interval_days: intervalDays,
    nowpayments_plan_id: nowPlanId,
    nowpayments_subscription_id: subscription.subscriptionId,
    nowpayments_status: subscription.status || "WAITING_PAY",
  }

  const insertError = await insertCheckout(supabase, row)
  if (typeof insertError === "string") {
    return { errors: {}, message: insertError }
  }

  return {
    orderId,
    message: `Subscription started for ${item}. NOWPayments emailed a secure payment link to ${user.email} — open it and pay to activate your plan. This page confirms automatically once paid.`,
  }
}

// Records the public order. If the anon insert is blocked (RLS policies not
// applied yet) it falls back to the service-role client so the order is still
// recorded. The row always belongs to the signed-in user. Returns an error
// message string when the insert could not be recorded, or null.
async function insertCheckout(
  supabase: Awaited<ReturnType<typeof createClient>>,
  row: Record<string, unknown>
): Promise<string | null> {
  const { error } = await supabase.from("checkouts").insert(row)
  if (error) {
    const service = createServiceClient()
    if (error.code === "42P01" || !service) {
      return "Checkout isn't configured yet. Run the database migration."
    }
    const { error: serviceError } = await service.from("checkouts").insert(row)
    if (serviceError) {
      console.error("[billing] order insert failed", {
        code: serviceError.code,
        message: serviceError.message,
      })
      return "Checkout could not be recorded. Please try again."
    }
  }
  return null
}

async function updateCheckout(
  supabase: Awaited<ReturnType<typeof createClient>>,
  orderId: string,
  update: Record<string, unknown>
): Promise<string | null> {
  const { error } = await supabase
    .from("checkouts")
    .update(update)
    .eq("id", orderId)
  if (error) {
    const service = createServiceClient()
    if (service) {
      const { error: serviceError } = await service
        .from("checkouts")
        .update(update)
        .eq("id", orderId)
      if (!serviceError) return null
    }
    return "Checkout could not be recorded. Please try again."
  }
  return null
}