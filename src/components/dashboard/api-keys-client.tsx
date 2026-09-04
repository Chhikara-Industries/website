"use client"

import { useRef, useState } from "react"
import { useActionState } from "react"
import { Check, Copy, KeyRound, Plus, ShieldAlert, Trash2 } from "lucide-react"

import { createApiKey, revokeApiKey } from "@/actions/api-keys"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import type { ApiKeyRow } from "@/lib/dal"
import { cn } from "@/lib/utils"

function formatDate(value: string | null | undefined) {
  if (!value) return "—"
  return new Date(value).toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  })
}

function CopyButton({ value }: { value: string }) {
  const [copied, setCopied] = useState(false)
  return (
    <Button
      type="button"
      variant="ghost"
      size="icon-sm"
      aria-label="Copy key"
      onClick={async () => {
        try {
          await navigator.clipboard.writeText(value)
          setCopied(true)
          setTimeout(() => setCopied(false), 1500)
        } catch {
          // Clipboard unavailable.
        }
      }}
    >
      {copied ? <Check className="size-3.5 text-primary" /> : <Copy className="size-3.5" />}
    </Button>
  )
}

export function ApiKeysClient({
  keys,
  demo,
}: {
  keys: ApiKeyRow[]
  demo: boolean
}) {
  const [state, formAction, pending] = useActionState(createApiKey, undefined)
  const [revealed, setRevealed] = useState(false)
  const formRef = useRef<HTMLFormElement>(null)

  const [state2, revokeAction, revokePending] = useActionState(revokeApiKey, undefined)

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <KeyRound className="size-4 text-primary" />
            Create an API key
          </CardTitle>
          <CardDescription>
            Keys let you access Chhikara software programmatically. A key is stored as a
            one-way hash and shown in full only once.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {demo ? (
            <p className="mb-4 rounded-lg border border-primary/30 bg-primary/10 px-3 py-2.5 text-sm text-primary">
              Demo mode — creating keys requires Supabase and the api_keys table.
            </p>
          ) : null}

          <form
            ref={formRef}
            action={formAction}
            className="space-y-4"
            onSubmit={() => {
              setRevealed(false)
            }}
          >
            <div className="space-y-2">
              <Label htmlFor="key-name">Key name</Label>
              <div className="flex gap-2">
                <Input
                  id="key-name"
                  name="name"
                  placeholder="e.g. My automation"
                  autoComplete="off"
                />
                <Button type="submit" disabled={pending}>
                  <Plus data-icon="inline-start" className="size-4" />
                  {pending ? "Creating…" : "Create key"}
                </Button>
              </div>
              {state?.errors?.name ? (
                <p className="text-xs text-destructive">{state.errors.name.join(" · ")}</p>
              ) : null}
            </div>
          </form>

          {state?.created ? (
            <div className="mt-4 rounded-xl border border-primary/40 bg-primary/5 p-4">
              <p className="flex items-center gap-2 text-sm font-medium text-primary">
                <ShieldAlert className="size-4" />
                Copy your key — it won&apos;t be shown again.
              </p>
              <div className="mt-3 flex items-center gap-2">
                <code className="min-w-0 flex-1 truncate rounded-lg border border-border bg-background px-3 py-2 font-mono text-xs">
                  {revealed ? (
                    state.created.fullKey
                  ) : (
                    <span className="tracking-widest">•••••••••••••••••••••</span>
                  )}
                </code>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setRevealed((v) => !v)}
                >
                  {revealed ? "Hide" : "Show"}
                </Button>
                <CopyButton value={state.created.fullKey} />
              </div>
              <p className="mt-3 text-xs text-muted-foreground">
                Key name: <span className="text-foreground">{state.created.name}</span>
              </p>
            </div>
          ) : null}

          {state?.message && !state.created ? (
            <p className="mt-4 rounded-lg border border-primary/30 bg-primary/10 px-3 py-2.5 text-sm text-primary">
              {state.message}
            </p>
          ) : null}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Your key</CardTitle>
          <CardDescription>
            Manage the API keys that can access your account and credits.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {state2?.message ? (
            <p className="mb-4 rounded-lg border border-primary/30 bg-primary/10 px-3 py-2.5 text-sm text-primary">
              {state2.message}
            </p>
          ) : null}

          {keys.length ? (
            <ul className="space-y-3">
              {keys.map((key) => {
                const revoked = Boolean(key.revokedAt)
                return (
                  <li
                    key={key.id}
                    className={cn(
                      "flex flex-wrap items-center gap-3 rounded-lg border border-border px-3 py-2.5",
                      revoked && "opacity-60"
                    )}
                  >
                    <div className="min-w-0 flex-1">
                      <p className="flex items-center gap-2 text-sm font-medium text-foreground">
                        <span className="truncate">{key.name}</span>
                        <span
                          className={cn(
                            "rounded-full border px-2 py-0.5 font-mono text-[0.6rem] uppercase tracking-wider",
                            revoked
                              ? "border-destructive/40 text-destructive"
                              : "border-chart-2/40 text-chart-2"
                          )}
                        >
                          {revoked ? "Revoked" : "Active"}
                        </span>
                      </p>
                      <p className="mt-0.5 truncate font-mono text-xs text-muted-foreground">
                        {key.prefix}… · created {formatDate(key.createdAt)}
                        {key.lastUsedAt ? ` · last used ${formatDate(key.lastUsedAt)}` : ""}
                      </p>
                    </div>
                    {!revoked ? (
                      <form action={revokeAction}>
                        <input type="hidden" name="id" value={key.id} />
                        <Button
                          type="submit"
                          variant="ghost"
                          size="icon-sm"
                          disabled={revokePending}
                          aria-label={`Revoke ${key.name}`}
                        >
                          <Trash2 className="size-3.5 text-destructive" />
                        </Button>
                      </form>
                    ) : null}
                  </li>
                )
              })}
            </ul>
          ) : (
            <p className="py-6 text-center font-mono text-xs text-muted-foreground">
              No API keys yet. Create one above to get started.
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
