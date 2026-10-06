import { convexAuth } from "@convex-dev/auth/server";
import { Password } from "@convex-dev/auth/providers/Password";
import { Email } from "@convex-dev/auth/providers/Email";
import Google from "@auth/core/providers/google";
import Discord from "@auth/core/providers/discord";

/**
 * Sends the password-reset verification link. Uses Resend when
 * `AUTH_RESEND_KEY` is configured, otherwise logs the link to the server
 * console (development fallback). The link the auth server generates points at
 * `SITE_URL?code=…`; we rewrite it to `/reset-password` so the client can
 * redeem the code from that page.
 */
const ResetEmail = Email({
  async sendVerificationRequest({
    identifier: email,
    url,
  }: {
    identifier: string;
    url: string;
  }) {
    const link = new URL("/reset-password", url);
    link.searchParams.set("email", email);
    const resetUrl = link.toString();
    const apiKey = process.env.AUTH_RESEND_KEY;
    if (apiKey) {
      const res = await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${apiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          from: process.env.AUTH_EMAIL_FROM ?? "Chhikara Industries <auth@chhikaraindustries.example>",
          to: email,
          subject: "Reset your password",
          text: `Reset your password at ${resetUrl}`,
        }),
      });
      if (!res.ok) {
        console.error("Failed to send password reset email via Resend", await res.text());
      }
      return;
    }
    console.log(`[convex-auth] Password reset link for ${email}: ${resetUrl}`);
  },
});

export const { auth, signIn, signOut, store, isAuthenticated } = convexAuth({
  providers: [
    Password({
      reset: ResetEmail,
      // Captures the `name` field from the sign-up form.
      profile: (params) => {
        const name = params.name;
        return {
          email: params.email as string,
          ...(typeof name === "string" && name.trim().length > 0
            ? { name: name.trim() }
            : {}),
        };
      },
      // Mirrors the password rules the sign-up form enforces client-side.
      validatePasswordRequirements: (password) => {
        if (password.length < 8) {
          throw new Error("Use at least 8 characters");
        }
        if (!/[a-zA-Z]/.test(password)) {
          throw new Error("Include at least one letter");
        }
        if (!/[0-9]/.test(password)) {
          throw new Error("Include at least one number");
        }
      },
    }),
    Google,
    Discord,
  ],
  callbacks: {
    /**
     * Every new account starts on the free plan with a zero token balance.
     */
    async afterUserCreatedOrUpdated(ctx, { userId, existingUserId }) {
      if (existingUserId) return;
      const now = Date.now();
      await ctx.db.insert("subscriptions", {
        userId,
        plan: "free",
        status: "active",
        intervalDays: 30,
        updatedAt: now,
      });
      await ctx.db.insert("credits", { userId, balance: 0, updatedAt: now });
    },
  },
});