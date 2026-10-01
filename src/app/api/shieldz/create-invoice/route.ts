import { NextRequest, NextResponse } from "next/server"
import { fetchMutation, fetchQuery } from "convex/nextjs"

import { api } from "@/convex/_generated/api"
import { createShieldzInvoice } from "@/lib/shieldz"
import { shieldzConfigured } from "@/lib/env"
import { getAuthToken } from "@/lib/convex-server"

export const dynamic = "force-dynamic"

const CHECKOUT_TTL_SECONDS = 30 * 60

export async function POST(request: NextRequest) {
  if (!shieldzConfigured()) {
    return NextResponse.json(
      { error: "Payments aren't set up yet on the server." },
      { status: 400 }
    )
  }

  const body = (await request.json().catch(() => ({}))) as Record<string, unknown>
  const orderId = typeof body.orderId === "string" ? body.orderId.trim() : ""
  if (!orderId) {
    return NextResponse.json({ error: "Missing order id." }, { status: 400 })
  }

  const token = await getAuthToken()
  if (!token) {
    return NextResponse.json({ error: "You must be signed in." }, { status: 401 })
  }

  let checkout
  try {
    checkout = await fetchQuery(api.checkouts.getCheckout, { orderCode: orderId }, { token })
  } catch {
    return NextResponse.json({ error: "Order not found." }, { status: 404 })
  }
  if (!checkout) {
    return NextResponse.json({ error: "Order not found." }, { status: 404 })
  }
  if (checkout.status !== "pending" && checkout.status !== "awaiting_payment") {
    return NextResponse.json({ error: "This order is already closed." }, { status: 409 })
  }

  const me = await fetchQuery(api.users.me, {}, { token })

  // The amount is always resolved server-side from the stored row — never from
  // the client. Cents rounding is applied on our side.
  const amountCents = Math.round(Number(checkout.amountUsd ?? 0) * 100)
  if (!(amountCents > 0)) {
    return NextResponse.json({ error: "Invalid order amount." }, { status: 400 })
  }

  // Idempotent: the order id doubles as the Shieldz idempotency key, so a
  // retry returns the same invoice instead of creating a second one.
  let invoice
  try {
    invoice = await createShieldzInvoice({
      amountUsdCents: amountCents,
      memo: checkout.item ?? "Chhikara Industries payment",
      customerEmail: me?.email,
      idempotencyKey: orderId,
      expiresInSeconds: CHECKOUT_TTL_SECONDS,
      metadata: {
        order_id: orderId,
        mode: checkout.mode,
      },
    })
  } catch (e) {
    console.error("[shieldz] invoice creation failed", {
      orderId,
      error: e instanceof Error ? e.message : "unknown",
    })
    return NextResponse.json(
      { error: "Could not start the checkout. Please try again." },
      { status: 502 }
    )
  }

  try {
    await fetchMutation(
      api.checkouts.linkShieldzInvoice,
      {
        orderCode: orderId,
        invoiceId: invoice.id,
        shieldzStatus: invoice.status,
        paymentUrl: invoice.pay_url,
        status: "awaiting_payment",
      },
      { token }
    )
  } catch (e) {
    console.error("[shieldz] checkout update failed", {
      orderId,
      error: e instanceof Error ? e.message : "unknown",
    })
    return NextResponse.json(
      { error: "Checkout could not be recorded. Please try again." },
      { status: 502 }
    )
  }

  return NextResponse.json(
    { orderId, invoiceId: invoice.id, payUrl: invoice.pay_url },
    { status: 200 }
  )
}