export type PlanId = "free" | "pro" | "ultimate"

export type Plan = {
  id: PlanId
  name: string
  price: string
  priceNote: string
  tagline: string
  features: string[]
  cta: string
  featured?: boolean
  intervalDays?: number
  priceUsd?: number
}

export const plans: Plan[] = [
  {
    id: "free",
    name: "Free",
    price: "$0",
    priceNote: "forever",
    tagline: "Start with the essentials",
    features: [
      "1,000 tokens per month",
      "Resets monthly",
      "No early or beta access",
    ],
    cta: "Start for free",
  },
  {
    id: "pro",
    name: "Pro",
    price: "$5",
    priceNote: "per month",
    priceUsd: 5,
    intervalDays: 30,
    tagline: "More room, beta included",
    features: [
      "5,000 tokens per week",
      "Resets weekly",
      "Beta access only",
    ],
    cta: "Go Pro",
    featured: true,
  },
  {
    id: "ultimate",
    name: "Ultimate",
    price: "$7",
    priceNote: "per month",
    priceUsd: 7,
    intervalDays: 30,
    tagline: "Everything, no limits",
    features: [
      "Infinite tokens",
      "Early access",
      "Beta access",
    ],
    cta: "Go Ultimate",
  },
]