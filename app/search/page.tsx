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
  type Flight 
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

type DeckConfiguration = {
  width: number
  length: number
  startSeatRow: number
  endSeatRow: number
  startWingsX: number
  endWingsX: number
  startWingsRow: number
  endWingsRow: number
  exitRowsX: number[]
}

type SeatAvailabilityStatus = "AVAILABLE" | "BLOCKED" | "OCCUPIED"

type SeatStatus = "available" | "occupied" | "blocked" | "exit"

// Define a type for flight details that will be used in the alert dialog
type FlightAlertDetails = {
  airline: string
  flightNumber: string
  from: string
  to: string
  date: string
  departureTime: string
  arrivalTime: string
}

// Helper function to format travel class for display
function formatTravelClassForDisplay(travelClass: string): string {
  switch (travelClass) {
    case 'ECONOMY':
      return 'Economy'
    case 'PREMIUM_ECONOMY':
      return 'Premium Economy'
    case 'BUSINESS':
      return 'Business'
    case 'FIRST':
      return 'First Class'
    default:
      return travelClass
  }
}

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


  const deckConfig: DeckConfiguration = {
    width: 6,
    length: 24,
    startSeatRow: 8,
    endSeatRow: 31,
    startWingsX: 1,
    endWingsX: 8,
    startWingsRow: 12,
    endWingsRow: 20,
    exitRowsX: [12, 20],
  }

  const fixedSeatMap: Record<string, SeatAvailabilityStatus> = {
    "8A": "AVAILABLE",
    "8B": "OCCUPIED",
    "8C": "AVAILABLE",
    "8D": "AVAILABLE",
    "8E": "BLOCKED",
    "8F": "AVAILABLE",
    "9A": "OCCUPIED",
    "9B": "AVAILABLE",
    "9C": "AVAILABLE",
    "9D": "BLOCKED",
    "9E": "AVAILABLE",
    "9F": "OCCUPIED",
    "10A": "AVAILABLE",
    "10B": "AVAILABLE",
    "10C": "OCCUPIED",
    "10D": "AVAILABLE",
    "10E": "AVAILABLE",
    "10F": "BLOCKED",
    "11A": "BLOCKED",
    "11B": "OCCUPIED",
    "11C": "AVAILABLE",
    "11D": "OCCUPIED",
    "11E": "AVAILABLE",
    "11F": "AVAILABLE",
    "12A": "AVAILABLE",
    "12B": "AVAILABLE",
    "12C": "AVAILABLE",
    "12D": "AVAILABLE",
    "12E": "AVAILABLE",
    "12F": "AVAILABLE",
    "13A": "OCCUPIED",
    "13B": "AVAILABLE",
    "13C": "BLOCKED",
    "13D": "AVAILABLE",
    "13E": "OCCUPIED",
    "13F": "AVAILABLE",
    "14A": "AVAILABLE",
    "14B": "BLOCKED",
    "14C": "AVAILABLE",
    "14D": "OCCUPIED",
    "14E": "AVAILABLE",
    "14F": "AVAILABLE",
    "15A": "AVAILABLE",
    "15B": "AVAILABLE",
    "15C": "AVAILABLE",
    "15D": "BLOCKED",
    "15E": "AVAILABLE",
    "15F": "OCCUPIED",
    "16A": "OCCUPIED",
    "16B": "AVAILABLE",
    "16C": "AVAILABLE",
    "16D": "BLOCKED",
    "16E": "AVAILABLE",
    "16F": "AVAILABLE",
    "17A": "AVAILABLE",
    "17B": "OCCUPIED",
    "17C": "AVAILABLE",
    "17D": "AVAILABLE",
    "17E": "AVAILABLE",
    "17F": "BLOCKED",
    "18A": "BLOCKED",
    "18B": "AVAILABLE",
    "18C": "OCCUPIED",
    "18D": "AVAILABLE",
    "18E": "OCCUPIED",
    "18F": "AVAILABLE",
    "19A": "AVAILABLE",
    "19B": "AVAILABLE",
    "19C": "AVAILABLE",
    "19D": "BLOCKED",
    "19E": "AVAILABLE",
    "19F": "OCCUPIED",
    "20A": "AVAILABLE",
    "20B": "AVAILABLE",
    "20C": "AVAILABLE",
    "20D": "AVAILABLE",
    "20E": "AVAILABLE",
    "20F": "AVAILABLE",
    "21A": "OCCUPIED",
    "21B": "BLOCKED",
    "21C": "AVAILABLE",
    "21D": "AVAILABLE",
    "21E": "OCCUPIED",
    "21F": "AVAILABLE",
    "22A": "AVAILABLE",
    "22B": "AVAILABLE",
    "22C": "OCCUPIED",
    "22D": "BLOCKED",
    "22E": "AVAILABLE",
    "22F": "AVAILABLE",
    "23A": "AVAILABLE",
    "23B": "OCCUPIED",
    "23C": "AVAILABLE",
    "23D": "AVAILABLE",
    "23E": "AVAILABLE",
    "23F": "BLOCKED",
    "24A": "BLOCKED",
    "24B": "AVAILABLE",
    "24C": "AVAILABLE",
    "24D": "OCCUPIED",
    "24E": "AVAILABLE",
    "24F": "AVAILABLE",
    "25A": "AVAILABLE",
    "25B": "AVAILABLE",
    "25C": "BLOCKED",
    "25D": "AVAILABLE",
    "25E": "OCCUPIED",
    "25F": "AVAILABLE",
    "26A": "OCCUPIED",
    "26B": "AVAILABLE",
    "26C": "AVAILABLE",
    "26D": "AVAILABLE",
    "26E": "BLOCKED",
    "26F": "OCCUPIED",
    "27A": "AVAILABLE",
    "27B": "BLOCKED",
    "27C": "OCCUPIED",
    "27D": "AVAILABLE",
    "27E": "AVAILABLE",
    "27F": "AVAILABLE",
    "28A": "AVAILABLE",
    "28B": "AVAILABLE",
    "28C": "AVAILABLE",
    "28D": "BLOCKED",
    "28E": "OCCUPIED",
    "28F": "AVAILABLE",
    "29A": "OCCUPIED",
    "29B": "AVAILABLE",
    "29C": "AVAILABLE",
    "29D": "AVAILABLE",
    "29E": "AVAILABLE",
    "29F": "BLOCKED",
    "30A": "AVAILABLE",
    "30B": "OCCUPIED",
    "30C": "BLOCKED",
    "30D": "AVAILABLE",
    "30E": "AVAILABLE",
    "30F": "AVAILABLE",
    "31A": "AVAILABLE",
    "31B": "AVAILABLE",
    "31C": "AVAILABLE",
    "31D": "OCCUPIED",
    "31E": "BLOCKED",
    "31F": "AVAILABLE",
  }

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
        throw new Error(data.message || `HTTP ${response.status}: ${response.statusText}`)
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
          
          const transformedFlights = backendFlights.map((flight: Record<string, unknown>, index: number) => {
          const carrierCode = flight.itineraries?.[0]?.segments?.[0]?.carrierCode || '';
          const flightNum = flight.itineraries?.[0]?.segments?.[0]?.number || '';
          const airlineName = dictionaries.carriers?.[carrierCode] || carrierCode || 'Unknown';
          
          return {
            id: index + 1,
            airline: airlineName,
            flightNumber: `${carrierCode} ${flightNum}`.trim(),
          departure: {
            // Use first segment departure (origin)
            city: (() => {
              const departureCode = flight.itineraries?.[0]?.segments?.[0]?.departure?.iataCode;
              // If dictionaries has location info, use cityCode, otherwise just use the airport code
              return dictionaries?.locations?.[departureCode]?.cityCode || departureCode || '';
            })(),
            code: flight.itineraries?.[0]?.segments?.[0]?.departure?.iataCode || '',
            time: flight.itineraries?.[0]?.segments?.[0]?.departure?.at ? 
              new Date(flight.itineraries[0].segments[0].departure.at).toLocaleTimeString('en-US', {
                hour: '2-digit',
                minute: '2-digit', 
                hour12: true
              }) : ''
          },
          arrival: {
            // Use last segment arrival (final destination)
            city: (() => {
              const segments = flight.itineraries?.[0]?.segments || [];
              const lastSegment = segments[segments.length - 1];
              const arrivalCode = lastSegment?.arrival?.iataCode;
              return dictionaries.locations?.[arrivalCode]?.cityCode || arrivalCode || '';
            })(),
            code: (() => {
              const segments = flight.itineraries?.[0]?.segments || [];
              const lastSegment = segments[segments.length - 1];
              return lastSegment?.arrival?.iataCode || '';
            })(),
            time: (() => {
              const segments = flight.itineraries?.[0]?.segments || [];
              const lastSegment = segments[segments.length - 1];
              return lastSegment?.arrival?.at ?
                new Date(lastSegment.arrival.at).toLocaleTimeString('en-US', {
                  hour: '2-digit',
                  minute: '2-digit',
                  hour12: true  
                }) : '';
            })()
          },
          duration: flight.itineraries?.[0]?.duration?.replace('PT', '')?.replace('H', 'h ')?.replace('M', 'm') || '',
          date: flight.itineraries?.[0]?.segments?.[0]?.departure?.at ?
            new Date(flight.itineraries[0].segments[0].departure.at).toLocaleDateString('en-US', {
              weekday: 'short',
              month: 'short', 
              day: 'numeric',
              year: 'numeric'
            }) : '',
          availableSeats: flight.numberOfBookableSeats || 0,
          price: flight.price?.total ? `$${flight.price.total}` : '$0',
          // Add connection information
          stops: (() => {
            const segments = flight.itineraries?.[0]?.segments || [];
            return segments.length - 1; // Number of stops = segments - 1
          })(),
          connections: (() => {
            const segments = flight.itineraries?.[0]?.segments || [];
            if (segments.length <= 1) return [];
            return segments.slice(0, -1).map((segment: Record<string, unknown>) => (segment.arrival as Record<string, unknown>)?.iataCode).filter(Boolean);
          })()
          };
        })
        
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

  const getSeatStatus = (row: number, col: number): SeatStatus => {
    if (deckConfig.exitRowsX.includes(row)) {
      return "exit"
    }

    const seatLetter = getSeatLetter(col)
    const seatNumber = `${row}${seatLetter}`
    const fixedStatus = fixedSeatMap[seatNumber]

    if (fixedStatus) {
      if (fixedStatus === "AVAILABLE") return "available"
      if (fixedStatus === "OCCUPIED") return "occupied"
      if (fixedStatus === "BLOCKED") return "blocked"
    }

    return "available"
  }

  const getSeatLetter = (col: number): string => {
    const letters = ["A", "B", "C", "D", "E", "F"]
    return letters[col] || ""
  }

  const handleSetSearchAlert = () => {
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
                  {/* CHANGE: Added percentage of total seats available */}
                  <span className="text-green-600 font-medium">
                    {flight.availableSeats} seats available ({Math.round((flight.availableSeats / 144) * 100)}% of
                    the total)
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

            <Card className="p-4 sm:p-6">
              <div className="mb-8 px-2 sm:px-0">
                <div className="flex flex-wrap items-center justify-center gap-3 sm:gap-4 md:gap-6 text-xs sm:text-sm">
                  <div className="flex items-center gap-1.5 sm:gap-2 flex-shrink-0">
                    <div className="w-4 h-4 sm:w-5 sm:h-5 md:w-6 md:h-6 bg-green-200 rounded flex-shrink-0"></div>
                    <span className="whitespace-nowrap">Available</span>
                  </div>
                  <div className="flex items-center gap-1.5 sm:gap-2 flex-shrink-0">
                    <div className="w-4 h-4 sm:w-5 sm:h-5 md:w-6 md:h-6 bg-red-200 rounded flex-shrink-0"></div>
                    <span className="whitespace-nowrap">Occupied</span>
                  </div>
                  <div className="flex items-center gap-1.5 sm:gap-2 flex-shrink-0">
                    <div className="w-4 h-4 sm:w-5 sm:h-5 md:w-6 md:h-6 bg-gray-400 rounded flex-shrink-0"></div>
                    <span className="whitespace-nowrap">Blocked</span>
                  </div>
                  <div className="flex items-center gap-1.5 sm:gap-2 flex-shrink-0">
                    <div className="w-4 h-4 sm:w-5 sm:h-5 md:w-6 md:h-6 bg-black rounded flex items-center justify-center text-white text-[10px] sm:text-xs font-bold flex-shrink-0">
                      E
                    </div>
                    <span className="whitespace-nowrap">Exit Row</span>
                  </div>
                </div>
              </div>

              <div className="relative text-center">
                <div className="flex justify-center mb-1">
                  <div className="w-16 h-8 bg-gray-100 rounded-t-full border-2 border-gray-300"></div>
                </div>

                <div className="relative inline-block mx-auto">
                  <div
                    className="absolute left-0 bg-gray-200 border border-gray-300"
                    style={{
                      top: `${(deckConfig.startWingsRow - deckConfig.startSeatRow) * 28}px`,
                      height: `${(deckConfig.endWingsRow - deckConfig.startWingsRow + 1) * 28}px`,
                      width: "80px",
                      transform: "translateX(-80px)",
                      clipPath: "polygon(100% 0%, 100% 100%, 0% 80%, 0% 20%)",
                    }}
                  />

                  <div
                    className="absolute right-0 bg-gray-200 border border-gray-300"
                    style={{
                      top: `${(deckConfig.startWingsRow - deckConfig.startSeatRow) * 28}px`,
                      height: `${(deckConfig.endWingsRow - deckConfig.startWingsRow + 1) * 28}px`,
                      width: "80px",
                      transform: "translateX(80px)",
                      clipPath: "polygon(0% 0%, 0% 100%, 100% 80%, 100% 20%)",
                    }}
                  />

                  {Array.from({ length: deckConfig.length }).map((_, rowIndex) => {
                    const actualRow = deckConfig.startSeatRow + rowIndex

                    return (
                      <div key={rowIndex} className="flex items-center justify-center gap-1 mb-0.5">
                        <div className="w-6 text-center text-xs font-medium text-gray-500">{actualRow}</div>

                        <div className="flex gap-0.5 items-center">
                          {Array.from({ length: deckConfig.width }).map((_, colIndex) => {
                            const seatStatus = getSeatStatus(actualRow, colIndex)
                            const seatLetter = getSeatLetter(colIndex)

                            return (
                              <div key={colIndex} className="flex items-center">
                                {colIndex === 3 && <div className="w-4"></div>}

                                <div
                                  className={`w-7 h-7 rounded text-[10px] font-medium flex items-center justify-center transition-colors ${
                                    seatStatus === "available"
                                      ? "bg-green-200 text-green-800"
                                      : seatStatus === "occupied"
                                        ? "bg-red-200 text-red-800"
                                        : seatStatus === "blocked"
                                          ? "bg-gray-400 text-gray-700"
                                          : seatStatus === "exit"
                                            ? "bg-black text-white"
                                            : "bg-green-200 text-green-800"
                                  }`}
                                  title={`Seat ${actualRow}${seatLetter} - ${seatStatus}`}
                                >
                                  {seatLetter}
                                </div>
                              </div>
                            )
                          })}
                        </div>

                        <div className="w-6 text-center text-xs font-medium text-gray-500">{actualRow}</div>
                      </div>
                    )
                  })}
                </div>

                <div className="flex justify-center mt-1">
                  <div className="w-16 h-8 bg-gray-100 rounded-b-full border-2 border-gray-300"></div>
                </div>
              </div>
            </Card>
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

          <div className="bg-gray-50 rounded-2xl p-4 md:p-6 mb-6 md:mb-8">
            <form onSubmit={handleSearch} className="space-y-6" suppressHydrationWarning={true}>
              <div>
                <Label htmlFor="origin" className="text-sm font-medium text-gray-700 mb-2 block">
                  Origin Airport *
                </Label>
                <Input
                  id="origin"
                  type="text"
                  placeholder="Enter airport name or code (e.g., LAX or Los Angeles)"
                  value={formInputs.origin}
                  onChange={(e) => setFormInputs({ ...formInputs, origin: e.target.value.toUpperCase() })}
                  required
                  className="rounded-lg"
                />
              </div>

              <div>
                <Label htmlFor="destination" className="text-sm font-medium text-gray-700 mb-2 block">
                  Destination Airport *
                </Label>
                <Input
                  id="destination"
                  type="text"
                  placeholder="Enter airport name or code (e.g., JFK or New York)"
                  value={formInputs.destination}
                  onChange={(e) => setFormInputs({ ...formInputs, destination: e.target.value.toUpperCase() })}
                  required
                  className="rounded-lg"
                />
              </div>

              <div>
                <Label htmlFor="date" className="text-sm font-medium text-gray-700 mb-2 block">
                  Flight Date *
                </Label>
                <Input
                  id="date"
                  type="date"
                  value={formInputs.date}
                  onChange={(e) => setFormInputs({ ...formInputs, date: e.target.value })}
                  required
                  className="rounded-lg"
                />
              </div>

              <div className="pt-4 border-t border-gray-200">
                <p className="text-sm font-medium text-gray-700 mb-4">Optional Information</p>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <Label htmlFor="airline" className="text-sm font-medium text-gray-600 mb-2 block">
                      Airline Code
                    </Label>
                    <Input
                      id="airline"
                      type="text"
                      placeholder="e.g., AA, DL, UA"
                      value={formInputs.airline}
                      onChange={(e) => setFormInputs({ ...formInputs, airline: e.target.value })}
                      className="rounded-lg"
                    />
                  </div>

                  <div>
                    <Label htmlFor="flightNumber" className="text-sm font-medium text-gray-600 mb-2 block">
                      Flight Number
                    </Label>
                    <Input
                      id="flightNumber"
                      type="text"
                      placeholder="e.g., 1234"
                      value={formInputs.flightNumber}
                      onChange={(e) => setFormInputs({ ...formInputs, flightNumber: e.target.value })}
                      className="rounded-lg"
                    />
                  </div>

                  <div>
                    <Label htmlFor="seatClass" className="text-sm font-medium text-gray-600 mb-2 block">
                      Seat Class
                    </Label>
                    <select
                      id="seatClass"
                      value={formInputs.seatClass}
                      onChange={(e) => setFormInputs({ ...formInputs, seatClass: e.target.value })}
                      className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent"
                    >
                      <option value="">Select class</option>
                      <option value="ECONOMY">Economy</option>
                      <option value="PREMIUM_ECONOMY">Premium Economy</option>
                      <option value="BUSINESS">Business</option>
                      <option value="FIRST">First Class</option>
                    </select>
                  </div>
                </div>
              </div>

              <div className="flex justify-center">
                <Button
                  type="submit"
                  disabled={isLoading}
                  className="w-full bg-black text-white hover:bg-gray-800 disabled:bg-gray-400 disabled:cursor-not-allowed rounded-full py-6 text-lg cursor-pointer"
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                      Searching...
                    </>
                  ) : (
                    <>
                      <Search className="w-5 h-5 mr-2" />
                      Search Flights
                    </>
                  )}
                </Button>
              </div>
            </form>
          </div>
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

        <div className="bg-gray-50 rounded-2xl p-4 md:p-6 md:mb-8 mb-1.5">
          {!isSearchFormExpanded && (
            <button
              onClick={() => setIsSearchFormExpanded(true)}
              className="md:hidden w-full flex items-center justify-between mb-4 bg-black text-white hover:bg-gray-800 rounded-full px-6 py-3 cursor-pointer transition-colors"
            >
              <span className="font-medium">New Search</span>
              <ChevronDown className="w-5 h-5" />
            </button>
          )}

          <form onSubmit={handleSearch} className={`${isSearchFormExpanded ? "block" : "hidden"} md:block space-y-4`} suppressHydrationWarning={true}>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="text-sm text-gray-600 mb-2 block">From</label>
                <Input
                  type="text"
                  value={formInputs.origin}
                  onChange={(e) => setFormInputs({ ...formInputs, origin: e.target.value.toUpperCase() })}
                  placeholder="e.g., LAX"
                  required
                  className="rounded-lg"
                />
              </div>
              <div>
                <label className="text-sm text-gray-600 mb-2 block">To</label>
                <Input
                  type="text"
                  value={formInputs.destination}
                  onChange={(e) => setFormInputs({ ...formInputs, destination: e.target.value.toUpperCase() })}
                  placeholder="e.g., JFK"
                  required
                  className="rounded-lg"
                />
              </div>
              <div>
                <label className="text-sm text-gray-600 mb-2 block">Date</label>
                <Input
                  type="date"
                  value={formInputs.date}
                  onChange={(e) => setFormInputs({ ...formInputs, date: e.target.value })}
                  required
                  className="rounded-lg"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
              <div>
                <label className="text-xs text-gray-500 mb-1.5 block">Airline (Optional)</label>
                <Input
                  type="text"
                  value={formInputs.airline}
                  onChange={(e) => setFormInputs({ ...formInputs, airline: e.target.value })}
                  placeholder="e.g., AA"
                  className="rounded-lg text-sm h-10"
                />
              </div>
              <div>
                <label className="text-xs text-gray-500 mb-1.5 block">Flight Number (Optional)</label>
                <Input
                  type="text"
                  value={formInputs.flightNumber}
                  onChange={(e) => setFormInputs({ ...formInputs, flightNumber: e.target.value })}
                  placeholder="e.g., 1234"
                  className="rounded-lg text-sm h-10"
                />
              </div>
              <div>
                <label className="text-xs text-gray-500 mb-1.5 block">Seat Class (Optional)</label>
                <select
                  value={formInputs.seatClass}
                  onChange={(e) => setFormInputs({ ...formInputs, seatClass: e.target.value })}
                  className="w-full rounded-lg border border-gray-300 px-3 text-sm h-10 focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent"
                  suppressHydrationWarning={true}
                >
                  <option value="">Select class</option>
                  <option value="ECONOMY">Economy</option>
                  <option value="PREMIUM_ECONOMY">Premium Economy</option>
                  <option value="BUSINESS">Business</option>
                  <option value="FIRST">First Class</option>
                </select>
              </div>
              <div className="hidden md:flex items-end">
                <Button
                  type="submit"
                  disabled={isLoading}
                  className="w-full bg-black text-white hover:bg-gray-800 disabled:bg-gray-400 disabled:cursor-not-allowed rounded-full cursor-pointer h-10"
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Searching...
                    </>
                  ) : (
                    "New Search"
                  )}
                </Button>
              </div>
            </div>

            {isSearchFormExpanded && (
              <div className="md:hidden flex gap-3">
                <Button
                  type="button"
                  onClick={() => setIsSearchFormExpanded(false)}
                  variant="outline"
                  className="flex-1 rounded-full cursor-pointer bg-transparent"
                >
                  <ChevronUp className="w-4 h-4 mr-2" />
                  Collapse
                </Button>
                <Button
                  type="submit"
                  disabled={isLoading}
                  className="flex-1 bg-black text-white hover:bg-gray-800 disabled:bg-gray-400 disabled:cursor-not-allowed rounded-full cursor-pointer"
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Searching...
                    </>
                  ) : (
                    <>
                      <Search className="w-4 h-4 mr-2" />
                      Search
                    </>
                  )}
                </Button>
              </div>
            )}
          </form>
        </div>

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
              className="w-full md:w-auto bg-[#00BBA7] text-white hover:bg-[#009688] rounded-full px-6 py-3 cursor-pointer transition-all flex-shrink-0 whitespace-nowrap"
            >
              <Search className="w-4 h-4 mr-2" />
              <span className="font-medium">Set Search Alert</span>
            </Button>
          </div>
        </div>

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
            <Card key={flight.id} className="p-6 hover:shadow-lg transition-shadow">
              <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-4">
                    <Plane className="w-5 h-5 text-gray-600" />
                    <span className="font-semibold">{flight.airline}</span>
                    <span className="text-sm text-gray-500">{flight.flightNumber}</span>
                  </div>

                  <div className="flex items-center gap-8">
                    <div>
                      <div className="text-2xl font-bold">{flight.departure.time}</div>
                      <div className="text-sm text-gray-600">{flight.departure.code}</div>
                      {flight.departure.city !== flight.departure.code && (
                        <div className="text-xs text-gray-500">{flight.departure.city}</div>
                      )}
                    </div>

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

                    <div>
                      <div className="text-2xl font-bold">{flight.arrival.time}</div>
                      <div className="text-sm text-gray-600">{flight.arrival.code}</div>
                      {flight.arrival.city !== flight.arrival.code && (
                        <div className="text-xs text-gray-500">{flight.arrival.city}</div>
                      )}
                    </div>
                  </div>

                  <div className="mt-4 flex items-center gap-4 text-sm text-gray-600">
                    <div className="flex items-center gap-1">
                      {/* CHANGE: Using Users icon for better consistency with page style */}
                      <Users className="w-4 h-4 text-gray-400" />
                      <span className="text-gray-600">
                        {flight.availableSeats} seats available ({Math.round((flight.availableSeats / 144) * 100)}% of
                        the total)
                      </span>
                    </div>
                  </div>
                </div>

                <div className="flex flex-col gap-3">
                  <Button
                    onClick={() => setSelectedFlightForSeatMap(flight.id)}
                    className="bg-black text-white hover:bg-gray-800 rounded-full px-6 cursor-pointer"
                  >
                    View Seat Map
                  </Button>
                  <Button
                    variant="outline"
                    className="rounded-full px-6 bg-transparent text-black cursor-pointer"
                    onClick={() => handleSetAlert(flight.id)}
                  >
                    <Bell className="w-4 h-4 mr-2" />
                    Set Alert
                  </Button>
                </div>
              </div>
            </Card>
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
        <Dialog open={isAlertDialogOpen} onOpenChange={setIsAlertDialogOpen}>
          <DialogContent className="sm:max-w-md max-h-[80vh] sm:max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Set Flight Alert</DialogTitle>
              <DialogDescription>
                Get notified when seat availability changes for this specific flight.
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4 pb-4 pt-0">
              {selectedFlight && (
                <div className="bg-gradient-to-br from-[#00BBA7]/10 to-[#00BBA7]/5 border border-[#00BBA7]/30 rounded-lg p-3 space-y-1.5">
                  <p className="font-semibold text-gray-600 uppercase tracking-wide mb-1.5 text-xs">Alert Details</p>
                  <div className="space-y-1">
                    <div className="flex items-center gap-1.5 text-base">
                      <Plane className="w-3.5 h-3.5 text-[#00BBA7]" />
                      <span className="font-semibold text-gray-800">{selectedFlight.airline}</span>
                      <span className="text-gray-600">{selectedFlight.flightNumber}</span>
                    </div>
                    <div className="flex items-center gap-1.5 text-base">
                      <MapPin className="w-3.5 h-3.5 text-[#00BBA7]" />
                      <span className="font-medium text-gray-700">
                        {selectedFlight.from} → {selectedFlight.to}
                      </span>
                    </div>
                    <div className="flex items-center gap-1.5 text-base">
                      <Calendar className="w-3.5 h-3.5 text-[#00BBA7]" />
                      <span className="text-gray-700">{selectedFlight.date}</span>
                    </div>
                    <div className="flex items-center gap-1.5 text-base">
                      <Clock className="w-3.5 h-3.5 text-[#00BBA7]" />
                      <span className="text-gray-700">
                        {selectedFlight.departureTime} - {selectedFlight.arrivalTime}
                      </span>
                    </div>
                  </div>
                </div>
              )}

              <div className="space-y-3">
                <Label htmlFor="flight-cabin-select" className="text-sm font-medium">
                  Select Cabin
                </Label>
                <Select value={selectedCabin} onValueChange={setSelectedCabin}>
                  <SelectTrigger id="flight-cabin-select" className="rounded-lg">
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

              {/* CHANGE: Updated threshold to "below" for flight-specific alerts with visual emphasis */}
              <div className="space-y-3 pt-2 border-t border-gray-200">
                <div className="flex items-center gap-2">
                  <Label className="text-sm font-medium text-gray-700">Availability Threshold (Optional)</Label>
                  <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-amber-100 text-amber-800 border border-amber-200">
                    Below Threshold
                  </span>
                </div>
                <p className="text-xs text-gray-500 -mt-1">Get notified when availability drops below this level</p>

                <div className="space-y-3">
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-700">Alert when availability drops <span className="font-semibold underline decoration-amber-400 decoration-2 underline-offset-2">below:</span></span>
                      {/* CHANGE: Removed percentage display, showing only seat count */}
                      <span className="text-lg font-semibold text-amber-600">
                        {seatCountThreshold} seats
                      </span>
                    </div>
                    <input
                      type="range"
                      min="5"
                      max="100"
                      step="5"
                      value={seatCountThreshold}
                      onChange={(e) => setSeatCountThreshold(Number(e.target.value))}
                      className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-5 [&::-webkit-slider-thumb]:h-5 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-amber-500 [&::-webkit-slider-thumb]:cursor-pointer [&::-moz-range-thumb]:w-5 [&::-moz-range-thumb]:h-5 [&::-moz-range-thumb]:rounded-full [&::-moz-range-thumb]:bg-amber-500 [&::-moz-range-thumb]:border-0 [&::-moz-range-thumb]:cursor-pointer"
                      style={{
                        background: `linear-gradient(to right, #f59e0b 0%, #f59e0b ${(seatCountThreshold / 100) * 100}%, #e5e7eb ${(seatCountThreshold / 100) * 100}%, #e5e7eb 100%)`,
                      }}
                    />
                    <div className="flex justify-between text-xs text-gray-500">
                      <span>5 seats</span>
                      <span>50 seats</span>
                      <span>100 seats</span>
                    </div>
                    <p className="text-xs text-gray-500 bg-amber-50 border border-amber-200 rounded p-2">
                      ⚠️ Get alerted when seat count drops <strong>below {seatCountThreshold} seats ({Math.round((seatCountThreshold / 144) * 100)}% of the total)</strong>, indicating limited seats remaining
                    </p>
                  </div>
                </div>
              </div>

              <div className="bg-gray-50 rounded-lg p-3">
                <div className="flex items-center gap-2 text-sm">
                  <Clock className="w-4 h-4 text-gray-500" />
                  <span className="font-medium text-gray-700">Alert expires on departure:</span>
                  <span className="text-gray-600">
                    {selectedFlight?.date}
                  </span>
                </div>
              </div>
            </div>

            <DialogFooter className="flex-col sm:flex-row gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsAlertDialogOpen(false)}
                className="rounded-full cursor-pointer"
              >
                Cancel
              </Button>
              <Button
                type="button"
                onClick={handleConfirmAlert}
                className="bg-black text-white hover:bg-gray-800 rounded-full cursor-pointer"
              >
                Confirm Alert
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  )
}
