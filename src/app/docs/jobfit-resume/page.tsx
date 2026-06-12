import Navbar from "@/components/ui/navbar";
import Footer from "@/components/ui/footer";
import Link from "next/link";

export default function JobFitResume() {
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
              JobFit Resume
            </h1>

            <p className="mt-4 text-xl text-gray-400">
              Learn how to install, configure, and use JobFit Resume to find
              the best resume for every job application.
            </p>

          </div>

          {/* Hero Card */}
          <section className="mb-12 rounded-2xl border border-white/10 bg-zinc-950 p-8">

            <div className="flex flex-col md:flex-row items-center gap-8">

              <img
                src="/JobFit-Resume.png"
                alt="JobFit Resume"
                className="w-[200px] h-[200px] object-contain"
              />

              <div>

                <h2 className="text-3xl font-bold">
                  What is JobFit Resume?
                </h2>

                <p className="mt-4 text-gray-400 leading-relaxed">
                  JobFit Resume is a browser extension that analyzes job
                  descriptions and compares them against your available
                  resumes to determine which resume is the strongest match.
                </p>

                <div className="mt-6 flex flex-wrap gap-3">

                  <Link
                    href="/tools"
                    className="rounded-lg bg-cyan-500 px-5 py-3 font-semibold text-black hover:bg-cyan-400 transition"
                  >
                    View Tool
                  </Link>

                  <Link
                    href="#"
                    className="rounded-lg border border-cyan-500 px-5 py-3 text-cyan-400 hover:bg-cyan-500/10 transition"
                  >
                    Source Code
                  </Link>

                </div>

              </div>

            </div>

          </section>

          {/* Installation */}
          <section className="mb-8 rounded-2xl border border-white/10 bg-zinc-950 p-8">

            <h2 className="text-2xl font-bold">
              Installation
            </h2>

            <ol className="mt-6 space-y-4 text-gray-300">

              <li>
                <strong>1.</strong> Download the extension package.
              </li>

              <li>
                <strong>2.</strong> Open your Chromium-based browser.
              </li>

              <li>
                <strong>3.</strong> Navigate to the Extensions page.
              </li>

              <li>
                <strong>4.</strong> Enable Developer Mode.
              </li>

              <li>
                <strong>5.</strong> Load the unpacked extension.
              </li>

            </ol>

          </section>

          {/* How It Works */}
          <section className="mb-8 rounded-2xl border border-white/10 bg-zinc-950 p-8">

            <h2 className="text-2xl font-bold">
              How It Works
            </h2>

            <div className="mt-6 space-y-5 text-gray-400">

              <p>
                JobFit Resume reads the job description from supported job
                platforms.
              </p>

              <p>
                The extension analyzes:
              </p>

              <ul className="ml-6 list-disc space-y-2">

                <li>Skills</li>
                <li>Keywords</li>
                <li>Experience Requirements</li>
                <li>Education Requirements</li>
                <li>Role-Specific Terminology</li>

              </ul>

              <p>
                It then compares those requirements against your uploaded
                resumes and ranks them according to relevance.
              </p>

            </div>

          </section>

          {/* Supported Platforms */}
          <section className="mb-8 rounded-2xl border border-white/10 bg-zinc-950 p-8">

            <h2 className="text-2xl font-bold">
              Supported Platforms
            </h2>

            <div className="mt-6 grid gap-4 md:grid-cols-2">

              <div className="rounded-xl border border-white/10 bg-black/40 p-4">
                Indeed
              </div>

              <div className="rounded-xl border border-white/10 bg-black/40 p-4">
                LinkedIn (Planned)
              </div>

              <div className="rounded-xl border border-white/10 bg-black/40 p-4">
                Glassdoor (Planned)
              </div>

              <div className="rounded-xl border border-white/10 bg-black/40 p-4">
                More Coming Soon
              </div>

            </div>

          </section>

          {/* Resume Matching */}
          <section className="mb-8 rounded-2xl border border-white/10 bg-zinc-950 p-8">

            <h2 className="text-2xl font-bold">
              Understanding Match Scores
            </h2>

            <p className="mt-6 text-gray-400 leading-relaxed">
              Match scores represent how closely a resume aligns with the
              current job description.
            </p>

            <div className="mt-6 grid gap-4">

              <div className="rounded-xl border border-green-500/20 bg-green-500/5 p-4">
                <span className="font-bold text-green-400">
                  80% - 100%
                </span>
                <p className="mt-2 text-gray-400">
                  Excellent match.
                </p>
              </div>

              <div className="rounded-xl border border-yellow-500/20 bg-yellow-500/5 p-4">
                <span className="font-bold text-yellow-400">
                  50% - 79%
                </span>
                <p className="mt-2 text-gray-400">
                  Good match.
                </p>
              </div>

              <div className="rounded-xl border border-red-500/20 bg-red-500/5 p-4">
                <span className="font-bold text-red-400">
                  Below 50%
                </span>
                <p className="mt-2 text-gray-400">
                  Consider another resume.
                </p>
              </div>

            </div>

          </section>

          {/* FAQ */}
          <section className="mb-12 rounded-2xl border border-white/10 bg-zinc-950 p-8">

            <h2 className="text-2xl font-bold">
              Frequently Asked Questions
            </h2>

            <div className="mt-6 space-y-6">

              <div>
                <h3 className="font-semibold">
                  Does JobFit Resume store my resumes?
                </h3>

                <p className="mt-2 text-gray-400">
                  Your resumes are only used for matching purposes.
                </p>
              </div>

              <div>
                <h3 className="font-semibold">
                  Can I upload multiple resumes?
                </h3>

                <p className="mt-2 text-gray-400">
                  Yes. JobFit Resume is designed specifically for comparing
                  multiple resumes against a job description.
                </p>
              </div>

              <div>
                <h3 className="font-semibold">
                  Is the extension free?
                </h3>

                <p className="mt-2 text-gray-400">
                  Check the Pricing page for the latest plan information.
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