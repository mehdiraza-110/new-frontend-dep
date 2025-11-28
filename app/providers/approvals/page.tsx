"use client"

import { useState, useMemo } from "react"
import { Check, X, Eye, Shield, FileText, Clock } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Checkbox } from "@/components/ui/checkbox"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@/components/ui/sheet"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { AdminLayout, PageHeader } from "@/components/admin-layout"
import { SimulationProvider } from "@/components/simulation-provider"
import { RoleGuard, useRolePermissions } from "@/components/role-guard"
import { useStore } from "@/lib/store"
import { formatDate, formatRelativeTime } from "@/lib/utils/format"
import { toast } from "sonner"
import type { Provider } from "@/lib/types"

function ApprovalsContent() {
  const { providers, updateProvider, addAuditLog, auditLogs } = useStore()
  const { canApproveProviders } = useRolePermissions()

  const [selectedIds, setSelectedIds] = useState<string[]>([])
  const [selectedProvider, setSelectedProvider] = useState<Provider | null>(null)
  const [detailOpen, setDetailOpen] = useState(false)
  const [rejectOpen, setRejectOpen] = useState(false)
  const [rejectReason, setRejectReason] = useState("")

  // Filter pending providers
  const pendingProviders = useMemo(() => {
    return providers.filter(
      (p) => p.status === "pending" || p.kycStatus === "pending" || p.kycStatus === "documents_submitted",
    )
  }, [providers])

  // Get audit trail for a provider
  const getProviderAuditTrail = (providerId: string) => {
    return auditLogs.filter((log) => log.entityId === providerId)
  }

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedIds(pendingProviders.map((p) => p.id))
    } else {
      setSelectedIds([])
    }
  }

  const handleSelect = (id: string, checked: boolean) => {
    if (checked) {
      setSelectedIds([...selectedIds, id])
    } else {
      setSelectedIds(selectedIds.filter((i) => i !== id))
    }
  }

  const handleApprove = (provider: Provider) => {
    updateProvider(provider.id, { status: "offline", kycStatus: "verified" })
    addAuditLog({
      id: `log_${Date.now()}`,
      actor: "admin@marketplace.pk",
      actorRole: "ADMIN",
      action: "provider.approve",
      entity: "provider",
      entityId: provider.id,
      details: `Approved provider ${provider.name}`,
      timestamp: new Date().toISOString(),
      ip: "192.168.1.100",
    })
    toast.success(`${provider.name} has been approved`)
  }

  const handleReject = () => {
    if (!selectedProvider || !rejectReason.trim()) return

    updateProvider(selectedProvider.id, { kycStatus: "rejected" as any })
    addAuditLog({
      id: `log_${Date.now()}`,
      actor: "admin@marketplace.pk",
      actorRole: "ADMIN",
      action: "provider.reject",
      entity: "provider",
      entityId: selectedProvider.id,
      details: `Rejected provider ${selectedProvider.name}: ${rejectReason}`,
      timestamp: new Date().toISOString(),
      ip: "192.168.1.100",
    })
    toast.success(`${selectedProvider.name} has been rejected`)
    setRejectOpen(false)
    setRejectReason("")
    setSelectedProvider(null)
  }

  const handleBulkApprove = () => {
    selectedIds.forEach((id) => {
      const provider = providers.find((p) => p.id === id)
      if (provider) {
        updateProvider(id, { status: "offline", kycStatus: "verified" })
        addAuditLog({
          id: `log_${Date.now()}_${id}`,
          actor: "admin@marketplace.pk",
          actorRole: "ADMIN",
          action: "provider.approve",
          entity: "provider",
          entityId: id,
          details: `Bulk approved provider ${provider.name}`,
          timestamp: new Date().toISOString(),
          ip: "192.168.1.100",
        })
      }
    })
    toast.success(`${selectedIds.length} providers approved`)
    setSelectedIds([])
  }

  const handleBulkReject = () => {
    // For bulk reject, open a dialog to get reason
    setRejectOpen(true)
  }

  const handleBulkRejectConfirm = () => {
    if (!rejectReason.trim()) return

    selectedIds.forEach((id) => {
      const provider = providers.find((p) => p.id === id)
      if (provider) {
        updateProvider(id, { kycStatus: "rejected" as any })
        addAuditLog({
          id: `log_${Date.now()}_${id}`,
          actor: "admin@marketplace.pk",
          actorRole: "ADMIN",
          action: "provider.reject",
          entity: "provider",
          entityId: id,
          details: `Bulk rejected provider ${provider.name}: ${rejectReason}`,
          timestamp: new Date().toISOString(),
          ip: "192.168.1.100",
        })
      }
    })
    toast.success(`${selectedIds.length} providers rejected`)
    setSelectedIds([])
    setRejectOpen(false)
    setRejectReason("")
  }

  const handleViewDetail = (provider: Provider) => {
    setSelectedProvider(provider)
    setDetailOpen(true)
  }

  return (
    <AdminLayout>
      <PageHeader
        title="Provider Approvals"
        description="Review and approve pending provider applications"
        actions={
          selectedIds.length > 0 &&
          canApproveProviders && (
            <div className="flex items-center gap-2">
              <span className="text-sm text-muted-foreground">{selectedIds.length} selected</span>
              <Button variant="outline" onClick={handleBulkReject}>
                <X className="w-4 h-4 mr-2" />
                Reject
              </Button>
              <Button onClick={handleBulkApprove}>
                <Check className="w-4 h-4 mr-2" />
                Approve
              </Button>
            </div>
          )
        }
      />

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-semibold">{pendingProviders.length}</div>
            <div className="text-sm text-muted-foreground">Pending Applications</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-semibold">
              {pendingProviders.filter((p) => p.kycStatus === "documents_submitted").length}
            </div>
            <div className="text-sm text-muted-foreground">Documents Submitted</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-semibold">
              {pendingProviders.filter((p) => p.kycStatus === "pending").length}
            </div>
            <div className="text-sm text-muted-foreground">Awaiting Documents</div>
          </CardContent>
        </Card>
      </div>

      {/* Approvals Table */}
      <Card>
        <CardContent className="p-0">
          {pendingProviders.length === 0 ? (
            <div className="text-center py-12">
              <Shield className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-medium mb-1">No Pending Applications</h3>
              <p className="text-muted-foreground">All provider applications have been reviewed</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-12">
                    <Checkbox
                      checked={selectedIds.length === pendingProviders.length}
                      onCheckedChange={handleSelectAll}
                    />
                  </TableHead>
                  <TableHead>Applicant</TableHead>
                  <TableHead>Documents</TableHead>
                  <TableHead>Applied Date</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="w-32"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {pendingProviders.map((provider) => (
                  <TableRow key={provider.id}>
                    <TableCell>
                      <Checkbox
                        checked={selectedIds.includes(provider.id)}
                        onCheckedChange={(checked) => handleSelect(provider.id, checked as boolean)}
                      />
                    </TableCell>
                    <TableCell>
                      <div>
                        <p className="font-medium">{provider.name}</p>
                        <p className="text-sm text-muted-foreground">{provider.phone}</p>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <FileText className="w-4 h-4 text-muted-foreground" />
                        <span className="capitalize">{provider.kycStatus.replace("_", " ")}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2 text-muted-foreground">
                        <Clock className="w-4 h-4" />
                        {formatDate(provider.createdAt)}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant={provider.kycStatus === "documents_submitted" ? "default" : "secondary"}>
                        {provider.kycStatus === "documents_submitted" ? "Ready for Review" : "Pending Documents"}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Button variant="ghost" size="icon" onClick={() => handleViewDetail(provider)}>
                          <Eye className="w-4 h-4" />
                        </Button>
                        <RoleGuard allowedRoles={["ADMIN", "OPERATOR"]}>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="text-green-600 hover:text-green-700 hover:bg-green-50"
                            onClick={() => handleApprove(provider)}
                          >
                            <Check className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="text-red-600 hover:text-red-700 hover:bg-red-50"
                            onClick={() => {
                              setSelectedProvider(provider)
                              setRejectOpen(true)
                            }}
                          >
                            <X className="w-4 h-4" />
                          </Button>
                        </RoleGuard>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Detail Sheet */}
      <Sheet open={detailOpen} onOpenChange={setDetailOpen}>
        <SheetContent className="w-[500px] sm:max-w-[500px]">
          <SheetHeader>
            <SheetTitle>Application Details</SheetTitle>
            <SheetDescription>Review provider application and documents</SheetDescription>
          </SheetHeader>

          {selectedProvider && (
            <div className="mt-6 space-y-6">
              {/* Applicant Info */}
              <div>
                <h4 className="font-medium mb-3">Applicant Information</h4>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Name</span>
                    <span>{selectedProvider.name}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Phone</span>
                    <span>{selectedProvider.phone}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Email</span>
                    <span>{selectedProvider.email}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">City</span>
                    <span>{selectedProvider.city}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Vehicle</span>
                    <span>
                      {selectedProvider.vehicleType} ({selectedProvider.vehiclePlate})
                    </span>
                  </div>
                </div>
              </div>

              {/* Documents */}
              <div>
                <h4 className="font-medium mb-3">Documents</h4>
                <div className="space-y-2">
                  {["CNIC Front", "CNIC Back", "Driving License", "Vehicle Registration"].map((doc) => (
                    <div key={doc} className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                      <div className="flex items-center gap-2">
                        <FileText className="w-4 h-4 text-muted-foreground" />
                        <span>{doc}</span>
                      </div>
                      <Badge variant={selectedProvider.kycStatus === "documents_submitted" ? "default" : "secondary"}>
                        {selectedProvider.kycStatus === "documents_submitted" ? "Submitted" : "Pending"}
                      </Badge>
                    </div>
                  ))}
                </div>
              </div>

              {/* Audit Trail */}
              <div>
                <h4 className="font-medium mb-3">Activity Log</h4>
                <div className="space-y-2 max-h-40 overflow-y-auto">
                  {getProviderAuditTrail(selectedProvider.id).length === 0 ? (
                    <p className="text-sm text-muted-foreground">No activity yet</p>
                  ) : (
                    getProviderAuditTrail(selectedProvider.id).map((log) => (
                      <div key={log.id} className="text-sm p-2 bg-muted/30 rounded">
                        <p>{log.details}</p>
                        <p className="text-xs text-muted-foreground">
                          {formatRelativeTime(log.timestamp)} by {log.actor}
                        </p>
                      </div>
                    ))
                  )}
                </div>
              </div>

              {/* Actions */}
              <RoleGuard allowedRoles={["ADMIN", "OPERATOR"]}>
                <div className="flex gap-2 pt-4 border-t">
                  <Button
                    variant="outline"
                    className="flex-1 bg-transparent"
                    onClick={() => {
                      setDetailOpen(false)
                      setRejectOpen(true)
                    }}
                  >
                    <X className="w-4 h-4 mr-2" />
                    Reject
                  </Button>
                  <Button
                    className="flex-1"
                    onClick={() => {
                      handleApprove(selectedProvider)
                      setDetailOpen(false)
                    }}
                  >
                    <Check className="w-4 h-4 mr-2" />
                    Approve
                  </Button>
                </div>
              </RoleGuard>
            </div>
          )}
        </SheetContent>
      </Sheet>

      {/* Reject Dialog */}
      <Dialog open={rejectOpen} onOpenChange={setRejectOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Reject Application</DialogTitle>
            <DialogDescription>
              {selectedIds.length > 1
                ? `Provide a reason for rejecting ${selectedIds.length} applications`
                : `Provide a reason for rejecting ${selectedProvider?.name}'s application`}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="reject-reason">Reason</Label>
              <Textarea
                id="reject-reason"
                placeholder="Enter reason for rejection..."
                value={rejectReason}
                onChange={(e) => setRejectReason(e.target.value)}
              />
            </div>

            <div className="flex gap-2 justify-end">
              <Button
                variant="outline"
                onClick={() => {
                  setRejectOpen(false)
                  setRejectReason("")
                }}
              >
                Cancel
              </Button>
              <Button variant="destructive" onClick={selectedIds.length > 1 ? handleBulkRejectConfirm : handleReject}>
                Reject
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </AdminLayout>
  )
}

export default function ApprovalsPage() {
  return (
    <SimulationProvider>
      <ApprovalsContent />
    </SimulationProvider>
  )
}
