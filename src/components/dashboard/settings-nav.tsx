"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { Bell, Palmtree, ShieldCheck, UserRound } from "lucide-react"

import { cn } from "@/lib/utils"

const items = [
  { href: "/dashboard/settings/profile", label: "Profile", icon: UserRound },
  { href: "/dashboard/settings/security", label: "Security", icon: ShieldCheck },
  { href: "/dashboard/settings/notifications", label: "Notifications", icon: Bell },
  { href: "/dashboard/settings/preferences", label: "Preferences", icon: Palmtree },
]

export function SettingsNav() {
  const pathname = usePathname()
  return (
    <nav className="flex gap-1 overflow-x-auto pb-1 lg:flex-col lg:overflow-visible">
      {items.map((item) => {
        const active = pathname.startsWith(item.href)
        return (
          <Link
            key={item.href}
            href={item.href}
            className={cn(
              "inline-flex items-center gap-2 whitespace-nowrap rounded-lg px-3 py-2 text-sm text-muted-foreground transition-colors hover:bg-muted/50 hover:text-foreground",
              active && "bg-muted/60 font-medium text-primary"
            )}
          >
            <item.icon className="size-4" />
            {item.label}
          </Link>
        )
      })}
    </nav>
  )
}