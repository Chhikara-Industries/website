export type ServiceStatus = "operational" | "degraded" | "down"

export type StatusService = {
  id: string
  name: string
  description: string
  status: ServiceStatus
  uptime: string
  group: "apps" | "platform"
}

export type Incident = {
  id: string
  date: string
  title: string
  impact: "none" | "degraded" | "major"
  status: "resolved" | "monitoring" | "investigating"
  description: string
  services: string[]
}

export const statusServices: StatusService[] = []

export const incidents: Incident[] = []

export function overallStatus() {
  const allOperational = statusServices.every((s) => s.status === "operational")
  if (allOperational) return { label: "All systems operational", status: "operational" as const }
  if (statusServices.some((s) => s.status === "down")) return { label: "Partial outage", status: "down" as const }
  return { label: "Degraded performance", status: "degraded" as const }
}