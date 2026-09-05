import { NextResponse } from "next/server"

import {
  getPaymentStatus,
  verifyIpnSignature,
  type NowPaymentsPayment,
} from "@/lib/nowpayments"
import { supabaseServiceConfigured } from "@/lib/env"
import { createServiceClient } from "@/lib/supabase/service"
import {
  applyPaymentStatus,
  applyRenewal,
  type CheckoutRow,
} from "@/lib/payments"

export async function POST(request: Request) {
  const signature = request.headers.get("x-nowpayments-sig") ?? ""
  const raw = await request.text()

  // NOWPayments computes the signature over the raw body with all keys sorted
  // alphabetically (recursively). Verify before trusting anything.
  const payload = safeParse(raw)
  if (!payload) {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 })
  }

  if (!verifyIpnSignature(payload, signature)) {
    console.warn("[ipn] invalid signature")
    return NextResponse.json({ error: "Invalid signature" }, { status: 401 })
  }

  if (!supabaseServiceConfigured()) {
    return NextResponse.json({ ok: true }, { status: 200 })
  }
  const supabase = createServiceClient()
  if (!supabase) {
    return NextResponse.json({ ok: true }, { status: 200 })
  }

  const status =
    typeof payload.payment_status === "string"
      ? payload.payment_status
      : typeof payload.outcome_payment_status === "string"
        ? payload.outcome_payment_status
        : ""
  const rawPaymentId = payload.payment_id
  const paymentId =
    typeof rawPaymentId === "number" || typeof rawPaymentId === "string"
      ? rawPaymentId
      : undefined
  const rawOrderId = payload.order_id
  const orderId = typeof rawOrderId === "string" ? rawOrderId : undefined
  const rawSubscriptionId = payload.subscription_id ?? payload.subscription_plan_id
  const subscriptionId =
    typeof rawSubscriptionId === "number" || typeof rawSubscriptionId === "string"
      ? String(rawSubscriptionId)
      : ""

  try {
    // Cross-check the payment with NOWPayments before acting on it. A failure
    // here means we can't verify the payment is legitimate, so we do nothing.
    if (paymentId !== undefined) {
      const remote = await getPaymentStatus(paymentId)
      const remoteStatus = remote.payment_status
      if (remoteStatus !== status) {
        console.warn("[ipn] status mismatch: does not match NOWPayments API", {
          paymentId,
          local: status,
          remote: remoteStatus,
        })
        return NextResponse.json({ ok: true }, { status: 200 })
      }
      await recordIpn(supabase, orderId, subscriptionId, remoteStatus, remote)
    } else {
      await recordIpn(supabase, orderId, subscriptionId, status, null)
    }
  } catch (e) {
    console.error("[ipn] processing error", {
      paymentId,
      orderId,
      subscriptionId,
      error: e instanceof Error ? e.message : "unknown",
    })
  }

  return NextResponse.json({ ok: true }, { status: 200 })
}

function safeParse(raw: string): Record<string, unknown> | null {
  try {
    const parsed = JSON.parse(raw)
    return parsed && typeof parsed === "object" ? parsed : null
  } catch {
    return null
  }
}

async function recordIpn(
  supabase: NonNullable<ReturnType<typeof createServiceClient>>,
  orderId: string | undefined,
  subscriptionId: string,
  status: string,
  payment: NowPaymentsPayment | null
) {
  // Recurring renewal: no order_id, but the subscription is linked.
  if (!orderId && subscriptionId) {
    await applyRenewal(supabase, subscriptionId, status, payment)
    return
  }

  if (!orderId) {
    console.warn("[ipn] no order_id or subscription_id; ignoring")
    return
  }

  const { data: checkout, error: fetchError } = await supabase
    .from("checkouts")
    .select("*")
    .eq("id", orderId)
    .maybeSingle()

  if (fetchError || !checkout) {
    console.warn("[ipn] order not found", { orderId })
    return
  }

  await applyPaymentStatus(supabase, checkout as CheckoutRow, status, payment)
}