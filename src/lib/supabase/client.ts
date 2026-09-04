import { createBrowserClient } from "@supabase/ssr"

import { getSupabaseAnonKey, getSupabaseUrl, supabaseConfigured } from "@/lib/env"

export function createClient() {
  if (!supabaseConfigured()) {
    throw new Error(
      "Supabase is not configured. Set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY."
    )
  }
  return createBrowserClient(getSupabaseUrl(), getSupabaseAnonKey())
}