import Navbar from "@/components/ui/navbar";
import Footer from "@/components/ui/footer";
import Link from "next/link";

export default function Pricing() {
  return (
    <>
      <Navbar />

      <main
        className="min-h-screen bg-black text-white pt-28 px-6"
        style={{ fontFamily: "Arial, sans-serif" }}
      >
        <div className="max-w-5xl mx-auto">

          {/* Header */}
          <div className="mb-12">

            <span className="inline-block rounded-full border border-cyan-500/30 bg-cyan-500/10 px-4 py-1 text-sm text-cyan-400">
              Documentation
            </span>

            <h1 className="mt-6 text-5xl font-bold">
              Pricing & Billing
            </h1>

            <p className="mt-4 text-xl text-gray-400">
              Learn how subscriptions, billing, upgrades, and future plans
              work across Chhikara Industries products.
            </p>

          </div>

          {/* Overview */}
          <section className="mb-8 rounded-2xl border border-white/10 bg-zinc-950 p-8">

            <h2 className="text-2xl font-bold">
              Overview
            </h2>

            <p className="mt-6 text-gray-400 leading-relaxed">
              Chhikara Industries offers both free and premium products.
              Some tools may be completely free, while others may offer
              additional features through subscriptions.
            </p>

            <p className="mt-4 text-gray-400 leading-relaxed">
              Pricing may vary between products. Always check the latest
              pricing information before purchasing.
            </p>

          </section>

          {/* Plans */}
          <section className="mb-8 rounded-2xl border border-white/10 bg-zinc-950 p-8">

            <h2 className="text-2xl font-bold">
                Available Plans
            </h2>

            <div className="mt-8 grid gap-6 md:grid-cols-3">

                {/* FREE */}
                <div className="rounded-xl border border-white/10 bg-black/40 p-6">

                <h3 className="text-xl font-bold">
                    Free
                </h3>

                <p className="mt-4 text-4xl font-bold">
                    $0
                </p>

                <p className="mt-2 text-gray-500">
                    Forever
                </p>

                <ul className="mt-6 space-y-2 text-gray-400">
                    <li>✓ Basic tools</li>
                    <li>✓ Community support</li>
                    <li>✓ Limited usage</li>
                </ul>

                </div>

                {/* PRO */}
                <div className="rounded-xl border border-cyan-500 bg-black/40 p-6">

                <span className="rounded-full bg-cyan-500 px-3 py-1 text-xs font-bold text-black">
                    POPULAR
                </span>

                <h3 className="mt-4 text-xl font-bold">
                    Pro
                </h3>

                <p className="mt-4 text-4xl font-bold">
                    $9
                </p>

                <p className="mt-2 text-gray-500">
                    per month
                </p>

                <ul className="mt-6 space-y-2 text-gray-400">
                    <li>✓ Everything in Free</li>
                    <li>✓ Unlimited usage</li>
                    <li>✓ Priority support</li>
                </ul>

                </div>

                {/* ULTIMATE */}
                <div className="rounded-xl border border-white/10 bg-black/40 p-6">

                <h3 className="text-xl font-bold">
                    Ultimate
                </h3>

                <p className="mt-4 text-4xl font-bold">
                    $19
                </p>

                <p className="mt-2 text-gray-500">
                    per month
                </p>

                <ul className="mt-6 space-y-2 text-gray-400">
                    <li>✓ Everything in Pro</li>
                    <li>✓ Premium AI Models</li>
                    <li>✓ Early Access Features</li>
                </ul>

                </div>

            </div>

            </section>

          {/* Feature Comparision */}

          <section className="mb-8 rounded-2xl border border-white/10 bg-zinc-950 p-8">

            <h2 className="text-2xl font-bold">
                Feature Comparison
            </h2>

            <div className="mt-6 overflow-x-auto rounded-xl border border-white/10">

                <table className="w-full">

                <thead className="bg-zinc-900">
                    <tr>
                    <th className="p-4 text-left">Feature</th>
                    <th className="p-4 text-center">Free</th>
                    <th className="p-4 text-center">Pro</th>
                    <th className="p-4 text-center">Ultimate</th>
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

                    <tr className="border-t border-white/10">
                    <td className="p-4">Priority Support</td>
                    <td className="text-center">—</td>
                    <td className="text-center">✓</td>
                    <td className="text-center">✓</td>
                    </tr>

                    <tr className="border-t border-white/10">
                    <td className="p-4">Early Access Features</td>
                    <td className="text-center">—</td>
                    <td className="text-center">—</td>
                    <td className="text-center">✓</td>
                    </tr>

                </tbody>

                </table>

            </div>

            </section>

          {/* Billing */}
          <section className="mb-8 rounded-2xl border border-white/10 bg-zinc-950 p-8">

            <h2 className="text-2xl font-bold">
              Billing
            </h2>

            <div className="mt-6 space-y-4 text-gray-400">

              <p>
                Subscriptions are billed monthly unless otherwise stated.
              </p>

              <p>
                You can manage your billing information from your account
                dashboard once billing becomes available.
              </p>

              <p>
                Future payment methods may include:
              </p>

              <ul className="ml-6 list-disc space-y-2">
                <li>Credit / Debit Cards</li>
                <li>Cryptocurrency</li>
                <li>Additional Payment Providers</li>
              </ul>

            </div>

          </section>

          {/* Upgrades */}
          <section className="mb-8 rounded-2xl border border-white/10 bg-zinc-950 p-8">

            <h2 className="text-2xl font-bold">
              Upgrading & Downgrading
            </h2>

            <div className="mt-6 space-y-4 text-gray-400">

              <p>
                Users may upgrade their subscription at any time.
              </p>

              <p>
                Downgrades will typically take effect at the end of the
                current billing period.
              </p>

              <p>
                Access to premium features may be removed after a downgrade
                or cancellation.
              </p>

            </div>

          </section>

          {/* Refunds */}
          <section className="mb-8 rounded-2xl border border-white/10 bg-zinc-950 p-8">

            <h2 className="text-2xl font-bold">
              Refund Policy
            </h2>

            <div className="mt-6 space-y-4 text-gray-400">

              <p>
                Refund policies may vary depending on the product and
                payment provider used.
              </p>

              <p>
                If you experience billing issues, contact support before
                requesting a chargeback.
              </p>

              <p>
                Additional refund information will be published when paid
                plans launch.
              </p>

            </div>

          </section>

          {/* FAQ */}
          <section className="mb-12 rounded-2xl border border-white/10 bg-zinc-950 p-8">

            <h2 className="text-2xl font-bold">
              Frequently Asked Questions
            </h2>

            <div className="mt-8 space-y-6">

              <div>
                <h3 className="font-semibold">
                  Do I need to pay to use every tool?
                </h3>

                <p className="mt-2 text-gray-400">
                  No. Some tools may remain free while others may offer
                  optional premium features.
                </p>
              </div>

              <div>
                <h3 className="font-semibold">
                  Can pricing change?
                </h3>

                <p className="mt-2 text-gray-400">
                  Yes. Pricing may change as products evolve and new
                  features are added.
                </p>
              </div>

              <div>
                <h3 className="font-semibold">
                  Where can I manage subscriptions?
                </h3>

                <p className="mt-2 text-gray-400">
                  Subscription management will be available through your
                  account dashboard.
                </p>
              </div>

            </div>

          </section>

          {/* CTA */}
          <section className="mb-12 rounded-2xl border border-cyan-500/20 bg-cyan-500/5 p-8 text-center">

            <h2 className="text-3xl font-bold">
              Ready to Get Started?
            </h2>

            <p className="mt-4 text-gray-400">
              Create an account and start exploring available tools.
            </p>

            <div className="mt-8 flex flex-wrap justify-center gap-4">

              <Link
                href="/signup"
                className="rounded-lg bg-cyan-500 px-6 py-3 font-semibold text-black hover:bg-cyan-400 transition"
              >
                Create Account
              </Link>

              <Link
                href="/tools"
                className="rounded-lg border border-cyan-500 px-6 py-3 text-cyan-400 hover:bg-cyan-500/10 transition"
              >
                Browse Tools
              </Link>

            </div>

          </section>

        </div>
      </main>

      <Footer />
    </>
  );
}