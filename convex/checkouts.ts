import { v, ConvexError } from "convex/values";
import { mutation, query } from "./_generated/server";
import { requireUserId, badRequest, unauthorized } from "./lib/helpers";
import { applySubscription } from "./subscriptions";

/** Matches the duplicate-subscription guard in the old `createCheckout` action. */
export const createCheckout = mutation({
  args: {
    orderCode: v.string(),
    item: v.string(),
    mode: v.union(v.literal("credits"), v.literal("subscription")),
    crypto: v.string(),
    amountUsd: v.number(),
    credits: v.number(),
    plan: v.optional(v.string()),
    intervalDays: v.optional(v.number()),
    walletAddress: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const userId = await requireUserId(ctx);
    if (!(args.amountUsd > 0)) {
      throw badRequest("Amount must be greater than zero.");
    }
    if (args.mode === "subscription" && args.plan) {
      const existing = await ctx.db
        .query("subscriptions")
        .withIndex("by_userId_and_plan", (q) =>
          q.eq("userId", userId).eq("plan", args.plan!),
        )
        .unique();
      if (
        existing &&
        existing.status === "active" &&
        (existing.currentPeriodEnd === undefined ||
          existing.currentPeriodEnd > Date.now())
      ) {
        throw new ConvexError({
          code: 409,
          message: `You already have an active ${args.plan} subscription.`,
        });
      }
    }
    const now = Date.now();
    const id = await ctx.db.insert("checkouts", {
      userId,
      item: args.item,
      mode: args.mode,
      crypto: args.crypto,
      amountUsd: args.amountUsd,
      credits: args.credits,
      plan: args.plan,
      intervalDays: args.intervalDays,
      currency: "usd",
      status: "pending",
      orderCode: args.orderCode,
      walletAddress: args.walletAddress,
      createdAt: now,
      updatedAt: now,
    });
    return { orderId: args.orderCode, rowId: id };
  },
});

export const linkShieldzInvoice = mutation({
  args: {
    orderCode: v.string(),
    invoiceId: v.string(),
    shieldzStatus: v.string(),
    paymentUrl: v.string(),
    status: v.union(v.literal("awaiting_payment"), v.literal("failed"), v.literal("expired")),
  },
  handler: async (ctx, args) => {
    const userId = await requireUserId(ctx);
    const checkout = await ctx.db
      .query("checkouts")
      .withIndex("by_orderCode", (q) => q.eq("orderCode", args.orderCode))
      .unique();
    if (!checkout || checkout.userId !== userId) {
      throw new ConvexError({ code: 404, message: "Order not found." });
    }
    if (checkout.status !== "pending" && checkout.status !== "awaiting_payment") {
      throw new ConvexError({
        code: 409,
        message: `Order is already ${checkout.status}.`,
      });
    }
    await ctx.db.patch("checkouts", checkout._id, {
      status: args.status,
      shieldzInvoiceId: args.invoiceId,
      shieldzStatus: args.shieldzStatus,
      paymentUrl: args.paymentUrl,
      updatedAt: Date.now(),
    });
    return { ok: true };
  },
});

export const getCheckout = query({
  args: { orderCode: v.string() },
  handler: async (ctx, args) => {
    const userId = await requireUserId(ctx);
    const checkout = await ctx.db
      .query("checkouts")
      .withIndex("by_orderCode", (q) => q.eq("orderCode", args.orderCode))
      .unique();
    if (!checkout || checkout.userId !== userId) return null;
    return checkout;
  },
});

/**
 * Port of the `fulfill_checkout` RPC. Secret-gated; called only by the Shieldz
 * webhook route via a server-side secret (never shipped to the browser).
 */
