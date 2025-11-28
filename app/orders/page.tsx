"use client"

import { useState, useMemo } from "react"
import { AdminLayout } from "@/components/admin-layout"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { ScrollArea } from "@/components/ui/scroll-area"
import { useStore } from "@/lib/store"
import {
  Search,
  MoreHorizontal,
  MapPin,
  Clock,
  User,
  Phone,
  Eye,
  XCircle,
  RefreshCw,
  LayoutGrid,
  List,
  Map,
  Download,
} from "lucide-react"
import type { Order } from "@/lib/types"

const statusColors: Record<string, string> = {
  CREATED: "bg-slate-100 text-slate-800 border-slate-200",
  PENDING_ASSIGNMENT: "bg-amber-100 text-amber-800 border-amber-200",
  ASSIGNED: "bg-blue-100 text-blue-800 border-blue-200",
  EN_ROUTE: "bg-indigo-100 text-indigo-800 border-indigo-200",
  IN_PROGRESS: "bg-violet-100 text-violet-800 border-violet-200",
  COMPLETED: "bg-emerald-100 text-emerald-800 border-emerald-200",
  CANCELED: "bg-red-100 text-red-800 border-red-200",
}

const statusLabels: Record<string, string> = {
  CREATED: "Created",
  PENDING_ASSIGNMENT: "Pending",
  ASSIGNED: "Assigned",
  EN_ROUTE: "En Route",
  IN_PROGRESS: "In Progress",
  COMPLETED: "Completed",
  CANCELED: "Cancelled",
}

