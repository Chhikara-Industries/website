import { NextResponse } from "next/server"

import { ProductApiError, productSpend, readApiKey } from "@/lib/product-api"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

export async function POST(request: Request) {
  const key = readApiKey(request)
  if (!key) {
    return NextResponse.json({ message: "API key required." }, { status: 401 })
  }

  let body: { amount?: unknown; reason?: unknown }
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ message: "Invalid JSON body." }, { status: 400 })
  }

  const amount = Number(body.amount)
  if (!Number.isFinite(amount) || amount <= 0) {
    return NextResponse.json({ message: "`amount` must be a positive number." }, { status: 400 })
  }
  const reason = typeof body.reason === "string" ? body.reason : undefined

  try {
    const result = await productSpend(key, amount, reason)
    return NextResponse.json(result)
  } catch (err) {
    if (err instanceof ProductApiError) {
      return NextResponse.json({ message: err.message }, { status: err.code })
    }
    return NextResponse.json(
      { message: "Something went wrong. Please try again." },
      { status: 500 }
    )
  }
}
