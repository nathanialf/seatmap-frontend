"use client"

import React from "react"
import { Users, Plane, Calendar, Clock, MapPin } from 'lucide-react'
import { Card } from "@/components/ui/card"
import { calculateSeatAvailability, type SeatmapData } from "./seatmap-renderer"

export interface FlightSegment {
  segmentIndex: number
  carrier: string
  flightNumber: string
  route: string
  departure: {
    code: string
    time: string
  }
  arrival: {
    code: string
    time: string
  }
  aircraft?: string
  seatMapAvailable: boolean
  seatMapData?: SeatmapData
}

interface FlightSegmentDisplayProps {
  segments: FlightSegment[]
  seatmapData?: SeatmapData
  seatmapAvailable: boolean
  className?: string
}

const FlightSegmentDisplay: React.FC<FlightSegmentDisplayProps> = ({
  segments,
  seatmapData,
  seatmapAvailable,
  className = ""
}) => {
  if (!segments || segments.length <= 1) {
    return null // Don't render for single-segment flights
  }

  // Check how many segments have actual seatmap data
  const segmentsWithSeatmap = segments.filter(segment => 
    seatmapData?.decks?.[segment.segmentIndex]?.seats?.length > 0
  ).length
  
  const hasPartialSeatmap = segmentsWithSeatmap > 0 && segmentsWithSeatmap < segments.length
  const hasFullSeatmap = segmentsWithSeatmap === segments.length
  const hasNoSeatmap = segmentsWithSeatmap === 0

  return (
    <Card className={`p-4 ${className}`}>
      <div className="mb-4">
        <div className="flex items-center gap-2 mb-3">
          <Plane className="w-4 h-4 text-gray-600" />
          <span className="text-sm font-semibold text-gray-700">Multi-Segment Flight Details</span>
        </div>
        <div className="mb-3 bg-blue-50 rounded-lg p-3">
          <div className="flex items-center gap-2 mb-2">
            <div className={`w-3 h-3 rounded-full ${
              hasFullSeatmap ? 'bg-green-500' : 
              hasPartialSeatmap ? 'bg-yellow-500' : 'bg-red-500'
            }`}></div>
            <span className={`text-sm font-medium ${
              hasFullSeatmap ? 'text-green-700' : 
              hasPartialSeatmap ? 'text-yellow-700' : 'text-red-700'
            }`}>
              {hasFullSeatmap ? 'Seat Map Available for Entire Journey' : 
               hasPartialSeatmap ? `Seat Map Available for ${segmentsWithSeatmap} of ${segments.length} Segments` :
               'No Seat Map Available'}
            </span>
          </div>
          <p className="text-xs text-gray-600">
            {hasFullSeatmap 
              ? 'The seat map covers the entire multi-segment journey with deck configurations for different aircraft.'
              : hasPartialSeatmap 
                ? `Seat map data is available for ${segmentsWithSeatmap} segment${segmentsWithSeatmap === 1 ? '' : 's'} only. Other segments will show overall flight availability.`
                : 'Seat map data is not available for this connecting flight.'}
          </p>
        </div>
        <div className="space-y-2">
          <div className="text-xs font-medium text-gray-700 mb-2">Flight Segments:</div>
          {segments.map((segment) => {
            const { segmentAvailability, isOverallData, hasSegmentData } = (() => {
              // For multi-segment flights, only show data for segments that actually have seatmap data
              const segmentSeats = seatmapData?.decks?.[segment.segmentIndex]?.seats || []
              const hasSegmentSeatmap = segmentSeats.length > 0
              
              return {
                segmentAvailability: hasSegmentSeatmap ? calculateSeatAvailability(segmentSeats) : null,
                isOverallData: false, // No longer falling back to overall data
                hasSegmentData: hasSegmentSeatmap
              }
            })()
            
            return (
              <div key={segment.segmentIndex} className="bg-gray-50 rounded-lg p-3">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-gray-900">{segment.flightNumber}</span>
                    <span className="text-sm text-gray-600">{segment.route}</span>
                    {segment.aircraft && (
                      <span className="text-xs text-gray-500 bg-gray-200 px-2 py-1 rounded">{segment.aircraft}</span>
                    )}
                  </div>
                  {hasSegmentData ? (
                    <div className="flex items-center gap-1">
                      <Users className="w-3 h-3 text-gray-400" />
                      <span className="text-xs text-green-600 font-medium">
                        {segmentAvailability!.available}/{segmentAvailability!.total} available
                      </span>
                    </div>
                  ) : (
                    <div className="flex items-center gap-1">
                      <div className="w-3 h-3 rounded-full bg-red-400"></div>
                      <span className="text-xs text-red-600 font-medium">
                        No seatmap data
                      </span>
                    </div>
                  )}
                </div>
                <div className="flex items-center gap-4 text-xs text-gray-500">
                  <span>Departure: {segment.departure.time}</span>
                  <span>Arrival: {segment.arrival.time}</span>
                  {segmentAvailability && segmentAvailability.total > 0 && (
                    <span className="text-green-600">({segmentAvailability.percentage}% available)</span>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </Card>
  )
}

export { FlightSegmentDisplay }