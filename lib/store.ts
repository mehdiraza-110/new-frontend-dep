import { create } from "zustand"
import type {
  Customer,
  Provider,
  Order,
  PriceRule,
  CommissionRule,
  Wallet,
  AuditLog,
  UserRole,
  WalletAdjustment,
  Payout,
} from "./types"

// Import mock data
import customersData from "@/mocks/data/customers.json"
import providersData from "@/mocks/data/providers.json"
import ordersData from "@/mocks/data/orders.json"
import priceRulesData from "@/mocks/data/price-rules.json"
import commissionRulesData from "@/mocks/data/commission-rules.json"
import walletsData from "@/mocks/data/wallets.json"
import auditLogsData from "@/mocks/data/audit-logs.json"
import metricsData from "@/mocks/data/metrics.json"

interface AuthUser {
  email: string
  name: string
  avatar?: string
}

interface AppState {
  isAuthenticated: boolean
  authUser: AuthUser | null
  login: (email: string, password: string) => boolean
  logout: () => void

  // Current role
  currentRole: UserRole
  setCurrentRole: (role: UserRole) => void

  // Data
  customers: Customer[]
  providers: Provider[]
  orders: Order[]
  priceRules: PriceRule[]
  commissionRules: CommissionRule[]
  wallets: Wallet[]
  auditLogs: AuditLog[]
  walletAdjustments: WalletAdjustment[]
  payouts: Payout[]
  metrics: typeof metricsData

  // Actions
  addCustomer: (customer: Customer) => void
  updateCustomer: (id: string, updates: Partial<Customer>) => void

  addProvider: (provider: Provider) => void
  updateProvider: (id: string, updates: Partial<Provider>) => void

  addOrder: (order: Order) => void
  updateOrder: (id: string, updates: Partial<Order>) => void

  updatePriceRule: (id: string, updates: Partial<PriceRule>) => void
  addPriceRule: (rule: PriceRule) => void

  updateCommissionRule: (id: string, updates: Partial<CommissionRule>) => void
  addCommissionRule: (rule: CommissionRule) => void

  updateWallet: (id: string, updates: Partial<Wallet>) => void
  addWalletAdjustment: (adjustment: WalletAdjustment) => void

  addAuditLog: (log: AuditLog) => void

  addPayout: (payout: Payout) => void
  updatePayout: (id: string, updates: Partial<Payout>) => void
}

export const useStore = create<AppState>((set) => ({
  isAuthenticated: false,
  authUser: null,

  login: (email, password) => {
    if (email && password) {
      set({
        isAuthenticated: true,
        authUser: {
          email,
          name: email.split("@")[0].charAt(0).toUpperCase() + email.split("@")[0].slice(1),
        },
      })
      return true
    }
    return false
  },

  logout: () => set({ isAuthenticated: false, authUser: null }),

  // Initial state
  currentRole: "ADMIN",
  customers: customersData as Customer[],
  providers: providersData as Provider[],
  orders: ordersData as Order[],
  priceRules: priceRulesData as PriceRule[],
  commissionRules: commissionRulesData as CommissionRule[],
  wallets: walletsData as Wallet[],
  auditLogs: auditLogsData as AuditLog[],
  walletAdjustments: [],
  payouts: [],
  metrics: metricsData,

  // Role
  setCurrentRole: (role) => set({ currentRole: role }),

  // Customer actions
  addCustomer: (customer) =>
    set((state) => ({
      customers: [...state.customers, customer],
    })),
  updateCustomer: (id, updates) =>
    set((state) => ({
      customers: state.customers.map((c) => (c.id === id ? { ...c, ...updates } : c)),
    })),

  // Provider actions
  addProvider: (provider) =>
    set((state) => ({
      providers: [...state.providers, provider],
    })),
  updateProvider: (id, updates) =>
    set((state) => ({
      providers: state.providers.map((p) => (p.id === id ? { ...p, ...updates } : p)),
    })),

  // Order actions
  addOrder: (order) =>
    set((state) => ({
      orders: [order, ...state.orders],
    })),
  updateOrder: (id, updates) =>
    set((state) => ({
      orders: state.orders.map((o) => (o.id === id ? { ...o, ...updates } : o)),
    })),

  // Price rule actions
  updatePriceRule: (id, updates) =>
    set((state) => ({
      priceRules: state.priceRules.map((r) => (r.id === id ? { ...r, ...updates } : r)),
    })),
  addPriceRule: (rule) =>
    set((state) => ({
      priceRules: [...state.priceRules, rule],
    })),

  // Commission rule actions
  updateCommissionRule: (id, updates) =>
    set((state) => ({
      commissionRules: state.commissionRules.map((r) => (r.id === id ? { ...r, ...updates } : r)),
    })),
  addCommissionRule: (rule) =>
    set((state) => ({
      commissionRules: [...state.commissionRules, rule],
    })),

  // Wallet actions
  updateWallet: (id, updates) =>
    set((state) => ({
      wallets: state.wallets.map((w) => (w.id === id ? { ...w, ...updates } : w)),
    })),
  addWalletAdjustment: (adjustment) =>
    set((state) => ({
      walletAdjustments: [adjustment, ...state.walletAdjustments],
    })),

  // Audit log actions
  addAuditLog: (log) =>
    set((state) => ({
      auditLogs: [log, ...state.auditLogs],
    })),

  // Payout actions
  addPayout: (payout) =>
    set((state) => ({
      payouts: [payout, ...state.payouts],
    })),
  updatePayout: (id, updates) =>
    set((state) => ({
      payouts: state.payouts.map((p) => (p.id === id ? { ...p, ...updates } : p)),
    })),
}))

// Helper to get customer by ID
export function getCustomerById(customers: Customer[], id: string): Customer | undefined {
  return customers.find((c) => c.id === id)
}

// Helper to get provider by ID
export function getProviderById(providers: Provider[], id: string): Provider | undefined {
  return providers.find((p) => p.id === id)
}
