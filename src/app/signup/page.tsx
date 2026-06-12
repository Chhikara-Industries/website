"use client";

import { useState } from "react";
import Image from "next/image";
import { supabase } from "@/lib/supabaseClient";
import Navbar from "@/components/ui/navbar";
import Footer from "@/components/ui/footer";

export default function SignupPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  async function signUpWithEmail() {
    try {
      setLoading(true);
      setMessage("");

      const { error } = await supabase.auth.signUp({
        email,
        password,
      });

      if (error) {
        setMessage(error.message);
        return;
      }

      setMessage(
        "Account created successfully. Check your email for verification."
      );

      setEmail("");
      setPassword("");
    } catch (error) {
      console.error(error);
      setMessage("Something went wrong.");
    } finally {
      setLoading(false);
    }
  }

  async function signUpWithGoogle() {
    await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: `${window.location.origin}/dashboard`,
      },
    });
  }

  async function signUpWithDiscord() {
    await supabase.auth.signInWithOAuth({
      provider: "discord",
      options: {
        redirectTo: `${window.location.origin}/dashboard`,
      },
    });
  }

  return (
    <>
      <Navbar />

      <main
        className="min-h-screen bg-black flex items-center justify-center px-4 pt-20"
        style={{ fontFamily: "Arial, sans-serif" }}
      >
        <div className="w-full max-w-sm rounded-2xl border border-white/10 bg-zinc-950 p-6 shadow-[0_0_40px_rgba(34,211,238,0.1)]">

          <h1 className="text-2xl font-bold text-center text-white">
            Create Account
          </h1>

          <p className="text-center text-sm text-gray-400 mt-1">
            Join the AI tools platform
          </p>

          <div className="mt-6 space-y-3">

            <input
              type="email"
              placeholder="Email Address"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full rounded-lg border border-white/10 bg-zinc-900 px-4 py-2.5 text-white outline-none focus:border-cyan-400"
            />

            <input
              type="password"
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full rounded-lg border border-white/10 bg-zinc-900 px-4 py-2.5 text-white outline-none focus:border-cyan-400"
            />

            <button
              onClick={signUpWithEmail}
              disabled={loading}
              className="w-full rounded-lg bg-cyan-500 py-2.5 font-semibold text-black hover:bg-cyan-400 transition disabled:opacity-50"
            >
              {loading ? "Creating Account..." : "Create Account"}
            </button>

          </div>

          <div className="my-5 flex items-center gap-3">
            <div className="h-px flex-1 bg-white/10" />
            <span className="text-xs text-gray-500">OR</span>
            <div className="h-px flex-1 bg-white/10" />
          </div>

          <div className="space-y-3">

            <button
              onClick={signUpWithGoogle}
              className="w-full flex items-center justify-center gap-3 rounded-lg bg-white py-2.5 text-black font-medium hover:bg-gray-200 transition"
            >
              <Image
                src="/google.svg"
                alt="Google"
                width={20}
                height={20}
              />

              Continue with Google
            </button>

            <button
              onClick={signUpWithDiscord}
              className="w-full flex items-center justify-center gap-3 rounded-lg bg-indigo-700 py-2.5 text-white font-medium hover:bg-indigo-600 transition"
            >
              <Image
                src="/discord.svg"
                alt="Discord"
                width={20}
                height={20}
              />

              Continue with Discord
            </button>

          </div>

          {message && (
            <div className="mt-5 rounded-lg border border-white/10 bg-zinc-900 p-3 text-sm text-gray-300">
              {message}
            </div>
          )}

          <p className="mt-5 text-center text-sm text-gray-400">
            Already have an account?{" "}
            <a
              href="/login"
              className="text-cyan-400 hover:text-cyan-300"
            >
              Login
            </a>
          </p>

        </div>
      </main>
      <Footer />
    </>
  );
}