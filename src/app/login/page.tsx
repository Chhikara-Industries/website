"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { supabase } from "@/lib/supabaseClient";
import Navbar from "@/components/ui/navbar";
import Footer from "@/components/ui/footer";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  async function loginWithEmail() {
    try {
      setLoading(true);
      setMessage("");

      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        setMessage(error.message);
        return;
      }

      window.location.href = "/dashboard";
    } catch (error) {
      console.error(error);
      setMessage("Something went wrong.");
    } finally {
      setLoading(false);
    }
  }

  async function loginWithGoogle() {
    await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: `${window.location.origin}/dashboard`,
      },
    });
  }

  async function loginWithDiscord() {
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
        className="min-h-screen bg-black flex items-center justify-center px-4 pt-20 pb-8"
        style={{ fontFamily: "Arial, sans-serif" }}
      >
        <div className="w-full max-w-sm rounded-2xl border border-white/10 bg-zinc-950 p-6 shadow-[0_0_40px_rgba(34,211,238,0.1)]">

          <h1 className="text-2xl font-bold text-center text-white">
            Welcome Back
          </h1>

          <p className="text-center text-sm text-gray-400 mt-1">
            Sign in to your account
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
              onClick={loginWithEmail}
              disabled={loading}
              className="w-full rounded-lg bg-cyan-500 py-2.5 font-semibold text-black hover:bg-cyan-400 transition disabled:opacity-50"
            >
              {loading ? "Signing In..." : "Sign In"}
            </button>

          </div>

          <div className="mt-3 text-right">
            <Link
              href="/forgot-password"
              className="text-sm text-cyan-400 hover:text-cyan-300"
            >
              Forgot Password?
            </Link>
          </div>

          <div className="my-5 flex items-center gap-3">
            <div className="h-px flex-1 bg-white/10" />
            <span className="text-xs text-gray-500">OR</span>
            <div className="h-px flex-1 bg-white/10" />
          </div>

          <div className="space-y-3">

            <button
              onClick={loginWithGoogle}
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
              onClick={loginWithDiscord}
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
            Don't have an account?{" "}
            <Link
              href="/signup"
              className="text-cyan-400 hover:text-cyan-300"
            >
              Create Account
            </Link>
          </p>

        </div>
      </main>
      <Footer />
    </>
  );
}