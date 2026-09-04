import { Suspense, type ReactNode } from "react"
import Link from "next/link"

import { Logo } from "@/components/site/logo"

export default function AuthLayout({ children }: { children: ReactNode }) {
  return (
    <div className="relative flex min-h-dvh flex-col items-center justify-center px-5 py-12">
      <div className="pointer-events-none absolute inset-0 bg-grid opacity-40 [mask-image:radial-gradient(ellipse_50%_40%_at_50%_40%,black,transparent)]" />
      <div className="pointer-events-none absolute -top-32 left-1/2 h-72 w-[520px] -translate-x-1/2 rounded-full bg-primary/10 blur-[110px]" />

      <div className="relative w-full max-w-sm">
        <div className="mb-8 flex flex-col items-center gap-2 text-center">
          <Link href="/" aria-label="Chhikara Industries home">
            <Logo />
          </Link>
        </div>
        <Suspense
          fallback={
            <div className="rounded-2xl border border-border bg-card/70 p-8 shadow-sm">
              <div className="h-5 w-1/2 animate-pulse rounded bg-muted-foreground/20" />
            </div>
          }
        >
          {children}
        </Suspense>
        <p className="mt-8 text-center font-mono text-[0.7rem] text-muted-foreground">
          Chhikara Industries · {new Date().getFullYear()}
        </p>
      </div>
    </div>
  )
}