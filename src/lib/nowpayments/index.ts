import "server-only"

import crypto from "node:crypto"

import {
  getNowPaymentsApiKey,
  getNowPaymentsIpnSecret,
  getNowPaymentsPlanId,
  SITE_URL,
} from "@/lib/env"

const API_BASE = "https://api.nowpayments.io/v1"

export type NowPaymentsCrypto = "btc" | "eth" | "sol"

// ---------------------------------------------------------------------------
// Errors
// ---------------------------------------------------------------------------
export class NowPaymentsError extends Error {
  readonly status?: number
  constructor(message: string, status?: number) {
    super(message)
    this.name = "NowPaymentsError"
    this.status = status
  }
}

// ---------------------------------------------------------------------------
// Types (current NOWPayments API shapes)
// ---------------------------------------------------------------------------
export type NowPaymentsPayment = {
  payment_id: number
  parent_payment_id?: number
  invoice_id?: number | null
  payment_status: string
  pay_address?: string
  price_amount: number
  price_currency: string
  pay_amount?: number
  actually_paid?: number
  actually_paid_at_fiat?: number
  pay_currency?: string
  order_id?: string
  order_description?: string
  purchase_id: string | number
  outcome_amount?: number
  outcome_currency?: string
  fee?: { currency: string; depositFee: number; withdrawalFee: number; serviceFee: number }
  subscription_id?: string | number
  plan_id?: string | number
  subscription_plan_id?: string | number
  created_at?: string
  updated_at?: string
}

export type CreateInvoiceResult = {
  invoiceId: string
  invoiceUrl: string
  purchaseId?: string
}

// ---------------------------------------------------------------------------
// IPN signature verification
//
// Current official NOWPayments behaviour: HMAC-SHA512 over the JSON body with
// ALL keys sorted alphabetically (recursively), signed with the IPN secret.
// The result (hex) must match the x-nowpayments-sig header.
// ---------------------------------------------------------------------------
function sortDeep(value: unknown): unknown {
  if (Array.isArray(value)) {
    return value.map((item) => sortDeep(item))
  }
  if (value !== null && typeof value === "object") {
    const result: Record<string, unknown> = {}
    for (const key of Object.keys(value as Record<string, unknown>).sort()) {
      result[key] = sortDeep((value as Record<string, unknown>)[key])
    }
    return result
  }
  return value
}

export function computeIpnSignature(payload: unknown): string {
  const sorted = JSON.stringify(sortDeep(payload))
  const secret = getNowPaymentsIpnSecret()
  return crypto.createHmac("sha512", secret).update(sorted).digest("hex")
}

export function verifyIpnSignature(payload: unknown, signature: string): boolean {
  if (!getNowPaymentsIpnSecret()) return false
  if (!signature) return false
  const expected = computeIpnSignature(payload)
  if (!/^[0-9a-f]{128}$/i.test(signature)) return false
  const bufA = Buffer.from(expected, "hex")
  const bufB = Buffer.from(signature.toLowerCase(), "hex")
  if (bufA.length !== bufB.length) return false
  return crypto.timingSafeEqual(bufA, bufB)
}

// ---------------------------------------------------------------------------
// API helpers
// ---------------------------------------------------------------------------
async function apiFetch(
  path: string,
  init: RequestInit = {}
): Promise<{
  status: number
  body: Record<string, unknown>
}> {
  const apiKey = getNowPaymentsApiKey()
  const res = await fetch(`${API_BASE}${path}`, {
    ...init,
    headers: {
      "x-api-key": apiKey,
      "Content-Type": "application/json",
      ...(init.headers ?? {}),
    },
  })

  const body = (await res.json().catch(() => ({}))) as Record<string, unknown>

  if (!res.ok) {
    const message =
      typeof body.message === "string"
        ? body.message
        : body.error && typeof body.error === "string"
          ? body.error
          : "unknown error"
    throw new NowPaymentsError(message, res.status)
  }

  return { status: res.status, body }
}

