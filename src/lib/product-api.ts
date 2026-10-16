import "server-only"

import { getConvexUrl } from "@/lib/env"

type ConvexErrorData = { code?: number; message?: string }

export class ProductApiError extends Error {
  code: number

  constructor(code: number, message: string) {
    super(message)
    this.name = "ProductApiError"
    this.code = code
  }
}

/** Reads a Chhikara API key from an `Authorization: Bearer` or `x-api-key` header. */
export function readApiKey(request: Request): string {
  const auth = request.headers.get("authorization") ?? ""
  if (auth.toLowerCase().startsWith("bearer ")) {
    return auth.slice(7).trim()
  }
  return (request.headers.get("x-api-key") ?? "").trim()
}

/**
 * Calls the Convex deployment directly over its HTTP API. Used by the product
 * API route handlers, which authenticate with a Chhikara API key rather than a
 * Convex Auth session.
 */
async function callConvex<T>(
  kind: "query" | "mutation",
  path: string,
  args: Record<string, unknown>
): Promise<T> {
  const url = getConvexUrl()
  if (!url) {
    throw new ProductApiError(500, "Convex is not configured.")
  }

  const res = await fetch(`${url}/api/${kind}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ path, args, format: "json" }),
    cache: "no-store",
  })

  const payload = (await res.json().catch(() => null)) as
    | { status: "success"; value: T }
    | { status: "error"; errorMessage?: string; errorData?: ConvexErrorData }
    | null

  if (!payload) {
    throw new ProductApiError(502, "Unexpected response from the backend.")
  }
  if (payload.status === "success") {
    return payload.value
  }

  const data = payload.errorData ?? {}
  const code = typeof data.code === "number" ? data.code : 400
  const message = data.message ?? payload.errorMessage ?? "Request failed."
  throw new ProductApiError(code, message)
}

export type ProductSession = {
  id: string
  name: string | null
  email: string | null
  credits: number
}

export function productSession(key: string): Promise<ProductSession> {
  return callConvex("mutation", "product:session", { key })
}

export function productSpend(
  key: string,
  amount: number,
  reason?: string
): Promise<{ credits: number }> {
  return callConvex("mutation", "product:spend", { key, amount, reason })
}
