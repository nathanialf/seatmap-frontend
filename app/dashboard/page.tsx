"use client"

import { useState, useEffect, useCallback } from "react"
import { Navbar } from "@/components/navbar"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Bell, Plane, MapPin, Calendar, Bookmark, Search, Trash2, AlertTriangle, Loader2, Clock, Users, ArrowLeft } from "lucide-react"
import Link from "next/link"
import { useRouter } from 'next/navigation'
import { useAuth } from "@/hooks/useAuth"
import { SavedItemCard, type BookmarkItem } from "@/components/saved-item-card"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { SeatmapRenderer } from "@/components/seatmap-renderer"
import { FlightSegmentDisplay } from "@/components/flight-segment-display"

// Types for bookmark data

interface BookmarksData {
  bookmarks: BookmarkItem[];
  total: number;
  tier: string;
  remaining: number;
}

export default function DashboardPage() {
  const [showPreview, setShowPreview] = useState(false)
  const [bookmarksData, setBookmarksData] = useState<BookmarksData | null>(null)
  const [bookmarksLoading, setBookmarksLoading] = useState(false)
  const [bookmarksError, setBookmarksError] = useState<string | null>(null)
  const [deleteModalOpen, setDeleteModalOpen] = useState(false)
  const [bookmarkToDelete, setBookmarkToDelete] = useState<BookmarkItem | null>(null)
  const [isDeleting, setIsDeleting] = useState(false)
  const [selectedBookmarkForSeatMap, setSelectedBookmarkForSeatMap] = useState<BookmarkItem | null>(null)
  const [loadingBookmarkId, setLoadingBookmarkId] = useState<string | null>(null)
  const router = useRouter()
  const { isAuthenticated, isUser, isGuest, isLoading, hasFreeTier } = useAuth()

  // Function to run a saved search
  const handleRunSearch = useCallback((bookmark: BookmarkItem) => {
    if (bookmark.itemType !== 'SAVED_SEARCH') {
      return
    }

    // Map saved search fields to search page URL parameters
    const searchParams = new URLSearchParams()
    
    // Required fields - ensure they exist and are not empty
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

    // Optional fields
    if (bookmark.travelClass?.trim()) {
      searchParams.set('seatClass', bookmark.travelClass.trim())
    }
    
    if (bookmark.airlineCode?.trim()) {
      searchParams.set('airline', bookmark.airlineCode.trim())
    }
    
    if (bookmark.flightNumber?.trim()) {
      searchParams.set('flight', bookmark.flightNumber.trim())
    }

    // Navigate to search page with parameters using Next.js router
    router.push(`/search?${searchParams.toString()}`)
  }, [router])

  // Function to view seat map for a flight bookmark
  const handleViewSeatMap = useCallback(async (bookmark: BookmarkItem) => {
    if (bookmark.itemType !== 'BOOKMARK') {
      return
    }

    // Set loading state
    setLoadingBookmarkId(bookmark.bookmarkId)

    try {
      // Parse the flight offer data that's already in memory
      const flightOfferData = JSON.parse(bookmark.flightOfferData)
      // Call the seat map API to get seat map data for this flight
      const response = await fetch(`/api/flight-search/bookmark/${bookmark.bookmarkId}`, {
        method: 'GET',
        credentials: 'include',
      })
      
      const result = await response.json()
      
      if (result.success && result.data) {
        // Extract actual flight number from flight offer data
        const segments = flightOfferData.itineraries?.[0]?.segments || []
        const firstSegment = segments[0] || {}
        const flightNumber = `${firstSegment.carrierCode || ''} ${firstSegment.number || ''}`.trim()
        
        // Construct flight object like in search results
        // The bookmark has flight offer data, API returns seat map data
        
        const flightWithSeatMap = {
          ...flightOfferData,
          seatmapData: result.data, // This should be the seat map with decks
          flightNumber: flightNumber,
          id: flightNumber || bookmark.bookmarkId,
          // Add segments array for FlightSegmentDisplay component
          segments: segments.map((segment, index) => ({
            segmentIndex: index,
            carrier: segment.carrierCode || '',
            flightNumber: `${segment.carrierCode || ''} ${segment.number || ''}`.trim(),
            route: `${segment.departure?.iataCode || ''} → ${segment.arrival?.iataCode || ''}`,
            departure: {
              code: segment.departure?.iataCode || '',
              time: segment.departure?.at ? new Date(segment.departure.at).toLocaleTimeString('en-US', {
                hour: '2-digit',
                minute: '2-digit',
                hour12: true
              }) : ''
            },
            arrival: {
              code: segment.arrival?.iataCode || '',
              time: segment.arrival?.at ? new Date(segment.arrival.at).toLocaleTimeString('en-US', {
                hour: '2-digit',
                minute: '2-digit',
                hour12: true
              }) : ''
            },
            aircraft: segment.aircraft?.code || undefined,
            seatMapAvailable: !!result.data?.seatMap,
            seatMapData: result.data?.seatMap
          }))
        }
        
        // Set state to show inline seat map viewer
        setSelectedBookmarkForSeatMap(flightWithSeatMap)
      } else {
        console.error('Failed to get seat map data:', result.message)
      }
    } catch (error) {
      console.error('Failed to process flight bookmark:', error)
    } finally {
      // Clear loading state
      setLoadingBookmarkId(null)
    }
  }, [])

  // Function to fetch bookmarks from API
  const fetchBookmarks = useCallback(async () => {
    if (!isUser) return // Only fetch for authenticated users (not guests)
    
    setBookmarksLoading(true)
    setBookmarksError(null)
    
    try {
      const response = await fetch('/api/bookmarks', {
        method: 'GET',
        credentials: 'include', // Include cookies for authentication
      })
      
      const result = await response.json()
      
      if (result.success) {
        setBookmarksData(result.data)
      } else {
        setBookmarksError(result.message || 'Failed to load bookmarks')
      }
    } catch (error) {
      console.error('Failed to fetch bookmarks:', error)
      setBookmarksError('Failed to load bookmarks')
    } finally {
      setBookmarksLoading(false)
    }
  }, [isUser])

  // Load bookmarks when user is authenticated
  useEffect(() => {
    if (isUser && !isLoading) {
      fetchBookmarks()
    }
  }, [isUser, isLoading, fetchBookmarks])

  // Function to handle delete confirmation
  const handleDeleteClick = (bookmark: BookmarkItem) => {
    setBookmarkToDelete(bookmark)
    setDeleteModalOpen(true)
  }

  // Function to delete bookmark
  const deleteBookmark = async () => {
    if (!bookmarkToDelete) return

    setIsDeleting(true)
    try {
      const response = await fetch(`/api/bookmarks/${bookmarkToDelete.bookmarkId}`, {
        method: 'DELETE',
        credentials: 'include',
      })

      const result = await response.json()

      if (result.success) {
        // Remove the deleted bookmark from the local state
        setBookmarksData(prev => prev ? {
          ...prev,
          bookmarks: prev.bookmarks.filter(b => b.bookmarkId !== bookmarkToDelete.bookmarkId),
          total: prev.total - 1
        } : null)
        
        // Close modal and reset state
        setDeleteModalOpen(false)
        setBookmarkToDelete(null)
      } else {
        console.error('Delete failed:', result.message)
        // You could add error handling here
      }
    } catch (error) {
      console.error('Failed to delete bookmark:', error)
      // You could add error handling here
    } finally {
      setIsDeleting(false)
    }
  }

  // Function to cancel delete
  const cancelDelete = () => {
    setDeleteModalOpen(false)
    setBookmarkToDelete(null)
  }

  // Function to parse flight offer data for display
  const parseFlightOffer = (flightOfferData: string) => {
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
  }

  const activeAlerts = [
    {
      id: 1,
      flightNumber: "AA 1234",
      route: "LAX → JFK",
      date: "Dec 15, 2024",
      preferredSeats: ["12A", "12F"],
      status: "active",
      lastChecked: "2 min ago",
    },
    {
      id: 2,
      flightNumber: "DL 5678",
      route: "SFO → BOS",
      date: "Dec 20, 2024",
      preferredSeats: ["8A", "8B"],
      status: "active",
      lastChecked: "5 min ago",
    },
  ]

  const recentNotifications = [
    {
      id: 1,
      type: "seat_available",
      message: "Seat 12A is now available on AA 1234",
      time: "10 minutes ago",
      flight: "AA 1234",
    },
    {
      id: 2,
      type: "price_drop",
      message: "Price dropped by $50 on DL 5678",
      time: "1 hour ago",
      flight: "DL 5678",
    },
    {
      id: 3,
      type: "seat_taken",
      message: "Seat 8A was just booked on DL 5678",
      time: "3 hours ago",
      flight: "DL 5678",
    },
  ]

  // Stats - real data for authenticated users, mock data for preview
  const realStats = [
    { label: "Active Alerts", value: "COMING SOON", icon: Bell },
    { label: "Bookmarks", value: bookmarksData?.total?.toString() || "0", icon: Bookmark },
    { label: "Flights Saved", value: bookmarksData?.bookmarks?.filter(b => b.itemType === 'BOOKMARK').length.toString() || "0", icon: Plane },
    { label: "Saved Searches", value: bookmarksData?.bookmarks?.filter(b => b.itemType === 'SAVED_SEARCH').length.toString() || "0", icon: Search },
  ]

  const previewStats = [
    { label: "Active Alerts", value: "2", icon: Bell },
    { label: "Flights Tracked", value: "5", icon: Plane },
    { label: "Seats Monitored", value: "12", icon: MapPin },
    { label: "Alerts This Month", value: "24", icon: Calendar },
  ]

  const isRealDashboard = isAuthenticated && !showPreview

  const stats = isRealDashboard ? realStats : previewStats

  if (isLoading) {
    return (
      <div className="min-h-screen bg-white">
        <Navbar />
        <div className="max-w-7xl mx-auto px-6 py-16">
          <div className="flex items-center justify-center">
            <div className="text-gray-600">Loading...</div>
          </div>
        </div>
      </div>
    )
  }

  // Seat map viewer for bookmarked flights (inline like search results)
  if (selectedBookmarkForSeatMap !== null) {
    const flight = selectedBookmarkForSeatMap
    if (!flight) return null

    return (
      <div className="min-h-screen bg-gray-50">
        <Navbar />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="mb-6">
            <Button
              onClick={() => setSelectedBookmarkForSeatMap(null)}
              variant="outline"
              className="rounded-full mb-4 cursor-pointer"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Dashboard
            </Button>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Seat Map Viewer</h1>
            <p className="text-gray-600">
              {flight.flightNumber || 'Flight'} • {flight.itineraries?.[0]?.segments?.[0]?.departure?.iataCode} → {flight.itineraries?.[0]?.segments?.[flight.itineraries[0].segments.length - 1]?.arrival?.iataCode}
            </p>
          </div>

          <div className="space-y-6">
            <Card className="p-4">
              <div className="flex flex-wrap items-center gap-4 text-sm">
                <div className="flex items-center gap-2">
                  <Plane className="w-4 h-4 text-gray-400" />
                  <span className="font-semibold">{flight.flightNumber}</span>
                </div>
                <div className="flex items-center gap-2">
                  <MapPin className="w-4 h-4 text-gray-400" />
                  <span>
                    {flight.itineraries?.[0]?.segments?.[0]?.departure?.iataCode} → {flight.itineraries?.[0]?.segments?.[flight.itineraries[0].segments.length - 1]?.arrival?.iataCode}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-gray-400" />
                  <span>{flight.itineraries?.[0]?.segments?.[0]?.departure?.at ? new Date(flight.itineraries[0].segments[0].departure.at).toLocaleDateString() : 'N/A'}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Clock className="w-4 h-4 text-gray-400" />
                  <span>
                    {flight.itineraries?.[0]?.segments?.[0]?.departure?.at ? new Date(flight.itineraries[0].segments[0].departure.at).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true }) : 'N/A'} - {flight.itineraries?.[0]?.segments?.[flight.itineraries[0].segments.length - 1]?.arrival?.at ? new Date(flight.itineraries[0].segments[flight.itineraries[0].segments.length - 1].arrival.at).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true }) : 'N/A'}
                  </span>
                </div>
                {/* Only show total seat availability for single segment flights */}
                {flight.itineraries?.[0]?.segments?.length === 1 && (
                  <div className="flex items-center gap-2">
                    <Users className="w-4 h-4 text-gray-400" />
                    <span className="text-teal-600 font-medium">
                      {(() => {
                        if (flight.seatmapData?.seatMap?.decks) {
                          const allSeats = flight.seatmapData.seatMap.decks.flatMap(deck => deck.seats || []);
                          const availableSeats = allSeats.filter(seat => seat.availabilityStatus === 'AVAILABLE');
                          const totalSeats = allSeats.length;
                          const percentage = totalSeats > 0 ? Math.round((availableSeats.length / totalSeats) * 100) : 0;
                          return `${availableSeats.length} seats available (${percentage}% of ${totalSeats} total)`;
                        }
                        return `${flight.numberOfBookableSeats || 'N/A'} seats available`;
                      })()}
                    </span>
                  </div>
                )}
              </div>
            </Card>

            {/* Multi-segment flight details */}
            <FlightSegmentDisplay
              segments={flight.segments || []}
              seatmapData={flight.seatmapData?.seatMap}
              seatmapAvailable={!!flight.seatmapData?.seatMap}
            />

            {(() => {
              
              // The seat map API returns the full flight offer with seatMap property
              if (flight.seatmapData?.seatMap?.decks && Array.isArray(flight.seatmapData.seatMap.decks)) {
                return <SeatmapRenderer seatmapData={flight.seatmapData.seatMap} />;
              } else {
                return (
                  <Card className="p-4 sm:p-6">
                    <div className="text-center py-12">
                      <Plane className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                      <h3 className="text-lg font-semibold text-gray-700 mb-2">
                        {flight.seatmapData ? 'Invalid Seat Map Data' : 'No Seat Map Available'}
                      </h3>
                      <p className="text-gray-500">
                        {flight.seatmapData 
                          ? 'The seat map data structure is not in the expected format.'
                          : 'Seat map information is not available for this flight.'}
                      </p>
                      {flight.seatmapData && (
                        <details className="mt-4 text-left">
                          <summary className="cursor-pointer text-sm text-gray-400">Debug: Show seat map data structure</summary>
                          <pre className="text-xs text-gray-600 mt-2 p-2 bg-gray-100 rounded overflow-auto max-h-40">
                            {JSON.stringify(flight.seatmapData, null, 2)}
                          </pre>
                        </details>
                      )}
                    </div>
                  </Card>
                );
              }
            })()}
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-white">
      <Navbar />

      <div className="max-w-7xl mx-auto px-6 py-8">
          {/* Header */}
          <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-8">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">
                Dashboard
                {!isRealDashboard && (
                  <span className="ml-3 text-sm bg-gray-100 text-gray-600 px-3 py-1 rounded-full font-normal">
                    Preview Mode
                  </span>
                )}
              </h1>
              <p className="text-gray-600">
                {isRealDashboard
                  ? `Welcome back! Here's what's happening with your alerts.`
                  : isUser
                  ? "This is a preview of your dashboard. Real data will appear here when you have active alerts."
                  : isGuest
                  ? "This is a preview dashboard. Sign up for a full account to create alerts and track flights."
                  : "This is a preview of what your dashboard will look like with active flight alerts."
                }
              </p>
            </div>
            {!isRealDashboard && (
              <div className="flex gap-3 mt-4 md:mt-0">
                {isAuthenticated && (
                  <Button 
                    variant="outline" 
                    className="rounded-full px-6 bg-transparent cursor-pointer"
                    onClick={() => setShowPreview(false)}
                  >
                    Exit Preview
                  </Button>
                )}
                <Link href="/auth/signup">
                  <Button className="bg-black text-white hover:bg-gray-800 rounded-full px-6 cursor-pointer">
                    {isAuthenticated ? "Create Alert" : "Sign Up"}
                  </Button>
                </Link>
              </div>
            )}
          </div>

          {/* Stats Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            {stats.map((stat) => (
              <Card key={stat.label} className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600 mb-1">{stat.label}</p>
                    <p className={`font-bold ${stat.value === 'COMING SOON' ? 'text-lg text-teal-600' : 'text-3xl'}`}>{stat.value}</p>
                  </div>
                  <div className="w-12 h-12 bg-gray-100 rounded-lg flex items-center justify-center">
                    <stat.icon className="w-6 h-6 text-gray-600" />
                  </div>
                </div>
              </Card>
            ))}
          </div>

          <div className="grid lg:grid-cols-3 gap-8">
            {/* Saved Items / Active Alerts */}
            <div className="lg:col-span-2">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold">
                  {isRealDashboard ? "Saved Items" : "Active Alerts"}
                </h2>
              </div>

              <div className="space-y-4">
                {/* Show preview alerts, real bookmarks, or empty state */}
                {!isRealDashboard ? (
                  activeAlerts.map((alert) => (
                    <Card key={alert.id} className="p-6">
                      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <Plane className="w-5 h-5 text-gray-600" />
                            <span className="font-semibold">{alert.flightNumber}</span>
                            <span className="px-2 py-1 bg-green-100 text-green-700 text-xs rounded-full">
                              {alert.status}
                            </span>
                          </div>
                          <div className="text-gray-600 mb-2">
                            {alert.route} • {alert.date}
                          </div>
                          <div className="flex items-center gap-2 text-sm text-gray-500">
                            <MapPin className="w-4 h-4" />
                            <span>Monitoring seats: {alert.preferredSeats.join(", ")}</span>
                          </div>
                        </div>
                        <div className="flex flex-col items-end gap-2">
                          <div className="text-sm text-gray-500">Last checked {alert.lastChecked}</div>
                          <div className="flex gap-2">
                            <Button variant="outline" className="rounded-full bg-transparent text-sm">
                              Edit
                            </Button>
                            <Button variant="outline" className="rounded-full bg-transparent text-sm">
                              Pause
                            </Button>
                          </div>
                        </div>
                      </div>
                    </Card>
                  ))
                ) : bookmarksLoading ? (
                  /* Loading state */
                  <Card className="p-12 text-center">
                    <Loader2 className="w-8 h-8 animate-spin text-gray-400 mx-auto mb-4" />
                    <div className="text-gray-600">Loading your saved items...</div>
                  </Card>
                ) : bookmarksError ? (
                  /* Error state */
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
                ) : bookmarksData && bookmarksData.total > 0 ? (
                  /* Real bookmarks data - sorted by departure date (closest first) */
                  bookmarksData.bookmarks
                    .slice() // Create a copy to avoid mutating original array
                    .sort((a, b) => {
                      // Extract departure date for comparison
                      const getDate = (bookmark: BookmarkItem) => {
                        try {
                          if (bookmark.itemType === 'SAVED_SEARCH' && bookmark.departureDate) {
                            return new Date(bookmark.departureDate)
                          } else if (bookmark.itemType === 'BOOKMARK' && bookmark.flightOfferData) {
                            const flightOffer = JSON.parse(bookmark.flightOfferData)
                            // Try different possible date fields in flight offer
                            if (flightOffer.itineraries?.[0]?.segments?.[0]?.departure?.at) {
                              return new Date(flightOffer.itineraries[0].segments[0].departure.at)
                            } else if (flightOffer.date) {
                              return new Date(flightOffer.date)
                            }
                          }
                          // Fallback to creation date if no departure date found
                          return new Date(bookmark.createdAt)
                        } catch {
                          // If any parsing fails, use creation date
                          return new Date(bookmark.createdAt)
                        }
                      }
                      
                      const dateA = getDate(a)
                      const dateB = getDate(b)
                      
                      // Sort by date (closest first)
                      return dateA.getTime() - dateB.getTime()
                    })
                    .map((bookmark) => (
                      <div key={bookmark.bookmarkId}>
                        <SavedItemCard
                          bookmark={bookmark}
                          onRunSearch={handleRunSearch}
                          onDeleteClick={handleDeleteClick}
                          onViewSeatMap={handleViewSeatMap}
                          seatMapLoading={loadingBookmarkId === bookmark.bookmarkId}
                          parseFlightOffer={parseFlightOffer}
                        />
                        {/* Debug readout for flight bookmarks (HIDDEN) */}
                        {false && bookmark.itemType === 'BOOKMARK' && bookmark.flightOfferData && (
                          <Card className="mt-4 p-4 bg-gray-50 border border-gray-200">
                            <div className="mb-2">
                              <div className="flex items-center gap-2 mb-2">
                                <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                                <span className="text-sm font-semibold text-gray-700">
                                  Flight Bookmark Debug Data
                                </span>
                              </div>
                              <pre className="text-xs text-gray-600 overflow-x-auto bg-white rounded border p-3 max-h-60 overflow-y-auto whitespace-pre-wrap">
                                {JSON.stringify(JSON.parse(bookmark.flightOfferData), null, 2)}
                              </pre>
                            </div>
                          </Card>
                        )}
                      </div>
                    ))
                ) : hasFreeTier ? (
                  /* Free tier user - upgrade message */
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
                ) : (
                  /* Paid tier user empty state */
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
                )}
              </div>
            </div>

            {/* Recent Notifications */}
            <div className="lg:col-span-1">
              <h2 className="text-2xl font-bold mb-6">Recent Notifications</h2>

              <Card className="p-6">
                {!isRealDashboard ? (
                  <>
                    <div className="space-y-4">
                      {recentNotifications.map((notification) => (
                        <div key={notification.id} className="pb-4 border-b last:border-b-0 last:pb-0">
                          <div className="flex items-start gap-3">
                            <div
                              className={`w-2 h-2 rounded-full mt-2 flex-shrink-0 ${
                                notification.type === "seat_available"
                                  ? "bg-green-500"
                                  : notification.type === "price_drop"
                                    ? "bg-blue-500"
                                    : "bg-gray-400"
                              }`}
                            ></div>
                            <div className="flex-1">
                              <p className="text-sm font-medium mb-1">{notification.message}</p>
                              <div className="flex items-center justify-between">
                                <span className="text-xs text-gray-500">{notification.time}</span>
                                <span className="text-xs text-gray-600 font-medium">{notification.flight}</span>
                              </div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </>
                ) : (
                  <div className="text-center py-8">
                    <div className="w-12 h-12 bg-gray-100 rounded-lg flex items-center justify-center mx-auto mb-4">
                      <Bell className="w-6 h-6 text-gray-400" />
                    </div>
                    <h3 className="font-semibold mb-2 text-teal-600">COMING SOON</h3>
                    <p className="text-sm text-gray-500">Notifications will appear here when you create alerts</p>
                  </div>
                )}
              </Card>

            </div>
          </div>
        </div>


        {/* Delete Confirmation Modal */}
      <Dialog open={deleteModalOpen} onOpenChange={setDeleteModalOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-red-600">
              <AlertTriangle className="w-5 h-5" />
              Delete Bookmark
            </DialogTitle>
            <DialogDescription className="pt-2">
              Are you sure you want to delete this bookmark? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          
          {bookmarkToDelete && (
            <div className="bg-gray-50 rounded-lg p-3 my-4">
              <div className="font-medium text-gray-900">{bookmarkToDelete.title}</div>
              <div className="text-sm text-gray-600">
                {bookmarkToDelete.itemType === 'BOOKMARK' ? 'Flight Bookmark' : 'Saved Search'}
              </div>
            </div>
          )}

          <DialogFooter className="flex-col sm:flex-row gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={cancelDelete}
              disabled={isDeleting}
              className="rounded-full"
            >
              Cancel
            </Button>
            <Button
              type="button"
              onClick={deleteBookmark}
              disabled={isDeleting}
              className="bg-red-600 hover:bg-red-700 text-white rounded-full"
            >
              {isDeleting ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                  Deleting...
                </>
              ) : (
                <>
                  <Trash2 className="w-4 h-4 mr-2" />
                  Delete
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
