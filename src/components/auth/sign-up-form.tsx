"use client"

import Link from "next/link"
import { useActionState } from "react"
import { Rocket } from "lucide-react"

import type { FormState } from "@/actions/auth"
import { signup } from "@/actions/auth"
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

function FieldError({ state, id }: { state: FormState; id: string }) {
  const message = state?.errors?.[id]?.join(" · ")
  return message ? <p className="text-xs text-destructive">{message}</p> : null
}

export function SignUpForm() {
  const [state, formAction, pending] = useActionState<FormState, FormData>(
    signup,
    undefined
  )

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

        <form action={formAction} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Name</Label>
            <Input
              id="name"
              name="name"
              autoComplete="name"
              placeholder="Ada Lovelace"
              required
            />
            <FieldError state={state} id="name" />
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
            <FieldError state={state} id="email" />
          </div>

          <div className="space-y-2">
            <Label htmlFor="password">Password</Label>
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