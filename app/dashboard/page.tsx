"use client"

import { useState, useEffect, useCallback } from "react"
import { Navbar } from "@/components/navbar"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Bell, Plane, MapPin, Calendar, Plus, Lock, Eye, Bookmark, Search, Trash2, AlertTriangle } from "lucide-react"
import Link from "next/link"
import { useRouter } from 'next/navigation'
import { useAuth } from "@/hooks/useAuth"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"

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

// Types for bookmark data
interface BookmarkItem {
  bookmarkId: string;
  userId: string;
  itemType: 'BOOKMARK' | 'SAVED_SEARCH';
  title: string;
  flightOfferData?: string;
  searchRequest?: string | {
    origin: string;
    destination: string;
    departureDate: string;
    travelClass?: string;
    flightNumber?: string;
  };
  createdAt: string;
  expiresAt: string;
}

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
  const router = useRouter()
  const { isAuthenticated, isUser, isGuest, isLoading } = useAuth()

  // Function to run a saved search
  const handleRunSearch = useCallback((bookmark: BookmarkItem) => {
    if (bookmark.itemType !== 'SAVED_SEARCH' || !bookmark.searchRequest) {
      return
    }

    // Parse searchRequest if it's a string (from API)
    let searchRequest
    try {
      searchRequest = typeof bookmark.searchRequest === 'string' 
        ? JSON.parse(bookmark.searchRequest) 
        : bookmark.searchRequest
    } catch (error) {
      console.error('Failed to parse searchRequest:', error)
      return
    }

    // Map saved search fields to search page URL parameters
    const searchParams = new URLSearchParams()
    
    // Required fields - ensure they exist and are not empty
    const origin = searchRequest.origin?.trim()
    const destination = searchRequest.destination?.trim() 
    const departureDate = searchRequest.departureDate?.trim()
    
    if (!origin || !destination || !departureDate) {
      console.error('Missing required search fields:', { origin, destination, departureDate })
      return
    }
    
    searchParams.set('from', origin)
    searchParams.set('to', destination)
    searchParams.set('date', departureDate)

    // Optional fields
    if (searchRequest.travelClass?.trim()) {
      searchParams.set('seatClass', searchRequest.travelClass.trim())
    }
    
    // Handle flight number - could be airline code (UA) or full flight number (UA1679)
    if (searchRequest.flightNumber?.trim()) {
      const flightNumber = searchRequest.flightNumber.trim()
      
      // Check if it's a full flight number (letters followed by numbers)
      const fullFlightMatch = flightNumber.match(/^([A-Z]{1,3})(\d+)$/)
      
      if (fullFlightMatch) {
        // It's a full flight number like "UA1679" - split into airline and flight
        const [, airline, flight] = fullFlightMatch
        searchParams.set('airline', airline)
        searchParams.set('flight', flight)
      } else {
        // It's just an airline code like "UA" - set as airline only
        searchParams.set('airline', flightNumber.toUpperCase())
      }
    }

    // Navigate to search page with parameters using Next.js router
    router.push(`/search?${searchParams.toString()}`)
  }, [router])

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
    { label: "Active Alerts", value: "0", icon: Bell },
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

  // Show different content based on authentication state
  const shouldShowDashboard = isAuthenticated || showPreview
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

      {!shouldShowDashboard ? (
        <div className="max-w-7xl mx-auto px-6 py-16">
          <Card className="max-w-2xl mx-auto p-12 text-center">
            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <Lock className="w-8 h-8 text-gray-600" />
            </div>
            <h2 className="text-3xl font-bold mb-4">Sign in to view your dashboard</h2>
            <p className="text-gray-600 mb-8 text-lg">
              Create an account or sign in to track flights, set up alerts, and monitor seat availability in real-time.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link href="/auth/signup">
                <Button className="bg-black text-white hover:bg-gray-800 rounded-full px-8 py-3 w-full sm:w-auto cursor-pointer">
                  Create Account
                </Button>
              </Link>
              <Link href="/auth/signin">
                <Button variant="outline" className="rounded-full px-8 py-3 bg-transparent w-full sm:w-auto">
                  Sign In
                </Button>
              </Link>
            </div>
            <div className="mt-6 pt-6 border-t border-gray-200">
              <Button
                variant="outline"
                className="rounded-full px-6 py-2 bg-transparent text-sm cursor-pointer"
                onClick={() => setShowPreview(true)}
              >
                <Eye className="w-4 h-4 mr-2" />
                Preview Dashboard
              </Button>
            </div>
            <p className="text-sm text-gray-500 mt-6">
              Already have an account?{" "}
              <Link href="/auth/signin" className="text-black font-medium hover:underline">
                Sign in here
              </Link>
            </p>
          </Card>
        </div>
      ) : (
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
            {isRealDashboard ? (
              <Link href="/search">
                <Button className="bg-black text-white hover:bg-gray-800 rounded-full px-6 mt-4 md:mt-0 cursor-pointer">
                  <Plus className="w-4 h-4 mr-2" />
                  New Alert
                </Button>
              </Link>
            ) : (
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
                    <p className="text-3xl font-bold">{stat.value}</p>
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
                          if (bookmark.itemType === 'SAVED_SEARCH' && bookmark.searchRequest) {
                            const searchRequest = typeof bookmark.searchRequest === 'string' 
                              ? JSON.parse(bookmark.searchRequest) 
                              : bookmark.searchRequest
                            return new Date(searchRequest.departureDate || searchRequest.date)
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
                    <Card key={bookmark.bookmarkId} className="p-6">
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
                                  <div className="flex items-center gap-2 text-sm text-gray-500">
                                    <Plane className="w-4 h-4" />
                                    <span>Flight {flightInfo.flightNumber}</span>
                                  </div>
                                </>
                              ) : (
                                <div className="text-gray-600 mb-2">Flight details</div>
                              )
                            })()
                          ) : bookmark.itemType === 'SAVED_SEARCH' && bookmark.searchRequest ? (
                            // Display search request data
                            (() => {
                              try {
                                // Parse searchRequest if it's a string
                                const searchRequest = typeof bookmark.searchRequest === 'string' 
                                  ? JSON.parse(bookmark.searchRequest) 
                                  : bookmark.searchRequest
                                
                                return (
                                  <>
                                    <div className="text-gray-600 mb-2">
                                      {searchRequest.origin} → {searchRequest.destination} • {searchRequest.departureDate}
                                    </div>
                                    <div className="flex items-center gap-2 text-sm text-gray-500">
                                      <Search className="w-4 h-4" />
                                      <span>
                                        {searchRequest.travelClass ? formatTravelClassForDisplay(searchRequest.travelClass as string) : 'Any class'}
                                        {searchRequest.flightNumber && ` • ${searchRequest.flightNumber}`}
                                      </span>
                                    </div>
                                  </>
                                )
                              } catch {
                                return (
                                  <div className="text-gray-500 text-sm">
                                    Search details unavailable
                                  </div>
                                )
                              }
                            })()
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
                                variant="outline" 
                                className="rounded-full bg-transparent text-sm"
                                onClick={() => handleRunSearch(bookmark)}
                              >
                                Run Search
                              </Button>
                            ) : (
                              <Button variant="outline" className="rounded-full bg-transparent text-sm">
                                View Seats
                              </Button>
                            )}
                            <Button 
                              variant="outline" 
                              className="rounded-full bg-transparent text-sm text-red-600 hover:text-red-700"
                              onClick={() => handleDeleteClick(bookmark)}
                            >
                              <Trash2 className="w-4 h-4 mr-1" />
                              Remove
                            </Button>
                          </div>
                        </div>
                      </div>
                    </Card>
                  ))
                ) : (
                  /* Real authenticated user empty state */
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
                    <h3 className="font-semibold mb-2 text-gray-700">No notifications yet</h3>
                    <p className="text-sm text-gray-500">You&apos;ll see notifications here when you create alerts</p>
                  </div>
                )}
              </Card>

              {/* Quick Actions - Commented out, may be removed completely */}
              {/* 
              <Card className="p-6 mt-6">
                <h3 className="font-semibold mb-4">Quick Actions</h3>
                <div className="space-y-2">
                  <Link href="/search">
                    <Button variant="outline" className="w-full justify-start rounded-full bg-transparent cursor-pointer">
                      <Plus className="w-4 h-4 mr-2" />
                      Create New Alert
                    </Button>
                  </Link>
                  <Link href="/search">
                    <Button variant="outline" className="w-full justify-start rounded-full bg-transparent cursor-pointer">
                      <Plane className="w-4 h-4 mr-2" />
                      Search Flights
                    </Button>
                  </Link>
                  <Link href="/pricing">
                    <Button variant="outline" className="w-full justify-start rounded-full bg-transparent cursor-pointer">
                      <TrendingDown className="w-4 h-4 mr-2" />
                      View Pricing
                    </Button>
                  </Link>
                </div>
              </Card>
              */}
            </div>
          </div>
        </div>
      )}

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
  )
}
