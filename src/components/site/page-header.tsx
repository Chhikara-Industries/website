import type { ReactNode } from "react"

import { Container, Eyebrow } from "@/components/site/section"
import { cn } from "@/lib/utils"

export function PageHeader({
  eyebrow,
  title,
  description,
  children,
  align = "left",
}: {
  eyebrow?: string
  title: ReactNode
  description?: ReactNode
  children?: ReactNode
  align?: "left" | "center"
}) {
  return (
    <section className="border-b border-border/60 bg-background">
      <Container
        className={cn(
          "py-16 sm:py-20",
          align === "center" && "flex flex-col items-center text-center"
        )}
      >
        {eyebrow ? <Eyebrow>{eyebrow}</Eyebrow> : null}
        <h1 className="mt-4 text-balance text-4xl font-semibold tracking-tight sm:text-5xl">
          {title}
        </h1>
        {description ? (
          <p
            className={cn(
              "mt-5 max-w-2xl text-pretty text-lg leading-relaxed text-muted-foreground",
              align === "center" && "mx-auto"
            )}
          >
            {description}
          </p>
        ) : null}
        {children}
      </Container>
    </section>
  )
}