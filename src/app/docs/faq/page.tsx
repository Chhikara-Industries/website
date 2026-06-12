import Navbar from "@/components/ui/navbar";
import Footer from "@/components/ui/footer";

export default function FAQ() {
  const faqs = [
    {
      question: "Do I need an account to use your tools?",
      answer:
        "Some tools may be available without an account, while others require authentication for access and personalization.",
    },
    {
      question: "Can I sign in with Google?",
      answer:
        "Yes. Google authentication is supported through Supabase OAuth.",
    },
    {
      question: "Can I sign in with Discord?",
      answer:
        "Yes. Discord authentication is supported through Supabase OAuth.",
    },
    {
      question: "What happens if I forget my password?",
      answer:
        "You can use the password reset functionality available on the login page.",
    },
    {
      question: "Are your tools free?",
      answer:
        "Many tools offer free access. Premium plans may be available for additional features and higher usage limits.",
    },
    {
      question: "How do I cancel a subscription?",
      answer:
        "Subscriptions can be managed from your billing dashboard once billing functionality is available.",
    },
    {
      question: "Where can I report bugs?",
      answer:
        "You can report bugs through GitHub Issues or the support channels provided for each product.",
    },
    {
      question: "Are your projects open source?",
      answer:
        "Many Chhikara Industries projects provide source code through GitHub repositories.",
    },
    {
      question: "Can I contribute to open-source projects?",
      answer:
        "Absolutely. Pull requests, bug reports, documentation improvements, and feature suggestions are welcome.",
    },
    {
      question: "Is my data secure?",
      answer:
        "We use industry-standard security practices and trusted providers such as Supabase to help protect user data.",
    },
  ];

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
              Frequently Asked Questions
            </h1>

            <p className="mt-4 text-xl text-gray-400">
              Quick answers to common questions about accounts,
              pricing, tools, subscriptions, and open-source projects.
            </p>

          </div>

          <div className="space-y-6">

            {faqs.map((faq) => (
              <div
                key={faq.question}
                className="rounded-2xl border border-white/10 bg-zinc-950 p-6"
              >
                <h2 className="text-xl font-semibold">
                  {faq.question}
                </h2>

                <p className="mt-3 text-gray-400 leading-relaxed">
                  {faq.answer}
                </p>
              </div>
            ))}

          </div>

        </div>
      </main>

      <Footer />
    </>
  );
}