import type { Metadata } from "next"
import { Geist_Mono, Inter } from "next/font/google"

import "./globals.css"
import { cn } from "@/lib/utils"

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-sans",
  display: "swap",
})

const geistMono = Geist_Mono({
  subsets: ["latin"],
  variable: "--font-geist-mono",
  display: "swap",
})

const siteTitle = "Chhikara Industries"
const siteDescription =
  "Chhikara Industries builds free, simple software — with robotics and engineering projects on the way."

export const metadata: Metadata = {
  metadataBase: new URL(
    process.env.NEXT_PUBLIC_SITE_URL ?? "https://chhikara.industries"
  ),
  title: {
    default: siteTitle,
    template: `%s · ${siteTitle}`,
  },
  description: siteDescription,
  openGraph: {
    title: siteTitle,
    description: siteDescription,
    type: "website",
    siteName: siteTitle,
  },
  twitter: {
    card: "summary_large_image",
    title: siteTitle,
    description: siteDescription,
  },
  icons: {
    icon: "/icon.png",
  },
}

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      className={cn(
        "dark",
        inter.variable,
        geistMono.variable,
        "font-sans antialiased"
      )}
    >
      <body className="min-h-dvh bg-background text-foreground">
        {children}
      </body>
    </html>
  )
}