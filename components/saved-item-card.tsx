"use client"

import React from "react"
import { Plane, Search, Bell, Trash2, Loader2 } from 'lucide-react'
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import logger from "@/lib/logger"

// Helper function to format travel class for display
function formatTravelClassForDisplay(travelClass: string): string {
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

// Helper function to format dates consistently with flight search results
function formatDateForDisplay(dateInput: string | number): string {
  try {
    let date: Date
    
    if (typeof dateInput === 'string') {
      // Handle both ISO strings (2024-12-15) and full datetime strings
      date = new Date(dateInput)
    } else if (typeof dateInput === 'number') {
      // Handle epoch timestamps
      const timestamp = dateInput
      // If timestamp is less than year 2000 in milliseconds, it's probably in seconds
      date = timestamp < 946684800000 ? new Date(timestamp * 1000) : new Date(timestamp)
    } else {
      return 'Invalid date'
    }
    
    // Check if date is valid
    if (isNaN(date.getTime())) {
      return 'Invalid date'
    }
    
    // Format to match flight search results: "Mon, Dec 15, 2024"
    return date.toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short', 
      day: 'numeric',
      year: 'numeric'
    })
  } catch (error) {
    logger.log('Error formatting date:', dateInput, error)
    return 'Invalid date'
  }
}

export interface BookmarkItem {
  bookmarkId: string;
  userId: string;
  itemType: 'BOOKMARK' | 'SAVED_SEARCH';
  title: string;
  flightOfferData?: string;
  // Individual saved search fields (new API structure)
  origin?: string;
  destination?: string;
  departureDate?: string;
  travelClass?: string;
  airlineCode?: string;
  flightNumber?: string;
  maxResults?: number;
  createdAt: string;
  expiresAt: string;
  // Alert configuration fields
  hasAlert?: boolean;
  alertConfig?: {
    alertThreshold: number;
    lastEvaluated?: string;
    lastTriggered?: string;
    triggerHistory?: string;
  };
}

interface SavedItemCardProps {
  bookmark: BookmarkItem
  onRunSearch: (bookmark: BookmarkItem) => void
  onDeleteClick: (bookmark: BookmarkItem) => void
  onViewSeatMap?: (bookmark: BookmarkItem) => void
  onSetAlert?: (bookmark: BookmarkItem) => void
  onViewAlert?: (bookmark: BookmarkItem) => void
  seatMapLoading?: boolean
  parseFlightOffer: (flightOfferData: string) => { route: string; date: string; price?: string; flightNumber: string } | null
}

const SavedItemCard: React.FC<SavedItemCardProps> = ({
  bookmark,
  onRunSearch,
  onDeleteClick,
  onViewSeatMap,
  onSetAlert: _onSetAlert,
  onViewAlert: _onViewAlert,
  seatMapLoading = false,
  parseFlightOffer
}) => {
  return (
    <Card className="p-6">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-2">
            {bookmark.itemType === 'BOOKMARK' ? (
              <Plane className="w-5 h-5 text-blue-600" />
            ) : (
              <Search className="w-5 h-5 text-green-600" />
            )}
            <span className="font-semibold">{bookmark.title}</span>
            <span className={`px-2 py-1 text-xs rounded-full ${
              bookmark.itemType === 'BOOKMARK' 
                ? 'bg-blue-100 text-blue-700' 
                : 'bg-green-100 text-green-700'
            }`}>
              {bookmark.itemType === 'BOOKMARK' ? 'Flight' : 'Search'}
            </span>
          </div>
          
          {bookmark.itemType === 'BOOKMARK' && bookmark.flightOfferData ? (
            // Display parsed flight offer data
            (() => {
              const flightInfo = parseFlightOffer(bookmark.flightOfferData)
              return flightInfo ? (
                <>
                  <div className="text-gray-600 mb-2">
                    {flightInfo.route} • {flightInfo.date}
                    {flightInfo.price && <span className="ml-2 font-medium">{flightInfo.price}</span>}
                  </div>
                  <div className="text-sm text-gray-500">
                    <span>Flight {flightInfo.flightNumber}</span>
                  </div>
                </>
              ) : (
                <div className="text-gray-600 mb-2">Flight details</div>
              )
            })()
          ) : bookmark.itemType === 'SAVED_SEARCH' && bookmark.origin && bookmark.destination ? (
            // Display saved search data using individual fields
            <>
              <div className="text-gray-600 mb-2">
                {bookmark.origin} → {bookmark.destination} • {formatDateForDisplay(bookmark.departureDate || '')}
              </div>
              <div className="text-sm text-gray-500">
                <span>
                  {bookmark.travelClass ? formatTravelClassForDisplay(bookmark.travelClass) : 'Any class'}
                  {bookmark.airlineCode && ` • ${bookmark.airlineCode}`}
                  {bookmark.flightNumber && ` ${bookmark.flightNumber}`}
                </span>
              </div>
            </>
          ) : null}
        </div>
        
        <div className="flex flex-col items-end gap-2">
          <div className="text-sm text-gray-500">
            Saved {formatDateForDisplay(bookmark.createdAt)}
          </div>
          <div className="flex gap-2">
            {bookmark.itemType === 'SAVED_SEARCH' ? (
              <Button 
                className="rounded-full bg-black text-white hover:bg-gray-800 text-sm cursor-pointer"
                onClick={() => onRunSearch(bookmark)}
              >
                Run Search
              </Button>
            ) : (
              <Button 
                disabled={!onViewSeatMap || seatMapLoading}
                className={`rounded-full text-sm ${
                  onViewSeatMap && !seatMapLoading
                    ? 'bg-black text-white hover:bg-gray-800 cursor-pointer' 
                    : 'bg-gray-400 text-white cursor-not-allowed'
                }`}
                onClick={() => onViewSeatMap && !seatMapLoading && onViewSeatMap(bookmark)}
              >
                {seatMapLoading ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Loading...
                  </>
                ) : (
                  'View Seats'
                )}
              </Button>
            )}
            {(bookmark.hasAlert || bookmark.alertConfig) ? (
              <Button 
                variant="outline" 
                className="rounded-full bg-transparent text-sm text-teal-600 border-teal-600 hover:bg-teal-50 cursor-pointer"
                onClick={() => _onViewAlert && _onViewAlert(bookmark)}
                disabled={!_onViewAlert}
              >
                <Bell className="w-4 h-4 mr-1" />
                View Alert
              </Button>
            ) : (
              <Button 
                className="rounded-full text-sm bg-teal-600 text-white cursor-not-allowed opacity-50"
                disabled
              >
                <Bell className="w-4 h-4 mr-1" />
                Set Alert
              </Button>
            )}
            <Button 
              variant="outline" 
              className="rounded-full bg-transparent text-sm text-red-600 hover:text-red-700"
              onClick={() => onDeleteClick(bookmark)}
            >
              <Trash2 className="w-4 h-4 mr-1" />
              Remove
            </Button>
          </div>
        </div>
      </div>
    </Card>
  )
}

export { SavedItemCard }