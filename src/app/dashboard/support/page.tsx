import type { Metadata } from "next"
import { ArrowUpRight, MessageCircle } from "lucide-react"

import { requireDashboardAccess } from "@/lib/dal"
import { site } from "@/lib/site"
import { Button } from "@/components/ui/button"

export const metadata: Metadata = {
  title: "Support",
}

const faqs = [
  ["How quickly will you reply?", "Join our Discord and we normally reply within 24 hours on every plan."],
  ["Can I recover my account if I lose access?", "Yes — use the reset link on the sign-in page. It works with the email on your account."],
  ["Do you have a phone number?", "Not yet. Our Discord server is the fastest way to reach us."],
  ["Will my data be shared?", "No. Your account data is never sold or shared. See the privacy policy for the full picture."],
]

export default async function SupportPage() {
  await requireDashboardAccess()

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Support</h1>
        <p className="mt-1 font-mono text-xs text-muted-foreground">
          We reply within 24 hours on every plan.
        </p>
      </div>

      <div className="rounded-2xl border border-border bg-card/50 p-8 text-center">
        <MessageCircle className="mx-auto size-8 text-primary" />
        <h2 className="mt-4 text-xl font-semibold tracking-tight">
          Chhikara Industries Discord
        </h2>
        <p className="mx-auto mt-2 max-w-md text-sm leading-relaxed text-muted-foreground">
          The best way to get support is our Discord server — talk to us
          and the community in one place.
        </p>
        <Button
          size="lg"
          className="mt-6 w-full sm:w-auto"
          render={
            <a href={site.socials.discord} target="_blank" rel="noreferrer" />
          }
        >
          Join the Discord server
          <ArrowUpRight data-icon="inline-end" className="size-4" />
        </Button>
      </div>

      <div className="rounded-xl border border-border bg-card/50 p-5">
        <p className="flex items-center gap-2 font-mono text-xs uppercase tracking-wider text-muted-foreground">
          <MessageCircle className="size-4 text-primary" />
          Common questions
        </p>
        <div className="mt-4 space-y-3">
          {faqs.map(([q, a]) => (
            <details key={q} className="group rounded-lg border border-border bg-background px-4 py-3">
              <summary className="flex cursor-pointer list-none items-center justify-between gap-4 text-sm font-medium text-foreground">
                {q}
                <span className="text-primary transition-transform group-open:rotate-45">+</span>
              </summary>
              <p className="mt-2 text-sm text-muted-foreground">{a}</p>
            </details>
          ))}
        </div>
      </div>
    </div>
  )
}