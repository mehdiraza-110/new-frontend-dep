import type { PriceRule, CommissionRule, ServiceType } from "../types"

interface PriceBreakdown {
  baseFare: number
  distanceFare: number
  timeFare: number
  platformFee: number
  totalFare: number
  commission: number
  providerEarning: number
}

export function calculateFare(
  serviceType: ServiceType,
  distance: number, // in km
  duration: number, // in minutes
  city: string,
  priceRules: PriceRule[],
  commissionRules: CommissionRule[],
  surgeFactor = 1,
): PriceBreakdown {
  // Find applicable price rule (city-specific or default)
  const cityRule = priceRules.find((r) => r.serviceType === serviceType && r.city === city && r.status === "published")
  const defaultRule = priceRules.find(
    (r) => r.serviceType === serviceType && r.city === "all" && r.status === "published",
  )
  const rule = cityRule || defaultRule

  if (!rule) {
    // Fallback values
    return {
      baseFare: 150,
      distanceFare: distance * 20,
      timeFare: duration * 2,
      platformFee: 30,
      totalFare: 150 + distance * 20 + duration * 2 + 30,
      commission: Math.round((150 + distance * 20 + duration * 2) * 0.15),
      providerEarning: Math.round((150 + distance * 20 + duration * 2 + 30) * 0.85),
    }
  }

  const baseFare = Math.round(rule.baseFare * surgeFactor)
  const distanceFare = Math.round(distance * rule.perKmRate * surgeFactor)
  const timeFare = Math.round(duration * rule.perMinRate * surgeFactor)
  const subtotal = baseFare + distanceFare + timeFare
  const platformFee = Math.round(subtotal * 0.1) // 10% platform fee
  const totalFare = Math.max(subtotal + platformFee, rule.minFare)

  // Find applicable commission rule
  const commissionRule = commissionRules.find((r) => r.serviceType === serviceType && r.status === "published")

  let commission = 0
  if (commissionRule) {
    if (commissionRule.type === "percentage") {
      commission = Math.round(subtotal * (commissionRule.value / 100))
      commission = Math.max(commissionRule.minAmount, Math.min(commission, commissionRule.maxAmount))
    } else {
      commission = commissionRule.value
    }
  } else {
    commission = Math.round(subtotal * 0.15) // Default 15%
  }

  const providerEarning = totalFare - commission

  return {
    baseFare,
    distanceFare,
    timeFare,
    platformFee,
    totalFare,
    commission,
    providerEarning,
  }
}
