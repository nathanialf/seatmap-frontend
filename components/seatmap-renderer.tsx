"use client"

import React, { useState } from "react"
import { Card } from "@/components/ui/card"

type SeatStatus = "available" | "occupied" | "blocked" | "exit"

interface SeatData {
  number: string
  cabin?: string
  characteristics?: Array<{
    code: string
    category?: string
    description?: string
    restriction?: boolean
    premium?: boolean
  }>
  coordinates: {
    x: number
    y: number
  }
  availabilityStatus?: string
  travelerPricing?: Array<{
    seatAvailabilityStatus?: string
  }>
}

interface DeckData {
  deckType: string
  deckConfiguration: {
    startSeatRow: number
    endSeatRow: number
    width: number
    startWingsRow?: number
    endWingsRow?: number
  }
  seats?: SeatData[]
}

interface SeatmapData {
  seats?: SeatData[]
  decks?: DeckData[]
}

interface SeatmapRendererProps {
  seatmapData: SeatmapData
  className?: string
}

// Function to get seat status from actual API data
const getSeatStatusFromData = (seatNumber: string, seats: SeatData[]): SeatStatus => {
  const seat = seats.find(s => s.number === seatNumber)
  if (!seat) return "available"

  // Use the availabilityStatus property from the API response
  const status = seat.availabilityStatus
  if (status === "AVAILABLE") return "available"
  if (status === "OCCUPIED") return "occupied" 
  if (status === "BLOCKED") return "blocked"
  
  // Fallback to travelerPricing if availabilityStatus is not present
  const fallbackStatus = seat.travelerPricing?.[0]?.seatAvailabilityStatus
  if (fallbackStatus === "AVAILABLE") return "available"
  if (fallbackStatus === "OCCUPIED") return "occupied" 
  if (fallbackStatus === "BLOCKED") return "blocked"
  
  return "available"
}

// Function to calculate actual seat availability from seat data
const calculateSeatAvailability = (seats: SeatData[]) => {
  if (!seats || !Array.isArray(seats)) {
    return {
      total: 0,
      available: 0,
      occupied: 0,
      blocked: 0,
      percentage: 0
    }
  }

  const total = seats.length
  let available = 0
  let occupied = 0
  let blocked = 0

  seats.forEach(seat => {
    const status = getSeatStatusFromData(seat.number, seats)
    switch (status) {
      case "available":
        available++
        break
      case "occupied":
        occupied++
        break
      case "blocked":
        blocked++
        break
    }
  })

  return {
    total,
    available,
    occupied,
    blocked,
    percentage: total > 0 ? Math.round((available / total) * 100) : 0
  }
}

