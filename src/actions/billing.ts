"use server"

import { randomUUID } from "node:crypto"

import { nowPaymentsConfigured, supabaseConfigured } from "@/lib/env"
import { createClient } from "@/lib/supabase/server"
import { createServiceClient } from "@/lib/supabase/service"
import { createInvoice } from "@/lib/nowpayments"
import { MIN_CREDITS } from "@/lib/checkout"
import type { FormState } from "@/actions/auth"
import { plans, type PlanId } from "@/lib/plans"

export type CheckoutCrypto = "btc" | "eth" | "sol"

export type CheckoutResult = FormState & {
  redirectUrl?: string
}

export type CheckoutState = CheckoutResult | undefined

export async function createCheckout(
  _prev: CheckoutState,
  formData: FormData
): Promise<CheckoutResult> {
  const mode = String(formData.get("mode") ?? "credits")
  const crypto = String(formData.get("crypto") ?? "btc") as CheckoutCrypto
  const amountUsd = Number(formData.get("amountUsd") ?? 0)

  if (!Number.isFinite(amountUsd) || amountUsd <= 0) {
    return { errors: { amountUsd: ["Enter an amount greater than $0."] } }
  }

  const cryptoLabel = crypto.toUpperCase()

  let item = ""
  let credits = 0
  let plan: PlanId | null = null
  if (mode === "subscription") {
    const planId = String(formData.get("plan") ?? "pro") as PlanId
    const p = plans.find((x) => x.id === planId && x.id !== "free")
    if (!p) return { errors: {}, message: "Unknown plan." }
    plan = p.id
    item = p.name
  } else {
    credits = Math.round(amountUsd * 1000)
    if (credits < MIN_CREDITS) {
      return {
        errors: { tokens: [`Minimum purchase is ${MIN_CREDITS} credits.`] },
      }
    }
    item = `${credits.toLocaleString()} credits`
  }

  if (!nowPaymentsConfigured()) {
    return {
      message: `Demo — ${item} costs $${amountUsd.toFixed(2)}. Checkout with ${cryptoLabel} is ready; set NOWPAYMENTS_API_KEY to go live.`,
    }
  }

  if (!supabaseConfigured()) {
    return {
      errors: {},
      message: "Billing isn't set up yet. Configure Supabase to record checkout.",
    }
  }

  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return { errors: {}, message: "You must be signed in." }

  const orderId = randomUUID()

  const row = {
    id: orderId,
    user_id: user.id,
    item,
    mode,
    crypto,
    amount_usd: amountUsd,
    status: "pending",
    credits,
    plan,
  }

  const { error: insertError } = await supabase.from("checkouts").insert(row)

  // If the anon insert is blocked (e.g. RLS policies not applied yet), retry
  // with the service-role client so the order is still recorded. The row only
  // ever belongs to the signed-in user.
  if (insertError && insertError.code !== "42P01") {
    const service = createServiceClient()
    if (service) {
      const { error: serviceError } = await service
        .from("checkouts")
        .insert(row)
      if (serviceError && serviceError.code !== "42P01") {
        return {
          errors: {},
          message: "Checkout could not be recorded. Please try again.",
        }
      }
    } else {
      return {
        errors: {},
        message: "Checkout could not be recorded. Please try again.",
      }
    }
  }

  let invoiceUrl: string
  try {
    const invoice = await createInvoice({
      amountUsd,
      orderId,
      orderDescription: item,
    })
    invoiceUrl = invoice.invoiceUrl
  } catch (e) {
    return {
      errors: {},
      message: `Could not start checkout: ${
        e instanceof Error ? e.message : "try again later"
      }`,
    }
  }

  const { error: updateError } = await supabase
    .from("checkouts")
    .update({ status: "awaiting_payment" })
    .eq("id", orderId)
  if (updateError) {
    // Non-fatal; the webhook still reconciles by order_id.
  }

  return {
    redirectUrl: invoiceUrl,
    message: `Checkout started for ${item} ($${amountUsd.toFixed(2)}) with ${cryptoLabel}.`,
  }
}
