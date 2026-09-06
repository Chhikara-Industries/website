import "server-only"

import crypto from "node:crypto"

import {
  getNowPaymentsApiKey,
  getNowPaymentsEmail,
  getNowPaymentsIpnSecret,
  getNowPaymentsJwtToken,
  getNowPaymentsPassword,
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
// Bearer JWT auth for the /v1/subscriptions* endpoints
//
// NOWPayments mints these JWTs via POST /v1/auth (merchant dashboard email +
// password) and they only live ~5 minutes. We obtain one on demand, cache it
// in memory while it is valid, and refresh it when it expires. If merchant
// credentials are not configured, a static NOWPAYMENTS_JWT_TOKEN is used as a
// fallback (it is still subject to the same 5-minute expiry).
// ---------------------------------------------------------------------------
let cachedJwt = ""
let cachedJwtExpiryMs = 0
const JWT_FRESHNESS_MS = 30_000 // stay clear of the expiry boundary

function jwtPayload(token: string): { exp?: number; iat?: number } {
  try {
    const part = token.split(".")[1]
    if (!part) return {}
    const base64 = part.replace(/-/g, "+").replace(/_/g, "/")
    const json = Buffer.from(
      base64 + "=".repeat((4 - (base64.length % 4)) % 4),
      "base64"
    ).toString("utf-8")
    return JSON.parse(json) as { exp?: number; iat?: number }
  } catch {
    return {}
  }
}

function staticTokenUsable(token: string): boolean {
  const { exp, iat } = jwtPayload(token)
  const now = Date.now()
  if (exp && now >= exp * 1000 - JWT_FRESHNESS_MS) return false
  if (iat && now >= iat * 1000 + 290_000) return false
  return true
}

async function getAuthJwt(): Promise<string> {
  if (cachedJwt && cachedJwtExpiryMs > Date.now() + JWT_FRESHNESS_MS) {
    return cachedJwt
  }

  const email = getNowPaymentsEmail()
  const password = getNowPaymentsPassword()

  // Preferred path: mint a fresh token from merchant credentials.
  if (email && password) {
    const res = await fetch(`${API_BASE}/auth`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
    })
    const body = (await res.json().catch(() => ({}))) as Record<string, unknown>
    if (!res.ok || typeof body.token !== "string" || !body.token) {
      const message =
        typeof body.message === "string" ? body.message : "unknown error"
      throw new NowPaymentsError(
        `NOWPayments authentication failed: ${message}`,
        res.status
      )
    }
    cachedJwt = body.token
    // NOWPayments JWTs live 300s from issuance. Prefer our own wall-clock
    // deadline over the token's exp claim: if this server's clock is skewed
    // relative to NOWPayments', exp is not a reliable local timestamp, but the
    // absolute lifetime from when WE minted the token is always correct.
    const expMs = jwtPayload(body.token).exp
      ? jwtPayload(body.token).exp! * 1000
      : Infinity
    cachedJwtExpiryMs = Math.min(Date.now() + 290_000, expMs)
    return cachedJwt
  }

  // Fallback: a static token from the environment.
  const staticToken = getNowPaymentsJwtToken()
  if (staticToken) {
    if (!staticTokenUsable(staticToken)) {
      throw new NowPaymentsError(
        "The static NOWPAYMENTS_JWT_TOKEN has expired (tokens only live ~5 minutes). Configure NOWPAYMENTS_EMAIL and NOWPAYMENTS_PASSWORD for automatic refresh."
      )
    }
    cachedJwt = staticToken
    cachedJwtExpiryMs = (jwtPayload(staticToken).exp ?? Date.now() / 1000 + 290) * 1000
    return staticToken
  }

  throw new NowPaymentsError(
    "NOWPayments subscriptions require credentials: set NOWPAYMENTS_EMAIL/NOWPAYMENTS_PASSWORD or a static NOWPAYMENTS_JWT_TOKEN."
  )
}

