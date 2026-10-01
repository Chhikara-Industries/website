"use client"

import Link from "next/link"
import { useRouter, useSearchParams } from "next/navigation"
import { useState } from "react"
import { KeyRound } from "lucide-react"
import { useAuthActions } from "@convex-dev/auth/react"

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

type FieldErrors = {
  password?: string
  confirm?: string
}

function validatePassword(password: string): string[] {
  const errors: string[] = []
  if (password.length < 8) errors.push("Use at least 8 characters")
  if (!/[a-zA-Z]/.test(password)) errors.push("Include at least one letter")
  if (!/[0-9]/.test(password)) errors.push("Include at least one number")
  return errors
}

export function ResetPasswordForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { signIn } = useAuthActions()
  const [errors, setErrors] = useState<FieldErrors>({})
  const [error, setError] = useState<string | null>(null)
  const [pending, setPending] = useState(false)

  const code = searchParams.get("code")
  const email = searchParams.get("email")

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setError(null)
    setErrors({})
    const form = new FormData(e.currentTarget)

    const password = String(form.get("password") ?? "")
    const confirm = String(form.get("confirm") ?? "")

    const nextErrors: FieldErrors = {}
    const pwErrors = validatePassword(password)
    if (pwErrors.length) nextErrors.password = pwErrors.join(" · ")
    if (password !== confirm) nextErrors.confirm = "Passwords do not match"
    if (Object.keys(nextErrors).length > 0) {
      setErrors(nextErrors)
      return
    }

    setPending(true)
    try {
      await signIn("password", {
        email: email ?? "",
        newPassword: password,
        code: code ?? "",
        flow: "reset-verification",
      })
      router.push("/login?reset=success")
      router.refresh()
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not reset your password.")
    } finally {
      setPending(false)
    }
  }

  if (!code || !email) {
    return (
      <Card className="border-border/80 bg-card/70 backdrop-blur">
        <CardHeader className="items-center text-center">
          <CardTitle className="text-2xl">Choose a new password</CardTitle>
          <CardDescription>
            This reset link is invalid or has expired.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-center text-sm text-muted-foreground">
            Request a fresh link from the{" "}
            <Link href="/forgot-password" className="font-medium text-primary hover:underline">
              forgot password
            </Link>{" "}
            page.
          </p>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="border-border/80 bg-card/70 backdrop-blur">
      <CardHeader className="items-center text-center">
        <CardTitle className="text-2xl">Choose a new password</CardTitle>
        <CardDescription>
          Your identity was verified by the reset link in your email.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="password">New password</Label>
            <PasswordInput
              id="password"
              name="password"
              autoComplete="new-password"
              required
            />
            {errors.password ? (
              <p className="text-xs text-destructive">{errors.password}</p>
            ) : null}
          </div>

          <div className="space-y-2">
            <Label htmlFor="confirm">Confirm password</Label>
            <PasswordInput
              id="confirm"
              name="confirm"
              autoComplete="new-password"
              required
            />
            {errors.confirm ? (
              <p className="text-xs text-destructive">{errors.confirm}</p>
            ) : null}
          </div>

          {error ? (
            <p className="rounded-lg border border-destructive/40 bg-destructive/10 px-3 py-2.5 text-sm text-destructive">
              {error}
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