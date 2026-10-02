import { ConvexError, v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { requireUserId, badRequest } from "./lib/helpers";

function toHex(bytes: Uint8Array): string {
  return Array.from(bytes, (b) => b.toString(16).padStart(2, "0")).join("");
}

/**
 * SHA-256 hex, via WebCrypto so it runs in both the default and Node runtimes.
 */
export async function hashApiKey(secret: string): Promise<string> {
  const data = new TextEncoder().encode(secret);
  const digest = await crypto.subtle.digest("SHA-256", data);
  return toHex(new Uint8Array(digest));
}

export async function generateApiKey(): Promise<{ fullKey: string; prefix: string }> {
  const prefix = `ci_live_${toHex(crypto.getRandomValues(new Uint8Array(6)))}`;
  const fullKey = `${prefix}_${toHex(crypto.getRandomValues(new Uint8Array(24)))}`;
  return { fullKey, prefix };
}

export const listApiKeys = query({
  args: {},
  handler: async (ctx) => {
    const userId = await requireUserId(ctx);
    const rows = await ctx.db
      .query("apiKeys")
      .withIndex("by_userId", (q) => q.eq("userId", userId))
      .order("desc")
      .collect();
    return rows.map((row) => ({
      id: row._id,
      name: row.name,
      prefix: row.prefix,
      createdAt: row.createdAt,
      lastUsedAt: row.lastUsedAt ?? null,
      revokedAt: row.revokedAt ?? null,
    }));
  },
});

export const createApiKey = mutation({
  args: { name: v.string() },
  handler: async (ctx, args) => {
    const userId = await requireUserId(ctx);
    const name = args.name.trim();
    if (!name) {
      throw badRequest("Key name is required.");
    }
    const { fullKey, prefix } = await generateApiKey();
    const id = await ctx.db.insert("apiKeys", {
      userId,
      name,
      prefix,
      secretHash: await hashApiKey(fullKey),
      scopes: [],
      createdAt: Date.now(),
    });
    return { id, name, fullKey };
  },
});

export const revokeApiKey = mutation({
  args: { id: v.id("apiKeys") },
  handler: async (ctx, args) => {
    const userId = await requireUserId(ctx);
    const row = await ctx.db.get("apiKeys", args.id);
    if (!row || row.userId !== userId) {
      throw new ConvexError({ code: 404, message: "API key not found." });
    }
    await ctx.db.patch("apiKeys", args.id, { revokedAt: Date.now() });
    return { message: "API key revoked." };
  },
});