import { PageHeader } from "@/components/site/page-header"
import { Container } from "@/components/site/section"
import { Reveal } from "@/components/site/reveal"

export type LegalSection = {
  heading: string
  body: string[]
}

export function LegalPage({
  eyebrow,
  title,
  description,
  updated,
  sections,
}: {
  eyebrow: string
  title: string
  description: string
  updated: string
  sections: LegalSection[]
}) {
  return (
    <>
      <PageHeader
        eyebrow={eyebrow}
        title={title}
        description={description}
      >
        <p className="mt-5 font-mono text-xs text-muted-foreground">
          Last updated {updated}
        </p>
      </PageHeader>

      <section className="border-t border-border/60">
        <Container className="max-w-3xl py-14 sm:py-16">
          <div className="space-y-10">
            {sections.map((section, i) => (
              <Reveal key={section.heading} delay={i * 30}>
                <section>
                  <h2 className="text-xl font-semibold tracking-tight">
                    {section.heading}
                  </h2>
                  {section.body.map((paragraph) => (
                    <p
                      key={paragraph.slice(0, 40)}
                      className="mt-3 text-sm leading-relaxed text-muted-foreground"
                    >
                      {paragraph}
                    </p>
                  ))}
                </section>
              </Reveal>
            ))}
          </div>
        </Container>
      </section>
    </>
  )
}