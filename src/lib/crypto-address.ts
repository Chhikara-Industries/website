// Shared, pure (no "server-only") crypto helpers used by both server actions
// and client components. Keep this file free of any server-only imports.

export type PayCrypto = "btc" | "eth" | "sol"

export const PAY_CRYPTOS: PayCrypto[] = ["btc", "eth", "sol"]

// Loose but safe structural validation of a payout/sending address for a given
// asset. We can't verify an address is truly spendable without a node, but we
// reject obviously malformed input before it reaches NOWPayments.
export function isValidCryptoAddress(
  address: string | null | undefined,
  crypto: PayCrypto
): boolean {
  if (!address) return false
  const a = address.trim()
  if (a.length < 10 || a.length > 200) return false
  switch (crypto) {
    case "btc":
      // Legacy (1/3), SegWit (bc1). Base58-ish + bech32 chars.
      return /^(bc1|[13])[a-zA-HJ-NP-Z0-9]+$/.test(a)
    case "eth":
      // 0x + 40 hex chars, case-insensitive (checksum not required to send).
      return /^0x[0-9a-fA-F]{40}$/.test(a)
    case "sol":
      // Base58 of a 32-byte ed25519 pubkey -> 32-44 chars.
      return /^[1-9A-HJ-NP-Za-km-z]{32,44}$/.test(a)
    default:
      return false
  }
}
