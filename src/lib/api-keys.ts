import { createHash, randomBytes, randomUUID } from "node:crypto"

const KEY_PREFIX = "ci"

export function hashApiKey(secret: string): string {
  return createHash("sha256").update(secret).digest("hex")
}

export function generateApiKey(): { fullKey: string; prefix: string } {
  const id = randomUUID().replace(/-/g, "").slice(0, 12)
  const secret = randomBytes(24).toString("hex")
  const prefix = `${KEY_PREFIX}_live_${id}`
  return {
    fullKey: `${prefix}_${secret}`,
    prefix,
  }
}
