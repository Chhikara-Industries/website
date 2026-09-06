import type { Metadata } from "next"

import { PaymentStatus } from "@/components/dashboard/payment-status"
import { requireDashboardAccess } from "@/lib/dal"

export const metadata: Metadata = {
  title: "Payment",
}

export default async function PaymentStatusPage({
  searchParams,
}: {
  searchParams: Promise<{ order_id?: string }>
}) {
  await requireDashboardAccess()
  const { order_id } = await searchParams

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Payment</h1>
        <p className="mt-1 font-mono text-xs text-muted-foreground">
          Confirm your payment to complete your purchase
        </p>
      </div>

      {order_id ? <PaymentStatus orderId={order_id} /> : null}

      {!order_id ? (
        <p className="rounded-xl border border-border bg-card/50 px-4 py-3 text-sm text-muted-foreground">
          No order specified.
        </p>
      ) : null}
    </div>
  )
}
