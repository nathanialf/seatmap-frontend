"use client"

import React, { useState, useCallback } from "react"
import { useRouter, useSearchParams } from 'next/navigation'
import { Navbar } from "@/components/navbar"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Plane, MapPin, Bell, Search, ArrowLeft, Calendar, Clock, Users, AlertCircle, Loader2 } from 'lucide-react'
import { 
  type FlightSearchParams,
  type Flight
} from "@/lib/api-helpers"
import { useAuth } from '@/hooks/useAuth'
import { SeatmapRenderer, calculateSeatAvailability } from "@/components/seatmap-renderer"
import { FlightSearchForm } from "@/components/flight-search-form"
import { FlightSegmentDisplay } from "@/components/flight-segment-display"
import { FlightResultCard } from "@/components/flight-result-card"
import { CompactSearchForm } from "@/components/compact-search-form"
import { FlightAlertDialog, type FlightAlertDetails } from "@/components/flight-alert-dialog"
import { SearchAlertDialog } from "@/components/search-alert-dialog"
import { 
  formatTravelClassForDisplay, 
  transformFlightData,
  createFlightOfferData
} from "@/lib/flight-utils"
import logger from "@/lib/logger"


export default function SearchPage() {
  const router = useRouter()
  const urlSearchParams = useSearchParams()

  // Derive search state from URL parameters
  const from = urlSearchParams.get("from")
  const to = urlSearchParams.get("to")
  const date = urlSearchParams.get("date")
  const airline = urlSearchParams.get("airline")
  const flightNumber = urlSearchParams.get("flight")
  const seatClass = urlSearchParams.get("seatClass")

  const hasSearched = !!(from && to && date)
  const [selectedFlightForSeatMap, setSelectedFlightForSeatMap] = useState<number | null>(null)
  const [isAlertDialogOpen, setIsAlertDialogOpen] = useState(false)
  const [selectedFlightForAlert, setSelectedFlightForAlert] = useState<number | null>(null)
  const [showAlertSuccess, setShowAlertSuccess] = useState(false)
  const [isSearchAlertDialogOpen, setIsSearchAlertDialogOpen] = useState(false)
  const [selectedFlight, setSelectedFlight] = useState<FlightAlertDetails | null>(null) // State to hold details for the flight alert dialog
  
  // Auth and bookmark state
  const { isUser, hasFreeTier } = useAuth()
  const [isSavingBookmark, setIsSavingBookmark] = useState(false)
  const [bookmarkError, setBookmarkError] = useState<string | null>(null)
  const [savingFlightBookmark, setSavingFlightBookmark] = useState<number | null>(null)
  
  // API integration state
  const [flights, setFlights] = useState<Flight[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const [availabilityThreshold, setAvailabilityThreshold] = useState<number>(30)
  const [seatCountThreshold, setSeatCountThreshold] = useState<number>(30)


  const searchParams = {
    origin: from || "",
    destination: to || "",
    date: date || "",
    airline: airline || "",
    flightNumber: flightNumber || "",
    seatClass: seatClass || "",
  }





  // Handler for the new FlightSearchForm component
  const handleFormSubmit = (searchParams: FlightSearchParams) => {
    const params = new URLSearchParams()
    params.set("from", searchParams.origin)
    params.set("to", searchParams.destination)
    params.set("date", searchParams.date)
    if (searchParams.airline?.trim()) params.set("airline", searchParams.airline.trim())
    if (searchParams.flightNumber?.trim()) params.set("flight", searchParams.flightNumber.trim())
    if (searchParams.seatClass?.trim()) params.set("seatClass", searchParams.seatClass.trim())

    router.push(`/search?${params.toString()}`)
  }

  const handleNewSearch = () => {
    router.push("/search")
    setFlights([]) // Clear flights
    setError(null) // Clear any errors
  }

  // Fetch flights from local API route
  const fetchFlights = useCallback(async (searchParams: FlightSearchParams): Promise<void> => {
    try {
      setIsLoading(true)
      setError(null)

      // Make API call to local Next.js API route
      const response = await fetch('/api/flight-search', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(searchParams),
      })

      const data = await response.json()

      if (!response.ok) {
        logger.warn('Flight search validation issue:', {
          status: response.status,
          statusText: response.statusText,
          message: data.message,
          searchParams
        })
        
        // Set user-friendly error message for display
        setError(data.message || `Failed to search flights (${response.status})`)
        return
      }

      if (data.success && data.data) {
        logger.log('Transforming API response:', {
          hasData: !!data.data,
          dataType: Array.isArray(data.data) ? 'array' : typeof data.data,
          dataLength: Array.isArray(data.data) ? data.data.length : 'not array',
          sampleKeys: data.data?.[0] ? Object.keys(data.data[0]) : 'no sample',
          fullStructure: {
            hasDataArray: !!data.data.data,
            dataArrayLength: Array.isArray(data.data.data) ? data.data.data.length : 'not array',
            hasDictionaries: !!data.data.dictionaries,
            sampleFlightKeys: data.data.data?.[0] ? Object.keys(data.data.data[0]) : 'no sample flight'
          }
        });
        
        try {
          // Transform backend response to frontend format
          // Backend returns { data: [flight1, flight2, ...], meta: {}, dictionaries: {} }
          // We need to convert each flight object to our frontend Flight type
          const backendFlights = data.data.data || []; // Array of flight objects from backend
          const dictionaries = data.data.dictionaries || {}; // Carrier code to name mapping
          
          logger.log('About to transform flights:', {
            backendFlightsCount: backendFlights.length,
            firstFlight: backendFlights[0] ? {
              hasItineraries: !!backendFlights[0].itineraries,
              itinerariesLength: backendFlights[0].itineraries?.length,
              firstSegment: backendFlights[0].itineraries?.[0]?.segments?.[0] ? {
                carrierCode: backendFlights[0].itineraries[0].segments[0].carrierCode,
                number: backendFlights[0].itineraries[0].segments[0].number,
                departure: backendFlights[0].itineraries[0].segments[0].departure?.iataCode,
                arrival: backendFlights[0].itineraries[0].segments[0].arrival?.iataCode
              } : 'no segment'
            } : 'no flight'
          });
          
          const transformedFlights = transformFlightData(backendFlights, dictionaries)
        
        logger.log('Transformation result:', {
          inputLength: Array.isArray(data.data) ? data.data.length : 'not array',
          outputLength: transformedFlights.length,
          sampleOutput: transformedFlights[0] ? Object.keys(transformedFlights[0]) : 'no output',
          flightDetails: transformedFlights.map(f => ({
            id: f.id,
            airline: f.airline,
            flightNumber: f.flightNumber,
            route: `${f.departure.code} → ${f.arrival.code}`,
            date: f.date
          }))
        });
        
        setFlights(transformedFlights)
        
        } catch (transformError) {
          logger.error('Transformation error:', transformError);
          setError('Failed to process flight data');
          setFlights([]);
        }
      } else {
        throw new Error(data.message || 'Failed to fetch flights')
      }
    } catch (err) {
      logger.error('Flight search error:', err)
      setError(err instanceof Error ? err.message : 'Failed to search for flights')
      setFlights([]) // Clear flights on error
    } finally {
      setIsLoading(false)
    }
  }, []) // Empty dependency array since fetchFlights doesn't depend on any props or state


  // Fetch flights on initial page load if search parameters are present
  React.useEffect(() => {
    if (hasSearched && from && to && date) {
      const searchApiParams: FlightSearchParams = {
        origin: from,
        destination: to,
        date,
        airline: airline || undefined,
        flightNumber: flightNumber || undefined,
        seatClass: seatClass || undefined,
      }
      fetchFlights(searchApiParams)
    }
  }, [hasSearched, from, to, date, airline, flightNumber, seatClass, fetchFlights]) // Re-run when URL params change





  const handleSetSearchAlert = () => {
    // Just open the dialog - bookmark creation will happen in the dialog
    setIsSearchAlertDialogOpen(true)
  }

  const handleConfirmSearchAlert = async (bookmarkName: string, setAlert: boolean, alertSettings?: { availabilityThreshold: number }) => {
    try {
      logger.log('handleConfirmSearchAlert called with:', { bookmarkName, setAlert, alertSettings, isUser })
      
      // Create bookmark with custom name
      if (isUser) {
        setIsSavingBookmark(true)
        
        // Build search request object from current search params
        const searchRequest: Record<string, unknown> = {
          origin: searchParams.origin,
          destination: searchParams.destination,
          departureDate: searchParams.date,
          maxResults: 10
        }

        // Only include optional fields if they have values
        if (searchParams.seatClass?.trim()) {
          searchRequest.travelClass = searchParams.seatClass.trim()
        }
        
        if (searchParams.airline?.trim()) {
          const airline = searchParams.airline.trim()
          // Only include if it's 2-3 uppercase letters to match backend validation
          if (/^[A-Z]{2,3}$/.test(airline)) {
            searchRequest.airlineCode = airline
          }
        }
        
        if (searchParams.flightNumber?.trim()) {
          const flightNum = searchParams.flightNumber.trim()
          // Only include if it's 1-4 digits to match backend validation
          if (/^[0-9]{1,4}$/.test(flightNum)) {
            searchRequest.flightNumber = flightNum
          }
        }
        
        logger.log('Creating bookmark with data:', {
          itemType: 'SAVED_SEARCH',
          title: bookmarkName,
          searchRequest: searchRequest
        })
        
        const response = await fetch('/api/bookmarks', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          credentials: 'include',
          body: JSON.stringify({
            itemType: 'SAVED_SEARCH',
            title: bookmarkName,
            searchRequest: searchRequest
          }),
        })

        logger.log('Bookmark API response:', response.status, response.statusText)
        
        if (!response.ok) {
          const errorText = await response.text()
          logger.error('Bookmark API error:', errorText)
          throw new Error(`Failed to save bookmark: ${response.status}`)
        }
        
        const result = await response.json()
        logger.log('Bookmark created successfully:', result)
      } else {
        logger.log('User not authenticated, skipping bookmark creation')
      }

      // If alert was requested, log the alert settings (since alerts are under construction)
      if (setAlert && alertSettings) {
        logger.log("[v0] Search alert set for:", searchParams, "Alert settings:", alertSettings)
      }

      setIsSearchAlertDialogOpen(false)
      setAvailabilityThreshold(30)
      setShowAlertSuccess(true)
      setTimeout(() => {
        setShowAlertSuccess(false)
      }, 3000)
    } catch (error) {
      logger.error('Failed to save search bookmark:', error)
      setBookmarkError('Failed to save search')
    } finally {
      setIsSavingBookmark(false)
    }
  }


  const handleSetAlert = (flightId: number) => {
    // Find the flight details to populate the alert dialog
    const flight = flights.find((f) => f.id === flightId)
    if (flight) {
      const dateMatch = flight.date.match(/(\w+)\s+(\d+),\s+(\d+)/)
      let formattedDate = flight.date

      if (dateMatch) {
        const monthName = dateMatch[1]
        const day = dateMatch[2]
        const year = dateMatch[3]

        const monthMap: { [key: string]: number } = {
          Jan: 0,
          Feb: 1,
          Mar: 2,
          Apr: 3,
          May: 4,
          Jun: 5,
          Jul: 6,
          Aug: 7,
          Sep: 8,
          Oct: 9,
          Nov: 10,
          Dec: 11,
        }

        const monthIndex = monthMap[monthName]
        if (monthIndex !== undefined) {
          const dateObj = new Date(Number.parseInt(year), monthIndex, Number.parseInt(day))
          formattedDate = dateObj.toLocaleDateString("en-US", {
            weekday: "short",
            month: "short",
            day: "numeric",
            year: "numeric",
          })
        }
      }

      setSelectedFlight({
        airline: flight.airline,
        flightNumber: flight.flightNumber,
        from: flight.departure.code,
        to: flight.arrival.code,
        date: formattedDate,
        departureTime: flight.departure.time,
        arrivalTime: flight.arrival.time,
      })
    }
    setSelectedFlightForAlert(flightId) // This might still be useful for backend logic
    setIsAlertDialogOpen(true)
  }

  const handleConfirmAlert = async (bookmarkName: string, setAlert: boolean, alertSettings?: { seatCountThreshold: number }) => {
    try {
      // Create bookmark with custom name
      if (isUser && selectedFlightForAlert !== null) {
        setSavingFlightBookmark(selectedFlightForAlert)
        const flight = flights.find((f) => f.id === selectedFlightForAlert)
        if (flight) {
          const flightOfferData = createFlightOfferData(flight)
          logger.log('Creating flight bookmark with data:', {
            itemType: 'BOOKMARK',
            title: bookmarkName,
            flightOfferData: flightOfferData
          })
          
          const response = await fetch('/api/bookmarks', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            credentials: 'include',
            body: JSON.stringify({
              itemType: 'BOOKMARK',
              title: bookmarkName,
              flightOfferData: JSON.stringify(flightOfferData)
            }),
          })

          logger.log('Flight bookmark API response:', response.status, response.statusText)
          
          if (!response.ok) {
            const errorText = await response.text()
            logger.error('Flight bookmark API error:', errorText)
            throw new Error(`Failed to save bookmark: ${response.status}`)
          }
          
          const result = await response.json()
          logger.log('Flight bookmark created successfully:', result)
        }
      }

      // If alert was requested, log the alert settings (since alerts are under construction)
      if (setAlert && alertSettings) {
        logger.log("[v0] Alert set for flight:", selectedFlightForAlert, "Alert settings:", alertSettings)
      }

      setIsAlertDialogOpen(false)
      setSeatCountThreshold(50)
      setShowAlertSuccess(true)
      setTimeout(() => {
        setShowAlertSuccess(false)
      }, 3000)
    } catch (error) {
      logger.error('Failed to save flight bookmark:', error)
      setBookmarkError('Failed to save flight')
    } finally {
      setSavingFlightBookmark(null)
    }
  }

  // Scroll to top when seat map viewer becomes visible
  React.useEffect(() => {
    if (selectedFlightForSeatMap !== null) {
      window.scrollTo({ top: 0, behavior: 'smooth' })
    }
  }, [selectedFlightForSeatMap])

  if (selectedFlightForSeatMap !== null) {
    const flight = flights.find((f) => f.id === selectedFlightForSeatMap)
    if (!flight) return null

    return (
      <div className="min-h-screen bg-gray-50">
        <Navbar />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="mb-6">
            <Button
              onClick={() => setSelectedFlightForSeatMap(null)}
              variant="outline"
              className="rounded-full mb-4 cursor-pointer"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Results
            </Button>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Seat Map Viewer</h1>
            <p className="text-gray-600">
              {flight.airline} {flight.flightNumber.split(' ')[1] || flight.flightNumber} • {flight.departure.code} → {flight.arrival.code}
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
                    {flight.departure.code} → {flight.arrival.code}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-gray-400" />
                  <span>{flight.date}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Clock className="w-4 h-4 text-gray-400" />
                  <span>
                    {flight.departure.time} - {flight.arrival.time}
                  </span>
                </div>
                {/* Only show total seat availability for single segment flights */}
                {flight.segments.length === 1 && (
                  <div className="flex items-center gap-2">
                    <Users className="w-4 h-4 text-gray-400" />
                    <span className="text-teal-600 font-medium">
                      {(() => {
                        if (flight.seatmapData?.seats) {
                          const availability = calculateSeatAvailability(flight.seatmapData?.seats || [])
                          return `${availability.available} seats available (${availability.percentage}% of ${availability.total} total)`
                        }
                        return `${flight.availableSeats} seats available (estimated)`
                      })()}
                    </span>
                  </div>
                )}
              </div>
            </Card>

            <FlightSegmentDisplay
              segments={flight.segments}
              seatmapData={flight.seatmapData}
              seatmapAvailable={flight.seatmapAvailable}
            />

            {/* Overall Seatmap Data JSON Display */}
            {flight.seatmapData && (
              <Card className="p-4">
                <div className="mb-4">
                  <div className="flex items-center gap-2 mb-2">
                    {flight.seatmapData.seats ? (
                      <div className="w-2 h-2 bg-teal-500 rounded-full"></div>
                    ) : (
                      <div className="w-2 h-2 bg-yellow-500 rounded-full"></div>
                    )}
                    <span className="text-sm font-semibold text-gray-700">
                      {flight.seatmapData.seats ? 'Seat Map Data Available' : 'Seat Map Structure (No Seat Data)'}
                    </span>
                  </div>
                  <pre className="text-xs text-gray-600 overflow-x-auto bg-gray-50 rounded border p-3 max-h-60 overflow-y-auto">
                    {JSON.stringify(flight.seatmapData, null, 2)}
                  </pre>
                </div>
              </Card>
            )}

            {!flight.seatmapData && (
              <Card className="p-4">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-red-500 rounded-full"></div>
                  <span className="text-sm font-semibold text-red-700">No Seat Map Data Available</span>
                </div>
              </Card>
            )}

            {/* Actual Seat Map Visualization */}
            {flight.seatmapData && flight.seatmapData.decks && Array.isArray(flight.seatmapData.decks) ? (
              <SeatmapRenderer seatmapData={flight.seatmapData} />
            ) : (
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
                </div>
              </Card>
            )}
          </div>
        </div>
      </div>
    )
  }

  if (!hasSearched) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navbar />

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="mb-8 text-center">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Search Flights</h1>
            <p className="text-gray-600">Find your perfect flight and track seat availability</p>
          </div>

          <FlightSearchForm
            initialValues={searchParams}
            onSubmit={handleFormSubmit}
            isLoading={isLoading}
            className="mb-6 md:mb-8"
          />
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {showAlertSuccess && (
          <div className="fixed top-4 left-0 right-0 z-50 flex justify-center px-4 animate-in fade-in slide-in-from-top-2 duration-300">
            <div className="bg-white rounded-full shadow-lg border border-gray-200 px-4 py-2 md:px-6 md:py-3 flex items-center gap-2 md:gap-3 max-w-[90%] md:max-w-md">
              <div className="w-2 h-2 bg-teal-500 rounded-full flex-shrink-0"></div>
              <p className="text-xs md:text-sm font-medium text-gray-900">
                Alert set! Check your dashboard to <span className="whitespace-nowrap">manage it.</span>
              </p>
            </div>
          </div>
        )}

        <button
          onClick={handleNewSearch}
          className="flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-6 transition-colors cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back</span>
        </button>

        <CompactSearchForm
          initialValues={searchParams}
          onSubmit={handleFormSubmit}
          isLoading={isLoading}
        />

        <div className="mb-6 flex flex-col md:flex-row items-start md:items-center md:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 mb-2">Flight Search Results</h1>
            <div className="flex flex-wrap items-center gap-2 text-gray-600">
              <span className="text-lg">
                <span className="font-semibold">{searchParams.origin}</span>
                {" → "}
                <span className="font-semibold">{searchParams.destination}</span>
              </span>
              <span className="text-gray-400">•</span>
              <span>
                {(() => {
                  const [year, month, day] = searchParams.date.split("-").map(Number)
                  return new Date(year, month - 1, day).toLocaleDateString("en-US", {
                    weekday: "short",
                    month: "short",
                    day: "numeric",
                    year: "numeric",
                  })
                })()}
              </span>
              {searchParams.seatClass && (
                <>
                  <span className="text-gray-400">•</span>
                  <span>{formatTravelClassForDisplay(searchParams.seatClass)}</span>
                </>
              )}
            </div>
          </div>
          {/* CHANGE: Removed duplicate Set Search Alert button - keeping only the elegant banner below */}
        </div>

        {/* Set Search Alert card - only show for registered users with paid tiers when there are flight results */}
        {isUser && !hasFreeTier && !isLoading && !error && flights.length > 0 && (
          <div className="mb-6 bg-white border-2 border-teal-600 rounded-xl p-4 shadow-sm">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-full bg-teal-100 flex items-center justify-center flex-shrink-0">
                  <Bell className="w-5 h-5 text-teal-600" />
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900 mb-1">Monitor All Flights on This Route</h3>
                  <p className="text-sm text-gray-600">
                    Get notified when seat availability changes for any flight matching your search criteria
                  </p>
                </div>
              </div>
              <Button
                onClick={handleSetSearchAlert}
                disabled={isSavingBookmark}
                className="w-full md:w-auto bg-teal-600 text-white hover:bg-teal-700 disabled:bg-gray-400 disabled:cursor-not-allowed rounded-full px-6 py-3 cursor-pointer transition-all flex-shrink-0 whitespace-nowrap"
              >
                {isSavingBookmark ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    <span className="font-medium">Saving...</span>
                  </>
                ) : (
                  <>
                    <Search className="w-4 h-4 mr-2" />
                    <span className="font-medium">Set Search Alert</span>
                  </>
                )}
              </Button>
            </div>
          </div>
        )}

        {/* Bookmark Error State */}
        {bookmarkError && (
          <div className="mb-6 bg-red-50 border border-red-200 rounded-lg p-4">
            <div className="flex items-center gap-2">
              <AlertCircle className="w-5 h-5 text-red-600" />
              <p className="text-red-700 font-medium">Failed to save search</p>
            </div>
            <p className="text-red-600 text-sm mt-1">{bookmarkError}</p>
          </div>
        )}

        {/* Loading State */}
        {isLoading && (
          <div className="flex flex-col items-center justify-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-gray-400 mb-4" />
            <p className="text-gray-600">Searching for flights...</p>
            <p className="text-sm text-gray-500 mt-1">This may take a few seconds</p>
          </div>
        )}

        {/* Error State */}
        {error && !isLoading && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-6">
            <div className="flex items-center gap-3">
              <AlertCircle className="w-6 h-6 text-red-600 flex-shrink-0" />
              <div>
                <h3 className="font-semibold text-red-800">Search Failed</h3>
                <p className="text-red-700 mt-1">{error}</p>
                <Button 
                  onClick={() => {
                    const searchApiParams: FlightSearchParams = {
                      origin: from || "",
                      destination: to || "",
                      date: date || "",
                      airline: airline || undefined,
                      flightNumber: flightNumber || undefined,
                      seatClass: seatClass || undefined,
                    }
                    fetchFlights(searchApiParams)
                  }}
                  variant="outline" 
                  className="mt-3 rounded-full border-red-300 text-red-700 hover:bg-red-100"
                >
                  Try Again
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* Results Count */}
        {!isLoading && !error && (
          <div className="mb-6">
            <p className="text-sm text-gray-600">
              {flights.length === 0 ? "No flights found" : `${flights.length} flights found`}
            </p>
          </div>
        )}

        {/* Flight Results */}
        {!isLoading && !error && (
          <div className="space-y-4">
            {flights.length === 0 ? (
              <div className="text-center py-12">
                <Plane className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-gray-700 mb-2">No flights found</h3>
                <p className="text-gray-500 mb-4">Try adjusting your search criteria or search date.</p>
                <Button 
                  onClick={handleNewSearch}
                  variant="outline"
                  className="rounded-full"
                >
                  Modify Search
                </Button>
              </div>
            ) : (
              flights.map((flight) => (
                <FlightResultCard
                  key={flight.id}
                  flight={flight}
                  isUser={isUser}
                  hasFreeTier={hasFreeTier}
                  savingFlightBookmark={savingFlightBookmark}
                  onViewSeatMap={setSelectedFlightForSeatMap}
                  onSetAlert={handleSetAlert}
                />
              ))
            )}
          </div>
        )}

        <SearchAlertDialog
          isOpen={isSearchAlertDialogOpen}
          onOpenChange={setIsSearchAlertDialogOpen}
          searchParams={searchParams}
          availabilityThreshold={availabilityThreshold}
          onAvailabilityThresholdChange={setAvailabilityThreshold}
          onConfirm={handleConfirmSearchAlert}
        />

        {/* Individual Flight Alert Dialog */}
        <FlightAlertDialog
          isOpen={isAlertDialogOpen}
          onOpenChange={setIsAlertDialogOpen}
          flightDetails={selectedFlight}
          seatCountThreshold={seatCountThreshold}
          onSeatCountThresholdChange={setSeatCountThreshold}
          onConfirm={handleConfirmAlert}
        />
      </div>
    </div>
  )
}
