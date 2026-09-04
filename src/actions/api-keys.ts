"use server"

import { supabaseConfigured } from "@/lib/env"
import { createClient } from "@/lib/supabase/server"
import type { FormState } from "@/actions/auth"
import { generateApiKey, hashApiKey } from "@/lib/api-keys"

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

  if (!supabaseConfigured()) {
    return {
      errors: {},
      message:
        "API keys are unavailable until Supabase is configured and supabase/schema.sql is applied.",
    }
  }

  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return { errors: {}, message: "You must be signed in." }

  const { fullKey, prefix } = generateApiKey()

  const { data, error } = await supabase
    .from("api_keys")
    .insert({
      user_id: user.id,
      name,
      prefix,
      secret_hash: hashApiKey(fullKey),
      scopes: [],
    })
    .select("id, name")
    .single()

  if (error) {
    if (error.code === "42P01") {
      return {
        errors: {},
        message:
          "The api_keys table doesn't exist yet. Apply supabase/schema.sql, then try again.",
      }
    }
    return { errors: {}, message: error.message }
  }

  return {
    created: {
      id: data.id,
      name: data.name,
      fullKey,
    },
    message: `Created ${name}. Copy it now — it won't be shown again.`,
  }
}

export async function revokeApiKey(
  prev: ApiKeyResult,
  formData: FormData
): Promise<ApiKeyResult> {
  const id = String(formData.get("id") ?? "")
  if (!id) return { errors: {}, message: "Missing key." }

  if (!supabaseConfigured()) {
    return { errors: {}, message: "Supabase isn't configured." }
  }

  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return { errors: {}, message: "You must be signed in." }

  const { error } = await supabase
    .from("api_keys")
    .update({ revoked_at: new Date().toISOString() })
    .eq("id", id)
    .eq("user_id", user.id)

  if (error) return { errors: {}, message: error.message }

  return { message: "API key revoked." }
}
