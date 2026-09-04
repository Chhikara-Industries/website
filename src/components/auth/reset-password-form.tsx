"use client"

import Link from "next/link"
import { useActionState } from "react"
import { KeyRound } from "lucide-react"

import type { FormState } from "@/actions/auth"
import { resetPassword } from "@/actions/auth"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { PasswordInput } from "@/components/ui/password-input"
import { Label } from "@/components/ui/label"

function FieldError({ state, id }: { state: FormState; id: string }) {
  const message = state?.errors?.[id]?.join(" · ")
  return message ? <p className="text-xs text-destructive">{message}</p> : null
}

export function ResetPasswordForm() {
  const [state, formAction, pending] = useActionState<FormState, FormData>(
    resetPassword,
    undefined
  )

  return (
    <Card className="border-border/80 bg-card/70 backdrop-blur">
      <CardHeader className="items-center text-center">
        <CardTitle className="text-2xl">Choose a new password</CardTitle>
        <CardDescription>
          Your identity was verified by the reset link in your email.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form action={formAction} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="password">New password</Label>
            <PasswordInput
              id="password"
              name="password"
              autoComplete="new-password"
              required
            />
            <FieldError state={state} id="password" />
          </div>

          <div className="space-y-2">
            <Label htmlFor="confirm">Confirm password</Label>
            <PasswordInput
              id="confirm"
              name="confirm"
              autoComplete="new-password"
              required
            />
            <FieldError state={state} id="confirm" />
          </div>

          {state?.message ? (
            <p className="rounded-lg border border-primary/30 bg-primary/10 px-3 py-2.5 text-sm text-primary">
              {state.message}
            </p>
          ) : null}

          <Button type="submit" disabled={pending} className="w-full" size="lg">
            <KeyRound data-icon="inline-start" className="size-4" />
            {pending ? "Updating…" : "Update password"}
          </Button>
        </form>

        <p className="mt-6 text-center text-sm text-muted-foreground">
          <Link href="/login" className="font-medium text-primary hover:underline">
            Back to sign in
          </Link>
        </p>
      </CardContent>
    </Card>
  )
}