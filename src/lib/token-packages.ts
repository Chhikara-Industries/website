import { TOKENS_PER_CENT } from "@/lib/checkout"

export type TokenPackage = {
  id: string
  name: string
  tokens: number
  priceUsd: number
  note: string
  popular?: boolean
}

const TOKENS_PER_USD = TOKENS_PER_CENT * 100

function makePackage(
  id: string,
  name: string,
  tokens: number,
  note: string,
  popular?: boolean
): TokenPackage {
  return { id, name, tokens, priceUsd: tokens / TOKENS_PER_USD, note, popular }
}

// The token catalog is server-side configuration. The browser only ever sends
// a package id; the server resolves the token amount and price from here.
export const tokenPackages: TokenPackage[] = [
  makePackage("starter", "Starter", 1_000, "For trying things out"),
  makePackage("standard", "Standard", 5_000, "Everyday use"),
  makePackage("pro", "Pro", 10_000, "Best value", true),
  makePackage("power", "Power", 50_000, "Heavy usage"),
]

export function getTokenPackage(id: string): TokenPackage | undefined {
  return tokenPackages.find((p) => p.id === id)
}