import { NextResponse } from "next/server"

import { ProductApiError, productSession, readApiKey } from "@/lib/product-api"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

export async function POST(request: Request) {
  const key = readApiKey(request)
  if (!key) {
    return NextResponse.json({ message: "API key required." }, { status: 401 })
  }

  try {
    const account = await productSession(key)
    return NextResponse.json(account)
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
