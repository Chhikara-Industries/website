import type { Metadata } from "next"

import { LegalPage } from "@/components/site/legal"

export const metadata: Metadata = {
  title: "Acceptable Use Policy",
}

const sections = [
  {
    heading: "1. Allowed use",
    body: [
      "The Services are for you and your family, your work, and your own lawful projects. You may use them for personal, professional, or educational purposes.",
    ],
  },
  {
    heading: "2. Prohibited activities",
    body: [
      "You may not use the Services to: transmit malware or malicious payloads; send unwanted or abusive messages; attempt to access accounts or systems that are not yours; bypass technical protections; store or generate content that is unlawful or designed to cause serious harm; or facilitate any of the above.",
    ],
  },
  {
    heading: "3. Content obligations",
    body: [
      "You are responsible for the content you generate, store, or distribute through the Services. Where content requires licensing, permission, or age gating, you ensure that compliance.",
    ],
  },
  {
    heading: "4. Scale and abuse",
    body: [
      "If your use outgrows what your plan can reasonably support, we will talk with you about a plan that fits. Activity that exists to exhaust capacity or harm the service is not allowed.",
    ],
  },
  {
    heading: "5. Enforcement",
    body: [
      "We may suspend access where activity creates risk to the Services or other people. Enforcement actions are applied proportionally, and affected account holders are told what happened and why.",
    ],
  },
]

export default function AcceptableUsePage() {
  return (
    <LegalPage
      eyebrow="Legal"
      title="Acceptable Use Policy"
      description="What the Chhikara Industries Services are for — and what they are not."
      updated="September 1, 2026"
      sections={sections}
    />
  )
}