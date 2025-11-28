"use client"

import { useProviderSimulation, useOrderSimulation } from "@/lib/simulation"
import type { ReactNode } from "react"

export function SimulationProvider({ children }: { children: ReactNode }) {
  // Start simulations
  useProviderSimulation()
  useOrderSimulation()

  return <>{children}</>
}
