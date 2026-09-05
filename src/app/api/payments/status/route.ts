import { NextRequest, NextResponse } from "next/server"

import { supabaseConfigured } from "@/lib/env"
import { createClient } from "@/lib/supabase/server"
import { createServiceClient } from "@/lib/supabase/service"

type CheckoutRow = {
  id: string
  user_id: string
  status: string
  nowpayments_status: string | null
  paid_at: string | null
  updated_at: string
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
      .select("id, user_id, status, nowpayments_status, paid_at, updated_at")
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

  const row = checkout as CheckoutRow
  return NextResponse.json(
    {
      orderId: row.id,
      status: row.status,
      nowpaymentsStatus: row.nowpayments_status,
      paidAt: row.paid_at,
      updatedAt: row.updated_at,
    },
    { status: 200 }
  )
}