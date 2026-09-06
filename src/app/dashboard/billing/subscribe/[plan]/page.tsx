import type { Metadata } from "next"
import Link from "next/link"
import { ArrowLeft } from "lucide-react"

import { PayInForm } from "@/components/dashboard/pay-in-form"
import { requireDashboardAccess } from "@/lib/dal"
import { plans, type PlanId } from "@/lib/plans"

export const metadata: Metadata = {
  title: "Checkout",
}

export default async function SubscribePage({
  params,
}: {
  params: Promise<{ plan: string }>
}) {
  await requireDashboardAccess()
  const { plan: planSlug } = await params
  const plan = (plans as { id: string }[]).find((p) => p.id === planSlug)

  if (!plan || !("priceUsd" in plan) || !plan.priceUsd) {
    return (
      <div className="mx-auto max-w-2xl space-y-6">
        <h1 className="text-2xl font-semibold tracking-tight">Checkout</h1>
        <p className="rounded-xl border border-border bg-card/50 px-4 py-3 text-sm text-muted-foreground">
          Unknown plan.{" "}
          <Link href="/dashboard/billing" className="text-primary hover:underline">
            Back to billing
          </Link>
        </p>
      </div>
    )
  }

  const typedPlan = plan as (typeof plans)[number] & { id: PlanId }
  const priceUsd = plan.priceUsd as number

  return (
    <div className="space-y-6">
      <div>
        <Link
          href="/dashboard/billing"
          className="inline-flex items-center gap-1.5 font-mono text-xs text-muted-foreground transition-colors hover:text-foreground"
        >
          <ArrowLeft className="size-3.5" />
          Billing
        </Link>
        <h1 className="mt-3 text-2xl font-semibold tracking-tight">Subscribe</h1>
      </div>

      <PayInForm
        kind="subscription"
        heading={`Go ${typedPlan.name}`}
        description="Pick the asset you’ll pay in and add the wallet you’re sending from. The recurring amount is fixed by our server."
        itemLabel={`${typedPlan.name} · ${typedPlan.price} / ${typedPlan.priceNote}`}
        amountLabel={`$${priceUsd.toFixed(2)} / ${typedPlan.priceNote}`}
        hiddenFields={{ plan: typedPlan.id, packageId: "" }}
      />
    </div>
  )
}
