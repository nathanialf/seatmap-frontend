"use client"

import React from "react"
import { Plane, Search, Bell, Trash2 } from 'lucide-react'
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"

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
}

interface SavedItemCardProps {
  bookmark: BookmarkItem
  onRunSearch: (bookmark: BookmarkItem) => void
  onDeleteClick: (bookmark: BookmarkItem) => void
  parseFlightOffer: (flightOfferData: string) => { route: string; date: string; price?: string; flightNumber: string } | null
}

const SavedItemCard: React.FC<SavedItemCardProps> = ({
  bookmark,
  onRunSearch,
  onDeleteClick,
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
                {bookmark.origin} → {bookmark.destination} • {bookmark.departureDate}
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
            Saved {(() => {
              try {
                // Handle both ISO strings and epoch timestamps
                let date: Date
                
                if (typeof bookmark.createdAt === 'string') {
                  // ISO string format
                  date = new Date(bookmark.createdAt)
                } else if (typeof bookmark.createdAt === 'number') {
                  // Epoch timestamp - check if it's in seconds or milliseconds
                  const timestamp = bookmark.createdAt
                  // If timestamp is less than year 2000 in milliseconds, it's probably in seconds
                  date = timestamp < 946684800000 ? new Date(timestamp * 1000) : new Date(timestamp)
                } else {
                  console.log('Unexpected createdAt type:', typeof bookmark.createdAt, bookmark.createdAt)
                  return 'Recently'
                }
                
                // Check if date is valid
                if (isNaN(date.getTime())) {
                  console.log('Invalid createdAt date:', bookmark.createdAt)
                  return 'Recently'
                }
                
                return date.toLocaleDateString()
              } catch (error) {
                console.log('Error parsing createdAt:', bookmark.createdAt, error)
                return 'Recently'
              }
            })()}
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
                disabled
                variant="outline" 
                className="rounded-full bg-transparent text-sm opacity-50 cursor-not-allowed"
              >
                View Seats
              </Button>
            )}
            <Button 
              disabled
              variant="outline" 
              className="rounded-full bg-transparent text-sm opacity-50 cursor-not-allowed"
            >
              <Bell className="w-4 h-4 mr-1" />
              Add Alert
            </Button>
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