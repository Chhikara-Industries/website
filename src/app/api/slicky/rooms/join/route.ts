import { getConvexHttpClient } from "@/lib/convex-server"
import { api } from "@/convex/_generated/api"
import { handleSlickyError, ok, preflight, readJson } from "@/lib/slicky-http"

export async function POST(request: Request) {
  try {
    const body = await readJson(request)
    const result = await getConvexHttpClient().action(api.slicky.joinRoom, {
      apiKey: String(body?.apiKey ?? ""),
      code: String(body?.code ?? ""),
    })
    return ok({ room: result.room })
  } catch (e) {
    return handleSlickyError(e)
  }
}

export async function OPTIONS() {
  return preflight()
}