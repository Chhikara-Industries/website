import { getConvexHttpClient } from "@/lib/convex-server"
import { api } from "@/convex/_generated/api"
import { fail, handleSlickyError, ok, preflight, readJson } from "@/lib/slicky-http"

export async function POST(request: Request) {
  try {
    const body = await readJson(request)
    const code = String(body?.roomCode ?? "").trim().toUpperCase()
    if (!code) {
      return fail(400, "missing_room", "A room code is required.")
    }
    const requested = Number(body?.limit ?? 50)
    const result = await getConvexHttpClient().action(api.slicky.readMessages, {
      apiKey: String(body?.apiKey ?? ""),
      code,
      limit: Number.isFinite(requested) ? requested : 50,
    })
    return ok({ messages: result.messages, balance: result.balance })
  } catch (e) {
    return handleSlickyError(e)
  }
}

export async function OPTIONS() {
  return preflight()
}