// Component for rendering a single deck seatmap
const DeckSeatmap: React.FC<{
  deck: DeckData
  deckIndex: number
  seatmapData: SeatmapData
}> = ({ deck, deckIndex, seatmapData }) => {
  const [hoveredSeat, setHoveredSeat] = useState<{number: string, data: SeatData, x: number, y: number} | null>(null)

  if (!deck?.deckConfiguration) {
    return (
      <div className="text-center py-8 text-gray-500">
        <p>Deck configuration not available</p>
      </div>
    )
  }

  const config = deck.deckConfiguration
  // Use deck-specific seats if available, otherwise fall back to root-level seats
  const allSeats = deck.seats || seatmapData?.seats || []

  // Filter seats with valid coordinates first
  const seatsWithCoords = allSeats.filter(seat => 
    seat.coordinates && 
    typeof seat.coordinates.x === 'number' && 
    typeof seat.coordinates.y === 'number'
  )

  // If no seats with coordinates, show a message
  if (seatsWithCoords.length === 0) {
    return (
      <div className="text-center py-8 text-gray-500">
        <p>No seats with valid coordinates found</p>
        {allSeats.length > 0 && (
          <p className="text-sm mt-2">({allSeats.length} seats total, but missing coordinate data)</p>
        )}
      </div>
    )
  }

  // Get all unique x coordinates (row offsets) and sort them
  const xCoords = [...new Set(seatsWithCoords.map(seat => seat.coordinates.x))].sort((a, b) => a - b)
  // Get min/max y coordinates to create full range including aisle gaps
  const allYCoords = seatsWithCoords.map(seat => seat.coordinates.y)
  const minY = Math.min(...allYCoords)
  const maxY = Math.max(...allYCoords)

  // Detect aisle positions by finding gaps in seat data across all rows
  const aislePositions = new Set<number>()
  const yCoordRange = Array.from({ length: maxY - minY + 1 }, (_, i) => minY + i)

  // For each y coordinate, check if it's consistently missing seats across multiple rows
  yCoordRange.forEach(yCoord => {
    const rowsWithSeatAtY = xCoords.filter(xCoord => 
      seatsWithCoords.some(seat => seat.coordinates.x === xCoord && seat.coordinates.y === yCoord)
    ).length
    
    const totalRows = xCoords.length
    // If less than 10% of rows have a seat at this y coordinate, it's likely an aisle
    if (rowsWithSeatAtY < totalRows * 0.1) {
      aislePositions.add(yCoord)
    }
  })

  return (
    <div className="mb-8">
      {/* Deck header */}
      <div className="mb-4 text-center">
        <h3 className="text-lg font-semibold text-gray-800">
          {deck.deckType} Deck {deckIndex > 0 ? `(Segment ${deckIndex + 1})` : ''}
        </h3>
        <p className="text-sm text-gray-600">
          {(() => {
            const availability = calculateSeatAvailability(allSeats)
            return `${availability.available} of ${availability.total} seats available`
          })()}
        </p>
      </div>

      <div className="relative text-center">
        {/* Aircraft nose */}
        <div className="flex justify-center mb-1">
          <div className="w-16 h-8 bg-gray-100 rounded-t-full border-2 border-gray-300"></div>
        </div>

        <div className="relative inline-block mx-auto">
          {/* Wings (if configured) - position based on actual coordinate mapping */}
          {config.startWingsRow && config.endWingsRow && (() => {
            // Find the coordinate indices that correspond to the wing row numbers
            const wingStartIndex = xCoords.findIndex(xCoord => {
              const rowSeats = seatsWithCoords.filter(seat => seat.coordinates.x === xCoord)
              const actualRow = rowSeats.length > 0 ? parseInt(rowSeats[0].number.match(/\d+/)?.[0] || '0') : config.startSeatRow + xCoord
              return actualRow >= config.startWingsRow
            })
            
            const wingEndIndex = xCoords.findIndex(xCoord => {
              const rowSeats = seatsWithCoords.filter(seat => seat.coordinates.x === xCoord)
              const actualRow = rowSeats.length > 0 ? parseInt(rowSeats[0].number.match(/\d+/)?.[0] || '0') : config.startSeatRow + xCoord
              return actualRow > config.endWingsRow
            })
            
            const startIndex = wingStartIndex >= 0 ? wingStartIndex : 0
            const endIndex = wingEndIndex >= 0 ? wingEndIndex - 1 : xCoords.length - 1
            
            return (
              <>
                <div
                  className="absolute left-0 bg-gray-200 border border-gray-300"
                  style={{
                    top: `${startIndex * 28}px`,
                    height: `${(endIndex - startIndex + 1) * 28}px`,
                    width: "80px",
                    transform: "translateX(-80px)",
                    clipPath: "polygon(100% 0%, 100% 100%, 0% 80%, 0% 20%)",
                  }}
                />
                <div
                  className="absolute right-0 bg-gray-200 border border-gray-300"
                  style={{
                    top: `${startIndex * 28}px`,
                    height: `${(endIndex - startIndex + 1) * 28}px`,
                    width: "80px",
                    transform: "translateX(80px)",
                    clipPath: "polygon(0% 0%, 0% 100%, 100% 80%, 100% 20%)",
                  }}
                />
              </>
            )
          })()}

          {/* Seat rows - using actual coordinate mapping from API */}
          {xCoords.map((xCoord) => {
            // Get seats for this row (x coordinate)
            const rowSeats = seatsWithCoords.filter(seat => seat.coordinates.x === xCoord)
            // Calculate actual row number from seat data, not config
            const actualRow = rowSeats.length > 0 ? parseInt(rowSeats[0].number.match(/\d+/)?.[0] || '0') : config.startSeatRow + xCoord

            return (
              <div key={xCoord} className="flex items-center justify-center gap-1 mb-0.5">
                <div className="w-6 text-center text-xs font-medium text-gray-500">{actualRow}</div>

                <div className="flex gap-0.5 items-center">
                  {yCoordRange.map((yCoord) => {
                    // Find seat at this exact coordinate
                    const seatData = rowSeats.find(seat => seat.coordinates.y === yCoord)
                    
                    // Add aisle gap where this y coordinate is detected as an aisle
                    if (aislePositions.has(yCoord) && !seatData) {
                      return <div key={`aisle-${yCoord}`} className="w-4"></div>
                    }
                    
                    if (!seatData) {
                      return null // Skip rendering if no seat at this coordinate
                    }

                    const seatStatus = getSeatStatusFromData(seatData.number, allSeats)
                    // Check if seat has exit characteristics (multiple possible codes for exit rows)
                    const isExit = seatData.characteristics?.some(char => 
                      char.code === 'E' || 
                      char.code === 'EXIT' ||
                      char.category === 'EXIT_ROW' ||
                      char.description?.toLowerCase().includes('exit')
                    ) || false
                    const hasCharacteristics = seatData?.characteristics && seatData.characteristics.length > 0
                    const seatLetter = seatData.number.match(/[A-Z]+$/)?.[0] || ''

                    return (
                      <div key={yCoord} className="flex items-center">
                        <div
                          className={`w-7 h-7 rounded text-[10px] font-medium flex items-center justify-center transition-colors cursor-pointer relative ${
                            isExit
                              ? "bg-black text-white"
                              : seatStatus === "available"
                                ? "bg-green-200 text-green-800 hover:bg-green-300"
                                : seatStatus === "occupied"
                                  ? "bg-red-200 text-red-800"
                                  : seatStatus === "blocked"
                                    ? "bg-gray-400 text-gray-700"
                                    : "bg-gray-100 text-gray-400"
                          }`}
                          onMouseEnter={(e) => {
                            if (hasCharacteristics) {
                              const rect = e.currentTarget.getBoundingClientRect()
                              setHoveredSeat({
                                number: seatData.number,
                                data: seatData,
                                x: rect.left + rect.width / 2,
                                y: rect.top - 10
                              })
                            }
                          }}
                          onMouseLeave={() => setHoveredSeat(null)}
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

        {/* Aircraft tail */}
        <div className="flex justify-center mt-1">
          <div className="w-16 h-8 bg-gray-100 rounded-b-full border-2 border-gray-300"></div>
        </div>
      </div>
      
      {/* Seat characteristics tooltip */}
      {hoveredSeat && (
        <div 
          className="fixed bg-gray-900 text-white text-xs rounded-lg p-3 shadow-lg z-50 max-w-sm pointer-events-none"
          style={{
            left: `${hoveredSeat.x}px`,
            top: `${hoveredSeat.y}px`,
            transform: 'translate(-50%, -100%)'
          }}
        >
          <div className="font-semibold mb-2">Seat {hoveredSeat.number}</div>
          
          <div className="space-y-2">
            {(() => {
              const status = getSeatStatusFromData(hoveredSeat.number, allSeats)
              return <div className="text-xs text-gray-300">Status: {status.charAt(0).toUpperCase() + status.slice(1)}</div>
            })()}
            
            {hoveredSeat.data.cabin && (
              <div className="text-xs text-gray-300">Cabin: {hoveredSeat.data.cabin}</div>
            )}
            
            {hoveredSeat.data.characteristics && hoveredSeat.data.characteristics.length > 0 && (
              <div>
                <div className="text-xs text-gray-300 mb-2 font-medium">Seat Features:</div>
                <div className="space-y-1">
                  {hoveredSeat.data.characteristics.map((char, index) => (
                    <div key={index} className="flex items-start gap-2">
                      <span className="text-xs text-gray-400 mt-0.5">•</span>
                      <div className="text-xs flex-1">
                        <div className="flex flex-wrap items-center gap-1">
                          <span className={char.premium ? 'text-yellow-300 font-medium' : 'text-white'}>
                            {char.description || char.code}
                          </span>
                          {char.premium && (
                            <span className="text-yellow-300 text-[10px] bg-yellow-900/30 px-1 py-0.5 rounded">Premium</span>
                          )}
                          {char.restriction && (
                            <span className="text-red-300 text-[10px] bg-red-900/30 px-1 py-0.5 rounded">Restricted</span>
                          )}
                        </div>
                        {char.category && (
                          <div className="text-[10px] text-gray-400 mt-0.5">Category: {char.category}</div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
            
            {(!hoveredSeat.data.characteristics || hoveredSeat.data.characteristics.length === 0) && (
              <div className="text-xs text-gray-400 italic">No special features</div>
            )}
          </div>
          
          {/* Tooltip arrow */}
          <div 
            className="absolute top-full left-1/2 transform -translate-x-1/2 w-0 h-0" 
            style={{
              borderLeft: '4px solid transparent',
              borderRight: '4px solid transparent', 
              borderTop: '4px solid rgb(17, 24, 39)'
            }}
          />
        </div>
      )}
    </div>
  )
}

// Main SeatmapRenderer component
const SeatmapRenderer: React.FC<SeatmapRendererProps> = ({ seatmapData, className = "" }) => {
  if (!seatmapData) {
    return (
      <Card className={`p-4 sm:p-6 ${className}`}>
        <div className="text-center py-12">
          <div className="w-2 h-2 bg-red-500 rounded-full mx-auto mb-2"></div>
          <span className="text-sm font-semibold text-red-700">No Seat Map Data Available</span>
        </div>
      </Card>
    )
  }

  if (!seatmapData.decks || !Array.isArray(seatmapData.decks)) {
    return (
      <Card className={`p-4 sm:p-6 ${className}`}>
        <div className="text-center py-12">
          <div className="text-lg font-semibold text-gray-700 mb-2">Invalid Seat Map Data</div>
          <p className="text-gray-500">The seat map data structure is not in the expected format.</p>
        </div>
      </Card>
    )
  }

  return (
    <Card className={`p-4 sm:p-6 ${className}`}>
      {/* Legend */}
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

      {/* Render each deck (for multi-segment flights) */}
      {seatmapData.decks.map((deck, deckIndex) => (
        <DeckSeatmap 
          key={deckIndex} 
          deck={deck} 
          deckIndex={deckIndex} 
          seatmapData={seatmapData} 
        />
      ))}
    </Card>
  )
}

export { SeatmapRenderer, calculateSeatAvailability, getSeatStatusFromData }
export type { SeatData, DeckData, SeatmapData, SeatStatus }