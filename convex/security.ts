import { v } from "convex/values";
import { action } from "./_generated/server";
import { getAuthUserId, modifyAccountCredentials, signInViaProvider } from "@convex-dev/auth/server";
import { Password } from "@convex-dev/auth/providers/Password";
import { api } from "./_generated/api";
import { badRequest, unauthorized } from "./lib/helpers";

/**
 * Port of the `updatePassword` server action. Verifies the current password by
 * attempting a password sign-in, then swaps in the new secret.
 */
export const updatePassword = action({
  args: {
    currentPassword: v.string(),
    newPassword: v.string(),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (userId === null) throw unauthorized("Not authenticated");

    const password = args.newPassword;
    if (password.length < 8) {
      throw badRequest("Password must be at least 8 characters.");
    }
    if (!/[A-Za-z]/.test(password) || !/[0-9]/.test(password)) {
      throw badRequest("Password must contain a letter and a number.");
    }

    const me = await ctx.runQuery(api.users.me);
    if (!me?.email) throw badRequest("Account has no email to update.");

    try {
      const result = await signInViaProvider(
        ctx as never,
        Password(),
        {
          params: {
            email: me.email,
            password: args.currentPassword,
            flow: "signIn",
          },
        },
      );
      if (!result || result.userId !== userId) {
        throw badRequest("Current password is incorrect.");
      }
    } catch (err) {
      if (err instanceof Error && err.message === "Current password is incorrect.") {
        throw err;
      }
      throw badRequest("Current password is incorrect.");
    }

    await modifyAccountCredentials(ctx, {
      provider: "password",
      account: { id: me.email, secret: password },
    });

    return { message: "Password updated." };
  },
});