"use client"

import { useActionState, useEffect, useState } from "react"
import { Coins, Loader2, Repeat, ShieldCheck } from "lucide-react"

import { createCheckout, type CheckoutState } from "@/actions/billing"
import { isValidCryptoAddressAny } from "@/lib/crypto-address"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Input } from "@/components/ui/input"

type PayInFormProps = {
  kind: "subscription" | "credits"
  heading: string
  description: string
  itemLabel: string
  amountLabel: string
  hiddenFields: Record<string, string>
}

export function PayInForm({
  kind,
  heading,
  description,
  itemLabel,
  amountLabel,
  hiddenFields,
}: PayInFormProps) {
  const [state, formAction, pending] = useActionState<CheckoutState, FormData>(
    createCheckout,
    undefined
  )

  const [wallet, setWallet] = useState("")
  const [walletError, setWalletError] = useState<string | null>(null)
  const [invoiceError, setInvoiceError] = useState<string | null>(null)

  const isSubscription = kind === "subscription"

  useEffect(() => {
    const orderId = state?.orderId
    if (!orderId || pending) return
    let cancelled = false

    async function openCheckout() {
      let res: Response
      try {
        res = await fetch("/api/shieldz/create-invoice", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ orderId }),
        })
      } catch {
        if (!cancelled) setInvoiceError("Could not start the checkout. Please try again.")
        return
      }
      if (cancelled) return
      const json = (await res.json().catch(() => ({}))) as {
        payUrl?: string
        error?: string
      }
      if (res.ok && json.payUrl) {
        window.location.href = json.payUrl
        return
      }
      setInvoiceError(json.error ?? "Could not start the checkout.")
    }

    void openCheckout()
    return () => {
      cancelled = true
    }
  }, [state?.orderId, pending])

  const onWalletChange = (value: string) => {
    setWallet(value)
    if (!value) {
      setWalletError(null)
      return
    }
    setWalletError(
      isValidCryptoAddressAny(value)
        ? null
        : "Enter a valid BTC, ETH, or SOL wallet address."
    )
  }

  return (
    <form action={formAction} className="mx-auto max-w-2xl space-y-6">
      <input type="hidden" name="mode" value={kind} />
      {Object.entries(hiddenFields).map(([key, value]) => (
        <input key={key} type="hidden" name={key} value={value} />
      ))}

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            {isSubscription ? (
              <Repeat className="size-4 text-primary" />
            ) : (
              <Coins className="size-4 text-primary" />
            )}
            {heading}
          </CardTitle>
          <CardDescription>{description}</CardDescription>
        </CardHeader>

        <CardContent className="space-y-5">
          {/* Read-only summary — amount and item are fixed by the server. */}
          <div className="rounded-xl border border-border bg-muted/30 p-4">
            <div className="flex items-center justify-between">
              <p className="text-sm text-muted-foreground">{itemLabel}</p>
              <p className="font-mono text-lg font-semibold text-foreground">
                {amountLabel}
              </p>
            </div>
            <p className="mt-1 text-xs text-muted-foreground">
              The amount above is locked in by our server and can’t be changed.
            </p>
          </div>

          {/* Wallet address for refunds / records. */}
          <div>
            <label
              htmlFor="wallet"
              className="mb-1.5 block font-mono text-xs uppercase tracking-wider text-muted-foreground"
            >
              Your crypto wallet address
            </label>
            <Input
              id="wallet"
              name="wallet"
              value={wallet}
              onChange={(e) => onWalletChange(e.target.value)}
              placeholder="BTC (bc1…), ETH (0x…), or SOL address"
              autoComplete="off"
              spellCheck={false}
              aria-invalid={walletError != null}
            />
            <p className="mt-1 text-xs text-muted-foreground">
              Saved for refunds and your payment records. You’ll choose which
              asset to pay with on the secure checkout.
            </p>
            {walletError ? (
              <p className="mt-1 text-xs text-destructive">{walletError}</p>
            ) : null}
          </div>

          <Button
            type="submit"
            size="lg"
            className="w-full"
            disabled={pending || walletError != null || !wallet.trim()}
          >
            {pending ? (
              <span className="inline-flex items-center gap-2">
                <Loader2 className="size-4 animate-spin" />
                {isSubscription ? "Starting subscription…" : "Creating your order…"}
              </span>
            ) : (
              "Pay with crypto"
            )}
          </Button>

          {state?.errors ||
          (state?.message && !state?.orderId) ||
          invoiceError ? (
            <div className="space-y-1">
              {state?.errors
                ? Object.entries(state.errors).map(([key, messages]) => (
                    <p
                      key={key}
                      className="rounded-lg border border-destructive/40 bg-destructive/10 px-3 py-2.5 text-sm text-destructive"
                    >
                      {messages.join(" · ")}
                    </p>
                  ))
                : null}
              {invoiceError || (state?.message && !state?.orderId) ? (
                <p className="rounded-lg border border-destructive/30 bg-destructive/10 px-3 py-2.5 text-sm text-destructive">
                  {invoiceError ?? state?.message}
                </p>
              ) : null}
            </div>
          ) : null}

          <div className="flex items-start gap-3 rounded-xl border border-chart-2/40 bg-chart-2/10 px-4 py-3.5 text-sm">
            <ShieldCheck className="mt-0.5 size-4 shrink-0 text-chart-2" />
            <p className="leading-relaxed text-foreground/90">
              You’ll pay on a secure hosted checkout. Your plan or credits only
              activate after your payment is confirmed on-chain — sending less
              than the exact amount leaves the order unfulfilled.
            </p>
          </div>
        </CardContent>
      </Card>
    </form>
  )
}