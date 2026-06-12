"use client";

import Link from "next/link";

export default function Footer(){
    return(
        <main style={{fontFamily: "arial, sans-serif"}}>
            <footer className="border-t border-white/10 bg-black py-10 px-6">

            <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-6">

            <div>
                <img src="/logo.png" alt="" className="w-auto h-[60px]"/>

                <p className="text-gray-500 mt-2">
                Building the future of AI-powered tools.
                </p>
            </div>

            <div className="flex gap-6 text-gray-400">

                <Link href="/">
                    Home
                </Link>

                <Link href="/tools">
                    Tools
                </Link>

                <Link href="/pricing">
                    Pricing
                </Link>

                <Link href="/signup">
                    Sign Up
                </Link>

                <Link href="https://github.com/Chhikara-Industries" className="hover:text-white transition">
                    GitHub
                </Link>

                <Link href="https://discord.gg/KBrHXk7HpT" className="hover:text-indigo-500 transition">
                    Discord
                </Link>

            </div>

            </div>
            <p className="text-center -mb-9 text-gray-600 text-xs">© 2026 Chhikara Industries</p>
        </footer>
      </main>
    )
}