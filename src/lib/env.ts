export function supabaseConfigured() {
  return Boolean(
    process.env.NEXT_PUBLIC_SUPABASE_URL &&
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  )
}

export function nowPaymentsConfigured() {
  return Boolean(process.env.NOWPAYMENTS_API_KEY)
}

export function supabaseServiceConfigured() {
  return Boolean(process.env.SUPABASE_SERVICE_ROLE_KEY)
}

export function getSupabaseServiceRoleKey() {
  return process.env.SUPABASE_SERVICE_ROLE_KEY ?? ""
}

export function getNowPaymentsApiKey() {
  return process.env.NOWPAYMENTS_API_KEY ?? ""
}

export function getNowPaymentsIpnSecret() {
  return process.env.NOWPAYMENTS_IPN_SECRET ?? ""
}

export function getSupabaseUrl() {
  return process.env.NEXT_PUBLIC_SUPABASE_URL ?? ""
}

export function getSupabaseAnonKey() {
  return process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? ""
}

export const SITE_URL =
  process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000"