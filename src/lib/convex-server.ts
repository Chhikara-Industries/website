import "server-only"

import { ConvexError } from "convex/values"
import { ConvexHttpClient } from "convex/browser"
import { convexAuthNextjsToken } from "@convex-dev/auth/nextjs/server"

import { getConvexUrl } from "@/lib/env"

// Shared token for server components / server actions. Returns the current
// user's Convex JWT (or undefined when signed out).
export async function getAuthToken(): Promise<string | undefined> {
  return convexAuthNextjsToken()
}

let client: ConvexHttpClient | null = null

// Unauthenticated Convex client for route handlers (Shieldz webhook, Slicky
// endpoints) that call public webhook-secret- or API-key-gated functions.
// Route handlers construct their own ConvexHttpClient with a user token when
// they need to act as the signed-in user.
export function getConvexHttpClient(): ConvexHttpClient {
  if (!client) {
    const url = getConvexUrl()
    if (!url) {
      throw new Error("NEXT_PUBLIC_CONVEX_URL is not set.")
    }
    client = new ConvexHttpClient(url)
  }
  return client
}

// Unwraps a ConvexError ({code, message} data payload) to its user-facing
// message; falls back to other Error messages / a generic string.
export function convexErrorMessage(err: unknown): string {
  if (err instanceof ConvexError) {
    const data = (err.data ?? {}) as { message?: unknown }
    if (typeof data.message === "string") return data.message
    return "Request failed. Please try again."
  }
  if (err instanceof Error && err.message) return err.message
  return "Something went wrong. Please try again."
}