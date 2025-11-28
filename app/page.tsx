"use client"

import { useState, useEffect } from "react"
import {
  ShoppingCart,
  Users,
  TrendingUp,
  Clock,
  Plus,
  Phone,
  CheckCircle,
  XCircle,
  AlertCircle,
  Truck,
  ArrowUpRight,
  ArrowDownRight,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { AdminLayout, PageHeader } from "@/components/admin-layout"
import { SimulationProvider } from "@/components/simulation-provider"
import { useStore } from "@/lib/store"
import { formatPKR, formatRelativeTime } from "@/lib/utils/format"
import { eventBus, EVENTS } from "@/lib/event-bus"
import { PhoneOrderDialog } from "@/components/phone-order-dialog"
import { MiniMap } from "@/components/mini-map"
import { RoleGuard, useRolePermissions } from "@/components/role-guard"
import Link from "next/link"

function DashboardContent() {
  const { orders, providers, customers, metrics, auditLogs } = useStore()
  const { canManageOrders } = useRolePermissions()
  const [phoneOrderOpen, setPhoneOrderOpen] = useState(false)
  const [liveFeed, setLiveFeed] = useState<typeof auditLogs>([])

  // Calculate KPIs
  const today = new Date().toISOString().split("T")[0]
  const todayOrders = orders.filter((o) => o.createdAt.startsWith(today))
  const newOrdersToday = todayOrders.length
  const liveProviders = providers.filter((p) => p.status === "available" || p.status === "busy").length
  const inProgressOrders = orders.filter((o) => ["ASSIGNED", "EN_ROUTE", "IN_PROGRESS"].includes(o.status)).length
  const avgResponseTime = "3.2 min" // Mock
  const revenueToday = todayOrders.reduce((sum, o) => sum + o.commission, 0)

  // Get recent audit logs for live feed
  useEffect(() => {
    setLiveFeed(auditLogs.slice(0, 10))
  }, [auditLogs])

  // Subscribe to events
  useEffect(() => {
    const unsubscribe = eventBus.on(EVENTS.ORDERS_UPDATE, () => {
      // Force refresh - handled by Zustand
    })
    return unsubscribe
  }, [])

  const kpiCards = [
    { label: "New Orders Today", value: newOrdersToday.toString(), change: "+12%", trend: "up", icon: ShoppingCart },
    { label: "Live Providers", value: liveProviders.toString(), change: "+3", trend: "up", icon: Users },
    { label: "In Progress", value: inProgressOrders.toString(), change: "-2", trend: "down", icon: Truck },
    { label: "Avg Response", value: avgResponseTime, change: "-0.5m", trend: "up", icon: Clock },
    { label: "Revenue Today", value: formatPKR(revenueToday), change: "+8%", trend: "up", icon: TrendingUp },
  ]

  return (
    <AdminLayout>
      <PageHeader
        title="Dashboard Overview"
        description="Monitor your service marketplace in real-time"
        actions={
          <RoleGuard allowedRoles={["ADMIN", "OPERATOR"]}>
            <Button onClick={() => setPhoneOrderOpen(true)} className="gap-2">
              <Phone className="w-4 h-4" />
              Create Phone Order
            </Button>
          </RoleGuard>
        }
      />

      {/* KPI Cards */}
      <div className="grid grid-cols-5 gap-4 mb-6">
        {kpiCards.map((kpi, index) => (
          <Card key={index}>
            <CardContent className="p-4">
              <div className="flex items-center justify-between mb-3">
                <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center">
                  <kpi.icon className="w-5 h-5 text-primary" />
                </div>
                <div
                  className={`flex items-center gap-1 text-sm ${kpi.trend === "up" ? "text-green-600" : "text-red-600"}`}
                >
                  {kpi.trend === "up" ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownRight className="w-3 h-3" />}
                  {kpi.change}
                </div>
              </div>
              <div className="text-2xl font-semibold text-foreground">{kpi.value}</div>
              <div className="text-sm text-muted-foreground">{kpi.label}</div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        <RoleGuard allowedRoles={["ADMIN", "OPERATOR"]}>
          <Card
            className="p-4 hover:shadow-md transition-shadow cursor-pointer border-border"
            onClick={() => setPhoneOrderOpen(true)}
          >
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                <Plus className="w-6 h-6 text-green-600" />
              </div>
              <div>
                <h3 className="font-medium text-foreground">Create Phone Order</h3>
                <p className="text-sm text-muted-foreground">New order via phone call</p>
              </div>
            </div>
          </Card>
        </RoleGuard>

        <Link href="/orders?status=PENDING_ASSIGNMENT">
          <Card className="p-4 hover:shadow-md transition-shadow cursor-pointer border-border">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-amber-100 rounded-lg flex items-center justify-center">
                <AlertCircle className="w-6 h-6 text-amber-600" />
              </div>
              <div>
                <h3 className="font-medium text-foreground">Pending Assignment</h3>
                <p className="text-sm text-muted-foreground">Orders awaiting providers</p>
              </div>
            </div>
          </Card>
        </Link>

        <Link href="/providers/approvals">
          <Card className="p-4 hover:shadow-md transition-shadow cursor-pointer border-border">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                <Users className="w-6 h-6 text-blue-600" />
              </div>
              <div>
                <h3 className="font-medium text-foreground">Provider Approvals</h3>
                <p className="text-sm text-muted-foreground">Review pending applications</p>
              </div>
            </div>
          </Card>
        </Link>
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-3 gap-6">
        {/* Live Feed */}
        <Card className="col-span-1">
          <CardHeader className="pb-3">
            <CardTitle className="text-lg">Live Feed</CardTitle>
            <CardDescription>Real-time order and system events</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3 max-h-96 overflow-y-auto">
            {liveFeed.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-4">No recent activity</p>
            ) : (
              liveFeed.map((log) => (
                <div key={log.id} className="flex items-start gap-3 p-2 rounded-lg hover:bg-muted/50">
                  <div
                    className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${
                      log.action.includes("create") || log.action.includes("approve")
                        ? "bg-green-100"
                        : log.action.includes("cancel") || log.action.includes("suspend")
                          ? "bg-red-100"
                          : "bg-blue-100"
                    }`}
                  >
                    {log.action.includes("create") || log.action.includes("approve") ? (
                      <CheckCircle className="w-4 h-4 text-green-600" />
                    ) : log.action.includes("cancel") || log.action.includes("suspend") ? (
                      <XCircle className="w-4 h-4 text-red-600" />
                    ) : (
                      <AlertCircle className="w-4 h-4 text-blue-600" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-foreground truncate">{log.action.replace(".", " → ")}</p>
                    <p className="text-xs text-muted-foreground truncate">{log.details}</p>
                    <p className="text-xs text-muted-foreground">{formatRelativeTime(log.timestamp)}</p>
                  </div>
                </div>
              ))
            )}
          </CardContent>
        </Card>

        {/* Mini Map */}
        <Card className="col-span-2">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-lg">Active Providers</CardTitle>
                <CardDescription>Live provider locations and status</CardDescription>
              </div>
              <Link href="/providers/map">
                <Button variant="outline" size="sm">
                  View Full Map
                </Button>
              </Link>
            </div>
          </CardHeader>
          <CardContent>
            <MiniMap />
          </CardContent>
        </Card>
      </div>

      {/* Recent Orders */}
      <Card className="mt-6">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-lg">Recent Orders</CardTitle>
              <CardDescription>Latest orders across all cities</CardDescription>
            </div>
            <Link href="/orders">
              <Button variant="outline" size="sm">
                View All Orders
              </Button>
            </Link>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {orders.slice(0, 5).map((order) => {
              const customer = customers.find((c) => c.id === order.customerId)
              const provider = providers.find((p) => p.id === order.providerId)

              return (
                <div
                  key={order.id}
                  className="flex items-center justify-between p-3 rounded-lg border border-border hover:bg-muted/50"
                >
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center">
                      <ShoppingCart className="w-5 h-5 text-primary" />
                    </div>
                    <div>
                      <p className="font-medium text-foreground">{order.id}</p>
                      <p className="text-sm text-muted-foreground">
                        {customer?.name || "Unknown"} → {provider?.name || "Unassigned"}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="text-right">
                      <p className="font-medium text-foreground">{formatPKR(order.totalFare)}</p>
                      <p className="text-xs text-muted-foreground">{order.city}</p>
                    </div>
                    <Badge
                      variant={
                        order.status === "COMPLETED"
                          ? "default"
                          : order.status === "CANCELED"
                            ? "destructive"
                            : order.status === "IN_PROGRESS" || order.status === "EN_ROUTE"
                              ? "secondary"
                              : "outline"
                      }
                    >
                      {order.status.replace("_", " ")}
                    </Badge>
                  </div>
                </div>
              )
            })}
          </div>
        </CardContent>
      </Card>

      <PhoneOrderDialog open={phoneOrderOpen} onOpenChange={setPhoneOrderOpen} />
    </AdminLayout>
  )
}

export default function Dashboard() {
  return (
    <SimulationProvider>
      <DashboardContent />
    </SimulationProvider>
  )
}
