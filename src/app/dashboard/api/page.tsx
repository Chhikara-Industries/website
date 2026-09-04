import type { Metadata } from "next"

import { ApiKeysClient } from "@/components/dashboard/api-keys-client"
import { getApiKeys, requireDashboardAccess } from "@/lib/dal"

export const metadata: Metadata = {
  title: "APIs",
}

export default async function ApiKeysPage() {
  const { demo } = await requireDashboardAccess()
  const keys = demo ? [] : await getApiKeys()

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">APIs</h1>
        <p className="mt-1 font-mono text-xs text-muted-foreground">
          Get an API key to use Chhikara software programmatically
        </p>
      </div>

      <div className="flex items-center gap-3 rounded-xl border border-border bg-card/50 px-4 py-3 text-sm text-foreground/85">
        <span>
          API keys authenticate requests from your own code or integrations. Your key uses
          your prepaid <strong>Credits</strong> balance — keep it secret, like a password.
        </span>
      </div>

      <ApiKeysClient keys={keys} demo={demo} />
    </div>
  )
}
