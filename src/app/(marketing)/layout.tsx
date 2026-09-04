import type { ReactNode } from "react"

import { Navbar } from "@/components/site/navbar"
import { Footer } from "@/components/site/footer"

export default function MarketingLayout({ children }: { children: ReactNode }) {
  return (
    <div className="flex min-h-dvh flex-col">
      <Navbar />
      <main className="flex-1">{children}</main>
      <Footer />
    </div>
  )
}