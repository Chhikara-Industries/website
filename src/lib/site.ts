export const site = {
  name: "Chhikara Industries",
  shortName: "Chhikara",
  legalName: "Chhikara Industries",
  description:
    "Chhikara Industries builds free, simple software — with robotics and engineering projects on the way.",
  url: process.env.NEXT_PUBLIC_SITE_URL ?? "https://chhikara.industries",
  email: "hello@chhikara.industries",
  supportEmail: "support@chhikara.industries",
  legalEmail: "legal@chhikara.industries",
  socials: {
    github: "https://github.com/chhikara-industries",
    x: "https://x.com/chhikaraindustries",
    linkedin: "https://www.linkedin.com/company/chhikara-industries",
    discord: "https://discord.gg/PjWRTgau8G",
  },
} as const

export const navLinks: { href: string; label: string }[] = [
  { href: "/", label: "Home" },
  { href: "/about", label: "About" },
  { href: "/products", label: "Products" },
  { href: "/pricing", label: "Pricing" },
  { href: "/contact", label: "Contact" },
]

export const footerLinks = {
  account: [
    { href: "/dashboard", label: "Your account" },
    { href: "/login", label: "Sign in" },
    { href: "/signup", label: "Create account" },
  ],
  company: [
    { href: "/about", label: "About" },
    { href: "/contact", label: "Contact" },
    { href: "/terms", label: "Terms" },
    { href: "/privacy", label: "Privacy" },
    { href: "/acceptable-use", label: "Acceptable use" },
  ],
} as const