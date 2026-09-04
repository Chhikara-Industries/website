"use client"

import Link from "next/link"
import { useSearchParams } from "next/navigation"
import { useActionState } from "react"
import { LogIn } from "lucide-react"

import type { FormState } from "@/actions/auth"
import { login } from "@/actions/auth"
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

export function SignInForm() {
  const [state, formAction, pending] = useActionState<FormState, FormData>(
    login,
    undefined
  )
  const searchParams = useSearchParams()
  const oauthError = searchParams.get("error")

  return (
    <Card className="border-border/80 bg-card/70 backdrop-blur">
      <CardHeader className="items-center text-center">
        <CardTitle className="text-2xl">Welcome back</CardTitle>
        <CardDescription>
          Sign in to continue to the Chhikara dashboard.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <SocialLoginButtons />

        {oauthError ? (
          <p className="rounded-lg border border-destructive/30 bg-destructive/10 px-3 py-2.5 text-sm text-destructive">
            {oauthError}
          </p>
        ) : null}

        <div className="relative">
          <div className="absolute inset-0 flex items-center">
            <span className="w-full border-t border-border" />
          </div>
          <div className="relative flex justify-center text-xs uppercase">
            <span className="bg-card px-2 text-muted-foreground">
              or sign in with email
            </span>
          </div>
        </div>

        <form action={formAction} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              name="email"
              type="email"
              placeholder="you@company.com"
              autoComplete="email"
              required
            />
            {state?.errors?.email ? (
              <p className="text-xs text-destructive">{state.errors.email.join(" · ")}</p>
            ) : null}
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label htmlFor="password">Password</Label>
              <Link
                href="/forgot-password"
                className="text-xs text-muted-foreground transition-colors hover:text-primary"
              >
                Forgot password?
              </Link>
            </div>
            <PasswordInput
              id="password"
              name="password"
              autoComplete="current-password"
              required
            />
            {state?.errors?.password ? (
              <p className="text-xs text-destructive">{state.errors.password.join(" · ")}</p>
            ) : null}
          </div>

          {state?.message ? (
            <p className="rounded-lg border border-primary/30 bg-primary/10 px-3 py-2.5 text-sm text-primary">
              {state.message}
            </p>
          ) : null}

          <Button type="submit" disabled={pending} className="w-full" size="lg">
            <LogIn data-icon="inline-start" className="size-4" />
            {pending ? "Signing in…" : "Sign in"}
          </Button>
        </form>

        <p className="mt-6 text-center text-sm text-muted-foreground">
          New to Chhikara?{" "}
          <Link href="/signup" className="font-medium text-primary hover:underline">
            Create an account
          </Link>
        </p>
      </CardContent>
    </Card>
  )
}