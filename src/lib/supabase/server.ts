import "server-only"

import { cookies } from "next/headers"
import { createServerClient } from "@supabase/ssr"

import { getSupabaseAnonKey, getSupabaseUrl, supabaseConfigured } from "@/lib/env"

export async function createClient() {
  if (!supabaseConfigured()) {
    throw new Error(
      "Supabase is not configured. Set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY."
    )
  }

  const cookieStore = await cookies()

  return createServerClient(getSupabaseUrl(), getSupabaseAnonKey(), {
    cookies: {
      getAll() {
        return cookieStore.getAll()
      },
      setAll(cookiesToSet) {
        try {
          cookiesToSet.forEach(({ name, value, options }) =>
            cookieStore.set(name, value, options)
          )
        } catch {
          // Called from a Server Component. Safe to ignore, middleware refreshes sessions.
        }
      },
    },
  })
}