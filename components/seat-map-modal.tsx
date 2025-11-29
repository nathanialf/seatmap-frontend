"use client"

import React, { useState, useCallback } from "react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Plane, MapPin, Calendar, Clock, Users, ArrowLeft, Loader2 } from "lucide-react"
import { SeatmapRenderer } from "@/components/seatmap-renderer"
import { FlightSegmentDisplay } from "@/components/flight-segment-display"
import { type BookmarkItem } from "@/components/saved-item-card"

interface SeatMapModalProps {
  selectedBookmark: BookmarkItem | null
  onClose: () => void
}

export function SeatMapModal({ 
  selectedBookmark, 
  onClose
}: SeatMapModalProps) {
  const [flightWithSeatMap, setFlightWithSeatMap] = useState<unknown>(null)
  const [seatMapLoading, setSeatMapLoading] = useState(true)
  const [loadError, setLoadError] = useState<string | null>(null)

  const handleViewSeatMap = useCallback(async (bookmark: BookmarkItem) => {
    if (bookmark.itemType !== 'BOOKMARK') {
      setLoadError('Invalid bookmark type')
      setSeatMapLoading(false)
      return
    }

    setSeatMapLoading(true)
    setLoadError(null)

    try {
      // Parse the flight offer data that's already in memory
      const flightOfferData = JSON.parse(bookmark.flightOfferData!)
      console.log('SeatMapModal: Loading seat map for bookmark:', bookmark.bookmarkId)
      
      // Call the seat map API to get seat map data for this flight
      const response = await fetch(`/api/flight-search/bookmark/${bookmark.bookmarkId}`, {
        method: 'GET',
        credentials: 'include',
      })
      
      const result = await response.json()
      console.log('SeatMapModal: API response:', result)
      
      if (result.success && result.data) {
        // Extract actual flight number from flight offer data
        const segments = flightOfferData.itineraries?.[0]?.segments || []
        const firstSegment = segments[0] || {}
        const flightNumber = `${firstSegment.carrierCode || ''} ${firstSegment.number || ''}`.trim()
        
        // Construct flight object like in search results
        const flight = {
          ...flightOfferData,
          seatmapData: result.data,
          flightNumber: flightNumber,
          id: flightNumber || bookmark.bookmarkId,
          segments: segments.map((segmentData: Record<string, unknown>, index: number) => {
            const segment = segmentData as {
              carrierCode?: string
              number?: string
              departure?: { iataCode?: string; at?: string }
              arrival?: { iataCode?: string; at?: string }
              aircraft?: { code?: string }
            }
            
            return {
              segmentIndex: index,
              carrier: segment.carrierCode || '',
              flightNumber: `${segment.carrierCode || ''} ${segment.number || ''}`.trim(),
              route: `${segment.departure?.iataCode || ''} → ${segment.arrival?.iataCode || ''}`,
              departure: {
                code: segment.departure?.iataCode || '',
                time: segment.departure?.at ? new Date(segment.departure.at).toLocaleTimeString('en-US', {
                  hour: '2-digit',
                  minute: '2-digit',
                  hour12: true
                }) : ''
              },
              arrival: {
                code: segment.arrival?.iataCode || '',
                time: segment.arrival?.at ? new Date(segment.arrival.at).toLocaleTimeString('en-US', {
                  hour: '2-digit',
                  minute: '2-digit',
                  hour12: true
                }) : ''
              },
              aircraft: segment.aircraft?.code || undefined,
              seatMapAvailable: !!result.data?.seatMap,
              seatMapData: result.data?.seatMap
            }
          })
        }
        
        console.log('SeatMapModal: Created flight object:', flight)
        setFlightWithSeatMap(flight)
      } else {
        const errorMsg = result.message || 'Failed to get seat map data'
        console.error('SeatMapModal: API error:', errorMsg)
        setLoadError(errorMsg)
      }
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : 'Failed to process flight bookmark'
      console.error('SeatMapModal: Error:', error)
      setLoadError(errorMsg)
    } finally {
      setSeatMapLoading(false)
    }
  }, [])

  // Load seat map when selectedBookmark changes
  React.useEffect(() => {
    if (selectedBookmark && selectedBookmark.itemType === 'BOOKMARK') {
      handleViewSeatMap(selectedBookmark)
      // Scroll to top
      window.scrollTo({ top: 0, behavior: 'smooth' })
    }
  }, [selectedBookmark, handleViewSeatMap])

  // Reset state when modal closes
  React.useEffect(() => {
    if (!selectedBookmark) {
      setFlightWithSeatMap(null)
    }
  }, [selectedBookmark])

  if (!selectedBookmark) {
    return null
  }

  if (seatMapLoading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <Button
            onClick={onClose}
            variant="outline"
            className="rounded-full mb-4 cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Dashboard
          </Button>
          <div className="flex items-center justify-center py-16">
            <div className="text-center">
              <Loader2 className="w-8 h-8 animate-spin text-gray-400 mx-auto mb-4" />
              <div className="text-gray-600">Loading seat map...</div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  if (loadError) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <Button
            onClick={onClose}
            variant="outline"
            className="rounded-full mb-4 cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Dashboard
          </Button>
          <div className="text-center py-16">
            <div className="text-red-600 font-semibold mb-2">Failed to load seat map</div>
            <div className="text-gray-600 text-sm">{loadError}</div>
          </div>
        </div>
      </div>
    )
  }

  if (!flightWithSeatMap) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <Button
            onClick={onClose}
            variant="outline"
            className="rounded-full mb-4 cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Dashboard
          </Button>
          <div className="text-center py-16">
            <div className="text-gray-600">No seat map data available</div>
          </div>
        </div>
      </div>
    )
  }

  const flight = flightWithSeatMap

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-6">
          <Button
            onClick={onClose}
            variant="outline"
            className="rounded-full mb-4 cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Dashboard
          </Button>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Seat Map Viewer</h1>
          <p className="text-gray-600">
            {flight.flightNumber || 'Flight'} • {flight.itineraries?.[0]?.segments?.[0]?.departure?.iataCode} → {flight.itineraries?.[0]?.segments?.[flight.itineraries[0].segments.length - 1]?.arrival?.iataCode}
          </p>
        </div>

        <div className="space-y-6">
          <Card className="p-4">
            <div className="flex flex-wrap items-center gap-4 text-sm">
              <div className="flex items-center gap-2">
                <Plane className="w-4 h-4 text-gray-400" />
                <span className="font-semibold">{flight.flightNumber}</span>
              </div>
              <div className="flex items-center gap-2">
                <MapPin className="w-4 h-4 text-gray-400" />
                <span>
                  {flight.itineraries?.[0]?.segments?.[0]?.departure?.iataCode} → {flight.itineraries?.[0]?.segments?.[flight.itineraries[0].segments.length - 1]?.arrival?.iataCode}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <Calendar className="w-4 h-4 text-gray-400" />
                <span>{flight.itineraries?.[0]?.segments?.[0]?.departure?.at ? new Date(flight.itineraries[0].segments[0].departure.at).toLocaleDateString() : 'N/A'}</span>
              </div>
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4 text-gray-400" />
                <span>
                  {flight.itineraries?.[0]?.segments?.[0]?.departure?.at ? new Date(flight.itineraries[0].segments[0].departure.at).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true }) : 'N/A'} - {flight.itineraries?.[0]?.segments?.[flight.itineraries[0].segments.length - 1]?.arrival?.at ? new Date(flight.itineraries[0].segments[flight.itineraries[0].segments.length - 1].arrival.at).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true }) : 'N/A'}
                </span>
              </div>
              {/* Only show total seat availability for single segment flights */}
              {flight.itineraries?.[0]?.segments?.length === 1 && (
                <div className="flex items-center gap-2">
                  <Users className="w-4 h-4 text-gray-400" />
                  <span className="text-teal-600 font-medium">
                    {(() => {
                      if (flight.seatmapData?.seatMap?.decks) {
                        const allSeats = flight.seatmapData.seatMap.decks.flatMap((deck: { seats?: unknown[] }) => deck.seats || []);
                        const availableSeats = allSeats.filter((seat: { availabilityStatus?: string }) => seat.availabilityStatus === 'AVAILABLE');
                        const totalSeats = allSeats.length;
                        const percentage = totalSeats > 0 ? Math.round((availableSeats.length / totalSeats) * 100) : 0;
                        return `${availableSeats.length} seats available (${percentage}% of ${totalSeats} total)`;
                      }
                      return `${flight.numberOfBookableSeats || 'N/A'} seats available`;
                    })()}
                  </span>
                </div>
              )}
            </div>
          </Card>

          {/* Multi-segment flight details */}
          <FlightSegmentDisplay
            segments={flight.segments || []}
            seatmapData={flight.seatmapData?.seatMap}
            seatmapAvailable={!!flight.seatmapData?.seatMap}
          />

          {(() => {
            // The seat map API returns the full flight offer with seatMap property
            if (flight.seatmapData?.seatMap?.decks && Array.isArray(flight.seatmapData.seatMap.decks)) {
              return <SeatmapRenderer seatmapData={flight.seatmapData.seatMap} />;
            } else {
              return (
                <Card className="p-4 sm:p-6">
                  <div className="text-center py-12">
                    <Plane className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                    <h3 className="text-lg font-semibold text-gray-700 mb-2">
                      {flight.seatmapData ? 'Invalid Seat Map Data' : 'No Seat Map Available'}
                    </h3>
                    <p className="text-gray-500">
                      {flight.seatmapData 
                        ? 'The seat map data structure is not in the expected format.'
                        : 'Seat map information is not available for this flight.'}
                    </p>
                    {flight.seatmapData && (
                      <details className="mt-4 text-left">
                        <summary className="cursor-pointer text-sm text-gray-400">Debug: Show seat map data structure</summary>
                        <pre className="text-xs text-gray-600 mt-2 p-2 bg-gray-100 rounded overflow-auto max-h-40">
                          {JSON.stringify(flight.seatmapData, null, 2)}
                        </pre>
                      </details>
                    )}
                  </div>
                </Card>
              );
            }
          })()}
        </div>
      </div>
    </div>
  )
}