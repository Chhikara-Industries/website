import type { ReactNode } from "react"

import { SettingsNav } from "@/components/dashboard/settings-nav"
import { requireDashboardAccess } from "@/lib/dal"

export default async function SettingsLayout({ children }: { children: ReactNode }) {
  await requireDashboardAccess()

  return (
    <div className="grid gap-6 lg:grid-cols-[200px_1fr]">
      <aside className="lg:sticky lg:top-20 lg:h-fit">
        <SettingsNav />
      </aside>
      <div className="min-w-0 max-w-2xl">{children}</div>
    </div>
  )
}