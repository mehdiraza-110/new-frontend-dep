"use client"

import type React from "react"

import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import {
  Search,
  Bell,
  Home,
  Settings,
  Users,
  ShoppingCart,
  DollarSign,
  CreditCard,
  Activity,
  UserCheck,
  ChevronDown,
  LogOut,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
  DropdownMenuLabel,
} from "@/components/ui/dropdown-menu"
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible"
import { useState } from "react"
import { cn } from "@/lib/utils"
import { useStore } from "@/lib/store"

const navigation = [
  { name: "Dashboard", href: "/", icon: Home },
  {
    name: "Users",
    icon: Users,
    children: [
      { name: "Customers", href: "/users/customers" },
      { name: "Service Providers", href: "/users/providers" },
    ],
  },
  {
    name: "Providers",
    icon: UserCheck,
    children: [
      { name: "Approvals Queue", href: "/providers/approvals" },
      { name: "Live Map", href: "/providers/map" },
    ],
  },
  { name: "Orders", href: "/orders", icon: ShoppingCart },
  { name: "Pricing", href: "/pricing", icon: DollarSign },
  { name: "Payments", href: "/payments", icon: CreditCard },
  { name: "Monitoring", href: "/monitoring", icon: Activity },
]

interface DashboardLayoutProps {
  children: React.ReactNode
}

export function DashboardLayout({ children }: DashboardLayoutProps) {
  const pathname = usePathname()
  const router = useRouter()
  const { logout } = useStore()
  const [openSections, setOpenSections] = useState<string[]>(["Users", "Providers"])

  const toggleSection = (name: string) => {
    setOpenSections((prev) => (prev.includes(name) ? prev.filter((s) => s !== name) : [...prev, name]))
  }

  const isChildActive = (children: { href: string }[]) => {
    return children.some((child) => pathname === child.href)
  }

  const handleSignOut = () => {
    logout()
    router.push("/login")
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="h-16 border-b bg-background px-6 flex items-center justify-between sticky top-0 z-50">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
              <Activity className="w-4 h-4 text-primary-foreground" />
            </div>
            <span className="font-semibold text-foreground">ServiceHub</span>
          </div>
          <div className="text-sm text-muted-foreground">
            <span>Admin Portal</span>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
            <Input placeholder="Search orders, customers..." className="pl-10 w-80" />
          </div>
          <Button variant="ghost" size="icon" className="relative">
            <Bell className="w-4 h-4" />
            <span className="absolute -top-1 -right-1 w-2 h-2 bg-destructive rounded-full"></span>
          </Button>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon">
                <Avatar className="w-8 h-8">
                  <AvatarImage src="/operator-avatar.jpg" />
                  <AvatarFallback>OP</AvatarFallback>
                </Avatar>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <DropdownMenuLabel>Operator Admin</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem>Profile</DropdownMenuItem>
              <DropdownMenuItem>Settings</DropdownMenuItem>
              <DropdownMenuItem>Support</DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem>Sign out</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </header>

      <div className="flex">
        {/* Sidebar */}
        <aside className="w-60 border-r bg-background h-[calc(100vh-4rem)] overflow-y-auto sticky top-16 flex flex-col">
          <div className="p-4 flex-1 overflow-y-auto">
            <nav className="space-y-1">
              {navigation.map((item) => {
                if ("children" in item && item.children) {
                  const isOpen = openSections.includes(item.name)
                  const hasActiveChild = isChildActive(item.children)
                  return (
                    <Collapsible key={item.name} open={isOpen} onOpenChange={() => toggleSection(item.name)}>
                      <CollapsibleTrigger asChild>
                        <button
                          className={cn(
                            "flex items-center w-full justify-between px-3 py-2 rounded-md text-sm font-medium transition-colors",
                            hasActiveChild ? "bg-primary/10 text-primary" : "text-muted-foreground hover:bg-muted",
                          )}
                        >
                          <span className="flex items-center">
                            <item.icon className="w-4 h-4 mr-3" />
                            {item.name}
                          </span>
                          <ChevronDown className={cn("w-4 h-4 transition-transform", isOpen && "rotate-180")} />
                        </button>
                      </CollapsibleTrigger>
                      <CollapsibleContent className="pl-7 mt-1 space-y-1">
                        {item.children.map((child) => {
                          const isActive = pathname === child.href
                          return (
                            <Link
                              key={child.name}
                              href={child.href}
                              className={cn(
                                "flex items-center w-full px-3 py-2 rounded-md text-sm transition-colors",
                                isActive
                                  ? "bg-primary text-primary-foreground"
                                  : "text-muted-foreground hover:bg-muted",
                              )}
                            >
                              {child.name}
                            </Link>
                          )
                        })}
                      </CollapsibleContent>
                    </Collapsible>
                  )
                }

                const isActive = pathname === item.href
                return (
                  <Link
                    key={item.name}
                    href={item.href}
                    className={cn(
                      "flex items-center w-full justify-start px-3 py-2 rounded-md text-sm font-medium transition-colors",
                      isActive ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:bg-muted",
                    )}
                  >
                    <item.icon className="w-4 h-4 mr-3" />
                    {item.name}
                  </Link>
                )
              })}
            </nav>
          </div>

          <div className="border-t p-4 space-y-1">
            <Link
              href="/settings"
              className={cn(
                "flex items-center w-full px-3 py-2 rounded-md text-sm font-medium transition-colors",
                pathname === "/settings" || pathname.startsWith("/settings/")
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:bg-muted",
              )}
            >
              <Settings className="w-4 h-4 mr-3" />
              Settings
            </Link>
            <button
              type="button"
              onClick={handleSignOut}
              className="flex items-center w-full px-3 py-2 rounded-md text-sm font-medium transition-colors text-muted-foreground hover:bg-destructive/10 hover:text-destructive"
            >
              <LogOut className="w-4 h-4 mr-3" />
              Sign Out
            </button>
          </div>
        </aside>

        {/* Main Content */}
        <main className="flex-1 bg-muted/30 min-h-[calc(100vh-4rem)]">{children}</main>
      </div>
    </div>
  )
}
