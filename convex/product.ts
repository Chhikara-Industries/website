import { ConvexError, v } from "convex/values";
import { mutation } from "./_generated/server";
import type { MutationCtx } from "./_generated/server";
import type { Id } from "./_generated/dataModel";
import { hashApiKey } from "./apiKeys";
import { ensureCreditsRow } from "./credits";
import { badRequest } from "./lib/helpers";

/**
 * Product API used by Chhikara software (e.g. the student dashboard) that
 * authenticates with a Chhikara API key rather than a Convex Auth session.
 *
 * A key is looked up by its SHA-256 hash (the `by_secretHash` index); the raw
 * key is never stored. Revoked keys are rejected.
 */
async function resolveKey(
  ctx: MutationCtx,
  rawKey: string,
): Promise<{ userId: Id<"users">; keyId: Id<"apiKeys"> }> {
  const key = rawKey.trim();
  if (!key) {
    throw new ConvexError({ code: 401, message: "API key required." });
  }
  const secretHash = await hashApiKey(key);
  const row = await ctx.db
    .query("apiKeys")
    .withIndex("by_secretHash", (q) => q.eq("secretHash", secretHash))
    .unique();
  if (!row || row.revokedAt) {
    throw new ConvexError({ code: 401, message: "Invalid or revoked API key." });
  }
  return { userId: row.userId, keyId: row._id };
}

/** Resolve an API key to its account: name, email and current credit balance. */
export const session = mutation({
  args: { key: v.string() },
  handler: async (ctx, args) => {
    const { userId, keyId } = await resolveKey(ctx, args.key);
    await ctx.db.patch("apiKeys", keyId, { lastUsedAt: Date.now() });

    const user = await ctx.db.get("users", userId);
    const credits = await ctx.db
      .query("credits")
      .withIndex("by_userId", (q) => q.eq("userId", userId))
      .unique();

    return {
      id: userId as string,
      name: user?.name ?? null,
      email: user?.email ?? null,
      credits: credits?.balance ?? 0,
    };
  },
});

/** Deduct `amount` credits from the account associated with an API key. */
export const spend = mutation({
  args: {
    key: v.string(),
    amount: v.number(),
    reason: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const { userId, keyId } = await resolveKey(ctx, args.key);
    if (!Number.isFinite(args.amount) || args.amount <= 0) {
      throw badRequest("Spend amount must be a positive number.");
    }

    const credits = await ensureCreditsRow(ctx, userId);
    if (credits.balance < args.amount) {
      throw new ConvexError({
        code: 402,
        message: "Insufficient credits.",
        balance: credits.balance,
      });
    }

    const next = credits.balance - args.amount;
    await ctx.db.patch("credits", credits._id, {
      balance: next,
      updatedAt: Date.now(),
    });
    await ctx.db.patch("apiKeys", keyId, { lastUsedAt: Date.now() });
    return { credits: next };
  },
});
