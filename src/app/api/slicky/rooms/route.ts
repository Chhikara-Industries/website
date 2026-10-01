import { getConvexHttpClient } from "@/lib/convex-server"
import { api } from "@/convex/_generated/api"
import { handleSlickyError, ok, preflight, readJson } from "@/lib/slicky-http"

export async function POST(request: Request) {
  try {
    const body = await readJson(request)
    const name =
      String(body?.name ?? "").trim().slice(0, 60) || "Untitled room"
    const result = await getConvexHttpClient().action(api.slicky.createRoom, {
      apiKey: String(body?.apiKey ?? ""),
      name,
    })
    return ok({ room: result.room })
  } catch (e) {
    return handleSlickyError(e)
  }
}

export async function OPTIONS() {
  return preflight()
}