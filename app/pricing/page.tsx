"use client"

import { useState } from "react"
import { AdminLayout } from "@/components/admin-layout"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Switch } from "@/components/ui/switch"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useStore } from "@/lib/store"
import { Plus, Edit, DollarSign, MapPin, Zap, TrendingUp } from "lucide-react"

export default function PricingPage() {
  const { priceRules, commissionRules, addPriceRule, updatePriceRule, addCommissionRule, addAuditLog } = useStore()
  const [priceDialogOpen, setPriceDialogOpen] = useState(false)
  const [commissionDialogOpen, setCommissionDialogOpen] = useState(false)
  const [editingRule, setEditingRule] = useState<any>(null)

  const [newPriceRule, setNewPriceRule] = useState({
    serviceType: "delivery",
    baseFare: 150,
    perKmRate: 20,
    perMinRate: 2,
    minFare: 100,
    surgePeak: 1.5,
    status: "draft",
  })

  const [newCommission, setNewCommission] = useState({
    serviceType: "delivery",
    value: 15,
    minAmount: 20,
    maxAmount: 200,
    status: "draft",
  })

  const handleSavePriceRule = () => {
    const ruleData = {
      ...newPriceRule,
      id: editingRule?.id || `price_${Date.now()}`,
      city: "all",
      surgeRain: 1.2,
      version: editingRule ? (editingRule.version || 0) + 1 : 1,
      updatedAt: new Date().toISOString(),
    }
    if (editingRule) {
      updatePriceRule(editingRule.id, ruleData as any)
    } else {
      addPriceRule(ruleData as any)
    }
    addAuditLog({
      id: `log_${Date.now()}`,
      actor: "admin@marketplace.pk",
      actorRole: "ADMIN",
      action: editingRule ? "pricing.update" : "pricing.create",
      entity: "priceRule",
      entityId: ruleData.id,
      details: `${editingRule ? "Updated" : "Created"} price rule for ${newPriceRule.serviceType}`,
      timestamp: new Date().toISOString(),
      ip: "192.168.1.100",
    })
    setPriceDialogOpen(false)
    setEditingRule(null)
    setNewPriceRule({
      serviceType: "delivery",
      baseFare: 150,
      perKmRate: 20,
      perMinRate: 2,
      minFare: 100,
      surgePeak: 1.5,
      status: "draft",
    })
  }

  const handleSaveCommission = () => {
    const commissionData = {
      ...newCommission,
      id: `comm_${Date.now()}`,
      type: "percentage",
      tier: "standard",
      version: 1,
      updatedAt: new Date().toISOString(),
    }
    addCommissionRule(commissionData as any)
    addAuditLog({
      id: `log_${Date.now()}`,
      actor: "admin@marketplace.pk",
      actorRole: "ADMIN",
      action: "commission.create",
      entity: "commissionRule",
      entityId: commissionData.id,
      details: `Created commission rule for ${newCommission.serviceType} at ${newCommission.value}%`,
      timestamp: new Date().toISOString(),
      ip: "192.168.1.100",
    })
    setCommissionDialogOpen(false)
    setNewCommission({
      serviceType: "delivery",
      value: 15,
      minAmount: 20,
      maxAmount: 200,
      status: "draft",
    })
  }

  const handleEditPriceRule = (rule: any) => {
    setEditingRule(rule)
    setNewPriceRule({
      serviceType: rule.serviceType || "delivery",
      baseFare: rule.baseFare || 150,
      perKmRate: rule.perKmRate || 20,
      perMinRate: rule.perMinRate || 2,
      minFare: rule.minFare || 100,
      surgePeak: rule.surgePeak || 1.5,
      status: rule.status || "draft",
    })
    setPriceDialogOpen(true)
  }

  const handleToggleStatus = (rule: any) => {
    const newStatus = rule.status === "published" ? "draft" : "published"
    updatePriceRule(rule.id, { status: newStatus })
    addAuditLog({
      id: `log_${Date.now()}`,
      actor: "admin@marketplace.pk",
      actorRole: "ADMIN",
      action: newStatus === "published" ? "pricing.publish" : "pricing.unpublish",
      entity: "priceRule",
      entityId: rule.id,
      details: `${newStatus === "published" ? "Published" : "Unpublished"} price rule ${rule.id}`,
      timestamp: new Date().toISOString(),
      ip: "192.168.1.100",
    })
  }

  return (
    <AdminLayout>
      <div className="flex flex-col gap-6 p-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-semibold text-foreground">Pricing & Commissions</h1>
            <p className="text-sm text-muted-foreground">Configure fare rules, surge pricing, and commission rates</p>
          </div>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-4 gap-4">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Active Price Rules</p>
                  <p className="text-2xl font-semibold">
                    {(priceRules || []).filter((r: any) => r.status === "published").length}
                  </p>
                </div>
                <div className="h-10 w-10 rounded-full bg-emerald-100 flex items-center justify-center">
                  <DollarSign className="h-5 w-5 text-emerald-600" />
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Avg Base Fare</p>
                  <p className="text-2xl font-semibold">
                    PKR{" "}
                    {(priceRules || []).length > 0
                      ? Math.round(
                          (priceRules || []).reduce((sum: number, r: any) => sum + (r.baseFare ?? 0), 0) /
                            priceRules.length,
                        )
                      : 0}
                  </p>
                </div>
                <div className="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center">
                  <MapPin className="h-5 w-5 text-blue-600" />
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Active Surge</p>
                  <p className="text-2xl font-semibold text-amber-600">1.2x</p>
                </div>
                <div className="h-10 w-10 rounded-full bg-amber-100 flex items-center justify-center">
                  <Zap className="h-5 w-5 text-amber-600" />
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Avg Commission</p>
                  <p className="text-2xl font-semibold">
                    {(commissionRules || []).length > 0
                      ? (
                          (commissionRules || []).reduce((sum: number, r: any) => sum + (r.value ?? 0), 0) /
                          commissionRules.length
                        ).toFixed(1)
                      : 0}
                    %
                  </p>
                </div>
                <div className="h-10 w-10 rounded-full bg-purple-100 flex items-center justify-center">
                  <TrendingUp className="h-5 w-5 text-purple-600" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <Tabs defaultValue="pricing">
          <TabsList>
            <TabsTrigger value="pricing">Fare Rules</TabsTrigger>
            <TabsTrigger value="surge">Surge Pricing</TabsTrigger>
            <TabsTrigger value="commission">Commissions</TabsTrigger>
          </TabsList>

          <TabsContent value="pricing" className="mt-6">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>Fare Rules</CardTitle>
                    <CardDescription>Configure base fares and per-unit rates</CardDescription>
                  </div>
                  <Button onClick={() => setPriceDialogOpen(true)}>
                    <Plus className="mr-2 h-4 w-4" />
                    Add Rule
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="p-0">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Service Type</TableHead>
                      <TableHead>City</TableHead>
                      <TableHead>Base Fare</TableHead>
                      <TableHead>Per KM</TableHead>
                      <TableHead>Per Min</TableHead>
                      <TableHead>Min Fare</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="w-[100px]"></TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {(priceRules || []).length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={8} className="text-center py-8 text-muted-foreground">
                          No price rules configured
                        </TableCell>
                      </TableRow>
                    ) : (
                      (priceRules || []).map((rule: any) => (
                        <TableRow key={rule.id}>
                          <TableCell className="capitalize font-medium">{rule.serviceType}</TableCell>
                          <TableCell>{rule.city || "All"}</TableCell>
                          <TableCell>PKR {(rule.baseFare ?? 0).toFixed(0)}</TableCell>
                          <TableCell>PKR {(rule.perKmRate ?? 0).toFixed(0)}</TableCell>
                          <TableCell>PKR {(rule.perMinRate ?? 0).toFixed(0)}</TableCell>
                          <TableCell>PKR {(rule.minFare ?? 0).toFixed(0)}</TableCell>
                          <TableCell>
                            <Badge variant={rule.status === "published" ? "default" : "secondary"}>
                              {rule.status || "draft"}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <Button variant="ghost" size="icon" onClick={() => handleEditPriceRule(rule)}>
                                <Edit className="h-4 w-4" />
                              </Button>
                              <Switch
                                checked={rule.status === "published"}
                                onCheckedChange={() => handleToggleStatus(rule)}
                              />
                            </div>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="surge" className="mt-6">
            <Card>
              <CardHeader>
                <CardTitle>Surge Pricing Rules</CardTitle>
                <CardDescription>Configure dynamic pricing multipliers based on conditions</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid gap-4">
                  {[
                    { name: "Peak Hours", multiplier: 1.5, condition: "7-9 AM, 5-8 PM", active: true },
                    { name: "Rain/Bad Weather", multiplier: 1.3, condition: "Weather API trigger", active: true },
                    { name: "High Demand", multiplier: 1.2, condition: "> 80% provider utilization", active: false },
                    { name: "Late Night", multiplier: 1.4, condition: "11 PM - 5 AM", active: true },
                  ].map((rule) => (
                    <div key={rule.name} className="flex items-center justify-between p-4 border rounded-lg">
                      <div className="flex items-center gap-4">
                        <div className="h-10 w-10 rounded-full bg-amber-100 flex items-center justify-center">
                          <Zap className="h-5 w-5 text-amber-600" />
                        </div>
                        <div>
                          <p className="font-medium">{rule.name}</p>
                          <p className="text-sm text-muted-foreground">{rule.condition}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-4">
                        <Badge variant="outline" className="text-lg font-semibold">
                          {rule.multiplier}x
                        </Badge>
                        <Switch checked={rule.active} />
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="commission" className="mt-6">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>Commission Rules</CardTitle>
                    <CardDescription>Configure platform commission rates by service type</CardDescription>
                  </div>
                  <Button onClick={() => setCommissionDialogOpen(true)}>
                    <Plus className="mr-2 h-4 w-4" />
                    Add Rule
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="p-0">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Service Type</TableHead>
                      <TableHead>Commission</TableHead>
                      <TableHead>Min Amount</TableHead>
                      <TableHead>Max Amount</TableHead>
                      <TableHead>Tier</TableHead>
                      <TableHead>Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {(commissionRules || []).length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                          No commission rules configured
                        </TableCell>
                      </TableRow>
                    ) : (
                      (commissionRules || []).map((rule: any) => (
                        <TableRow key={rule.id}>
                          <TableCell className="capitalize font-medium">{rule.serviceType}</TableCell>
                          <TableCell className="font-semibold">{(rule.value ?? 0).toFixed(1)}%</TableCell>
                          <TableCell>PKR {(rule.minAmount ?? 0).toFixed(0)}</TableCell>
                          <TableCell>PKR {(rule.maxAmount ?? 0).toFixed(0)}</TableCell>
                          <TableCell className="capitalize">{rule.tier || "standard"}</TableCell>
                          <TableCell>
                            <Badge variant={rule.status === "published" ? "default" : "secondary"}>
                              {rule.status || "draft"}
                            </Badge>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Price Rule Dialog */}
        <Dialog open={priceDialogOpen} onOpenChange={setPriceDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{editingRule ? "Edit" : "Add"} Fare Rule</DialogTitle>
              <DialogDescription>Configure fare calculation parameters</DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label>Service Type</Label>
                <Select
                  value={newPriceRule.serviceType}
                  onValueChange={(v) => setNewPriceRule({ ...newPriceRule, serviceType: v })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="delivery">Delivery</SelectItem>
                    <SelectItem value="courier">Courier</SelectItem>
                    <SelectItem value="moving">Moving</SelectItem>
                    <SelectItem value="heavy">Heavy</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label>Base Fare (PKR)</Label>
                  <Input
                    type="number"
                    value={newPriceRule.baseFare}
                    onChange={(e) => setNewPriceRule({ ...newPriceRule, baseFare: Number(e.target.value) })}
                  />
                </div>
                <div className="grid gap-2">
                  <Label>Min Fare (PKR)</Label>
                  <Input
                    type="number"
                    value={newPriceRule.minFare}
                    onChange={(e) => setNewPriceRule({ ...newPriceRule, minFare: Number(e.target.value) })}
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label>Per KM Rate (PKR)</Label>
                  <Input
                    type="number"
                    value={newPriceRule.perKmRate}
                    onChange={(e) => setNewPriceRule({ ...newPriceRule, perKmRate: Number(e.target.value) })}
                  />
                </div>
                <div className="grid gap-2">
                  <Label>Per Min Rate (PKR)</Label>
                  <Input
                    type="number"
                    value={newPriceRule.perMinRate}
                    onChange={(e) => setNewPriceRule({ ...newPriceRule, perMinRate: Number(e.target.value) })}
                  />
                </div>
              </div>
              <div className="grid gap-2">
                <Label>Peak Surge Multiplier</Label>
                <Input
                  type="number"
                  step="0.1"
                  value={newPriceRule.surgePeak}
                  onChange={(e) => setNewPriceRule({ ...newPriceRule, surgePeak: Number(e.target.value) })}
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setPriceDialogOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleSavePriceRule}>Save Rule</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Commission Dialog */}
        <Dialog open={commissionDialogOpen} onOpenChange={setCommissionDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add Commission Rule</DialogTitle>
              <DialogDescription>Configure commission parameters</DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label>Service Type</Label>
                <Select
                  value={newCommission.serviceType}
                  onValueChange={(v) => setNewCommission({ ...newCommission, serviceType: v })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="delivery">Delivery</SelectItem>
                    <SelectItem value="courier">Courier</SelectItem>
                    <SelectItem value="moving">Moving</SelectItem>
                    <SelectItem value="heavy">Heavy</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="grid gap-2">
                <Label>Commission Rate (%)</Label>
                <Input
                  type="number"
                  value={newCommission.value}
                  onChange={(e) => setNewCommission({ ...newCommission, value: Number(e.target.value) })}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label>Min Amount (PKR)</Label>
                  <Input
                    type="number"
                    value={newCommission.minAmount}
                    onChange={(e) => setNewCommission({ ...newCommission, minAmount: Number(e.target.value) })}
                  />
                </div>
                <div className="grid gap-2">
                  <Label>Max Amount (PKR)</Label>
                  <Input
                    type="number"
                    value={newCommission.maxAmount}
                    onChange={(e) => setNewCommission({ ...newCommission, maxAmount: Number(e.target.value) })}
                  />
                </div>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setCommissionDialogOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleSaveCommission}>Save Rule</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </AdminLayout>
  )
}
