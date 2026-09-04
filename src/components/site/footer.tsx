import Link from "next/link"
import { AtSign, Briefcase, Globe, MessageCircle } from "lucide-react"

import { Logo } from "@/components/site/logo"
import { Container } from "@/components/site/section"
import { site, footerLinks } from "@/lib/site"

export function Footer() {
  return (
    <footer className="border-t border-border/60 bg-background">
      <Container className="py-14">
        <div className="grid gap-10 md:grid-cols-[1.6fr_1fr_1fr]">
          <div>
            <Logo />
            <p className="mt-4 max-w-xs text-sm leading-relaxed text-muted-foreground">
              {site.description}
            </p>
            <div className="mt-5 flex items-center gap-2">
              {[
                { href: site.socials.github, icon: Globe, label: "GitHub" },
                { href: site.socials.x, icon: AtSign, label: "X" },
                { href: site.socials.linkedin, icon: Briefcase, label: "LinkedIn" },
                { href: site.socials.discord, icon: MessageCircle, label: "Discord" },
              ].map(({ href, icon: Icon, label }) => (
                <a
                  key={label}
                  href={href}
                  target="_blank"
                  rel="noreferrer"
                  aria-label={label}
                  className="inline-flex size-8 items-center justify-center rounded-lg border border-border text-muted-foreground transition-colors hover:border-primary/50 hover:text-primary"
                >
                  <Icon className="size-4" />
                </a>
              ))}
            </div>
          </div>

          {(
            [
              ["Account", footerLinks.account],
              ["Company", footerLinks.company],
            ] as const
          ).map(([title, links]) => (
            <div key={title}>
              <h3 className="font-mono text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground">
                {title}
              </h3>
              <ul className="mt-4 space-y-2.5">
                {links.map((link) => (
                  <li key={link.href}>
                    <Link
                      href={link.href}
                      className="text-sm text-foreground/80 transition-colors hover:text-primary"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="mt-12 flex flex-col items-start justify-between gap-4 border-t border-border/60 pt-6 sm:flex-row sm:items-center">
          <p className="font-mono text-xs text-muted-foreground">
            © {new Date().getFullYear()} {site.legalName}. All rights reserved.
          </p>
          <p className="font-mono text-xs text-muted-foreground">
            Deployed on <span className="text-primary">Vercel</span> · Backed by{" "}
            <span className="text-primary">Supabase</span>
          </p>
        </div>
      </Container>
    </footer>
  )
}