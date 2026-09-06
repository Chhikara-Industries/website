import { NextRequest, NextResponse } from "next/server"

import { getPaymentStatus, getSubscription } from "@/lib/nowpayments"
import { supabaseConfigured } from "@/lib/env"
import { createClient } from "@/lib/supabase/server"
import { createServiceClient } from "@/lib/supabase/service"
import { applyPaymentStatus, applySubscriptionStatus } from "@/lib/payments"

// Throttle direct NOWPayments API checks so concurrent pollers don't hammer
// the payment-status endpoint (our own state mirror is the fast path).
const LAST_CHECK_MS = new Map<string, number>()
const CHECK_THROTTLE_MS = 15_000

function shouldCrossCheck(paymentId: string): boolean {
  const now = Date.now()
  const last = LAST_CHECK_MS.get(paymentId)
  if (last !== undefined && now - last < CHECK_THROTTLE_MS) return false
  if (LAST_CHECK_MS.size > 500) {
    for (const key of LAST_CHECK_MS.keys()) {
      const value = LAST_CHECK_MS.get(key) ?? 0
      if (now - value > CHECK_THROTTLE_MS) LAST_CHECK_MS.delete(key)
    }
  }
  LAST_CHECK_MS.set(paymentId, now)
  return true
}

type StatusCheckoutRow = {
  id: string
  user_id: string
  status: string
  nowpayments_status: string | null
  paid_at: string | null
  updated_at: string
  pay_address: string | null
  pay_currency: string | null
  pay_amount: number | null
  amount_usd: number | null
  item: string | null
  mode: string
  credits: number
  plan: string | null
  nowpayments_plan_id: string | null
  nowpayments_subscription_id: string | null
  nowpayments_payment_id: string | null
  ipn_count: number | null
}

export async function GET(request: NextRequest) {
  const orderId = request.nextUrl.searchParams.get("order_id")
  if (!orderId) {
    return NextResponse.json({ error: "Missing order_id" }, { status: 400 })
  }

  if (!supabaseConfigured()) {
    return NextResponse.json({ error: "Not configured" }, { status: 400 })
  }

  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const service = createServiceClient()

  const query = (client: typeof supabase | NonNullable<typeof service>) =>
    client
      .from("checkouts")
      .select(
        "id, user_id, status, nowpayments_status, paid_at, updated_at, pay_address, pay_currency, pay_amount, amount_usd, item, mode, credits, plan, nowpayments_plan_id, nowpayments_subscription_id, nowpayments_payment_id, ipn_count"
      )
      .eq("id", orderId)
      .eq("user_id", user.id)
      .maybeSingle()

  const first = await query(supabase)
  let checkout = first.error || !first.data ? null : first.data
  if (!checkout && service) {
    const second = await query(service)
    checkout = second.error || !second.data ? null : second.data
  }

  if (!checkout) {
    return NextResponse.json({ error: "Order not found" }, { status: 404 })
  }

  const row = checkout as StatusCheckoutRow

  // Cross-check with NOWPayments directly while the order is pending. This is
  // what lets the page confirm a payment even when the IPN webhook can't reach
  // the server (e.g. local development) — and it keeps the IPN as the source
  // of truth, never a client that reports its own payment.
  if (service && row.status === "awaiting_payment") {
    if (
      row.mode === "subscription" &&
      row.nowpayments_subscription_id &&
      shouldCrossCheck(`sub:${row.nowpayments_subscription_id}`)
    ) {
      try {
        const sub = await getSubscription(row.nowpayments_subscription_id)
        if (
          sub.status &&
          sub.status.toLowerCase() !==
            (row.nowpayments_status ?? "").toLowerCase()
        ) {
          await applySubscriptionStatus(
            service,
            {
              ...row,
              amount_usd: row.amount_usd ?? 0,
              credits: row.credits ?? 0,
              ipn_count: row.ipn_count ?? 0,
            },
            sub.status,
            sub.payment ?? null
          )
          const latest = await query(service)
          checkout = latest.error || !latest.data ? checkout : latest.data
        }
      } catch (e) {
        console.warn("[payments] subscription cross-check failed", {
          subscriptionId: row.nowpayments_subscription_id,
          error: e instanceof Error ? e.message : "unknown",
        })
      }
    } else if (
      row.nowpayments_payment_id &&
      shouldCrossCheck(row.nowpayments_payment_id)
    ) {
      try {
        const remote = await getPaymentStatus(row.nowpayments_payment_id)
        if (
          remote.payment_status &&
          remote.payment_status !== row.nowpayments_status &&
          remote.payment_status !== "waiting"
        ) {
          await applyPaymentStatus(
            service,
            {
              ...row,
              amount_usd: row.amount_usd ?? 0,
              credits: row.credits ?? 0,
              ipn_count: row.ipn_count ?? 0,
            },
            remote.payment_status,
            remote
          )
          const latest = await query(service)
          checkout = latest.error || !latest.data ? checkout : latest.data
        }
      } catch (e) {
        console.warn("[payments] cross-check failed", {
          paymentId: row.nowpayments_payment_id,
          error: e instanceof Error ? e.message : "unknown",
        })
      }
    }
  }

  const finalRow = (checkout as StatusCheckoutRow) ?? row
  return NextResponse.json(
    {
      orderId: finalRow.id,
      status: finalRow.status,
      nowpaymentsStatus: finalRow.nowpayments_status,
      paidAt: finalRow.paid_at,
      updatedAt: finalRow.updated_at,
      payAddress: finalRow.pay_address,
      payCurrency: finalRow.pay_currency,
      payAmount: finalRow.pay_amount,
      amountUsd: finalRow.amount_usd,
      item: finalRow.item,
      mode: finalRow.mode,
    },
    { status: 200 }
  )
}
