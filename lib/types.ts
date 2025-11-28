// Core types for the Admin Portal

export type UserRole = "ADMIN" | "OPERATOR" | "FINANCE" | "AUDITOR" | "READONLY"

export type ProviderStatus = "pending" | "verified" | "suspended" | "offline" | "available" | "busy"

export type OrderStatus =
  | "CREATED"
  | "PENDING_ASSIGNMENT"
  | "ASSIGNED"
  | "EN_ROUTE"
  | "IN_PROGRESS"
  | "COMPLETED"
  | "CANCELED"

export type ServiceType = "delivery" | "courier" | "moving" | "heavy"

export type KycStatus = "pending" | "documents_submitted" | "verified" | "rejected"

export interface Customer {
  id: string
  name: string
  phone: string
  email: string
  totalOrders: number
  lastActive: string
  status: "active" | "disabled"
  walletBalance: number
  city: string
  createdAt: string
}

export interface Provider {
  id: string
  name: string
  phone: string
  email: string
  status: ProviderStatus
  serviceTypes: ServiceType[]
  rating: number
  completedOrders: number
  lastLocation: { lat: number; lng: number }
  lastPing: string
  city: string
  walletBalance: number
  pendingPayout: number
  kycStatus: KycStatus
  vehicleType: string
  vehiclePlate: string
  createdAt: string
}

export interface Order {
  id: string
  customerId: string
  providerId: string | null
  status: OrderStatus
  serviceType: ServiceType
  pickup: { address: string; lat: number; lng: number }
  drop: { address: string; lat: number; lng: number }
  distance: number
  duration: number
  baseFare: number
  distanceFare: number
  timeFare: number
  platformFee: number
  totalFare: number
  commission: number
  providerEarning: number
  paymentMethod: "cash" | "wallet" | "card"
  paymentStatus: "pending" | "paid" | "refunded"
  createdAt: string
  assignedAt: string | null
  completedAt: string | null
  city: string
  notes: string
  cancelReason?: string
}

export interface PriceRule {
  id: string
  serviceType: ServiceType
  city: string
  baseFare: number
  perKmRate: number
  perMinRate: number
  minFare: number
  surgePeak: number
  surgeRain: number
  status: "draft" | "published"
  version: number
  updatedAt: string
}

export interface CommissionRule {
  id: string
  serviceType: ServiceType
  type: "percentage" | "fixed"
  value: number
  minAmount: number
  maxAmount: number
  tier: string
  status: "draft" | "published"
  version: number
  updatedAt: string
}

export interface Wallet {
  id: string
  ownerType: "provider" | "customer"
  ownerId: string
  balance: number
  holds: number
  pendingPayout: number
  currency: string
  lastUpdated: string
}

export interface AuditLog {
  id: string
  actor: string
  actorRole: UserRole
  action: string
  entity: string
  entityId: string
  details: string
  timestamp: string
  ip: string
}

export interface WalletAdjustment {
  id: string
  walletId: string
  type: "credit" | "debit"
  amount: number
  reason: string
  createdBy: string
  createdAt: string
}

export interface Payout {
  id: string
  providerId: string
  amount: number
  status: "pending" | "processing" | "completed" | "failed"
  createdAt: string
  processedAt: string | null
}

// Order status transitions (for validation)
export const ORDER_STATUS_TRANSITIONS: Record<OrderStatus, OrderStatus[]> = {
  CREATED: ["PENDING_ASSIGNMENT", "CANCELED"],
  PENDING_ASSIGNMENT: ["ASSIGNED", "CANCELED"],
  ASSIGNED: ["EN_ROUTE", "CANCELED"],
  EN_ROUTE: ["IN_PROGRESS", "CANCELED"],
  IN_PROGRESS: ["COMPLETED", "CANCELED"],
  COMPLETED: [],
  CANCELED: [],
}

export function canTransitionTo(from: OrderStatus, to: OrderStatus): boolean {
  return ORDER_STATUS_TRANSITIONS[from]?.includes(to) ?? false
}
