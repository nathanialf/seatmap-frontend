"use client"

import React from "react"
import { usePathname } from "next/navigation"
import { useState, useEffect } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Navbar } from "@/components/navbar"
import { Check, Bell, Calendar, Search, Plane, MapPin, ArrowLeft, X } from "lucide-react"

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

type SeatData = {
  cabin: "M" | "F" | "B" // Economy, Business, First Class
  number: string
  characteristicsCodes: string[]
  travelerPricing: {
    travelerId: string
    seatAvailabilityStatus: SeatAvailabilityStatus
  }[]
}

type SeatStatus = "available" | "occupied" | "blocked" | "selected" | "exit" | "wing"

const RegistrationModal = ({ onClose }: { onClose: () => void }) => (
  <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
    <Card className="max-w-md w-full p-8 relative">
      <button
        onClick={onClose}
        className="absolute top-4 right-4 text-gray-400 hover:text-gray-600"
      >
        <X className="w-5 h-5" />
      </button>

      <div className="text-center mb-6">
        <div className="w-16 h-16 bg-teal-50 rounded-full flex items-center justify-center mx-auto mb-4">
          <Bell className="w-8 h-8 text-teal-500" />
        </div>
        <h3 className="text-2xl font-bold text-gray-900 mb-2">Want to see more?</h3>
        <p className="text-gray-600">
          You&apos;ve viewed your free seat maps. Create an account to continue tracking flights and get instant alerts.
        </p>
      </div>

      <div className="space-y-3">
        <Link href="/auth/signup" className="block">
          <Button className="w-full bg-black text-white hover:bg-gray-800 rounded-full py-6 cursor-pointer">
            Create Free Account
          </Button>
        </Link>
        <Link href="/auth/signin" className="block">
          <Button variant="outline" className="w-full rounded-full py-6 bg-transparent">
            Already have an account? Sign In
          </Button>
        </Link>
      </div>

      <p className="text-xs text-gray-500 text-center mt-4">Free plan includes 5 seat map views per day</p>
    </Card>
  </div>
)

