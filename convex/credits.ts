import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { requireUserId, badRequest } from "./lib/helpers";
import { MutationCtx } from "./_generated/server";
import { Id } from "./_generated/dataModel";

export async function ensureCreditsRow(
  ctx: MutationCtx,
  userId: Id<"users">,
): Promise<{ _id: Id<"credits">; balance: number }> {
  const existing = await ctx.db
    .query("credits")
    .withIndex("by_userId", (q) => q.eq("userId", userId))
    .unique();
  if (existing) return existing;
  const id = await ctx.db.insert("credits", {
    userId,
    balance: 0,
    updatedAt: Date.now(),
  });
  return (await ctx.db.get("credits", id))!;
}

export const getBalance = query({
  args: {},
  handler: async (ctx) => {
    const userId = await requireUserId(ctx);
    const row = await ctx.db
      .query("credits")
      .withIndex("by_userId", (q) => q.eq("userId", userId))
      .unique();
    return row?.balance ?? 0;
  },
});

/**
 * Atomically deduct `amount` from the user's balance. Fails (with no write)
 * when the balance is insufficient. Called via `runMutation` by the Slicky
 * action so message persistence can be rolled back on failure.
 */
export const spendTokens = mutation({
  args: { userId: v.id("users"), amount: v.number() },
  handler: async (ctx, args) => {
    if (args.amount <= 0) throw badRequest("Spend amount must be positive.");
    const credits = await ensureCreditsRow(ctx, args.userId);
    if (credits.balance < args.amount) {
      return { ok: false as const, reason: "insufficient", balance: credits.balance };
    }
    const next = credits.balance - args.amount;
    await ctx.db.patch("credits", credits._id, {
      balance: next,
      updatedAt: Date.now(),
    });
    return { ok: true as const, balance: next };
  },
});

/** Idempotently credit tokens (once per referenceId/type), mirroring `credit_tokens`. */
export const creditTokens = mutation({
  args: {
    userId: v.id("users"),
    amount: v.number(),
    referenceId: v.string(),
    description: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    if (args.amount <= 0) throw badRequest("Credit amount must be positive.");
    const existing = await ctx.db
      .query("tokenTransactions")
      .withIndex("by_referenceId_and_type", (q) =>
        q.eq("referenceId", args.referenceId).eq("type", "PURCHASE"),
      )
      .unique();
    if (existing) {
      return { alreadyApplied: true as const };
    }
    await ctx.db.insert("tokenTransactions", {
      userId: args.userId,
      amount: args.amount,
      type: "PURCHASE",
      referenceId: args.referenceId,
      description: args.description,
      createdAt: Date.now(),
    });
    const credits = await ensureCreditsRow(ctx, args.userId);
    await ctx.db.patch("credits", credits._id, {
      balance: credits.balance + args.amount,
      updatedAt: Date.now(),
    });
    return { alreadyApplied: false as const };
  },
});

export const listTransactions = query({
  args: { limit: v.optional(v.number()) },
  handler: async (ctx, args) => {
    const userId = await requireUserId(ctx);
    const rows = await ctx.db
      .query("tokenTransactions")
      .withIndex("by_userId", (q) => q.eq("userId", userId))
      .order("desc")
      .take(args.limit ?? 50);
    return rows;
  },
});