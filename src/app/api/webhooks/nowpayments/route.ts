import { NextResponse } from "next/server"

import { supabaseServiceConfigured } from "@/lib/env"
import { verifyIpn } from "@/lib/nowpayments"
import { createServiceClient } from "@/lib/supabase/service"
import type { PlanId } from "@/lib/plans"

type IpnPayment = {
  payment_id?: number
  payment_status?: string
  order_id?: string
  pay_address?: string
  price_amount?: number
  price_currency?: string
  pay_amount?: number
  actually_paid?: number
  pay_currency?: string
  outcome_payment_status?: string
}

const PAID_STATUES = new Set([
  "finished",
  "confirmed",
  "partially_paid",
  "sending",
])

export async function POST(request: Request) {
  const body = await request.text()
  const signature = request.headers.get("x-nowpayments-sig") ?? ""

  if (!verifyIpn(body, signature)) {
    return NextResponse.json({ error: "Invalid signature" }, { status: 401 })
  }

  if (!supabaseServiceConfigured()) {
    return NextResponse.json({ ok: true }, { status: 200 })
  }

  let payload: IpnPayment
  try {
    payload = JSON.parse(body) as IpnPayment
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 })
  }

  const orderId = payload.order_id
  if (!orderId) {
    return NextResponse.json({ error: "Missing order_id" }, { status: 400 })
  }

  const status = payload.payment_status ?? payload.outcome_payment_status ?? ""
  const supabase = createServiceClient()
  if (!supabase) {
    return NextResponse.json({ ok: true }, { status: 200 })
  }

  const { data: checkout, error: fetchError } = await supabase
    .from("checkouts")
    .select("*")
    .eq("id", orderId)
    .maybeSingle()

  if (fetchError || !checkout) {
    return NextResponse.json({ ok: true }, { status: 200 })
  }

  const isPaid = PAID_STATUES.has(status)

  if (isPaid) {
    const mode = checkout.mode
    const credits = checkout.credits ?? 0
    const plan = checkout.plan as PlanId | null

    if (mode === "credits" && credits > 0) {
      await upsertCredits(supabase, checkout.user_id, credits)
    }

    if (mode === "subscription" && plan) {
      await upsertPlan(supabase, checkout.user_id, plan)
    }

    await supabase
      .from("checkouts")
      .update({ status: "paid", paid_at: new Date().toISOString() })
      .eq("id", orderId)
  } else if (status === "waiting" || status === "confirming") {
    await supabase
      .from("checkouts")
      .update({ status: "awaiting_payment" })
      .eq("id", orderId)
  }

  return NextResponse.json({ ok: true }, { status: 200 })
}

async function upsertCredits(
  supabase: NonNullable<ReturnType<typeof createServiceClient>>,
  userId: string,
  credits: number
) {
  const { data: row } = await supabase
    .from("credits")
    .select("balance")
    .eq("user_id", userId)
    .maybeSingle()

  if (row) {
    await supabase
      .from("credits")
      .update({ balance: row.balance + credits })
      .eq("user_id", userId)
  } else {
    await supabase
      .from("credits")
      .insert({ user_id: userId, balance: credits })
  }
}

async function upsertPlan(
  supabase: NonNullable<ReturnType<typeof createServiceClient>>,
  userId: string,
  plan: PlanId
) {
  const { data: row } = await supabase
    .from("subscriptions")
    .select("user_id")
    .eq("user_id", userId)
    .maybeSingle()

  if (row) {
    await supabase
      .from("subscriptions")
      .update({ plan, status: "active", updated_at: new Date().toISOString() })
      .eq("user_id", userId)
  } else {
    await supabase
      .from("subscriptions")
      .insert({ user_id: userId, plan, status: "active" })
  }
}
