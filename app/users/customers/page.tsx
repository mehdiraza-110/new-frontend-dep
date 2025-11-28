"use client"

import { useState, useMemo } from "react"
import { Eye, Edit, Ban, MoreHorizontal, Plus, Wallet } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { AdminLayout, PageHeader } from "@/components/admin-layout"
import { SimulationProvider } from "@/components/simulation-provider"
import { RoleGuard, useRolePermissions } from "@/components/role-guard"
import { useStore } from "@/lib/store"
import { formatPKR, formatDate, formatRelativeTime, exportToCSV } from "@/lib/utils/format"
import { toast } from "sonner"
import type { Customer } from "@/lib/types"
import { WalletAdjustDialog } from "@/components/wallet-adjust-dialog"

function CustomersContent() {
  const { customers, orders, updateCustomer, addAuditLog } = useStore()
  const { canManageUsers, isReadOnly } = useRolePermissions()

  const [searchQuery, setSearchQuery] = useState("")
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null)
  const [detailOpen, setDetailOpen] = useState(false)
  const [editOpen, setEditOpen] = useState(false)
  const [walletOpen, setWalletOpen] = useState(false)
  const [editForm, setEditForm] = useState({ name: "", email: "", phone: "" })

  // Filter customers
  const filteredCustomers = useMemo(() => {
    if (!searchQuery) return customers
    const query = searchQuery.toLowerCase()
    return customers.filter(
      (c) =>
        c.name.toLowerCase().includes(query) ||
        c.phone.includes(query) ||
        c.email.toLowerCase().includes(query) ||
        c.city.toLowerCase().includes(query),
    )
  }, [customers, searchQuery])

  // Get customer orders
  const getCustomerOrders = (customerId: string) => {
    return orders.filter((o) => o.customerId === customerId)
  }

  const handleView = (customer: Customer) => {
    setSelectedCustomer(customer)
    setDetailOpen(true)
  }

  const handleEdit = (customer: Customer) => {
    setSelectedCustomer(customer)
    setEditForm({ name: customer.name, email: customer.email, phone: customer.phone })
    setEditOpen(true)
  }

  const handleSaveEdit = () => {
    if (!selectedCustomer) return
    updateCustomer(selectedCustomer.id, editForm)
    addAuditLog({
      id: `log_${Date.now()}`,
      actor: "admin@marketplace.pk",
      actorRole: "ADMIN",
      action: "customer.update",
      entity: "customer",
      entityId: selectedCustomer.id,
      details: `Updated customer ${selectedCustomer.name}`,
      timestamp: new Date().toISOString(),
      ip: "192.168.1.100",
    })
    toast.success("Customer updated successfully")
    setEditOpen(false)
  }

  const handleToggleStatus = (customer: Customer) => {
    const newStatus = customer.status === "active" ? "disabled" : "active"
    updateCustomer(customer.id, { status: newStatus })
    addAuditLog({
      id: `log_${Date.now()}`,
      actor: "admin@marketplace.pk",
      actorRole: "ADMIN",
      action: newStatus === "disabled" ? "customer.disable" : "customer.enable",
      entity: "customer",
      entityId: customer.id,
      details: `${newStatus === "disabled" ? "Disabled" : "Enabled"} customer ${customer.name}`,
      timestamp: new Date().toISOString(),
      ip: "192.168.1.100",
    })
    toast.success(`Customer ${newStatus === "disabled" ? "disabled" : "enabled"}`)
  }

  const handleWalletAdjust = (customer: Customer) => {
    setSelectedCustomer(customer)
    setWalletOpen(true)
  }

  const handleExport = () => {
    exportToCSV(filteredCustomers, "customers", [
      { key: "id", label: "ID" },
      { key: "name", label: "Name" },
      { key: "phone", label: "Phone" },
      { key: "email", label: "Email" },
      { key: "totalOrders", label: "Total Orders" },
      { key: "walletBalance", label: "Wallet Balance" },
      { key: "city", label: "City" },
      { key: "status", label: "Status" },
    ])
    toast.success("Exported to CSV")
  }

  return (
    <AdminLayout>
      <PageHeader
        title="Customers"
        description="Manage customer accounts and view order history"
        onSearch={setSearchQuery}
        onExport={handleExport}
      />

      {/* Stats Cards */}
      <div className="grid grid-cols-4 gap-4 mb-6">
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-semibold">{customers.length}</div>
            <div className="text-sm text-muted-foreground">Total Customers</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-semibold">{customers.filter((c) => c.status === "active").length}</div>
            <div className="text-sm text-muted-foreground">Active</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-semibold">
              {formatPKR(customers.reduce((sum, c) => sum + c.walletBalance, 0))}
            </div>
            <div className="text-sm text-muted-foreground">Total Wallet Balance</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-semibold">
              {Math.round(customers.reduce((sum, c) => sum + c.totalOrders, 0) / customers.length)}
            </div>
            <div className="text-sm text-muted-foreground">Avg Orders/Customer</div>
          </CardContent>
        </Card>
      </div>

      {/* Customers Table */}
      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Phone</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>City</TableHead>
                <TableHead>Total Orders</TableHead>
                <TableHead>Last Active</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="w-12"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredCustomers.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} className="text-center py-8 text-muted-foreground">
                    No customers found
                  </TableCell>
                </TableRow>
              ) : (
                filteredCustomers.map((customer) => (
                  <TableRow
                    key={customer.id}
                    className="cursor-pointer hover:bg-muted/50"
                    onClick={() => handleView(customer)}
                  >
                    <TableCell className="font-medium">{customer.name}</TableCell>
                    <TableCell>{customer.phone}</TableCell>
                    <TableCell className="text-muted-foreground">{customer.email}</TableCell>
                    <TableCell>{customer.city}</TableCell>
                    <TableCell>{customer.totalOrders}</TableCell>
                    <TableCell className="text-muted-foreground">{formatRelativeTime(customer.lastActive)}</TableCell>
                    <TableCell>
                      <Badge variant={customer.status === "active" ? "default" : "destructive"}>
                        {customer.status}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                          <Button variant="ghost" size="icon">
                            <MoreHorizontal className="w-4 h-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem
                            onClick={(e) => {
                              e.stopPropagation()
                              handleView(customer)
                            }}
                          >
                            <Eye className="w-4 h-4 mr-2" />
                            View
                          </DropdownMenuItem>
                          <RoleGuard allowedRoles={["ADMIN", "OPERATOR"]}>
                            <DropdownMenuItem
                              onClick={(e) => {
                                e.stopPropagation()
                                handleEdit(customer)
                              }}
                            >
                              <Edit className="w-4 h-4 mr-2" />
                              Edit
                            </DropdownMenuItem>
                          </RoleGuard>
                          <RoleGuard allowedRoles={["ADMIN", "FINANCE"]}>
                            <DropdownMenuItem
                              onClick={(e) => {
                                e.stopPropagation()
                                handleWalletAdjust(customer)
                              }}
                            >
                              <Wallet className="w-4 h-4 mr-2" />
                              Wallet
                            </DropdownMenuItem>
                          </RoleGuard>
                          <DropdownMenuSeparator />
                          <RoleGuard allowedRoles={["ADMIN"]}>
                            <DropdownMenuItem
                              onClick={(e) => {
                                e.stopPropagation()
                                handleToggleStatus(customer)
                              }}
                              className={customer.status === "active" ? "text-destructive" : "text-green-600"}
                            >
                              <Ban className="w-4 h-4 mr-2" />
                              {customer.status === "active" ? "Disable" : "Enable"}
                            </DropdownMenuItem>
                          </RoleGuard>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Customer Detail Dialog */}
      <Dialog open={detailOpen} onOpenChange={setDetailOpen}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>Customer Details</DialogTitle>
            <DialogDescription>View customer profile and order history</DialogDescription>
          </DialogHeader>

          {selectedCustomer && (
            <Tabs defaultValue="profile">
              <TabsList>
                <TabsTrigger value="profile">Profile</TabsTrigger>
                <TabsTrigger value="orders">Orders</TabsTrigger>
                <TabsTrigger value="wallet">Wallet</TabsTrigger>
              </TabsList>

              <TabsContent value="profile" className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label className="text-muted-foreground">Name</Label>
                    <p className="font-medium">{selectedCustomer.name}</p>
                  </div>
                  <div>
                    <Label className="text-muted-foreground">Phone</Label>
                    <p className="font-medium">{selectedCustomer.phone}</p>
                  </div>
                  <div>
                    <Label className="text-muted-foreground">Email</Label>
                    <p className="font-medium">{selectedCustomer.email}</p>
                  </div>
                  <div>
                    <Label className="text-muted-foreground">City</Label>
                    <p className="font-medium">{selectedCustomer.city}</p>
                  </div>
                  <div>
                    <Label className="text-muted-foreground">Total Orders</Label>
                    <p className="font-medium">{selectedCustomer.totalOrders}</p>
                  </div>
                  <div>
                    <Label className="text-muted-foreground">Status</Label>
                    <Badge variant={selectedCustomer.status === "active" ? "default" : "destructive"}>
                      {selectedCustomer.status}
                    </Badge>
                  </div>
                  <div>
                    <Label className="text-muted-foreground">Member Since</Label>
                    <p className="font-medium">{formatDate(selectedCustomer.createdAt)}</p>
                  </div>
                  <div>
                    <Label className="text-muted-foreground">Last Active</Label>
                    <p className="font-medium">{formatRelativeTime(selectedCustomer.lastActive)}</p>
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="orders">
                <div className="space-y-2 max-h-80 overflow-y-auto">
                  {getCustomerOrders(selectedCustomer.id).length === 0 ? (
                    <p className="text-center text-muted-foreground py-4">No orders yet</p>
                  ) : (
                    getCustomerOrders(selectedCustomer.id).map((order) => (
                      <div key={order.id} className="flex items-center justify-between p-3 rounded-lg border">
                        <div>
                          <p className="font-medium">{order.id}</p>
                          <p className="text-sm text-muted-foreground">{order.pickup.address}</p>
                        </div>
                        <div className="text-right">
                          <p className="font-medium">{formatPKR(order.totalFare)}</p>
                          <Badge
                            variant={
                              order.status === "COMPLETED"
                                ? "default"
                                : order.status === "CANCELED"
                                  ? "destructive"
                                  : "secondary"
                            }
                          >
                            {order.status}
                          </Badge>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </TabsContent>

              <TabsContent value="wallet">
                <div className="space-y-4">
                  <Card className="bg-primary/5">
                    <CardContent className="p-4">
                      <div className="text-sm text-muted-foreground">Current Balance</div>
                      <div className="text-3xl font-bold text-primary">{formatPKR(selectedCustomer.walletBalance)}</div>
                    </CardContent>
                  </Card>

                  <RoleGuard allowedRoles={["ADMIN", "FINANCE"]}>
                    <Button
                      onClick={() => {
                        setDetailOpen(false)
                        handleWalletAdjust(selectedCustomer)
                      }}
                    >
                      <Plus className="w-4 h-4 mr-2" />
                      Adjust Balance
                    </Button>
                  </RoleGuard>
                </div>
              </TabsContent>
            </Tabs>
          )}
        </DialogContent>
      </Dialog>

      {/* Edit Dialog */}
      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Customer</DialogTitle>
            <DialogDescription>Update customer information</DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="edit-name">Name</Label>
              <Input
                id="edit-name"
                value={editForm.name}
                onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-phone">Phone</Label>
              <Input
                id="edit-phone"
                value={editForm.phone}
                onChange={(e) => setEditForm({ ...editForm, phone: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-email">Email</Label>
              <Input
                id="edit-email"
                type="email"
                value={editForm.email}
                onChange={(e) => setEditForm({ ...editForm, email: e.target.value })}
              />
            </div>

            <div className="flex gap-2 justify-end">
              <Button variant="outline" onClick={() => setEditOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleSaveEdit}>Save Changes</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Wallet Adjustment Dialog */}
      {selectedCustomer && (
        <WalletAdjustDialog
          open={walletOpen}
          onOpenChange={setWalletOpen}
          ownerType="customer"
          ownerId={selectedCustomer.id}
          ownerName={selectedCustomer.name}
          currentBalance={selectedCustomer.walletBalance}
        />
      )}
    </AdminLayout>
  )
}

export default function CustomersPage() {
  return (
    <SimulationProvider>
      <CustomersContent />
    </SimulationProvider>
  )
}
