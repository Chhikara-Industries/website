import type { Metadata } from "next"

import { SettingsPreferencesForm } from "@/components/dashboard/settings-preferences-form"
import { requireDashboardAccess } from "@/lib/dal"

export const metadata: Metadata = {
  title: "Preferences",
}

export default async function PreferencesSettingsPage() {
  await requireDashboardAccess()
  return <SettingsPreferencesForm />
}