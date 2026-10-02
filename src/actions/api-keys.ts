"use server"

import { fetchMutation } from "convex/nextjs"

import { api } from "@/convex/_generated/api"
import type { Id } from "@/convex/_generated/dataModel"
import { getAuthToken, convexErrorMessage } from "@/lib/convex-server"
import type { FormState } from "@/actions/auth"

export type CreatedApiKey = {
  id: string
  name: string
  fullKey: string
}

export type ApiKeyState = FormState & {
  created?: CreatedApiKey
}

export type ApiKeyResult = ApiKeyState | undefined

export async function createApiKey(
  prev: ApiKeyResult,
  formData: FormData
): Promise<ApiKeyResult> {
  const name = String(formData.get("name") ?? "").trim()
  if (!name) {
    return { errors: { name: ["Name your key so you can recognise it."] } }
  }

  try {
    const result = await fetchMutation(
      api.apiKeys.createApiKey,
      { name },
      { token: await getAuthToken() }
    )
    return {
      created: {
        id: result.id,
        name: result.name,
        fullKey: result.fullKey,
      },
      message: `Created ${name}. Copy it now — it won't be shown again.`,
    }
  } catch (err) {
    return { errors: {}, message: convexErrorMessage(err) }
  }
}

export async function revokeApiKey(
  prev: ApiKeyResult,
  formData: FormData
): Promise<ApiKeyResult> {
  const id = String(formData.get("id") ?? "")
  if (!id) return { errors: {}, message: "Missing key." }

  try {
    const result = await fetchMutation(
      api.apiKeys.revokeApiKey,
      { id: id as Id<"apiKeys"> },
      { token: await getAuthToken() }
    )
    return { message: result.message }
  } catch (err) {
    return { errors: {}, message: convexErrorMessage(err) }
  }
}