"use client"

import { useCallback, useEffect, useRef, useState } from "react"
import QRCode from "qrcode"
import {
  CheckCircle2,
  CircleAlert,
  Copy,
  Loader2,
  Mail,
  Wallet2,
  XCircle,
} from "lucide-react"

import { cn } from "@/lib/utils"

type StatusState = {
  status: string
  nowpaymentsStatus: string | null
  paidAt: string | null
  payAddress: string | null
  payCurrency: string | null
  payAmount: number | null
  amountUsd: number | null
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
  const [qrDataUrl, setQrDataUrl] = useState<string | null>(null)
  const [copied, setCopied] = useState(false)
  const copiedTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

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

  const address = result?.ok ? result.data.payAddress : null
  const payCurrency = result?.ok ? result.data.payCurrency : null
  const payAmount = result?.ok ? result.data.payAmount : null
  const isSubscription = result?.ok && result.data.mode === "subscription"

  useEffect(() => {
    if (!address) return
    let cancelled = false
    QRCode.toDataURL(address, { width: 180, margin: 1 })
      .then((url) => {
        if (!cancelled) setQrDataUrl(url)
      })
      .catch(() => {
        // QR is a convenience; the raw address below still works.
      })
    return () => {
      cancelled = true
    }
  }, [address])

  const copyAddress = useCallback(async () => {
    if (!address) return
    try {
      await navigator.clipboard.writeText(address)
      setCopied(true)
      if (copiedTimer.current) clearTimeout(copiedTimer.current)
      copiedTimer.current = setTimeout(() => setCopied(false), 2000)
    } catch {
      // Clipboard unavailable — the address is selectable as plain text.
    }
  }, [address])

  const paying = result?.ok && result.data.status === "awaiting_payment"

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

      {result?.ok && paying && isSubscription ? (
        <div className="rounded-xl border border-primary/40 bg-card p-5">
          <p className="flex items-center gap-2 font-mono text-xs uppercase tracking-wider text-primary">
            <Mail className="size-4" />
            Payment link sent
          </p>
          <p className="mt-3 text-sm leading-relaxed text-foreground/85">
            NOWPayments emailed a secure payment link to the email on your
            account. Open it and pay with BTC, ETH, SOL or any supported asset
            to activate your plan. Your subscription renews automatically on
            the interval.
          </p>
          <p className="mt-3 rounded-lg border border-destructive/30 bg-destructive/5 px-3 py-2.5 text-sm text-foreground/80">
            Your plan activates only after the payment is confirmed on-chain.
          </p>
        </div>
      ) : null}

      {result?.ok && paying && address && !isSubscription ? (
        <div className="rounded-xl border border-primary/40 bg-card p-5">
          <p className="flex items-center gap-2 font-mono text-xs uppercase tracking-wider text-primary">
            <Wallet2 className="size-4" />
            Send exactly this to {payCurrency?.toUpperCase()}
          </p>

          <div className="mt-4 flex flex-col items-center gap-5 sm:flex-row sm:items-start">
            {qrDataUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={qrDataUrl}
                alt="Payment address QR code"
                className="size-32 rounded-lg border border-border bg-white p-1.5"
              />
            ) : (
              <div className="flex size-32 items-center justify-center rounded-lg border border-border bg-muted/30">
                <Loader2 className="size-5 animate-spin text-muted-foreground" />
              </div>
            )}

            <div className="min-w-0 flex-1 space-y-3 text-center sm:text-left">
              <div>
                <p className="font-mono text-xs uppercase tracking-wider text-muted-foreground">
                  Amount
                </p>
                <p className="mt-1 font-mono text-xl font-semibold">
                  {payAmount != null ? payAmount.toFixed(8) : "…"}{" "}
                  <span className="text-primary">{payCurrency?.toUpperCase()}</span>
                </p>
              </div>

              <div>
                <p className="font-mono text-xs uppercase tracking-wider text-muted-foreground">
                  {payCurrency?.toUpperCase()} address
                </p>
                <p className="mt-1 break-all font-mono text-xs leading-relaxed text-foreground/90">
                  {address}
                </p>
                <button
                  type="button"
                  onClick={copyAddress}
                  className={cn(
                    "mt-2 inline-flex items-center gap-1.5 rounded-lg border px-2.5 py-1.5 font-mono text-xs transition-colors",
                    copied
                      ? "border-chart-2/50 bg-chart-2/10 text-chart-2"
                      : "border-border text-muted-foreground hover:border-primary/40 hover:text-foreground"
                  )}
                >
                  <Copy className="size-3.5" />
                  {copied ? "Copied" : "Copy address"}
                </button>
              </div>
            </div>
          </div>

          <p className="mt-4 rounded-lg border border-destructive/30 bg-destructive/5 px-3 py-2.5 text-sm text-foreground/80">
            Send the exact amount above. Sending less — even by a fraction —
            leaves the order unfulfilled.
          </p>
        </div>
      ) : null}

      {result?.ok ? (
        <StatusCard metaKey={result.data.status} nowpaymentsStatus={result.data.nowpaymentsStatus} />
      ) : null}
    </div>
  )
}

function StatusCard({
  metaKey,
  nowpaymentsStatus,
}: {
  metaKey: string
  nowpaymentsStatus: string | null
}) {
  const meta = STATUS_META[metaKey] ?? {
    label: "Payment processing",
    detail: nowpaymentsStatus
      ? `NOWPayments status: ${nowpaymentsStatus}`
      : "Hang tight — your payment is being processed",
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