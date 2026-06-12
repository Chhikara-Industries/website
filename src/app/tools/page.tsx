import Footer from "@/components/ui/footer";
import Navbar from "@/components/ui/navbar";
import Link from "next/link";

const tools = [
  {
    name: "JobFit Resume",
    description:
      "Analyze job descriptions and automatically find the best matching resume.",
    category: "Resume",
    status: "Available",
    image: "/JobFit-Resume.png",

    downloadUrl:
      "#",

    sourceUrl:
      "#",

    href: "/tools/jobfit-resume",
  }
];

export default function Tools() {
  return (
    <>
      <Navbar />

      <main
        className="min-h-screen bg-black text-white pt-28 px-6"
        style={{ fontFamily: "Arial, sans-serif" }}
      >
        <div className="max-w-7xl mx-auto mb-8">

          <div className="mb-12 text-center">

            <h1 className="text-5xl font-bold">
              AI Tools
            </h1>

            <p className="text-gray-400 mt-3">
              Browse all available AI-powered software and browser extensions.
            </p>

          </div>

          <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">

            {tools.map((tool) => (
              <div
                key={tool.name}
                className="bg-zinc-900 border border-white/10 rounded-2xl overflow-hidden hover:border-cyan-400/40 hover:shadow-[0_0_25px_rgba(34,211,238,0.15)] transition"
              >

                {/* Image */}
                <div className="h-64 flex items-center justify-center bg-[#100F0D] border-b border-white/5">

                  <img
                    src={tool.image}
                    alt={tool.name}
                    className="w-[200px] h-[200px] object-contain"
                  />

                </div>

                {/* Content */}
                <div className="p-6">

                  <div className="flex items-center justify-between">

                    <span className="text-xs px-3 py-1 rounded-full bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
                      {tool.category}
                    </span>

                    <span
                      className={`text-sm font-medium ${
                        tool.status === "Available"
                          ? "text-green-400"
                          : "text-yellow-400"
                      }`}
                    >
                      {tool.status}
                    </span>

                  </div>

                  <h2 className="mt-5 text-2xl font-bold">
                    {tool.name}
                  </h2>

                  <p className="mt-3 text-gray-400 leading-relaxed">
                    {tool.description}
                  </p>

                  <div className="mt-6 flex gap-3">

                    {tool.status === "Available" && (
                      tool.downloadUrl ? (
                        <Link
                          href={tool.downloadUrl}
                          target="_blank"
                          className="flex-1 text-center rounded-lg bg-cyan-500 px-4 py-3 text-black font-semibold hover:bg-cyan-400 transition"
                        >
                          Download
                        </Link>
                      ) : (
                        <Link
                          href={tool.href}
                          className="flex-1 text-center rounded-lg bg-cyan-500 px-4 py-3 text-black font-semibold hover:bg-cyan-400 transition"
                        >
                          View Tool
                        </Link>
                      )
                    )}

                    <Link
                      href={tool.sourceUrl}
                      target="_blank"
                      className={`${
                        tool.status === "Available" ? "flex-1" : "w-full"
                      } text-center rounded-lg border border-cyan-500 px-4 py-3 text-cyan-400 hover:bg-cyan-500/10 transition`}
                    >
                      Source
                    </Link>

                  </div>

                </div>

              </div>
            ))}

          </div>

        </div>
        <Footer />
      </main>
    </>
  );
}