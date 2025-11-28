"use client"

import type React from "react"
import { useState, useEffect, useCallback } from "react"
import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import {
  Search,
  Bell,
  Home,
  Users,
  UserCheck,
  ShoppingCart,
  DollarSign,
  Wallet,
  BarChart3,
  Settings,
  ChevronDown,
  Download,
  Truck,
  LogOut,
  Menu,
  X,
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
import { useStore } from "@/lib/store"
import { DemoRibbon } from "./demo-ribbon"
import type { UserRole } from "@/lib/types"

type NavItem =
  | { type: "link"; name: string; href: string; icon: React.ComponentType<{ className?: string }> }
  | {
      type: "collapsible"
      name: string
      icon: React.ComponentType<{ className?: string }>
      children: { name: string; href: string }[]
    }

const navigation: NavItem[] = [
  { type: "link", name: "Dashboard", href: "/", icon: Home },
  {
    type: "collapsible",
    name: "Users",
    icon: Users,
    children: [
      { name: "Customers", href: "/users/customers" },
      { name: "Service Providers", href: "/users/providers" },
    ],
  },
  {
    type: "collapsible",
    name: "Providers",
    icon: UserCheck,
    children: [
      { name: "Approvals Queue", href: "/providers/approvals" },
      { name: "Live Map", href: "/providers/map" },
    ],
  },
  { type: "link", name: "Orders", href: "/orders", icon: ShoppingCart },
  { type: "link", name: "Pricing", href: "/pricing", icon: DollarSign },
  { type: "link", name: "Payments", href: "/payments", icon: Wallet },
  { type: "link", name: "Monitoring", href: "/monitoring", icon: BarChart3 },
]

const roles: UserRole[] = ["ADMIN", "OPERATOR", "FINANCE", "AUDITOR", "READONLY"]

interface AdminLayoutProps {
  children: React.ReactNode
}

export function AdminLayout({ children }: AdminLayoutProps) {
  const pathname = usePathname()
  const router = useRouter()
  const { currentRole, setCurrentRole, isAuthenticated, authUser, logout } = useStore()
  const [sidebarOpen, setSidebarOpen] = useState(true)
  const [isMobile, setIsMobile] = useState(false)

  const getInitialExpandedState = useCallback(() => {
    const initial: Record<string, boolean> = {}
    navigation.forEach((item) => {
      if (item.type === "collapsible") {
        const isActive = item.children.some((child) => pathname === child.href || pathname.startsWith(child.href + "/"))
        initial[item.name] = isActive
      }
    })
    return initial
  }, [pathname])

  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>(getInitialExpandedState)

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 1024)
      if (window.innerWidth < 1024) {
        setSidebarOpen(false)
      }
    }

    window.addEventListener("resize", handleResize)
    handleResize()
    return () => window.removeEventListener("resize", handleResize)
  }, [])

  const toggleSection = useCallback((sectionName: string) => {
    setExpandedSections((prev) => ({
      ...prev,
      [sectionName]: !prev[sectionName],
    }))
  }, [])

  useEffect(() => {
    if (!isAuthenticated && pathname !== "/login") {
      router.push("/login")
    }
  }, [isAuthenticated, pathname, router])

  useEffect(() => {
    navigation.forEach((item) => {
      if (item.type === "collapsible") {
        const isActive = item.children.some((child) => pathname === child.href || pathname.startsWith(child.href + "/"))
        if (isActive) {
          setExpandedSections((prev) => {
            if (prev[item.name]) return prev
            return { ...prev, [item.name]: true }
          })
        }
      }
    })
  }, [pathname])

  const handleSignOut = useCallback(() => {
    logout()
    router.push("/login")
  }, [logout, router])

  if (pathname === "/login" || !isAuthenticated) {
    return null
  }

  const pathSegments = pathname.split("/").filter(Boolean)
  const breadcrumbs = pathSegments.map((segment, index) => ({
    name: segment.charAt(0).toUpperCase() + segment.slice(1).replace(/-/g, " "),
    href: "/" + pathSegments.slice(0, index + 1).join("/"),
  }))

  const userInitials = authUser?.name
    ? authUser.name
        .split(" ")
        .map((n) => n[0])
        .join("")
        .toUpperCase()
        .slice(0, 2)
    : "AD"

  return (
    <div className="min-h-screen bg-background">
      <DemoRibbon />

      {/* Fixed Header */}
      <header className="fixed top-0 left-0 right-0 z-50 h-16 border-b border-border bg-card px-4 md:px-6 flex items-center justify-between">
        <div className="flex items-center gap-4 flex-1 min-w-0">
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="lg:hidden p-2 hover:bg-accent rounded-md"
            aria-label="Toggle sidebar"
          >
            {sidebarOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>

          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center flex-shrink-0">
              <Truck className="w-4 h-4 text-primary-foreground" />
            </div>
            <span className="font-semibold text-foreground hidden sm:inline">ServiceHub Admin</span>
          </div>

          <div className="text-sm text-muted-foreground flex items-center min-w-0 hidden md:flex">
            <Link href="/" className="hover:text-foreground truncate">
              Dashboard
            </Link>
            {breadcrumbs.map((crumb) => (
              <span key={crumb.href} className="flex items-center">
                <span className="mx-1">/</span>
                <Link href={crumb.href} className="hover:text-foreground truncate">
                  {crumb.name}
                </Link>
              </span>
            ))}
          </div>
        </div>

        <div className="flex items-center gap-2 md:gap-4 flex-shrink-0">
          <div className="relative hidden sm:block">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
            <Input placeholder="Search..." className="pl-10 w-48 md:w-80 bg-muted border-input" />
          </div>

          <Button variant="ghost" size="icon" className="relative">
            <Bell className="w-4 h-4" />
            <span className="absolute -top-1 -right-1 w-2 h-2 bg-destructive rounded-full"></span>
          </Button>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon">
                <Avatar className="w-8 h-8">
                  <AvatarImage src="/admin-user-interface.png" />
                  <AvatarFallback>{userInitials}</AvatarFallback>
                </Avatar>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <DropdownMenuLabel>{authUser?.name || "Admin User"}</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem asChild>
                <Link href="/settings">Profile</Link>
              </DropdownMenuItem>
              <DropdownMenuItem asChild>
                <Link href="/settings">Settings</Link>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={handleSignOut} className="text-destructive focus:text-destructive">
                <LogOut className="w-4 h-4 mr-2" />
                Sign out
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </header>

      {/* Fixed Sidebar */}
      <aside
        className={`fixed top-16 left-0 bottom-0 z-40 w-64 border-r border-border bg-card flex flex-col transition-transform duration-300 lg:translate-x-0 ${
          sidebarOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <nav className="flex-1 overflow-y-auto p-4 space-y-1">
          {navigation.map((item) => {
            if (item.type === "link") {
              const isActive =
                item.href === "/" ? pathname === "/" : pathname === item.href || pathname.startsWith(item.href + "/")

              return (
                <Link
                  key={item.name}
                  href={item.href}
                  onClick={() => isMobile && setSidebarOpen(false)}
                  className={`flex items-center px-3 py-2 text-sm font-medium rounded-md transition-colors ${
                    isActive
                      ? "bg-primary text-primary-foreground"
                      : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
                  }`}
                >
                  <item.icon className="w-4 h-4 mr-3 flex-shrink-0" />
                  {item.name}
                </Link>
              )
            }

            // Collapsible section
            const isExpanded = expandedSections[item.name] ?? false
            const isParentActive = item.children.some(
              (child) => pathname === child.href || pathname.startsWith(child.href + "/"),
            )

            return (
              <div key={item.name}>
                <button
                  type="button"
                  onClick={() => toggleSection(item.name)}
                  className={`flex items-center justify-between w-full px-3 py-2 text-sm font-medium rounded-md transition-colors ${
                    isParentActive
                      ? "text-foreground bg-accent/50"
                      : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
                  }`}
                >
                  <span className="flex items-center">
                    <item.icon className="w-4 h-4 mr-3 flex-shrink-0" />
                    {item.name}
                  </span>
                  <ChevronDown
                    className={`w-4 h-4 flex-shrink-0 transition-transform duration-200 ${
                      isExpanded ? "rotate-0" : "-rotate-90"
                    }`}
                  />
                </button>

                <div
                  className="grid transition-all duration-200 ease-in-out"
                  style={{
                    gridTemplateRows: isExpanded ? "1fr" : "0fr",
                  }}
                >
                  <div className="overflow-hidden">
                    <div className="ml-7 py-1 space-y-1">
                      {item.children.map((child) => {
                        const isChildActive = pathname === child.href || pathname.startsWith(child.href + "/")
                        return (
                          <Link
                            key={child.href}
                            href={child.href}
                            onClick={() => isMobile && setSidebarOpen(false)}
                            className={`block px-3 py-1.5 text-sm rounded-md transition-colors ${
                              isChildActive
                                ? "bg-primary text-primary-foreground"
                                : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
                            }`}
                          >
                            {child.name}
                          </Link>
                        )
                      })}
                    </div>
                  </div>
                </div>
              </div>
            )
          })}
        </nav>

        <div className="flex-shrink-0 border-t border-border p-4 space-y-1">
          <Link
            href="/settings"
            onClick={() => isMobile && setSidebarOpen(false)}
            className={`flex items-center px-3 py-2 text-sm font-medium rounded-md transition-colors ${
              pathname === "/settings" || pathname.startsWith("/settings/")
                ? "bg-primary text-primary-foreground"
                : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
            }`}
          >
            <Settings className="w-4 h-4 mr-3 flex-shrink-0" />
            Settings
          </Link>
          <button
            type="button"
            onClick={handleSignOut}
            className="flex items-center w-full px-3 py-2 text-sm font-medium rounded-md transition-colors text-muted-foreground hover:bg-destructive/10 hover:text-destructive"
          >
            <LogOut className="w-4 h-4 mr-3 flex-shrink-0" />
            Sign Out
          </button>
        </div>
      </aside>

      {/* Mobile Overlay */}
      {isMobile && sidebarOpen && (
        <div className="fixed inset-0 bg-black/50 z-30 top-16" onClick={() => setSidebarOpen(false)} />
      )}

      {/* Main Content */}
      <main className="ml-0 lg:ml-64 mt-16 p-4 md:p-6 bg-muted/30 min-h-[calc(100vh-4rem)]">{children}</main>
    </div>
  )
}

// Page header component with search and export
interface PageHeaderProps {
  title: string
  description?: string
  onSearch?: (query: string) => void
  onExport?: () => void
  actions?: React.ReactNode
}

export function PageHeader({ title, description, onSearch, onExport, actions }: PageHeaderProps) {
  return (
    <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 mb-6">
      <div>
        <h1 className="text-2xl md:text-3xl font-semibold text-foreground">{title}</h1>
        {description && <p className="text-muted-foreground mt-1 text-sm">{description}</p>}
      </div>
      <div className="flex items-center gap-3 flex-wrap">
        {onSearch && (
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
            <Input placeholder="Search..." className="pl-10 w-48 md:w-64" onChange={(e) => onSearch(e.target.value)} />
          </div>
        )}
        {onExport && (
          <Button variant="outline" size="sm" onClick={onExport}>
            <Download className="w-4 h-4 mr-2" />
            Export CSV
          </Button>
        )}
        {actions}
      </div>
    </div>
  )
}
