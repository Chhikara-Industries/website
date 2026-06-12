import Navbar from "@/components/ui/navbar";
import Footer from "@/components/ui/footer";

export default function Terms() {
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
              Legal
            </span>

            <h1 className="mt-6 text-5xl font-bold">
              Terms & Conditions
            </h1>

            <p className="mt-4 text-xl text-gray-400">
              Last Updated: June 2026
            </p>

          </div>

          {/* Section */}
          <section className="mb-8 rounded-2xl border border-white/10 bg-zinc-950 p-8">
            <h2 className="text-2xl font-bold">
              1. Acceptance of Terms
            </h2>

            <p className="mt-4 text-gray-400 leading-relaxed">
              By accessing or using products, services, websites, or software
              provided by Chhikara Industries, you agree to be bound by these
              Terms & Conditions.
            </p>
          </section>

          <section className="mb-8 rounded-2xl border border-white/10 bg-zinc-950 p-8">
            <h2 className="text-2xl font-bold">
              2. User Accounts
            </h2>

            <p className="mt-4 text-gray-400 leading-relaxed">
              Users are responsible for maintaining the security of their
              accounts and credentials. You are responsible for activities
              performed through your account.
            </p>
          </section>

          <section className="mb-8 rounded-2xl border border-white/10 bg-zinc-950 p-8">
            <h2 className="text-2xl font-bold">
              3. Acceptable Use
            </h2>

            <ul className="mt-6 space-y-3 text-gray-400">
              <li>✓ Use services lawfully.</li>
              <li>✓ Respect intellectual property rights.</li>
              <li>✓ Do not abuse, exploit, or disrupt services.</li>
              <li>✓ Do not attempt unauthorized access to systems.</li>
            </ul>
          </section>

          <section className="mb-8 rounded-2xl border border-white/10 bg-zinc-950 p-8">
            <h2 className="text-2xl font-bold">
              4. Intellectual Property
            </h2>

            <p className="mt-4 text-gray-400 leading-relaxed">
              All branding, trademarks, logos, software, documentation,
              designs, and content created by Chhikara Industries remain the
              property of Chhikara Industries unless otherwise stated.
            </p>
          </section>

          <section className="mb-8 rounded-2xl border border-white/10 bg-zinc-950 p-8">
            <h2 className="text-2xl font-bold">
              5. Open Source Software
            </h2>

            <p className="mt-4 text-gray-400 leading-relaxed">
              Certain projects may be released under open-source licenses.
              Those projects are governed by their respective licenses in
              addition to these terms.
            </p>
          </section>

          <section className="mb-8 rounded-2xl border border-white/10 bg-zinc-950 p-8">
            <h2 className="text-2xl font-bold">
              6. Payments & Subscriptions
            </h2>

            <p className="mt-4 text-gray-400 leading-relaxed">
              Paid services may require recurring subscriptions. Pricing,
              billing periods, and features may change over time.
            </p>
          </section>

          <section className="mb-8 rounded-2xl border border-white/10 bg-zinc-950 p-8">
            <h2 className="text-2xl font-bold">
              7. Termination
            </h2>

            <p className="mt-4 text-gray-400 leading-relaxed">
              Chhikara Industries may suspend or terminate accounts that
              violate these terms or abuse platform services.
            </p>
          </section>

          <section className="mb-8 rounded-2xl border border-white/10 bg-zinc-950 p-8">
            <h2 className="text-2xl font-bold">
              8. Disclaimer
            </h2>

            <p className="mt-4 text-gray-400 leading-relaxed">
              Services are provided "as is" without warranties of any kind.
              We do not guarantee uninterrupted availability or error-free
              operation.
            </p>
          </section>

          <section className="mb-8 rounded-2xl border border-white/10 bg-zinc-950 p-8">
            <h2 className="text-2xl font-bold">
              9. Limitation of Liability
            </h2>

            <p className="mt-4 text-gray-400 leading-relaxed">
              To the fullest extent permitted by law, Chhikara Industries
              shall not be liable for indirect, incidental, or consequential
              damages arising from the use of our products or services.
            </p>
          </section>

          <section className="mb-12 rounded-2xl border border-white/10 bg-zinc-950 p-8">
            <h2 className="text-2xl font-bold">
              10. Contact
            </h2>

            <p className="mt-4 text-gray-400 leading-relaxed">
              Questions regarding these Terms & Conditions may be directed
              through the official support channels provided by
              Chhikara Industries.
            </p>
          </section>

        </div>
      </main>

      <Footer />
    </>
  );
}