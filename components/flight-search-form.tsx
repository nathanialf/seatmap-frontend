"use client"

import React, { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Search, Loader2, ChevronDown, ChevronUp } from 'lucide-react'

export interface FlightSearchParams {
  origin: string
  destination: string
  date: string
  airline?: string
  flightNumber?: string
  seatClass?: string
}

interface FlightSearchFormProps {
  initialValues?: Partial<FlightSearchParams>
  onSubmit: (params: FlightSearchParams) => void
  isLoading?: boolean
  isCompact?: boolean
  className?: string
}

const FlightSearchForm: React.FC<FlightSearchFormProps> = ({
  initialValues = {},
  onSubmit,
  isLoading = false,
  isCompact = false,
  className = ""
}) => {
  const [formInputs, setFormInputs] = useState<FlightSearchParams>({
    origin: initialValues.origin || "",
    destination: initialValues.destination || "",
    date: initialValues.date || "",
    airline: initialValues.airline || "",
    flightNumber: initialValues.flightNumber || "",
    seatClass: initialValues.seatClass || "",
  })
  
  const [isExpanded, setIsExpanded] = useState(!isCompact)

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    onSubmit(formInputs)
  }

  const handleInputChange = (field: keyof FlightSearchParams, value: string) => {
    setFormInputs(prev => ({
      ...prev,
      [field]: field === 'origin' || field === 'destination' || field === 'airline' ? value.toUpperCase() : value
    }))
  }

  if (isCompact && !isExpanded) {
    return (
      <div className={`bg-gray-50 rounded-2xl p-4 md:p-6 ${className}`}>
        <button
          onClick={() => setIsExpanded(true)}
          className="md:hidden w-full flex items-center justify-between mb-4 bg-black text-white hover:bg-gray-800 rounded-full px-6 py-3 cursor-pointer transition-colors"
        >
          <span className="font-medium">New Search</span>
          <ChevronDown className="w-5 h-5" />
        </button>
      </div>
    )
  }

  return (
    <div className={`bg-gray-50 rounded-2xl p-4 md:p-6 ${className}`}>
      <form onSubmit={handleSubmit} className="space-y-6" suppressHydrationWarning={true}>
        {!isCompact ? (
          // Full form layout
          <>
            <div>
              <Label htmlFor="origin" className="text-sm font-medium text-gray-700 mb-2 block">
                Origin Airport *
              </Label>
              <Input
                id="origin"
                type="text"
                placeholder="Enter airport name or code (e.g., LAX or Los Angeles)"
                value={formInputs.origin}
                onChange={(e) => handleInputChange('origin', e.target.value)}
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
                onChange={(e) => handleInputChange('destination', e.target.value)}
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
                onChange={(e) => handleInputChange('date', e.target.value)}
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
                    onChange={(e) => handleInputChange('airline', e.target.value)}
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
                    onChange={(e) => handleInputChange('flightNumber', e.target.value)}
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
                    onChange={(e) => handleInputChange('seatClass', e.target.value)}
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
          </>
        ) : (
          // Compact form layout
          <>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="text-sm text-gray-600 mb-2 block">From</label>
                <Input
                  type="text"
                  value={formInputs.origin}
                  onChange={(e) => handleInputChange('origin', e.target.value)}
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
                  onChange={(e) => handleInputChange('destination', e.target.value)}
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
                  onChange={(e) => handleInputChange('date', e.target.value)}
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
                  onChange={(e) => handleInputChange('airline', e.target.value)}
                  placeholder="e.g., AA"
                  className="rounded-lg text-sm h-10"
                />
              </div>
              <div>
                <label className="text-xs text-gray-500 mb-1.5 block">Flight Number (Optional)</label>
                <Input
                  type="text"
                  value={formInputs.flightNumber}
                  onChange={(e) => handleInputChange('flightNumber', e.target.value)}
                  placeholder="e.g., 1234"
                  className="rounded-lg text-sm h-10"
                />
              </div>
              <div>
                <label className="text-xs text-gray-500 mb-1.5 block">Seat Class (Optional)</label>
                <select
                  value={formInputs.seatClass}
                  onChange={(e) => handleInputChange('seatClass', e.target.value)}
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

            {isExpanded && isCompact && (
              <div className="md:hidden flex gap-3">
                <Button
                  type="button"
                  onClick={() => setIsExpanded(false)}
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
          </>
        )}
      </form>
    </div>
  )
}

export { FlightSearchForm }