// Hosted checkout via the Invoice API. Returns a link to the NOWPayments
// payment page; the payment id only exists after the customer engages it.
export async function createInvoice({
  amountUsd,
  orderId,
  orderDescription,
  selectedCrypto,
}: {
  amountUsd: number
  orderId: string
  orderDescription: string
  selectedCrypto?: NowPaymentsCrypto | null
}): Promise<CreateInvoiceResult> {
  const res = await apiFetch("/invoice", {
    method: "POST",
    body: JSON.stringify({
      price_amount: amountUsd,
      price_currency: "usd",
      pay_currency: selectedCrypto ?? null,
      order_id: orderId,
      order_description: orderDescription,
      ipn_callback_url: `${SITE_URL}/api/webhooks/nowpayments`,
      success_url: `${SITE_URL}/dashboard/billing?status=success&order_id=${orderId}`,
      cancel_url: `${SITE_URL}/dashboard/billing?status=cancelled&order_id=${orderId}`,
      is_fee_paid_by_user: true,
    }),
  })

  const invoiceId =
    typeof res.body.id === "number"
      ? String(res.body.id)
      : typeof res.body.id === "string"
        ? res.body.id
        : ""
  const invoiceUrl =
    typeof res.body.invoice_url === "string" ? res.body.invoice_url : ""
  const purchaseId =
    res.body.purchase_id != null ? String(res.body.purchase_id) : undefined

  if (!invoiceId || !invoiceUrl) {
    throw new NowPaymentsError(
      "NOWPayments returned an incomplete invoice."
    )
  }

  return { invoiceId, invoiceUrl, purchaseId }
}

// Canonical payment status. Used to cross-check IPN data against
// NOWPayments before fulfilling an order.
export async function getPaymentStatus(
  paymentId: string | number
): Promise<NowPaymentsPayment> {
  const { body, status } = await apiFetch(`/payment/${paymentId}`, {
    method: "GET",
  })
  if (status !== 200 || typeof body.payment_status !== "string") {
    throw new NowPaymentsError("NOWPayments returned an invalid payment status.")
  }
  return body as unknown as NowPaymentsPayment
}

// ---------------------------------------------------------------------------
// Subscriptions (recurring payments). Plans are configured ONCE and reused;
// they are never re-created per checkout.
// ---------------------------------------------------------------------------
export async function createSubscriptionPlan({
  title,
  intervalDays,
  amountUsd,
  currency = "usd",
}: {
  title: string
  intervalDays: number
  amountUsd: number
  currency?: string
}): Promise<{ id: string; title: string; interval_day: number; amount: number; currency: string }> {
  const { body } = await apiFetch("/subscriptions/plans", {
    method: "POST",
    body: JSON.stringify({
      title,
      interval_day: intervalDays,
      amount: amountUsd,
      currency,
      ipn_callback_url: `${SITE_URL}/api/webhooks/nowpayments`,
      success_url: `${SITE_URL}/dashboard/billing?status=success`,
      cancel_url: `${SITE_URL}/dashboard/billing?status=cancelled`,
      partially_paid_url: `${SITE_URL}/dashboard/billing?status=partially_paid`,
    }),
  })

  if (body.id == null) {
    throw new NowPaymentsError("NOWPayments returned an incomplete subscription plan.")
  }

  return {
    id: String(body.id),
    title: String(body.title ?? title),
    interval_day: Number(body.interval_day ?? intervalDays),
    amount: Number(body.amount ?? amountUsd),
    currency: String(body.currency ?? currency),
  }
}

export async function getSubscriptionPlans(): Promise<
  { id: string; title: string; interval_day: number; amount: number; currency: string }[]
> {
  const { body } = await apiFetch("/subscriptions/plans", { method: "GET" })
  const raw = body.result ?? body.data ?? body
  if (!Array.isArray(raw)) return []
  return raw.map((item) => ({
    id: String((item as Record<string, unknown>).id),
    title: String((item as Record<string, unknown>).title ?? ""),
    interval_day: Number((item as Record<string, unknown>).interval_day ?? 0),
    amount: Number((item as Record<string, unknown>).amount ?? 0),
    currency: String((item as Record<string, unknown>).currency ?? "usd"),
  }))
}

// Email subscription: NOWPayments invoices the user's email on the interval.
// Only meaningful when the merchant has recurring payments enabled.
export async function createEmailSubscription({
  planId,
  email,
  orderId,
}: {
  planId: string
  email: string
  orderId?: string
}): Promise<{ subscriptionId: string }> {
  const { body } = await apiFetch("/subscriptions", {
    method: "POST",
    body: JSON.stringify({
      subscription_plan_id: planId,
      email,
      order_id: orderId,
    }),
  })
  if (body.id == null) {
    throw new NowPaymentsError("NOWPayments returned an incomplete subscription.")
  }
  return { subscriptionId: String(body.id) }
}

// Config-level NOWPayments plan ids for Pro / Ultimate (see env.ts).
export function nowPaymentsPlanIdFor(planId: "pro" | "ultimate"): string {
  return getNowPaymentsPlanId(planId)
}