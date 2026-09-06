"use client"

import type { ReactNode } from "react"
import Image from "next/image"
import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import {
  ArrowUpRight,
  CreditCard,
  GaugeCircle,
  Headphones,
  KeyRound,
  LifeBuoy,
  LogOut,
  Settings2,
} from "lucide-react"

import { logout } from "@/actions/auth"
import { Logo } from "@/components/site/logo"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarInset,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarProvider,
  SidebarSeparator,
  SidebarTrigger,
} from "@/components/ui/sidebar"
import type { CurrentUser } from "@/lib/dal"
import { site } from "@/lib/site"

const nav = [
  {
    group: "Account",
    items: [
      { href: "/dashboard/overview", label: "Overview", icon: GaugeCircle },
      { href: "/dashboard/api", label: "APIs", icon: KeyRound },
      { href: "/dashboard/billing", label: "Billing", icon: CreditCard },
      { href: "/dashboard/settings", label: "Settings", icon: Settings2 },
      { href: "/dashboard/support", label: "Support", icon: Headphones },
    ],
  },
]

const pageTitles: Record<string, string> = {
  "/dashboard/overview": "Overview",
  "/dashboard/api": "APIs",
  "/dashboard/billing": "Billing",
  "/dashboard/settings": "Settings",
  "/dashboard/support": "Support",
}

function findTitle(pathname: string) {
  if (pathname.startsWith("/dashboard/billing/subscribe/")) return "Checkout"
  if (pathname.startsWith("/dashboard/billing/buy/")) return "Checkout"
  if (pathname.startsWith("/dashboard/billing/payments/status")) return "Payment"
  return pageTitles[pathname] ?? "Dashboard"
}

export function DashboardLayout({
  user,
  plan,
  children,
}: {
  user: CurrentUser
  plan: string
  children: ReactNode
}) {
  const pathname = usePathname()
  const router = useRouter()

  async function handleSignOut() {
    await logout()
    router.replace("/login")
    router.refresh()
  }

  return (
    <SidebarProvider>
      <Sidebar variant="sidebar" collapsible="icon">
        <SidebarHeader>
          <SidebarMenu>
            <SidebarMenuItem>
              <SidebarMenuButton
                size="lg"
                render={<Link href="/" />}
                className="group-data-[collapsible=icon]:!p-0"
              >
                <Logo className="group-data-[collapsible=icon]:hidden" />
                <Image
                  src="/icon.png"
                  alt=""
                  width={24}
                  height={24}
                  className="hidden size-6 group-data-[collapsible=icon]:block"
                />
              </SidebarMenuButton>
            </SidebarMenuItem>
          </SidebarMenu>
          <SidebarSeparator />
        </SidebarHeader>

        <SidebarContent>
          {nav.map((group) => (
            <SidebarGroup key={group.group}>
              <SidebarGroupLabel>{group.group}</SidebarGroupLabel>
              <SidebarMenu>
                {group.items.map((item) => (
                  <SidebarMenuItem key={item.href}>
                    <SidebarMenuButton
                      isActive={
                        pathname === item.href ||
                        (pathname.startsWith(item.href) &&
                          item.href !== "/dashboard")
                      }
                      tooltip={item.label}
                      render={<Link href={item.href} />}
                    >
                      <item.icon />
                      <span>{item.label}</span>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                ))}
              </SidebarMenu>
            </SidebarGroup>
          ))}
        </SidebarContent>

        <SidebarFooter>
          <SidebarMenu>
            <SidebarMenuItem>
              <SidebarMenuButton
                variant="outline"
                render={<Link href="/" target="_blank" />}
              >
                <ArrowUpRight />
                <span>Public website</span>
              </SidebarMenuButton>
            </SidebarMenuItem>
            <SidebarMenuItem>
              <div className="flex items-center gap-2 px-2 py-1.5">
                <Avatar className="size-7">
                  {user.avatarUrl ? (
                    <AvatarImage src={user.avatarUrl} />
                  ) : null}
                  <AvatarFallback className="bg-primary/20 font-mono text-[0.6rem] text-primary">
                    {(user.name ?? user.email ?? "U").slice(0, 1).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <div className="min-w-0 flex-1 leading-tight">
                  <p className="truncate text-sm font-medium">
                    {user.name ?? "Account"}
                  </p>
                  <p className="truncate font-mono text-[0.65rem] uppercase tracking-wider text-muted-foreground">
                    {plan}
                  </p>
                </div>
              </div>
            </SidebarMenuItem>
          </SidebarMenu>
        </SidebarFooter>
      </Sidebar>

      <SidebarInset>
        <header className="sticky top-0 z-10 flex h-14 shrink-0 items-center gap-3 border-b border-border/60 bg-background/80 px-4 backdrop-blur-xl">
          <SidebarTrigger />
          <div className="flex items-center gap-2 font-mono text-sm">
            <span className="text-muted-foreground">dashboard</span>
            <span className="text-muted-foreground">/</span>
            <span className="text-primary">{findTitle(pathname)}</span>
          </div>
          <div className="ml-auto flex items-center gap-2">
            <DropdownMenu>
              <DropdownMenuTrigger className="flex size-8 cursor-pointer items-center justify-center rounded-lg border border-border text-foreground transition-colors hover:border-primary/40 hover:bg-muted/40">
                <Avatar className="size-6">
                  {user.avatarUrl ? (
                    <AvatarImage src={user.avatarUrl} />
                  ) : null}
                  <AvatarFallback className="bg-primary/20 font-mono text-[0.6rem] text-primary">
                    {(user.name ?? user.email ?? "U").slice(0, 1).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
              </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56">
                  <DropdownMenuGroup className="group/label">
                    <DropdownMenuLabel className="truncate font-mono text-xs">
                      {user.email ?? "demo@chhikara.industries"}
                    </DropdownMenuLabel>
                  </DropdownMenuGroup>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    onClick={() => router.push("/dashboard/billing")}
                    className="gap-2"
                  >
                    <CreditCard className="size-4" />
                    Manage plan
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onClick={() => router.push("/dashboard/settings")}
                    className="gap-2"
                  >
                    <Settings2 className="size-4" />
                    Settings
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onClick={() => router.push("/dashboard/support")}
                    className="gap-2"
                  >
                    <LifeBuoy className="size-4" />
                    Support
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    variant="destructive"
                    className="gap-2"
                    onClick={handleSignOut}
                  >
                    <LogOut className="size-4" />
                    Sign out
                  </DropdownMenuItem>
                </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </header>

        <main className="flex-1 p-4 sm:p-6">{children}</main>

        <footer className="border-t border-border/60 px-6 py-4 font-mono text-xs text-muted-foreground">
          © {new Date().getFullYear()} {site.legalName} ·{" "}
          <Link href="/contact" className="text-primary hover:underline">
            contact
          </Link>{" "}
          ·{" "}
          <Link href="/terms" className="text-primary hover:underline">
            terms
          </Link>
        </footer>
      </SidebarInset>
    </SidebarProvider>
  )
}