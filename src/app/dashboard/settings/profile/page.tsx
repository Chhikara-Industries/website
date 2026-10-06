import type { Metadata } from "next"

import { SettingsProfileForm } from "@/components/dashboard/settings-profile-form"
import { requireDashboardAccess } from "@/lib/dal"

export const metadata: Metadata = {
  title: "Profile settings",
}

export default async function ProfileSettingsPage() {
  const { user } = await requireDashboardAccess()

  return <SettingsProfileForm user={user} />
}