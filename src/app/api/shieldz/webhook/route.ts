import { NextResponse } from "next/server"

import {
  verifyShieldzSignature,
  type ShieldzEvent,
  type ShieldzInvoice,
} from "@/lib/shieldz"
import { shieldzWebhookConfigured } from "@/lib/env"
import { createServiceClient } from "@/lib/supabase/service"
import { applyNonPaid, applyPaid } from "@/lib/payments"

export async function POST(request: Request) {
  const rawBody = await request.text()
  const signature = request.headers.get("x-shieldz-signature") ?? ""
  const deliveryId = request.headers.get("x-shieldz-delivery") ?? ""

  if (!shieldzWebhookConfigured()) return NextResponse.json({ ok: true }, { status: 200 })
  const supabase = createServiceClient()
  if (!supabase) return NextResponse.json({ ok: true }, { status: 200 })

  // Verify against the RAW body and reject anything stale. This must happen
  // before the payload is parsed or trusted.
  const secret = process.env.SHIELDZ_WEBHOOK_SECRET ?? ""
  if (!verifyShieldzSignature(rawBody, signature, secret)) {
    console.warn("[shieldz-webhook] invalid signature")
    return NextResponse.json({ error: "Invalid signature" }, { status: 401 })
  }

  let event: ShieldzEvent
  try {
    event = JSON.parse(rawBody) as ShieldzEvent
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 })
  }
  if (!event?.type || !event?.data?.invoice?.id) {
    return NextResponse.json({ error: "Unrecognized event" }, { status: 400 })
  }

  try {
    // Replays of an already-handled delivery are safe to ack without work.
    if (deliveryId && (await isHandled(supabase, deliveryId))) {
      return NextResponse.json({ ok: true }, { status: 200 })
    }

    const checkout = await findCheckout(supabase, event.data.invoice)
    if (!checkout) {
      console.warn("[shieldz-webhook] no checkout for invoice", {
        invoiceId: event.data.invoice.id,
      })
      // Record so a legitimate retry doesn't reprocess; fulfillment is only
      // driven by a matching checkout row anyway.
      await recordDelivery(supabase, deliveryId, event, rawBody, false)
      return NextResponse.json({ ok: true }, { status: 200 })
    }

    await handleEvent(supabase, checkout, event)
    await recordDelivery(supabase, deliveryId, event, rawBody, true)
  } catch (e) {
    // Signal failure so Shieldz retries this delivery.
    console.error("[shieldz-webhook] processing error", {
      invoiceId: event.data.invoice.id,
      error: e instanceof Error ? e.message : "unknown",
    })
    return NextResponse.json({ error: "Processing failed" }, { status: 500 })
  }

  return NextResponse.json({ ok: true }, { status: 200 })
}

async function isHandled(
  supabase: NonNullable<ReturnType<typeof createServiceClient>>,
  deliveryId: string
): Promise<boolean> {
  const { data, error } = await supabase
    .from("shieldz_webhook_deliveries")
    .select("delivery_id")
    .eq("delivery_id", deliveryId)
    .maybeSingle()
  return !error && data != null
}

async function recordDelivery(
  supabase: NonNullable<ReturnType<typeof createServiceClient>>,
  deliveryId: string,
  event: ShieldzEvent,
  rawBody: string,
  handled: boolean
) {
  if (!deliveryId) return
  const { error } = await supabase.from("shieldz_webhook_deliveries").insert({
    delivery_id: deliveryId,
    event_type: event.type,
    invoice_id: event.data.invoice.id,
    raw_body: rawBody,
    handled,
  })
  // 23505 = unique violation: a concurrent or earlier delivery already won.
  if (error && error.code !== "23505") {
    console.error("[shieldz-webhook] delivery record failed", {
      deliveryId,
      error: error.message,
    })
  }
}

type CheckoutLite = {
  id: string
  user_id: string
  mode: string
  credits: number
  plan: string | null
  amount_usd: number
}

async function findCheckout(
  supabase: NonNullable<ReturnType<typeof createServiceClient>>,
  invoice: ShieldzInvoice
): Promise<CheckoutLite | null> {
  const { data, error } = await supabase
    .from("checkouts")
    .select("id, user_id, mode, credits, plan, amount_usd")
    .eq("shieldz_invoice_id", invoice.id)
    .maybeSingle()
  if (error || !data) return null
  return {
    id: data.id,
    user_id: data.user_id,
    mode: data.mode,
    credits: Number(data.credits ?? 0),
    plan: data.plan,
    amount_usd: Number(data.amount_usd ?? 0),
  }
}

async function handleEvent(
  supabase: NonNullable<ReturnType<typeof createServiceClient>>,
  checkout: CheckoutLite,
  event: ShieldzEvent
) {
  switch (event.type) {
    case "invoice.paid":
      // Authoritative signal. The RPC grants credits / activates the plan and
      // is idempotent, so re-deliveries are harmless.
      await applyPaid(supabase, checkout, event.data.invoice.id)
      break
    case "invoice.failed":
      await applyNonPaid(supabase, checkout, "failed")
      break
    case "invoice.expired":
      await applyNonPaid(supabase, checkout, "expired")
      break
  }
}