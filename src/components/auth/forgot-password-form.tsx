"use client"

import Link from "next/link"
import { useActionState } from "react"
import { MailCheck } from "lucide-react"

import type { FormState } from "@/actions/auth"
import { forgotPassword } from "@/actions/auth"
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

export function ForgotPasswordForm() {
  const [state, formAction, pending] = useActionState<FormState, FormData>(
    forgotPassword,
    undefined
  )

  return (
    <Card className="border-border/80 bg-card/70 backdrop-blur">
      <CardHeader className="items-center text-center">
        <CardTitle className="text-2xl">Reset your password</CardTitle>
        <CardDescription>
          Enter your email and we’ll send you a reset link.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form action={formAction} className="space-y-4">
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
            {state?.errors?.email ? (
              <p className="text-xs text-destructive">{state.errors.email.join(" · ")}</p>
            ) : null}
          </div>

          {state?.message ? (
            <p className="flex items-start gap-2 rounded-lg border border-primary/30 bg-primary/10 px-3 py-2.5 text-sm text-primary">
              <MailCheck className="mt-0.5 size-4 shrink-0" />
              {state.message}
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