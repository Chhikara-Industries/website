import Footer from "@/components/ui/footer";
import Navbar from "@/components/ui/navbar";
import Link from "next/link";

export default function PricingPage() {
  return (
    <>
      <Navbar />

      <main
        className="min-h-screen bg-black text-white pt-28"
        style={{ fontFamily: "Arial, sans-serif" }}
      >
        {/* HERO */}
        <section className="text-center px-6">

          <h1 className="text-5xl font-bold">
            Pricing
          </h1>

          <p className="mt-4 text-gray-400 max-w-2xl mx-auto">
            Choose the plan that fits your workflow.
            Upgrade anytime.
          </p>

        </section>

        {/* PLANS */}
        <section className="py-16 px-6">

          <div className="max-w-6xl mx-auto grid gap-8 md:grid-cols-3">

            {/* FREE */}
            <div className="rounded-2xl border border-white/10 bg-zinc-950 p-8">

              <h2 className="text-2xl font-bold">
                Free
              </h2>

              <p className="text-5xl font-bold mt-6">
                $0
              </p>

              <p className="text-gray-500 mt-2">
                Forever
              </p>

              <ul className="mt-8 space-y-3 text-gray-400">
                <li>✓ Basic tools</li>
                <li>✓ Community support</li>
                <li>✓ Limited usage</li>
              </ul>

            </div>

            {/* PRO */}
            <div className="rounded-2xl border border-cyan-500 bg-zinc-950 p-8">

              <div className="inline-block rounded-full bg-cyan-500 px-3 py-1 text-black text-sm font-bold">
                POPULAR
              </div>

              <h2 className="text-2xl font-bold mt-4">
                Pro
              </h2>

              <p className="text-5xl font-bold mt-6">
                $9
              </p>

              <p className="text-gray-500 mt-2">
                per month
              </p>

              <ul className="mt-8 space-y-3 text-gray-400">
                <li>✓ Everything in Free</li>
                <li>✓ Unlimited usage</li>
                <li>✓ Priority support</li>
              </ul>

              <Link
                href="/billing"
                className="mt-8 block text-center rounded-lg bg-cyan-500 py-3 text-black font-semibold"
              >
                Subscribe
              </Link>

            </div>

            {/* ULTIMATE */}
            <div className="rounded-2xl border border-white/10 bg-zinc-950 p-8">

              <h2 className="text-2xl font-bold">
                Ultimate
              </h2>

              <p className="text-5xl font-bold mt-6">
                $19
              </p>

              <p className="text-gray-500 mt-2">
                per month
              </p>

              <ul className="mt-8 space-y-3 text-gray-400">
                <li>✓ Everything in Pro</li>
                <li>✓ Premium models</li>
                <li>✓ Early access features</li>
              </ul>

            </div>

          </div>

        </section>

        <section className="px-6 pb-20">

            <div className="max-w-6xl mx-auto">

                <h2 className="text-3xl font-bold mb-8">
                Compare Plans
                </h2>

                <div className="overflow-x-auto rounded-2xl border border-white/10">

                <table className="w-full">

                    <thead className="bg-zinc-900">
                    <tr>
                        <th className="text-left p-4">Feature</th>
                        <th className="p-4">Free</th>
                        <th className="p-4">Pro</th>
                        <th className="p-4">Ultimate</th>
                    </tr>
                    </thead>

                    <tbody>

                    <tr className="border-t border-white/10">
                        <td className="p-4">JobFit Resume</td>
                        <td className="text-center">✓</td>
                        <td className="text-center">✓</td>
                        <td className="text-center">✓</td>
                    </tr>

                    <tr className="border-t border-white/10">
                        <td className="p-4">Unlimited Usage</td>
                        <td className="text-center">—</td>
                        <td className="text-center">✓</td>
                        <td className="text-center">✓</td>
                    </tr>

                    <tr className="border-t border-white/10">
                        <td className="p-4">Premium AI Models</td>
                        <td className="text-center">—</td>
                        <td className="text-center">—</td>
                        <td className="text-center">✓</td>
                    </tr>

                    </tbody>

                </table>

                </div>

            </div>

        </section>

        </main>
        <Footer />
        </>
  )}