export const fulfillCheckout = mutation({
  args: {
    orderId: v.string(),
    webhookSecret: v.string(),
    paymentId: v.string(),
    paymentStatus: v.string(),
  },
  handler: async (ctx, args) => {
    const expected = process.env.CONVEX_WEBHOOK_SECRET ?? "";
    if (!expected || args.webhookSecret !== expected) {
      throw unauthorized("Bad webhook secret");
    }
    const checkout = await ctx.db
      .query("checkouts")
      .withIndex("by_orderCode", (q) => q.eq("orderCode", args.orderId))
      .unique();
    if (!checkout) {
      throw new ConvexError("ORDER_NOT_FOUND");
    }
    // Idempotency guard: already-paid orders are a no-op.
    if (checkout.status === "paid") {
      return { applied: false, reason: "already_paid" };
    }
    await ctx.db.patch("checkouts", checkout._id, {
      status: "paid",
      paidAt: Date.now(),
      fulfilledAt: Date.now(),
      shieldzInvoiceId:
        args.paymentId.trim() !== ""
          ? args.paymentId
          : checkout.shieldzInvoiceId,
      shieldzStatus: args.paymentStatus,
      updatedAt: Date.now(),
    });

    if (checkout.mode === "credits" && checkout.credits > 0) {
      // Idempotent credit, keyed on (referenceId=orderCode, type="PURCHASE").
      const existing = await ctx.db
        .query("tokenTransactions")
        .withIndex("by_referenceId_and_type", (q) =>
          q.eq("referenceId", checkout.orderCode).eq("type", "PURCHASE"),
        )
        .unique();
      if (!existing) {
        await ctx.db.insert("tokenTransactions", {
          userId: checkout.userId,
          amount: checkout.credits,
          type: "PURCHASE",
          referenceId: checkout.orderCode,
          description: checkout.item,
          createdAt: Date.now(),
        });
        const credits = await ctx.db
          .query("credits")
          .withIndex("by_userId", (q) => q.eq("userId", checkout.userId))
          .unique();
        const creditsDocId = credits
          ? credits._id
          : await ctx.db.insert("credits", {
              userId: checkout.userId,
              balance: 0,
              updatedAt: Date.now(),
            });
        const current = credits?.balance ?? 0;
        await ctx.db.patch("credits", creditsDocId, {
          balance: current + checkout.credits,
          updatedAt: Date.now(),
        });
      }
    }

    if (checkout.mode === "subscription" && checkout.plan) {
      await applySubscription(
        ctx,
        checkout.userId,
        checkout.plan,
        checkout.intervalDays ?? 30,
      );
    }

    return { applied: true };
  },
});

/**
 * Transition a checkout to failed/expired per the webhook, guarded the same way
 * as `fulfillCheckout`. Port of `applyNonPaid` (statuses: failed | expired).
 */
export const markCheckoutFailed = mutation({
  args: {
    orderId: v.string(),
    webhookSecret: v.string(),
    status: v.union(v.literal("failed"), v.literal("expired")),
    shieldzStatus: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const expected = process.env.CONVEX_WEBHOOK_SECRET ?? "";
    if (!expected || args.webhookSecret !== expected) {
      throw unauthorized("Bad webhook secret");
    }
    const checkout = await ctx.db
      .query("checkouts")
      .withIndex("by_orderCode", (q) => q.eq("orderCode", args.orderId))
      .unique();
    if (!checkout) return { applied: false, reason: "not_found" };
    if (checkout.status !== "awaiting_payment") {
      return { applied: false, reason: `status:${checkout.status}` };
    }
    await ctx.db.patch("checkouts", checkout._id, {
      status: args.status,
      shieldzStatus: args.shieldzStatus ?? args.status,
      updatedAt: Date.now(),
    });
    return { applied: true };
  },
});

export const recordWebhookDelivery = mutation({
  args: {
    webhookSecret: v.string(),
    deliveryId: v.string(),
    eventType: v.string(),
    invoiceId: v.string(),
    rawBody: v.optional(v.string()),
    handled: v.boolean(),
  },
  handler: async (ctx, args) => {
    const expected = process.env.CONVEX_WEBHOOK_SECRET ?? "";
    if (!expected || args.webhookSecret !== expected) {
      throw unauthorized("Bad webhook secret");
    }
    const existing = await ctx.db
      .query("shieldzWebhookDeliveries")
      .withIndex("by_deliveryId", (q) => q.eq("deliveryId", args.deliveryId))
      .unique();
    if (existing) return existing;
    return ctx.db.insert("shieldzWebhookDeliveries", {
      deliveryId: args.deliveryId,
      eventType: args.eventType,
      invoiceId: args.invoiceId,
      rawBody: args.rawBody,
      handled: args.handled,
      createdAt: Date.now(),
    });
  },
});

export const isDeliveryHandled = query({
  args: { webhookSecret: v.string(), deliveryId: v.string() },
  handler: async (ctx, args) => {
    const expected = process.env.CONVEX_WEBHOOK_SECRET ?? "";
    if (!expected || args.webhookSecret !== expected) {
      throw unauthorized("Bad webhook secret");
    }
    const existing = await ctx.db
      .query("shieldzWebhookDeliveries")
      .withIndex("by_deliveryId", (q) => q.eq("deliveryId", args.deliveryId))
      .unique();
    return Boolean(existing);
  },
});

export const findCheckoutByInvoice = query({
  args: { webhookSecret: v.string(), invoiceId: v.string() },
  handler: async (ctx, args) => {
    const expected = process.env.CONVEX_WEBHOOK_SECRET ?? "";
    if (!expected || args.webhookSecret !== expected) {
      throw unauthorized("Bad webhook secret");
    }
    const checkout = await ctx.db
      .query("checkouts")
      .withIndex("by_shieldzInvoiceId", (q) =>
        q.eq("shieldzInvoiceId", args.invoiceId),
      )
      .unique();
    return checkout ? { orderId: checkout.orderCode, mode: checkout.mode, credits: checkout.credits, plan: checkout.plan, amountUsd: checkout.amountUsd, item: checkout.item, userId: checkout.userId } : null;
  },
});