"use client"

import { useActionState, useState } from "react"
import {
  Bitcoin,
  CircleDollarSign,
  Coins,
  ShieldCheck,
  Sparkles,
} from "lucide-react"

import {
  createCheckout,
  type CheckoutCrypto,
  type CheckoutState,
} from "@/actions/billing"
import { TOKENS_PER_CENT } from "@/lib/checkout"
import { tokenPackages } from "@/lib/token-packages"
import { plans } from "@/lib/plans"
import { PaymentStatus } from "@/components/dashboard/payment-status"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { cn } from "@/lib/utils"

const cryptos: { id: CheckoutCrypto; label: string; icon: typeof Bitcoin }[] = [
  { id: "btc", label: "BTC", icon: Bitcoin },
  { id: "eth", label: "ETH", icon: Coins },
  { id: "sol", label: "SOL", icon: CircleDollarSign },
]

const paidPlans = plans.filter((p) => p.id !== "free" && p.priceUsd)

export function BillingCheckout() {
  const [state, formAction, pending] = useActionState<CheckoutState, FormData>(
    createCheckout,
    undefined
  )

  const [mode, setMode] = useState<"subscription" | "credits">("subscription")
  const [planId, setPlanId] = useState(paidPlans[0]?.id ?? "pro")
  const [packageId, setPackageId] = useState(tokenPackages[2]?.id ?? "pro")
  const [crypto, setCrypto] = useState<CheckoutCrypto>("btc")

  const plan = paidPlans.find((p) => p.id === planId) ?? paidPlans[0]
  const pkg = tokenPackages.find((p) => p.id === packageId) ?? tokenPackages[0]
  const amountUsd = mode === "subscription" ? (plan?.priceUsd ?? 0) : (pkg?.priceUsd ?? 0)
  const canSubmit = amountUsd > 0

  if (state?.orderId) {
    return (
      <div className="space-y-4">
        <div className="rounded-xl border border-border bg-card/50 px-4 py-3 text-sm text-muted-foreground">
          {state.message}
        </div>
        <PaymentStatus orderId={state.orderId} />
        <p className="font-mono text-xs text-muted-foreground">
          Keep this page open — your purchase is confirmed automatically, no
          further action needed.
        </p>
      </div>
    )
  }

  return (
    <form action={formAction} className="space-y-6">
      <input type="hidden" name="mode" value={mode} />
      <input type="hidden" name="crypto" value={crypto} />
      <input type="hidden" name="plan" value={planId} />
      <input type="hidden" name="packageId" value={packageId} />

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
                  {p.price}
                  <span className="text-xs font-normal text-muted-foreground">
                    {" "}
                    / {p.priceNote}
                  </span>
                </p>
                {p.tagline ? (
                  <p className="mt-2 text-sm text-muted-foreground">{p.tagline}</p>
                ) : null}
              </button>
            ))}
          </div>
        ) : (
          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            {tokenPackages.map((p) => (
              <button
                key={p.id}
                type="button"
                onClick={() => setPackageId(p.id)}
                className={cn(
                  "relative rounded-xl border p-4 text-left transition-colors",
                  packageId === p.id
                    ? "border-primary/50 bg-primary/5"
                    : "border-border bg-card/50 hover:border-primary/30"
                )}
              >
                {p.popular ? (
                  <span className="absolute right-4 top-4 flex items-center gap-1 rounded-full border border-primary/30 bg-primary/10 px-2 py-0.5 font-mono text-[10px] uppercase tracking-wider text-primary">
                    <Sparkles className="size-3" />
                    Popular
                  </span>
                ) : null}
                <p className="font-medium">{p.name}</p>
                <p className="mt-1 font-mono text-sm text-muted-foreground">
                  {p.tokens.toLocaleString()} tokens
                </p>
                <p className="mt-2 font-mono text-2xl font-semibold">
                  ${p.priceUsd.toFixed(2)}
                </p>
                <p className="mt-1 text-sm text-muted-foreground">{p.note}</p>
                <span
                  className={cn(
                    "absolute bottom-4 right-4 size-4 rounded-full border",
                    packageId === p.id && "border-primary bg-primary"
                  )}
                />
              </button>
            ))}
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
              You’ll pay ${amountUsd.toFixed(2)} worth of{" "}
              <span className="font-semibold text-foreground">
                {crypto.toUpperCase()}
              </span>
              . The exact crypto amount and deposit address are shown as soon
              as your order is created.
            </p>
          </div>

          <Button
            type="submit"
            size="lg"
            className="mt-4 w-full"
            disabled={pending || !canSubmit}
          >
            {pending
              ? "Redirecting to NOWPayments…"
              : `Pay with ${crypto.toUpperCase()}`}
          </Button>

          {state?.errors ? (
            <div className="mt-3 space-y-1">
              {Object.entries(state.errors).map(([key, messages]) => (
                <p key={key} className="rounded-lg border border-destructive/40 bg-destructive/10 px-3 py-2.5 text-sm text-destructive">
                  {messages.join(" · ")}
                </p>
              ))}
            </div>
          ) : null}
          {state?.message && !state.redirectUrl ? (
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

      <p className="font-mono text-xs text-muted-foreground">
        Tokens are priced at {TOKENS_PER_CENT} per cent. All prices are
        settled on our server — the amount you’re shown here can’t be tampered
        with.
      </p>
    </form>
  )
}