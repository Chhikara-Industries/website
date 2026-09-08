import "server-only"

import crypto from "node:crypto"

import {
  getShieldzApiKey,
  getShieldzApiUrl,
  getShieldzSettlementAsset,
  getShieldzSettlementChain,
} from "@/lib/env"

const TOLERANCE_SECONDS = 300

export class ShieldzError extends Error {
  readonly status?: number
  constructor(message: string, status?: number) {
    super(message)
    this.name = "ShieldzError"
    this.status = status
  }
}

export type ShieldzInvoice = {
  id: string
  status: string
  pay_url: string
  settlement?: { chain?: string; asset?: string }
  amount_usd_cents?: number
}

export type ShieldzEvent =
  | { type: "invoice.paid"; data: { invoice: ShieldzInvoice } }
  | { type: "invoice.failed"; data: { invoice: ShieldzInvoice } }
  | { type: "invoice.expired"; data: { invoice: ShieldzInvoice } }

// HMAC-SHA256 over `${timestamp}.${rawBody}` with the webhook secret. The
// header is `X-Shieldz-Signature: t=<unix>,v1=<hex>`. Reject events older than
// the tolerance window (replay guard) and accept any v1= (key rotation).
export function verifyShieldzSignature(
  rawBody: string,
  header: string,
  secret: string
): boolean {
  if (!header || !secret) return false
  const parts = header.split(",")
  const t = parts.find((p) => p.startsWith("t="))?.slice(2)
  if (!t || !/^\d+$/.test(t)) return false
  if (Math.abs(Math.floor(Date.now() / 1000) - Number(t)) > TOLERANCE_SECONDS) {
    return false
  }
  const expected = crypto
    .createHmac("sha256", secret)
    .update(`${t}.${rawBody}`)
    .digest("hex")
  const signatures = parts
    .filter((p) => p.startsWith("v1="))
    .map((p) => p.slice(3))
    .filter((s) => /^[0-9a-f]+$/i.test(s) && s.length === expected.length)
  return signatures.some((s) =>
    crypto.timingSafeEqual(Buffer.from(s), Buffer.from(expected))
  )
}

function apiHeaders(): Record<string, string> {
  return {
    Authorization: `Bearer ${getShieldzApiKey()}`,
    "Content-Type": "application/json",
  }
}

// Creates a Shieldz invoice. The idempotency key is the internal order id, so
// retries return the same invoice rather than duplicating one.
export async function createShieldzInvoice({
  amountUsdCents,
  memo,
  customerEmail,
  metadata,
  idempotencyKey,
  expiresInSeconds,
}: {
  amountUsdCents: number
  memo: string
  customerEmail?: string
  metadata?: Record<string, unknown>
  idempotencyKey: string
  expiresInSeconds?: number
}): Promise<ShieldzInvoice> {
  const body: Record<string, unknown> = {
    amount_usd_cents: amountUsdCents,
    memo,
    idempotency_key: idempotencyKey,
    settlement: {
      chain: getShieldzSettlementChain(),
      asset: getShieldzSettlementAsset(),
    },
  }
  if (customerEmail) body["customer_email"] = customerEmail
  if (metadata) body["metadata"] = metadata
  if (expiresInSeconds) body["expires_in_seconds"] = expiresInSeconds

  const res = await fetch(`${getShieldzApiUrl()}/api/v1/invoices`, {
    method: "POST",
    headers: apiHeaders(),
    body: JSON.stringify(body),
  })
  const payload = (await res.json().catch(() => ({}))) as Record<string, unknown>

  if (!res.ok) {
    const message =
      typeof payload.message === "string"
        ? payload.message
        : typeof payload.error === "string"
          ? payload.error
          : "unknown error"
    throw new ShieldzError(message, res.status)
  }

  const id = typeof payload.id === "string" ? payload.id : ""
  const payUrl = typeof payload.pay_url === "string" ? payload.pay_url : ""
  const status = typeof payload.status === "string" ? payload.status : ""
  if (!id || !payUrl) {
    throw new ShieldzError("Shieldz returned an incomplete invoice.")
  }

  return {
    id,
    status,
    pay_url: payUrl,
    ...(typeof payload.amount_usd_cents === "number"
      ? { amount_usd_cents: payload.amount_usd_cents }
      : {}),
  }
}
