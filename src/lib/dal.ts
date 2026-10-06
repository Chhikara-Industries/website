import "server-only"

import { cache } from "react"
import { redirect } from "next/navigation"
import { fetchQuery } from "convex/nextjs"

import { api } from "@/convex/_generated/api"
import { getAuthToken } from "@/lib/convex-server"

export type CurrentUser = {
  id: string
  email: string | undefined
  name: string | null
  avatarUrl: string | null
}

async function token() {
  try {
    return (await getAuthToken()) ?? undefined
  } catch {
    return undefined
  }
}

export const getCurrentUser = cache(async (): Promise<CurrentUser | null> => {
  try {
    return await fetchQuery(api.users.me, {}, { token: await token() })
  } catch {
    return null
  }
})

export async function requireDashboardAccess() {
  let user: CurrentUser | null = null
  try {
    user = await fetchQuery(api.users.me, {}, { token: await token() })
  } catch {
    // Fall through to redirect when the user is signed out.
  }

  if (!user) {
    redirect("/login")
  }

  return { user }
}

export type ApiKeyRow = {
  id: string
  name: string
  prefix: string
  createdAt: string
  lastUsedAt: string | null
  revokedAt: string | null
}

export async function getApiKeys(): Promise<ApiKeyRow[]> {
  try {
    const rows = await fetchQuery(api.apiKeys.listApiKeys, {}, { token: await token() })
    return rows.map((row) => ({
      id: row.id,
      name: row.name,
      prefix: row.prefix,
      createdAt: new Date(row.createdAt).toISOString(),
      lastUsedAt: row.lastUsedAt ? new Date(row.lastUsedAt).toISOString() : null,
      revokedAt: row.revokedAt ? new Date(row.revokedAt).toISOString() : null,
    }))
  } catch {
    return []
  }
}

export async function getUserPlan(): Promise<string> {
  try {
    return await fetchQuery(api.subscriptions.getPlan, {}, { token: await token() })
  } catch {
    return "free"
  }
}

export async function getUserCredits(): Promise<number> {
  try {
    return await fetchQuery(api.credits.getBalance, {}, { token: await token() })
  } catch {
    return 0
  }
}