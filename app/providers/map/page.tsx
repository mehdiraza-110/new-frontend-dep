"use client"

import { useState, useMemo, useEffect } from "react"
import { Phone, Mail, MapPin } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@/components/ui/sheet"
import { AdminLayout } from "@/components/admin-layout"
import { SimulationProvider } from "@/components/simulation-provider"
import { ProviderCard } from "@/components/provider-card"
import { useStore } from "@/lib/store"
import { eventBus, EVENTS } from "@/lib/event-bus"
import type { Provider, ProviderStatus } from "@/lib/types"
import Link from "next/link"

const statusColors: Record<ProviderStatus, string> = {
  available: "bg-green-500",
  busy: "bg-amber-500",
  offline: "bg-gray-400",
  pending: "bg-blue-500",
  verified: "bg-green-500",
  suspended: "bg-red-500",
}

function LiveMapContent() {
  const { providers, orders } = useStore()

  const [statusFilter, setStatusFilter] = useState<string>("all")
  const [cityFilter, setCityFilter] = useState<string>("all")
  const [serviceFilter, setServiceFilter] = useState<string>("all")
  const [selectedProvider, setSelectedProvider] = useState<Provider | null>(null)
  const [sheetOpen, setSheetOpen] = useState(false)
  const [, forceUpdate] = useState({})

  // Subscribe to provider updates
  useEffect(() => {
    const unsubscribe = eventBus.on(EVENTS.PROVIDERS_UPDATE, () => {
      forceUpdate({})
    })
    return unsubscribe
  }, [])

  // Get unique cities and service types
  const cities = useMemo(() => {
    return [...new Set(providers.map((p) => p.city))]
  }, [providers])

  const serviceTypes = useMemo(() => {
    return [...new Set(providers.flatMap((p) => p.serviceTypes))]
  }, [providers])

  // Filter providers
  const filteredProviders = useMemo(() => {
    let result = providers.filter((p) => p.status !== "pending" && p.status !== "suspended")

    if (statusFilter !== "all") {
      result = result.filter((p) => p.status === statusFilter)
    }

    if (cityFilter !== "all") {
      result = result.filter((p) => p.city === cityFilter)
    }

    if (serviceFilter !== "all") {
      result = result.filter((p) => p.serviceTypes.includes(serviceFilter as any))
    }

    return result
  }, [providers, statusFilter, cityFilter, serviceFilter])

  // Active (available + busy) providers for the map
  const activeProviders = useMemo(() => {
    return filteredProviders.filter((p) => p.status === "available" || p.status === "busy")
  }, [filteredProviders])

  // Get pending orders (for assignment)
  const pendingOrders = orders.filter((o) => o.status === "PENDING_ASSIGNMENT" || o.status === "CREATED")

  const handleProviderClick = (provider: Provider) => {
    setSelectedProvider(provider)
    setSheetOpen(true)
  }

  // Normalize coordinates to fit in the container (similar to MiniMap but full page)
  const normalizeCoords = (lat: number, lng: number, width: number, height: number) => {
    const minLat = 24.0,
      maxLat = 35.0
    const minLng = 66.0,
      maxLng = 77.0

    const x = ((lng - minLng) / (maxLng - minLng)) * width
    const y = ((maxLat - lat) / (maxLat - minLat)) * height

    return { x: Math.max(30, Math.min(width - 30, x)), y: Math.max(30, Math.min(height - 30, y)) }
  }

  return (
    <AdminLayout>
      <div className="h-[calc(100vh-8rem)] flex flex-col">
        {/* Filters Bar */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-semibold">Live Provider Map</h1>
            <Badge variant="outline">{activeProviders.length} active</Badge>
          </div>

          <div className="flex items-center gap-2">
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-32">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="available">Available</SelectItem>
                <SelectItem value="busy">Busy</SelectItem>
                <SelectItem value="offline">Offline</SelectItem>
              </SelectContent>
            </Select>

            <Select value={cityFilter} onValueChange={setCityFilter}>
              <SelectTrigger className="w-32">
                <SelectValue placeholder="City" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Cities</SelectItem>
                {cities.map((city) => (
                  <SelectItem key={city} value={city}>
                    {city}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={serviceFilter} onValueChange={setServiceFilter}>
              <SelectTrigger className="w-36">
                <SelectValue placeholder="Service Type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Services</SelectItem>
                {serviceTypes.map((type) => (
                  <SelectItem key={type} value={type} className="capitalize">
                    {type}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Map Container */}
        <div className="flex-1 relative bg-muted/30 rounded-lg overflow-hidden border">
          {/* Grid Background */}
          <div className="absolute inset-0 opacity-5">
            <svg width="100%" height="100%">
              <pattern id="map-grid" width="50" height="50" patternUnits="userSpaceOnUse">
                <path d="M 50 0 L 0 0 0 50" fill="none" stroke="currentColor" strokeWidth="1" />
              </pattern>
              <rect width="100%" height="100%" fill="url(#map-grid)" />
            </svg>
          </div>

          {/* City Labels */}
          <div className="absolute top-1/2 left-1/4 text-sm font-medium text-muted-foreground/50">KARACHI</div>
          <div className="absolute top-1/3 left-1/2 text-sm font-medium text-muted-foreground/50">LAHORE</div>
          <div className="absolute top-1/4 right-1/3 text-sm font-medium text-muted-foreground/50">ISLAMABAD</div>
          <div className="absolute top-1/5 left-1/3 text-sm font-medium text-muted-foreground/50">PESHAWAR</div>

          {/* Provider Markers */}
          {activeProviders.map((provider) => {
            const { x, y } = normalizeCoords(
              provider.lastLocation.lat,
              provider.lastLocation.lng,
              typeof window !== "undefined" ? window.innerWidth - 350 : 1000,
              typeof window !== "undefined" ? window.innerHeight - 250 : 600,
            )

            return (
              <button
                key={provider.id}
                className="absolute transform -translate-x-1/2 -translate-y-1/2 cursor-pointer group z-10"
                style={{ left: `${x}px`, top: `${y}px` }}
                onClick={() => handleProviderClick(provider)}
              >
                <div
                  className={`w-5 h-5 rounded-full border-2 border-white shadow-lg ${statusColors[provider.status]} transition-transform hover:scale-125`}
                >
                  {provider.status === "busy" && (
                    <div
                      className={`absolute inset-0 rounded-full ${statusColors[provider.status]} animate-ping opacity-50`}
                    />
                  )}
                </div>

                {/* Hover Tooltip */}
                <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 hidden group-hover:block">
                  <div className="bg-popover text-popover-foreground text-xs rounded-md shadow-lg p-2 whitespace-nowrap border">
                    <p className="font-medium">{provider.name}</p>
                    <p className="text-muted-foreground">{provider.vehicleType}</p>
                  </div>
                </div>
              </button>
            )
          })}

          {/* Empty State */}
          {activeProviders.length === 0 && (
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="text-center">
                <MapPin className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-medium mb-1">No Active Providers</h3>
                <p className="text-muted-foreground">Try adjusting your filters</p>
              </div>
            </div>
          )}

          {/* Legend */}
          <div className="absolute bottom-4 left-4 bg-background/80 backdrop-blur-sm rounded-lg p-3 border shadow-sm">
            <h4 className="text-xs font-medium mb-2">Legend</h4>
            <div className="space-y-1.5">
              <div className="flex items-center gap-2 text-xs">
                <div className="w-3 h-3 rounded-full bg-green-500" />
                <span>Available ({filteredProviders.filter((p) => p.status === "available").length})</span>
              </div>
              <div className="flex items-center gap-2 text-xs">
                <div className="w-3 h-3 rounded-full bg-amber-500" />
                <span>Busy ({filteredProviders.filter((p) => p.status === "busy").length})</span>
              </div>
              <div className="flex items-center gap-2 text-xs">
                <div className="w-3 h-3 rounded-full bg-gray-400" />
                <span>Offline ({filteredProviders.filter((p) => p.status === "offline").length})</span>
              </div>
            </div>
          </div>

          {/* Pending Orders Indicator */}
          {pendingOrders.length > 0 && (
            <div className="absolute top-4 right-4 bg-amber-50 border border-amber-200 rounded-lg p-3">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-amber-500 rounded-full animate-pulse" />
                <span className="text-sm font-medium text-amber-800">
                  {pendingOrders.length} orders awaiting assignment
                </span>
              </div>
              <Link href="/orders?status=PENDING_ASSIGNMENT">
                <Button variant="link" size="sm" className="p-0 h-auto text-amber-700">
                  View orders →
                </Button>
              </Link>
            </div>
          )}
        </div>
      </div>

      {/* Provider Detail Sheet */}
      <Sheet open={sheetOpen} onOpenChange={setSheetOpen}>
        <SheetContent>
          <SheetHeader>
            <SheetTitle>Provider Details</SheetTitle>
            <SheetDescription>View provider info and assign to orders</SheetDescription>
          </SheetHeader>

          {selectedProvider && (
            <div className="mt-6">
              <ProviderCard
                provider={selectedProvider}
                onView={() => {
                  setSheetOpen(false)
                  window.location.href = `/users/providers?id=${selectedProvider.id}`
                }}
                onAssign={
                  selectedProvider.status === "available"
                    ? () => {
                        setSheetOpen(false)
                        window.location.href = `/orders?assign=${selectedProvider.id}`
                      }
                    : undefined
                }
              />

              <div className="mt-6 space-y-3">
                <h4 className="font-medium">Quick Actions</h4>
                <div className="grid grid-cols-2 gap-2">
                  <Button variant="outline" size="sm" asChild>
                    <a href={`tel:${selectedProvider.phone}`}>
                      <Phone className="w-4 h-4 mr-2" />
                      Call
                    </a>
                  </Button>
                  <Button variant="outline" size="sm" asChild>
                    <a href={`mailto:${selectedProvider.email}`}>
                      <Mail className="w-4 h-4 mr-2" />
                      Email
                    </a>
                  </Button>
                </div>

                {selectedProvider.status === "available" && pendingOrders.length > 0 && (
                  <div className="p-3 bg-primary/5 rounded-lg">
                    <h5 className="text-sm font-medium mb-2">Assign to Order</h5>
                    <div className="space-y-2 max-h-40 overflow-y-auto">
                      {pendingOrders.slice(0, 5).map((order) => (
                        <Link
                          key={order.id}
                          href={`/orders?id=${order.id}&assign=${selectedProvider.id}`}
                          className="block p-2 bg-background rounded border hover:bg-muted/50 transition-colors"
                        >
                          <p className="text-sm font-medium">{order.id}</p>
                          <p className="text-xs text-muted-foreground truncate">{order.pickup.address}</p>
                        </Link>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
        </SheetContent>
      </Sheet>
    </AdminLayout>
  )
}

export default function LiveMapPage() {
  return (
    <SimulationProvider>
      <LiveMapContent />
    </SimulationProvider>
  )
}
