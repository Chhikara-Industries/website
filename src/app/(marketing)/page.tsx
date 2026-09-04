import Link from "next/link"
import { ArrowRight, Bot, Cog, MessageCircle, TerminalSquare } from "lucide-react"

import { Reveal } from "@/components/site/reveal"
import { Container, Eyebrow } from "@/components/site/section"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { site } from "@/lib/site"

const focus = [
  {
    icon: TerminalSquare,
    title: "Software",
    tag: "In development",
    description:
      "Free, simple software for everyday needs. Just tools that work.",
  },
  {
    icon: Bot,
    title: "Robotics",
    tag: "Coming soon",
    description:
      "Chhikara Industries is planning robotics projects and products to build next.",
  },
  {
    icon: Cog,
    title: "Mechanical Engineering",
    tag: "Coming soon",
    description:
      "Engineering projects and products are in the works, separate from robotics.",
  },
]

export default function HomePage() {
  return (
    <>
      <section className="relative flex flex-1 items-center justify-center overflow-hidden py-40">
        <div className="pointer-events-none absolute inset-0 bg-grid opacity-60 [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,black,transparent)]" />
        <div className="pointer-events-none absolute -top-40 left-1/2 h-[480px] w-[720px] -translate-x-1/2 rounded-full bg-primary/10 blur-[120px]" />

        <Container className="relative">
          <div className="mx-auto max-w-2xl text-center">
            <Eyebrow>Chhikara Industries</Eyebrow>
            <h1 className="mt-6 text-balance text-4xl font-semibold leading-[1.05] tracking-tight sm:text-6xl">
              We build <span className="text-glow text-primary">free software</span>.
            </h1>
            <p className="mx-auto mt-6 max-w-xl text-pretty text-lg leading-relaxed text-muted-foreground">
              Simple, dependable software for everyday needs — free, and made
              for everyone. Right now that work is in development; robotics and
              engineering projects are next.
            </p>
            <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
              <Button
                size="lg"
                render={
                  <a href={site.socials.discord} target="_blank" rel="noreferrer" />
                }
              >
                <MessageCircle data-icon="inline-start" className="size-4" />
                Join our Discord
              </Button>
              <Button
                size="lg"
                variant="outline"
                render={<Link href="/signup" />}
              >
                Create an account
              </Button>
            </div>
          </div>
        </Container>
      </section>

      <section className="border-t border-border/60">
        <Container className="py-20 sm:py-24">
          <div className="mx-auto max-w-2xl text-center">
            <Eyebrow>What we’re doing</Eyebrow>
<h2 className="mt-4 text-balance text-3xl font-semibold tracking-tight sm:text-4xl">
            Software now. Robotics and engineering next.
          </h2>
          </div>
          <div className="mx-auto mt-10 grid max-w-5xl gap-5 md:grid-cols-3">
            {focus.map((item, i) => (
              <Reveal key={item.title} delay={i * 80}>
                <Card className="h-full transition-colors hover:border-primary/30">
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <item.icon className="size-5 text-primary" />
                      <span className="rounded-full border border-border px-2.5 py-0.5 font-mono text-[0.65rem] uppercase tracking-wider text-muted-foreground">
                        {item.tag}
                      </span>
                    </div>
                    <CardTitle className="mt-3">{item.title}</CardTitle>
                    <CardDescription className="leading-relaxed">
                      {item.description}
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="px-0"
                      render={<Link href="/contact" />}
                    >
                      Learn more
                      <ArrowRight data-icon="inline-end" className="size-4" />
                    </Button>
                  </CardContent>
                </Card>
              </Reveal>
            ))}
          </div>
        </Container>
      </section>
    </>
  )
}