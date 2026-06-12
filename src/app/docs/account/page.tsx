import Navbar from "@/components/ui/navbar";
import Footer from "@/components/ui/footer";
import Link from "next/link";

export default function Account() {
  return (
    <>
      <Navbar />

      <main
        className="min-h-screen bg-black text-white pt-28 px-6"
        style={{ fontFamily: "Arial, sans-serif" }}
      >
        <div className="max-w-4xl mx-auto">

          <div className="mb-12">

            <span className="inline-block rounded-full border border-cyan-500/30 bg-cyan-500/10 px-4 py-1 text-sm text-cyan-400">
              Documentation
            </span>

            <h1 className="mt-6 text-5xl font-bold">
              Account
            </h1>

            <p className="mt-4 text-xl text-gray-400">
              Learn how accounts, authentication, subscriptions, and security
              work across Chhikara Industries products.
            </p>

          </div>

          <section className="mb-8 rounded-2xl border border-white/10 bg-zinc-950 p-8">
            <h2 className="text-2xl font-bold">Account Overview</h2>

            <p className="mt-6 text-gray-400">
              Your account provides access to tools, subscriptions,
              documentation, settings, and future premium features.
            </p>
          </section>

          <section className="mb-8 rounded-2xl border border-white/10 bg-zinc-950 p-8">
            <h2 className="text-2xl font-bold">Creating an Account</h2>

            <ul className="mt-6 space-y-3 text-gray-400">
              <li>✓ Email & Password</li>
              <li>✓ Google Authentication</li>
              <li>✓ Discord Authentication</li>
              <li>✓ Email Verification</li>
            </ul>
          </section>

          <section className="mb-8 rounded-2xl border border-white/10 bg-zinc-950 p-8">
            <h2 className="text-2xl font-bold">Logging In</h2>

            <p className="mt-6 text-gray-400">
              You can log in using the same provider used during signup.
            </p>
          </section>

          <section className="mb-8 rounded-2xl border border-white/10 bg-zinc-950 p-8">
            <h2 className="text-2xl font-bold">Security</h2>

            <ul className="mt-6 space-y-3 text-gray-400">
              <li>✓ Secure authentication via Supabase</li>
              <li>✓ Encrypted connections</li>
              <li>✓ Password reset support</li>
              <li>✓ Future two-factor authentication</li>
            </ul>
          </section>

          <section className="mb-8 rounded-2xl border border-white/10 bg-zinc-950 p-8">
            <h2 className="text-2xl font-bold">Billing & Subscriptions</h2>

            <p className="mt-6 text-gray-400">
              Subscription management is available through the billing system.
            </p>

            <Link
              href="/pricing"
              className="mt-6 inline-block rounded-lg bg-cyan-500 px-5 py-3 font-semibold text-black hover:bg-cyan-400 transition"
            >
              View Pricing
            </Link>
          </section>

          <section className="mb-12 rounded-2xl border border-white/10 bg-zinc-950 p-8">

            <h2 className="text-2xl font-bold">
              Frequently Asked Questions
            </h2>

            <div className="mt-8 space-y-6">

              <div>
                <h3 className="font-semibold">
                  Can I use Google instead of email?
                </h3>

                <p className="mt-2 text-gray-400">
                  Yes. Google authentication is supported.
                </p>
              </div>

              <div>
                <h3 className="font-semibold">
                  Can I use Discord login?
                </h3>

                <p className="mt-2 text-gray-400">
                  Yes. Discord authentication is supported.
                </p>
              </div>

              <div>
                <h3 className="font-semibold">
                  What happens if I forget my password?
                </h3>

                <p className="mt-2 text-gray-400">
                  You can reset your password through the login page.
                </p>
              </div>

            </div>

          </section>

        </div>
      </main>

      <Footer />
    </>
  );
}