export default function HomePage() {
  const pathname = usePathname()
  const [showSearch, setShowSearch] = useState(false)
  const [hasSearched, setHasSearched] = useState(false)
  const [currentTestimonial, setCurrentTestimonial] = useState(0)
  const [selectedFlightForSeatMap, setSelectedFlightForSeatMap] = useState<number | null>(null)
  const [showRegistrationModal, setShowRegistrationModal] = useState(false)
  const [isDragging, setIsDragging] = useState(false)
  const [startX, setStartX] = useState(0)
  const [dragOffset, setDragOffset] = useState(0)
  const [isTransitioning, setIsTransitioning] = useState(true)
  const [searchParams, setSearchParams] = useState({
    origin: "",
    destination: "",
    date: "",
    airline: "",
    flightNumber: "",
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
    "15C": "OCCUPIED",
    "15D": "AVAILABLE",
    "15E": "BLOCKED",
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

  const mockSeatData: SeatData[] = [
    {
      cabin: "M",
      number: "8A",
      characteristicsCodes: ["A", "CH", "LS", "O"],
      travelerPricing: [{ travelerId: "1", seatAvailabilityStatus: "AVAILABLE" }],
    },
    {
      cabin: "M",
      number: "8B",
      characteristicsCodes: ["A", "CH", "LS"],
      travelerPricing: [{ travelerId: "1", seatAvailabilityStatus: "OCCUPIED" }],
    },
    {
      cabin: "M",
      number: "8C",
      characteristicsCodes: ["A", "CH", "LS", "O"],
      travelerPricing: [{ travelerId: "1", seatAvailabilityStatus: "AVAILABLE" }],
    },
    {
      cabin: "M",
      number: "8D",
      characteristicsCodes: ["A", "CH", "LS"],
      travelerPricing: [{ travelerId: "1", seatAvailabilityStatus: "BLOCKED" }],
    },
    {
      cabin: "M",
      number: "9A",
      characteristicsCodes: ["A", "CH", "LS"],
      travelerPricing: [{ travelerId: "1", seatAvailabilityStatus: "OCCUPIED" }],
    },
    {
      cabin: "M",
      number: "9B",
      characteristicsCodes: ["A", "CH", "LS", "O"],
      travelerPricing: [{ travelerId: "1", seatAvailabilityStatus: "AVAILABLE" }],
    },
    {
      cabin: "M",
      number: "10C",
      characteristicsCodes: ["A", "CH", "LS"],
      travelerPricing: [{ travelerId: "1", seatAvailabilityStatus: "BLOCKED" }],
    },
  ]

  const getSeatStatusFromBackend = (row: number, seatLetter: string): SeatAvailabilityStatus | null => {
    const seatNumber = `${row}${seatLetter}`
    const seatData = mockSeatData.find((seat) => seat.number === seatNumber)
    return seatData?.travelerPricing[0]?.seatAvailabilityStatus || null
  }

  const testimonials = [
    {
      name: "Jessica Martinez",
      role: "Flight Attendant, Delta",
      image: "/professional-woman-smiling.jpg",
      title: "No More Wasted Airport Trips",
      quote:
        "I used to drive 45 minutes to the airport just to get bumped. Now I check MySeatMap before I even leave my house. Saved me so many headaches.",
    },
    {
      name: "Michael Rodriguez",
      role: "Pilot, United Airlines",
      image: "/professional-man.jpg",
      title: "Finally, I Can Plan My Commute",
      quote:
        "As a commuter pilot, knowing seat availability before heading to the airport is huge. This app has made my life so much easier.",
    },
    {
      name: "Sarah Chen",
      role: "Gate Agent, American",
      image: "/professional-woman-diverse.jpg",
      title: "Perfect for Non-Rev Travel",
      quote:
        "I tell all my coworkers about this. Being able to see the seat map and availability in real-time means I actually know if I&apos;m getting on that flight.",
    },
    {
      name: "David Park",
      role: "Frequent Flyer",
      image: "/business-professional-man.jpg",
      title: "Never Stuck in a Middle Seat Again",
      quote:
        "I fly every week for work. This app alerts me the second a window or aisle opens up. No more being squeezed between two strangers for 5 hours.",
    },
    {
      name: "Emily Thompson",
      role: "Business Traveler",
      image: "/young-professional-woman.jpg",
      title: "Upgrade Alerts That Actually Work",
      quote:
        "I set alerts for business class seats and got upgraded on three flights last month. The notifications are instant and accurate.",
    },
  ]

  const extendedTestimonials = [testimonials[testimonials.length - 1], ...testimonials, testimonials[0]]

  const flights = [
    {
      id: 1,
      airline: "American Airlines",
      flightNumber: "AA 1234",
      departure: { city: "Los Angeles", code: "LAX", time: "08:00 AM" },
      arrival: { city: "New York", code: "JFK", time: "04:30 PM" },
      duration: "5h 30m",
      date: "Dec 15, 2024",
      availableSeats: 12,
      price: "$450",
    },
    {
      id: 2,
      airline: "Delta Airlines",
      flightNumber: "DL 5678",
      departure: { city: "Los Angeles", code: "LAX", time: "10:30 AM" },
      arrival: { city: "New York", code: "JFK", time: "07:00 PM" },
      duration: "5h 30m",
      date: "Dec 15, 2024",
      availableSeats: 8,
      price: "$425",
    },
    {
      id: 3,
      airline: "United Airlines",
      flightNumber: "UA 9012",
      departure: { city: "Los Angeles", code: "LAX", time: "02:15 PM" },
      arrival: { city: "New York", code: "JFK", time: "10:45 PM" },
      duration: "5h 30m",
      date: "Dec 15, 2024",
      availableSeats: 15,
      price: "$475",
    },
  ]

  // Reset state when pathname changes to home
  const shouldReset = pathname === "/"
  const [lastPathname, setLastPathname] = React.useState(pathname)
  
  if (shouldReset && lastPathname !== "/") {
    setShowSearch(false)
    setHasSearched(false)
    setSelectedFlightForSeatMap(null)
  }
  
  if (lastPathname !== pathname) {
    setLastPathname(pathname)
  }

  useEffect(() => {
    const interval = setInterval(() => {
      // Increment currentTestimonial for automatic sliding
      setCurrentTestimonial((prev) => prev + 1)
    }, 5000)

    return () => clearInterval(interval)
  }, [])

  useEffect(() => {
    if (currentTestimonial === 0) {
      // At the clone of the last item, reset to actual last item
      setTimeout(() => {
        setIsTransitioning(false)
        setCurrentTestimonial(testimonials.length)
      }, 500)
      setTimeout(() => {
        setIsTransitioning(true)
      }, 550)
    } else if (currentTestimonial === testimonials.length + 1) {
      // At the clone of the first item, reset to actual first item
      setTimeout(() => {
        setIsTransitioning(false)
        setCurrentTestimonial(1)
      }, 500)
      setTimeout(() => {
        setIsTransitioning(true)
      }, 550)
    }
  }, [currentTestimonial, testimonials.length])

  // Initialize seat map view count (hydration-safe)
  const [seatMapViewCount, setSeatMapViewCount] = useState(0)
  
  // Use ref to track if we've initialized from localStorage
  const hasInitialized = React.useRef(false)
  
  // Initialize from localStorage only after hydration
  React.useLayoutEffect(() => {
    if (!hasInitialized.current && typeof window !== 'undefined') {
      const storedCount = localStorage.getItem("seatMapViewCount")
      if (storedCount) {
        setSeatMapViewCount(Number.parseInt(storedCount, 10))
      }
      hasInitialized.current = true
    }
  }, [])

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    setHasSearched(true)
  }

  const handleViewSeatMap = (flightId: number) => {
    const currentCount = seatMapViewCount

    if (currentCount >= 2) {
      setShowRegistrationModal(true)
      return
    }

    const newCount = currentCount + 1
    setSeatMapViewCount(newCount)
    localStorage.setItem("seatMapViewCount", newCount.toString())
    setSelectedFlightForSeatMap(flightId)

    if (newCount >= 2) {
      setTimeout(() => {
        setShowRegistrationModal(true)
      }, 3000)
    }
  }

  const getSeatStatus = (row: number, col: number): SeatStatus => {
    if (deckConfig.exitRowsX.includes(row)) {
      return "exit"
    }

    const seatLetter = getSeatLetter(col)
    const seatNumber = `${row}${seatLetter}`
    const backendStatus = getSeatStatusFromBackend(row, seatLetter)

    if (backendStatus) {
      if (backendStatus === "AVAILABLE") return "available"
      if (backendStatus === "OCCUPIED") return "occupied"
      if (backendStatus === "BLOCKED") return "blocked"
    }

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


  if (selectedFlightForSeatMap !== null) {
    const flight = flights.find((f) => f.id === selectedFlightForSeatMap)
    if (!flight) return null

    return (
      <div className="min-h-screen bg-white">
        <Navbar />
        <div className="max-w-7xl mx-auto px-6 py-8">
          <div className="mb-6">
            <Button onClick={() => setSelectedFlightForSeatMap(null)} variant="outline" className="rounded-full mb-4">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Results
            </Button>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Seat Map Viewer</h1>
            <p className="text-gray-600">
              {flight.airline} {flight.flightNumber} • {flight.departure.code} → {flight.arrival.code}
            </p>
          </div>

          <div className="grid lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2">
              <Card className="p-8">
                <div className="mb-8">
                  <div className="flex items-center justify-center gap-6 text-sm">
                    <div className="flex items-center gap-2">
                      <div className="w-6 h-6 bg-white border-2 border-gray-300 rounded"></div>
                      <span>Available</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-6 h-6 bg-gray-900 rounded"></div>
                      <span>Occupied</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-6 h-6 bg-gray-300 rounded"></div>
                      <span>Blocked</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-6 h-6 bg-teal-50 border-2 border-teal-500 rounded"></div>
                      <span>Exit Row</span>
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
                                        ? "bg-white border-2 border-gray-300 text-gray-700"
                                        : seatStatus === "occupied"
                                          ? "bg-gray-900 text-white"
                                          : seatStatus === "blocked"
                                            ? "bg-gray-300 text-gray-500"
                                            : seatStatus === "exit"
                                              ? "bg-teal-50 border-2 border-teal-500 text-teal-700"
                                              : "bg-white border-2 border-gray-300 text-gray-700"
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

            <div className="lg:col-span-1">
              <Card className="p-6 sticky top-6">
                <h3 className="font-semibold text-lg mb-4">Flight Details</h3>
                <div className="space-y-4 text-sm">
                  <div>
                    <div className="text-gray-600">Flight</div>
                    <div className="font-medium">
                      {flight.airline} {flight.flightNumber}
                    </div>
                  </div>
                  <div>
                    <div className="text-gray-600">Route</div>
                    <div className="font-medium">
                      {flight.departure.code} → {flight.arrival.code}
                    </div>
                  </div>
                  <div>
                    <div className="text-gray-600">Date</div>
                    <div className="font-medium">{flight.date}</div>
                  </div>
                  <div>
                    <div className="text-gray-600">Departure</div>
                    <div className="font-medium">{flight.departure.time}</div>
                  </div>
                  <div>
                    <div className="text-gray-600">Arrival</div>
                    <div className="font-medium">{flight.arrival.time}</div>
                  </div>
                  <div className="pt-4 border-t">
                    <div className="text-sm text-gray-600 mb-2">
                      View-only mode. Use this to check seat availability before booking.
                    </div>
                  </div>
                </div>
              </Card>
            </div>
          </div>
        </div>
      </div>
    )
  }

  if (showSearch && !hasSearched) {
    return (
      <div className="min-h-screen bg-white">
        <Navbar />
        <div className="max-w-6xl mx-auto px-6 py-8">
          <div className="max-w-2xl mx-auto">
            <div className="mb-8 text-center">
              <h1 className="text-3xl font-bold text-gray-900 mb-2">Search Flights</h1>
              <p className="text-gray-600">Find your perfect flight and track seat availability</p>
            </div>

            <Card className="p-8">
              <form onSubmit={handleSearch} className="space-y-6">
                <div>
                  <Label htmlFor="origin" className="text-sm font-medium text-gray-700 mb-2 block">
                    Origin Airport *
                  </Label>
                  <Input
                    id="origin"
                    type="text"
                    placeholder="Enter airport name or code (e.g., LAX or Los Angeles)"
                    value={searchParams.origin}
                    onChange={(e) => setSearchParams({ ...searchParams, origin: e.target.value })}
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
                    value={searchParams.destination}
                    onChange={(e) => setSearchParams({ ...searchParams, destination: e.target.value })}
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
                    value={searchParams.date}
                    onChange={(e) => setSearchParams({ ...searchParams, date: e.target.value })}
                    required
                    className="rounded-lg"
                  />
                </div>

                <div className="pt-4 border-t border-gray-200">
                  <p className="text-sm font-medium text-gray-700 mb-4">Optional Information</p>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="airline" className="text-sm font-medium text-gray-600 mb-2 block">
                        Airline Code
                      </Label>
                      <Input
                        id="airline"
                        type="text"
                        placeholder="e.g., AA, DL, UA"
                        value={searchParams.airline}
                        onChange={(e) => setSearchParams({ ...searchParams, airline: e.target.value })}
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
                        value={searchParams.flightNumber}
                        onChange={(e) => setSearchParams({ ...searchParams, flightNumber: e.target.value })}
                        className="rounded-lg"
                      />
                    </div>
                  </div>
                </div>

                <Button
                  type="submit"
                  className="w-full bg-black text-white hover:bg-gray-800 rounded-full py-6 text-lg cursor-pointer"
                >
                  <Search className="w-5 h-5 mr-2" />
                  Search Flights
                </Button>
              </form>
            </Card>
          </div>
        </div>
      </div>
    )
  }

  if (showSearch && hasSearched) {
    return (
      <div className="min-h-screen bg-white">
        <Navbar />
        {showRegistrationModal && <RegistrationModal onClose={() => setShowRegistrationModal(false)} />}

        <div className="max-w-6xl mx-auto px-6 py-8">
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Flight Search Results</h1>
            <p className="text-gray-600">
              {searchParams.origin} → {searchParams.destination} • {searchParams.date}
            </p>
          </div>

          <div className="bg-gray-50 rounded-2xl p-6 mb-8">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div>
                <label className="text-sm text-gray-600 mb-2 block">From</label>
                <div className="bg-white rounded-lg px-4 py-3 border border-gray-200">
                  <div className="font-medium">{searchParams.origin}</div>
                </div>
              </div>
              <div>
                <label className="text-sm text-gray-600 mb-2 block">To</label>
                <div className="bg-white rounded-lg px-4 py-3 border border-gray-200">
                  <div className="font-medium">{searchParams.destination}</div>
                </div>
              </div>
              <div>
                <label className="text-sm text-gray-600 mb-2 block">Date</label>
                <div className="bg-white rounded-lg px-4 py-3 border border-gray-200">
                  <div className="font-medium">{searchParams.date}</div>
                </div>
              </div>
              <div className="flex items-end">
                <Button
                  onClick={() => {
                    setHasSearched(false)
                    setShowSearch(false)
                  }}
                  className="w-full bg-black text-white hover:bg-gray-800 rounded-full cursor-pointer"
                >
                  New Search
                </Button>
              </div>
            </div>
          </div>

          <div className="mb-6">
            <p className="text-sm text-gray-600">{flights.length} flights found</p>
          </div>

          <div className="space-y-4">
            {flights.map((flight) => (
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
                        <div className="text-xs text-gray-500">{flight.departure.city}</div>
                      </div>

                      <div className="flex-1 flex flex-col items-center">
                        <div className="text-xs text-gray-500 mb-1">{flight.duration}</div>
                        <div className="w-full h-px bg-gray-300 relative">
                          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-white px-2">
                            <Plane className="w-4 h-4 text-gray-400 rotate-90" />
                          </div>
                        </div>
                        <div className="text-xs text-gray-500 mt-1">Non-stop</div>
                      </div>

                      <div>
                        <div className="text-2xl font-bold">{flight.arrival.time}</div>
                        <div className="text-sm text-gray-600">{flight.arrival.code}</div>
                        <div className="text-xs text-gray-500">{flight.arrival.city}</div>
                      </div>
                    </div>

                    <div className="mt-4 flex items-center gap-4 text-sm text-gray-600">
                      <div className="flex items-center gap-1">
                        <MapPin className="w-4 h-4" />
                        <span>{flight.availableSeats} seats available</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex flex-col items-end gap-3">
                    <div className="text-right">
                      <div className="text-3xl font-bold">{flight.price}</div>
                      <div className="text-sm text-gray-500">per person</div>
                    </div>
                    <Button
                      onClick={() => handleViewSeatMap(flight.id)}
                      className="bg-black text-white hover:bg-gray-800 rounded-full px-6 cursor-pointer"
                    >
                      View Seat Map
                    </Button>
                    <Button variant="outline" className="rounded-full px-6 bg-transparent cursor-pointer">
                      <Bell className="w-4 h-4 mr-2" />
                      Set Alert
                    </Button>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </div>
      </div>
    )
  }

  const handleDragStart = (clientX: number) => {
    setIsDragging(true)
    setStartX(clientX)
    setCurrentX(clientX)
  }

  const handleDragMove = (clientX: number) => {
    if (!isDragging) return
    setCurrentX(clientX)
    setDragOffset(clientX - startX)
  }

  const handleDragEnd = () => {
    if (!isDragging) return
    setIsDragging(false)

    const threshold = 50 // minimum drag distance to trigger slide change

    if (dragOffset > threshold) {
      setCurrentTestimonial((prev) => prev - 1)
    } else if (dragOffset < -threshold) {
      setCurrentTestimonial((prev) => prev + 1)
    }

    setDragOffset(0)
    setStartX(0)
    setCurrentX(0)
  }

  const handleMouseDown = (e: React.MouseEvent) => {
    handleDragStart(e.clientX)
  }

  const handleMouseMove = (e: React.MouseEvent) => {
    handleDragMove(e.clientX)
  }

  const handleMouseUp = () => {
    handleDragEnd()
  }

  const handleMouseLeave = () => {
    if (isDragging) {
      handleDragEnd()
    }
  }

  const handleTouchStart = (e: React.TouchEvent) => {
    handleDragStart(e.touches[0].clientX)
  }

  const handleTouchMove = (e: React.TouchEvent) => {
    handleDragMove(e.touches[0].clientX)
  }

  const handleTouchEnd = () => {
    handleDragEnd()
  }

  return (
    <div className="min-h-screen bg-white">
      <Navbar />

      <section className="text-center px-6 pb-5 max-w-6xl mx-auto pt-[30px]">
        <Link href="/search">
          <div className="inline-flex items-center bg-black text-white text-sm px-4 py-2 rounded-full mb-8 hover:bg-gray-800 transition-colors cursor-pointer">
            <span className="bg-white text-black text-xs px-3 py-1 rounded-full mr-3 flex items-center justify-center text-center">
              For <span className="whitespace-nowrap ml-1">Non-Revs</span>
            </span>
            Check before you head to the airport
            <svg className="w-4 h-4 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </div>
        </Link>

        <h1 className="text-5xl md:text-6xl lg:text-7xl font-bold text-gray-900 mb-6 text-balance">
          Stop wasting trips to the <span className="text-teal-500">airport</span>
        </h1>

        <p className="text-lg md:text-xl text-gray-600 mb-10 max-w-3xl mx-auto text-pretty pt-2.5">
          Flying standby? Check seat availability before you leave home. Perfect for airline employees, upgrade hunters,
          and anyone who refuses to sit in a middle seat.
        </p>

        <div className="flex justify-center">
          <Link href="/search">
            <Button className="bg-black text-white hover:bg-gray-800 rounded-full px-12 py-3 text-base cursor-pointer">
              <Search className="w-4 h-4 mr-2" />
              Search Flights
            </Button>
          </Link>
        </div>
      </section>

      <section className="pt-5 pb-16 px-6 text-center mt-2.5">
        <div className="max-w-4xl mx-auto relative">
          <div
            className="overflow-hidden cursor-grab active:cursor-grabbing"
            onMouseDown={handleMouseDown}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            onMouseLeave={handleMouseLeave}
            onTouchStart={handleTouchStart}
            onTouchMove={handleTouchMove}
            onTouchEnd={handleTouchEnd}
          >
            <div
              className="flex"
              style={{
                transform: `translateX(calc(-${currentTestimonial * 100}% + ${dragOffset}px))`,
                transition: isDragging || !isTransitioning ? "none" : "transform 500ms ease-in-out",
              }}
            >
              {extendedTestimonials.map((testimonial, index) => (
                <div key={index} className="min-w-full px-4">
                  <div className="w-16 h-16 rounded-full bg-gray-200 mx-auto mb-6 overflow-hidden">
                    <img
                      src={testimonial.image || "/placeholder.svg"}
                      alt={testimonial.name}
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <h3 className="text-xl md:text-2xl font-semibold mb-4">{testimonial.title}</h3>
                  <p className="text-gray-600 text-base md:text-lg mb-2 max-w-2xl mx-auto">&quot;{testimonial.quote}&quot;</p>
                  <p className="text-sm md:text-base text-gray-500">
                    {testimonial.name}, {testimonial.role}
                  </p>
                </div>
              ))}
            </div>
          </div>

          <div className="flex justify-center gap-2 mt-6">
            {testimonials.map((_, index) => (
              <button
                key={index}
                onClick={() => setCurrentTestimonial(index + 1)}
                className={`w-2 h-2 rounded-full transition-all ${
                  currentTestimonial === index + 1 ||
                  (currentTestimonial === 0 && index === testimonials.length - 1) ||
                  (currentTestimonial === testimonials.length + 1 && index === 0)
                    ? "bg-black w-8"
                    : "bg-gray-300"
                }`}
                aria-label={`Go to testimonial ${index + 1}`}
              />
            ))}
          </div>
        </div>
      </section>

      <section className="py-16 px-6 bg-gray-50">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-12">
            <p className="text-sm text-gray-500 mb-4">Features</p>
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">Everything you need to fly smarter</h2>
            <p className="text-gray-600 max-w-2xl mx-auto">
              Whether you&apos;re flying standby, hunting for upgrades, or just want to avoid middle seats—we&apos;ve got you
              covered.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-5">
            {/* Feature 1: Real-time Seat Maps */}
            <Card className="p-4 hover:shadow-lg transition-shadow">
              <div className="w-10 h-10 bg-teal-50 rounded-lg flex items-center justify-center mb-3">
                <MapPin className="w-5 h-5 text-teal-600" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Real-Time Seat Maps</h3>
              <p className="text-gray-600 text-sm mb-3">
                View live seat availability before heading to the airport. Perfect for non-rev travelers checking loads.
              </p>
              <div className="flex items-center gap-1.5 text-xs text-gray-500">
                <Check className="w-3.5 h-3.5 text-green-500 flex-shrink-0" />
                <span>Updated every few minutes</span>
              </div>
            </Card>

            {/* Feature 2: Track Multiple Flights */}
            <Card className="p-4 hover:shadow-lg transition-shadow">
              <div className="w-10 h-10 bg-blue-50 rounded-lg flex items-center justify-center mb-3">
                <Plane className="w-5 h-5 text-blue-600" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Track Multiple Flights</h3>
              <p className="text-gray-600 text-sm mb-3">
                Monitor several flights at once. Increase your chances of getting on when flying standby.
              </p>
              <div className="flex items-center gap-1.5 text-xs text-gray-500">
                <Check className="w-3.5 h-3.5 text-green-500 flex-shrink-0" />
                <span>Track flights simultaneously</span>
              </div>
            </Card>

            {/* Feature 3: Instant Alerts */}
            <Card className="p-4 hover:shadow-lg transition-shadow">
              <div className="w-10 h-10 bg-purple-50 rounded-lg flex items-center justify-center mb-3">
                <Bell className="w-5 h-5 text-purple-600" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Instant Alerts</h3>
              <p className="text-gray-600 text-sm mb-3">
                Get notified the moment your preferred seat opens up. Never miss an upgrade opportunity again.
              </p>
              <div className="flex items-center gap-1.5 text-xs text-gray-500">
                <Check className="w-3.5 h-3.5 text-green-500 flex-shrink-0" />
                <span>Email notifications included</span>
              </div>
            </Card>

            {/* Feature 4: Seat Preference Filters */}
            <Card className="p-4 hover:shadow-lg transition-shadow">
              <div className="w-10 h-10 bg-orange-50 rounded-lg flex items-center justify-center mb-3">
                <Search className="w-5 h-5 text-orange-600" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Seat Preference Filters</h3>
              <p className="text-gray-600 text-sm mb-3">
                Set alerts for window or aisle seats only. Automatically avoid middle seats and find your perfect spot.
              </p>
              <div className="flex items-center gap-1.5 text-xs text-gray-500">
                <Check className="w-3.5 h-3.5 text-green-500 flex-shrink-0" />
                <span>Filter by seat type and location</span>
              </div>
            </Card>

            {/* Feature 5: Advanced Seat Details */}
            <Card className="p-4 hover:shadow-lg transition-shadow">
              <div className="w-10 h-10 bg-green-50 rounded-lg flex items-center justify-center mb-3">
                <Calendar className="w-5 h-5 text-green-600" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Advanced Seat Details</h3>
              <p className="text-gray-600 text-sm mb-3">
                See exit rows, extra legroom, and seat characteristics. Make informed decisions about where to sit.
              </p>
              <div className="flex items-center gap-1.5 text-xs text-gray-500">
                <Check className="w-3.5 h-3.5 text-green-500 flex-shrink-0" />
                <span>Detailed seat information</span>
              </div>
            </Card>

            {/* Feature 6: Priority Support */}
            <Card className="p-4 hover:shadow-lg transition-shadow">
              <div className="w-10 h-10 bg-pink-50 rounded-lg flex items-center justify-center mb-3">
                <Check className="w-5 h-5 text-pink-600" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Priority Support</h3>
              <p className="text-gray-600 text-sm mb-3">
                Get help when you need it. Our team understands non-rev travel and upgrade strategies.
              </p>
              <div className="flex items-center gap-1.5 text-xs text-gray-500">
                <Check className="w-3.5 h-3.5 text-green-500 flex-shrink-0" />
                <span>Fast response times</span>
              </div>
            </Card>
          </div>

          <div className="text-center mt-12">
            <Link href="/pricing">
              <Button className="bg-black text-white hover:bg-gray-800 rounded-full px-8 py-3 cursor-pointer">
                View All Plans & Features
              </Button>
            </Link>
          </div>
        </div>
      </section>
    </div>
  )
}
