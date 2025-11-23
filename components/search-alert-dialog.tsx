"use client"

import React, { useState } from "react"
import { MapPin, Calendar, Plane, Users, Clock, AlertTriangle } from 'lucide-react'
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Switch } from "@/components/ui/switch"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { formatTravelClassForDisplay } from "@/lib/flight-utils"

export interface SearchParams {
  origin: string
  destination: string
  date: string
  seatClass?: string
  airline?: string
  flightNumber?: string
}

interface SearchAlertSettings {
  selectedCabin: string
  availabilityThreshold: number
}

interface SearchAlertDialogProps {
  isOpen: boolean
  onOpenChange: (open: boolean) => void
  searchParams: SearchParams
  selectedCabin: string
  onCabinChange: (cabin: string) => void
  availabilityThreshold: number
  onAvailabilityThresholdChange: (threshold: number) => void
  onConfirm: (bookmarkName: string, setAlert: boolean, alertSettings?: SearchAlertSettings) => void
  className?: string
}

const SearchAlertDialog: React.FC<SearchAlertDialogProps> = ({
  isOpen,
  onOpenChange,
  searchParams,
  selectedCabin,
  onCabinChange,
  availabilityThreshold,
  onAvailabilityThresholdChange,
  onConfirm,
  className = ""
}) => {
  const [bookmarkName, setBookmarkName] = useState("")
  const [setAlert, setSetAlert] = useState(false)
  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className={`sm:max-w-md max-h-[80vh] sm:max-h-[90vh] overflow-y-auto ${className}`}>
        <DialogHeader>
          <DialogTitle>Set Search Alert</DialogTitle>
          <DialogDescription>
            Save this search and optionally set up alerts for seat availability changes.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 pb-4 pt-0">
          {/* Bookmark Name Field */}
          <div className="space-y-3">
            <Label htmlFor="bookmark-name" className="text-sm font-medium">
              Bookmark Name
            </Label>
            <Input
              id="bookmark-name"
              value={bookmarkName}
              onChange={(e) => setBookmarkName(e.target.value)}
              placeholder={`${searchParams.origin} → ${searchParams.destination} • ${searchParams.date}`}
              className="rounded-lg"
            />
          </div>

          {/* Alert Toggle */}
          <div className="flex items-center justify-between space-x-2 p-3 bg-gray-50 rounded-lg">
            <div className="flex-1">
              <Label htmlFor="alert-toggle" className="text-sm font-medium">
                Set up alert
              </Label>
              <p className="text-xs text-gray-500 mt-1">
                Get notified when seat availability changes
              </p>
            </div>
            <Switch
              id="alert-toggle"
              checked={setAlert}
              onCheckedChange={setSetAlert}
            />
          </div>

          {/* Alert Configuration (conditionally visible) */}
          {setAlert && (
            <div className="space-y-4 border border-gray-200 rounded-lg p-4">
              {/* Under Construction Banner */}
              <div className="bg-amber-50 border border-amber-200 rounded-lg p-3">
                <div className="flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 text-amber-600 flex-shrink-0" />
                  <div>
                    <h4 className="font-medium text-amber-800 text-sm">Under Construction</h4>
                    <p className="text-xs text-amber-700">Search alerts are currently being developed!</p>
                  </div>
                </div>
              </div>

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
            <Select value={selectedCabin} onValueChange={onCabinChange}>
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
                  onChange={(e) => onAvailabilityThresholdChange(Number(e.target.value))}
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
          )}
        </div>

        <DialogFooter className="flex-col sm:flex-row gap-2">
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
            className="rounded-full cursor-pointer"
          >
            Cancel
          </Button>
          <Button
            type="button"
            onClick={() => onConfirm(
              bookmarkName || `${searchParams.origin} → ${searchParams.destination} • ${searchParams.date}`,
              setAlert,
              setAlert ? {
                selectedCabin,
                availabilityThreshold
              } : undefined
            )}
            className="bg-black text-white hover:bg-gray-800 rounded-full cursor-pointer"
          >
            Save {setAlert ? 'and Set Alert' : 'Bookmark'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

export { SearchAlertDialog }