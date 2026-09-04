"use client"

import { useActionState } from "react"

import type { FormState } from "@/actions/auth"
import { updateProfile } from "@/actions/auth"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import type { CurrentUser } from "@/lib/dal"

export function SettingsProfileForm({ user, demo }: { user: CurrentUser; demo: boolean }) {
  const [state, formAction, pending] = useActionState<FormState, FormData>(
    updateProfile,
    undefined
  )

  return (
    <Card>
      <CardHeader>
        <CardTitle>Profile</CardTitle>
        <CardDescription>
          Your name is shown in the dashboard and in support conversations.
        </CardDescription>
      </CardHeader>
      <CardContent>
        {demo ? (
          <p className="mb-4 rounded-lg border border-primary/30 bg-primary/10 px-3 py-2.5 text-sm text-primary">
            Demo mode — save won’t persist until Supabase is configured.
          </p>
        ) : null}

        <form action={formAction} className="space-y-5">
          <div className="space-y-2">
            <Label htmlFor="settings-name">Full name</Label>
            <Input
              id="settings-name"
              name="name"
              defaultValue={user.name ?? ""}
              autoComplete="name"
            />
            {state?.errors?.name ? (
              <p className="text-xs text-destructive">{state.errors.name.join(" · ")}</p>
            ) : null}
          </div>

          <div className="space-y-2">
            <Label htmlFor="settings-email">Email</Label>
            <Input
              id="settings-email"
              value={user.email ?? ""}
              readOnly
              className="opacity-60"
            />
            <p className="text-xs text-muted-foreground">
              Email changes are managed from the security tab.
            </p>
          </div>

          {state?.message ? (
            <p className="rounded-lg border border-primary/30 bg-primary/10 px-3 py-2.5 text-sm text-primary">
              {state.message}
            </p>
          ) : null}

          <Button type="submit" disabled={pending}>
            {pending ? "Saving…" : "Save changes"}
          </Button>
        </form>
      </CardContent>
    </Card>
  )
}