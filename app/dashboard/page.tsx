"use client"

import { useState } from "react"
import { Navbar } from "@/components/navbar"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Bell, Plane, MapPin, Calendar, TrendingDown, Plus, Lock, Eye } from "lucide-react"
import Link from "next/link"
import { useAuth } from "@/hooks/useAuth"

export default function DashboardPage() {
  const [showPreview, setShowPreview] = useState(false)
  const { isAuthenticated, isUser, isGuest, isLoading } = useAuth()

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
    { label: "Flights Tracked", value: "0", icon: Plane },
    { label: "Seats Monitored", value: "0", icon: MapPin },
    { label: "Alerts This Month", value: "0", icon: Calendar },
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
            {/* Active Alerts */}
            <div className="lg:col-span-2">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold">Active Alerts</h2>
                <Button variant="outline" className="rounded-full bg-transparent text-sm">
                  View All
                </Button>
              </div>

              <div className="space-y-4">
                {/* Show preview alerts or real empty state */}
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
                ) : (
                  /* Real authenticated user empty state */
                  <Card className="p-12 text-center">
                    <Bell className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                    <h3 className="text-lg font-semibold mb-2">No active alerts</h3>
                    <p className="text-gray-600 mb-4">Start tracking flights to get notified about seat availability</p>
                    <Link href="/search">
                      <Button className="bg-black text-white hover:bg-gray-800 rounded-full cursor-pointer">
                        Create Your First Alert
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

                    <Button variant="outline" className="w-full mt-4 rounded-full bg-transparent text-sm">
                      View All Notifications
                    </Button>
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

              {/* Quick Actions */}
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
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
