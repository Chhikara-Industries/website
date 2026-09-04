import "server-only"

import { cache } from "react"
import { redirect } from "next/navigation"

import { supabaseConfigured } from "@/lib/env"
import { createClient } from "@/lib/supabase/server"

export type CurrentUser = {
  id: string
  email: string | undefined
  name: string | null
  avatarUrl: string | null
}

export const getCurrentUser = cache(async (): Promise<CurrentUser | null> => {
  if (!supabaseConfigured()) return null

  try {
    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()
    if (!user) return null

    const { data: profile } = await supabase
      .from("profiles")
      .select("full_name, avatar_url")
      .eq("id", user.id)
      .maybeSingle()

    return {
      id: user.id,
      email: user.email,
      name: profile?.full_name ?? user.user_metadata?.full_name ?? null,
      avatarUrl: profile?.avatar_url ?? null,
    }
  } catch {
    return null
  }
})

export async function requireDashboardAccess() {
  const configured = supabaseConfigured()

  // Pre-Supabase, the dashboard runs in demo mode so the UI is reviewable.
  if (!configured) {
    return { user: null, demo: true }
  }

  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect("/login")
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("full_name, avatar_url")
    .eq("id", user.id)
    .maybeSingle()

  return {
    user: {
      id: user.id,
      email: user.email,
      name: profile?.full_name ?? user.user_metadata?.full_name ?? null,
      avatarUrl: profile?.avatar_url ?? null,
    } satisfies CurrentUser,
    demo: false,
  }
}

export type ApiKeyRow = {
  id: string
  name: string
  prefix: string
  createdAt: string
  lastUsedAt: string | null
  revokedAt: string | null
}

export async function getApiKeys(): Promise<ApiKeyRow[]> {
  if (!supabaseConfigured()) return []

  try {
    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()
    if (!user) return []

    const { data } = await supabase
      .from("api_keys")
      .select("id, name, prefix, created_at, last_used_at, revoked_at")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })

    return (data ?? []).map((row) => ({
      id: row.id,
      name: row.name,
      prefix: row.prefix,
      createdAt: row.created_at,
      lastUsedAt: row.last_used_at,
      revokedAt: row.revoked_at,
    }))
  } catch {
    return []
  }
}

export async function getUserPlan(): Promise<string> {
  if (!supabaseConfigured()) return "free"

  try {
    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()
    if (!user) return "free"

    const { data } = await supabase
      .from("subscriptions")
      .select("plan")
      .eq("user_id", user.id)
      .maybeSingle()

    return data?.plan ?? "free"
  } catch {
    return "free"
  }
}