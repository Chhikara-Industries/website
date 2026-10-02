import { getConvexHttpClient } from "@/lib/convex-server"
import { api } from "@/convex/_generated/api"
import { fail, handleSlickyError, ok, preflight, readJson } from "@/lib/slicky-http"

export async function POST(request: Request) {
  try {
    const body = await readJson(request)
    const contentType = String(body?.contentType ?? "text")
    if (contentType === "text") {
      if (!String(body?.text ?? "").trim()) {
        return fail(400, "empty_message", "Write something to send.")
      }
    } else if (typeof body?.attachment !== "object" || body?.attachment === null) {
      return fail(
        400,
        "missing_attachment",
        `${contentType} messages need a file attached.`
      )
    }

    const attachment = (body?.attachment ?? {}) as Record<string, unknown>
    const result = await getConvexHttpClient().action(api.slicky.sendMessage, {
      apiKey: String(body?.apiKey ?? ""),
      code: String(body?.roomCode ?? "").trim().toUpperCase(),
      contentType,
      content: contentType === "text" ? String(body?.text ?? "").trim() : undefined,
      attachment:
        contentType === "text"
          ? undefined
          : {
              dataUrl: String(attachment?.dataUrl ?? ""),
              mimeType: String(attachment?.mimeType ?? ""),
              filename: String(attachment?.fileName ?? "attachment").slice(0, 120),
            },
    })
    return ok({ message: result.message, balance: result.balance, cost: result.cost })
  } catch (e) {
    return handleSlickyError(e)
  }
}

export async function OPTIONS() {
  return preflight()
}