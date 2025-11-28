"use client"

import { useState, useMemo } from "react"
import { Eye, Edit, Ban, MoreHorizontal, MapPin, Star, Truck, Shield, Wallet } from "lucide-react"
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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { AdminLayout, PageHeader } from "@/components/admin-layout"
import { SimulationProvider } from "@/components/simulation-provider"
import { RoleGuard } from "@/components/role-guard"
import { useStore } from "@/lib/store"
import { formatPKR, formatDate, formatRelativeTime, exportToCSV } from "@/lib/utils/format"
import { toast } from "sonner"
import type { Provider, ProviderStatus } from "@/lib/types"
import { WalletAdjustDialog } from "@/components/wallet-adjust-dialog"

const statusColors: Record<ProviderStatus, string> = {
  available: "bg-green-100 text-green-700",
  busy: "bg-amber-100 text-amber-700",
  offline: "bg-gray-100 text-gray-700",
  pending: "bg-blue-100 text-blue-700",
  verified: "bg-green-100 text-green-700",
  suspended: "bg-red-100 text-red-700",
}

function ProvidersContent() {
  const { providers, orders, updateProvider, addAuditLog } = useStore()

  const [searchQuery, setSearchQuery] = useState("")
  const [statusFilter, setStatusFilter] = useState<string>("all")
  const [selectedProvider, setSelectedProvider] = useState<Provider | null>(null)
  const [detailOpen, setDetailOpen] = useState(false)
  const [editOpen, setEditOpen] = useState(false)
  const [walletOpen, setWalletOpen] = useState(false)
  const [editForm, setEditForm] = useState({ name: "", email: "", phone: "" })

  // Filter providers
  const filteredProviders = useMemo(() => {
    let result = providers

    if (searchQuery) {
      const query = searchQuery.toLowerCase()
      result = result.filter(
        (p) =>
          p.name.toLowerCase().includes(query) ||
          p.phone.includes(query) ||
          p.email.toLowerCase().includes(query) ||
          p.city.toLowerCase().includes(query) ||
          p.vehiclePlate.toLowerCase().includes(query),
      )
    }

    if (statusFilter !== "all") {
      result = result.filter((p) => p.status === statusFilter)
    }

    return result
  }, [providers, searchQuery, statusFilter])

  // Get provider orders
  const getProviderOrders = (providerId: string) => {
    return orders.filter((o) => o.providerId === providerId)
  }

  const handleView = (provider: Provider) => {
    setSelectedProvider(provider)
    setDetailOpen(true)
  }

  const handleEdit = (provider: Provider) => {
    setSelectedProvider(provider)
    setEditForm({ name: provider.name, email: provider.email, phone: provider.phone })
    setEditOpen(true)
  }

  const handleSaveEdit = () => {
    if (!selectedProvider) return
    updateProvider(selectedProvider.id, editForm)
    addAuditLog({
      id: `log_${Date.now()}`,
      actor: "admin@marketplace.pk",
      actorRole: "ADMIN",
      action: "provider.update",
      entity: "provider",
      entityId: selectedProvider.id,
      details: `Updated provider ${selectedProvider.name}`,
      timestamp: new Date().toISOString(),
      ip: "192.168.1.100",
    })
    toast.success("Provider updated successfully")
    setEditOpen(false)
  }

  const handleSuspend = (provider: Provider) => {
    const newStatus = provider.status === "suspended" ? "offline" : "suspended"
    updateProvider(provider.id, { status: newStatus as ProviderStatus })
    addAuditLog({
      id: `log_${Date.now()}`,
      actor: "admin@marketplace.pk",
      actorRole: "ADMIN",
      action: newStatus === "suspended" ? "provider.suspend" : "provider.unsuspend",
      entity: "provider",
      entityId: provider.id,
      details: `${newStatus === "suspended" ? "Suspended" : "Unsuspended"} provider ${provider.name}`,
      timestamp: new Date().toISOString(),
      ip: "192.168.1.100",
    })
    toast.success(`Provider ${newStatus === "suspended" ? "suspended" : "unsuspended"}`)
  }

  const handleWalletAdjust = (provider: Provider) => {
    setSelectedProvider(provider)
    setWalletOpen(true)
  }

  const handleExport = () => {
    exportToCSV(filteredProviders, "providers", [
      { key: "id", label: "ID" },
      { key: "name", label: "Name" },
      { key: "phone", label: "Phone" },
      { key: "email", label: "Email" },
      { key: "status", label: "Status" },
      { key: "rating", label: "Rating" },
      { key: "completedOrders", label: "Completed Orders" },
      { key: "city", label: "City" },
      { key: "vehicleType", label: "Vehicle" },
      { key: "walletBalance", label: "Wallet Balance" },
    ])
    toast.success("Exported to CSV")
  }

  return (
    <AdminLayout>
      <PageHeader
        title="Service Providers"
        description="Manage service provider accounts and performance"
        onSearch={setSearchQuery}
        onExport={handleExport}
        actions={
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-40">
              <SelectValue placeholder="Filter status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="available">Available</SelectItem>
              <SelectItem value="busy">Busy</SelectItem>
              <SelectItem value="offline">Offline</SelectItem>
              <SelectItem value="pending">Pending</SelectItem>
              <SelectItem value="suspended">Suspended</SelectItem>
            </SelectContent>
          </Select>
        }
      />

      {/* Stats Cards */}
      <div className="grid grid-cols-5 gap-4 mb-6">
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-semibold">{providers.length}</div>
            <div className="text-sm text-muted-foreground">Total Providers</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-semibold text-green-600">
              {providers.filter((p) => p.status === "available").length}
            </div>
            <div className="text-sm text-muted-foreground">Available</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-semibold text-amber-600">
              {providers.filter((p) => p.status === "busy").length}
            </div>
            <div className="text-sm text-muted-foreground">Busy</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-semibold text-blue-600">
              {providers.filter((p) => p.status === "pending").length}
            </div>
            <div className="text-sm text-muted-foreground">Pending Approval</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-semibold">
              {(
                providers.filter((p) => p.rating > 0).reduce((sum, p) => sum + p.rating, 0) /
                providers.filter((p) => p.rating > 0).length
              ).toFixed(1)}
            </div>
            <div className="text-sm text-muted-foreground">Avg Rating</div>
          </CardContent>
        </Card>
      </div>

      {/* Providers Table */}
      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Provider</TableHead>
                <TableHead>Contact</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Rating</TableHead>
                <TableHead>Orders</TableHead>
                <TableHead>Last Ping</TableHead>
                <TableHead>City</TableHead>
                <TableHead className="w-12"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredProviders.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} className="text-center py-8 text-muted-foreground">
                    No providers found
                  </TableCell>
                </TableRow>
              ) : (
                filteredProviders.map((provider) => (
                  <TableRow
                    key={provider.id}
                    className="cursor-pointer hover:bg-muted/50"
                    onClick={() => handleView(provider)}
                  >
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center">
                          <Truck className="w-5 h-5 text-primary" />
                        </div>
                        <div>
                          <p className="font-medium">{provider.name}</p>
                          <p className="text-xs text-muted-foreground">
                            {provider.vehicleType} • {provider.vehiclePlate}
                          </p>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="text-sm">
                        <p>{provider.phone}</p>
                        <p className="text-muted-foreground">{provider.email}</p>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge className={statusColors[provider.status]}>{provider.status}</Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        <Star className="w-4 h-4 text-amber-500 fill-amber-500" />
                        <span>{provider.rating > 0 ? provider.rating.toFixed(1) : "N/A"}</span>
                      </div>
                    </TableCell>
                    <TableCell>{provider.completedOrders}</TableCell>
                    <TableCell className="text-muted-foreground">{formatRelativeTime(provider.lastPing)}</TableCell>
                    <TableCell>{provider.city}</TableCell>
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
                              handleView(provider)
                            }}
                          >
                            <Eye className="w-4 h-4 mr-2" />
                            View
                          </DropdownMenuItem>
                          <RoleGuard allowedRoles={["ADMIN", "OPERATOR"]}>
                            <DropdownMenuItem
                              onClick={(e) => {
                                e.stopPropagation()
                                handleEdit(provider)
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
                                handleWalletAdjust(provider)
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
                                handleSuspend(provider)
                              }}
                              className={provider.status !== "suspended" ? "text-destructive" : "text-green-600"}
                            >
                              <Ban className="w-4 h-4 mr-2" />
                              {provider.status !== "suspended" ? "Suspend" : "Unsuspend"}
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

      {/* Provider Detail Dialog */}
      <Dialog open={detailOpen} onOpenChange={setDetailOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Provider Details</DialogTitle>
            <DialogDescription>View provider profile, documents, and performance</DialogDescription>
          </DialogHeader>

          {selectedProvider && (
            <Tabs defaultValue="profile">
              <TabsList>
                <TabsTrigger value="profile">Profile</TabsTrigger>
                <TabsTrigger value="documents">Documents</TabsTrigger>
                <TabsTrigger value="orders">Orders</TabsTrigger>
                <TabsTrigger value="wallet">Wallet</TabsTrigger>
              </TabsList>

              <TabsContent value="profile" className="space-y-4">
                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <Label className="text-muted-foreground">Name</Label>
                    <p className="font-medium">{selectedProvider.name}</p>
                  </div>
                  <div>
                    <Label className="text-muted-foreground">Phone</Label>
                    <p className="font-medium">{selectedProvider.phone}</p>
                  </div>
                  <div>
                    <Label className="text-muted-foreground">Email</Label>
                    <p className="font-medium">{selectedProvider.email}</p>
                  </div>
                  <div>
                    <Label className="text-muted-foreground">City</Label>
                    <p className="font-medium">{selectedProvider.city}</p>
                  </div>
                  <div>
                    <Label className="text-muted-foreground">Status</Label>
                    <Badge className={statusColors[selectedProvider.status]}>{selectedProvider.status}</Badge>
                  </div>
                  <div>
                    <Label className="text-muted-foreground">KYC Status</Label>
                    <Badge variant={selectedProvider.kycStatus === "verified" ? "default" : "secondary"}>
                      {selectedProvider.kycStatus}
                    </Badge>
                  </div>
                  <div>
                    <Label className="text-muted-foreground">Vehicle Type</Label>
                    <p className="font-medium capitalize">{selectedProvider.vehicleType}</p>
                  </div>
                  <div>
                    <Label className="text-muted-foreground">Vehicle Plate</Label>
                    <p className="font-medium">{selectedProvider.vehiclePlate}</p>
                  </div>
                  <div>
                    <Label className="text-muted-foreground">Service Types</Label>
                    <div className="flex gap-1 flex-wrap">
                      {selectedProvider.serviceTypes.map((type) => (
                        <Badge key={type} variant="outline">
                          {type}
                        </Badge>
                      ))}
                    </div>
                  </div>
                  <div>
                    <Label className="text-muted-foreground">Rating</Label>
                    <div className="flex items-center gap-1">
                      <Star className="w-4 h-4 text-amber-500 fill-amber-500" />
                      <span className="font-medium">
                        {selectedProvider.rating > 0 ? selectedProvider.rating.toFixed(1) : "N/A"}
                      </span>
                    </div>
                  </div>
                  <div>
                    <Label className="text-muted-foreground">Completed Orders</Label>
                    <p className="font-medium">{selectedProvider.completedOrders}</p>
                  </div>
                  <div>
                    <Label className="text-muted-foreground">Member Since</Label>
                    <p className="font-medium">{formatDate(selectedProvider.createdAt)}</p>
                  </div>
                </div>

                {/* Last Location */}
                <div className="p-4 bg-muted/50 rounded-lg">
                  <div className="flex items-center gap-2 mb-2">
                    <MapPin className="w-4 h-4 text-muted-foreground" />
                    <Label className="text-muted-foreground">Last Known Location</Label>
                  </div>
                  <p className="text-sm">
                    Lat: {selectedProvider.lastLocation.lat.toFixed(6)}, Lng:{" "}
                    {selectedProvider.lastLocation.lng.toFixed(6)}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Last ping: {formatRelativeTime(selectedProvider.lastPing)}
                  </p>
                </div>
              </TabsContent>

              <TabsContent value="documents">
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    {["CNIC Front", "CNIC Back", "Driving License", "Vehicle Registration"].map((doc) => (
                      <Card key={doc} className="p-4">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-muted rounded-lg flex items-center justify-center">
                              <Shield className="w-5 h-5 text-muted-foreground" />
                            </div>
                            <div>
                              <p className="font-medium">{doc}</p>
                              <p className="text-xs text-muted-foreground">
                                {selectedProvider.kycStatus === "verified" ? "Verified" : "Pending review"}
                              </p>
                            </div>
                          </div>
                          <Badge variant={selectedProvider.kycStatus === "verified" ? "default" : "secondary"}>
                            {selectedProvider.kycStatus === "verified" ? "Approved" : "Pending"}
                          </Badge>
                        </div>
                      </Card>
                    ))}
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="orders">
                <div className="space-y-2 max-h-80 overflow-y-auto">
                  {getProviderOrders(selectedProvider.id).length === 0 ? (
                    <p className="text-center text-muted-foreground py-4">No orders yet</p>
                  ) : (
                    getProviderOrders(selectedProvider.id)
                      .slice(0, 20)
                      .map((order) => (
                        <div key={order.id} className="flex items-center justify-between p-3 rounded-lg border">
                          <div>
                            <p className="font-medium">{order.id}</p>
                            <p className="text-sm text-muted-foreground">{formatDate(order.createdAt)}</p>
                          </div>
                          <div className="text-right">
                            <p className="font-medium">{formatPKR(order.providerEarning)}</p>
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
                  <div className="grid grid-cols-3 gap-4">
                    <Card className="bg-primary/5">
                      <CardContent className="p-4">
                        <div className="text-sm text-muted-foreground">Available Balance</div>
                        <div className="text-2xl font-bold text-primary">
                          {formatPKR(selectedProvider.walletBalance)}
                        </div>
                      </CardContent>
                    </Card>
                    <Card>
                      <CardContent className="p-4">
                        <div className="text-sm text-muted-foreground">Pending Payout</div>
                        <div className="text-2xl font-bold">{formatPKR(selectedProvider.pendingPayout)}</div>
                      </CardContent>
                    </Card>
                    <Card>
                      <CardContent className="p-4">
                        <div className="text-sm text-muted-foreground">Total Earned</div>
                        <div className="text-2xl font-bold">
                          {formatPKR(
                            getProviderOrders(selectedProvider.id).reduce((sum, o) => sum + o.providerEarning, 0),
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  </div>

                  <RoleGuard allowedRoles={["ADMIN", "FINANCE"]}>
                    <Button
                      onClick={() => {
                        setDetailOpen(false)
                        handleWalletAdjust(selectedProvider)
                      }}
                    >
                      <Wallet className="w-4 h-4 mr-2" />
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
            <DialogTitle>Edit Provider</DialogTitle>
            <DialogDescription>Update provider information</DialogDescription>
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
      {selectedProvider && (
        <WalletAdjustDialog
          open={walletOpen}
          onOpenChange={setWalletOpen}
          ownerType="provider"
          ownerId={selectedProvider.id}
          ownerName={selectedProvider.name}
          currentBalance={selectedProvider.walletBalance}
        />
      )}
    </AdminLayout>
  )
}

export default function ProvidersPage() {
  return (
    <SimulationProvider>
      <ProvidersContent />
    </SimulationProvider>
  )
}
