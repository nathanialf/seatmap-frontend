"use client"

import { Navbar } from "@/components/navbar"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Plane, Bell, Check } from "lucide-react"
import { useState } from "react"

export default function SeatMapPage() {
  const [selectedSeat, setSelectedSeat] = useState<string | null>(null)

  // Generate seat layout (6 seats per row, rows 1-20)
  const rows = 20
  const seatsPerRow = ["A", "B", "C", "D", "E", "F"]

  // Mock occupied seats
  const occupiedSeats = new Set([
    "1A",
    "1B",
    "2C",
    "3D",
    "4A",
    "5F",
    "6B",
    "7C",
    "8E",
    "9A",
    "10D",
    "12A",
    "12F",
    "15C",
    "16B",
  ])

  const getSeatStatus = (seat: string) => {
    if (occupiedSeats.has(seat)) return "occupied"
    if (selectedSeat === seat) return "selected"
    return "available"
  }

  const getSeatColor = (status: string) => {
    switch (status) {
      case "occupied":
        return "bg-gray-300 cursor-not-allowed"
      case "selected":
        return "bg-teal-500 text-white"
      default:
        return "bg-white border-2 border-gray-300 hover:border-teal-500 cursor-pointer"
    }
  }

  return (
    <div className="min-h-screen bg-white">
      <Navbar />

      <div className="max-w-7xl mx-auto px-4 md:px-6 py-8">
        {/* Flight Info Header */}
        <Card className="p-4 md:p-6 mb-6 md:mb-8">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <Plane className="w-4 h-4 md:w-5 md:h-5" />
                <span className="text-sm md:text-base font-semibold">American Airlines AA 1234</span>
              </div>
              <p className="text-xs md:text-sm text-gray-600">LAX → JFK • Dec 15, 2024 • 08:00 AM</p>
            </div>
            <div className="text-right">
              <div className="text-xl md:text-2xl font-bold">$450</div>
              <div className="text-xs md:text-sm text-gray-500">Base fare</div>
            </div>
          </div>
        </Card>

        <div className="grid lg:grid-cols-3 gap-6 md:gap-8">
          {/* Seat Map */}
          <div className="lg:col-span-2">
            <h2 className="text-xl md:text-2xl font-bold mb-4 md:mb-6">Select Your Seat</h2>

            {/* Legend */}
            <div className="flex flex-wrap gap-3 md:gap-6 mb-4 md:mb-6 text-xs md:text-sm">
              <div className="flex items-center gap-2">
                <div className="w-5 h-5 md:w-6 md:h-6 bg-white border-2 border-gray-300 rounded"></div>
                <span>Available</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-5 h-5 md:w-6 md:h-6 bg-gray-300 rounded"></div>
                <span>Occupied</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-5 h-5 md:w-6 md:h-6 bg-teal-500 rounded"></div>
                <span>Selected</span>
              </div>
            </div>

            <div className="bg-gray-50 rounded-xl md:rounded-2xl p-2 md:p-8 flex justify-center touch-none select-none">
              <div className="w-full max-w-[280px] sm:max-w-sm md:max-w-none">
                {/* Cockpit indicator */}
                <div className="flex justify-center mb-3 md:mb-6">
                  <div className="w-20 h-5 md:w-32 md:h-8 bg-gray-300 rounded-t-full flex items-center justify-center text-[10px] md:text-xs text-gray-600">
                    Cockpit
                  </div>
                </div>

                {/* Column labels */}
                <div className="flex justify-center mb-1 md:mb-2">
                  <div className="flex gap-0.5 sm:gap-1 md:gap-2">
                    {seatsPerRow.slice(0, 3).map((letter) => (
                      <div
                        key={letter}
                        className="w-6 sm:w-7 md:w-10 text-center text-[10px] sm:text-xs md:text-sm text-gray-500 font-medium"
                      >
                        {letter}
                      </div>
                    ))}
                    <div className="w-3 sm:w-4 md:w-8"></div>
                    {seatsPerRow.slice(3).map((letter) => (
                      <div
                        key={letter}
                        className="w-6 sm:w-7 md:w-10 text-center text-[10px] sm:text-xs md:text-sm text-gray-500 font-medium"
                      >
                        {letter}
                      </div>
                    ))}
                  </div>
                </div>

                {/* Seats */}
                <div className="space-y-0.5 sm:space-y-1 md:space-y-2">
                  {Array.from({ length: rows }, (_, i) => i + 1).map((row) => (
                    <div key={row} className="flex items-center justify-center gap-0.5 sm:gap-1 md:gap-2">
                      {/* Row number - left */}
                      <div className="w-4 sm:w-5 md:w-8 text-center text-[10px] sm:text-xs md:text-sm text-gray-500 font-medium">
                        {row}
                      </div>

                      {/* Left side seats (A, B, C) */}
                      {seatsPerRow.slice(0, 3).map((letter) => {
                        const seatId = `${row}${letter}`
                        const status = getSeatStatus(seatId)
                        return (
                          <button
                            key={seatId}
                            onClick={() => status === "available" && setSelectedSeat(seatId)}
                            disabled={status === "occupied"}
                            className={`w-6 h-6 sm:w-7 sm:h-7 md:w-10 md:h-10 rounded text-[10px] sm:text-xs font-medium transition-colors ${getSeatColor(status)}`}
                          >
                            {status === "selected" && (
                              <Check className="w-3 h-3 sm:w-3.5 sm:h-3.5 md:w-4 md:h-4 mx-auto" />
                            )}
                          </button>
                        )
                      })}

                      {/* Aisle */}
                      <div className="w-3 sm:w-4 md:w-8"></div>

                      {/* Right side seats (D, E, F) */}
                      {seatsPerRow.slice(3).map((letter) => {
                        const seatId = `${row}${letter}`
                        const status = getSeatStatus(seatId)
                        return (
                          <button
                            key={seatId}
                            onClick={() => status === "available" && setSelectedSeat(seatId)}
                            disabled={status === "occupied"}
                            className={`w-6 h-6 sm:w-7 sm:h-7 md:w-10 md:h-10 rounded text-[10px] sm:text-xs font-medium transition-colors ${getSeatColor(status)}`}
                          >
                            {status === "selected" && (
                              <Check className="w-3 h-3 sm:w-3.5 sm:h-3.5 md:w-4 md:h-4 mx-auto" />
                            )}
                          </button>
                        )
                      })}

                      {/* Row number - right */}
                      <div className="w-4 sm:w-5 md:w-8 text-center text-[10px] sm:text-xs md:text-sm text-gray-500 font-medium">
                        {row}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Booking Summary */}
          <div className="lg:col-span-1">
            <Card className="p-4 md:p-6 lg:sticky lg:top-8">
              <h3 className="text-lg md:text-xl font-bold mb-4 md:mb-6">Booking Summary</h3>

              <div className="space-y-3 md:space-y-4 mb-4 md:mb-6">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Base Fare</span>
                  <span className="font-medium">$450</span>
                </div>
                {selectedSeat && (
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Seat {selectedSeat}</span>
                    <span className="font-medium">$0</span>
                  </div>
                )}
                <div className="border-t pt-3 md:pt-4 flex justify-between">
                  <span className="font-semibold">Total</span>
                  <span className="text-xl md:text-2xl font-bold">$450</span>
                </div>
              </div>

              {selectedSeat ? (
                <div className="space-y-3">
                  <Button className="w-full bg-black text-white hover:bg-gray-800 rounded-full cursor-pointer">
                    Continue to Payment
                  </Button>
                  <Button variant="outline" className="w-full rounded-full bg-transparent cursor-pointer">
                    <Bell className="w-4 h-4 mr-2" />
                    Set Alert for This Seat
                  </Button>
                </div>
              ) : (
                <div className="text-center py-6 md:py-8 text-gray-500 text-sm">Select a seat to continue</div>
              )}

              {selectedSeat && (
                <div className="mt-4 md:mt-6 p-3 md:p-4 bg-gray-50 rounded-lg">
                  <div className="flex items-start gap-2">
                    <Check className="w-4 h-4 md:w-5 md:h-5 text-green-500 mt-0.5" />
                    <div className="text-sm">
                      <p className="font-medium mb-1">Seat {selectedSeat} Selected</p>
                      <p className="text-gray-600">Window seat with extra legroom</p>
                    </div>
                  </div>
                </div>
              )}
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
}
