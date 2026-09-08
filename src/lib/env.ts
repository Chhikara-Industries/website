export function supabaseConfigured() {
  return Boolean(
    process.env.NEXT_PUBLIC_SUPABASE_URL &&
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  )
}

export function supabaseServiceConfigured() {
  return Boolean(process.env.SUPABASE_SERVICE_ROLE_KEY)
}

export function getSupabaseServiceRoleKey() {
  return process.env.SUPABASE_SERVICE_ROLE_KEY ?? ""
}

export function getSupabaseUrl() {
  return process.env.NEXT_PUBLIC_SUPABASE_URL ?? ""
}

export function getSupabaseAnonKey() {
  return process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? ""
}

// Shieldz payment gateway (server-only keys — never expose to the browser).
export function shieldzConfigured() {
  return Boolean(process.env.SHIELDZ_API_KEY)
}

export function shieldzWebhookConfigured() {
  return Boolean(
    process.env.SHIELDZ_API_KEY && process.env.SHIELDZ_WEBHOOK_SECRET
  )
}

export function getShieldzApiKey() {
  return process.env.SHIELDZ_API_KEY ?? ""
}

export function getShieldzWebhookSecret() {
  return process.env.SHIELDZ_WEBHOOK_SECRET ?? ""
}

export function getShieldzApiUrl() {
  return process.env.SHIELDZ_API_URL?.trim() || "https://shieldz.cash"
}

// Settlement rail. We settle in USDC on Base; the customer pays in the asset
// they pick on the checkout page and Shieldz handles the conversion/settlement.
export function getShieldzSettlementChain() {
  return process.env.SHIELDZ_SETTLEMENT_CHAIN ?? "BASE"
}

export function getShieldzSettlementAsset() {
  return process.env.SHIELDZ_SETTLEMENT_ASSET ?? "BASE.USDC"
}

// Public site URL, used for redirect targets. SITE_URL is the server-side
// override; NEXT_PUBLIC_SITE_URL is safe to expose to the browser.
export const SITE_URL =
  process.env.SITE_URL ??
  process.env.NEXT_PUBLIC_SITE_URL ??
  "http://localhost:3000"