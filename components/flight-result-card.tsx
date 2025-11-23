"use client"

import React from "react"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Plane, Users, Bell, Loader2 } from 'lucide-react'
import { calculateSeatAvailability } from "./seatmap-renderer"
import type { Flight, FlightSegment } from "@/lib/api-helpers"

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
          <Button
            onClick={() => onViewSeatMap(flight.id)}
            className="bg-black text-white hover:bg-gray-800 rounded-full px-6 cursor-pointer"
          >
            View Seat Map
          </Button>
          
          {/* Only show Set Alert button for registered users */}
          {isUser && (
            <Button
              variant="outline"
              className="rounded-full px-6 bg-transparent text-black cursor-pointer"
              disabled={savingFlightBookmark === flight.id}
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
        </div>
      </div>
    </Card>
  )
}

export { FlightResultCard }