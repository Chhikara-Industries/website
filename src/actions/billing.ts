"use server"

import { randomUUID } from "node:crypto"

import { shieldzConfigured, supabaseConfigured } from "@/lib/env"
import { createClient } from "@/lib/supabase/server"
import { createServiceClient } from "@/lib/supabase/service"
import { isValidCryptoAddress } from "@/lib/crypto-address"
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
        wallet: [`Enter a valid ${selectedCrypto.toUpperCase()} wallet address for refunds/records.`],
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

  if (!shieldzConfigured()) {
    return {
      message: `Demo — ${item} costs $${amountUsd.toFixed(2)}. Set SHIELDZ_API_KEY to go live.`,
    }
  }

  // A subscription may only be re-purchased once the previous one lapses.
  if (mode === "subscription" && plan) {
    const { data: existingSub } = await supabase
      .from("subscriptions")
      .select("plan, status, current_period_end")
      .eq("user_id", user.id)
      .eq("plan", plan)
      .maybeSingle()
    const periodEnd = existingSub?.current_period_end
    const active =
      existingSub &&
      existingSub.status === "active" &&
      (!periodEnd || new Date(periodEnd).getTime() > Date.now())
    if (active) {
      return {
        errors: {},
        message: `${item} is already active on your account${
          periodEnd
            ? ` through ${new Date(periodEnd).toLocaleDateString()}`
            : ""
        }. Manage it from the billing page.`,
      }
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
    wallet_address: walletAddress,
    credits,
    plan,
    interval_days: intervalDays,
  }

  const insertError = await insertCheckout(supabase, row)
  if (typeof insertError === "string") {
    return { errors: {}, message: insertError }
  }

  return { orderId }
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