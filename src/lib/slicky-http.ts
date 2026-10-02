import { ConvexError } from "convex/values"
import { NextResponse } from "next/server"

const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
  "Access-Control-Max-Age": "86400",
} as const

export function corsHeaders() {
  return { ...CORS_HEADERS }
}

export function ok(data: Record<string, unknown>, init?: number) {
  return NextResponse.json(
    { ok: true, ...data },
    { status: init ?? 200, headers: corsHeaders() }
  )
}

export function preflight() {
  return new NextResponse(null, { status: 204, headers: corsHeaders() })
}

export function fail(
  status: number,
  code: string,
  message: string,
  data?: Record<string, unknown>
) {
  return NextResponse.json(
    { ok: false, error: code, message, ...(data ?? {}) },
    { status, headers: corsHeaders() }
  )
}

export class SlickyError extends Error {
  constructor(
    public status: number,
    public code: string,
    message: string,
    public data?: Record<string, unknown>
  ) {
    super(message)
    this.name = "SlickyError"
  }
}

// Maps a thrown error to the extension's JSON error envelope. The Slicky
// actions reject with a ConvexError carrying `{ status, code, message }`;
// everything else degrades to a 500.
export function handleSlickyError(e: unknown) {
  if (e instanceof SlickyError) {
    return fail(e.status, e.code, e.message, e.data)
  }
  if (e instanceof ConvexError) {
    const data = e.data as { status?: unknown; code?: unknown; message?: unknown }
    if (
      typeof data?.status === "number" &&
      typeof data?.code === "string" &&
      typeof data?.message === "string"
    ) {
      return fail(data.status, data.code, data.message)
    }
  }
  const detail = e instanceof Error ? e.message : "Unknown error"
  return fail(500, "server_error", "Something went wrong. Please try again.", {
    detail,
  })
}

export function readJson(request: Request): Promise<Record<string, unknown>> {
  return request.json().catch(() => {
    throw new SlickyError(400, "bad_request", "Request body must be valid JSON.")
  })
}