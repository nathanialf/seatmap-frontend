"use client"

import React from "react"
import { Calendar, Clock, MapPin, Plane } from 'lucide-react'
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

export interface FlightAlertDetails {
  airline: string
  flightNumber: string
  from: string
  to: string
  date: string
  departureTime: string
  arrivalTime: string
}

interface AlertSetupDialogProps {
  isOpen: boolean
  onOpenChange: (open: boolean) => void
  flightDetails: FlightAlertDetails | null
  selectedCabin: string
  onCabinChange: (cabin: string) => void
  seatCountThreshold: number
  onSeatCountThresholdChange: (threshold: number) => void
  onConfirm: () => void
  className?: string
}

const AlertSetupDialog: React.FC<AlertSetupDialogProps> = ({
  isOpen,
  onOpenChange,
  flightDetails,
  selectedCabin,
  onCabinChange,
  seatCountThreshold,
  onSeatCountThresholdChange,
  onConfirm,
  className = ""
}) => {
  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className={`sm:max-w-md max-h-[80vh] sm:max-h-[90vh] overflow-y-auto ${className}`}>
        <DialogHeader>
          <DialogTitle>Set Flight Alert</DialogTitle>
          <DialogDescription>
            Get notified when seat availability changes for this specific flight.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 pb-4 pt-0">
          {flightDetails && (
            <div className="bg-gradient-to-br from-[#00BBA7]/10 to-[#00BBA7]/5 border border-[#00BBA7]/30 rounded-lg p-3 space-y-1.5">
              <p className="font-semibold text-gray-600 uppercase tracking-wide mb-1.5 text-xs">Alert Details</p>
              <div className="space-y-1">
                <div className="flex items-center gap-1.5 text-base">
                  <Plane className="w-3.5 h-3.5 text-[#00BBA7]" />
                  <span className="font-semibold text-gray-800">{flightDetails.airline}</span>
                  <span className="text-gray-600">{flightDetails.flightNumber}</span>
                </div>
                <div className="flex items-center gap-1.5 text-base">
                  <MapPin className="w-3.5 h-3.5 text-[#00BBA7]" />
                  <span className="font-medium text-gray-700">
                    {flightDetails.from} → {flightDetails.to}
                  </span>
                </div>
                <div className="flex items-center gap-1.5 text-base">
                  <Calendar className="w-3.5 h-3.5 text-[#00BBA7]" />
                  <span className="text-gray-700">{flightDetails.date}</span>
                </div>
                <div className="flex items-center gap-1.5 text-base">
                  <Clock className="w-3.5 h-3.5 text-[#00BBA7]" />
                  <span className="text-gray-700">
                    {flightDetails.departureTime} - {flightDetails.arrivalTime}
                  </span>
                </div>
              </div>
            </div>
          )}

          <div className="space-y-3">
            <Label htmlFor="flight-cabin-select" className="text-sm font-medium">
              Select Cabin
            </Label>
            <Select value={selectedCabin} onValueChange={onCabinChange}>
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
                  onChange={(e) => onSeatCountThresholdChange(Number(e.target.value))}
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
                {flightDetails?.date}
              </span>
            </div>
          </div>
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
            onClick={onConfirm}
            className="bg-black text-white hover:bg-gray-800 rounded-full cursor-pointer"
          >
            Confirm Alert
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

export { AlertSetupDialog }