"use server"

import { randomUUID } from "node:crypto"

import { fetchMutation } from "convex/nextjs"

import { api } from "@/convex/_generated/api"
import { shieldzConfigured } from "@/lib/env"
import { getAuthToken, convexErrorMessage } from "@/lib/convex-server"
import { isValidCryptoAddressAny } from "@/lib/crypto-address"
import { MIN_CREDITS } from "@/lib/checkout"
import { getTokenPackage } from "@/lib/token-packages"
import { plans, type PlanId } from "@/lib/plans"
import type { FormState } from "@/actions/auth"

// The customer picks the asset on the Shieldz hosted checkout. We only record
// that they paid in crypto for the fixed fiat amount.
const PAY_CRYPTO = "any"

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
  const mode = String(formData.get("mode") ?? "")
  const walletAddress = String(formData.get("wallet") ?? "").trim()
  if (!isValidCryptoAddressAny(walletAddress)) {
    return {
      errors: {
        wallet: ["Enter a valid BTC, ETH, or SOL wallet address for refunds/records."],
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

  // The Convex mutation re-checks the duplicate-subscription guard server-side
  // and records the order. The order code doubles as the Shieldz idempotency
  // key when the invoice is created.
  try {
    const result = await fetchMutation(
      api.checkouts.createCheckout,
      {
        orderCode: randomUUID(),
        item,
        mode,
        crypto: PAY_CRYPTO,
        amountUsd,
        credits,
        ...(plan ? { plan } : {}),
        ...(intervalDays !== null ? { intervalDays } : {}),
        walletAddress,
      },
      { token: await getAuthToken() }
    )
    return { orderId: result.orderId }
  } catch (err) {
    return { errors: {}, message: convexErrorMessage(err) }
  }
}