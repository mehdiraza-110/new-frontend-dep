"use client"

import { useEffect, useRef, useState } from "react"
import { useStore } from "@/lib/store"
import { Badge } from "@/components/ui/badge"

// Simple map visualization without Mapbox (fallback)
export function MiniMap() {
  const { providers } = useStore()
  const containerRef = useRef<HTMLDivElement>(null)
  const [dimensions, setDimensions] = useState({ width: 0, height: 0 })

  const activeProviders = providers.filter((p) => p.status === "available" || p.status === "busy")

  useEffect(() => {
    if (containerRef.current) {
      setDimensions({
        width: containerRef.current.offsetWidth,
        height: 300,
      })
    }
  }, [])

  // Normalize coordinates to fit in the container
  const normalizeCoords = (lat: number, lng: number) => {
    // Pakistan bounds approximately
    const minLat = 24.0,
      maxLat = 35.0
    const minLng = 66.0,
      maxLng = 77.0

    const x = ((lng - minLng) / (maxLng - minLng)) * dimensions.width
    const y = ((maxLat - lat) / (maxLat - minLat)) * dimensions.height

    return { x: Math.max(20, Math.min(dimensions.width - 20, x)), y: Math.max(20, Math.min(dimensions.height - 20, y)) }
  }

  return (
    <div ref={containerRef} className="relative bg-muted/50 rounded-lg overflow-hidden" style={{ height: 300 }}>
      {/* Map background pattern */}
      <div className="absolute inset-0 opacity-10">
        <svg width="100%" height="100%">
          <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
            <path d="M 40 0 L 0 0 0 40" fill="none" stroke="currentColor" strokeWidth="1" />
          </pattern>
          <rect width="100%" height="100%" fill="url(#grid)" />
        </svg>
      </div>

      {/* City labels */}
      <div className="absolute top-4 left-4 text-xs text-muted-foreground">Karachi</div>
      <div className="absolute top-4 right-1/3 text-xs text-muted-foreground">Lahore</div>
      <div className="absolute top-1/4 right-4 text-xs text-muted-foreground">Islamabad</div>

      {/* Provider markers */}
      {dimensions.width > 0 &&
        activeProviders.map((provider) => {
          const { x, y } = normalizeCoords(provider.lastLocation.lat, provider.lastLocation.lng)

          return (
            <div
              key={provider.id}
              className="absolute transform -translate-x-1/2 -translate-y-1/2 cursor-pointer group"
              style={{ left: x, top: y }}
            >
              <div
                className={`w-4 h-4 rounded-full border-2 border-white shadow-md ${
                  provider.status === "available" ? "bg-green-500" : "bg-amber-500"
                }`}
              >
                {provider.status === "busy" && (
                  <div className="absolute inset-0 rounded-full bg-amber-500 animate-ping opacity-50" />
                )}
              </div>

              {/* Tooltip */}
              <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 hidden group-hover:block z-10">
                <div className="bg-popover text-popover-foreground text-xs rounded-md shadow-lg p-2 whitespace-nowrap">
                  <p className="font-medium">{provider.name}</p>
                  <p className="text-muted-foreground">{provider.vehicleType}</p>
                  <Badge variant={provider.status === "available" ? "default" : "secondary"} className="mt-1">
                    {provider.status}
                  </Badge>
                </div>
              </div>
            </div>
          )
        })}

      {/* Legend */}
      <div className="absolute bottom-4 left-4 flex items-center gap-4 text-xs">
        <div className="flex items-center gap-1">
          <div className="w-3 h-3 rounded-full bg-green-500" />
          <span>Available</span>
        </div>
        <div className="flex items-center gap-1">
          <div className="w-3 h-3 rounded-full bg-amber-500" />
          <span>Busy</span>
        </div>
      </div>

      {/* Provider count */}
      <div className="absolute bottom-4 right-4">
        <Badge variant="secondary">{activeProviders.length} active</Badge>
      </div>
    </div>
  )
}
