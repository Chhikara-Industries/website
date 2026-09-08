"use client"

import { useActionState, useEffect, useState } from "react"
import { Bitcoin, CircleDollarSign, Coins, Loader2, Repeat, ShieldCheck } from "lucide-react"

import {
  createCheckout,
  type CheckoutCrypto,
  type CheckoutState,
} from "@/actions/billing"
import { isValidCryptoAddress, type PayCrypto } from "@/lib/crypto-address"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { cn } from "@/lib/utils"

const cryptos: {
  id: CheckoutCrypto
  label: string
  addressHint: string
  icon: typeof Bitcoin
}[] = [
  {
    id: "btc",
    label: "BTC",
    addressHint: "bc1… or 1… / 3… legacy or SegWit address",
    icon: Bitcoin,
  },
  {
    id: "eth",
    label: "ETH",
    addressHint: "0x + 40 hex characters",
    icon: Coins,
  },
  {
    id: "sol",
    label: "SOL",
    addressHint: "Base58 address, 32–44 characters",
    icon: CircleDollarSign,
  },
]

type PayInFormProps = {
  kind: "subscription" | "credits"
  heading: string
  description: string
  itemLabel: string
  amountLabel: string
  cryptoDefault?: CheckoutCrypto
  hiddenFields: Record<string, string>
}

export function PayInForm({
  kind,
  heading,
  description,
  itemLabel,
  amountLabel,
  cryptoDefault = "btc",
  hiddenFields,
}: PayInFormProps) {
  const [state, formAction, pending] = useActionState<CheckoutState, FormData>(
    createCheckout,
    undefined
  )

  const [crypto, setCrypto] = useState<CheckoutCrypto>(cryptoDefault)
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
      isValidCryptoAddress(value, crypto as PayCrypto)
        ? null
        : `This doesn’t look like a valid ${crypto.toUpperCase()} address.`
    )
  }

  const onCryptoChange = (id: CheckoutCrypto) => {
    setCrypto(id)
    if (wallet) {
      setWalletError(
        isValidCryptoAddress(wallet, id as PayCrypto)
          ? null
          : `This doesn’t look like a valid ${id.toUpperCase()} address.`
      )
    }
  }

  const busy = pending

  return (
    <form action={formAction} className="mx-auto max-w-2xl space-y-6">
      <input type="hidden" name="mode" value={kind} />
      <input type="hidden" name="crypto" value={crypto} />
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

          {/* Asset the customer pays in — fixed amount on our side. */}
          <div>
            <p className="mb-2 font-mono text-xs uppercase tracking-wider text-muted-foreground">
              Pay with
            </p>
            <div className="flex gap-2">
              {cryptos.map((c) => (
                <button
                  key={c.id}
                  type="button"
                  onClick={() => onCryptoChange(c.id)}
                  className={cn(
                    "flex flex-1 items-center justify-center gap-2 rounded-lg border px-3 py-2.5 font-mono text-sm transition-colors",
                    crypto === c.id
                      ? "border-primary/50 bg-primary/5 text-foreground"
                      : "border-border text-muted-foreground hover:border-primary/30 hover:text-foreground"
                  )}
                >
                  <c.icon className="size-4 text-primary" />
                  {c.label}
                </button>
              ))}
            </div>
          </div>

          {/* Wallet address for refunds / records. */}
          <div>
            <label
              htmlFor="wallet"
              className="mb-1.5 block font-mono text-xs uppercase tracking-wider text-muted-foreground"
            >
              Your {crypto.toUpperCase()} wallet address
            </label>
            <Input
              id="wallet"
              name="wallet"
              value={wallet}
              onChange={(e) => onWalletChange(e.target.value)}
              placeholder={cryptos.find((c) => c.id === crypto)?.addressHint}
              autoComplete="off"
              spellCheck={false}
              aria-invalid={walletError != null}
            />
            <p className="mt-1 text-xs text-muted-foreground">
              Saved for refunds and your payment records.
            </p>
            {walletError ? (
              <p className="mt-1 text-xs text-destructive">{walletError}</p>
            ) : null}
          </div>

          <Button
            type="submit"
            size="lg"
            className="w-full"
            disabled={busy || walletError != null || !wallet.trim()}
          >
            {busy ? (
              <span className="inline-flex items-center gap-2">
                <Loader2 className="size-4 animate-spin" />
                {isSubscription ? "Starting subscription…" : "Creating your order…"}
              </span>
            ) : isSubscription ? (
              "Start subscription"
            ) : (
              `Pay with ${crypto.toUpperCase()}`
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