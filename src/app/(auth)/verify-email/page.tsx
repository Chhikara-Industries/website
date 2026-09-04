import type { Metadata } from "next"
import Link from "next/link"

import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { MailCheck } from "lucide-react"

export const metadata: Metadata = {
  title: "Check your email",
}

export default async function VerifyEmailPage({
  searchParams,
}: {
  searchParams: Promise<{ email?: string; success?: string; error?: string }>
}) {
  const { email, success, error } = await searchParams

  const isConfirmed = success === "true"

  return (
    <Card className="border-border/80 bg-card/70 backdrop-blur">
      <CardHeader className="items-center text-center">
        <div className="mb-2 inline-flex size-12 items-center justify-center rounded-full border border-primary/40 bg-primary/10">
          <MailCheck className="size-6 text-primary" />
        </div>
        <CardTitle className="text-2xl">
          {isConfirmed ? "Email confirmed" : "Verify your email"}
        </CardTitle>
        <CardDescription>
          {isConfirmed
            ? "Your email address has been confirmed. You can sign in now."
            : "We sent a confirmation link to your inbox. Click it to activate your account."}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {email ? (
          <p className="rounded-lg border border-border bg-muted/30 px-3 py-2.5 text-center font-mono text-xs text-foreground/80">
            {email}
          </p>
        ) : null}
        {error ? (
          <p className="rounded-lg border border-destructive/30 bg-destructive/10 px-3 py-2.5 text-sm text-destructive">
            {error === "link-invalid"
              ? "This confirmation link is invalid or has expired. You can request a new one below."
              : "Something went wrong confirming your email."}
          </p>
        ) : null}
        <Button className="w-full" size="lg" render={<Link href="/login" />}>
          {isConfirmed ? "Sign in" : "Back to sign in"}
        </Button>
        {!isConfirmed ? (
          <div className="text-center">
            <Link
              href="/forgot-password"
              className="text-sm font-medium text-primary hover:underline"
            >
              Resend the link
            </Link>
          </div>
        ) : null}
      </CardContent>
    </Card>
  )
}