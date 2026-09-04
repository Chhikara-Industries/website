"use client"

import { useActionState } from "react"
import { CheckCircle2, ShieldCheck } from "lucide-react"

import type { FormState } from "@/actions/auth"
import { updatePassword } from "@/actions/auth"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { PasswordInput } from "@/components/ui/password-input"
import type { CurrentUser } from "@/lib/dal"

function FieldError({ state, id }: { state: FormState; id: string }) {
  const message = state?.errors?.[id]?.join(" · ")
  return message ? <p className="text-xs text-destructive">{message}</p> : null
}

export function SettingsSecurityForm({
  user,
  demo,
}: {
  user: CurrentUser
  demo: boolean
}) {
  const bound = updatePassword.bind(null, user.email ?? "")
  const [state, formAction, pending] = useActionState<FormState, FormData>(bound, undefined)

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ShieldCheck className="size-4 text-primary" />
            Password
          </CardTitle>
          <CardDescription>
            Change the password used to sign in. Sessions stay alive after the change.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {demo ? (
            <p className="mb-4 rounded-lg border border-primary/30 bg-primary/10 px-3 py-2.5 text-sm text-primary">
              Demo mode — password changes need Supabase to be configured.
            </p>
          ) : null}

          <form action={formAction} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="current">Current password</Label>
              <PasswordInput id="current" name="current" autoComplete="current-password" />
              <FieldError state={state} id="current" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="new-password">New password</Label>
              <PasswordInput id="new-password" name="password" autoComplete="new-password" />
              <FieldError state={state} id="password" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="confirm">Confirm new password</Label>
              <PasswordInput id="confirm" name="confirm" autoComplete="new-password" />
              <FieldError state={state} id="confirm" />
            </div>
            {state?.message ? (
              <p className="rounded-lg border border-primary/30 bg-primary/10 px-3 py-2.5 text-sm text-primary">
                {state.message}
              </p>
            ) : null}
            <Button type="submit" disabled={pending}>
              {pending ? "Updating…" : "Update password"}
            </Button>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CheckCircle2 className="size-4 text-primary" />
            Email verification
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap items-center gap-3 text-sm">
            <span className="inline-flex items-center gap-1.5 font-mono text-xs text-chart-2">
              <span className="size-1.5 rounded-full bg-chart-2" />
              verified
            </span>
            <code className="font-mono text-xs text-muted-foreground">{user.email}</code>
          </div>
          <p className="mt-3 text-xs text-muted-foreground">
            Change or reset your email from the authentication provider dashboards once linked.
          </p>
        </CardContent>
      </Card>
    </div>
  )
}