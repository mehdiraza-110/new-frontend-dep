"use client"

import { useEffect } from "react"
import { useStore } from "./store"
import { eventBus, EVENTS } from "./event-bus"
import type { OrderStatus } from "./types"

// Random movement delta for provider locations
function randomDelta() {
  return (Math.random() - 0.5) * 0.002 // Small random movement
}

// Simulate provider movements
export function useProviderSimulation() {
  const { providers, updateProvider } = useStore()

  useEffect(() => {
    const interval = setInterval(() => {
      // Update active providers' locations
      providers
        .filter((p) => p.status === "available" || p.status === "busy")
        .forEach((provider) => {
          const newLocation = {
            lat: provider.lastLocation.lat + randomDelta(),
            lng: provider.lastLocation.lng + randomDelta(),
          }

          updateProvider(provider.id, {
            lastLocation: newLocation,
            lastPing: new Date().toISOString(),
          })
        })

      // Emit update event
      eventBus.emit(EVENTS.PROVIDERS_UPDATE)
    }, 5000) // Every 5 seconds

    return () => clearInterval(interval)
  }, [providers, updateProvider])
}

// Simulate order status progression
export function useOrderSimulation() {
  const { orders, updateOrder, addAuditLog } = useStore()

  useEffect(() => {
    const interval = setInterval(() => {
      // Find orders that can progress
      const activeOrders = orders.filter((o) => ["ASSIGNED", "EN_ROUTE", "IN_PROGRESS"].includes(o.status))

      if (activeOrders.length > 0) {
        // Randomly pick one order to progress (30% chance)
        if (Math.random() < 0.3) {
          const order = activeOrders[Math.floor(Math.random() * activeOrders.length)]

          let newStatus: OrderStatus | null = null
          if (order.status === "ASSIGNED") newStatus = "EN_ROUTE"
          else if (order.status === "EN_ROUTE") newStatus = "IN_PROGRESS"
          else if (order.status === "IN_PROGRESS") newStatus = "COMPLETED"

          if (newStatus) {
            updateOrder(order.id, {
              status: newStatus,
              ...(newStatus === "COMPLETED" ? { completedAt: new Date().toISOString() } : {}),
            })

            addAuditLog({
              id: `log_${Date.now()}`,
              actor: "system@marketplace.pk",
              actorRole: "OPERATOR",
              action: `order.${newStatus.toLowerCase()}`,
              entity: "order",
              entityId: order.id,
              details: `Order status changed to ${newStatus}`,
              timestamp: new Date().toISOString(),
              ip: "0.0.0.0",
            })

            eventBus.emit(EVENTS.ORDER_STATUS_CHANGED, { orderId: order.id, newStatus })
            eventBus.emit(EVENTS.ORDERS_UPDATE)
          }
        }
      }
    }, 10000) // Every 10 seconds

    return () => clearInterval(interval)
  }, [orders, updateOrder, addAuditLog])
}
