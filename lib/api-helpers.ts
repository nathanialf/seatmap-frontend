/**
 * API Helper Functions
 * Utilities to format frontend data for backend API calls
 */

export interface FlightSearchParams {
  origin: string
  destination: string
  date: string
  airline?: string
  flightNumber?: string
  seatClass?: string
}

export interface FlightOffersAPIPayload {
  origin: string
  destination: string
  departureDate: string
  travelClass?: string
  flightNumber?: string
  maxResults?: number
  includeRawFlightOffer?: boolean
}

/**
 * Prepares flight search parameters for the POST /flight-offers API endpoint
 *
 * @param params - The search parameters from the frontend form
 * @returns Formatted payload ready for API submission
 *
 * @example
 * const formData = {
 *   origin: "lax",
 *   destination: "jfk",
 *   date: "2025-12-15",
 *   airline: "AA",
 *   flightNumber: "1234"
 * }
 *
 * const apiPayload = prepareFlightSearchPayload(formData)
 * // Returns:
 * // {
 * //   origin: "LAX",
 * //   destination: "JFK",
 * //   departureDate: "2025-12-15",
 * //   flightNumber: "AA1234"
 * // }
 */
export function prepareFlightSearchPayload(params: FlightSearchParams): FlightOffersAPIPayload {
  // Ensure origin and destination are uppercase 3-letter IATA codes
  const origin = params.origin.trim().toUpperCase().slice(0, 3)
  const destination = params.destination.trim().toUpperCase().slice(0, 3)

  // Rename 'date' to 'departureDate' as required by API
  const departureDate = params.date

  // Build the base payload with required fields
  const payload: FlightOffersAPIPayload = {
    origin,
    destination,
    departureDate,
    maxResults: 10, // Set to 10 as requested
    includeRawFlightOffer: false, // Don't need raw data for frontend
  }

  // Handle optional flightNumber field
  // Backend expects flightNumber to be either airline code (e.g., "UA") or full flight number (e.g., "UA1679")
  if (params.airline && params.flightNumber) {
    // Both airline and flight number provided: combine them (e.g., "UA" + "1679" = "UA1679")
    payload.flightNumber = `${params.airline.trim().toUpperCase()}${params.flightNumber.trim()}`
    payload.maxResults = 3 // Specific flight search, get a few results
  } else if (params.airline) {
    // Only airline provided: use airline code as filter (e.g., "UA")
    payload.flightNumber = params.airline.trim().toUpperCase()
  } else if (params.flightNumber) {
    // Only flight number provided: use as-is
    payload.flightNumber = params.flightNumber.trim().toUpperCase()
    payload.maxResults = 3 // Specific flight search, get a few results
  }

  // Handle optional seatClass field - pass through directly since frontend now uses API values
  if (params.seatClass) {
    payload.travelClass = params.seatClass.trim()
  }

  return payload
}

/**
 * API Response Types
 */

export interface APIItinerary {
  departure: {
    iataCode: string
    at: string // ISO datetime format: "2025-12-15T08:00:00"
  }
  arrival: {
    iataCode: string
    at: string // ISO datetime format: "2025-12-15T16:35:00"
  }
  carrierCode: string // e.g., "AA"
  number: string // e.g., "123"
  duration: string // ISO 8601 duration format: "PT5H35M"
  availableSeats?: number // Optional: number of available seats
  price?: {
    total: string // e.g., "450.00"
    currency: string // e.g., "USD"
  }
}

export interface APIFlightOffersResponse {
  data: {
    itineraries: APIItinerary[]
  }
}

/**
 * Frontend Flight Data Structure
 */
export interface Flight {
  id: number
  airline: string
  flightNumber: string
  departure: {
    city: string
    code: string
    time: string
  }
  arrival: {
    city: string
    code: string
    time: string
  }
  duration: string
  date: string
  availableSeats: number
  price: string
  stops: number
  connections: string[]
}

/**
 * Airline carrier code to full name mapping
 */