// ---------------------------------------------------------------------------
// API helpers
// ---------------------------------------------------------------------------
async function apiFetch(
  path: string,
  init: RequestInit = {},
  options: { bearerAuth?: boolean; retried?: boolean } = {}
): Promise<{
  status: number
  body: Record<string, unknown>
}> {
  const apiKey = getNowPaymentsApiKey()
  const headers: Record<string, string> = {
    "x-api-key": apiKey,
    "Content-Type": "application/json",
    ...((init.headers as Record<string, string>) ?? {}),
  }
  // The /v1/subscriptions* endpoints require BOTH x-api-key and a Bearer JWT.
  if (options.bearerAuth) {
    headers["Authorization"] = `Bearer ${await getAuthJwt()}`
  }
  const res = await fetch(`${API_BASE}${path}`, {
    ...init,
    headers,
  })

  const body = (await res.json().catch(() => ({}))) as Record<string, unknown>

  if (!res.ok) {
    // A bearer endpoint can 401 when a JWT expired mid-flight (a cached token
    // from before a deploy, or another instance's stale copy). Drop the cache
    // and retry once with a fresh token before giving up.
    if (res.status === 401 && options.bearerAuth && !options.retried) {
      cachedJwt = ""
      cachedJwtExpiryMs = 0
      return apiFetch(path, init, { ...options, retried: true })
    }
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
      ...(selectedCrypto
        ? { pay_currency: selectedCrypto }
        : {}),
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
// Direct on-chain payment (no NOWPayments-hosted page)
//
// Creates a real deposit address + exact crypto amount that we render in our
// own checkout UI. The customer pays from their wallet; IPNs arrive exactly
// like the hosted-invoice flow. Fixed rate locks the settled fiat amount.
// ---------------------------------------------------------------------------
export type CreateDirectPaymentResult = {
  paymentId: string
  payCurrency: string
  payAmount: number
  payAddress: string
  purchaseId?: string
}

export async function createDirectPayment({
  amountUsd,
  orderId,
  orderDescription,
  selectedCrypto,
}: {
  amountUsd: number
  orderId: string
  orderDescription: string
  selectedCrypto: NowPaymentsCrypto
}): Promise<CreateDirectPaymentResult> {
  const res = await apiFetch("/payment", {
    method: "POST",
    body: JSON.stringify({
      price_amount: amountUsd,
      price_currency: "usd",
      pay_currency: selectedCrypto,
      order_id: orderId,
      order_description: orderDescription,
      ipn_callback_url: `${SITE_URL}/api/webhooks/nowpayments`,
      success_url: `${SITE_URL}/dashboard/billing?status=success&order_id=${orderId}`,
      cancel_url: `${SITE_URL}/dashboard/billing?status=cancelled&order_id=${orderId}`,
      is_fixed_rate: true,
    }),
  })

  const paymentId = res.body.payment_id
  const payAddress = typeof res.body.pay_address === "string" ? res.body.pay_address : ""
  if (paymentId == null || !payAddress) {
    throw new NowPaymentsError(
      "NOWPayments returned an incomplete payment address."
    )
  }

  return {
    paymentId: String(paymentId),
    payCurrency: String(res.body.pay_currency ?? selectedCrypto),
    payAmount: Number(res.body.pay_amount ?? 0),
    payAddress,
    purchaseId:
      res.body.purchase_id != null ? String(res.body.purchase_id) : undefined,
  }
}

// ---------------------------------------------------------------------------
// Subscriptions (recurring payments). Plans are configured ONCE and reused;
// they are never re-created per checkout. The /v1/subscriptions* endpoints
// authenticate with x-api-key AND a Bearer JWT.
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
  }, { bearerAuth: true })

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
  const { body } = await apiFetch("/subscriptions/plans", { method: "GET" }, { bearerAuth: true })
  const raw = Array.isArray(body.result)
    ? body.result
    : Array.isArray(body)
      ? body
: body.result && typeof body.result === "object"
          ? [body.result]
          : []
  return raw.map((item) => ({
    id: String((item as Record<string, unknown>).id),
    title: String((item as Record<string, unknown>).title ?? ""),
    interval_day: Number((item as Record<string, unknown>).interval_day ?? 0),
    amount: Number((item as Record<string, unknown>).amount ?? 0),
    currency: String((item as Record<string, unknown>).currency ?? "usd"),
  }))
}

export type EmailSubscriptionResult = {
  subscriptionId: string
  isActive: boolean
  status: string
  email?: string
}

