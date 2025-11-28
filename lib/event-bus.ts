// Simple event bus for simulating realtime updates
type EventCallback = (data: unknown) => void

class EventBus {
  private listeners: Map<string, Set<EventCallback>> = new Map()

  on(event: string, callback: EventCallback) {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, new Set())
    }
    this.listeners.get(event)!.add(callback)

    // Return unsubscribe function
    return () => {
      this.listeners.get(event)?.delete(callback)
    }
  }

  emit(event: string, data?: unknown) {
    this.listeners.get(event)?.forEach((callback) => {
      try {
        callback(data)
      } catch (e) {
        console.error(`Error in event listener for ${event}:`, e)
      }
    })
  }

  off(event: string, callback: EventCallback) {
    this.listeners.get(event)?.delete(callback)
  }
}

export const eventBus = new EventBus()

// Event types
export const EVENTS = {
  PROVIDERS_UPDATE: "providers:update",
  ORDERS_UPDATE: "orders:update",
  ORDER_CREATED: "order:created",
  ORDER_STATUS_CHANGED: "order:status_changed",
  PROVIDER_LOCATION_UPDATE: "provider:location_update",
  WALLET_UPDATE: "wallet:update",
} as const
