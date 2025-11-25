/**
 * Next.js API Route for User Profile
 * Fetches user profile data from MySeatMap backend API using server-side cookies
 */

import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { createConfig } from '@/lib/config-runtime'

/**
 * GET /api/profile
 * Get current user's profile information
 */
export async function GET(_request: NextRequest) {
  try {
    // Create config from environment variables
    const config = createConfig();
    
    const cookieStore = await cookies()
    const tokenCookie = cookieStore.get('myseatmap_jwt_token')
    const expiryCookie = cookieStore.get('myseatmap_token_expires')
    const providerCookie = cookieStore.get('myseatmap_auth_provider')
    const userIdCookie = cookieStore.get('myseatmap_user_id')
    
    const now = Date.now()
    const expiresAt = expiryCookie ? parseInt(expiryCookie.value) : 0
    const authProvider = providerCookie?.value
    
    // Check if user is authenticated
    if (!tokenCookie || expiresAt <= now) {
      return NextResponse.json(
        {
          success: false,
          message: 'Not authenticated',
          data: null,
        },
        { status: 401 }
      )
    }

    // Check if user is a registered user (not guest)
    if (authProvider !== 'EMAIL') {
      return NextResponse.json(
        {
          success: false,
          message: 'Profile not available for guest users',
          data: null,
        },
        { status: 403 }
      )
    }

    console.log('Fetching profile for user:', userIdCookie?.value)

    // Make request to backend API
    const response = await fetch(`${config.apiBaseUrl}/auth/profile`, {
      method: 'GET',
      headers: {
        'X-API-Key': config.apiKey,
        'Authorization': `Bearer ${tokenCookie.value}`,
        'Content-Type': 'application/json',
      },
    })

    const data = await response.json()

    console.log('Backend profile response:', {
      status: response.status,
      success: data.success,
      hasData: !!data.data,
      responseKeys: Object.keys(data),
      fullResponse: JSON.stringify(data, null, 2)
    })

    if (!response.ok) {
      console.error('Backend profile error:', {
        status: response.status,
        statusText: response.statusText,
        data,
      })
      
      return NextResponse.json(
        {
          success: false,
          message: data.message || 'Failed to fetch profile',
          data: null,
        },
        { status: response.status }
      )
    }

    // Return profile data
    // Handle different possible response structures from backend
    let profileData = null;
    
    if (data.data) {
      // Standard structure: { success: true, data: {...} }
      profileData = data.data;
    } else if (data.userId || data.email || data.firstName) {
      // Profile data is directly in the response
      profileData = { ...data };
      delete profileData.success;
      delete profileData.message;
    } else {
      // Backend returned success but no profile data
      console.warn('Backend returned success but no profile data:', data);
    }

    return NextResponse.json({
      success: true,
      message: data.message || 'Profile fetched successfully',
      data: profileData,
    })

  } catch (error) {
    console.error('Profile API error:', error)
    
    return NextResponse.json(
      {
        success: false,
        message: error instanceof Error ? error.message : 'Internal server error',
        data: null,
      },
      { status: 500 }
    )
  }
}

/**
 * Handle unsupported methods
 */
export async function POST() {
  return NextResponse.json(
    {
      success: false,
      message: 'Method not allowed. Use GET to fetch profile.',
      data: null,
    },
    { status: 405 }
  )
}