// Email subscription: NOWPayments emails the customer a payment link for the
// plan interval. Only meaningful when the merchant has recurring payments
// enabled. Verified response shape: { result: [ { id, subscription_plan_id,
// is_active, status (WAITING_PAY while unpaid), subscriber } ] }.
export async function createEmailSubscription({
  planId,
  email,
}: {
  planId: string
  email: string
}): Promise<EmailSubscriptionResult> {
  const hasCredentials =
    getNowPaymentsEmail() && getNowPaymentsPassword()
  if (!getNowPaymentsApiKey() || (!hasCredentials && !getNowPaymentsJwtToken())) {
    throw new NowPaymentsError(
      "NOWPayments subscriptions require credentials (NOWPAYMENTS_EMAIL/NOWPAYMENTS_PASSWORD) or a JWT token (NOWPAYMENTS_JWT_TOKEN)."
    )
  }
  const { body } = await apiFetch("/subscriptions", {
    method: "POST",
    body: JSON.stringify({ subscription_plan_id: planId, email }),
  }, { bearerAuth: true })

  const list = Array.isArray(body.result)
    ? body.result
    : Array.isArray(body)
      ? body
      : []
  const item = (list[0] ?? null) as Record<string, unknown> | null
  if (!item || item.id == null) {
    throw new NowPaymentsError("NOWPayments returned an incomplete subscription.")
  }
  const subscriber = (item.subscriber ?? null) as Record<string, unknown> | null
  return {
    subscriptionId: String(item.id),
    isActive: Boolean(item.is_active),
    status: String(item.status ?? ""),
    email:
      subscriber && typeof subscriber.email === "string"
        ? subscriber.email
        : undefined,
  }
}

export type NowPaymentsSubscription = {
  id: string
  subscriptionPlanId?: string
  isActive: boolean
  status: string
  currency?: string
  amount?: number
  intervalDay?: number
  email?: string
  payment?: Partial<NowPaymentsPayment>
}

export async function getSubscription(
  subscriptionId: string
): Promise<NowPaymentsSubscription> {
  const { body } = await apiFetch(
    `/subscriptions/${subscriptionId}`,
    { method: "GET" },
    { bearerAuth: true }
  )
  const item = (Array.isArray(body.result) ? body.result[0] : body.result) as
    | Record<string, unknown>
    | undefined
  if (!item || item.id == null) {
    throw new NowPaymentsError("NOWPayments returned an incomplete subscription.")
  }
  const subscriber = (item.subscriber ?? null) as Record<string, unknown> | null
  const payment = (item.payment ?? null) as Partial<NowPaymentsPayment> | null
  return {
    id: String(item.id),
    subscriptionPlanId:
      item.subscription_plan_id != null ? String(item.subscription_plan_id) : undefined,
    isActive: Boolean(item.is_active),
    status: String(item.status ?? ""),
    currency: typeof item.currency === "string" ? item.currency : undefined,
    amount: item.amount != null ? Number(item.amount) : undefined,
    intervalDay: item.interval_day != null ? Number(item.interval_day) : undefined,
    email:
      subscriber && typeof subscriber.email === "string"
        ? subscriber.email
        : undefined,
    payment: payment ?? undefined,
  }
}

export async function getSubscriptionPlan(planId: string): Promise<{
  id: string
  title: string
  interval_day: number
  amount: number
  currency: string
}> {
  const { body } = await apiFetch(
    `/subscriptions/plans/${planId}`,
    { method: "GET" },
    { bearerAuth: true }
  )
  const item = (Array.isArray(body.result) ? body.result[0] : body.result) as
    | Record<string, unknown>
    | undefined
  if (!item || item.id == null) {
    throw new NowPaymentsError("NOWPayments returned an incomplete subscription plan.")
  }
  return {
    id: String(item.id),
    title: String(item.title ?? ""),
    interval_day: Number(item.interval_day ?? 0),
    amount: Number(item.amount ?? 0),
    currency: String(item.currency ?? "usd"),
  }
}

// Config-level NOWPayments plan ids for Pro / Ultimate (see env.ts).
export function nowPaymentsPlanIdFor(planId: "pro" | "ultimate"): string {
  return getNowPaymentsPlanId(planId)
}