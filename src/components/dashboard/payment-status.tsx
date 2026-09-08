"use client"

import { useEffect, useState } from "react"
import { CheckCircle2, CircleAlert, Loader2, XCircle } from "lucide-react"
import Link from "next/link"

import { cn } from "@/lib/utils"

type StatusState = {
  status: string
  shieldzStatus: string | null
  paidAt: string | null
  item: string | null
  mode?: string | null
}

type PollResult =
  | { ok: true; data: StatusState }
  | { ok: false; error: string }

const STATUS_META: Record<
  string,
  { label: string; detail: string; tone: "pending" | "positive" | "negative" }
> = {
  pending: {
    label: "Preparing your checkout",
    detail: "Your secure checkout is being opened",
    tone: "pending",
  },
  awaiting_payment: {
    label: "Waiting for your payment",
    detail: "We’ll confirm automatically once the transaction is on-chain",
    tone: "pending",
  },
  paid: {
    label: "Payment received",
    detail: "Your credits or plan are being applied to your account",
    tone: "positive",
  },
  failed: {
    label: "Payment failed",
    detail: "No charge was made. Start a new checkout to try again.",
    tone: "negative",
  },
  expired: {
    label: "Checkout expired",
    detail: "No charge was made. Start a new checkout to continue.",
    tone: "negative",
  },
}

const TERMINAL = new Set(["paid", "failed", "expired"])

export function PaymentStatus({ orderId }: { orderId: string }) {
  const [result, setResult] = useState<PollResult | null>(null)

  useEffect(() => {
    let cancelled = false

    async function poll() {
      try {
        const res = await fetch(`/api/payments/status?order_id=${orderId}`)
        if (res.status === 200) {
          const json = (await res.json()) as StatusState
          if (!cancelled) {
            setResult({ ok: true, data: json })
            if (TERMINAL.has(json.status)) clearInterval(timer)
          }
        } else if (res.status === 404 && !cancelled) {
          setResult({ ok: false, error: "Order not found." })
        }
      } catch {
        // Transient network error — the next tick retries.
      }
    }

    poll()
    const timer = setInterval(poll, 3000)
    return () => {
      cancelled = true
      clearInterval(timer)
    }
  }, [orderId])

  return (
    <div className="space-y-4">
      {!result ? (
        <div className="flex items-center gap-3 rounded-xl border border-border bg-card/50 px-4 py-3 text-sm">
          <Loader2 className="size-4 shrink-0 animate-spin text-primary" />
          <span>Checking payment status…</span>
        </div>
      ) : null}

      {result && !result.ok ? (
        <div className="flex items-center gap-3 rounded-xl border border-border bg-card/50 px-4 py-3 text-sm text-muted-foreground">
          <CircleAlert className="size-4 shrink-0" />
          <span>{result.error}</span>
        </div>
      ) : null}

      {result?.ok ? (
        <>
          <StatusCard status={result.data.status} />
          {result.data.status === "awaiting_payment" ? (
            <div className="rounded-xl border border-primary/40 bg-card p-5">
              <p className="mt-3 text-sm leading-relaxed text-foreground/85">
                Keep this page open (or come back here later). We confirm the
                payment from our servers — you don’t need to send us anything.
              </p>
              <Link
                href="/dashboard/billing"
                className="mt-3 inline-flex text-sm text-primary hover:underline"
              >
                Back to billing
              </Link>
            </div>
          ) : null}
        </>
      ) : null}
    </div>
  )
}

function StatusCard({ status }: { status: string }) {
  const meta = STATUS_META[status] ?? {
    label: "Payment processing",
    detail: "Hang tight — your payment is being processed",
    tone: "pending" as const,
  }

  const Icon =
    meta.tone === "positive"
      ? CheckCircle2
      : meta.tone === "negative"
        ? XCircle
        : Loader2

  return (
    <div
      className={cn(
        "flex items-start gap-3 rounded-xl border px-4 py-3 text-sm",
        meta.tone === "positive" && "border-chart-2/40 bg-chart-2/10",
        meta.tone === "negative" && "border-destructive/40 bg-destructive/10",
        meta.tone === "pending" && "border-primary/30 bg-primary/10"
      )}
    >
      <Icon
        className={cn(
          "mt-0.5 size-4 shrink-0",
          meta.tone === "pending" && "animate-spin",
          meta.tone === "positive" && "text-chart-2",
          meta.tone === "negative" && "text-destructive"
        )}
      />
      <div>
        <p
          className={cn(
            "font-medium",
            meta.tone === "positive" && "text-chart-2",
            meta.tone === "negative" && "text-destructive",
            meta.tone === "pending" && "text-primary"
          )}
        >
          {meta.label}
        </p>
        <p className="mt-0.5 leading-relaxed text-foreground/75">{meta.detail}</p>
      </div>
    </div>
  )
}