const AIRLINE_NAMES: Record<string, string> = {
  AA: "American Airlines",
  DL: "Delta Airlines",
  UA: "United Airlines",
  WN: "Southwest Airlines",
  B6: "JetBlue Airways",
  AS: "Alaska Airlines",
  NK: "Spirit Airlines",
  F9: "Frontier Airlines",
  G4: "Allegiant Air",
  SY: "Sun Country Airlines",
}

/**
 * Converts ISO datetime string to formatted time (e.g., "08:00 AM")
 */
function formatTime(isoDateTime: string): string {
  const date = new Date(isoDateTime)
  return date.toLocaleTimeString("en-US", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
  })
}

/**
 * Converts ISO datetime string to formatted date (e.g., "Wed, Dec 15, 2025")
 */
function formatDate(isoDateTime: string): string {
  const date = new Date(isoDateTime)
  return date.toLocaleDateString("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
    year: "numeric",
  })
}

/**
 * Converts ISO 8601 duration to readable format (e.g., "PT5H35M" → "5h 35m")
 */
function formatDuration(isoDuration: string): string {
  // Remove 'PT' prefix
  const duration = isoDuration.replace("PT", "")

  // Extract hours and minutes
  const hoursMatch = duration.match(/(\d+)H/)
  const minutesMatch = duration.match(/(\d+)M/)

  const hours = hoursMatch ? hoursMatch[1] : "0"
  const minutes = minutesMatch ? minutesMatch[1] : "0"

  return `${hours}h ${minutes}m`
}

/**
 * Gets airline name from carrier code
 */
function getAirlineName(carrierCode: string): string {
  return AIRLINE_NAMES[carrierCode] || `${carrierCode} Airlines`
}

/**
 * Transforms API flight offers response to frontend flight data structure
 *
 * @param apiResponse - The response from POST /flight-offers API endpoint
 * @returns Array of flights formatted for frontend display
 *
 * @example
 * const apiResponse = await fetch('/api/flight-offers', {
 *   method: 'POST',
 *   body: JSON.stringify(apiPayload)
 * }).then(res => res.json())
 *
 * const flights = transformAPIResponseToFlights(apiResponse)
 * // Returns array of Flight objects ready for UI rendering
 */
export function transformAPIResponseToFlights(apiResponse: APIFlightOffersResponse): Flight[] {
  if (!apiResponse.data?.itineraries || !Array.isArray(apiResponse.data.itineraries)) {
    return []
  }

  return apiResponse.data.itineraries.map((itinerary, index) => {
    const departureCode = itinerary.departure.iataCode
    const arrivalCode = itinerary.arrival.iataCode
    const carrierCode = itinerary.carrierCode
    const flightNumber = itinerary.number

    return {
      id: index + 1,
      airline: getAirlineName(carrierCode),
      flightNumber: `${carrierCode} ${flightNumber}`,
      departure: {
        city: departureCode, // Using IATA code as city for now
        code: departureCode,
        time: formatTime(itinerary.departure.at),
      },
      arrival: {
        city: arrivalCode, // Using IATA code as city for now
        code: arrivalCode,
        time: formatTime(itinerary.arrival.at),
      },
      duration: formatDuration(itinerary.duration),
      date: formatDate(itinerary.departure.at),
      availableSeats: itinerary.availableSeats || 0,
      price: itinerary.price ? `$${itinerary.price.total}` : "$0",
    }
  })
}

/**
 * Example usage when making the API call:
 *
 * const apiPayload = prepareFlightSearchPayload(searchParams)
 * const response = await fetch('/api/flight-offers', {
 *   method: 'POST',
 *   headers: { 'Content-Type': 'application/json' },
 *   body: JSON.stringify(apiPayload)
 * })
 *
 * const apiResponse = await response.json()
 * const flights = transformAPIResponseToFlights(apiResponse)
 *
 * // Use flights in your UI
 * setFlights(flights)
 */
