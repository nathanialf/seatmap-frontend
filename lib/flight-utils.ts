import type { FlightSearchParams, Flight } from "@/lib/api-helpers"
import logger from "@/lib/logger"

// Helper function to format travel class for display
export function formatTravelClassForDisplay(travelClass: string): string {
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

// Helper function to format flight date from search params
export function formatFlightDate(dateString: string): string {
  try {
    const [year, month, day] = dateString.split("-").map(Number)
    return new Date(year, month - 1, day).toLocaleDateString("en-US", {
      weekday: "short",
      month: "short",
      day: "numeric",
      year: "numeric",
    })
  } catch {
    return dateString
  }
}

// Transform backend flight response to frontend Flight format
export function transformFlightData(
  backendFlights: Record<string, unknown>[], 
  dictionaries: Record<string, Record<string, string>> = {}
): Flight[] {
  return backendFlights.map((flight: Record<string, unknown>, index: number) => {
    const segments = flight.itineraries?.[0]?.segments || [];
    const carrierCode = segments[0]?.carrierCode || '';
    const flightNum = segments[0]?.number || '';
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
      })(),
      // Capture seatmap data from API response
      seatmapAvailable: flight.seatMapAvailable || false,
      seatmapData: flight.seatMap || null,
      // Capture segment information (seatmap is at flight level, not segment level)
      segments: segments.map((segment: Record<string, unknown>, segIndex: number) => ({
        segmentIndex: segIndex,
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
        // For multi-segment flights, seatmap availability is at flight level
        seatMapAvailable: flight.seatMapAvailable || false,
        seatMapData: flight.seatMap || null
      }))
    };
  })
}

// Create flight offer data structure for bookmarking
export function createFlightOfferData(flight: Flight): Record<string, unknown> {
  // Extract carrier code and flight number from flightNumber (e.g., "UA 1679")
  const flightNumberMatch = flight.flightNumber.match(/^(\w+)\s+(\d+)$/)
  const carrierCode = flightNumberMatch?.[1] || 'XX'
  const number = flightNumberMatch?.[2] || '0000'

  // Parse flight date and times to create ISO strings
  let departureAt = "2025-01-01T00:00:00.000Z"
  let arrivalAt = "2025-01-01T00:00:00.000Z"
  
  try {
    const dateStr = flight.date.replace(/^\w+,\s*/, '') // Remove day of week: "Dec 15, 2025"
    const departureDateTime = new Date(`${dateStr} ${flight.departure.time}`)
    const arrivalDateTime = new Date(`${dateStr} ${flight.arrival.time}`)
    
    if (!isNaN(departureDateTime.getTime())) {
      departureAt = departureDateTime.toISOString()
    }
    if (!isNaN(arrivalDateTime.getTime())) {
      arrivalAt = arrivalDateTime.toISOString()
    }
  } catch (parseError) {
    logger.warn('Failed to parse flight date/time:', parseError)
  }

  return {
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
}

// Create search request object for bookmarking
export function createSearchRequest(searchParams: FlightSearchParams): Record<string, unknown> {
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

  return searchRequest
}

// Helper function to get seat letter from column index
export function getSeatLetter(col: number): string {
  const letters = ["A", "B", "C", "D", "E", "F", "G", "H", "J", "K"]
  return letters[col] || ""
}

// Helper function to format date for flight alerts
export function formatDateForAlert(dateString: string): string {
  try {
    const [year, month, day] = dateString.split("-").map(Number)
    return new Date(year, month - 1, day).toLocaleDateString("en-US", {
      weekday: "short",
      month: "short",
      day: "numeric",
      year: "numeric",
    })
  } catch {
    return dateString
  }
}

// Helper function to parse flight date and create formatted date
export function parseDateFromFlightDate(flightDate: string): string {
  const dateMatch = flightDate.match(/(\w+)\s+(\d+),\s+(\d+)/)
  if (!dateMatch) return flightDate

  const monthName = dateMatch[1]
  const day = dateMatch[2]
  const year = dateMatch[3]

  const monthMap: { [key: string]: number } = {
    Jan: 0, Feb: 1, Mar: 2, Apr: 3, May: 4, Jun: 5,
    Jul: 6, Aug: 7, Sep: 8, Oct: 9, Nov: 10, Dec: 11,
  }

  const monthIndex = monthMap[monthName]
  if (monthIndex !== undefined) {
    const dateObj = new Date(Number.parseInt(year), monthIndex, Number.parseInt(day))
    return dateObj.toLocaleDateString("en-US", {
      weekday: "short",
      month: "short",
      day: "numeric",
      year: "numeric",
    })
  }
  
  return flightDate
}

// Helper function to validate search parameters
export function validateSearchParams(params: FlightSearchParams): string[] {
  const errors: string[] = []
  
  if (!params.origin?.trim()) {
    errors.push("Origin airport is required")
  }
  
  if (!params.destination?.trim()) {
    errors.push("Destination airport is required")
  }
  
  if (!params.date?.trim()) {
    errors.push("Flight date is required")
  }
  
  // Validate date format and that it's not in the past
  if (params.date) {
    const dateObj = new Date(params.date)
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    
    if (isNaN(dateObj.getTime())) {
      errors.push("Invalid date format")
    } else if (dateObj < today) {
      errors.push("Flight date cannot be in the past")
    }
  }
  
  return errors
}