import Footer from "@/components/ui/footer";
import Navbar from "@/components/ui/navbar";
import Link from "next/link";

const docsSections = [
  {
    title: "Getting Started",
    description:
      "Learn how to create an account, choose a plan, and begin using Chhikara Industries tools.",
    href: "/docs/getting-started",
  },
  {
    title: "JobFit Resume",
    description:
      "Installation guides, resume matching, supported platforms, and troubleshooting.",
    href: "/docs/jobfit-resume",
  },
  {
    title: "Pricing & Billing",
    description:
      "Understand subscriptions, plan limits, billing cycles, and payment management.",
    href: "/docs/pricing",
  },
  {
    title: "Account Management",
    description:
      "Manage your profile, authentication providers, passwords, and account settings.",
    href: "/docs/account",
  },
  {
    title: "FAQ",
    description:
      "Answers to common questions about products, subscriptions, and privacy.",
    href: "/docs/faq",
  },
  {
    title: "Privacy & Terms",
    description:
      "Privacy Policy, Terms of Service, and data handling practices.",
    href: "/docs/legal",
  },
];

export default function Docs() {
  return (
    <>
      <Navbar />

      <main
        className="min-h-screen bg-black text-white pt-28 px-6"
        style={{ fontFamily: "Arial, sans-serif" }}
      >
        <div className="max-w-7xl mx-auto">

          {/* Header */}
          <div className="text-center mb-16">

            <h1 className="text-5xl md:text-6xl font-bold">
              Documentation
            </h1>

            <p className="mt-4 text-gray-400 max-w-2xl mx-auto">
              Everything you need to learn, configure, and use
              Chhikara Industries products.
            </p>

          </div>

          {/* Quick Links */}
          <div className="mb-16 flex flex-wrap justify-center gap-3">

            <Link
              href="/signup"
              className="rounded-lg bg-cyan-500 px-5 py-3 text-black font-semibold hover:bg-cyan-400 transition"
            >
              Get Started
            </Link>

            <Link
              href="/pricing"
              className="rounded-lg border border-cyan-500 px-5 py-3 text-cyan-400 hover:bg-cyan-500/10 transition"
            >
              View Pricing
            </Link>

          </div>

          {/* Documentation Cards */}
          <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">

            {docsSections.map((section) => (
              <Link
                key={section.title}
                href={section.href}
                className="group rounded-2xl border border-white/10 bg-zinc-950 p-6 hover:border-cyan-400/40 hover:shadow-[0_0_25px_rgba(34,211,238,0.15)] transition"
              >

                <h2 className="text-2xl font-bold group-hover:text-cyan-400 transition">
                  {section.title}
                </h2>

                <p className="mt-4 text-gray-400 leading-relaxed">
                  {section.description}
                </p>

                <div className="mt-6 text-cyan-400 font-medium">
                  Read Documentation →
                </div>

              </Link>
            ))}

          </div>

          {/* Help Section */}
          <div className="mt-24 rounded-2xl border border-white/10 bg-zinc-950 p-10 text-center">

            <h2 className="text-3xl font-bold">
              Need More Help?
            </h2>

            <p className="mt-4 text-gray-400">
              Can't find what you're looking for?
              Check the FAQ or contact support.
            </p>

            <div className="mt-8 flex flex-wrap justify-center gap-4">

              <Link
                href="/docs/faq"
                className="rounded-lg bg-cyan-500 px-6 py-3 text-black font-semibold hover:bg-cyan-400 transition"
              >
                View FAQ
              </Link>

              <Link
                href="/contact"
                className="rounded-lg border border-cyan-500 px-6 py-3 text-cyan-400 hover:bg-cyan-500/10 transition"
              >
                Contact Support
              </Link>

            </div>

          </div>

        </div>
      </main>
      <Footer />
    </>
  );
}