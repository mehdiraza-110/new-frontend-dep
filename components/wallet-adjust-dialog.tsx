"use client"

import { useState } from "react"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { useStore } from "@/lib/store"
import { formatPKR } from "@/lib/utils/format"
import { toast } from "sonner"
import { ArrowDownLeft, ArrowUpRight, Loader2 } from "lucide-react"

interface WalletAdjustDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  ownerType: "customer" | "provider"
  ownerId: string
  ownerName: string
  currentBalance: number
}

export function WalletAdjustDialog({
  open,
  onOpenChange,
  ownerType,
  ownerId,
  ownerName,
  currentBalance,
}: WalletAdjustDialogProps) {
  const { updateCustomer, updateProvider, addWalletAdjustment, addAuditLog, wallets, updateWallet } = useStore()

  const [type, setType] = useState<"credit" | "debit">("credit")
  const [amount, setAmount] = useState("")
  const [reason, setReason] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleSubmit = async () => {
    const amountNum = Number.parseFloat(amount)
    if (isNaN(amountNum) || amountNum <= 0) {
      toast.error("Please enter a valid amount")
      return
    }

    if (!reason.trim()) {
      toast.error("Please enter a reason")
      return
    }

    if (type === "debit" && amountNum > currentBalance) {
      toast.error("Insufficient balance for debit")
      return
    }

    setIsSubmitting(true)

    // Simulate API delay
    await new Promise((resolve) => setTimeout(resolve, 500))

    const newBalance = type === "credit" ? currentBalance + amountNum : currentBalance - amountNum

    // Update balance
    if (ownerType === "customer") {
      updateCustomer(ownerId, { walletBalance: newBalance })
    } else {
      updateProvider(ownerId, { walletBalance: newBalance })
    }

    // Find and update wallet if exists
    const wallet = wallets.find((w) => w.ownerId === ownerId && w.ownerType === ownerType)
    if (wallet) {
      updateWallet(wallet.id, { balance: newBalance, lastUpdated: new Date().toISOString() })
    }

    // Add adjustment record
    addWalletAdjustment({
      id: `adj_${Date.now()}`,
      walletId: wallet?.id || `wallet_${ownerId}`,
      type,
      amount: amountNum,
      reason,
      createdBy: "finance@marketplace.pk",
      createdAt: new Date().toISOString(),
    })

    // Add audit log
    addAuditLog({
      id: `log_${Date.now()}`,
      actor: "finance@marketplace.pk",
      actorRole: "FINANCE",
      action: "wallet.adjust",
      entity: "wallet",
      entityId: ownerId,
      details: `${type === "credit" ? "Credit" : "Debit"} PKR ${amountNum} - ${reason}`,
      timestamp: new Date().toISOString(),
      ip: "192.168.1.102",
    })

    setIsSubmitting(false)
    toast.success(`Wallet ${type === "credit" ? "credited" : "debited"} successfully`)

    // Reset form
    setAmount("")
    setReason("")
    setType("credit")
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Wallet Adjustment</DialogTitle>
          <DialogDescription>Adjust wallet balance for {ownerName}</DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="p-4 bg-muted/50 rounded-lg">
            <div className="text-sm text-muted-foreground">Current Balance</div>
            <div className="text-2xl font-bold">{formatPKR(currentBalance)}</div>
          </div>

          <div className="space-y-2">
            <Label>Transaction Type</Label>
            <div className="grid grid-cols-2 gap-2">
              <Button
                type="button"
                variant={type === "credit" ? "default" : "outline"}
                onClick={() => setType("credit")}
                className="gap-2"
              >
                <ArrowDownLeft className="w-4 h-4" />
                Credit
              </Button>
              <Button
                type="button"
                variant={type === "debit" ? "default" : "outline"}
                onClick={() => setType("debit")}
                className="gap-2"
              >
                <ArrowUpRight className="w-4 h-4" />
                Debit
              </Button>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="amount">Amount (PKR)</Label>
            <Input
              id="amount"
              type="number"
              placeholder="Enter amount"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="reason">Reason</Label>
            <Textarea
              id="reason"
              placeholder="Enter reason for adjustment..."
              value={reason}
              onChange={(e) => setReason(e.target.value)}
            />
          </div>

          {amount && !isNaN(Number.parseFloat(amount)) && (
            <div className="p-3 bg-primary/5 rounded-lg">
              <div className="text-sm text-muted-foreground">New Balance</div>
              <div className="text-xl font-bold text-primary">
                {formatPKR(
                  type === "credit"
                    ? currentBalance + Number.parseFloat(amount)
                    : currentBalance - Number.parseFloat(amount),
                )}
              </div>
            </div>
          )}

          <div className="flex gap-2 justify-end">
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button onClick={handleSubmit} disabled={isSubmitting}>
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Processing...
                </>
              ) : (
                `${type === "credit" ? "Credit" : "Debit"} Wallet`
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
