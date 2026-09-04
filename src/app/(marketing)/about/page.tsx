import type { Metadata } from "next"
import Link from "next/link"
import {
  ArrowRight,
  Code2,
  Globe,
  Hammer,
  Layers,
  MessageCircle,
  Palette,
  RefreshCw,
  Rocket,
  Sprout,
  Target,
  Wrench,
} from "lucide-react"

import { PageHeader } from "@/components/site/page-header"
import { Container, SectionHeading } from "@/components/site/section"
import { Reveal } from "@/components/site/reveal"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { site } from "@/lib/site"

export const metadata: Metadata = {
  title: "About",
}

const facts = [
  {
    icon: Sprout,
    title: "Independent",
    description:
      "An independent company, free to build what we think is useful rather than what a shareholder wants.",
  },
  {
    icon: Hammer,
    title: "Small by design",
    description:
      "Hands-on and independent. Built in the open, with no layers in between — and no reason to add any.",
  },
  {
    icon: Code2,
    title: "Founded on software",
    description:
      "Software development and experimentation came first here — and still drive everything we do.",
  },
]

const whatWeBuild = [
  {
    icon: Code2,
    title: "Software",
    description:
      "Practical, free software for everyday needs. Just tools that work, without getting in the way.",
  },
  {
    icon: Globe,
    title: "Web applications",
    description:
      "Modern, responsive web apps built with clean architecture and fast, simple interfaces.",
  },
  {
    icon: Wrench,
    title: "Digital tools",
    description:
      "Small utilities and integrations that remove friction and save people time.",
  },
  {
    icon: Layers,
    title: "Products",
    description:
      "Product-level work we design, build, and operate ourselves — like Credits and the APIs on top of it.",
  },
]

const approach = [
  {
    icon: Hammer,
    title: "Practical engineering",
    description:
      "We prefer reliable, boring technology and solve real problems. No hype, no buzzwords.",
  },
  {
    icon: Palette,
    title: "Clean design",
    description:
      "Interfaces that are obvious and uncluttered. Form follows function.",
  },
  {
    icon: Target,
    title: "Useful functionality",
    description:
      "Every feature earns its place. If it doesn't help people, it doesn't ship.",
  },
  {
    icon: RefreshCw,
    title: "Continuous improvement",
    description:
      "We ship, listen, and iterate. Small releases and constant refinement.",
  },
]

const philosophy = [
  "Start small",
  "Build it ourselves",
  "Learn by doing",
  "Turn ideas into products",
]

