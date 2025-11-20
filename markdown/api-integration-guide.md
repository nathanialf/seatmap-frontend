# Flight Offers API Integration Guide

This guide explains how to use the helper functions created to facilitate integration between the frontend and backend of the flight search application.

## Helper Location

All helpers are located in the file: `lib/api-helpers.ts`

---

## 1. Preparing Data to Send to Backend

### Function: `prepareFlightSearchPayload()`

This function takes data from the search form and formats it correctly to send to the `POST /flight-offers` endpoint.

### Usage

\`\`\`typescript
import { prepareFlightSearchPayload } from '@/lib/api-helpers'

// Form data (can come from either of the two search forms)
const searchParams = {
  origin: 'lax',           // Origin airport code
  destination: 'jfk',      // Destination airport code
  date: '2025-12-15',      // Date in YYYY-MM-DD format
  airline: 'AA',           // Airline code (optional)
  flightNumber: '123'      // Flight number (optional)
}

// Prepare the payload for the API
const apiPayload = prepareFlightSearchPayload(searchParams)

// Result:
// {
//   origin: 'LAX',
//   destination: 'JFK',
//   departureDate: '2025-12-15',
//   flightNumber: 'AA123'  // Combines airline + flightNumber if both exist
// }
\`\`\`

### Input Parameters

\`\`\`typescript
{
  origin: string        // IATA code of origin airport (converted to uppercase)
  destination: string   // IATA code of destination airport (converted to uppercase)
  date: string         // Departure date in YYYY-MM-DD format
  airline?: string     // Airline code (optional, e.g., "AA", "DL")
  flightNumber?: string // Flight number (optional, e.g., "123")
}
\`\`\`

### Output Parameters (for API)

\`\`\`typescript
{
  origin: string           // REQUIRED - IATA code in uppercase (e.g., "LAX")
  destination: string      // REQUIRED - IATA code in uppercase (e.g., "JFK")
  departureDate: string    // REQUIRED - Date in YYYY-MM-DD format
  flightNumber?: string    // OPTIONAL - Airline code + number (e.g., "AA123")
}
\`\`\`

### Important Notes

- Airport codes are automatically converted to uppercase
- If both `airline` and `flightNumber` are provided, they are combined into a single field (e.g., "AA" + "123" = "AA123")
- Optional fields are only included in the payload if they have values
- The `date` field is renamed to `departureDate` to match the API

---

## 2. Transforming API Response for Frontend

### Function: `transformAPIResponseToFlights()`

This function takes the API response and transforms it into the format expected by the frontend to display search results.

### Usage

\`\`\`typescript
import { transformAPIResponseToFlights } from '@/lib/api-helpers'

// API response
const apiResponse = {
  data: {
    itineraries: [
      {
        departure: {
          iataCode: 'LAX',
          at: '2025-12-15T08:00:00'
        },
        arrival: {
          iataCode: 'JFK',
          at: '2025-12-15T16:35:00'
        },
        carrierCode: 'AA',
        number: '123',
        duration: 'PT5H35M'
      }
    ]
  }
}

// Transform for frontend
const flights = transformAPIResponseToFlights(apiResponse)

// Result:
// [
//   {
//     id: 1,
//     airline: 'American Airlines',
//     flightNumber: 'AA 123',
//     departure: {
//       city: 'Los Angeles',
//       code: 'LAX',
//       time: '08:00 AM'
//     },
//     arrival: {
//       city: 'New York',
//       code: 'JFK',
//       time: '04:35 PM'
//     },
//     duration: '5h 35m',
//     date: 'Wed, Dec 15, 2025',
//     availableSeats: 12,
//     price: '$299'
//   }
// ]
\`\`\`

### API Response Structure

\`\`\`typescript
{
  data: {
    itineraries: [
      {
        departure: {
          iataCode: string      // IATA code of departure airport (e.g., "LAX")
          at: string           // ISO 8601 date and time (e.g., "2025-12-15T08:00:00")
        },
        arrival: {
          iataCode: string      // IATA code of arrival airport (e.g., "JFK")
          at: string           // ISO 8601 date and time (e.g., "2025-12-15T16:35:00")
        },
        carrierCode: string     // Airline code (e.g., "AA", "DL", "UA")
        number: string         // Flight number (e.g., "123")
        duration: string       // Duration in ISO 8601 format (e.g., "PT5H35M")
      }
    ]
  }
}
\`\`\`

### Output Structure (for Frontend)

\`\`\`typescript
[
  {
    id: number                    // Unique ID generated automatically
    airline: string               // Full airline name (e.g., "American Airlines")
    flightNumber: string          // Code + number with space (e.g., "AA 123")
    departure: {
      city: string               // Departure city name
      code: string               // IATA code (e.g., "LAX")
      time: string               // Formatted time (e.g., "08:00 AM")
    },
    arrival: {
      city: string               // Arrival city name
      code: string               // IATA code (e.g., "JFK")
      time: string               // Formatted time (e.g., "04:35 PM")
    },
    duration: string              // Readable duration (e.g., "5h 35m")
    date: string                  // Formatted date (e.g., "Wed, Dec 15, 2025")
    availableSeats: number        // Number of available seats (default value: 12)
    price: string                 // Formatted price (default value: "$299")
  }
]
\`\`\`

### Automatic Conversions

1. **Airline codes to full names:**
   - `AA` → American Airlines
   - `DL` → Delta Airlines
   - `UA` → United Airlines
   - `B6` → JetBlue Airways
   - `WN` → Southwest Airlines
   - `AS` → Alaska Airlines

2. **IATA codes to city names:**
   - `LAX` → Los Angeles
   - `JFK` → New York
   - `ORD` → Chicago
   - `MIA` → Miami
   - `SFO` → San Francisco
   - `BOS` → Boston
   - `SEA` → Seattle
   - `DEN` → Denver
   - `ATL` → Atlanta
   - `DFW` → Dallas

3. **Time format:**
   - From: `2025-12-15T08:00:00` (ISO 8601)
   - To: `08:00 AM` (12-hour format)

4. **Duration format:**
   - From: `PT5H35M` (ISO 8601)
   - To: `5h 35m` (readable format)

5. **Date format:**
   - From: `2025-12-15T08:00:00`
   - To: `Wed, Dec 15, 2025`

---

## 3. Complete Integration Example

### Step 1: Capture form data and make the request

\`\`\`typescript
import { prepareFlightSearchPayload } from '@/lib/api-helpers'

// Search form data
const searchParams = {
  origin: 'lax',
  destination: 'jfk',
  date: '2025-12-15',
  airline: 'AA',
  flightNumber: '123'
}

// Prepare the payload
const payload = prepareFlightSearchPayload(searchParams)

// Make the request to the backend
const response = await fetch('/api/flight-offers', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
  },
  body: JSON.stringify(payload)
})

const apiResponse = await response.json()
\`\`\`

### Step 2: Transform the response to display in the frontend

\`\`\`typescript
import { transformAPIResponseToFlights } from '@/lib/api-helpers'

// Transform the API response
const flights = transformAPIResponseToFlights(apiResponse)

// Now 'flights' is ready to be used in the results component
// The frontend is already prepared to receive this format
\`\`\`

---

## 4. Frontend Form Locations

There are **two forms** that capture search data:

### Form 1: Home Page (`app/page.tsx`)
- Located on the home page (`/`)
- Captures: `origin`, `destination`, `date`, `airline`, `flightNumber`
- State: `searchParams`

### Form 2: New Search (`app/search/page.tsx`)
- Located on the results page (`/search`)
- Allows making a new search without leaving the results page
- Captures the same fields
- State: `formInputs`

**Both forms** use the same data structure and can use the `prepareFlightSearchPayload()` function in the same way.

---

## 5. Additional Notes

### Default Values

The `transformAPIResponseToFlights()` function assigns default values for fields that the API might not provide:

- `availableSeats`: 12 (if not in the response)
- `price`: "$299" (if not in the response)

If the API provides these fields in the future, you can modify the function to use them.

### Error Handling

If the API returns an error or has no itineraries, the `transformAPIResponseToFlights()` function will return an empty array `[]`.

### Extensibility

If you need to add more fields or transformations:

1. Update the TypeScript interfaces in `lib/api-helpers.ts`
2. Modify the transformation functions as needed
3. Changes will not affect the frontend since the output structure remains the same

---

## 6. Summary

- **To send data to backend:** Use `prepareFlightSearchPayload(searchParams)`
- **To display data in frontend:** Use `transformAPIResponseToFlights(apiResponse)`
- **Don't change the frontend:** These functions are designed so the frontend doesn't need modifications
- **Both forms work the same:** Use the same functions for both search forms
