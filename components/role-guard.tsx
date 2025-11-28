"use client"

import type { UserRole } from "@/lib/types"
import { useStore } from "@/lib/store"
import type { ReactNode } from "react"

interface RoleGuardProps {
  children: ReactNode
  allowedRoles: UserRole[]
  fallback?: ReactNode
}

// Define role hierarchy for permissions
const ROLE_PERMISSIONS: Record<UserRole, string[]> = {
  ADMIN: ["*"], // All permissions
  OPERATOR: ["orders", "customers", "providers", "view"],
  FINANCE: ["payments", "wallets", "payouts", "view"],
  AUDITOR: ["logs", "view"],
  READONLY: ["view"],
}

export function RoleGuard({ children, allowedRoles, fallback = null }: RoleGuardProps) {
  const { currentRole } = useStore()

  if (allowedRoles.includes(currentRole) || currentRole === "ADMIN") {
    return <>{children}</>
  }

  return <>{fallback}</>
}

export function canPerformAction(role: UserRole, action: string): boolean {
  if (role === "ADMIN") return true
  const permissions = ROLE_PERMISSIONS[role] || []
  return permissions.includes(action) || permissions.includes("*")
}

export function useRolePermissions() {
  const { currentRole } = useStore()

  return {
    canEdit: currentRole !== "READONLY" && currentRole !== "AUDITOR",
    canManageOrders: ["ADMIN", "OPERATOR"].includes(currentRole),
    canManageUsers: ["ADMIN", "OPERATOR"].includes(currentRole),
    canManagePayments: ["ADMIN", "FINANCE"].includes(currentRole),
    canManagePricing: currentRole === "ADMIN",
    canViewLogs: ["ADMIN", "AUDITOR"].includes(currentRole),
    canApproveProviders: ["ADMIN", "OPERATOR"].includes(currentRole),
    isReadOnly: currentRole === "READONLY",
  }
}
