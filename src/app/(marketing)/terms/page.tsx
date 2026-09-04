import type { Metadata } from "next"

import { LegalPage } from "@/components/site/legal"

export const metadata: Metadata = {
  title: "Terms of Service",
}

const sections = [
  {
    heading: "1. Our services",
    body: [
      "Chhikara Industries provides software products and services, together called the Services. These Terms govern your use of the Services, the website chhikara.industries, and any account you create.",
      "The Services are an evolving set of offerings. Software may be added, changed, or retired over time. Where it materially affects you, we will let you know through our website.",
    ],
  },
  {
    heading: "2. Accounts",
    body: [
      "You are responsible for the activity under your account and for keeping your password and sign-in credentials confidential. If you believe your account has been compromised, reset your password and contact support immediately.",
      "You must be at least 16 (or the age of majority in your jurisdiction) to create an account.",
    ],
  },
  {
    heading: "3. Acceptable use",
    body: [
      "You agree not to use the Services to violate law, infringe others' rights, send unwanted messages, attempt access to systems you do not own, or misuse the Services in ways that put the company or other people at risk.",
      "The Acceptable Use Policy explains the full list of prohibited activities.",
    ],
  },
  {
    heading: "4. Payments and billing",
    body: [
      "Where services are paid, your plan and its price are shown at the time you sign up and in the billing section of your account.",
      "Plan changes apply when made. Fees are non-refundable except where required by law or where we terminate the agreement.",
    ],
  },
  {
    heading: "5. Your content and data",
    body: [
      "You retain ownership of the content you submit or store with the Services. We process it only to provide the service you asked for.",
      "You are responsible for the lawfulness of the content you store and process, and for backing up anything important.",
    ],
  },
  {
    heading: "6. Availability and support",
    body: [
      "We work to keep the Services reliable and available. We do not guarantee uninterrupted service, and the Services are provided on an \"as is\" and \"as available\" basis to the maximum extent permitted by law.",
    ],
  },
  {
    heading: "7. Termination",
    body: [
      "You may stop using the Services at any time. We may suspend or terminate your access for violations of these Terms, fraud, or risk to the Services or other people.",
    ],
  },
  {
    heading: "8. Changes to these terms",
    body: [
      "We may update these Terms to reflect how we operate. Material changes are announced on our website and take effect 14 days after notice. Continuing to use the Services after that date accepts the new Terms.",
    ],
  },
]

export default function TermsPage() {
  return (
    <LegalPage
      eyebrow="Legal"
      title="Terms of Service"
      description="The terms that govern your use of the Chhikara Industries Services."
      updated="September 1, 2026"
      sections={sections}
    />
  )
}