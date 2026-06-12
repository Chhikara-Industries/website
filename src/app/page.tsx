import Navbar from "@/components/ui/navbar";
import Link from "next/link";
import Footer from "@/components/ui/footer";
import { Button } from "@/components/ui/button";

export default function Home() {
  return (
    <main
      className="min-h-screen bg-black text-white"
      style={{ fontFamily: "Arial, sans-serif" }}
    >
      <Navbar />

      {/* HERO */}
      <section className="relative h-screen flex items-center justify-center overflow-hidden">

        {/* Background */}
        <img
          src="/hero.jpg"
          alt="Background"
          className="absolute inset-0 h-full w-full object-cover"
        />

        {/* Overlay */}
        <div className="absolute inset-0 bg-black/75" />

        {/* Content */}
        <div className="relative z-10 text-center px-6 max-w-4xl">

          <h1 className="text-5xl md:text-7xl font-bold leading-tight">
            Build the Future of{" "}
            <span className="text-cyan-400 drop-shadow-[0_0_20px_rgba(34,211,238,0.8)]">
              AI Tools
            </span>
          </h1>

          <p className="mt-6 text-lg md:text-xl text-gray-300">
            One platform for AI-powered apps, browser extensions,
            automation tools, and developer utilities.
          </p>

          <div className="mt-10 flex justify-center gap-4">

            <Link
              href="/signup"
              className="px-7 py-3 rounded-lg bg-cyan-500 hover:bg-cyan-400 text-black font-semibold transition"
            >
              Get Started
            </Link>

            <Link
              href="/tools"
              className="px-7 py-3 rounded-lg border border-white/20 hover:bg-white/10 transition"
            >
              Explore Tools
            </Link>

          </div>

        </div>
      </section>

      {/* TOOLS SECTION */}
      <section className="py-24 px-6 bg-gradient-to-b from-black to-zinc-950">

        <div className="max-w-7xl mx-auto">

          <div className="text-center mb-14">

            <h2 className="text-4xl font-bold">
              Featured Tools
            </h2>

            <p className="text-gray-400 mt-3">
              AI-powered software built to save time and increase productivity.
            </p>

          </div>

          <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">

            {/* CARD 1 */}
            <div className="bg-zinc-900 border border-white/10 rounded-2xl overflow-hidden h-[500px] flex flex-col hover:border-cyan-400/40 transition">

              <div className="h-64 flex items-center justify-center bg-[#100F0D]">
                <img
                  src="/JobFit-Resume.png"
                  alt="JobFit Resume"
                  className="w-[200px] h-[200px] object-contain"
                />
              </div>

              <div className="p-6 flex flex-col flex-1">

                <h3 className="text-xl font-bold">
                  JobFit Resume
                </h3>

                <p className="mt-3 text-gray-400 flex-1">
                  Chrome extension that analyzes job descriptions
                  and matches them against multiple resumes to
                  determine the best fit.
                </p>

                <div className="mt-6 flex gap-3">

                  <Link
                    href="#"
                    className="flex-1 text-center py-2 rounded-lg bg-cyan-500 hover:bg-cyan-400 text-black font-medium"
                  >
                    Download
                  </Link>

                  <Link
                    href="#"
                    className="flex-1 text-center py-2 rounded-lg border border-cyan-500 text-cyan-400 hover:bg-cyan-500/10"
                  >
                    Source
                  </Link>

                </div>

              </div>

            </div>

          </div>

        </div>
      </section>
      {/* PRICING */}
      <section className="py-24 px-6 bg-black">

        <div className="max-w-6xl mx-auto">

          <div className="text-center mb-14">
            <h2 className="text-4xl font-bold">
              Pricing
            </h2>

            <p className="text-gray-400 mt-3">
              Simple plans for everyone.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">

            {/* FREE */}
            <div className="bg-zinc-900 border border-white/10 rounded-2xl p-8">

              <h3 className="text-2xl font-bold">Free</h3>

              <p className="text-5xl font-bold mt-6">
                $0
              </p>

              <p className="text-gray-500">Forever</p>

              <ul className="mt-6 space-y-3 text-gray-400">
                <li>✓ Basic tools</li>
                <li>✓ Community support</li>
                <li>✓ Limited usage</li>
              </ul>

              <Link
                href="/signup"
                className="mt-28 block text-center rounded-lg bg-cyan-500 py-3 text-black font-semibold"
              >
                Get Started
              </Link>
            </div>

            {/* PRO */}
            <div className="bg-zinc-900 border border-cyan-500 rounded-2xl p-8">

              <span className="inline-block px-3 py-1 rounded-full bg-cyan-500 text-black text-sm font-bold">
                MOST POPULAR
              </span>

              <h3 className="text-2xl font-bold mt-4">
                Pro
              </h3>

              <p className="text-5xl font-bold mt-6">
                $9
              </p>

              <p className="text-gray-500">/ month</p>

              <ul className="mt-6 space-y-3 text-gray-400">
                <li>✓ Everything in Free</li>
                <li>✓ Unlimited usage</li>
                <li>✓ Priority support</li>
                <li>✓ Early access</li>
              </ul>
              <Link
                href="/billing"
                className="mt-8 block text-center rounded-lg bg-cyan-500 py-3 text-black font-semibold"
              >
                Subscribe
              </Link>
            </div>

            {/* ULTIMATE */}
            <div className="bg-zinc-900 border border-white/10 rounded-2xl p-8">

              <h3 className="text-2xl font-bold">
                Ultimate
              </h3>

              <p className="text-5xl font-bold mt-6">
                $19
              </p>

              <p className="text-gray-500">/ month</p>

              <ul className="mt-6 space-y-3 text-gray-400">
                <li>✓ Everything in Pro</li>
                <li>✓ Premium AI models</li>
                <li>✓ Beta features</li>
                <li>✓ Dedicated support</li>
              </ul>
              <Link
                href="/billing"
                className="mt-18 block text-center rounded-lg bg-cyan-500 py-3 text-black font-semibold"
              >
                Subscribe
              </Link>
            </div>

          </div>

        </div>

      </section>
      {/* WHY CHOOSE US */}
      <section className="py-24 px-6 bg-zinc-950">

        <div className="max-w-6xl mx-auto">

          <div className="text-center mb-14">
            <h2 className="text-4xl font-bold">
              Why Choose Us
            </h2>

            <p className="text-gray-400 mt-3">
              Built for speed, privacy, and productivity.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">

            <div className="bg-zinc-900 border border-white/10 rounded-2xl p-8">
              <h3 className="text-2xl font-bold text-cyan-400">⚡ Fast</h3>

              <p className="mt-4 text-gray-400">
                AI-powered tools that save hours of manual work.
              </p>
            </div>

            <div className="bg-zinc-900 border border-white/10 rounded-2xl p-8">
              <h3 className="text-2xl font-bold text-cyan-400">🔒 Secure</h3>

              <p className="mt-4 text-gray-400">
                Built with modern authentication and secure cloud services.
              </p>
            </div>

            <div className="bg-zinc-900 border border-white/10 rounded-2xl p-8">
              <h3 className="text-2xl font-bold text-cyan-400">🧠 Smart</h3>

              <p className="mt-4 text-gray-400">
                Powered by advanced AI models and automation workflows.
              </p>
            </div>

          </div>

        </div>

      </section>
      {/* FOOTER */}
      <Footer />
    </main>
  );
}