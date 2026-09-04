import type { Metadata } from "next"

import { DashboardLayout } from "@/components/dashboard/dashboard-layout"
import { requireDashboardAccess, getUserPlan, type CurrentUser } from "@/lib/dal"

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

const demoUser: CurrentUser = {
  id: "demo",
  email: "demo@chhikara.industries",
  name: "Demo User",
  avatarUrl: null,
}

export default async function DashboardRootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const { user, demo } = await requireDashboardAccess()

  const current = demo
    ? demoUser
    : (user ?? demoUser)

  const rawPlan = demo ? "free" : await getUserPlan()
  const plan = rawPlan === "pro" ? "Pro" : rawPlan === "ultimate" ? "Ultimate" : "Free"

  return (
    <DashboardLayout user={current} plan={plan}>
      {demo ? (
        <div className="sr-only">Demo mode — login disabled until Supabase is configured</div>
      ) : null}
      {children}
    </DashboardLayout>
  )
}