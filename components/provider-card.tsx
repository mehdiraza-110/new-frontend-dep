"use client"

import { Star, Phone, Mail, MapPin, Truck } from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import type { Provider, ProviderStatus } from "@/lib/types"
import { formatRelativeTime } from "@/lib/utils/format"

const statusColors: Record<ProviderStatus, string> = {
  available: "bg-green-100 text-green-700",
  busy: "bg-amber-100 text-amber-700",
  offline: "bg-gray-100 text-gray-700",
  pending: "bg-blue-100 text-blue-700",
  verified: "bg-green-100 text-green-700",
  suspended: "bg-red-100 text-red-700",
}

interface ProviderCardProps {
  provider: Provider
  onAssign?: () => void
  onView?: () => void
  compact?: boolean
}

export function ProviderCard({ provider, onAssign, onView, compact = false }: ProviderCardProps) {
  if (compact) {
    return (
      <Card className="p-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center">
            <Truck className="w-5 h-5 text-primary" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-medium truncate">{provider.name}</p>
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <span>{provider.vehicleType}</span>
              <span>•</span>
              <div className="flex items-center gap-1">
                <Star className="w-3 h-3 text-amber-500 fill-amber-500" />
                {provider.rating > 0 ? provider.rating.toFixed(1) : "N/A"}
              </div>
            </div>
          </div>
          <Badge className={statusColors[provider.status]}>{provider.status}</Badge>
        </div>
      </Card>
    )
  }

  return (
    <Card>
      <CardContent className="p-4">
        <div className="flex items-start gap-4">
          <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center">
            <Truck className="w-6 h-6 text-primary" />
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between mb-2">
              <h3 className="font-semibold text-lg">{provider.name}</h3>
              <Badge className={statusColors[provider.status]}>{provider.status}</Badge>
            </div>

            <div className="space-y-1 text-sm text-muted-foreground mb-3">
              <div className="flex items-center gap-2">
                <Phone className="w-4 h-4" />
                {provider.phone}
              </div>
              <div className="flex items-center gap-2">
                <Mail className="w-4 h-4" />
                {provider.email}
              </div>
              <div className="flex items-center gap-2">
                <MapPin className="w-4 h-4" />
                {provider.city}
              </div>
            </div>

            <div className="flex items-center gap-4 mb-3">
              <div className="flex items-center gap-1">
                <Star className="w-4 h-4 text-amber-500 fill-amber-500" />
                <span className="font-medium">{provider.rating > 0 ? provider.rating.toFixed(1) : "N/A"}</span>
              </div>
              <span className="text-sm text-muted-foreground">{provider.completedOrders} orders</span>
              <span className="text-sm text-muted-foreground">{provider.vehicleType}</span>
            </div>

            <div className="flex items-center gap-1 flex-wrap mb-3">
              {provider.serviceTypes.map((type) => (
                <Badge key={type} variant="outline" className="text-xs">
                  {type}
                </Badge>
              ))}
            </div>

            <p className="text-xs text-muted-foreground mb-3">Last active: {formatRelativeTime(provider.lastPing)}</p>

            <div className="flex gap-2">
              {onView && (
                <Button variant="outline" size="sm" onClick={onView}>
                  View Details
                </Button>
              )}
              {onAssign && provider.status === "available" && (
                <Button size="sm" onClick={onAssign}>
                  Assign to Order
                </Button>
              )}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
