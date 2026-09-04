import type { Metadata } from "next"
import { CheckCircle2, Landmark, LockKeyhole, XCircle } from "lucide-react"

import { BillingCheckout } from "@/components/dashboard/billing-checkout"
import { requireDashboardAccess } from "@/lib/dal"

export const metadata: Metadata = {
  title: "Billing",
}

export default async function BillingPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string }>
}) {
  await requireDashboardAccess()
  const { status } = await searchParams

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Billing</h1>
        <p className="mt-1 font-mono text-xs text-muted-foreground">
          Check out your subscription or buy credits
        </p>
      </div>

      {status === "success" ? (
        <div className="flex items-center gap-3 rounded-xl border border-chart-2/40 bg-chart-2/10 px-4 py-3 text-sm">
          <CheckCircle2 className="size-4 shrink-0 text-chart-2" />
          <span>
            Your payment was sent. It will be confirmed on-chain shortly and
            credits or your plan updated automatically.
          </span>
        </div>
      ) : null}
      {status === "cancelled" ? (
        <div className="flex items-center gap-3 rounded-xl border border-destructive/40 bg-destructive/10 px-4 py-3 text-sm">
          <XCircle className="size-4 shrink-0 text-destructive" />
          <span>Payment was cancelled. No charge was made.</span>
        </div>
      ) : null}

      <BillingCheckout />

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="rounded-xl border border-border bg-card/50 p-5">
          <p className="flex items-center gap-2 font-mono text-xs uppercase tracking-wider text-muted-foreground">
            <Landmark className="size-4 text-primary" />
            Payments
          </p>
          <p className="mt-2 text-sm leading-relaxed text-foreground/85">
            All payments are processed by NOWPayments using BTC, ETH, or SOL.
            No bank account is required.
          </p>
        </div>
        <div className="rounded-xl border border-border bg-card/50 p-5">
          <p className="flex items-center gap-2 font-mono text-xs uppercase tracking-wider text-muted-foreground">
            <LockKeyhole className="size-4 text-primary" />
            Receipts
          </p>
          <p className="mt-2 text-sm leading-relaxed text-foreground/85">
            Every payment you make is stored in our database, so your history
            and credits are always safe.
          </p>
        </div>
      </div>
    </div>
  )
}