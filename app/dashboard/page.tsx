"use client"

import { useState, useEffect, useCallback } from "react"
import { Navbar } from "@/components/navbar"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Bell, Plane, MapPin, Calendar, Bookmark, Search, Trash2, AlertTriangle, Loader2 } from "lucide-react"
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
  const [seatMapData, setSeatMapData] = useState<Record<string, unknown> | null>(null)
  const [seatMapLoading, setSeatMapLoading] = useState(false)
  const [seatMapError, setSeatMapError] = useState<string | null>(null)
  const [showSeatMapModal, setShowSeatMapModal] = useState(false)
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

    console.log('handleViewSeatMap called with bookmark:', {
      bookmarkId: bookmark.bookmarkId,
      bookmarkIdType: typeof bookmark.bookmarkId,
      bookmarkTitle: bookmark.title,
      bookmarkKeys: Object.keys(bookmark),
      fullBookmark: bookmark
    });

    if (!bookmark.bookmarkId) {
      setSeatMapError('Invalid bookmark: missing bookmark ID')
      console.error('Bookmark missing bookmarkId:', bookmark)
      return
    }

    setLoadingBookmarkId(bookmark.bookmarkId)
    setSeatMapLoading(true)
    setSeatMapError(null)
    
    try {
      const url = `/api/flight-search/bookmark/${bookmark.bookmarkId}`
      console.log('Making API call to:', url)
      
      const response = await fetch(url, {
        method: 'GET',
        credentials: 'include',
      })
      
      let result;
      try {
        result = await response.json()
      } catch (jsonError) {
        console.error('Failed to parse JSON response:', jsonError)
        setSeatMapError(`Failed to parse response (${response.status}): ${response.statusText}`)
        return
      }
      
      console.log('Flight-search bookmark API response:', {
        status: response.status,
        statusText: response.statusText,
        success: result?.success,
        hasData: !!result?.data,
        dataKeys: result?.data ? Object.keys(result.data) : 'no data',
        fullResult: result,
        resultType: typeof result,
        isEmptyObject: Object.keys(result || {}).length === 0
      })
      
      if (result?.success) {
        setSeatMapData(result.data)
        setShowSeatMapModal(true)
        console.log('Opening seat map modal with data:', result.data)
      } else {
        const errorMsg = result?.message || `API call failed (${response.status}): ${response.statusText}`
        setSeatMapError(errorMsg)
        console.error('API call failed:', {
          status: response.status,
          statusText: response.statusText,
          result: result,
          isEmpty: Object.keys(result || {}).length === 0
        })
      }
    } catch (error) {
      console.error('Failed to fetch seat map:', error)
      setSeatMapError('Failed to load seat map')
    } finally {
      setSeatMapLoading(false)
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
                        {/* {bookmark.itemType === 'BOOKMARK' && bookmark.flightOfferData && (
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
                        )} */}
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

        {/* Seat Map Modal */}
        <Dialog open={showSeatMapModal} onOpenChange={setShowSeatMapModal}>
          <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Plane className="w-5 h-5 text-blue-600" />
                Flight Seat Map
              </DialogTitle>
              <DialogDescription>
                View seat availability and layout for your bookmarked flight.
              </DialogDescription>
            </DialogHeader>
            
            {seatMapLoading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="w-8 h-8 animate-spin text-gray-400 mr-3" />
                <span>Loading seat map...</span>
              </div>
            ) : seatMapError ? (
              <div className="space-y-4">
                <div className="flex items-center justify-center py-8">
                  <div className="text-center">
                    <AlertTriangle className="w-12 h-12 text-red-400 mx-auto mb-4" />
                    <h3 className="text-lg font-semibold text-red-600 mb-2">Error Loading Seat Map</h3>
                    <p className="text-gray-600 mb-4">{seatMapError}</p>
                  </div>
                </div>
                
                {/* Troubleshooting section */}
                <Card className="p-4 bg-red-50 border border-red-200">
                  <div className="text-sm">
                    <div className="font-semibold text-red-700 mb-2">Troubleshooting:</div>
                    <ul className="text-red-600 space-y-1 text-xs">
                      <li>• Check if the backend API endpoint `/flight-search/bookmark/[id]` exists</li>
                      <li>• Verify authentication tokens are valid</li>
                      <li>• Check if the bookmark ID format is correct</li>
                      <li>• Look at browser network tab for detailed error response</li>
                    </ul>
                  </div>
                </Card>
              </div>
            ) : seatMapData ? (
              <div className="space-y-4">
                {/* Success Indicator (HIDDEN) */}
                {/* <Card className="p-4 bg-green-50 border border-green-200">
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                    <span className="text-sm font-semibold text-green-700">
                      Seat map data received successfully!
                    </span>
                  </div>
                </Card> */}

                {/* Debug Data - Show prominently to see what we got (HIDDEN) */}
                {/* <Card className="p-4 bg-blue-50 border border-blue-200">
                  <div className="mb-2">
                    <div className="flex items-center gap-2 mb-2">
                      <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                      <span className="text-sm font-semibold text-blue-700">
                        Raw API Response Structure
                      </span>
                    </div>
                    <div className="text-xs text-blue-600 mb-2">
                      Response keys: {Object.keys(seatMapData).join(', ')}
                    </div>
                    <pre className="text-xs text-gray-600 overflow-x-auto bg-white rounded border p-3 max-h-60 overflow-y-auto whitespace-pre-wrap">
                      {JSON.stringify(seatMapData, null, 2)}
                    </pre>
                  </div>
                </Card> */}

                {/* Flight Info - Try to extract from any possible structure */}
                {(seatMapData.flightInfo || seatMapData.data?.flightInfo || seatMapData.flight) && (
                  <Card className="p-4">
                    <div className="flex flex-wrap items-center gap-4 text-sm">
                      <div className="flex items-center gap-2">
                        <Plane className="w-4 h-4 text-gray-400" />
                        <span className="font-semibold">
                          {seatMapData.flightInfo?.flightNumber || 
                           seatMapData.data?.flightInfo?.flightNumber || 
                           seatMapData.flight?.flightNumber || 'Flight data'}
                        </span>
                      </div>
                    </div>
                  </Card>
                )}
                
                {/* Try to render seat map from various possible locations */}
                {(() => {
                  const seatMapSources = [
                    seatMapData.seatMap,
                    seatMapData.data?.seatMap, 
                    seatMapData.seatmap,
                    seatMapData.data?.seatmap,
                    seatMapData
                  ].filter(Boolean);
                  
                  const seatMapSource = seatMapSources[0];
                  
                  if (seatMapSource) {
                    try {
                      return (
                        <div>
                          {/* <Card className="p-4 bg-green-50 border border-green-200 mb-4">
                            <div className="text-sm text-green-700">
                              Found seat map data! Attempting to render...
                            </div>
                          </Card> */}
                          <SeatmapRenderer seatmapData={seatMapSource} />
                        </div>
                      );
                    } catch (error) {
                      return (
                        <Card className="p-4 bg-yellow-50 border border-yellow-200">
                          <div className="text-sm text-yellow-700">
                            Found seat map data but failed to render: {error instanceof Error ? error.message : 'Unknown error'}
                          </div>
                        </Card>
                      );
                    }
                  } else {
                    return (
                      <Card className="p-4 bg-yellow-50 border border-yellow-200">
                        <div className="text-sm text-yellow-700">
                          No seat map data found in expected locations. Check the raw response above to see the actual structure.
                        </div>
                      </Card>
                    );
                  }
                })()}
              </div>
            ) : (
              <div className="text-center py-8">
                <p className="text-gray-500">No seat map data available</p>
              </div>
            )}
          </DialogContent>
        </Dialog>

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
