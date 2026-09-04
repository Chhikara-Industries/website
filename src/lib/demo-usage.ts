export type ActivityItem = {
  id: string
  type: "billing" | "product" | "alert" | "security"
  title: string
  detail: string
  time: string
}

export const recentActivity: ActivityItem[] = []