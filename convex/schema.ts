import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";
import { authTables } from "@convex-dev/auth/server";

/**
 * Convex Auth owns the `users` table (name, email, image, timestamps), so no
 * separate profiles table is needed here.
 */
export default defineSchema({
  ...authTables,

  subscriptions: defineTable({
    userId: v.id("users"),
    plan: v.string(),
    status: v.string(),
    intervalDays: v.number(),
    currentPeriodStart: v.optional(v.number()),
    currentPeriodEnd: v.optional(v.number()),
    cancelledAt: v.optional(v.number()),
    updatedAt: v.number(),
  })
    .index("by_userId", ["userId"])
    .index("by_userId_and_plan", ["userId", "plan"]),

  credits: defineTable({
    userId: v.id("users"),
    balance: v.number(),
    /** Bumped on every mutation; used as the optimistic-concurrency token. */
    updatedAt: v.number(),
  }).index("by_userId", ["userId"]),

  apiKeys: defineTable({
    userId: v.id("users"),
    name: v.string(),
    prefix: v.string(),
    secretHash: v.string(),
    scopes: v.array(v.string()),
    createdAt: v.number(),
    lastUsedAt: v.optional(v.number()),
    revokedAt: v.optional(v.number()),
  })
    .index("by_userId", ["userId"])
    .index("by_secretHash", ["secretHash"]),

  apiUsage: defineTable({
    userId: v.id("users"),
    api: v.string(),
    keyId: v.optional(v.id("apiKeys")),
    /** UTC day bucket, `YYYY-MM-DD`. */
    day: v.string(),
    requests: v.number(),
    tokens: v.number(),
    errors: v.number(),
  })
    .index("by_userId_api_day", ["userId", "api", "day"])
    .index("by_userId", ["userId"]),

  checkouts: defineTable({
    userId: v.id("users"),
    item: v.string(),
    mode: v.union(v.literal("credits"), v.literal("subscription")),
    crypto: v.string(),
    amountUsd: v.number(),
    credits: v.number(),
    plan: v.optional(v.string()),
    intervalDays: v.optional(v.number()),
    currency: v.string(),
    status: v.union(
      v.literal("pending"),
      v.literal("awaiting_payment"),
      v.literal("paid"),
      v.literal("failed"),
      v.literal("expired"),
    ),
    /** Doubles as the Shieldz idempotency key. */
    orderCode: v.string(),
    shieldzInvoiceId: v.optional(v.string()),
    shieldzStatus: v.optional(v.string()),
    paymentUrl: v.optional(v.string()),
    walletAddress: v.optional(v.string()),
    fulfilledAt: v.optional(v.number()),
    paidAt: v.optional(v.number()),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_userId", ["userId"])
    .index("by_orderCode", ["orderCode"])
    .index("by_shieldzInvoiceId", ["shieldzInvoiceId"])
    .index("by_userId_and_plan", ["userId", "plan"])
    .index("by_status", ["status"]),

  shieldzWebhookDeliveries: defineTable({
    deliveryId: v.string(),
    eventType: v.string(),
    invoiceId: v.string(),
    rawBody: v.optional(v.string()),
    handled: v.boolean(),
    createdAt: v.number(),
  })
    .index("by_invoiceId", ["invoiceId"])
    .index("by_deliveryId", ["deliveryId"]),

  tokenTransactions: defineTable({
    userId: v.id("users"),
    /** Signed: positive credits, negative spend. */
    amount: v.number(),
    type: v.string(),
    /** Idempotency key, unique per `type`. */
    referenceId: v.string(),
    description: v.optional(v.string()),
    createdAt: v.number(),
  })
    .index("by_userId", ["userId"])
    .index("by_referenceId_and_type", ["referenceId", "type"]),
});
