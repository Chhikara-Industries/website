import type { Metadata } from "next"

import { SettingsSecurityForm } from "@/components/dashboard/settings-security-form"
import { requireDashboardAccess } from "@/lib/dal"

export const metadata: Metadata = {
  title: "Security settings",
}

export default async function SecuritySettingsPage() {
  const { user } = await requireDashboardAccess()

  return <SettingsSecurityForm user={user} />
}