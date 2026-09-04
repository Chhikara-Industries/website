import type { Metadata } from "next"

import { SettingsNotificationsForm } from "@/components/dashboard/settings-notifications-form"
import { requireDashboardAccess } from "@/lib/dal"

export const metadata: Metadata = {
  title: "Notification settings",
}

export default async function NotificationsSettingsPage() {
  await requireDashboardAccess()
  return <SettingsNotificationsForm />
}