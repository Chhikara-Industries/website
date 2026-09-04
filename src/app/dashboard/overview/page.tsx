import type { Metadata } from "next"
import Link from "next/link"
import { ArrowRight, ArrowUpRight, Headphones, ShieldAlert, UserRound } from "lucide-react"

import { DashboardSection } from "@/components/dashboard/dashboard-section"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { requireDashboardAccess, getUserPlan } from "@/lib/dal"
import { recentActivity } from "@/lib/demo-usage"
import { site } from "@/lib/site"

export const metadata: Metadata = {
  title: "Overview",
}

const activityStyles = {
  billing: "border-chart-2/40 bg-chart-2/10 text-chart-2",
  product: "border-chart-5/40 bg-chart-5/10 text-chart-5",
  alert: "border-destructive/40 bg-destructive/10 text-destructive",
  security: "border-chart-4/40 bg-chart-4/10 text-chart-4",
} as const

export default async function OverviewPage() {
  const { user, demo } = await requireDashboardAccess()
  const rawPlan = demo ? "free" : await getUserPlan()
  const plan = rawPlan === "pro" ? "Pro" : rawPlan === "ultimate" ? "Ultimate" : "Free"

  const name = user?.name?.split(" ")[0] ?? "there"

  return (
    <div className="mx-auto max-w-5xl space-y-8">
      {demo ? (
        <div className="flex items-center gap-3 rounded-xl border border-primary/30 bg-primary/5 px-4 py-3 text-sm">
          <ShieldAlert className="size-4 shrink-0 text-primary" />
          <span>
            You&apos;re viewing your account in <strong>demo mode</strong>. Configure
            Supabase to enable real accounts and data.
          </span>
        </div>
      ) : null}

      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">
            Welcome back, {name}.
          </h1>
          <p className="mt-1 font-mono text-xs text-muted-foreground">
            {new Date().toLocaleDateString("en-US", {
              weekday: "long",
              year: "numeric",
              month: "long",
              day: "numeric",
            })}
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" render={<Link href="/dashboard/settings" />}>
            <UserRound data-icon="inline-start" className="size-4" />
            Account settings
          </Button>
          <Button render={<Link href="/dashboard/support" />}>
            <Headphones data-icon="inline-start" className="size-4" />
            Get support
            <ArrowRight data-icon="inline-end" className="size-4" />
          </Button>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <Card className="transition-colors hover:border-primary/30">
          <CardContent className="space-y-1 pt-6">
            <p className="font-mono text-xs uppercase tracking-wider text-muted-foreground">
              Plan
            </p>
            <p className="font-mono text-2xl font-semibold">{plan}</p>
            <p className="text-xs text-muted-foreground">
              {rawPlan === "ultimate"
                ? "infinite tokens, early + beta access"
                : rawPlan === "pro"
                  ? "5,000 tokens/week, beta access"
                  : "1,000 tokens/month"}
            </p>
          </CardContent>
        </Card>
        <Card className="transition-colors hover:border-primary/30">
          <CardContent className="space-y-1 pt-6">
            <p className="font-mono text-xs uppercase tracking-wider text-muted-foreground">
              Billing
            </p>
            <p className="font-mono text-2xl font-semibold">
              {rawPlan === "free" ? "—" : "Active"}
            </p>
            <p className="text-xs text-muted-foreground">
              {rawPlan === "free"
                ? "no subscription yet"
                : "crypto payments via NOWPayments"}
            </p>
          </CardContent>
        </Card>
        <Card className="transition-colors hover:border-primary/30">
          <CardContent className="space-y-1 pt-6">
            <p className="font-mono text-xs uppercase tracking-wider text-muted-foreground">
              Discord
            </p>
            <Link
              href={site.socials.discord}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-1.5 font-mono text-2xl font-semibold text-primary hover:underline"
            >
              Join us
              <ArrowUpRight data-icon="inline-end" className="size-4" />
            </Link>
            <p className="text-xs text-muted-foreground">
              on our Discord server
            </p>
          </CardContent>
        </Card>
      </div>

      <DashboardSection
        title="Recent activity"
        description="The latest events on your account."
      >
        <Card>
          <CardContent className="space-y-1">
            {recentActivity.length ? (
              recentActivity.map((item) => (
                <div
                  key={item.id}
                  className="flex items-start gap-3 rounded-lg px-2 py-2.5 transition-colors hover:bg-muted/40"
                >
                  <span
                    className={`mt-0.5 inline-flex size-6 shrink-0 items-center justify-center rounded-md border font-mono text-[0.6rem] uppercase ${activityStyles[item.type]}`}
                  >
                    {item.type.slice(0, 1)}
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium text-foreground">
                      {item.title}
                    </p>
                    <p className="truncate text-xs text-muted-foreground">
                      {item.detail}
                    </p>
                  </div>
                  <span className="shrink-0 font-mono text-[0.65rem] text-muted-foreground">
                    {item.time}
                  </span>
                </div>
              ))
            ) : (
              <p className="px-2 py-6 text-center font-mono text-xs text-muted-foreground">
                No recent activity yet
              </p>
            )}
          </CardContent>
        </Card>
      </DashboardSection>
    </div>
  )
}