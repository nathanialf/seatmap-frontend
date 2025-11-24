"use client"

import React from "react"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Plane, Users, Bell, Loader2 } from 'lucide-react'
import { calculateSeatAvailability } from "./seatmap-renderer"
import type { Flight, FlightSegment } from "@/lib/api-helpers"

// Helper function to determine flight availability status
function getFlightAvailabilityStatus(flight: Flight): 'FULL' | 'PARTIALLY_FULL' | null {
  if (!flight.seatmapData?.seats && !flight.segments) {
    return null // No seatmap data available
  }

  const availabilities: number[] = []

  if (flight.segments && flight.segments.length > 1) {
    // Multi-segment flight - check each segment
    flight.segments.forEach((segment: FlightSegment) => {
      const segmentSeats = flight.seatmapData?.decks?.[segment.segmentIndex]?.seats || []
      if (segmentSeats.length > 0) {
        const segmentAvailability = calculateSeatAvailability(segmentSeats)
        availabilities.push(segmentAvailability.available)
      }
    })
  } else if (flight.seatmapData?.seats) {
    // Single segment flight
    const availability = calculateSeatAvailability(flight.seatmapData.seats)
    availabilities.push(availability.available)
  }

  if (availabilities.length === 0) {
    return null // No valid seatmap data
  }

  // Check if all segments have 0 seats available
  if (availabilities.every(available => available === 0)) {
    return 'FULL'
  }
  
  // Check if at least one segment has 0 seats available
  if (availabilities.some(available => available === 0)) {
    return 'PARTIALLY_FULL'
  }

  return null // Flight has availability on all segments
}

interface FlightResultCardProps {
  flight: Flight
  isUser: boolean
  savingFlightBookmark?: number
  onViewSeatMap: (flightId: number) => void
  onSetAlert: (flightId: number) => void
}

