import "server-only"

import { createClient as createSupabaseClient } from "@supabase/supabase-js"

import {
  getSupabaseServiceRoleKey,
  getSupabaseUrl,
  supabaseServiceConfigured,
} from "@/lib/env"

export function createServiceClient() {
  if (!supabaseServiceConfigured()) return null
  return createSupabaseClient(
    getSupabaseUrl(),
    getSupabaseServiceRoleKey(),
    { auth: { persistSession: false } }
  )
}
