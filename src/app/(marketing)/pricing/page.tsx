import type { Metadata } from "next"
import Link from "next/link"
import { Check } from "lucide-react"

import { PageHeader } from "@/components/site/page-header"
import { Container } from "@/components/site/section"
import { Reveal } from "@/components/site/reveal"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { plans } from "@/lib/plans"

export const metadata: Metadata = {
  title: "Pricing",
}

export default function PricingPage() {
  return (
    <>
      <PageHeader
        eyebrow="Pricing"
        title="Simple plans, for everyone."
        description="Start free and move up when you need more. Tokens reset on a schedule — or never, on Ultimate."
        align="center"
      />

      <section className="border-t border-border/60">
        <Container className="py-16 sm:py-20">
          <div className="grid gap-5 md:grid-cols-3">
            {plans.map((plan, i) => (
              <Reveal key={plan.id} delay={i * 80}>
                <Card
                  className={
                    plan.featured
                      ? "h-full border-primary/50 shadow-glow"
                      : "h-full transition-colors hover:border-border"
                  }
                >
                  <CardHeader>
                    <CardTitle className="font-mono text-sm uppercase tracking-wider">
                      {plan.name}
                    </CardTitle>
                    <div className="flex items-baseline gap-1.5 pt-2">
                      <span className="text-4xl font-semibold tracking-tight">
                        {plan.price}
                      </span>
                      <span className="font-mono text-xs text-muted-foreground">
                        / {plan.priceNote}
                      </span>
                    </div>
                    <CardDescription>{plan.tagline}</CardDescription>
                  </CardHeader>
                  <CardContent className="flex-1">
                    <ul className="space-y-2">
                      {plan.features.map((feature) => (
                        <li
                          key={feature}
                          className="flex items-start gap-2 text-sm text-foreground/85"
                        >
                          <Check className="mt-0.5 size-3.5 shrink-0 text-primary" />
                          {feature}
                        </li>
                      ))}
                    </ul>
                  </CardContent>
                  <CardContent>
                    <Button
                      className="w-full"
                      variant={plan.featured ? "default" : "outline"}
                      render={<Link href="/dashboard/billing" />}
                    >
                      {plan.cta}
                    </Button>
                  </CardContent>
                </Card>
              </Reveal>
            ))}
          </div>

          <p className="mt-10 text-center font-mono text-xs text-muted-foreground">
            Free resets monthly · Pro resets weekly · Ultimate never resets
          </p>
        </Container>
      </section>
    </>
  )
}