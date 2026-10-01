import { ConvexError } from "convex/values";
import { MutationCtx, QueryCtx } from "../_generated/server";
import { getAuthUserId } from "@convex-dev/auth/server";
import { Id } from "../_generated/dataModel";

export function unauthorized(message = "Not authenticated") {
  return new ConvexError({ code: 401, message });
}

export function badRequest(message: string) {
  return new ConvexError({ code: 400, message });
}

export async function requireUserId(
  ctx: QueryCtx | MutationCtx,
): Promise<Id<"users">> {
  const userId = await getAuthUserId(ctx);
  if (userId === null) {
    throw unauthorized();
  }
  return userId;
}

export async function optionalUserId(
  ctx: QueryCtx | MutationCtx,
): Promise<Id<"users"> | null> {
  return getAuthUserId(ctx);
}

/**
 * Reads Convex Auth's `users` row as the app-facing profile.
 * Matches the shape the old `profiles` table exposed.
 */
export async function profileOf(ctx: QueryCtx | MutationCtx, userId: Id<"users">) {
  const user = await ctx.db.get("users", userId);
  if (!user) return null;
  return {
    id: user._id,
    email: user.email ?? undefined,
    name: user.name ?? null,
    avatarUrl: user.image ?? null,
  };
}