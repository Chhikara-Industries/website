import type { Metadata } from "next"

import { SettingsProfileForm } from "@/components/dashboard/settings-profile-form"
import { requireDashboardAccess } from "@/lib/dal"

export const metadata: Metadata = {
  title: "Profile settings",
}

const demoEmail = "demo@chhikara.industries"

export default async function ProfileSettingsPage() {
  const { user, demo } = await requireDashboardAccess()

  const current = {
    id: user?.id ?? "demo",
    email: user?.email ?? demoEmail,
    name: user?.name,
    avatarUrl: user?.avatarUrl ?? null,
  }

  return <SettingsProfileForm user={current} demo={demo} />
}