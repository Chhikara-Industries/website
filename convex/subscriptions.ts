import { query } from "./_generated/server";
import { MutationCtx } from "./_generated/server";
import { requireUserId } from "./lib/helpers";
import { Id } from "./_generated/dataModel";

export const getPlan = query({
  args: {},
  handler: async (ctx) => {
    const userId = await requireUserId(ctx);
    const sub = await ctx.db
      .query("subscriptions")
      .withIndex("by_userId", (q) => q.eq("userId", userId))
      .unique();
    if (!sub) return "free";
    if (sub.status !== "active") return "free";
    if (sub.currentPeriodEnd !== undefined && sub.currentPeriodEnd < Date.now()) {
      return "free";
    }
    return sub.plan;
  },
});

export const getSubscription = query({
  args: {},
  handler: async (ctx) => {
    const userId = await requireUserId(ctx);
    return await ctx.db
      .query("subscriptions")
      .withIndex("by_userId", (q) => q.eq("userId", userId))
      .unique();
  },
});

/**
 * Upserts an active subscription row, mirroring the subscription branch of the
 * old `fulfill_checkout` RPC.
 */
export async function applySubscription(
  ctx: MutationCtx,
  userId: Id<"users">,
  plan: string,
  intervalDays: number,
) {
  const now = Date.now();
  const existing = await ctx.db
    .query("subscriptions")
    .withIndex("by_userId", (q) => q.eq("userId", userId))
    .unique();
  const doc = {
    userId,
    plan,
    status: "active",
    intervalDays,
    currentPeriodStart: now,
    currentPeriodEnd: now + intervalDays * 24 * 60 * 60 * 1000,
    updatedAt: now,
  } as const;
  if (existing) {
    await ctx.db.replace("subscriptions", existing._id, doc);
    return existing._id;
  }
  return ctx.db.insert("subscriptions", doc);
}