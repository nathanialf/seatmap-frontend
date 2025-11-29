"use client"

import React, { useState, useEffect, useCallback } from "react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Bell, Bookmark, Loader2 } from "lucide-react"
import Link from "next/link"
import { useRouter } from 'next/navigation'
import { useAuth } from "@/hooks/useAuth"
import { SavedItemCard, type BookmarkItem } from "@/components/saved-item-card"

interface BookmarksData {
  bookmarks: BookmarkItem[];
  total: number;
  tier: string;
  remaining: number;
}

interface BookmarksListProps {
  onViewSeatMap: (bookmark: BookmarkItem) => void
  onSetAlert: (bookmark: BookmarkItem) => void
  onViewAlert: (bookmark: BookmarkItem) => void
  onDeleteClick: (bookmark: BookmarkItem) => void
  seatMapLoading: string | null
  onBookmarksDataChange?: (data: BookmarksData | null) => void
}

export function BookmarksList({ 
  onViewSeatMap, 
  onSetAlert, 
  onViewAlert, 
  onDeleteClick,
  seatMapLoading,
  onBookmarksDataChange
}: BookmarksListProps) {
  const [bookmarksData, setBookmarksData] = useState<BookmarksData | null>(null)
  const [bookmarksLoading, setBookmarksLoading] = useState(false)
  const [bookmarksError, setBookmarksError] = useState<string | null>(null)
  const router = useRouter()
  const { isUser, isLoading, hasFreeTier } = useAuth()

  // Function to run a saved search
  const handleRunSearch = useCallback((bookmark: BookmarkItem) => {
    if (bookmark.itemType !== 'SAVED_SEARCH') {
      return
    }

    const searchParams = new URLSearchParams()
    
    const origin = bookmark.origin?.trim()
    const destination = bookmark.destination?.trim() 
    const departureDate = bookmark.departureDate?.trim()
    
    if (!origin || !destination || !departureDate) {
      console.error('Missing required search fields:', { origin, destination, departureDate })
      return
    }
    
    searchParams.set('from', origin)
    searchParams.set('to', destination)
    searchParams.set('date', departureDate)

    if (bookmark.travelClass?.trim()) {
      searchParams.set('seatClass', bookmark.travelClass.trim())
    }
    
    if (bookmark.airlineCode?.trim()) {
      searchParams.set('airline', bookmark.airlineCode.trim())
    }
    
    if (bookmark.flightNumber?.trim()) {
      searchParams.set('flight', bookmark.flightNumber.trim())
    }

    router.push(`/search?${searchParams.toString()}`)
  }, [router])

  // Function to fetch bookmarks from API
  const fetchBookmarks = useCallback(async () => {
    if (!isUser) return
    
    setBookmarksLoading(true)
    setBookmarksError(null)
    
    try {
      const response = await fetch('/api/bookmarks', {
        method: 'GET',
        credentials: 'include',
      })
      
      const result = await response.json()
      
      if (result.success) {
        setBookmarksData(result.data)
        onBookmarksDataChange?.(result.data)
      } else {
        setBookmarksError(result.message || 'Failed to load bookmarks')
        onBookmarksDataChange?.(null)
      }
    } catch (error) {
      console.error('Failed to fetch bookmarks:', error)
      setBookmarksError('Failed to load bookmarks')
      onBookmarksDataChange?.(null)
    } finally {
      setBookmarksLoading(false)
    }
  }, [isUser, onBookmarksDataChange])

  // Load bookmarks when user is authenticated
  useEffect(() => {
    if (isUser && !isLoading) {
      fetchBookmarks()
    }
  }, [isUser, isLoading, fetchBookmarks])

  // Function to parse flight offer data for display
  const parseFlightOffer = useCallback((flightOfferData: string) => {
    try {
      const offer = JSON.parse(flightOfferData)
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
          price: offer.price ? `$${offer.price.total}` : null,
          duration: segment.duration
        }
      }
    } catch (error) {
      console.error('Failed to parse flight offer:', error)
    }
    return null
  }, [])


  if (bookmarksLoading) {
    return (
      <Card className="p-12 text-center">
        <Loader2 className="w-8 h-8 animate-spin text-gray-400 mx-auto mb-4" />
        <div className="text-gray-600">Loading your saved items...</div>
      </Card>
    )
  }

  if (bookmarksError) {
    return (
      <Card className="p-12 text-center">
        <div className="w-12 h-12 bg-red-100 rounded-lg flex items-center justify-center mx-auto mb-4">
          <Bell className="w-6 h-6 text-red-400" />
        </div>
        <h3 className="text-lg font-semibold mb-2 text-red-600">Error loading bookmarks</h3>
        <p className="text-gray-600 mb-4">{bookmarksError}</p>
        <Button 
          onClick={fetchBookmarks}
          variant="outline" 
          className="rounded-full bg-transparent"
        >
          Try Again
        </Button>
      </Card>
    )
  }

  if (bookmarksData && bookmarksData.total > 0) {
    return (
      <div className="space-y-4">
        {bookmarksData.bookmarks
          .slice() // Create a copy to avoid mutating original array
          .sort((a, b) => {
            // Extract departure date for comparison
            const getDate = (bookmark: BookmarkItem) => {
              try {
                if (bookmark.itemType === 'SAVED_SEARCH' && bookmark.departureDate) {
                  return new Date(bookmark.departureDate)
                } else if (bookmark.itemType === 'BOOKMARK' && bookmark.flightOfferData) {
                  const flightOffer = JSON.parse(bookmark.flightOfferData)
                  if (flightOffer.itineraries?.[0]?.segments?.[0]?.departure?.at) {
                    return new Date(flightOffer.itineraries[0].segments[0].departure.at)
                  } else if (flightOffer.date) {
                    return new Date(flightOffer.date)
                  }
                }
                return new Date(bookmark.createdAt)
              } catch {
                return new Date(bookmark.createdAt)
              }
            }
            
            const dateA = getDate(a)
            const dateB = getDate(b)
            
            return dateA.getTime() - dateB.getTime()
          })
          .map((bookmark) => (
            <SavedItemCard
              key={bookmark.bookmarkId}
              bookmark={bookmark}
              onRunSearch={handleRunSearch}
              onDeleteClick={onDeleteClick}
              onViewSeatMap={onViewSeatMap}
              onSetAlert={onSetAlert}
              onViewAlert={onViewAlert}
              seatMapLoading={seatMapLoading === bookmark.bookmarkId}
              parseFlightOffer={parseFlightOffer}
            />
          ))}
      </div>
    )
  }

  if (hasFreeTier) {
    return (
      <Card className="p-12 text-center">
        <div className="w-12 h-12 bg-teal-100 rounded-lg flex items-center justify-center mx-auto mb-4">
          <Bookmark className="w-6 h-6 text-teal-600" />
        </div>
        <h3 className="text-lg font-semibold mb-2 text-teal-700">Free Plan - Limited Features</h3>
        <p className="text-gray-600 mb-4">
          You can search for flights, but saving items requires a paid plan.
          Upgrade to save flights, searches, and set up alerts.
        </p>
        <div className="flex flex-col sm:flex-row gap-3 items-center justify-center">
          <Link href="/search">
            <Button variant="outline" className="rounded-full cursor-pointer">
              Search Flights
            </Button>
          </Link>
          <Link href="/pricing">
            <Button className="bg-teal-600 text-white hover:bg-teal-700 rounded-full cursor-pointer">
              Upgrade Plan
            </Button>
          </Link>
        </div>
      </Card>
    )
  }

  return (
    <Card className="p-12 text-center">
      <Bookmark className="w-12 h-12 text-gray-300 mx-auto mb-4" />
      <h3 className="text-lg font-semibold mb-2">No saved items yet</h3>
      <p className="text-gray-600 mb-4">Save flights and searches to track them here</p>
      <Link href="/search">
        <Button className="bg-black text-white hover:bg-gray-800 rounded-full cursor-pointer">
          Search Flights
        </Button>
      </Link>
    </Card>
  )
}

// Export types for parent component
export type { BookmarksData, BookmarkItem }