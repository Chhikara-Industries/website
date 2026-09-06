export function supabaseConfigured() {
  return Boolean(
    process.env.NEXT_PUBLIC_SUPABASE_URL &&
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  )
}

export function nowPaymentsConfigured() {
  return Boolean(process.env.NOWPAYMENTS_API_KEY)
}

// Recurring subscription endpoints require BOTH the API key and a Bearer JWT
// (generated in the NOWPayments dashboard). The JWT is server-only.
export function nowPaymentsSubscriptionConfigured() {
  return Boolean(
    process.env.NOWPAYMENTS_API_KEY && process.env.NOWPAYMENTS_JWT_TOKEN
  )
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

export function getNowPaymentsJwtToken() {
  return process.env.NOWPAYMENTS_JWT_TOKEN ?? ""
}

export function getSupabaseUrl() {
  return process.env.NEXT_PUBLIC_SUPABASE_URL ?? ""
}

export function getSupabaseAnonKey() {
  return process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? ""
}

// Public site URL, used for callback URLs. SITE_URL is the server-side
// override; NEXT_PUBLIC_SITE_URL is safe to expose to the browser.
export const SITE_URL =
  process.env.SITE_URL ??
  process.env.NEXT_PUBLIC_SITE_URL ??
  "http://localhost:3000"

// NOWPayments subscription plan ids (configure once in the NOWPayments
// dashboard and mirror them here). These are not secrets.
export function getNowPaymentsPlanId(planId: "pro" | "ultimate"): string {
  const value =
    planId === "pro"
      ? process.env.NOWPAYMENTS_PLAN_PRO
      : process.env.NOWPAYMENTS_PLAN_ULTIMATE
  return value?.trim() ?? ""
}