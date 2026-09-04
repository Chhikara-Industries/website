import { cn } from "@/lib/utils"
import type { ProductStatus } from "@/lib/products"
import type { ServiceStatus } from "@/lib/status"

const productStyles: Record<ProductStatus, string> = {
  public: "border-primary/40 bg-primary/10 text-primary",
  beta: "border-chart-4/40 bg-chart-4/10 text-chart-4",
  alpha: "border-chart-2/40 bg-chart-2/10 text-chart-2",
  "coming-soon": "border-border bg-muted/40 text-muted-foreground",
}

const productLabels: Record<ProductStatus, string> = {
  public: "Public",
  beta: "Beta",
  alpha: "Alpha",
  "coming-soon": "Coming soon",
}

export function ProductStatusBadge({ status }: { status: ProductStatus }) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full border px-2 py-0.5 font-mono text-[0.65rem] font-medium uppercase tracking-wider",
        productStyles[status]
      )}
    >
      <span className="size-1.5 rounded-full bg-current" />
      {productLabels[status]}
    </span>
  )
}

const serviceStyles: Record<ServiceStatus, string> = {
  operational: "bg-chart-1",
  degraded: "bg-chart-5",
  down: "bg-destructive",
}

const serviceLabels: Record<ServiceStatus, string> = {
  operational: "Operational",
  degraded: "Degraded",
  down: "Down",
}

export function ServiceStatusBadge({
  status,
  compact,
}: {
  status: ServiceStatus
  compact?: boolean
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 font-mono text-xs",
        compact ? "text-[0.65rem]" : "text-xs"
      )}
    >
      <span
        className={cn(
          "size-2 rounded-full",
          serviceStyles[status],
          status === "degraded" && "animate-pulse-dot"
        )}
      />
      {serviceLabels[status]}
    </span>
  )
}