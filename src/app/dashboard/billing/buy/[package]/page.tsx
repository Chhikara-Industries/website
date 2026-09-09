import type { Metadata } from "next"
import Link from "next/link"
import { ArrowLeft } from "lucide-react"

import { PayInForm } from "@/components/dashboard/pay-in-form"
import { requireDashboardAccess } from "@/lib/dal"
import { getTokenPackage } from "@/lib/token-packages"

export const metadata: Metadata = {
  title: "Checkout",
}

export default async function BuyCreditsPage({
  params,
}: {
  params: Promise<{ package: string }>
}) {
  await requireDashboardAccess()
  const { package: pkgSlug } = await params
  const pkg = getTokenPackage(pkgSlug)

  if (!pkg) {
    return (
      <div className="mx-auto max-w-2xl space-y-6">
        <h1 className="text-2xl font-semibold tracking-tight">Checkout</h1>
        <p className="rounded-xl border border-border bg-card/50 px-4 py-3 text-sm text-muted-foreground">
          Unknown package.{" "}
          <Link href="/dashboard/billing" className="text-primary hover:underline">
            Back to billing
          </Link>
        </p>
      </div>
    )
  }

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
        <h1 className="mt-3 text-2xl font-semibold tracking-tight">Buy credits</h1>
      </div>

      <PayInForm
        kind="credits"
        heading={`Buy ${pkg.name}`}
        description="Add the wallet to keep for refunds and records, then pay on the secure hosted checkout. The amount is fixed by our server."
        itemLabel={`${pkg.tokens.toLocaleString()} tokens · ${pkg.name}`}
        amountLabel={`$${pkg.priceUsd.toFixed(2)}`}
        hiddenFields={{ plan: "", packageId: pkg.id }}
      />
    </div>
  )
}
