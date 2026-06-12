import Navbar from "@/components/ui/navbar";
import Link from "next/link";

export default function GettingStarted() {
  return (
    <>
      <Navbar />

      <main
        className="min-h-screen bg-black text-white pt-28 px-6"
        style={{ fontFamily: "Arial, sans-serif" }}
      >
        <div className="max-w-4xl mx-auto">

          {/* Header */}
          <div className="mb-12">

            <span className="inline-block rounded-full border border-cyan-500/30 bg-cyan-500/10 px-4 py-1 text-sm text-cyan-400">
              Documentation
            </span>

            <h1 className="mt-6 text-5xl font-bold">
              Getting Started
            </h1>

            <p className="mt-4 text-xl text-gray-400">
              Learn how to create an account, explore tools, and begin using
              Chhikara Industries products.
            </p>

          </div>

          {/* Introduction */}
          <section className="mb-12 rounded-2xl border border-white/10 bg-zinc-950 p-8">

            <h2 className="text-2xl font-bold">
              Welcome
            </h2>

            <p className="mt-4 text-gray-400 leading-relaxed">
              Chhikara Industries develops AI-powered software, browser
              extensions, and productivity tools designed to help users work
              faster and smarter.
            </p>

            <p className="mt-4 text-gray-400 leading-relaxed">
              This guide will walk you through creating an account,
              exploring available tools, and managing your subscription.
            </p>

          </section>

          {/* Step 1 */}
          <section className="mb-8 rounded-2xl border border-white/10 bg-zinc-950 p-8">

            <div className="flex items-center gap-4">

              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-cyan-500 text-black font-bold">
                1
              </div>

              <h2 className="text-2xl font-bold">
                Create an Account
              </h2>

            </div>

            <p className="mt-6 text-gray-400 leading-relaxed">
              Create your account using:
            </p>

            <ul className="mt-4 space-y-3 text-gray-300">
              <li>• Email & Password</li>
              <li>• Google Authentication</li>
              <li>• Discord Authentication</li>
            </ul>

            <Link
              href="/signup"
              className="mt-6 inline-flex rounded-lg bg-cyan-500 px-5 py-3 font-semibold text-black hover:bg-cyan-400 transition"
            >
              Create Account
            </Link>

          </section>

          {/* Step 2 */}
          <section className="mb-8 rounded-2xl border border-white/10 bg-zinc-950 p-8">

            <div className="flex items-center gap-4">

              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-cyan-500 text-black font-bold">
                2
              </div>

              <h2 className="text-2xl font-bold">
                Explore Available Tools
              </h2>

            </div>

            <p className="mt-6 text-gray-400 leading-relaxed">
              Visit the Tools page to browse all available products,
              browser extensions, and AI-powered services.
            </p>

            <Link
              href="/tools"
              className="mt-6 inline-flex rounded-lg border border-cyan-500 px-5 py-3 text-cyan-400 hover:bg-cyan-500/10 transition"
            >
              Browse Tools
            </Link>

          </section>

          {/* Step 3 */}
          <section className="mb-8 rounded-2xl border border-white/10 bg-zinc-950 p-8">

            <div className="flex items-center gap-4">

              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-cyan-500 text-black font-bold">
                3
              </div>

              <h2 className="text-2xl font-bold">
                Choose a Plan
              </h2>

            </div>

            <p className="mt-6 text-gray-400 leading-relaxed">
              Some tools may offer premium features through monthly
              subscriptions. Compare plans and upgrade whenever needed.
            </p>

            <Link
              href="/pricing"
              className="mt-6 inline-flex rounded-lg border border-cyan-500 px-5 py-3 text-cyan-400 hover:bg-cyan-500/10 transition"
            >
              View Pricing
            </Link>

          </section>

          {/* Step 4 */}
          <section className="mb-12 rounded-2xl border border-white/10 bg-zinc-950 p-8">

            <div className="flex items-center gap-4">

              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-cyan-500 text-black font-bold">
                4
              </div>

              <h2 className="text-2xl font-bold">
                Start Building
              </h2>

            </div>

            <p className="mt-6 text-gray-400 leading-relaxed">
              Once you're signed in, you'll have access to available tools,
              account settings, billing management, and future releases.
            </p>

          </section>

          {/* Next Steps */}
          <section className="rounded-2xl border border-cyan-500/20 bg-cyan-500/5 p-8">

            <h2 className="text-2xl font-bold">
              Next Steps
            </h2>

            <div className="mt-6 grid gap-4 md:grid-cols-2">

              <Link
                href="/docs/jobfit-resume"
                className="rounded-xl border border-white/10 bg-zinc-950 p-5 hover:border-cyan-400/40 transition"
              >
                <h3 className="font-bold text-lg">
                  JobFit Resume
                </h3>

                <p className="mt-2 text-gray-400 text-sm">
                  Learn how to install and use JobFit Resume.
                </p>
              </Link>

              <Link
                href="/docs/faq"
                className="rounded-xl border border-white/10 bg-zinc-950 p-5 hover:border-cyan-400/40 transition"
              >
                <h3 className="font-bold text-lg">
                  Frequently Asked Questions
                </h3>

                <p className="mt-2 text-gray-400 text-sm">
                  Find answers to common questions.
                </p>
              </Link>

            </div>

          </section>

        </div>
      </main>
    </>
  );
}