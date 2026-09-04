import { cn } from "@/lib/utils"
import { CopyButton } from "@/components/site/copy-button"

export function CodeBlock({
  code,
  className,
  title,
}: {
  code: string
  className?: string
  title?: string
}) {
  return (
    <div
      className={cn(
        "overflow-hidden rounded-xl border border-border bg-[oklch(0.11_0.005_234)]",
        className
      )}
    >
      {title ? (
        <div className="flex items-center justify-between border-b border-border/70 px-3.5 py-2">
          <span className="font-mono text-xs text-muted-foreground">{title}</span>
          <CopyButton value={code} />
        </div>
      ) : (
        <div className="flex items-center justify-end border-b border-border/70 px-3.5 py-2">
          <CopyButton value={code} />
        </div>
      )}
      <pre className="overflow-x-auto p-4 font-mono text-[0.8rem] leading-relaxed text-foreground/90">
        <code>{code}</code>
      </pre>
    </div>
  )
}