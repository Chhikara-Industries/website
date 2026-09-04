import "server-only"

import crypto from "node:crypto"

import { getNowPaymentsApiKey, getNowPaymentsIpnSecret } from "@/lib/env"

const API_BASE = "https://api.nowpayments.io/v1"

export type NowPaymentsCrypto = "btc" | "eth" | "sol"

type CreateInvoiceResponse = {
  id: number
  invoice_url: string
  price_amount: number
  price_currency: string
  pay_currency: string | null
  order_id: string
  order_description: string
}

export async function createInvoice({
  amountUsd,
  orderId,
  orderDescription,
}: {
  amountUsd: number
  orderId: string
  orderDescription: string
}): Promise<{ id: number; invoiceUrl: string }> {
  const apiKey = getNowPaymentsApiKey()
  const siteUrl =
    process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000"

  const res = await fetch(`${API_BASE}/invoice`, {
    method: "POST",
    headers: {
      "x-api-key": apiKey,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      price_amount: amountUsd,
      price_currency: "usd",
      pay_currency: null,
      order_id: orderId,
      order_description: orderDescription,
      ipn_callback_url: `${siteUrl}/api/webhooks/nowpayments`,
      success_url: `${siteUrl}/dashboard/billing?status=success`,
      cancel_url: `${siteUrl}/dashboard/billing?status=cancelled`,
    }),
  })

  const body = await res.json().catch(() => ({})) as Partial<CreateInvoiceResponse>

  if (!res.ok) {
    throw new Error(
      `NOWPayments invoice failed (${res.status}): ${
        (body as { message?: string }).message ?? "unknown error"
      }`
    )
  }

  if (!body.id || !body.invoice_url) {
    throw new Error("NOWPayments returned an incomplete invoice.")
  }

  return { id: body.id, invoiceUrl: body.invoice_url }
}

export function verifyIpn(payload: string, signature: string): boolean {
  const secret = getNowPaymentsIpnSecret()
  if (!secret) return false
  const expected = crypto
    .createHmac("sha512", secret)
    .update(payload)
    .digest("hex")
  const got = signature.toLowerCase()
  return timingSafeEqualHex(expected, got)
}

function timingSafeEqualHex(a: string, b: string) {
  const bufA = Buffer.from(a, "hex")
  const bufB = Buffer.from(b, "hex")
  if (bufA.length !== bufB.length) return false
  return crypto.timingSafeEqual(bufA, bufB)
}
