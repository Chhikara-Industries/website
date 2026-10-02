import { v } from "convex/values";
import { internalMutation } from "./_generated/server";

/** Internal mutations driven by the Slicky actions, never by clients. */
export const touchKey = internalMutation({
  args: { id: v.id("apiKeys") },
  handler: async (ctx, args) => {
    await ctx.db.patch("apiKeys", args.id, { lastUsedAt: Date.now() });
    return null;
  },
});

export const createRoomDb = internalMutation({
  args: { code: v.string(), name: v.string(), userId: v.id("users") },
  handler: async (ctx, args) => {
    const existing = await ctx.db
      .query("slickyRooms")
      .withIndex("by_code", (q) => q.eq("code", args.code))
      .unique();
    if (existing) return { ok: false as const, reason: "code_taken" };
    const roomId = await ctx.db.insert("slickyRooms", {
      code: args.code,
      name: args.name,
      createdBy: args.userId,
      createdAt: Date.now(),
    });
    await ctx.db.insert("slickyRoomMembers", {
      roomCode: args.code,
      userId: args.userId,
      joinedAt: Date.now(),
    });
    return { ok: true as const, roomId };
  },
});

export const joinRoomDb = internalMutation({
  args: { code: v.string(), userId: v.id("users") },
  handler: async (ctx, args) => {
    const existing = await ctx.db
      .query("slickyRoomMembers")
      .withIndex("by_roomCode", (q) => q.eq("roomCode", args.code))
      .filter((q) => q.eq(q.field("userId"), args.userId))
      .first();
    if (!existing) {
      await ctx.db.insert("slickyRoomMembers", {
        roomCode: args.code,
        userId: args.userId,
        joinedAt: Date.now(),
      });
    }
    return { ok: true };
  },
});

export const insertMessage = internalMutation({
  args: {
    roomCode: v.string(),
    userId: v.id("users"),
    contentType: v.string(),
    content: v.optional(v.string()),
    attachmentId: v.optional(v.id("_storage")),
    attachmentMime: v.optional(v.string()),
    attachmentName: v.optional(v.string()),
    cost: v.number(),
  },
  handler: async (ctx, args) => {
    return ctx.db.insert("slickyMessages", {
      roomCode: args.roomCode,
      userId: args.userId,
      contentType: args.contentType,
      content: args.content,
      attachmentId: args.attachmentId,
      attachmentMime: args.attachmentMime,
      attachmentName: args.attachmentName,
      cost: args.cost,
      createdAt: Date.now(),
    });
  },
});

export const deleteMessage = internalMutation({
  args: { messageId: v.id("slickyMessages") },
  handler: async (ctx, args) => {
    await ctx.db.delete("slickyMessages", args.messageId);
    return null;
  },
});

export const logUsage = internalMutation({
  args: {
    keyId: v.optional(v.id("apiKeys")),
    userId: v.id("users"),
    cost: v.number(),
  },
  handler: async (ctx, args) => {
    const api = "slicky-chat";
    const day = new Date().toISOString().slice(0, 10);
    const existing = await ctx.db
      .query("apiUsage")
      .withIndex("by_userId_api_day", (q) =>
        q.eq("userId", args.userId).eq("api", api).eq("day", day),
      )
      .unique();
    if (existing) {
      await ctx.db.patch("apiUsage", existing._id, {
        requests: existing.requests + 1,
        tokens: existing.tokens + args.cost,
      });
    } else {
      await ctx.db.insert("apiUsage", {
        userId: args.userId,
        api,
        keyId: args.keyId,
        day,
        requests: 1,
        tokens: args.cost,
        errors: 0,
      });
    }
    return null;
  },
});