export default function OrdersPage() {
  const { orders, customers, providers, updateOrder, addAuditLog } = useStore()
  const [viewMode, setViewMode] = useState<"table" | "kanban" | "map">("table")
  const [search, setSearch] = useState("")
  const [statusFilter, setStatusFilter] = useState<string>("all")
  const [serviceFilter, setServiceFilter] = useState<string>("all")
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null)
  const [detailOpen, setDetailOpen] = useState(false)

  const filteredOrders = useMemo(() => {
    return (orders || []).filter((order) => {
      const customer = customers.find((c) => c.id === order.customerId)
      const matchesSearch =
        order.id.toLowerCase().includes(search.toLowerCase()) ||
        customer?.name?.toLowerCase().includes(search.toLowerCase()) ||
        order.pickup?.address?.toLowerCase().includes(search.toLowerCase())
      const matchesStatus = statusFilter === "all" || order.status === statusFilter
      const matchesService = serviceFilter === "all" || order.serviceType === serviceFilter
      return matchesSearch && matchesStatus && matchesService
    })
  }, [orders, customers, search, statusFilter, serviceFilter])

  const handleCancelOrder = (order: Order) => {
    updateOrder(order.id, { status: "CANCELED" })
    addAuditLog({
      id: `log_${Date.now()}`,
      actor: "admin@marketplace.pk",
      actorRole: "ADMIN",
      action: "order.cancel",
      entity: "order",
      entityId: order.id,
      details: `Cancelled order ${order.id}`,
      timestamp: new Date().toISOString(),
      ip: "192.168.1.100",
    })
  }

  const handleReassignOrder = (order: Order) => {
    updateOrder(order.id, { status: "PENDING_ASSIGNMENT", providerId: null })
    addAuditLog({
      id: `log_${Date.now()}`,
      actor: "admin@marketplace.pk",
      actorRole: "ADMIN",
      action: "order.reassign",
      entity: "order",
      entityId: order.id,
      details: `Reassigned order ${order.id} - removed provider`,
      timestamp: new Date().toISOString(),
      ip: "192.168.1.100",
    })
  }

  const handleViewOrder = (order: Order) => {
    setSelectedOrder(order)
    setDetailOpen(true)
  }

  // Stats
  const totalOrders = orders.length
  const completedOrders = orders.filter((o) => o.status === "COMPLETED").length
  const pendingOrders = orders.filter((o) => o.status === "PENDING_ASSIGNMENT").length
  const inProgressOrders = orders.filter((o) => ["ASSIGNED", "EN_ROUTE", "IN_PROGRESS"].includes(o.status)).length

  return (
    <AdminLayout>
      <div className="flex flex-col gap-6 p-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-semibold text-foreground">Orders</h1>
            <p className="text-sm text-muted-foreground">Manage and track all orders</p>
          </div>
          <div className="flex items-center gap-2">
            <div className="flex items-center border rounded-lg p-1">
              <Button
                variant={viewMode === "table" ? "secondary" : "ghost"}
                size="sm"
                onClick={() => setViewMode("table")}
              >
                <List className="h-4 w-4" />
              </Button>
              <Button
                variant={viewMode === "kanban" ? "secondary" : "ghost"}
                size="sm"
                onClick={() => setViewMode("kanban")}
              >
                <LayoutGrid className="h-4 w-4" />
              </Button>
              <Button variant={viewMode === "map" ? "secondary" : "ghost"} size="sm" onClick={() => setViewMode("map")}>
                <Map className="h-4 w-4" />
              </Button>
            </div>
            <Button variant="outline" size="sm">
              <Download className="mr-2 h-4 w-4" />
              Export
            </Button>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-4 gap-4">
          <Card>
            <CardContent className="pt-6">
              <div className="text-2xl font-semibold">{totalOrders}</div>
              <p className="text-sm text-muted-foreground">Total Orders</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="text-2xl font-semibold text-emerald-600">{completedOrders}</div>
              <p className="text-sm text-muted-foreground">Completed</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="text-2xl font-semibold text-amber-600">{pendingOrders}</div>
              <p className="text-sm text-muted-foreground">Pending Assignment</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="text-2xl font-semibold text-blue-600">{inProgressOrders}</div>
              <p className="text-sm text-muted-foreground">In Progress</p>
            </CardContent>
          </Card>
        </div>

        {/* Filters */}
        <div className="flex items-center gap-4">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search orders..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-10"
            />
          </div>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Filter by status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="CREATED">Created</SelectItem>
              <SelectItem value="PENDING_ASSIGNMENT">Pending</SelectItem>
              <SelectItem value="ASSIGNED">Assigned</SelectItem>
              <SelectItem value="EN_ROUTE">En Route</SelectItem>
              <SelectItem value="IN_PROGRESS">In Progress</SelectItem>
              <SelectItem value="COMPLETED">Completed</SelectItem>
              <SelectItem value="CANCELED">Cancelled</SelectItem>
            </SelectContent>
          </Select>
          <Select value={serviceFilter} onValueChange={setServiceFilter}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Filter by service" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Services</SelectItem>
              <SelectItem value="delivery">Delivery</SelectItem>
              <SelectItem value="courier">Courier</SelectItem>
              <SelectItem value="moving">Moving</SelectItem>
              <SelectItem value="heavy">Heavy</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Table View */}
        {viewMode === "table" && (
          <Card>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Order ID</TableHead>
                    <TableHead>Customer</TableHead>
                    <TableHead>Provider</TableHead>
                    <TableHead>Service</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Total</TableHead>
                    <TableHead>Created</TableHead>
                    <TableHead className="w-[80px]"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredOrders.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={8} className="text-center py-8 text-muted-foreground">
                        No orders found
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredOrders.slice(0, 20).map((order) => {
                      const customer = customers.find((c) => c.id === order.customerId)
                      const provider = providers.find((p) => p.id === order.providerId)
                      return (
                        <TableRow key={order.id} className="cursor-pointer" onClick={() => handleViewOrder(order)}>
                          <TableCell className="font-mono text-sm">{order.id}</TableCell>
                          <TableCell>{customer?.name || "Unknown"}</TableCell>
                          <TableCell>{provider?.name || "Unassigned"}</TableCell>
                          <TableCell className="capitalize">{order.serviceType}</TableCell>
                          <TableCell>
                            <Badge variant="outline" className={statusColors[order.status]}>
                              {statusLabels[order.status] || order.status}
                            </Badge>
                          </TableCell>
                          <TableCell>PKR {(order.totalFare ?? 0).toLocaleString()}</TableCell>
                          <TableCell className="text-muted-foreground">
                            {new Date(order.createdAt).toLocaleDateString()}
                          </TableCell>
                          <TableCell>
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                                <Button variant="ghost" size="icon">
                                  <MoreHorizontal className="h-4 w-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                <DropdownMenuItem onClick={() => handleViewOrder(order)}>
                                  <Eye className="mr-2 h-4 w-4" />
                                  View Details
                                </DropdownMenuItem>
                                {order.status !== "COMPLETED" && order.status !== "CANCELED" && (
                                  <>
                                    <DropdownMenuItem onClick={() => handleReassignOrder(order)}>
                                      <RefreshCw className="mr-2 h-4 w-4" />
                                      Reassign
                                    </DropdownMenuItem>
                                    <DropdownMenuItem
                                      onClick={() => handleCancelOrder(order)}
                                      className="text-destructive"
                                    >
                                      <XCircle className="mr-2 h-4 w-4" />
                                      Cancel Order
                                    </DropdownMenuItem>
                                  </>
                                )}
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </TableCell>
                        </TableRow>
                      )
                    })
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        )}

        {/* Kanban View */}
        {viewMode === "kanban" && (
          <div className="grid grid-cols-4 gap-4">
            {["PENDING_ASSIGNMENT", "ASSIGNED", "IN_PROGRESS", "COMPLETED"].map((status) => {
              const statusOrders = filteredOrders.filter((o) => o.status === status)
              return (
                <div key={status} className="bg-muted/50 rounded-lg p-4">
                  <div className="flex items-center justify-between mb-4">
                    <Badge variant="outline" className={statusColors[status]}>
                      {statusLabels[status]}
                    </Badge>
                    <span className="text-sm text-muted-foreground">{statusOrders.length}</span>
                  </div>
                  <ScrollArea className="h-[500px]">
                    <div className="space-y-3">
                      {statusOrders.slice(0, 10).map((order) => {
                        const customer = customers.find((c) => c.id === order.customerId)
                        return (
                          <Card
                            key={order.id}
                            className="cursor-pointer hover:shadow-md transition-shadow"
                            onClick={() => handleViewOrder(order)}
                          >
                            <CardContent className="p-3">
                              <div className="flex items-center justify-between mb-2">
                                <span className="font-mono text-xs">{order.id}</span>
                                <Badge variant="outline" className="capitalize text-xs">
                                  {order.serviceType}
                                </Badge>
                              </div>
                              <p className="font-medium text-sm mb-1">{customer?.name || "Unknown"}</p>
                              <p className="text-xs text-muted-foreground truncate">{order.pickup?.address}</p>
                              <div className="flex items-center justify-between mt-2 pt-2 border-t">
                                <span className="text-sm font-medium">
                                  PKR {(order.totalFare ?? 0).toLocaleString()}
                                </span>
                                <span className="text-xs text-muted-foreground">
                                  {new Date(order.createdAt).toLocaleTimeString()}
                                </span>
                              </div>
                            </CardContent>
                          </Card>
                        )
                      })}
                    </div>
                  </ScrollArea>
                </div>
              )
            })}
          </div>
        )}

        {/* Map View Placeholder */}
        {viewMode === "map" && (
          <Card className="h-[600px] flex items-center justify-center">
            <div className="text-center">
              <Map className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-medium">Map View</h3>
              <p className="text-muted-foreground">Order locations will be displayed here</p>
            </div>
          </Card>
        )}

        {/* Order Detail Dialog */}
        <Dialog open={detailOpen} onOpenChange={setDetailOpen}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Order Details</DialogTitle>
            </DialogHeader>
            {selectedOrder && (
              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-mono text-sm text-muted-foreground">{selectedOrder.id}</p>
                    <Badge variant="outline" className={statusColors[selectedOrder.status]}>
                      {statusLabels[selectedOrder.status]}
                    </Badge>
                  </div>
                  <div className="text-right">
                    <p className="text-2xl font-semibold">PKR {(selectedOrder.totalFare ?? 0).toLocaleString()}</p>
                    <p className="text-sm text-muted-foreground capitalize">{selectedOrder.serviceType}</p>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <div className="flex items-start gap-3">
                      <MapPin className="h-5 w-5 text-emerald-600 mt-0.5" />
                      <div>
                        <p className="text-sm text-muted-foreground">Pickup</p>
                        <p className="font-medium">{selectedOrder.pickup?.address || "N/A"}</p>
                      </div>
                    </div>
                    <div className="flex items-start gap-3">
                      <MapPin className="h-5 w-5 text-red-600 mt-0.5" />
                      <div>
                        <p className="text-sm text-muted-foreground">Drop</p>
                        <p className="font-medium">{selectedOrder.drop?.address || "N/A"}</p>
                      </div>
                    </div>
                  </div>
                  <div className="space-y-4">
                    <div className="flex items-start gap-3">
                      <User className="h-5 w-5 text-muted-foreground mt-0.5" />
                      <div>
                        <p className="text-sm text-muted-foreground">Customer</p>
                        <p className="font-medium">
                          {customers.find((c) => c.id === selectedOrder.customerId)?.name || "Unknown"}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-start gap-3">
                      <Phone className="h-5 w-5 text-muted-foreground mt-0.5" />
                      <div>
                        <p className="text-sm text-muted-foreground">Provider</p>
                        <p className="font-medium">
                          {providers.find((p) => p.id === selectedOrder.providerId)?.name || "Unassigned"}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-start gap-3">
                      <Clock className="h-5 w-5 text-muted-foreground mt-0.5" />
                      <div>
                        <p className="text-sm text-muted-foreground">Created</p>
                        <p className="font-medium">{new Date(selectedOrder.createdAt).toLocaleString()}</p>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="pt-4 border-t">
                  <h4 className="font-medium mb-3">Fare Breakdown</h4>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Base Fare</span>
                      <span>PKR {(selectedOrder.baseFare ?? 0).toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Distance ({selectedOrder.distance ?? 0} km)</span>
                      <span>PKR {(selectedOrder.distanceFare ?? 0).toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Time ({selectedOrder.duration ?? 0} min)</span>
                      <span>PKR {(selectedOrder.timeFare ?? 0).toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Platform Fee</span>
                      <span>PKR {(selectedOrder.platformFee ?? 0).toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between font-semibold pt-2 border-t">
                      <span>Total</span>
                      <span>PKR {(selectedOrder.totalFare ?? 0).toLocaleString()}</span>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>
      </div>
    </AdminLayout>
  )
}
