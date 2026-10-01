"use client"

import Link from "next/link"
import { useState } from "react"
import { MailCheck } from "lucide-react"
import { useAuthActions } from "@convex-dev/auth/react"

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

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

export function ForgotPasswordForm() {
  const { signIn } = useAuthActions()
  const [emailError, setEmailError] = useState<string | null>(null)
  const [message, setMessage] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [pending, setPending] = useState(false)

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setEmailError(null)
    setMessage(null)
    setError(null)
    const form = new FormData(e.currentTarget)
    const email = String(form.get("email") ?? "").trim()
    if (!EMAIL_RE.test(email)) {
      setEmailError("Enter a valid email address")
      return
    }

    setPending(true)
    try {
      await signIn("password", { email, flow: "reset" })
      setMessage("If that email exists, a reset link is on its way.")
    } catch {
      // Don't reveal whether the account exists.
      setMessage("If that email exists, a reset link is on its way.")
    } finally {
      setPending(false)
    }
  }

  return (
    <Card className="border-border/80 bg-card/70 backdrop-blur">
      <CardHeader className="items-center text-center">
        <CardTitle className="text-2xl">Reset your password</CardTitle>
        <CardDescription>
          Enter your email and we’ll send you a reset link.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              name="email"
              type="email"
              autoComplete="email"
              placeholder="you@company.com"
              required
            />
            {emailError ? <p className="text-xs text-destructive">{emailError}</p> : null}
          </div>

          {message ? (
            <p className="flex items-start gap-2 rounded-lg border border-primary/30 bg-primary/10 px-3 py-2.5 text-sm text-primary">
              <MailCheck className="mt-0.5 size-4 shrink-0" />
              {message}
            </p>
          ) : null}

          {error ? (
            <p className="rounded-lg border border-destructive/40 bg-destructive/10 px-3 py-2.5 text-sm text-destructive">
              {error}
            </p>
          ) : null}

          <Button type="submit" disabled={pending} className="w-full" size="lg">
            {pending ? "Sending…" : "Send reset link"}
          </Button>
        </form>

        <p className="mt-6 text-center text-sm text-muted-foreground">
          Remembered it?{" "}
          <Link href="/login" className="font-medium text-primary hover:underline">
            Back to sign in
          </Link>
        </p>
      </CardContent>
    </Card>
  )
}