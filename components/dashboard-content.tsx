"use client"

import React, { useState, useCallback } from "react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Bell, Plane, MapPin, Calendar, Bookmark, Search } from "lucide-react"
import Link from "next/link"
import { useAuth } from "@/hooks/useAuth"
import { DashboardClient } from "@/components/dashboard-client"
import { NotificationsList } from "@/components/notifications-list"
import { SeatMapModal } from "@/components/seat-map-modal"
import { type BookmarksData } from "@/components/bookmarks-list"

export function DashboardContent() {
  const [showPreview, setShowPreview] = useState(false)
  const [bookmarksData, setBookmarksData] = useState<BookmarksData | null>(null)
  const [selectedBookmarkForSeatMap, setSelectedBookmarkForSeatMap] = useState(null)
  const { isAuthenticated, isUser, isGuest, isLoading } = useAuth()

  const handleBookmarksDataChange = useCallback((data: BookmarksData | null) => {
    setBookmarksData(data)
  }, [])

  const handleSeatMapOpen = useCallback((bookmark: unknown) => {
    setSelectedBookmarkForSeatMap(bookmark)
  }, [])

  const handleSeatMapClose = useCallback(() => {
    setSelectedBookmarkForSeatMap(null)
  }, [])

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

  // Mock stats for preview mode
  const previewStats = [
    { label: "Active Alerts", value: "2", icon: Bell },
    { label: "Flights Tracked", value: "5", icon: Plane },
    { label: "Seats Monitored", value: "12", icon: MapPin },
    { label: "Alerts This Month", value: "24", icon: Calendar },
  ]

  // Real stats for authenticated users - calculated from bookmarks data
  const realStats = [
    { 
      label: "Active Alerts", 
      value: bookmarksData?.bookmarks?.filter(b => b.hasAlert || b.alertConfig).length.toString() || "0", 
      icon: Bell 
    },
    { 
      label: "Bookmarks", 
      value: bookmarksData?.total?.toString() || "0", 
      icon: Bookmark 
    },
    { 
      label: "Flights Saved", 
      value: bookmarksData?.bookmarks?.filter(b => b.itemType === 'BOOKMARK').length.toString() || "0", 
      icon: Plane 
    },
    { 
      label: "Saved Searches", 
      value: bookmarksData?.bookmarks?.filter(b => b.itemType === 'SAVED_SEARCH').length.toString() || "0", 
      icon: Search 
    },
  ]

  const isRealDashboard = isAuthenticated && !showPreview
  const stats = isRealDashboard ? realStats : previewStats

  if (isLoading) {
    return (
      <div className="max-w-7xl mx-auto px-6 py-16">
        <div className="flex items-center justify-center">
          <div className="text-gray-600">Loading...</div>
        </div>
      </div>
    )
  }

  // If seat map is open, show it fullscreen
  if (selectedBookmarkForSeatMap) {
    return (
      <SeatMapModal
        selectedBookmark={selectedBookmarkForSeatMap}
        onClose={handleSeatMapClose}
      />
    )
  }

  return (
    <div className="max-w-7xl mx-auto px-6 py-16">
      {/* Header */}
      <div className="text-center mb-16">
        <h1 className="text-5xl font-bold text-gray-900 mb-4 text-balance">
          Dashboard
          {!isRealDashboard && (
            <span className="ml-3 text-sm bg-gray-100 text-gray-600 px-3 py-1 rounded-full font-normal">
              Preview Mode
            </span>
          )}
        </h1>
        <p className="text-lg text-gray-600 max-w-2xl mx-auto text-pretty">
          {isRealDashboard
            ? `Welcome back! Here's what's happening with your alerts.`
            : isUser
            ? "This is a preview of your dashboard. Real data will appear here when you have active alerts."
            : isGuest
            ? "This is a preview dashboard. Sign up for a full account to create alerts and track flights."
            : "This is a preview of what your dashboard will look like with active flight alerts."
          }
        </p>
        {!isRealDashboard && (
          <div className="flex gap-3 justify-center mt-6">
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
                <p className={`font-bold ${stat.label === 'Active Alerts' ? 'text-3xl text-teal-600' : stat.value === 'COMING SOON' ? 'text-lg text-teal-600' : 'text-3xl'}`}>{stat.value}</p>
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
            {!isRealDashboard ? (
              /* Preview mode - show mock alerts */
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
            ) : (
              /* Real dashboard - show BookmarksList client component */
              <DashboardClient 
                onBookmarksDataChange={handleBookmarksDataChange}
                onSeatMapOpen={handleSeatMapOpen}
              />
            )}
          </div>
        </div>

        {/* Recent Notifications */}
        <div className="lg:col-span-1">
          <h2 className="text-2xl font-bold mb-6">Recent Notifications</h2>
          
          {isRealDashboard ? (
            <NotificationsList bookmarksData={bookmarksData?.bookmarks || null} isRealDashboard={isRealDashboard} />
          ) : (
            <Card className="p-6">
              <div className="text-center py-8">
                <div className="w-12 h-12 bg-gray-100 rounded-lg flex items-center justify-center mx-auto mb-4">
                  <Bell className="w-6 h-6 text-gray-400" />
                </div>
                <h3 className="font-semibold mb-2 text-gray-700">No Notifications Yet</h3>
                <p className="text-sm text-gray-500">
                  Create alerts to start receiving notifications about seat availability
                </p>
              </div>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}