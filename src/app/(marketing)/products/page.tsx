import type { Metadata } from "next"
import Link from "next/link"
import Image from "next/image"
import { ArrowRight, Coins } from "lucide-react"

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

export const metadata: Metadata = {
  title: "Products",
}

const conversions = [
  { tokens: "10", cost: "$0.01" },
  { tokens: "100", cost: "$0.10" },
  { tokens: "1,000", cost: "$1.00" },
  { tokens: "10,000", cost: "$10.00" },
]

export default function ProductsPage() {
  return (
    <>
      <PageHeader
        eyebrow="Products"
        title="Credits."
        description="One balance of tokens to use across Chhikara software — the whole product, simple."
        align="center"
      />

      <section className="border-t border-border/60">
        <Container className="py-16 sm:py-20">
          <Reveal>
            <Card className="mx-auto max-w-sm">
              <div className="relative aspect-square w-full overflow-hidden border-b border-border bg-card/50">
                <Image
                  src="/tokens.png"
                  alt="The Chhikara token"
                  fill
                  className="object-contain p-6"
                />
              </div>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <span>Credits</span>
                  <span className="rounded-full border border-border px-2.5 py-0.5 font-mono text-[0.65rem] uppercase tracking-wider text-muted-foreground">
                    Available
                  </span>
                </CardTitle>
                <CardDescription>
                  Prepaid tokens that never expire, priced at 10 tokens per
                  cent.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-1.5">
                  {conversions.map((row) => (
                    <div
                      key={row.tokens}
                      className="flex items-center justify-between rounded-lg border border-border px-3 py-2 font-mono text-sm"
                    >
                      <span className="text-foreground">
                        {row.tokens} tokens
                      </span>
                      <span className="text-muted-foreground">{row.cost}</span>
                    </div>
                  ))}
                </div>
                <div className="mt-2 flex items-center gap-2 rounded-lg border border-primary/30 bg-primary/10 px-3 py-2.5 font-mono text-xs text-primary">
                  <Coins className="size-4 shrink-0" />
                  10 tokens = 1 cent
                </div>
                <Button
                  size="lg"
                  className="mt-5 w-full"
                  render={<Link href="/signup" />}
                >
                  Buy credits
                  <ArrowRight data-icon="inline-end" className="size-4" />
                </Button>
              </CardContent>
            </Card>
          </Reveal>
        </Container>
      </section>
    </>
  )
}