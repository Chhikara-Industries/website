import { NextRequest, NextResponse } from "next/server"

import { createShieldzInvoice } from "@/lib/shieldz"
import { shieldzConfigured } from "@/lib/env"
import { createClient } from "@/lib/supabase/server"
import { createServiceClient } from "@/lib/supabase/service"

const CHECKOUT_TTL_SECONDS = 30 * 60

export async function POST(request: NextRequest) {
  if (!shieldzConfigured()) {
    return NextResponse.json(
      { error: "Payments aren't set up yet on the server." },
      { status: 400 }
    )
  }

  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) {
    return NextResponse.json({ error: "You must be signed in." }, { status: 401 })
  }

  const body = (await request.json().catch(() => ({}))) as Record<string, unknown>
  const orderId = typeof body.orderId === "string" ? body.orderId.trim() : ""
  if (!orderId) {
    return NextResponse.json({ error: "Missing order id." }, { status: 400 })
  }

  const service = createServiceClient()
  const client = service ?? supabase
  const { data, error } = await client
    .from("checkouts")
    .select(
      "id, user_id, item, mode, crypto, amount_usd, status, wallet_address, shieldz_invoice_id"
    )
    .eq("id", orderId)
    .maybeSingle()
  if (error || !data || data.user_id !== user.id) {
    return NextResponse.json({ error: "Order not found." }, { status: 404 })
  }
  if (data.status !== "pending" && data.status !== "awaiting_payment") {
    return NextResponse.json({ error: "This order is already closed." }, { status: 409 })
  }

  // The amount is always resolved server-side from the stored row — never from
  // the client. Cents rounding is applied on our side.
  const amountCents = Math.round(Number(data.amount_usd ?? 0) * 100)
  if (!(amountCents > 0)) {
    return NextResponse.json({ error: "Invalid order amount." }, { status: 400 })
  }

  // Idempotent: the order id doubles as the Shieldz idempotency key, so a
  // retry returns the same invoice instead of creating a second one.
  let invoice
  try {
    invoice = await createShieldzInvoice({
      amountUsdCents: amountCents,
      memo: data.item ?? "Chhikara Industries payment",
      customerEmail: user.email ?? undefined,
      idempotencyKey: orderId,
      expiresInSeconds: CHECKOUT_TTL_SECONDS,
      metadata: {
        order_id: orderId,
        mode: data.mode,
        crypto: data.crypto,
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

  const { error: updateError } = await client
    .from("checkouts")
    .update({
      status: "awaiting_payment",
      shieldz_invoice_id: invoice.id,
      shieldz_status: invoice.status,
      payment_url: invoice.pay_url,
    })
    .eq("id", orderId)
  if (updateError) {
    console.error("[shieldz] checkout update failed", {
      orderId,
      error: updateError.message,
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