const FlightResultCard: React.FC<FlightResultCardProps> = ({
  flight,
  isUser,
  savingFlightBookmark,
  onViewSeatMap,
  onSetAlert
}) => {
  return (
    <Card className="p-6 hover:shadow-lg transition-shadow">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6">
        <div className="flex-1">
          {/* Flight Header */}
          <div className="flex items-center gap-2 mb-4">
            <Plane className="w-5 h-5 text-gray-600" />
            <span className="font-semibold">{flight.airline}</span>
            <span className="text-sm text-gray-500">{flight.flightNumber}</span>
            {(() => {
              const status = getFlightAvailabilityStatus(flight)
              if (status === 'FULL') {
                return (
                  <span className="px-2 py-1 text-xs font-semibold bg-red-100 text-red-800 rounded-full">
                    FULL
                  </span>
                )
              }
              if (status === 'PARTIALLY_FULL') {
                return (
                  <span className="px-2 py-1 text-xs font-semibold bg-orange-100 text-orange-800 rounded-full">
                    PARTIALLY FULL
                  </span>
                )
              }
              return null
            })()}
          </div>

          {/* Flight Times and Route */}
          <div className="flex items-center gap-8">
            {/* Departure */}
            <div>
              <div className="text-2xl font-bold">{flight.departure.time}</div>
              <div className="text-sm text-gray-600">{flight.departure.code}</div>
              {flight.departure.city !== flight.departure.code && (
                <div className="text-xs text-gray-500">{flight.departure.city}</div>
              )}
            </div>

            {/* Duration and Connection Info */}
            <div className="flex-1 flex flex-col items-center">
              <div className="text-xs text-gray-500 mb-1">{flight.duration}</div>
              <div className="w-full h-px bg-gray-300 relative">
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-white px-2">
                  <Plane className="w-4 h-4 text-gray-400 rotate-90" />
                </div>
              </div>
              <div className="text-xs text-gray-500 mt-1">
                {flight.stops === 0 ? 'Non-stop' : 
                 flight.stops === 1 ? `1 stop in ${flight.connections[0]}` :
                 `${flight.stops} stops`}
              </div>
            </div>

            {/* Arrival */}
            <div>
              <div className="text-2xl font-bold">{flight.arrival.time}</div>
              <div className="text-sm text-gray-600">{flight.arrival.code}</div>
              {flight.arrival.city !== flight.arrival.code && (
                <div className="text-xs text-gray-500">{flight.arrival.city}</div>
              )}
            </div>
          </div>

          {/* Seat Availability */}
          <div className="mt-4 space-y-1 text-sm text-gray-600">
            {(() => {
              if (flight.seatmapData?.seats) {
                // Show per-segment availability for multi-segment flights
                if (flight.segments && flight.segments.length > 1) {
                  return flight.segments.map((segment: FlightSegment, _index: number) => {
                    // Only show availability for segments that actually have seatmap data
                    const segmentSeats = flight.seatmapData?.decks?.[segment.segmentIndex]?.seats || []
                    const hasSegmentSeatmap = segmentSeats.length > 0
                    
                    if (hasSegmentSeatmap) {
                      const segmentAvailability = calculateSeatAvailability(segmentSeats)
                      return (
                        <div key={segment.segmentIndex} className="flex items-center gap-1">
                          <Users className="w-4 h-4 text-gray-400" />
                          <span className="text-gray-600">
                            {segment.flightNumber} ({segment.departure.code} → {segment.arrival.code}): {segmentAvailability.available} seats available ({segmentAvailability.percentage}% of {segmentAvailability.total} total)
                          </span>
                        </div>
                      )
                    } else {
                      // Show segment info but no availability numbers
                      return (
                        <div key={segment.segmentIndex} className="flex items-center gap-1">
                          <Users className="w-4 h-4 text-gray-400" />
                          <span className="text-gray-600">
                            {segment.flightNumber} ({segment.departure.code} → {segment.arrival.code}): No seatmap data available
                          </span>
                        </div>
                      )
                    }
                  })
                } else {
                  // Single segment flight - show overall availability
                  const availability = calculateSeatAvailability(flight.seatmapData?.seats || [])
                  return (
                    <div className="flex items-center gap-1">
                      <Users className="w-4 h-4 text-gray-400" />
                      <span className="text-gray-600">
                        {availability.available} seats available ({availability.percentage}% of {availability.total} total)
                      </span>
                    </div>
                  )
                }
              }
              return (
                <div className="flex items-center gap-1">
                  <Users className="w-4 h-4 text-gray-400" />
                  <span className="text-gray-600">
                    {flight.availableSeats} seats available (estimated)
                  </span>
                </div>
              )
            })()}
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col gap-3">
          {(() => {
            const status = getFlightAvailabilityStatus(flight)
            const isUnavailable = status === 'FULL' || status === 'PARTIALLY_FULL'
            
            return (
              <>
                <Button
                  onClick={() => onViewSeatMap(flight.id)}
                  disabled={isUnavailable}
                  className={`rounded-full px-6 ${
                    isUnavailable 
                      ? 'bg-gray-300 text-gray-500 cursor-not-allowed' 
                      : 'bg-black text-white hover:bg-gray-800 cursor-pointer'
                  }`}
                >
                  View Seat Map
                </Button>
                
                {/* Only show Set Alert button for registered users */}
                {isUser && (
                  <Button
                    variant="outline"
                    className={`rounded-full px-6 bg-transparent ${
                      isUnavailable 
                        ? 'text-gray-400 border-gray-300 cursor-not-allowed' 
                        : 'text-black cursor-pointer'
                    }`}
                    disabled={savingFlightBookmark === flight.id || isUnavailable}
                    onClick={() => onSetAlert(flight.id)}
                  >
                    {savingFlightBookmark === flight.id ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Saving...
                      </>
                    ) : (
                      <>
                        <Bell className="w-4 h-4 mr-2" />
                        Set Alert
                      </>
                    )}
                  </Button>
                )}
              </>
            )
          })()}
        </div>
      </div>
    </Card>
  )
}

export { FlightResultCard }