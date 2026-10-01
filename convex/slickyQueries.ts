import { v } from "convex/values";
import { internalQuery } from "./_generated/server";

/** Internal read helpers used by the Slicky actions (actions have no ctx.db). */
export const getKeyByHash = internalQuery({
  args: { secretHash: v.string() },
  handler: async (ctx, args) => {
    return ctx.db
      .query("apiKeys")
      .withIndex("by_secretHash", (q) => q.eq("secretHash", args.secretHash))
      .unique();
  },
});

export const getUser = internalQuery({
  args: { id: v.id("users") },
  handler: async (ctx, args) => ctx.db.get("users", args.id),
});

export const getCredits = internalQuery({
  args: { userId: v.id("users") },
  handler: async (ctx, args) =>
    ctx.db
      .query("credits")
      .withIndex("by_userId", (q) => q.eq("userId", args.userId))
      .unique(),
});

export const getRoomByCode = internalQuery({
  args: { code: v.string() },
  handler: async (ctx, args) =>
    ctx.db
      .query("slickyRooms")
      .withIndex("by_code", (q) => q.eq("code", args.code))
      .unique(),
});

export const getMembershipsByUser = internalQuery({
  args: { userId: v.id("users") },
  handler: async (ctx, args) =>
    ctx.db
      .query("slickyRoomMembers")
      .withIndex("by_userId", (q) => q.eq("userId", args.userId))
      .collect(),
});

export const getMessagesByRoom = internalQuery({
  args: { roomCode: v.string(), limit: v.number() },
  handler: async (ctx, args) =>
    ctx.db
      .query("slickyMessages")
      .withIndex("by_roomCode", (q) => q.eq("roomCode", args.roomCode))
      .order("desc")
      .take(args.limit),
});