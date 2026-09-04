import type { Metadata } from "next"
import { MessageCircle, ArrowUpRight } from "lucide-react"

import { PageHeader } from "@/components/site/page-header"
import { Container } from "@/components/site/section"
import { Reveal } from "@/components/site/reveal"
import { Button } from "@/components/ui/button"
import { site } from "@/lib/site"

export const metadata: Metadata = {
  title: "Contact",
  description:
    "Join the Chhikara Industries Discord server to reach us and the community.",
}

export default function ContactPage() {
  return (
    <>
      <PageHeader
        eyebrow="Contact"
        title="Join our Discord"
        description="The best way to reach Chhikara Industries is our Discord server — talk to us and the community in one place."
        align="center"
      />

      <section className="border-t border-border/60">
        <Container className="flex justify-center py-16 sm:py-20">
          <Reveal>
            <div className="w-full max-w-md rounded-2xl border border-border bg-card/50 p-8 text-center">
              <MessageCircle className="mx-auto size-8 text-primary" />
              <h2 className="mt-4 text-xl font-semibold tracking-tight">
                Chhikara Industries Discord
              </h2>
              <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                Join the server for questions, feedback, and updates
                straight from us.
              </p>
              <Button
                size="lg"
                className="mt-6 w-full"
                render={
                  <a href={site.socials.discord} target="_blank" rel="noreferrer" />
                }
              >
                Join the Discord server
                <ArrowUpRight data-icon="inline-end" className="size-4" />
              </Button>
            </div>
          </Reveal>
        </Container>
      </section>
    </>
  )
}