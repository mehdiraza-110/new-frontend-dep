"use client"

import { useState } from "react"
import { AdminLayout } from "@/components/admin-layout"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { useStore } from "@/lib/store"
import { Search, Download, CreditCard, Wallet, DollarSign, Clock, Eye } from "lucide-react"

const statusColors: Record<string, string> = {
  completed: "bg-emerald-100 text-emerald-800",
  pending: "bg-amber-100 text-amber-800",
  failed: "bg-red-100 text-red-800",
}

export default function PaymentsPage() {
  const { wallets, customers, providers, updateWallet, addAuditLog } = useStore()
  const [search, setSearch] = useState("")
  const [adjustDialogOpen, setAdjustDialogOpen] = useState(false)
  const [selectedWallet, setSelectedWallet] = useState<(typeof wallets)[0] | null>(null)
  const [adjustAmount, setAdjustAmount] = useState("")
  const [adjustReason, setAdjustReason] = useState("")
  const [adjustType, setAdjustType] = useState<"credit" | "debit">("credit")

  const totalBalance = wallets.reduce((sum, w) => sum + (w.balance ?? 0), 0)
  const totalPending = wallets.reduce((sum, w) => sum + (w.pendingPayout ?? 0), 0)
  const providerWallets = wallets.filter((w) => w.ownerType === "provider")
  const customerWallets = wallets.filter((w) => w.ownerType === "customer")

  const handleWalletAdjust = () => {
    if (!selectedWallet || !adjustAmount) return

    const amount = Number(adjustAmount)
    const newBalance =
      adjustType === "credit" ? (selectedWallet.balance ?? 0) + amount : (selectedWallet.balance ?? 0) - amount

    updateWallet(selectedWallet.id, {
      balance: newBalance,
      lastUpdated: new Date().toISOString(),
    })

    addAuditLog({
      id: `log_${Date.now()}`,
      actor: "admin@marketplace.pk",
      actorRole: "ADMIN",
      action: "wallet.adjust",
      entity: "wallet",
      entityId: selectedWallet.id,
      details: `${adjustType === "credit" ? "Credited" : "Debited"} PKR ${amount} - ${adjustReason || "Manual adjustment"}`,
      timestamp: new Date().toISOString(),
      ip: "192.168.1.100",
    })

    setAdjustDialogOpen(false)
    setAdjustAmount("")
    setAdjustReason("")
    setSelectedWallet(null)
  }

  return (
    <AdminLayout>
      <div className="flex flex-col gap-6 p-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-semibold text-foreground">Payments</h1>
            <p className="text-sm text-muted-foreground">Manage wallets and payouts</p>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm">
              <Download className="mr-2 h-4 w-4" />
              Export
            </Button>
          </div>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-4 gap-4">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Total Balance</p>
                  <p className="text-2xl font-semibold">PKR {totalBalance.toLocaleString()}</p>
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
                  <p className="text-sm text-muted-foreground">Pending Payouts</p>
                  <p className="text-2xl font-semibold text-amber-600">PKR {totalPending.toLocaleString()}</p>
                </div>
                <div className="h-10 w-10 rounded-full bg-amber-100 flex items-center justify-center">
                  <Clock className="h-5 w-5 text-amber-600" />
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Provider Wallets</p>
                  <p className="text-2xl font-semibold">{providerWallets.length}</p>
                </div>
                <div className="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center">
                  <Wallet className="h-5 w-5 text-blue-600" />
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Customer Wallets</p>
                  <p className="text-2xl font-semibold">{customerWallets.length}</p>
                </div>
                <div className="h-10 w-10 rounded-full bg-purple-100 flex items-center justify-center">
                  <CreditCard className="h-5 w-5 text-purple-600" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <Tabs defaultValue="wallets">
          <TabsList>
            <TabsTrigger value="wallets">Wallets</TabsTrigger>
            <TabsTrigger value="payouts">Provider Payouts</TabsTrigger>
          </TabsList>

          <TabsContent value="wallets" className="mt-6">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>Wallet Management</CardTitle>
                    <CardDescription>View and adjust customer and provider wallet balances</CardDescription>
                  </div>
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                    <Input
                      placeholder="Search wallets..."
                      value={search}
                      onChange={(e) => setSearch(e.target.value)}
                      className="pl-10 w-[250px]"
                    />
                  </div>
                </div>
              </CardHeader>
              <CardContent className="p-0">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Owner</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead>Balance</TableHead>
                      <TableHead>Holds</TableHead>
                      <TableHead>Pending Payout</TableHead>
                      <TableHead>Last Updated</TableHead>
                      <TableHead className="w-[100px]"></TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {wallets
                      .filter((wallet) => {
                        if (!search) return true
                        const owner =
                          wallet.ownerType === "customer"
                            ? customers.find((c) => c.id === wallet.ownerId)
                            : providers.find((p) => p.id === wallet.ownerId)
                        return owner?.name?.toLowerCase().includes(search.toLowerCase())
                      })
                      .map((wallet) => {
                        const owner =
                          wallet.ownerType === "customer"
                            ? customers.find((c) => c.id === wallet.ownerId)
                            : providers.find((p) => p.id === wallet.ownerId)
                        return (
                          <TableRow key={wallet.id}>
                            <TableCell>
                              <div className="flex items-center gap-2">
                                <Wallet className="h-4 w-4 text-muted-foreground" />
                                <span className="font-medium">{owner?.name || "Unknown"}</span>
                              </div>
                            </TableCell>
                            <TableCell>
                              <Badge variant="outline" className="capitalize">
                                {wallet.ownerType}
                              </Badge>
                            </TableCell>
                            <TableCell className="font-semibold">
                              PKR {(wallet.balance ?? 0).toLocaleString()}
                            </TableCell>
                            <TableCell className="text-muted-foreground">
                              PKR {(wallet.holds ?? 0).toLocaleString()}
                            </TableCell>
                            <TableCell className="text-muted-foreground">
                              PKR {(wallet.pendingPayout ?? 0).toLocaleString()}
                            </TableCell>
                            <TableCell className="text-muted-foreground">
                              {wallet.lastUpdated ? new Date(wallet.lastUpdated).toLocaleDateString() : "N/A"}
                            </TableCell>
                            <TableCell>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => {
                                  setSelectedWallet(wallet)
                                  setAdjustDialogOpen(true)
                                }}
                              >
                                Adjust
                              </Button>
                            </TableCell>
                          </TableRow>
                        )
                      })}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="payouts" className="mt-6">
            <Card>
              <CardHeader>
                <CardTitle>Provider Payouts</CardTitle>
                <CardDescription>Manage scheduled and pending provider payouts</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid gap-4">
                  {providers.slice(0, 8).map((provider) => {
                    const wallet = wallets.find((w) => w.ownerId === provider.id && w.ownerType === "provider")
                    return (
                      <div key={provider.id} className="flex items-center justify-between p-4 border rounded-lg">
                        <div className="flex items-center gap-4">
                          <div className="h-10 w-10 rounded-full bg-muted flex items-center justify-center">
                            <CreditCard className="h-5 w-5" />
                          </div>
                          <div>
                            <p className="font-medium">{provider.name}</p>
                            <p className="text-sm text-muted-foreground">
                              Balance: PKR {(wallet?.balance ?? 0).toLocaleString()} | Pending: PKR{" "}
                              {(wallet?.pendingPayout ?? 0).toLocaleString()}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge variant="outline">Weekly Payout</Badge>
                          <Button variant="outline" size="sm">
                            <Eye className="mr-2 h-4 w-4" />
                            View
                          </Button>
                          <Button size="sm">Process Payout</Button>
                        </div>
                      </div>
                    )
                  })}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Wallet Adjustment Dialog */}
        <Dialog open={adjustDialogOpen} onOpenChange={setAdjustDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Adjust Wallet Balance</DialogTitle>
              <DialogDescription>Add or remove funds from this wallet. This action will be logged.</DialogDescription>
            </DialogHeader>
            {selectedWallet && (
              <div className="grid gap-4 py-4">
                <div className="flex items-center justify-between p-3 bg-muted rounded-lg">
                  <span className="text-sm text-muted-foreground">Current Balance</span>
                  <span className="font-semibold">PKR {(selectedWallet.balance ?? 0).toLocaleString()}</span>
                </div>
                <div className="grid gap-2">
                  <Label>Adjustment Type</Label>
                  <Select value={adjustType} onValueChange={(v) => setAdjustType(v as "credit" | "debit")}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="credit">Credit (Add Funds)</SelectItem>
                      <SelectItem value="debit">Debit (Remove Funds)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid gap-2">
                  <Label>Amount (PKR)</Label>
                  <Input
                    type="number"
                    placeholder="0"
                    value={adjustAmount}
                    onChange={(e) => setAdjustAmount(e.target.value)}
                  />
                </div>
                <div className="grid gap-2">
                  <Label>Reason</Label>
                  <Textarea
                    placeholder="Enter reason for adjustment..."
                    value={adjustReason}
                    onChange={(e) => setAdjustReason(e.target.value)}
                  />
                </div>
                {adjustAmount && (
                  <div className="flex items-center justify-between p-3 bg-muted rounded-lg">
                    <span className="text-sm text-muted-foreground">New Balance</span>
                    <span className="font-semibold">
                      PKR{" "}
                      {(adjustType === "credit"
                        ? (selectedWallet.balance ?? 0) + Number(adjustAmount)
                        : (selectedWallet.balance ?? 0) - Number(adjustAmount)
                      ).toLocaleString()}
                    </span>
                  </div>
                )}
              </div>
            )}
            <DialogFooter>
              <Button variant="outline" onClick={() => setAdjustDialogOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleWalletAdjust} disabled={!adjustAmount}>
                Confirm Adjustment
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </AdminLayout>
  )
}