export default function AboutPage() {
  return (
    <>
      <PageHeader
        eyebrow="About"
        title="Chhikara Industries"
        description="A small, independent technology company building practical software, web applications, and digital tools — one working product at a time."
        align="center"
      />

      <section className="border-t border-border/60">
        <Container className="py-20 sm:py-24">
          <SectionHeading
            eyebrow="01 · Who we are"
            title="An independent technology company, built on software."
            description="Chhikara Industries was founded around software development and experimentation. We're intentionally small and hands-on: we design, write, and run the things we build."
          />
          <div className="mt-10 grid gap-5 md:grid-cols-3">
            {facts.map((fact, i) => (
              <Reveal key={fact.title} delay={i * 80}>
                <Card className="h-full transition-colors hover:border-primary/30">
                  <CardHeader>
                    <fact.icon className="size-5 text-primary" />
                    <CardTitle className="mt-3">{fact.title}</CardTitle>
                    <CardDescription className="leading-relaxed">
                      {fact.description}
                    </CardDescription>
                  </CardHeader>
                </Card>
              </Reveal>
            ))}
          </div>
        </Container>
      </section>

      <section className="border-t border-border/60">
        <Container className="py-20 sm:py-24">
          <SectionHeading
            eyebrow="02 · What we build"
            title="Software, web apps, digital tools, and technology products."
            description="Everything we make is focused on being practical and genuinely useful. If it doesn't work well, we don't ship it."
          />
          <div className="mt-10 grid gap-5 sm:grid-cols-2">
            {whatWeBuild.map((item, i) => (
              <Reveal key={item.title} delay={(i % 2) * 80}>
                <Card className="h-full transition-colors hover:border-primary/30">
                  <CardHeader>
                    <item.icon className="size-5 text-primary" />
                    <CardTitle className="mt-3">{item.title}</CardTitle>
                    <CardDescription className="leading-relaxed">
                      {item.description}
                    </CardDescription>
                  </CardHeader>
                </Card>
              </Reveal>
            ))}
          </div>
        </Container>
      </section>

      <section className="border-t border-border/60">
        <Container className="py-20 sm:py-24">
          <SectionHeading
            eyebrow="03 · Our approach"
            title="Practical engineering, clean design, and real value."
            description="How we work matters as much as what we build."
          />
          <div className="mt-10 grid gap-5 sm:grid-cols-2">
            {approach.map((item, i) => (
              <Reveal key={item.title} delay={(i % 2) * 80}>
                <Card className="h-full transition-colors hover:border-primary/30">
                  <CardHeader>
                    <item.icon className="size-5 text-primary" />
                    <CardTitle className="mt-3">{item.title}</CardTitle>
                    <CardDescription className="leading-relaxed">
                      {item.description}
                    </CardDescription>
                  </CardHeader>
                </Card>
              </Reveal>
            ))}
          </div>
        </Container>
      </section>

      <section className="border-t border-border/60">
        <Container className="py-20 sm:py-24">
          <SectionHeading
            eyebrow="04 · Our philosophy"
            title="Start small. Build it ourselves. Learn by doing."
          />
          <div className="mt-10 flex flex-wrap justify-center gap-3">
            {philosophy.map((phrase, i) => (
              <Reveal key={phrase} delay={i * 80}>
                <span className="inline-flex items-center gap-2 rounded-full border border-border px-4 py-2 font-mono text-sm text-foreground/90">
                  <span className="text-primary">{String(i + 1).padStart(2, "0")}</span>
                  {phrase}
                </span>
              </Reveal>
            ))}
          </div>
          <Reveal delay={160}>
            <p className="mx-auto mt-8 max-w-2xl text-pretty text-center text-base leading-relaxed text-muted-foreground">
              We&apos;d rather have one working product than ten half-finished ideas.
              Every project starts small, and most of the value comes from
              learning through experimentation and turning what we learn into
              real products.
            </p>
          </Reveal>
        </Container>
      </section>

      <section className="border-t border-border/60">
        <Container className="py-20 sm:py-24">
          <Reveal>
            <div className="mx-auto max-w-3xl rounded-2xl border border-primary/25 bg-primary/5 p-8 sm:p-10">
              <SectionHeading
                eyebrow="05 · Our vision"
                title="A broader technology company, built one product at a time."
                description="Our goal is to grow Chhikara Industries into a company capable of developing its own software products and services — today that means software, web apps, and digital tools; tomorrow, a wider range of things we design, build, and run ourselves."
                align="center"
              />
              <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
                <Button render={<Link href="/products" />}>
                  <Rocket data-icon="inline-start" className="size-4" />
                  See what we&apos;re building
                </Button>
                <Button
                  variant="outline"
                  render={
                    <a href={site.socials.discord} target="_blank" rel="noreferrer" />
                  }
                >
                  <MessageCircle data-icon="inline-start" className="size-4" />
                  Join our Discord
                </Button>
              </div>
            </div>
          </Reveal>
        </Container>
      </section>

      <section className="border-t border-border/60">
        <Container className="pb-20 text-center sm:pb-24">
          <Reveal>
            <p className="mx-auto max-w-xl text-pretty text-lg leading-relaxed text-foreground/90">
              Chhikara Industries is a young company building toward something
              bigger — one working product at a time.
            </p>
            <Button
              variant="ghost"
              className="mt-6"
              render={<Link href="/contact" />}
            >
              Get in touch
              <ArrowRight data-icon="inline-end" className="size-4" />
            </Button>
          </Reveal>
        </Container>
      </section>
    </>
  )
}