import type { Metadata } from "next"

import { LegalPage } from "@/components/site/legal"

export const metadata: Metadata = {
  title: "Cookie Policy",
}

const sections = [
  {
    heading: "1. What cookies are",
    body: [
      "Cookies are small text files stored by your browser. Chhikara Industries also uses equivalent client-side storage for the same purposes.",
    ],
  },
  {
    heading: "2. Cookies we use",
    body: [
      "Essential cookies keep you signed in and carry your session between page loads. They are required for the dashboard and authenticated areas to work.",
      "Functional storage remembers preferences related to the dashboard (for example, sidebar state). We do not use advertising or tracking cookies.",
    ],
  },
  {
    heading: "3. Managing cookies",
    body: [
      "You can clear cookies in your browser at any time. Removing essential cookies will sign you out of the dashboard. Blocking all cookies may prevent the Services from working.",
    ],
  },
  {
    heading: "4. Contact",
    body: [
      "Questions about this policy can be sent to hello@chhikara.industries.",
    ],
  },
]

export default function CookiesPage() {
  return (
    <LegalPage
      eyebrow="Legal"
      title="Cookie Policy"
      description="The cookies and client-side storage used by the Chhikara Industries website and dashboard."
      updated="September 1, 2026"
      sections={sections}
    />
  )
}