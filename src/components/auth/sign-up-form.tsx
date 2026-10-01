"use client"

import Link from "next/link"
import { useRouter } from "next/navigation"
import { useState } from "react"
import { Rocket } from "lucide-react"
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
import { PasswordInput } from "@/components/ui/password-input"
import { SocialLoginButtons } from "@/components/auth/social-login-buttons"

type FieldErrors = {
  name?: string
  email?: string
  password?: string
  confirm?: string
}

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

function validatePassword(password: string): string[] {
  const errors: string[] = []
  if (password.length < 8) errors.push("Use at least 8 characters")
  if (!/[a-zA-Z]/.test(password)) errors.push("Include at least one letter")
  if (!/[0-9]/.test(password)) errors.push("Include at least one number")
  return errors
}

export function SignUpForm() {
  const router = useRouter()
  const { signIn } = useAuthActions()
  const [errors, setErrors] = useState<FieldErrors>({})
  const [error, setError] = useState<string | null>(null)
  const [pending, setPending] = useState(false)

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setError(null)
    setErrors({})
    const form = new FormData(e.currentTarget)

    const name = String(form.get("name") ?? "").trim()
    const email = String(form.get("email") ?? "").trim()
    const password = String(form.get("password") ?? "")
    const confirm = String(form.get("confirm") ?? "")

    const nextErrors: FieldErrors = {}
    if (name.length < 2) nextErrors.name = "Enter your name"
    if (!EMAIL_RE.test(email)) nextErrors.email = "Enter a valid email address"
    const pwErrors = validatePassword(password)
    if (pwErrors.length) nextErrors.password = pwErrors.join(" · ")
    if (password !== confirm) nextErrors.confirm = "Passwords do not match"
    if (Object.keys(nextErrors).length > 0) {
      setErrors(nextErrors)
      return
    }

    setPending(true)
    try {
      await signIn("password", { name, email, password, flow: "signUp" })
      router.push("/dashboard")
      router.refresh()
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not create your account.")
    } finally {
      setPending(false)
    }
  }

  return (
    <Card className="border-border/80 bg-card/70 backdrop-blur">
      <CardHeader className="items-center text-center">
        <CardTitle className="text-2xl">Create your account</CardTitle>
        <CardDescription>
          One account for everything Chhikara Industries builds.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <SocialLoginButtons />

        <div className="relative">
          <div className="absolute inset-0 flex items-center">
            <span className="w-full border-t border-border" />
          </div>
          <div className="relative flex justify-center text-xs uppercase">
            <span className="bg-card px-2 text-muted-foreground">
              or sign up with email
            </span>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Name</Label>
            <Input
              id="name"
              name="name"
              autoComplete="name"
              placeholder="Ada Lovelace"
              required
            />
            {errors.name ? <p className="text-xs text-destructive">{errors.name}</p> : null}
          </div>

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
            {errors.email ? <p className="text-xs text-destructive">{errors.email}</p> : null}
          </div>

          <div className="space-y-2">
            <Label htmlFor="password">Password</Label>
            <PasswordInput
              id="password"
              name="password"
              autoComplete="new-password"
              required
            />
            {errors.password ? <p className="text-xs text-destructive">{errors.password}</p> : null}
          </div>

          <div className="space-y-2">
            <Label htmlFor="confirm">Confirm password</Label>
            <PasswordInput
              id="confirm"
              name="confirm"
              autoComplete="new-password"
              required
            />
            {errors.confirm ? <p className="text-xs text-destructive">{errors.confirm}</p> : null}
          </div>

          {error ? (
            <p className="rounded-lg border border-destructive/40 bg-destructive/10 px-3 py-2.5 text-sm text-destructive">
              {error}
            </p>
          ) : null}

          <Button type="submit" disabled={pending} className="w-full" size="lg">
            <Rocket data-icon="inline-start" className="size-4" />
            {pending ? "Creating account…" : "Create account"}
          </Button>
        </form>

        <p className="mt-6 text-center text-xs leading-relaxed text-muted-foreground">
          By creating an account you agree to the{" "}
          <Link href="/terms" className="text-foreground/80 underline underline-offset-2 hover:text-primary">
            Terms of Service
          </Link>{" "}
          and{" "}
          <Link href="/privacy" className="text-foreground/80 underline underline-offset-2 hover:text-primary">
            Privacy Policy
          </Link>
          .
        </p>
        <p className="mt-4 text-center text-sm text-muted-foreground">
          Already have an account?{" "}
          <Link href="/login" className="font-medium text-primary hover:underline">
            Sign in
          </Link>
        </p>
      </CardContent>
    </Card>
  )
}