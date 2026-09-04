import type { ComponentType, ReactNode } from "react"
import type { LucideProps } from "lucide-react"

import { cn } from "@/lib/utils"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
} from "@/components/ui/card"

export function DashboardSection({
  title,
  description,
  actions,
  children,
  className,
}: {
  title: string
  description?: string
  actions?: ReactNode
  children?: ReactNode
  className?: string
}) {
  return (
    <div className={cn("space-y-4", className)}>
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h2 className="text-lg font-semibold tracking-tight">{title}</h2>
          {description ? (
            <p className="mt-1 font-mono text-xs text-muted-foreground">
              {description}
            </p>
          ) : null}
        </div>
        {actions}
      </div>
      {children}
    </div>
  )
}

export function StatCard({
  icon: Icon,
  label,
  value,
  sub,
  trend,
}: {
  icon: ComponentType<LucideProps>
  label: string
  value: string
  sub?: string
  trend?: { direction: "up" | "down"; text: string }
}) {
  return (
    <Card>
      <CardHeader className="flex-row items-center justify-between space-y-0 pb-2">
        <CardDescription className="font-mono text-xs uppercase tracking-wider">
          {label}
        </CardDescription>
        <Icon className="size-4 text-primary" />
      </CardHeader>
      <CardContent>
        <p className="font-mono text-2xl font-semibold">{value}</p>
        <div className="mt-1 flex items-center gap-2">
          {trend ? (
            <span
              className={cn(
                "font-mono text-xs",
                trend.direction === "up" ? "text-chart-2" : "text-destructive"
              )}
            >
              {trend.text}
            </span>
          ) : null}
          {sub ? (
            <span className="text-xs text-muted-foreground">{sub}</span>
          ) : null}
        </div>
      </CardContent>
    </Card>
  )
}