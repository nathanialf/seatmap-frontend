"use client"

import { useState, useEffect } from "react"
import { Navbar } from "@/components/navbar"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Check, Loader2 } from "lucide-react"
import Link from "next/link"
import { TierInfo } from '@/lib/api-client'

interface AuthStatus {
  isAuthenticated: boolean
  isUser: boolean
  userTier?: string
}

export default function PricingPage() {
  const [tiers, setTiers] = useState<TierInfo[]>([])
  const [authStatus, setAuthStatus] = useState<AuthStatus>({
    isAuthenticated: false,
    isUser: false
  })
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Fetch authentication status and tiers in parallel
        const [authResponse, tiersResponse] = await Promise.all([
          fetch('/api/auth/status'),
          fetch('/api/tiers')
        ])

        // Handle auth status
        const authData = await authResponse.json()
        console.log('Auth response:', authData)
        if (authData.success) {
          const newAuthStatus = {
            isAuthenticated: authData.data.isAuthenticated,
            isUser: authData.data.isUser,
            userTier: authData.data.userTier
          }
          console.log('Setting auth status:', newAuthStatus)
          setAuthStatus(newAuthStatus)
        }

        // Handle tiers data
        const tiersData = await tiersResponse.json()
        console.log('Tiers response:', tiersData)
        
        if (tiersData.success && tiersData.data) {
          // Extract tiers array from the response structure
          const rawTiers = tiersData.data.tiers || tiersData.data
          const tierArray = Array.isArray(rawTiers) ? rawTiers : [rawTiers]
          console.log('All tiers from API:', tierArray)
          console.log('Number of tiers received:', tierArray.length)
          
          // Log each tier in detail
          tierArray.forEach((tier: TierInfo, index: number) => {
            console.log(`Tier ${index + 1} RAW:`, tier)
            console.log(`Tier ${index + 1} keys:`, Object.keys(tier))
            console.log(`Tier ${index + 1} mapped:`, {
              tierName: tier.tierName,
              displayName: tier.displayName,
              description: tier.description,
              priceUsd: tier.priceUsd,
              billingType: tier.billingType,
              maxSeatmapCalls: tier.maxSeatmapCalls,
              maxBookmarks: tier.maxBookmarks,
              publiclyAccessible: tier.publiclyAccessible,
              active: tier.active,
              canDowngrade: tier.canDowngrade
            })
          })
          
          // Filter tiers - be more lenient with filtering
          const visibleTiers = tierArray.filter((tier: TierInfo) => {
            const isPublic = tier.publiclyAccessible !== false
            const isActive = tier.active !== false
            console.log(`Tier ${tier.tierName}: public=${isPublic}, active=${isActive}, showing=${isPublic && isActive}`)
            return isPublic && isActive
          })
          
          // Sort tiers by price (lowest to highest)
          const sortedTiers = visibleTiers.sort((a, b) => {
            const priceA = typeof a.priceUsd === 'number' ? a.priceUsd : 0
            const priceB = typeof b.priceUsd === 'number' ? b.priceUsd : 0
            return priceA - priceB
          })
          
          console.log('Visible tiers after filtering:', visibleTiers.length, 'tiers')
          console.log('Sorted tiers by price:', sortedTiers.map(t => `${t.tierName}: $${t.priceUsd}`))
          setTiers(sortedTiers)
          
          // If we only got one tier or limited tiers, log a warning
          if (visibleTiers.length <= 1) {
            console.warn('Only', visibleTiers.length, 'visible tier(s) found. Expected multiple tiers (FREE, PRO, BUSINESS)')
          }
        } else {
          console.error('Invalid tiers response:', tiersData)
          throw new Error('Failed to load pricing information')
        }
      } catch (err) {
        console.error('Error fetching pricing data:', err)
        setError(err instanceof Error ? err.message : 'Failed to load pricing data')
      } finally {
        setIsLoading(false)
      }
    }

    fetchData()
  }, [])

  // Helper functions
  const isCurrentTier = (tierName: string) => {
    return authStatus.isAuthenticated && authStatus.userTier === tierName
  }

  const getActionButton = (tier: TierInfo) => {
    console.log(`Getting action button for ${tier.tierName}:`, {
      isCurrentTier: isCurrentTier(tier.tierName),
      authStatus,
      tierName: tier.tierName
    })
    
    if (isCurrentTier(tier.tierName)) {
      return { text: "Current Plan", disabled: true, variant: "secondary" as const }
    }
    
    if (!authStatus.isAuthenticated) {
      return { text: "Get Started", disabled: false, variant: "default" as const }
    }
    
    // For authenticated users, determine if this is upgrade or downgrade
    // Use the API tier order based on price
    const currentTier = tiers.find(t => t.tierName === authStatus.userTier)
    if (!currentTier) {
      return { text: "Get Started", disabled: false, variant: "default" as const }
    }
    
    // Safely get prices, defaulting to 0 if undefined
    const targetPrice = typeof tier.priceUsd === 'number' ? tier.priceUsd : 0
    const currentPrice = typeof currentTier.priceUsd === 'number' ? currentTier.priceUsd : 0
    
    if (targetPrice > currentPrice) {
      return { text: "Upgrade", disabled: false, variant: "default" as const }
    } else if (targetPrice < currentPrice) {
      // Check if the user's CURRENT tier allows downgrades
      if (currentTier.canDowngrade) {
        return { text: "Downgrade", disabled: false, variant: "outline" as const }
      } else {
        return { text: "Not Available", disabled: true, variant: "secondary" as const }
      }
    }
    
    return { text: "Not Available", disabled: true, variant: "secondary" as const }
  }

  const formatFeatures = (tier: TierInfo) => {
    const features = []
    
    // Add API-based seat map calls limit
    if (tier.maxSeatmapCalls === null || tier.maxSeatmapCalls === undefined || tier.maxSeatmapCalls === -1) {
      features.push("Unlimited seat map views")
    } else if (typeof tier.maxSeatmapCalls === 'number' && tier.maxSeatmapCalls > 0) {
      features.push(`${tier.maxSeatmapCalls.toLocaleString()} seat map views per month`)
    }
    
    // Add tier-specific hardcoded features based on original implementation
    if (tier.tierName === 'FREE') {
      features.push("Community support")
    } else if (tier.tierName === 'PRO') {
      // Add bookmarks if available from API
      if (typeof tier.maxBookmarks === 'number' && tier.maxBookmarks > 0) {
        features.push(`Track ${tier.maxBookmarks} flights or routes`)
      }
      features.push("Email notifications")
      features.push("Advanced seat map with details")
      features.push("Priority support")
      features.push("Seat preference filters")
      features.push("Flight connections available")
    } else if (tier.tierName === 'BUSINESS') {
      features.push("Track unlimited flights and routes")
      features.push("Email notifications")
      features.push("Advanced seat map with details")
      features.push("Priority support")
      features.push("Seat preference filters")
      features.push("Flight connections available")
      features.push("24/7 dedicated support")
      features.push("Lifetime updates")
    }
    
    return features
  }

  return (
    <div className="min-h-screen bg-white">
      <Navbar />

      <div className="max-w-7xl mx-auto px-6 py-16">
        {/* Header */}
        <div className="text-center mb-16">
          <h1 className="text-5xl font-bold text-gray-900 mb-4 text-balance">Simple, transparent pricing</h1>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto text-pretty">
            Choose the plan that works best for you. All plans include a 7-day free trial.
          </p>
        </div>

        {/* Loading State */}
        {isLoading && (
          <div className="flex justify-center items-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-gray-400" />
            <span className="ml-2 text-gray-600">Loading pricing information...</span>
          </div>
        )}

        {/* Error State */}
        {error && !isLoading && (
          <div className="text-center py-12">
            <p className="text-red-600 mb-4">{error}</p>
            <Button onClick={() => window.location.reload()} variant="outline">
              Try Again
            </Button>
          </div>
        )}

        {/* Pricing Cards */}
        {!isLoading && !error && tiers.length > 0 && (
          <div className="grid md:grid-cols-3 gap-8 mb-16">
            {tiers.map((tier, index) => {
              const actionButton = getActionButton(tier)
              const features = formatFeatures(tier)
              const isCurrentUserTier = isCurrentTier(tier.tierName)
              
              console.log(`Card styling for ${tier.tierName}:`, {
                isCurrentUserTier,
                authStatus,
                comparison: `${authStatus.userTier} === ${tier.tierName}`
              })
              
              return (
                <Card
                  key={tier.tierId || tier.tierName || `tier-${index}`}
                  className={`p-8 relative ${isCurrentUserTier ? "border-2 !border-teal-500 shadow-xl bg-teal-50" : "border border-gray-200"}`}
                >
                  {isCurrentUserTier && (
                    <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-teal-600 text-white text-sm px-4 py-1 rounded-full">
                      Your Plan
                    </div>
                  )}

                  <div className="mb-6">
                    <h3 className="text-2xl font-bold mb-2">{tier.displayName}</h3>
                    <p className="text-sm text-gray-600 mb-4">{tier.description}</p>
                    <div className="flex items-baseline gap-1">
                      <span className="text-5xl font-bold">
                        ${tier.priceUsd === 0 || tier.priceUsd === null || tier.priceUsd === undefined ? '0' : 
                          typeof tier.priceUsd === 'number' ? tier.priceUsd.toFixed(0) : '0'}
                      </span>
                      <span className="text-gray-600">
                        /{tier.billingType === 'free' ? 'forever' : 
                          tier.billingType === 'monthly' ? 'month' : 
                          tier.billingType === 'one_time' ? 'one-time' : 'month'}
                      </span>
                    </div>
                  </div>

                  <Button
                    variant={actionButton.variant}
                    disabled={actionButton.disabled}
                    className="w-full rounded-full mb-6"
                    onClick={() => {
                      if (!actionButton.disabled) {
                        // TODO: Implement tier change functionality
                        console.log(`Action: ${actionButton.text} to ${tier.tierName}`)
                      }
                    }}
                  >
                    {actionButton.text}
                  </Button>

                  <div className="space-y-3">
                    {features.map((feature, featureIndex) => (
                      <div key={`${tier.tierId || tier.tierName || index}-feature-${featureIndex}`} className="flex items-start gap-3">
                        <Check className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" />
                        <span className="text-sm text-gray-700">{feature}</span>
                      </div>
                    ))}
                  </div>
                </Card>
              )
            })}
          </div>
        )}

        {/* FAQ Section */}
        <div className="max-w-3xl mx-auto">
          <h2 className="text-3xl font-bold text-center mb-12">Frequently Asked Questions</h2>

          <div className="space-y-6">
            <div className="border-b pb-6">
              <h3 className="text-xl font-semibold mb-2">How does the free trial work?</h3>
              <p className="text-gray-600">
                Subscription plans come with a 7-day free trial. You can cancel anytime during the
                trial period without being charged.
              </p>
            </div>

            <div className="border-b pb-6">
              <h3 className="text-xl font-semibold mb-2">Can I change plans later?</h3>
              <p className="text-gray-600">
                Yes, you can upgrade or downgrade your plan at any time. Changes take effect immediately, and we&apos;ll
                prorate any charges.
              </p>
            </div>

            <div className="border-b pb-6">
              <h3 className="text-xl font-semibold mb-2">Which airlines are supported?</h3>
              <p className="text-gray-600">
                We support all major airlines including American, Delta, United, Southwest, and over 100 international
                carriers.
              </p>
            </div>

            <div className="border-b pb-6">
              <h3 className="text-xl font-semibold mb-2">How fast are the alerts?</h3>
              <p className="text-gray-600">
                Our system checks seat availability every 2-5 minutes and sends alerts within seconds of detecting a
                change.
              </p>
            </div>

            <div className="pb-6">
              <h3 className="text-xl font-semibold mb-2">What payment methods do you accept?</h3>
              <p className="text-gray-600">
                We accept all major credit cards (Visa, Mastercard, American Express) and PayPal for Business plans.
              </p>
            </div>
          </div>
        </div>

        {/* CTA Section */}
        <div className="mt-16 text-center bg-gray-50 rounded-2xl p-12">
          <h2 className="text-3xl font-bold mb-4">Ready to never miss your perfect seat?</h2>
          <p className="text-gray-600 mb-8 max-w-2xl mx-auto">
            Join thousands of travelers who use MySeatMap to get the seats they want on every flight.
          </p>
          <Link href="/auth/signup">
            <Button className="bg-black text-white hover:bg-gray-800 rounded-full px-6 sm:px-8 py-2 sm:py-3 text-sm sm:text-base cursor-pointer">
              Start Free Trial
            </Button>
          </Link>
        </div>
      </div>
    </div>
  )
}
