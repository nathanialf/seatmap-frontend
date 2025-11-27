"use client"

import { useEffect, useState, Suspense } from "react"
import { useSearchParams } from "next/navigation"
import { Navbar } from "@/components/navbar"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Plane, ArrowLeft, Loader2, AlertTriangle, MapPin, Calendar, Clock, Users } from "lucide-react"
import { SeatmapRenderer } from "@/components/seatmap-renderer"
import Link from "next/link"

function SeatMapContent() {
  const searchParams = useSearchParams()
  const bookmarkId = searchParams?.get('bookmarkId')
  
  const [seatMapData, setSeatMapData] = useState<Record<string, unknown> | null>(null)
  const [bookmarkData, setBookmarkData] = useState<Record<string, unknown> | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!bookmarkId) {
      setError('No bookmark ID provided')
      setLoading(false)
      return
    }

    const fetchSeatMapData = async () => {
      try {
        const response = await fetch(`/api/flight-search/bookmark/${bookmarkId}`, {
          method: 'GET',
          credentials: 'include',
        })

        const result = await response.json()

        if (result.success) {
          setSeatMapData(result.data)
          
          // Also fetch the bookmark data for flight info
          const bookmarkResponse = await fetch(`/api/bookmarks/${bookmarkId}`, {
            method: 'GET',
            credentials: 'include',
          })
          const bookmarkResult = await bookmarkResponse.json()
          if (bookmarkResult.success) {
            setBookmarkData(bookmarkResult.data)
          }
        } else {
          setError(result.message || 'Failed to load seat map')
        }
      } catch (err) {
        console.error('Failed to fetch seat map:', err)
        setError('Failed to load seat map')
      } finally {
        setLoading(false)
      }
    }

    fetchSeatMapData()
  }, [bookmarkId])

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navbar />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-gray-400 mr-3" />
            <span>Loading seat map...</span>
          </div>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navbar />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="mb-6">
            <Link href="/dashboard">
              <Button variant="outline" className="flex items-center gap-2">
                <ArrowLeft className="w-4 h-4" />
                Back to Dashboard
              </Button>
            </Link>
          </div>
          <Card className="p-8 text-center">
            <AlertTriangle className="w-12 h-12 text-red-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-red-600 mb-2">Error Loading Seat Map</h3>
            <p className="text-gray-600">{error}</p>
          </Card>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Back button */}
        <div className="mb-6">
          <Link href="/dashboard">
            <Button variant="outline" className="rounded-full mb-4 cursor-pointer">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Dashboard
            </Button>
          </Link>
        </div>

        {/* Flight Information Header */}
        {(() => {
          if (!bookmarkData) {
            return (
              <div className="space-y-6">
                <h1 className="text-3xl font-bold text-gray-900 mb-2">Seat Map Viewer</h1>
                <p className="text-gray-600">Loading flight information...</p>
              </div>
            );
          }
          try {
            const flightData = JSON.parse(bookmarkData.flightOfferData);
            const segments = flightData.itineraries?.[0]?.segments || [];
            const firstSegment = segments[0] || {};
            const lastSegment = segments[segments.length - 1] || {};
            
            const departureTime = firstSegment.departure?.at ? 
              new Date(firstSegment.departure.at).toLocaleTimeString('en-US', {
                hour: '2-digit',
                minute: '2-digit',
                hour12: true
              }) : 'N/A';
              
            const arrivalTime = lastSegment.arrival?.at ? 
              new Date(lastSegment.arrival.at).toLocaleTimeString('en-US', {
                hour: '2-digit',
                minute: '2-digit',
                hour12: true
              }) : 'N/A';
              
            const departureDate = firstSegment.departure?.at ? 
              new Date(firstSegment.departure.at).toLocaleDateString('en-US', {
                weekday: 'short',
                month: 'short',
                day: 'numeric',
                year: 'numeric'
              }) : 'N/A';
              
            const departureCode = firstSegment.departure?.iataCode || 'N/A';
            const arrivalCode = lastSegment.arrival?.iataCode || 'N/A';
            const flightNumber = `${firstSegment.carrierCode || ''} ${firstSegment.number || ''}`.trim();
            const carrierCode = firstSegment.carrierCode || 'Flight';
            
            // Calculate seat availability from seat map data if available
            const calculateSeatAvailability = () => {
              if (seatMapData?.data?.seatMap?.decks || seatMapData?.seatMap?.decks || seatMapData?.decks) {
                const decks = seatMapData.data?.seatMap?.decks || seatMapData?.seatMap?.decks || seatMapData?.decks;
                if (Array.isArray(decks)) {
                  let total = 0;
                  let available = 0;
                  decks.forEach(deck => {
                    if (deck.seats && Array.isArray(deck.seats)) {
                      deck.seats.forEach(seat => {
                        total++;
                        if (seat.status === 'AVAILABLE') {
                          available++;
                        }
                      });
                    }
                  });
                  return {
                    available,
                    total,
                    percentage: total > 0 ? Math.round((available / total) * 100) : 0
                  };
                }
              }
              return {
                available: flightData.numberOfBookableSeats || 'N/A',
                total: 'N/A',
                percentage: 'N/A'
              };
            };

            const seatAvailability = calculateSeatAvailability();

            return (
              <div className="space-y-6">
                <h1 className="text-3xl font-bold text-gray-900 mb-2">Seat Map Viewer</h1>
                <p className="text-gray-600">
                  {carrierCode} {flightNumber.split(' ')[1] || flightNumber} • {departureCode} → {arrivalCode}
                </p>
                
                <Card className="p-4">
                  <div className="flex flex-wrap items-center gap-4 text-sm">
                    <div className="flex items-center gap-2">
                      <Plane className="w-4 h-4 text-gray-400" />
                      <span className="font-semibold">{flightNumber}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <MapPin className="w-4 h-4 text-gray-400" />
                      <span>{departureCode} → {arrivalCode}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Calendar className="w-4 h-4 text-gray-400" />
                      <span>{departureDate}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Clock className="w-4 h-4 text-gray-400" />
                      <span>{departureTime} - {arrivalTime}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Users className="w-4 h-4 text-gray-400" />
                      <span className="text-teal-600 font-medium">
                        {seatAvailability.total !== 'N/A' 
                          ? `${seatAvailability.available} seats available (${seatAvailability.percentage}% of ${seatAvailability.total} total)`
                          : `${seatAvailability.available} seats available`
                        }
                      </span>
                    </div>
                  </div>
                </Card>
              </div>
            );
          } catch {
            return (
              <Card className="p-4 bg-yellow-50 border border-yellow-200 mb-6">
                <div className="text-sm text-yellow-700">
                  Unable to parse flight information from bookmark data.
                </div>
              </Card>
            );
          }
        })()}

        {/* Seat Map */}
        {seatMapData && (() => {
          const seatMapSources = [
            seatMapData.seatMap,
            seatMapData.data?.seatMap, 
            seatMapData.seatmap,
            seatMapData.data?.seatmap,
            seatMapData
          ].filter(Boolean);
          
          const seatMapSource = seatMapSources[0];
          
          if (seatMapSource) {
            return <SeatmapRenderer seatmapData={seatMapSource} />;
          } else {
            return (
              <Card className="p-8 text-center">
                <AlertTriangle className="w-12 h-12 text-yellow-400 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-yellow-600 mb-2">No Seat Map Available</h3>
                <p className="text-gray-600">Seat map data is not available for this flight.</p>
              </Card>
            );
          }
        })()}

        {/* Debug Data */}
        <Card className="mt-6 p-4 bg-blue-50 border border-blue-200">
          <div className="mb-2">
            <div className="flex items-center gap-2 mb-2">
              <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
              <span className="text-sm font-semibold text-blue-700">
                Seat Map API Response Structure
              </span>
            </div>
            <div className="text-xs text-blue-600 mb-2">
              Response keys: {seatMapData ? Object.keys(seatMapData).join(', ') : 'no data'}
            </div>
            <pre className="text-xs text-gray-600 overflow-x-auto bg-white rounded border p-3 max-h-60 overflow-y-auto whitespace-pre-wrap">
              {seatMapData ? JSON.stringify(seatMapData, null, 2) : 'No data'}
            </pre>
          </div>
        </Card>
      </div>
    </div>
  )
}

export default function SeatMapPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gray-50">
        <Navbar />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-gray-400 mr-3" />
            <span>Loading...</span>
          </div>
        </div>
      </div>
    }>
      <SeatMapContent />
    </Suspense>
  )
}
