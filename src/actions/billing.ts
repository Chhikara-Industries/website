"use server"

import { randomUUID } from "node:crypto"

import { nowPaymentsConfigured, supabaseConfigured } from "@/lib/env"
import { createClient } from "@/lib/supabase/server"
import { createServiceClient } from "@/lib/supabase/service"
import { createInvoice, nowPaymentsPlanIdFor } from "@/lib/nowpayments"
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

  if (!nowPaymentsConfigured()) {
    return {
      message: `Demo — ${item} costs $${amountUsd.toFixed(2)}. Set NOWPAYMENTS_API_KEY to go live.`,
    }
  }

  const orderId = randomUUID()

  const row = {
    id: orderId,
    user_id: user.id,
    item,
    mode,
    crypto: selectedCrypto,
    amount_usd: amountUsd,
    currency: "usd",
    status: "pending",
    credits,
    plan,
    interval_days: intervalDays,
    nowpayments_plan_id:
      mode === "subscription" ? nowPaymentsPlanIdFor(plan as "pro" | "ultimate") || null : null,
  }

  const { error: insertError } = await supabase.from("checkouts").insert(row)

  // If the anon insert is blocked (RLS policies not applied yet) fall back to
  // the service-role client so the order is still recorded. The row always
  // belongs to the signed-in user.
  if (insertError) {
    const service = createServiceClient()
    if (insertError.code === "42P01" || !service) {
      return {
        errors: {},
        message: "Checkout isn't configured yet. Run the database migration.",
      }
    }
    const { error: serviceError } = await service.from("checkouts").insert(row)
    if (serviceError) {
      console.error("[billing] order insert failed", {
        code: serviceError.code,
        message: serviceError.message,
      })
      return {
        errors: {},
        message: "Checkout could not be recorded. Please try again.",
      }
    }
  }

  let invoice
  try {
    invoice = await createInvoice({
      amountUsd,
      orderId,
      orderDescription: item,
      selectedCrypto,
    })
  } catch (e) {
    console.error("[billing] invoice creation failed", {
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

  const { error: updateError } = await supabase
    .from("checkouts")
    .update({
      status: "awaiting_payment",
      nowpayments_invoice_id: invoice.invoiceId,
      nowpayments_purchase_id: invoice.purchaseId ?? null,
    })
    .eq("id", orderId)
  if (updateError) {
    const service = createServiceClient()
    if (service) {
      await service
        .from("checkouts")
        .update({
          status: "awaiting_payment",
          nowpayments_invoice_id: invoice.invoiceId,
          nowpayments_purchase_id: invoice.purchaseId ?? null,
        })
        .eq("id", orderId)
    }
  }

  return {
    redirectUrl: invoice.invoiceUrl,
    orderId,
    message: `Checkout started for ${item} ($${amountUsd.toFixed(2)}) with ${CRYPTOS[selectedCrypto]}.`,
  }
}