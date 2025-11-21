/**
 * Authentication hook for managing user authentication state
 * Uses server-side cookies through API routes
 */

import { useState, useEffect, useCallback } from 'react'

interface AuthState {
  isAuthenticated: boolean
  isUser: boolean
  isGuest: boolean
  authProvider: string | null
  userId: string | null
  expiresAt: number | null
  isLoading: boolean
}

interface AuthContextValue extends AuthState {
  refreshAuth: () => Promise<void>
  signOut: () => Promise<void>
}

export function useAuth(): AuthContextValue {
  const [authState, setAuthState] = useState<AuthState>({
    isAuthenticated: false,
    isUser: false,
    isGuest: false,
    authProvider: null,
    userId: null,
    expiresAt: null,
    isLoading: true,
  })

  // Function to check authentication status
  const refreshAuth = useCallback(async () => {
    try {
      setAuthState(prev => ({ ...prev, isLoading: true }))
      
      const response = await fetch('/api/auth/status', {
        method: 'GET',
        credentials: 'include', // Include cookies
      })
      
      const result = await response.json()
      
      if (result.success && result.data) {
        setAuthState({
          isAuthenticated: result.data.isAuthenticated,
          isUser: result.data.isUser,
          isGuest: result.data.isGuest,
          authProvider: result.data.authProvider,
          userId: result.data.userId,
          expiresAt: result.data.expiresAt,
          isLoading: false,
        })
      } else {
        // Reset to unauthenticated state
        setAuthState({
          isAuthenticated: false,
          isUser: false,
          isGuest: false,
          authProvider: null,
          userId: null,
          expiresAt: null,
          isLoading: false,
        })
      }
    } catch (error) {
      console.error('Failed to check auth status:', error)
      setAuthState({
        isAuthenticated: false,
        isUser: false,
        isGuest: false,
        authProvider: null,
        userId: null,
        expiresAt: null,
        isLoading: false,
      })
    }
  }, [])

  // Function to sign out
  const signOut = useCallback(async () => {
    try {
      const response = await fetch('/api/auth/logout', {
        method: 'POST',
        credentials: 'include',
      })
      
      if (response.ok) {
        // Reset auth state
        setAuthState({
          isAuthenticated: false,
          isUser: false,
          isGuest: false,
          authProvider: null,
          userId: null,
          expiresAt: null,
          isLoading: false,
        })
        
        // Redirect to home page
        window.location.href = '/'
      }
    } catch (error) {
      console.error('Sign out failed:', error)
    }
  }, [])

  // Check auth status on mount
  useEffect(() => {
    let mounted = true
    
    const checkAuth = async () => {
      if (mounted) {
        await refreshAuth()
      }
    }
    
    checkAuth()
    
    return () => {
      mounted = false
    }
  }, [refreshAuth])

  // Auto-refresh when token is close to expiry
  useEffect(() => {
    if (!authState.isAuthenticated || !authState.expiresAt) return

    const timeToExpiry = authState.expiresAt - Date.now()
    const refreshBuffer = 5 * 60 * 1000 // 5 minutes before expiry

    if (timeToExpiry > refreshBuffer) {
      const timeoutId = setTimeout(refreshAuth, timeToExpiry - refreshBuffer)
      return () => clearTimeout(timeoutId)
    }
  }, [authState.expiresAt, authState.isAuthenticated, refreshAuth])

  return {
    ...authState,
    refreshAuth,
    signOut,
  }
}