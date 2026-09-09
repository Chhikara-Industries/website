"use client"

import Link from "next/link"
import { Check, Coins, Repeat, Sparkles } from "lucide-react"

import { tokenPackages } from "@/lib/token-packages"
import { plans } from "@/lib/plans"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { cn } from "@/lib/utils"

const paidPlans = plans.filter((p) => p.id !== "free" && p.priceUsd)

export function BillingPlans() {
  return (
    <div className="space-y-8">
      <section>
        <div className="flex items-center gap-2">
          <Repeat className="size-4 text-primary" />
          <h2 className="text-lg font-semibold tracking-tight">Subscription</h2>
        </div>
        <p className="mt-1 text-sm text-muted-foreground">
          Pick a plan and pay with crypto. Your access activates once the
          payment is confirmed on-chain.
        </p>
        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          {paidPlans.map((p) => (
            <Card
              key={p.id}
              className={cn(
                "h-full",
                p.id === "pro" && "border-primary/50 shadow-glow"
              )}
            >
              <CardHeader>
                <CardTitle className="font-mono text-sm uppercase tracking-wider">
                  {p.name}
                </CardTitle>
                {p.id === "pro" ? (
                  <span className="inline-flex w-fit items-center gap-1 rounded-full border border-primary/30 bg-primary/10 px-2 py-0.5 font-mono text-[10px] uppercase tracking-wider text-primary">
                    <Sparkles className="size-3" />
                    Popular
                  </span>
                ) : null}
                <div className="flex items-baseline gap-1.5 pt-1">
                  <span className="text-3xl font-semibold tracking-tight">
                    {p.price}
                  </span>
                  <span className="font-mono text-xs text-muted-foreground">
                    / {p.priceNote}
                  </span>
                </div>
                <CardDescription>{p.tagline}</CardDescription>
              </CardHeader>
              <CardContent className="flex-1">
                <ul className="space-y-2">
                  {p.features.map((feature) => (
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
                  variant={p.id === "pro" ? "default" : "outline"}
                  render={<Link href={`/dashboard/billing/subscribe/${p.id}`} />}
                >
                  {p.cta}
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      <section>
        <div className="flex items-center gap-2">
          <Coins className="size-4 text-primary" />
          <h2 className="text-lg font-semibold tracking-tight">Buy credits</h2>
        </div>
        <p className="mt-1 text-sm text-muted-foreground">
          No subscription needed — top up tokens whenever you need them.
        </p>
        <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {tokenPackages.map((p) => (
            <Card key={p.id} className="h-full">
              <CardHeader>
                <CardTitle className="font-mono text-sm uppercase tracking-wider">
                  {p.name}
                </CardTitle>
                {p.popular ? (
                  <span className="inline-flex w-fit items-center gap-1 rounded-full border border-primary/30 bg-primary/10 px-2 py-0.5 font-mono text-[10px] uppercase tracking-wider text-primary">
                    <Sparkles className="size-3" />
                    Popular
                  </span>
                ) : null}
                <p className="font-mono text-sm text-muted-foreground">
                  {p.tokens.toLocaleString()} tokens
                </p>
              </CardHeader>
              <CardContent>
                <p className="font-mono text-2xl font-semibold">
                  ${p.priceUsd.toFixed(2)}
                </p>
                <p className="mt-1 text-sm text-muted-foreground">{p.note}</p>
                <Button
                  variant="outline"
                  className="mt-4 w-full"
                  render={<Link href={`/dashboard/billing/buy/${p.id}`} />}
                >
                  Buy
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>
    </div>
  )
}
