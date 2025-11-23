"use client"

import React, { useState, useCallback } from "react"
import { useRouter, useSearchParams } from 'next/navigation'
import { Navbar } from "@/components/navbar"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Plane, MapPin, Bell, Search, ArrowLeft, Calendar, Clock, Users, ChevronDown, ChevronUp, AlertCircle, Loader2 } from 'lucide-react'
import { 
  type FlightSearchParams,
  type Flight,
  type FlightSegment 
} from "@/lib/api-helpers"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useAuth } from '@/hooks/useAuth'
import { SeatmapRenderer, calculateSeatAvailability, getSeatStatusFromData } from "@/components/seatmap-renderer"
import { FlightSearchForm } from "@/components/flight-search-form"
import { FlightSegmentDisplay } from "@/components/flight-segment-display"
import { FlightResultCard } from "@/components/flight-result-card"
import { CompactSearchForm } from "@/components/compact-search-form"
import { AlertSetupDialog, type FlightAlertDetails } from "@/components/alert-setup-dialog"
import { 
  formatTravelClassForDisplay, 
  formatFlightDate, 
  transformFlightData,
  createFlightOfferData,
  createSearchRequest
} from "@/lib/flight-utils"


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
  const [selectedCabin, setSelectedCabin] = useState("all")
  const [isSearchFormExpanded, setIsSearchFormExpanded] = useState(false)
  const [showAlertSuccess, setShowAlertSuccess] = useState(false)
  const [isSearchAlertDialogOpen, setIsSearchAlertDialogOpen] = useState(false)
  const [selectedFlight, setSelectedFlight] = useState<FlightAlertDetails | null>(null) // State to hold details for the flight alert dialog
  
  // Auth and bookmark state
  const { isUser } = useAuth()
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

  const [formInputs, setFormInputs] = useState({
    origin: "",
    destination: "",
    date: "",
    airline: "",
    flightNumber: "",
    seatClass: "",
  })



  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault()

    const params = new URLSearchParams()
    params.set("from", formInputs.origin)
    params.set("to", formInputs.destination)
    params.set("date", formInputs.date)

    if (formInputs.airline) {
      params.set("airline", formInputs.airline)
    }

    if (formInputs.flightNumber) {
      params.set("flight", formInputs.flightNumber)
    }

    if (formInputs.seatClass) {
      params.set("seatClass", formInputs.seatClass)
    }

    // Update search params and navigate
    router.push(`/search?${params.toString()}`)

    // Prepare API search parameters
    const searchApiParams: FlightSearchParams = {
      origin: formInputs.origin,
      destination: formInputs.destination,
      date: formInputs.date,
      airline: formInputs.airline || undefined,
      flightNumber: formInputs.flightNumber || undefined,
      seatClass: formInputs.seatClass || undefined,
    }

    // Fetch flights from API
    await fetchFlights(searchApiParams)

    setIsSearchFormExpanded(false)
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
    setFormInputs({
      origin: "",
      destination: "",
      date: "",
      airline: "",
      flightNumber: "",
      seatClass: "",
    })
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
        console.warn('Flight search validation issue:', {
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
        console.log('Transforming API response:', {
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
          
          console.log('About to transform flights:', {
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
        
        console.log('Transformation result:', {
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
          console.error('Transformation error:', transformError);
          setError('Failed to process flight data');
          setFlights([]);
        }
      } else {
        throw new Error(data.message || 'Failed to fetch flights')
      }
    } catch (err) {
      console.error('Flight search error:', err)
      setError(err instanceof Error ? err.message : 'Failed to search for flights')
      setFlights([]) // Clear flights on error
    } finally {
      setIsLoading(false)
    }
  }, []) // Empty dependency array since fetchFlights doesn't depend on any props or state

  // Populate form inputs with URL parameters when available
  React.useEffect(() => {
    if (from || to || date || airline || flightNumber || seatClass) {
      setFormInputs({
        origin: from || "",
        destination: to || "",
        date: date || "",
        airline: airline || "",
        flightNumber: flightNumber || "",
        seatClass: seatClass || "",
      })
    }
  }, [from, to, date, airline, flightNumber, seatClass])

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




  // Function to save search as bookmark
  const saveSearchBookmark = async () => {
    if (!isUser) {
      setBookmarkError('Please log in to save searches')
      return false
    }

    setIsSavingBookmark(true)
    setBookmarkError(null)

    try {
      // Build search request object from current form inputs
      const searchRequest: Record<string, unknown> = {
        origin: formInputs.origin,
        destination: formInputs.destination,
        departureDate: formInputs.date,
        maxResults: 10
      }

      // Only include optional fields if they have values
      if (formInputs.seatClass?.trim()) {
        searchRequest.travelClass = formInputs.seatClass.trim()
      }
      
      if (formInputs.airline?.trim()) {
        const airline = formInputs.airline.trim()
        // Only include if it's 2-3 uppercase letters to match backend validation
        if (/^[A-Z]{2,3}$/.test(airline)) {
          searchRequest.airlineCode = airline
        }
      }
      
      if (formInputs.flightNumber?.trim()) {
        const flightNum = formInputs.flightNumber.trim()
        // Only include if it's 1-4 digits to match backend validation
        if (/^[0-9]{1,4}$/.test(flightNum)) {
          searchRequest.flightNumber = flightNum
        }
      }

      // Create a descriptive title for the saved search
      const title = `${formInputs.origin} → ${formInputs.destination} • ${formInputs.date}`

      const response = await fetch('/api/bookmarks', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({
          itemType: 'SAVED_SEARCH',
          title: title,
          searchRequest: searchRequest
        }),
      })

      const result = await response.json()

      if (result.success) {
        console.log('Search saved successfully:', result.data)
        return true
      } else {
        setBookmarkError(result.message || 'Failed to save search')
        return false
      }
    } catch (error) {
      console.error('Failed to save search bookmark:', error)
      setBookmarkError('Failed to save search')
      return false
    } finally {
      setIsSavingBookmark(false)
    }
  }

  // Function to save flight as bookmark
  const saveFlightBookmark = async (flightId: number) => {
    if (!isUser) {
      setBookmarkError('Please log in to save flights')
      return false
    }

    const flight = flights.find((f) => f.id === flightId)
    if (!flight) {
      setBookmarkError('Flight not found')
      return false
    }

    setSavingFlightBookmark(flightId)
    setBookmarkError(null)

    try {
      // Convert flight date and time to ISO format
      const flightDate = flight.date // e.g., "Wed, Dec 15, 2025"
      const departureTime = flight.departure.time // e.g., "08:00 AM"
      const arrivalTime = flight.arrival.time // e.g., "04:35 PM"
      
      // Parse the date and times to create ISO strings
      // Use a fixed timestamp to prevent hydration mismatch
      let departureAt = "2025-01-01T00:00:00.000Z"
      let arrivalAt = "2025-01-01T00:00:00.000Z"
      
      try {
        const dateStr = flightDate.replace(/^\w+,\s*/, '') // Remove day of week: "Dec 15, 2025"
        const departureDateTime = new Date(`${dateStr} ${departureTime}`)
        const arrivalDateTime = new Date(`${dateStr} ${arrivalTime}`)
        
        if (!isNaN(departureDateTime.getTime())) {
          departureAt = departureDateTime.toISOString()
        }
        if (!isNaN(arrivalDateTime.getTime())) {
          arrivalAt = arrivalDateTime.toISOString()
        }
      } catch (parseError) {
        console.warn('Failed to parse flight date/time:', parseError)
      }

      // Extract carrier code and flight number from flightNumber (e.g., "UA 1679")
      const flightNumberMatch = flight.flightNumber.match(/^(\w+)\s+(\d+)$/)
      const carrierCode = flightNumberMatch?.[1] || 'XX'
      const number = flightNumberMatch?.[2] || '0000'

      // Create flight offer data structure matching API documentation format
      const flightOfferData = {
        type: "flight-offer",
        dataSource: "FRONTEND_SEARCH",
        source: "SEARCH_RESULTS",
        instantTicketingRequired: false,
        nonHomogeneous: false,
        oneWay: false,
        numberOfBookableSeats: flight.availableSeats,
        itineraries: [
          {
            duration: flight.duration,
            segments: [
              {
                departure: {
                  iataCode: flight.departure.code,
                  at: departureAt
                },
                arrival: {
                  iataCode: flight.arrival.code,
                  at: arrivalAt
                },
                carrierCode: carrierCode,
                number: number,
                duration: flight.duration,
                id: "1",
                numberOfStops: 0,
                blacklistedInEU: false
              }
            ]
          }
        ],
        price: {
          currency: "USD",
          total: flight.price.replace('$', ''),
          base: flight.price.replace('$', '')
        }
      }

      // Create a descriptive title for the flight bookmark
      const title = `${flight.flightNumber} • ${flight.departure.code} → ${flight.arrival.code} • ${flight.date}`

      const response = await fetch('/api/bookmarks', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({
          itemType: 'BOOKMARK',
          title: title,
          flightOfferData: JSON.stringify(flightOfferData)
        }),
      })

      const result = await response.json()

      if (result.success) {
        console.log('Flight saved successfully:', result.data)
        return true
      } else {
        setBookmarkError(result.message || 'Failed to save flight')
        return false
      }
    } catch (error) {
      console.error('Failed to save flight bookmark:', error)
      setBookmarkError('Failed to save flight')
      return false
    } finally {
      setSavingFlightBookmark(null)
    }
  }

  const handleSetSearchAlert = async () => {
    // First, save the search as a bookmark (if user is authenticated)
    if (isUser) {
      const saved = await saveSearchBookmark()
      if (!saved) {
        // If bookmark saving failed, don't proceed to alert modal
        return
      }
    }
    
    // Then open the alert modal as before
    setIsSearchAlertDialogOpen(true)
  }

  const handleConfirmSearchAlert = () => {
    console.log("[v0] Search alert set for:", searchParams, "Cabin:", selectedCabin, "Threshold:", {
      availability: availabilityThreshold,
    })
    setIsSearchAlertDialogOpen(false)
    setSelectedCabin("all")
    setAvailabilityThreshold(30)
    setShowAlertSuccess(true)
    setTimeout(() => {
      setShowAlertSuccess(false)
    }, 3000)
  }


  const handleSetAlert = async (flightId: number) => {
    // First, save the flight as a bookmark (if user is authenticated)
    if (isUser) {
      const saved = await saveFlightBookmark(flightId)
      if (!saved) {
        // If flight bookmark saving failed, don't proceed to alert modal
        return
      }
    }

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

  const handleConfirmAlert = () => {
    // Here you would typically save the alert to a database or state management
    console.log("[v0] Alert set for flight:", selectedFlightForAlert, "Cabin:", selectedCabin, "Threshold:", {
      availability: availabilityThreshold,
    })
    setIsAlertDialogOpen(false)
    setSelectedCabin("all")
    setAvailabilityThreshold(30)
    setShowAlertSuccess(true)
    setTimeout(() => {
      setShowAlertSuccess(false)
    }, 3000)
  }

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
              {flight.airline} {flight.flightNumber} • {flight.departure.code} → {flight.arrival.code}
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
                <div className="flex items-center gap-2">
                  <Users className="w-4 h-4 text-gray-400" />
                  <span className="text-green-600 font-medium">
                    {(() => {
                      if (flight.seatmapData?.seats) {
                        const availability = calculateSeatAvailability(flight.seatmapData?.seats || [])
                        return `${availability.available} seats available (${availability.percentage}% of ${availability.total} total)`
                      }
                      return `${flight.availableSeats} seats available (estimated)`
                    })()}
                  </span>
                </div>
                {/* CHANGE: Fixed syntax error in cheapest tariffs display */}
                <div className="flex items-center gap-2">
                  <svg
                    className="w-4 h-4 text-gray-400"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z"
                    />
                  </svg>
                  <span>{flight.cheapestTariffs} lowest-fare seats</span>
                </div>
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
                      <div className="w-2 h-2 bg-green-500 rounded-full"></div>
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
              <div className="w-2 h-2 bg-green-500 rounded-full flex-shrink-0"></div>
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

        {/* Set Search Alert card - only show for registered users */}
        {isUser && (
          <div className="mb-6 bg-white border-2 border-[#00BBA7] rounded-xl p-4 shadow-sm">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-full bg-[#00BBA7]/10 flex items-center justify-center flex-shrink-0">
                  <Bell className="w-5 h-5 text-[#00BBA7]" />
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
                className="w-full md:w-auto bg-[#00BBA7] text-white hover:bg-[#009688] disabled:bg-gray-400 disabled:cursor-not-allowed rounded-full px-6 py-3 cursor-pointer transition-all flex-shrink-0 whitespace-nowrap"
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
                  onClick={() => setIsSearchFormExpanded(true)}
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
                  savingFlightBookmark={savingFlightBookmark}
                  onViewSeatMap={setSelectedFlightForSeatMap}
                  onSetAlert={handleSetAlert}
                />
              ))
            )}
          </div>
        )}

        <Dialog open={isSearchAlertDialogOpen} onOpenChange={setIsSearchAlertDialogOpen}>
          <DialogContent className="sm:max-w-md max-h-[80vh] sm:max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Set Search Alert</DialogTitle>
              <DialogDescription>
                Get notified when any flight matching your search criteria has seat availability changes. You&apos;ll receive
                alerts for all flights on this route.
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4 pb-4 pt-0">
              <div className="bg-gradient-to-br from-[#00BBA7]/10 to-[#00BBA7]/5 border border-[#00BBA7]/30 rounded-lg p-3 space-y-1.5">
                <p className="font-semibold text-gray-600 uppercase tracking-wide mb-1.5 text-xs">Alert Details</p>
                <div className="space-y-1">
                  <div className="flex items-center gap-1.5 text-base">
                    <MapPin className="w-3.5 h-3.5 text-[#00BBA7] flex-shrink-0" />
                    <span className="font-semibold text-gray-800">
                      {searchParams.origin} → {searchParams.destination}
                    </span>
                  </div>
                  <div className="flex items-center gap-1.5 text-base">
                    <Calendar className="w-3.5 h-3.5 text-[#00BBA7] flex-shrink-0" />
                    <span className="text-gray-700">
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
                  </div>
                  {searchParams.airline && (
                    <div className="flex items-center gap-1.5 text-base">
                      <Plane className="w-3.5 h-3.5 text-[#00BBA7] flex-shrink-0" />
                      <span className="text-gray-700">
                        Airline: <span className="font-medium">{searchParams.airline}</span>
                      </span>
                    </div>
                  )}
                  {searchParams.flightNumber && (
                    <div className="flex items-center gap-1.5 text-base">
                      <span className="w-3.5 h-3.5 text-[#00BBA7] flex items-center justify-center text-[10px] font-bold flex-shrink-0">
                        #
                      </span>
                      <span className="text-gray-700">
                        Flight: <span className="font-medium">{searchParams.flightNumber}</span>
                      </span>
                    </div>
                  )}
                  {searchParams.seatClass && (
                    <div className="flex items-center gap-1.5 text-base">
                      <Users className="w-3.5 h-3.5 text-[#00BBA7] flex-shrink-0" />
                      <span className="text-gray-700">
                        Class:{" "}
                        <span className="font-medium">{formatTravelClassForDisplay(searchParams.seatClass)}</span>
                      </span>
                    </div>
                  )}
                </div>
              </div>

              <div className="space-y-3">
                <Label htmlFor="search-cabin-select" className="text-sm font-medium">
                  Select Cabin
                </Label>
                <Select value={selectedCabin} onValueChange={setSelectedCabin}>
                  <SelectTrigger id="search-cabin-select" className="rounded-lg">
                    <SelectValue placeholder="Select cabin class" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Cabins</SelectItem>
                    <SelectItem value="first">First Class</SelectItem>
                    <SelectItem value="business">Business Class</SelectItem>
                    <SelectItem value="premium">Premium Economy</SelectItem>
                    <SelectItem value="economy">Economy</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-3 pt-2 border-t border-gray-200">
                <Label className="text-sm font-medium text-gray-700">Availability Threshold (Optional)</Label>
                <p className="text-xs text-gray-500 -mt-1">Get alerted when availability meets these conditions</p>

                <div className="space-y-3">
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-700">Alert when availability is above:</span>
                      <span className="text-lg font-semibold text-[#00BBA7]">{availabilityThreshold}%</span>
                    </div>
                    <input
                      type="range"
                      min="0"
                      max="100"
                      step="5"
                      value={availabilityThreshold}
                      onChange={(e) => setAvailabilityThreshold(Number(e.target.value))}
                      className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-5 [&::-webkit-slider-thumb]:h-5 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-[#00BBA7] [&::-webkit-slider-thumb]:cursor-pointer [&::-moz-range-thumb]:w-5 [&::-moz-range-thumb]:h-5 [&::-moz-range-thumb]:rounded-full [&::-moz-range-thumb]:bg-[#00BBA7] [&::-moz-range-thumb]:border-0 [&::-moz-range-thumb]:cursor-pointer"
                      style={{
                        background: `linear-gradient(to right, #00BBA7 0%, #00BBA7 ${availabilityThreshold}%, #e5e7eb ${availabilityThreshold}%, #e5e7eb 100%)`,
                      }}
                    />
                    <div className="flex justify-between text-xs text-gray-500">
                      <span>0%</span>
                      <span>50%</span>
                      <span>100%</span>
                    </div>
                    <p className="text-xs text-gray-500">
                      Get alerted when seat availability is above {availabilityThreshold}%, indicating high chances of
                      getting on the flight
                    </p>
                  </div>
                </div>
              </div>

              <div className="bg-gray-50 rounded-lg p-3">
                <div className="flex items-center gap-2 text-sm">
                  <Clock className="w-4 h-4 text-gray-500" />
                  <span className="font-medium text-gray-700">Alert expires on departure:</span>
                  <span className="text-gray-600">
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
                </div>
              </div>
            </div>

            <DialogFooter className="flex-col sm:flex-row gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsSearchAlertDialogOpen(false)}
                className="rounded-full cursor-pointer"
              >
                Cancel
              </Button>
              <Button
                type="button"
                onClick={handleConfirmSearchAlert}
                className="bg-black text-white hover:bg-gray-800 rounded-full cursor-pointer"
              >
                Confirm Alert
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Individual Flight Alert Dialog */}
        <AlertSetupDialog
          isOpen={isAlertDialogOpen}
          onOpenChange={setIsAlertDialogOpen}
          flightDetails={selectedFlight}
          selectedCabin={selectedCabin}
          onCabinChange={setSelectedCabin}
          seatCountThreshold={seatCountThreshold}
          onSeatCountThresholdChange={setSeatCountThreshold}
          onConfirm={handleConfirmAlert}
        />
      </div>
    </div>
  )
}
