import "server-only"

export type CheckoutRow = {
  id: string
  user_id: string
  mode: string
  credits: number
  plan: string | null
  amount_usd: number
}

export type ServiceClient = NonNullable<
  ReturnType<typeof import("@/lib/supabase/service").createServiceClient>
>

// Shieldz only reports an invoice as paid once the payment is confirmed
// on-chain for the exact amount. That is our authoritative signal to write to
// the database (via the idempotent fulfill_checkout RPC). failed/expired are
// recorded without granting anything.
export const PAID_STATUSES = new Set(["paid", "finished"])

// Applies a paid event. The DB is only updated when the invoice is fully paid
// (fulfill_checkout is idempotent and grants credits / activates the plan at
// most once). No write happens for pending / underpaid statuses.
export async function applyPaid(
  supabase: ServiceClient,
  checkout: CheckoutRow,
  invoiceId: string
) {
  const { error } = await supabase.rpc("fulfill_checkout", {
    p_order_id: checkout.id,
    p_payment_id: invoiceId,
    p_payment_status: "paid",
  })
  if (error) {
    console.error("[payments] fulfill rpc failed", {
      orderId: checkout.id,
      error: error.message,
    })
  }
}

// Records a non-paid terminal state (failed / expired). This is a status
// update only — no credits or plan changes.
export async function applyNonPaid(
  supabase: ServiceClient,
  checkout: CheckoutRow,
  status: "failed" | "expired"
) {
  const { error } = await supabase
    .from("checkouts")
    .update({ status, shieldz_status: status })
    .eq("id", checkout.id)
    .eq("status", "awaiting_payment")
  if (error) {
    console.error("[payments] status update failed", {
      orderId: checkout.id,
      status,
      error: error.message,
    })
  }
}
