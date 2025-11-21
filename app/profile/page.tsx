"use client"

import React, { useState, useEffect } from "react"
import { useRouter } from 'next/navigation'
import { Navbar } from "@/components/navbar"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { User, Mail, Shield, Calendar, AlertCircle, Loader2, LogOut, Settings, Trash2 } from 'lucide-react'

interface ProfileData {
  email: string
  firstName: string
  lastName: string
  profilePicture?: string
}

interface ApiResponse<T> {
  success: boolean
  message?: string
  data: T
}

export default function ProfilePage() {
  const router = useRouter()
  const [profile, setProfile] = useState<ProfileData | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false)
  const [isUser, setIsUser] = useState<boolean>(false)

  // Check authentication status
  useEffect(() => {
    const checkAuthStatus = async () => {
      try {
        const response = await fetch('/api/auth/status')
        const data = await response.json()
        
        if (data.success) {
          setIsAuthenticated(data.data.isAuthenticated)
          setIsUser(data.data.isUser)
          
          if (!data.data.isAuthenticated) {
            router.push('/')
            return
          }
          
          if (!data.data.isUser) {
            setError('Profile is not available for guest users. Please register or login to access your profile.')
            setIsLoading(false)
            return
          }
          
          // User is authenticated and is a registered user, fetch profile
          await fetchProfile()
        } else {
          router.push('/')
        }
      } catch (err) {
        console.error('Auth status check error:', err)
        router.push('/')
      }
    }

    checkAuthStatus()
  }, [router])

  const fetchProfile = async () => {
    try {
      setIsLoading(true)
      setError(null)

      const response = await fetch('/api/profile')
      const data: ApiResponse<ProfileData> = await response.json()

      if (!response.ok) {
        throw new Error(data.message || `HTTP ${response.status}: ${response.statusText}`)
      }

      console.log('Profile API response:', data)
      console.log('Response keys:', Object.keys(data))
      console.log('data.success:', data.success)
      console.log('data.data:', data.data)
      console.log('data.message:', data.message)
      
      if (data.success) {
        if (data.data) {
          // Standard nested structure: { success: true, data: {...} }
          setProfile(data.data)
        } else if (data.userId || data.email || data.firstName) {
          // Profile data might be directly in the response
          const profileData = { ...data }
          delete profileData.success
          delete profileData.message
          setProfile(profileData)
        } else {
          // Backend returned success but no profile fields - log everything for debugging
          console.warn('Profile API returned success but no profile data.')
          console.warn('Full response:', JSON.stringify(data, null, 2))
          console.warn('Available keys:', Object.keys(data))
          
          // Backend endpoint exists and responds but returns no profile data
          // This indicates a backend issue - the endpoint should return profile data
          throw new Error('Backend returned success but no profile data. This indicates a backend configuration issue.')
        }
      } else {
        throw new Error(data.message || 'Failed to fetch profile')
      }
    } catch (err) {
      console.error('Profile fetch error:', err)
      setError(err instanceof Error ? err.message : 'Failed to load profile')
    } finally {
      setIsLoading(false)
    }
  }

  const handleLogout = async () => {
    try {
      const response = await fetch('/api/auth/logout', {
        method: 'POST',
      })
      
      if (response.ok) {
        router.push('/')
      } else {
        console.error('Logout failed')
      }
    } catch (error) {
      console.error('Logout error:', error)
    }
  }

  if (!isAuthenticated && isLoading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navbar />
        <div className="flex flex-col items-center justify-center py-12">
          <Loader2 className="w-8 h-8 animate-spin text-gray-400 mb-4" />
          <p className="text-gray-600">Checking authentication...</p>
        </div>
      </div>
    )
  }

  if (!isUser && !isLoading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navbar />
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="bg-amber-50 border border-amber-200 rounded-lg p-6">
            <div className="flex items-center gap-3">
              <Shield className="w-6 h-6 text-amber-600 flex-shrink-0" />
              <div>
                <h3 className="font-semibold text-amber-800">Guest User</h3>
                <p className="text-amber-700 mt-1">{error || 'Profile is not available for guest users. Please register or login to access your profile.'}</p>
                <Button 
                  onClick={() => router.push('/')}
                  className="mt-3 bg-amber-600 hover:bg-amber-700 text-white rounded-full"
                >
                  Go to Homepage
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">My Profile</h1>
              <p className="text-gray-600">Manage your account information and preferences</p>
            </div>
            <div className="flex gap-3">
              <Button
                onClick={handleLogout}
                variant="outline"
                className="rounded-full border-red-300 text-red-700 hover:bg-red-50"
              >
                <LogOut className="w-4 h-4 mr-2" />
                Logout
              </Button>
            </div>
          </div>
        </div>

        {/* Loading State */}
        {isLoading && (
          <div className="flex flex-col items-center justify-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-gray-400 mb-4" />
            <p className="text-gray-600">Loading your profile...</p>
          </div>
        )}

        {/* Error State */}
        {error && !isLoading && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-6">
            <div className="flex items-center gap-3">
              <AlertCircle className="w-6 h-6 text-red-600 flex-shrink-0" />
              <div>
                <h3 className="font-semibold text-red-800">Profile Loading Failed</h3>
                <p className="text-red-700 mt-1">{error}</p>
                <Button 
                  onClick={fetchProfile}
                  variant="outline" 
                  className="mt-3 rounded-full border-red-300 text-red-700 hover:bg-red-100"
                >
                  Try Again
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* Profile Content */}
        {profile && !isLoading && !error && (
          <div className="space-y-6">
            {/* Personal Information Card */}
            <Card className="p-6">
              <div className="flex items-center gap-4 mb-6">
                <div className="w-12 h-12 bg-teal-100 rounded-full flex items-center justify-center">
                  <User className="w-6 h-6 text-teal-600" />
                </div>
                <div>
                  <h2 className="text-xl font-semibold text-gray-900">Personal Information</h2>
                  <p className="text-gray-600">Your basic account details</p>
                </div>
              </div>

              <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      First Name
                    </label>
                    <div className="p-3 bg-gray-50 rounded-lg border">
                      <p className="text-gray-900">{profile.firstName}</p>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Last Name
                    </label>
                    <div className="p-3 bg-gray-50 rounded-lg border">
                      <p className="text-gray-900">{profile.lastName}</p>
                    </div>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Email Address
                  </label>
                  <div className="p-3 bg-gray-50 rounded-lg border flex items-center gap-2">
                    <Mail className="w-4 h-4 text-gray-400" />
                    <p className="text-gray-900">{profile.email}</p>
                  </div>
                </div>
              </div>
            </Card>

            {/* Account Actions Card */}
            <Card className="p-6">
              <div className="flex items-center gap-4 mb-6">
                <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center">
                  <Settings className="w-6 h-6 text-gray-600" />
                </div>
                <div>
                  <h2 className="text-xl font-semibold text-gray-900">Account Settings</h2>
                  <p className="text-gray-600">Manage your preferences and account options</p>
                </div>
              </div>

              <div className="space-y-6">
                <p className="text-sm text-gray-500">
                  Additional account management features will be available in future updates.
                  For now, you can logout or return to the main application.
                </p>
                
                <div className="flex gap-3">
                  <Button
                    onClick={() => router.push('/')}
                    className="bg-teal-600 hover:bg-teal-700 text-white rounded-full"
                  >
                    Back to Home
                  </Button>
                  <Button
                    onClick={() => router.push('/search')}
                    variant="outline"
                    className="rounded-full"
                  >
                    Search Flights
                  </Button>
                </div>

                <div className="pt-4 border-t border-gray-200">
                  <h3 className="text-lg font-medium text-gray-900 mb-4">Danger Zone</h3>
                  <p className="text-sm text-gray-600 mb-4">
                    Once you delete your account, there is no going back. Please be certain.
                  </p>
                  <Button
                    variant="outline"
                    className="rounded-full border-red-300 text-red-700 hover:bg-red-50 hover:border-red-400"
                    onClick={() => {
                      // TODO: Implement delete account functionality
                      console.log('Delete account clicked - functionality to be implemented')
                    }}
                  >
                    <Trash2 className="w-4 h-4 mr-2" />
                    Delete Account
                  </Button>
                </div>
              </div>
            </Card>
          </div>
        )}
      </div>
    </div>
  )
}