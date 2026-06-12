"use client";

import Link from "next/link";

export default function Navbar() {
  return (
    <nav className="fixed top-0 left-0 w-full z-50 border-b border-white/10 bg-black/70 backdrop-blur-md" style={{fontFamily: "arial, sans-seif"}}>
      <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">

        {/* Logo */}
        <Link
          href="/"
          className="text-2xl font-bold text-white"
        >
          <img src="/logo.png" alt="" className="w-auto h-[50px] mt-2"/>
        </Link>

        {/* Center Links */}
        <div className="hidden md:flex items-center gap-8">
          <Link
            href="/"
            className="text-gray-300 hover:text-cyan-400 transition"
          >
            Home
          </Link>

          <Link
            href="/tools"
            className="text-gray-300 hover:text-cyan-400 transition"
          >
            Tools
          </Link>

          <Link
            href="/pricing"
            className="text-gray-300 hover:text-cyan-400 transition"
          >
            Pricing
          </Link>

          <Link
            href="/docs"
            className="text-gray-300 hover:text-cyan-400 transition"
          >
            Docs
          </Link>
        </div>

        {/* Right Side */}
        <div className="flex items-center gap-3">

          <Link
            href="/login"
            className="px-4 py-2 rounded-lg border border-white/10 text-gray-300 hover:bg-white/5 transition"
          >
            Login
          </Link>

          <Link
            href="/signup"
            className="px-4 py-2 rounded-lg bg-cyan-500 hover:bg-cyan-400 text-black font-semibold transition"
          >
            Sign Up
          </Link>

        </div>

      </div>
    </nav>
  );
}