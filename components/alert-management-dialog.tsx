"use client"

import React, { useState } from "react"
import { Bell, Clock, MapPin, Plane, Calendar, Users, Edit, Trash2 } from 'lucide-react'
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
import { formatTravelClassForDisplay } from "@/lib/flight-utils"

export interface AlertConfig {
  alertThreshold: number
  lastEvaluated?: string
  lastTriggered?: string
  triggerHistory?: string
}

export interface BookmarkItem {
  bookmarkId: string
  title: string
  itemType: 'BOOKMARK' | 'SAVED_SEARCH'
  hasAlert?: boolean
  alertConfig?: AlertConfig
  // For flight bookmarks
  flightOfferData?: string
  // For saved searches  
  origin?: string
  destination?: string
  departureDate?: string
  travelClass?: string
  airlineCode?: string
  flightNumber?: string
  createdAt: string
}

interface AlertManagementDialogProps {
  isOpen: boolean
  onOpenChange: (open: boolean) => void
  bookmark: BookmarkItem | null
  onUpdateAlert: (bookmarkId: string, alertConfig: AlertConfig) => void
  onDeleteAlert: (bookmarkId: string) => void
  className?: string
}

const AlertManagementDialog: React.FC<AlertManagementDialogProps> = ({
  isOpen,
  onOpenChange,
  bookmark,
  onUpdateAlert,
  onDeleteAlert,
  className = ""
}) => {
  const [isEditing, setIsEditing] = useState(false)
  const [alertConfig, setAlertConfig] = useState<AlertConfig | null>(bookmark?.alertConfig || null)
  const [tempThreshold, setTempThreshold] = useState<number>(
    bookmark?.alertConfig?.alertThreshold || 20
  )

  React.useEffect(() => {
    if (bookmark?.alertConfig) {
      setAlertConfig(bookmark.alertConfig)
      setTempThreshold(bookmark.alertConfig.alertThreshold || 20)
    }
  }, [bookmark])

  if (!bookmark || !alertConfig) {
    return null
  }

  const isFlightBookmark = bookmark.itemType === 'BOOKMARK'
  const isSavedSearch = bookmark.itemType === 'SAVED_SEARCH'

  // Parse flight details for flight bookmarks
  const flightDetails = isFlightBookmark && bookmark.flightOfferData ? (() => {
    try {
      const offer = JSON.parse(bookmark.flightOfferData)
      const segment = offer.itineraries?.[0]?.segments?.[0]
      if (segment) {
        return {
          flightNumber: `${segment.carrierCode} ${segment.number}`,
          route: `${segment.departure.iataCode} → ${segment.arrival.iataCode}`,
          date: new Date(segment.departure.at).toLocaleDateString('en-US', {
            weekday: 'short',
            month: 'short',
            day: 'numeric',
            year: 'numeric'
          }),
          departureTime: new Date(segment.departure.at).toLocaleTimeString('en-US', {
            hour: '2-digit',
            minute: '2-digit',
            hour12: true
          }),
          arrivalTime: new Date(segment.arrival.at).toLocaleTimeString('en-US', {
            hour: '2-digit',
            minute: '2-digit',
            hour12: true
          }),
          airline: segment.marketing?.carrierCode || segment.carrierCode
        }
      }
    } catch (error) {
      console.error('Failed to parse flight offer:', error)
    }
    return null
  })() : null

  const handleSave = () => {
    if (!alertConfig) return
    
    const updatedConfig: AlertConfig = {
      ...alertConfig,
      alertThreshold: tempThreshold
    }
    
    onUpdateAlert(bookmark.bookmarkId, updatedConfig)
    setAlertConfig(updatedConfig)
    setIsEditing(false)
  }

  const handleDelete = () => {
    onDeleteAlert(bookmark.bookmarkId)
    onOpenChange(false)
  }

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className={`sm:max-w-lg max-h-[80vh] sm:max-h-[90vh] overflow-y-auto ${className}`}>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Bell className="w-5 h-5 text-teal-600" />
            Manage Alert
          </DialogTitle>
          <DialogDescription>
            View and manage your alert settings for this {isFlightBookmark ? 'flight' : 'search'}.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 pb-4 pt-0">
          {/* Alert Status */}
          <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
            <div className="flex-1">
              <div className="flex items-center gap-2">
                <Label className="text-sm font-medium">Alert Status</Label>
                <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-700 border border-green-200">
                  Active
                </span>
              </div>
              <p className="text-xs text-gray-500 mt-1">
                You will receive notifications when thresholds are met
              </p>
            </div>
          </div>

          {/* Alert Details */}
          <div className="bg-gradient-to-br from-teal-50 to-teal-25 border border-teal-200 rounded-lg p-4">
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-semibold text-gray-900">{bookmark.title}</h3>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setIsEditing(!isEditing)}
                className="h-8 w-8 p-0 cursor-pointer"
              >
                <Edit className="w-4 h-4" />
              </Button>
            </div>

            <div className="space-y-2">
              {/* Flight Bookmark Details */}
              {isFlightBookmark && flightDetails && (
                <>
                  <div className="flex items-center gap-2 text-sm">
                    <Plane className="w-4 h-4 text-teal-600" />
                    <span className="font-medium">{flightDetails.flightNumber}</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <MapPin className="w-4 h-4 text-teal-600" />
                    <span>{flightDetails.route}</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <Calendar className="w-4 h-4 text-teal-600" />
                    <span>{flightDetails.date}</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <Clock className="w-4 h-4 text-teal-600" />
                    <span>{flightDetails.departureTime} - {flightDetails.arrivalTime}</span>
                  </div>
                </>
              )}

              {/* Saved Search Details */}
              {isSavedSearch && (
                <>
                  <div className="flex items-center gap-2 text-sm">
                    <MapPin className="w-4 h-4 text-teal-600" />
                    <span className="font-medium">{bookmark.origin} → {bookmark.destination}</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <Calendar className="w-4 h-4 text-teal-600" />
                    <span>{bookmark.departureDate ? new Date(bookmark.departureDate).toLocaleDateString('en-US', {
                      weekday: 'short',
                      month: 'short', 
                      day: 'numeric',
                      year: 'numeric'
                    }) : 'Date not available'}</span>
                  </div>
                  {bookmark.travelClass && (
                    <div className="flex items-center gap-2 text-sm">
                      <Users className="w-4 h-4 text-teal-600" />
                      <span>{formatTravelClassForDisplay(bookmark.travelClass)}</span>
                    </div>
                  )}
                  {bookmark.airlineCode && (
                    <div className="flex items-center gap-2 text-sm">
                      <Plane className="w-4 h-4 text-teal-600" />
                      <span>Airline: {bookmark.airlineCode}</span>
                    </div>
                  )}
                  {bookmark.flightNumber && (
                    <div className="flex items-center gap-2 text-sm">
                      <span className="w-4 h-4 text-teal-600 flex items-center justify-center text-xs font-bold">#</span>
                      <span>Flight: {bookmark.flightNumber}</span>
                    </div>
                  )}
                </>
              )}
            </div>
          </div>

          {/* Alert Configuration */}
          <div className="border border-gray-200 rounded-lg p-4">
            <div className="flex items-center justify-between mb-3">
              <Label className="text-sm font-medium">Alert Threshold</Label>
              {isEditing && (
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setIsEditing(false)}
                    className="rounded-full cursor-pointer"
                  >
                    Cancel
                  </Button>
                  <Button
                    size="sm"
                    onClick={handleSave}
                    className="bg-teal-600 hover:bg-teal-700 text-white rounded-full cursor-pointer"
                  >
                    Save
                  </Button>
                </div>
              )}
            </div>

            {isEditing ? (
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-700">
                    Alert threshold:
                  </span>
                  <span className="text-lg font-semibold text-teal-600">
                    {tempThreshold}{isFlightBookmark ? ' seats' : '%'}
                  </span>
                </div>
                <input
                  type="range"
                  min="5"
                  max="100"
                  step="5"
                  value={tempThreshold}
                  onChange={(e) => setTempThreshold(Number(e.target.value))}
                  className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-5 [&::-webkit-slider-thumb]:h-5 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-teal-500 [&::-webkit-slider-thumb]:cursor-pointer [&::-moz-range-thumb]:w-5 [&::-moz-range-thumb]:h-5 [&::-moz-range-thumb]:rounded-full [&::-moz-range-thumb]:bg-teal-500 [&::-moz-range-thumb]:border-0 [&::-moz-range-thumb]:cursor-pointer"
                  style={{
                    background: `linear-gradient(to right, #14b8a6 0%, #14b8a6 ${tempThreshold}%, #e5e7eb ${tempThreshold}%, #e5e7eb 100%)`,
                  }}
                />
                <div className="flex justify-between text-xs text-gray-500">
                  <span>5{isFlightBookmark ? ' seats' : '%'}</span>
                  <span>50{isFlightBookmark ? ' seats' : '%'}</span>
                  <span>100{isFlightBookmark ? ' seats' : '%'}</span>
                </div>
              </div>
            ) : (
              <div className="text-sm text-gray-700">
                Alert threshold: <span className="font-semibold text-teal-600">{alertConfig.alertThreshold}{isFlightBookmark ? ' seats' : '%'}</span>
              </div>
            )}
          </div>

          {/* Alert Statistics */}
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-gray-50 rounded-lg p-3">
              <div className="text-xs text-gray-500 mb-1">Last Evaluated</div>
              <div className="text-sm font-medium">
                {(() => {
                  if (alertConfig.lastEvaluated === null) return 'Never'
                  
                  let date
                  if (typeof alertConfig.lastEvaluated === 'number') {
                    if (alertConfig.lastEvaluated < 1000000000000) {
                      date = new Date(alertConfig.lastEvaluated * 1000)
                    } else {
                      date = new Date(alertConfig.lastEvaluated)
                    }
                  } else {
                    date = new Date(alertConfig.lastEvaluated)
                  }
                  
                  if (isNaN(date.getTime()) || date.getFullYear() <= 1970) {
                    return 'Never'
                  }
                  
                  return date.toLocaleDateString('en-US', {
                    month: 'short',
                    day: 'numeric',
                    year: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit'
                  })
                })()}
              </div>
            </div>
            <div className="bg-gray-50 rounded-lg p-3">
              <div className="text-xs text-gray-500 mb-1">Last Triggered</div>
              <div className="text-sm font-medium">
                {(() => {
                  if (alertConfig.lastTriggered === null) return 'Never'
                  
                  let date
                  if (typeof alertConfig.lastTriggered === 'number') {
                    if (alertConfig.lastTriggered < 1000000000000) {
                      date = new Date(alertConfig.lastTriggered * 1000)
                    } else {
                      date = new Date(alertConfig.lastTriggered)
                    }
                  } else {
                    date = new Date(alertConfig.lastTriggered)
                  }
                  
                  if (isNaN(date.getTime()) || date.getFullYear() <= 1970) {
                    return 'Never'
                  }
                  
                  return date.toLocaleDateString('en-US', {
                    month: 'short',
                    day: 'numeric',
                    year: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit'
                  })
                })()}
              </div>
            </div>
          </div>

          {/* Trigger History */}
          {alertConfig.triggerHistory && (
            <div className="border border-gray-200 rounded-lg p-4">
              <Label className="text-sm font-medium mb-3 block">Recent Alert History</Label>
              <div className="space-y-3 max-h-48 overflow-y-auto">
                {(() => {
                  try {
                    const triggerEvents = JSON.parse(alertConfig.triggerHistory)
                    if (Array.isArray(triggerEvents) && triggerEvents.length > 0) {
                      return triggerEvents.slice(0, 5).map((event, index) => (
                        <div key={index} className="flex items-start gap-3 pb-3 border-b last:border-b-0 last:pb-0">
                          <div className="w-2 h-2 rounded-full mt-2 flex-shrink-0 bg-teal-500"></div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-gray-900 mb-1">
                              {event.message || 'Alert triggered'}
                            </p>
                            <div className="flex items-center justify-between">
                              <span className="text-xs text-gray-500">
                                {event.timestamp ? (() => {
                                  try {
                                    const date = new Date(event.timestamp)
                                    return date.toLocaleDateString('en-US', {
                                      month: 'short',
                                      day: 'numeric',
                                      hour: '2-digit',
                                      minute: '2-digit'
                                    })
                                  } catch {
                                    return 'Unknown time'
                                  }
                                })() : 'Unknown time'}
                              </span>
                              {event.flightNumber && (
                                <span className="text-xs text-gray-600 font-medium">{event.flightNumber}</span>
                              )}
                            </div>
                          </div>
                        </div>
                      ))
                    }
                    return (
                      <div className="text-center py-4">
                        <p className="text-sm text-gray-500">No trigger history available</p>
                      </div>
                    )
                  } catch {
                    return (
                      <div className="text-center py-4">
                        <p className="text-sm text-gray-500">Unable to parse trigger history</p>
                      </div>
                    )
                  }
                })()}
              </div>
            </div>
          )}

        </div>

        <DialogFooter className="flex-col sm:flex-row gap-2">
          <Button
            type="button"
            variant="outline"
            onClick={handleDelete}
            className="rounded-full text-red-600 border-red-200 hover:bg-red-50 cursor-pointer"
          >
            <Trash2 className="w-4 h-4 mr-2" />
            Delete Alert
          </Button>
          <Button
            type="button"
            onClick={() => onOpenChange(false)}
            className="bg-black text-white hover:bg-gray-800 rounded-full cursor-pointer"
          >
            Close
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

export { AlertManagementDialog }