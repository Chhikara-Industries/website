"use client"

import { useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { usePathname } from "next/navigation"
import { ArrowRight, ChevronDown, LayoutDashboard, LogOut, Menu, Settings2 } from "lucide-react"

import { logout } from "@/actions/auth"
import { Logo } from "@/components/site/logo"
import { Button } from "@/components/ui/button"
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
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet"
import { cn } from "@/lib/utils"
import { navLinks } from "@/lib/site"
import type { CurrentUser } from "@/lib/dal"

export function NavbarClient({ user }: { user: CurrentUser | null }) {
  const pathname = usePathname()
  const router = useRouter()
  const [open, setOpen] = useState(false)

  async function handleSignOut() {
    await logout()
    router.replace("/login")
    router.refresh()
  }

  return (
    <header className="sticky top-0 z-40 border-b border-border/60 bg-background/75 backdrop-blur-xl">
      <div className="mx-auto flex h-16 w-full max-w-6xl items-center justify-between px-5 sm:px-8">
        <Link href="/" aria-label="Chhikara Industries home">
          <Logo />
        </Link>

        <nav className="hidden items-center gap-1 md:flex">
          {navLinks.map((link) => {
            const active =
              link.href === "/"
                ? pathname === "/"
                : pathname.startsWith(link.href)
            return (
              <Link
                key={link.href}
                href={link.href}
                className={cn(
                  "rounded-md px-3 py-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground",
                  active && "text-foreground"
                )}
              >
                {link.label}
              </Link>
            )
          })}
        </nav>

        <div className="flex items-center gap-2">
          {user ? (
            <DropdownMenu>
              <DropdownMenuTrigger className="flex h-8 cursor-pointer items-center gap-2 rounded-lg border border-border px-2 text-sm font-medium text-foreground transition-colors hover:border-primary/40 hover:bg-muted/40">
                <span className="flex size-5 items-center justify-center rounded-full bg-primary/20 font-mono text-[0.6rem] font-semibold text-primary">
                  {(user.name ?? user.email ?? "U").slice(0, 1).toUpperCase()}
                </span>
                {user.name ?? "Account"}
                <ChevronDown className="size-3.5 text-muted-foreground" />
              </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56">
                  <DropdownMenuGroup className="group/label">
                    <DropdownMenuLabel className="truncate font-mono text-xs">
                      {user.email}
                    </DropdownMenuLabel>
                  </DropdownMenuGroup>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    onClick={() => router.push("/dashboard")}
                    className="gap-2"
                  >
                    <LayoutDashboard className="size-4" />
                    Dashboard
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onClick={() => router.push("/dashboard/billing")}
                    className="gap-2"
                  >
                    <Settings2 className="size-4" />
                    Manage plan
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
          ) : (
            <>
              <Button variant="ghost" size="sm" render={<Link href="/login" />}>
                Log in
              </Button>
              <Button size="sm" render={<Link href="/signup" />}>
                Get started
                <ArrowRight className="size-3.5" />
              </Button>
            </>
          )}

          <Sheet open={open} onOpenChange={setOpen}>
            <SheetTrigger
              render={
                <Button variant="ghost" size="icon" className="md:hidden" aria-label="Open menu">
                  <Menu className="size-4" />
                </Button>
              }
            />
            <SheetContent side="right" className="w-72">
              <SheetHeader className="text-left">
                <SheetTitle>
                  <Logo />
                </SheetTitle>
                <SheetDescription>Chhikara Industries site navigation</SheetDescription>
              </SheetHeader>
              <nav className="mt-6 flex flex-col gap-1">
                {navLinks.map((link) => (
                  <Link
                    key={link.href}
                    href={link.href}
                    onClick={() => setOpen(false)}
                    className={cn(
                      "rounded-md px-3 py-2 text-sm text-muted-foreground transition-colors hover:bg-muted/50 hover:text-foreground",
                      pathname.startsWith(link.href) && "text-foreground"
                    )}
                  >
                    {link.label}
                  </Link>
                ))}
                <div className="mt-4 flex flex-col gap-2">
                  {user ? (
                    <Button
                      variant="ghost"
                      render={<Link href="/dashboard" onClick={() => setOpen(false)} />}
                    >
                      <LayoutDashboard className="size-4" />
                      Dashboard
                    </Button>
                  ) : (
                    <>
                      <Button
                        variant="ghost"
                        render={<Link href="/login" onClick={() => setOpen(false)} />}
                      >
                        Log in
                      </Button>
                      <Button
                        render={<Link href="/signup" onClick={() => setOpen(false)} />}
                      >
                        Get started
                      </Button>
                    </>
                  )}
                </div>
              </nav>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </header>
  )
}