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

// Convex. NEXT_PUBLIC_CONVEX_URL is set by `npx convex dev`.
export function getConvexUrl() {
  return (
    process.env.NEXT_PUBLIC_CONVEX_URL ??
    process.env.CONVEX_SITE_URL ??
    ""
  )
}

// The webhook secret gate lives in Convex env as CONVEX_WEBHOOK_SECRET and
// must match SHIELDZ_WEBHOOK_SECRET. Set with:
//   npx convex env set CONVEX_WEBHOOK_SECRET <value>
export function getConvexWebhookSecret() {
  return process.env.CONVEX_WEBHOOK_SECRET ?? ""
}