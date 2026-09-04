"use client"

import { useActionState, useEffect, useState } from "react"
import {
  Bitcoin,
  CircleDollarSign,
  Coins,
  ShieldCheck,
  Zap,
} from "lucide-react"

import {
  createCheckout,
  type CheckoutCrypto,
  type CheckoutState,
} from "@/actions/billing"
import { MIN_CREDITS } from "@/lib/checkout"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { cn } from "@/lib/utils"

const cryptos: { id: CheckoutCrypto; label: string; icon: typeof Bitcoin }[] = [
  { id: "btc", label: "BTC", icon: Bitcoin },
  { id: "eth", label: "ETH", icon: Coins },
  { id: "sol", label: "SOL", icon: CircleDollarSign },
]

const paidPlans = [
  { id: "pro", name: "Pro", price: 5, note: "per month" },
  { id: "ultimate", name: "Ultimate", price: 7, note: "per month" },
] as const

export function BillingCheckout() {
  const [state, formAction, pending] = useActionState<CheckoutState, FormData>(
    createCheckout,
    undefined
  )

  const [mode, setMode] = useState<"subscription" | "credits">("subscription")
  const [planId, setPlanId] = useState<"pro" | "ultimate">("pro")
  const [crypto, setCrypto] = useState<CheckoutCrypto>("btc")
  const [tokensInput, setTokensInput] = useState("")

  useEffect(() => {
    if (state?.redirectUrl) {
      window.location.assign(state.redirectUrl)
    }
  }, [state])

  const plan = paidPlans.find((p) => p.id === planId) ?? paidPlans[0]
  const typedTokens = Math.max(Math.round(Number(tokensInput) || 0), 0)
  const amountUsd =
    mode === "subscription" ? String(plan.price) : String(typedTokens / 1000)
  const amount = Math.max(Number(amountUsd) || 0, 0)
  const tokens =
    mode === "subscription"
      ? Math.round(amount * 1000)
      : typedTokens

  const belowMin = mode === "credits" && typedTokens > 0 && typedTokens < MIN_CREDITS
  const canSubmit =
    amount > 0 && (mode === "subscription" || typedTokens >= MIN_CREDITS)

  return (
    <form action={formAction} className="space-y-6">
      <input type="hidden" name="mode" value={mode} />
      <input type="hidden" name="crypto" value={crypto} />
      <input type="hidden" name="amountUsd" value={amountUsd} />
      <input type="hidden" name="plan" value={planId} />

      <div>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 className="text-lg font-semibold tracking-tight">Checkout</h2>
          <div className="flex rounded-lg border border-border p-0.5">
            {(["subscription", "credits"] as const).map((m) => (
              <button
                key={m}
                type="button"
                onClick={() => setMode(m)}
                className={cn(
                  "rounded-md px-3 py-1.5 font-mono text-xs uppercase tracking-wider transition-colors",
                  mode === m
                    ? "bg-primary text-primary-foreground"
                    : "text-muted-foreground hover:text-foreground"
                )}
              >
                {m === "subscription" ? "Subscription" : "Credits"}
              </button>
            ))}
          </div>
        </div>

        {mode === "subscription" ? (
          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            {paidPlans.map((p) => (
              <button
                key={p.id}
                type="button"
                onClick={() => setPlanId(p.id)}
                className={cn(
                  "rounded-xl border p-4 text-left transition-colors",
                  planId === p.id
                    ? "border-primary/50 bg-primary/5"
                    : "border-border bg-card/50 hover:border-primary/30"
                )}
              >
                <div className="flex items-center justify-between">
                  <p className="font-medium">{p.name}</p>
                  <span
                    className={cn(
                      "size-4 rounded-full border",
                      planId === p.id && "border-primary bg-primary"
                    )}
                  />
                </div>
                <p className="mt-2 font-mono text-2xl font-semibold">
                  ${p.price}
                  <span className="text-xs font-normal text-muted-foreground">
                    {" "}
                    / {p.note}
                  </span>
                </p>
              </button>
            ))}
          </div>
        ) : (
          <div className="mt-4 space-y-3 rounded-xl border border-border bg-card/50 p-4">
            <div className="space-y-2">
              <Label htmlFor="checkout-tokens">Amount of tokens</Label>
              <Input
                id="checkout-tokens"
                type="number"
                min="1"
                step="1"
                value={tokensInput}
                onChange={(e) => setTokensInput(e.target.value)}
                placeholder="e.g. 500"
              />
              <p className="font-mono text-xs text-muted-foreground">
                {typedTokens > 0
                  ? `${typedTokens.toLocaleString()} tokens = $${(
                      typedTokens / 1000
                    ).toFixed(3)}`
                  : `10 tokens per cent. Minimum ${MIN_CREDITS.toLocaleString()} credits.`}
              </p>
              {belowMin ? (
                <p className="text-xs text-destructive">
                  Minimum purchase is {MIN_CREDITS.toLocaleString()} credits.
                </p>
              ) : null}
              {state?.errors?.amountUsd ? (
                <p className="text-xs text-destructive">
                  {state.errors.amountUsd.join(" · ")}
                </p>
              ) : null}
            </div>
            <p className="flex items-center gap-2 font-mono text-xs text-muted-foreground">
              <Zap className="size-4 text-primary" />
              You get {tokens.toLocaleString()} tokens at 10 tokens per cent.
            </p>
          </div>
        )}
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Coins className="size-4 text-primary" />
            Pay with crypto
          </CardTitle>
          <CardDescription>
            Transactions are processed by NOWPayments with no bank and no
            middleman in between.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex gap-2">
            {cryptos.map((c) => (
              <button
                key={c.id}
                type="button"
                onClick={() => setCrypto(c.id)}
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

          <div className="mt-4 rounded-xl border border-border bg-muted/30 p-4">
            <p className="text-sm text-muted-foreground">
              You’ll pay{" "}
              <span className="font-semibold text-foreground">
                $
                {mode === "credits"
                  ? amount.toFixed(3).replace(/0+$/, "").replace(/\.$/, "")
                  : amount.toFixed(2)}
              </span>{" "}
              worth of{" "}
              <span className="font-semibold text-foreground">
                {crypto.toUpperCase()}
              </span>
              . The exact crypto amount is set by NOWPayments at checkout.
            </p>
          </div>

          <Button type="submit" size="lg" className="mt-4 w-full" disabled={pending || !canSubmit}>
            {pending
              ? "Redirecting to NOWPayments…"
              : belowMin
                ? `Minimum ${MIN_CREDITS} credits`
                : `Pay with ${crypto.toUpperCase()}`}
          </Button>

          {state?.message ? (
            <p className="mt-3 rounded-lg border border-primary/30 bg-primary/10 px-3 py-2.5 text-sm text-primary">
              {state.message}
            </p>
          ) : null}
        </CardContent>
      </Card>

      <div className="flex items-start gap-3 rounded-xl border border-chart-2/40 bg-chart-2/10 px-4 py-3.5 text-sm">
        <ShieldCheck className="mt-0.5 size-4 shrink-0 text-chart-2" />
        <p className="leading-relaxed text-foreground/90">
          <span className="font-medium">Why crypto?</span> No bank is needed
          and nobody in the middle can see who sent a payment or who received
          it. Don’t worry — your payments are still recorded in our database,
          so every transaction shows up in your account.
        </p>
      </div>
    </form>
  )
}