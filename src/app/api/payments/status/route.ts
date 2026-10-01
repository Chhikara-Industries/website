import { NextRequest, NextResponse } from "next/server"
import { fetchQuery } from "convex/nextjs"

import { api } from "@/convex/_generated/api"
import { getAuthToken } from "@/lib/convex-server"

export const dynamic = "force-dynamic"

export async function GET(request: NextRequest) {
  const orderId = request.nextUrl.searchParams.get("order_id")
  if (!orderId) {
    return NextResponse.json({ error: "Missing order_id" }, { status: 400 })
  }

  const token = await getAuthToken()
  if (!token) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  let checkout
  try {
    checkout = await fetchQuery(api.checkouts.getCheckout, { orderCode: orderId }, { token })
  } catch {
    return NextResponse.json({ error: "Order not found" }, { status: 404 })
  }
  if (!checkout) {
    return NextResponse.json({ error: "Order not found" }, { status: 404 })
  }

  // The webhook is the source of truth; this endpoint only reflects what the
  // database already recorded. No external provider is polled.
  return NextResponse.json(
    {
      orderId: checkout.orderCode,
      status: checkout.status,
      shieldzStatus: checkout.shieldzStatus ?? null,
      invoiceId: checkout.shieldzInvoiceId ?? null,
      paidAt:
        typeof checkout.paidAt === "number"
          ? new Date(checkout.paidAt).toISOString()
          : null,
      updatedAt:
        typeof checkout.updatedAt === "number"
          ? new Date(checkout.updatedAt).toISOString()
          : null,
      item: checkout.item,
      mode: checkout.mode,
    },
    { status: 200 }
  )
}