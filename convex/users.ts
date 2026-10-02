import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { requireUserId, optionalUserId, profileOf, badRequest } from "./lib/helpers";

/** Current user's profile, or null when signed out. Used by the navbar/DAL. */
export const me = query({
  args: {},
  handler: async (ctx) => {
    const userId = await optionalUserId(ctx);
    if (userId === null) return null;
    return profileOf(ctx, userId);
  },
});

export const updateProfile = mutation({
  args: { name: v.string() },
  handler: async (ctx, args) => {
    const userId = await requireUserId(ctx);
    const name = args.name.trim();
    if (name.length < 2) {
      throw badRequest("Name must be at least 2 characters.");
    }
    await ctx.db.patch("users", userId, { name });
    return { message: "Profile updated." };
  },
});