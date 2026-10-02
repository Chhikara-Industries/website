import { NextResponse } from "next/server"

import {
  verifyShieldzSignature,
  type ShieldzEvent,
} from "@/lib/shieldz"
import { shieldzWebhookConfigured, getShieldzWebhookSecret, getConvexWebhookSecret } from "@/lib/env"
import { getConvexHttpClient } from "@/lib/convex-server"
import { api } from "@/convex/_generated/api"

export const dynamic = "force-dynamic"

export async function POST(request: Request) {
  const rawBody = await request.text()
  const signature = request.headers.get("x-shieldz-signature") ?? ""
  const deliveryId = request.headers.get("x-shieldz-delivery") ?? ""

  const secret = getShieldzWebhookSecret()
  const webhookSecret = getConvexWebhookSecret()
  if (!shieldzWebhookConfigured() || !webhookSecret) {
    return NextResponse.json({ ok: true }, { status: 200 })
  }

  // Verify against the RAW body and reject anything stale. This must happen
  // before the payload is parsed or trusted.
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

  const client = getConvexHttpClient()

  try {
    // Replays of an already-handled delivery are safe to ack without work.
    if (
      deliveryId &&
      (await client.query(api.checkouts.isDeliveryHandled, {
        webhookSecret,
        deliveryId,
      }))
    ) {
      return NextResponse.json({ ok: true }, { status: 200 })
    }

    const checkout = await client.query(api.checkouts.findCheckoutByInvoice, {
      webhookSecret,
      invoiceId: event.data.invoice.id,
    })
    if (!checkout) {
      console.warn("[shieldz-webhook] no checkout for invoice", {
        invoiceId: event.data.invoice.id,
      })
      // Record so a legitimate retry doesn't reprocess; fulfillment is only
      // driven by a matching checkout row anyway.
      await client.mutation(api.checkouts.recordWebhookDelivery, {
        webhookSecret,
        deliveryId,
        eventType: event.type,
        invoiceId: event.data.invoice.id,
        rawBody,
        handled: false,
      })
      return NextResponse.json({ ok: true }, { status: 200 })
    }

    switch (event.type) {
      case "invoice.paid":
        // Authoritative signal. Fulfillment is idempotent (credit and plan
        // grants are keyed by the order), so re-deliveries are harmless.
        await client.mutation(api.checkouts.fulfillCheckout, {
          orderId: checkout.orderId,
          webhookSecret,
          paymentId: event.data.invoice.id,
          paymentStatus: event.data.invoice.status,
        })
        break
      case "invoice.failed":
        await client.mutation(api.checkouts.markCheckoutFailed, {
          orderId: checkout.orderId,
          webhookSecret,
          status: "failed",
          shieldzStatus: event.data.invoice.status,
        })
        break
      case "invoice.expired":
        await client.mutation(api.checkouts.markCheckoutFailed, {
          orderId: checkout.orderId,
          webhookSecret,
          status: "expired",
          shieldzStatus: event.data.invoice.status,
        })
        break
    }

    await client.mutation(api.checkouts.recordWebhookDelivery, {
      webhookSecret,
      deliveryId,
      eventType: event.type,
      invoiceId: event.data.invoice.id,
      rawBody,
      handled: true,
    })
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