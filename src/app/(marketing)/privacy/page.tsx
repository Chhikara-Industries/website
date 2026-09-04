import type { Metadata } from "next"

import { LegalPage } from "@/components/site/legal"

export const metadata: Metadata = {
  title: "Privacy Policy",
}

const sections = [
  {
    heading: "1. What we collect",
    body: [
      "We collect the data you give us directly: your name, email address, and the content you store or process through the Services. We also collect technical data needed to operate the service, such as basic logs, IP addresses, and service usage metrics.",
    ],
  },
  {
    heading: "2. How we use it",
    body: [
      "Your data is used to provide the Services: authenticating you, billing you correctly, keeping the service reliable, debugging issues, and communicating with you about your account.",
      "We do not sell your personal data and do not train models on your content without explicit permission.",
    ],
  },
  {
    heading: "3. Authentication",
    body: [
      "Authentication is provided by Supabase. Passwords are hashed and never stored in plaintext. Session data is carried in secure, httpOnly cookies and refreshed automatically.",
    ],
  },
  {
    heading: "4. Data retention",
    body: [
      "Service logs are retained for up to 30 days. Account data is retained while your account is active and up to 90 days after deletion.",
    ],
  },
  {
    heading: "5. Sharing",
    body: [
      "Data is shared only with the service providers required to operate the Services (for example, hosting and email delivery), under appropriate agreements, and with authorities where the law requires it.",
    ],
  },
  {
    heading: "6. Your rights",
    body: [
      "You can request a copy, correction, or deletion of your personal data by contacting hello@chhikara.industries. Where the law gives you stronger rights, those apply.",
    ],
  },
  {
    heading: "7. Contact",
    body: [
      "For privacy questions, email hello@chhikara.industries. We respond within 30 days.",
    ],
  },
]

export default function PrivacyPage() {
  return (
    <LegalPage
      eyebrow="Legal"
      title="Privacy Policy"
      description="How Chhikara Industries collects, uses, and protects your data."
      updated="September 1, 2026"
      sections={sections}
    />
  )
}