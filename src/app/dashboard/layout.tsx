import type { Metadata } from "next"

import { DashboardLayout } from "@/components/dashboard/dashboard-layout"
import { requireDashboardAccess, getUserPlan } from "@/lib/dal"

export const metadata: Metadata = {
  title: {
    template: "%s · Dashboard",
    default: "Dashboard",
  },
  robots: {
    index: false,
    follow: false,
  },
}

export default async function DashboardRootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const { user } = await requireDashboardAccess()

  const rawPlan = await getUserPlan()
  const plan = rawPlan === "pro" ? "Pro" : rawPlan === "ultimate" ? "Ultimate" : "Free"

  return (
    <DashboardLayout user={user} plan={plan}>
      {children}
    </DashboardLayout>
  )
}