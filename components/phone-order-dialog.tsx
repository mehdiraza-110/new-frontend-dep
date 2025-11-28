"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { useStore } from "@/lib/store"
import { formatPKR } from "@/lib/utils/format"
import { calculateFare } from "@/lib/utils/pricing"
import { toast } from "sonner"
import { Check, ChevronLeft, ChevronRight, Loader2, MapPin, Phone, Search, User } from "lucide-react"
import type { Customer, ServiceType } from "@/lib/types"

const customerSchema = z.object({
  phone: z.string().min(10, "Phone number is required"),
  name: z.string().min(2, "Name is required"),
  email: z.string().email().optional().or(z.literal("")),
})

const orderSchema = z.object({
  serviceType: z.enum(["delivery", "courier", "moving", "heavy"]),
  pickupAddress: z.string().min(5, "Pickup address is required"),
  dropAddress: z.string().min(5, "Drop address is required"),
  distance: z.number().min(0.1, "Distance must be greater than 0"),
  duration: z.number().min(1, "Duration must be at least 1 minute"),
  notes: z.string().optional(),
})

interface PhoneOrderDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function PhoneOrderDialog({ open, onOpenChange }: PhoneOrderDialogProps) {
  const router = useRouter()
  const [step, setStep] = useState(1)
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null)
  const [isNewCustomer, setIsNewCustomer] = useState(false)
  const [searchQuery, setSearchQuery] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)

  const { customers, addCustomer, addOrder, addAuditLog, priceRules, commissionRules } = useStore()

  const customerForm = useForm({
    resolver: zodResolver(customerSchema),
    defaultValues: { phone: "", name: "", email: "" },
  })

  const orderForm = useForm({
    resolver: zodResolver(orderSchema),
    defaultValues: {
      serviceType: "delivery" as ServiceType,
      pickupAddress: "",
      dropAddress: "",
      distance: 5,
      duration: 15,
      notes: "",
    },
  })

  // Filter customers by search
  const filteredCustomers = customers.filter(
    (c) =>
      c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.phone.includes(searchQuery) ||
      c.email.toLowerCase().includes(searchQuery.toLowerCase()),
  )

  // Calculate fare preview
  const serviceType = orderForm.watch("serviceType")
  const distance = orderForm.watch("distance")
  const duration = orderForm.watch("duration")
  const farePreview = calculateFare(
    serviceType as ServiceType,
    distance,
    duration,
    "Karachi",
    priceRules,
    commissionRules,
  )

  const handleCustomerSelect = (customer: Customer) => {
    setSelectedCustomer(customer)
    setIsNewCustomer(false)
    setStep(2)
  }

  const handleNewCustomer = () => {
    setIsNewCustomer(true)
    setSelectedCustomer(null)
  }

  const handleCustomerSubmit = (data: z.infer<typeof customerSchema>) => {
    if (isNewCustomer) {
      const newCustomer: Customer = {
        id: `cust_${Date.now()}`,
        name: data.name,
        phone: data.phone,
        email: data.email || "",
        totalOrders: 0,
        lastActive: new Date().toISOString(),
        status: "active",
        walletBalance: 0,
        city: "Karachi",
        createdAt: new Date().toISOString(),
      }
      addCustomer(newCustomer)
      setSelectedCustomer(newCustomer)

      addAuditLog({
        id: `log_${Date.now()}`,
        actor: "operator@marketplace.pk",
        actorRole: "OPERATOR",
        action: "customer.create",
        entity: "customer",
        entityId: newCustomer.id,
        details: `Created new customer: ${newCustomer.name}`,
        timestamp: new Date().toISOString(),
        ip: "192.168.1.101",
      })
    }
    setStep(2)
  }

  const handleOrderSubmit = async (data: z.infer<typeof orderSchema>) => {
    if (!selectedCustomer) return

    setIsSubmitting(true)

    // Simulate API delay
    await new Promise((resolve) => setTimeout(resolve, 1000))

    const fare = calculateFare(
      data.serviceType as ServiceType,
      data.distance,
      data.duration,
      "Karachi",
      priceRules,
      commissionRules,
    )

    const newOrder = {
      id: `ord_${Date.now()}`,
      customerId: selectedCustomer.id,
      providerId: null,
      status: "CREATED" as const,
      serviceType: data.serviceType as ServiceType,
      pickup: {
        address: data.pickupAddress,
        lat: 24.86 + Math.random() * 0.05,
        lng: 67.0 + Math.random() * 0.05,
      },
      drop: {
        address: data.dropAddress,
        lat: 24.86 + Math.random() * 0.05,
        lng: 67.0 + Math.random() * 0.05,
      },
      distance: data.distance,
      duration: data.duration,
      baseFare: fare.baseFare,
      distanceFare: fare.distanceFare,
      timeFare: fare.timeFare,
      platformFee: fare.platformFee,
      totalFare: fare.totalFare,
      commission: fare.commission,
      providerEarning: fare.providerEarning,
      paymentMethod: "cash" as const,
      paymentStatus: "pending" as const,
      createdAt: new Date().toISOString(),
      assignedAt: null,
      completedAt: null,
      city: "Karachi",
      notes: data.notes || "",
    }

    addOrder(newOrder)

    addAuditLog({
      id: `log_${Date.now()}`,
      actor: "operator@marketplace.pk",
      actorRole: "OPERATOR",
      action: "order.create",
      entity: "order",
      entityId: newOrder.id,
      details: `Phone order created for ${selectedCustomer.name}`,
      timestamp: new Date().toISOString(),
      ip: "192.168.1.101",
    })

    setIsSubmitting(false)
    setStep(3)

    toast.success("Order Created", {
      description: `Order ${newOrder.id} has been created successfully.`,
    })
  }

  const handleClose = () => {
    setStep(1)
    setSelectedCustomer(null)
    setIsNewCustomer(false)
    setSearchQuery("")
    customerForm.reset()
    orderForm.reset()
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Create Phone Order</DialogTitle>
          <DialogDescription>
            Step {step} of 3: {step === 1 ? "Customer" : step === 2 ? "Order Details" : "Confirmation"}
          </DialogDescription>
        </DialogHeader>

        {/* Progress Steps */}
        <div className="flex items-center justify-center gap-2 mb-4">
          {[1, 2, 3].map((s) => (
            <div key={s} className="flex items-center">
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                  s < step
                    ? "bg-primary text-primary-foreground"
                    : s === step
                      ? "bg-primary text-primary-foreground"
                      : "bg-muted text-muted-foreground"
                }`}
              >
                {s < step ? <Check className="w-4 h-4" /> : s}
              </div>
              {s < 3 && <div className={`w-12 h-0.5 ${s < step ? "bg-primary" : "bg-muted"}`} />}
            </div>
          ))}
        </div>

        {/* Step 1: Customer Selection */}
        {step === 1 && (
          <div className="space-y-4">
            {!isNewCustomer ? (
              <>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    placeholder="Search by name, phone, or email..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10"
                  />
                </div>

                <div className="max-h-64 overflow-y-auto space-y-2">
                  {filteredCustomers.length === 0 ? (
                    <p className="text-center text-muted-foreground py-4">No customers found</p>
                  ) : (
                    filteredCustomers.slice(0, 10).map((customer) => (
                      <Card
                        key={customer.id}
                        className="cursor-pointer hover:bg-muted/50 transition-colors"
                        onClick={() => handleCustomerSelect(customer)}
                      >
                        <CardContent className="p-3 flex items-center gap-3">
                          <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center">
                            <User className="w-5 h-5 text-primary" />
                          </div>
                          <div className="flex-1">
                            <p className="font-medium">{customer.name}</p>
                            <p className="text-sm text-muted-foreground">{customer.phone}</p>
                          </div>
                          <Badge variant="outline">{customer.totalOrders} orders</Badge>
                        </CardContent>
                      </Card>
                    ))
                  )}
                </div>

                <Button variant="outline" className="w-full bg-transparent" onClick={handleNewCustomer}>
                  <User className="w-4 h-4 mr-2" />
                  Create New Customer
                </Button>
              </>
            ) : (
              <form onSubmit={customerForm.handleSubmit(handleCustomerSubmit)} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="phone">Phone Number *</Label>
                  <div className="relative">
                    <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input
                      id="phone"
                      placeholder="+92 300 1234567"
                      className="pl-10"
                      {...customerForm.register("phone")}
                    />
                  </div>
                  {customerForm.formState.errors.phone && (
                    <p className="text-sm text-destructive">{customerForm.formState.errors.phone.message}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="name">Full Name *</Label>
                  <Input id="name" placeholder="Customer name" {...customerForm.register("name")} />
                  {customerForm.formState.errors.name && (
                    <p className="text-sm text-destructive">{customerForm.formState.errors.name.message}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="email">Email (Optional)</Label>
                  <Input id="email" type="email" placeholder="customer@email.com" {...customerForm.register("email")} />
                </div>

                <div className="flex gap-2">
                  <Button type="button" variant="outline" onClick={() => setIsNewCustomer(false)}>
                    <ChevronLeft className="w-4 h-4 mr-2" />
                    Back
                  </Button>
                  <Button type="submit" className="flex-1">
                    Continue
                    <ChevronRight className="w-4 h-4 ml-2" />
                  </Button>
                </div>
              </form>
            )}
          </div>
        )}

        {/* Step 2: Order Details */}
        {step === 2 && selectedCustomer && (
          <form
            onSubmit={orderForm.handleSubmit(handleOrderSubmit)}
            className="space-y-4 max-h-[calc(90vh-200px)] overflow-y-auto"
          >
            <Card className="bg-muted/50">
              <CardContent className="p-3 flex items-center gap-3">
                <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center">
                  <User className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <p className="font-medium">{selectedCustomer.name}</p>
                  <p className="text-sm text-muted-foreground">{selectedCustomer.phone}</p>
                </div>
              </CardContent>
            </Card>

            <div className="space-y-2">
              <Label>Service Type</Label>
              <Select
                value={orderForm.watch("serviceType")}
                onValueChange={(value) => orderForm.setValue("serviceType", value as ServiceType)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="delivery">Delivery</SelectItem>
                  <SelectItem value="courier">Courier</SelectItem>
                  <SelectItem value="moving">Moving</SelectItem>
                  <SelectItem value="heavy">Heavy Transport</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="pickupAddress">Pickup Address *</Label>
                <div className="relative">
                  <MapPin className="absolute left-3 top-3 w-4 h-4 text-green-600" />
                  <Textarea
                    id="pickupAddress"
                    placeholder="Enter pickup address"
                    className="pl-10 min-h-[80px]"
                    {...orderForm.register("pickupAddress")}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="dropAddress">Drop Address *</Label>
                <div className="relative">
                  <MapPin className="absolute left-3 top-3 w-4 h-4 text-red-600" />
                  <Textarea
                    id="dropAddress"
                    placeholder="Enter drop address"
                    className="pl-10 min-h-[80px]"
                    {...orderForm.register("dropAddress")}
                  />
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="distance">Distance (km)</Label>
                <Input
                  id="distance"
                  type="number"
                  step="0.1"
                  {...orderForm.register("distance", { valueAsNumber: true })}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="duration">Est. Duration (min)</Label>
                <Input id="duration" type="number" {...orderForm.register("duration", { valueAsNumber: true })} />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="notes">Notes (Optional)</Label>
              <Textarea id="notes" placeholder="Any special instructions..." {...orderForm.register("notes")} />
            </div>

            {/* Fare Preview */}
            <Card className="bg-primary/5 border-primary/20">
              <CardContent className="p-4">
                <h4 className="font-medium mb-3">Fare Preview</h4>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Base Fare</span>
                    <span>{formatPKR(farePreview.baseFare)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Distance ({distance} km)</span>
                    <span>{formatPKR(farePreview.distanceFare)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Time ({duration} min)</span>
                    <span>{formatPKR(farePreview.timeFare)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Platform Fee</span>
                    <span>{formatPKR(farePreview.platformFee)}</span>
                  </div>
                  <div className="border-t pt-2 flex justify-between font-medium">
                    <span>Total Fare</span>
                    <span className="text-primary">{formatPKR(farePreview.totalFare)}</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            <div className="flex gap-2">
              <Button type="button" variant="outline" onClick={() => setStep(1)}>
                <ChevronLeft className="w-4 h-4 mr-2" />
                Back
              </Button>
              <Button type="submit" className="flex-1" disabled={isSubmitting}>
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Creating...
                  </>
                ) : (
                  <>
                    Create Order
                    <ChevronRight className="w-4 h-4 ml-2" />
                  </>
                )}
              </Button>
            </div>
          </form>
        )}

        {/* Step 3: Confirmation */}
        {step === 3 && (
          <div className="text-center py-8">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Check className="w-8 h-8 text-green-600" />
            </div>
            <h3 className="text-xl font-semibold mb-2">Order Created Successfully!</h3>
            <p className="text-muted-foreground mb-6">
              The order has been created and is awaiting provider assignment.
            </p>
            <div className="flex gap-2 justify-center">
              <Button variant="outline" onClick={handleClose}>
                Close
              </Button>
              <Button
                onClick={() => {
                  handleClose()
                  router.push("/orders")
                }}
              >
                View Orders
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}
