/**
 * Next.js API Route for All Tiers Information
 * Fetches all tier data from MySeatMap backend API
 */

import { NextRequest, NextResponse } from 'next/server'
import config from '@/lib/config'

/**
 * GET /api/tiers
 * Get all available tiers information
 */
export async function GET(_request: NextRequest) {
  try {
    console.log('Fetching all tiers information')

    // Make request to backend API (publicly accessible endpoint)
    const response = await fetch(`${config.apiBaseUrl}/tiers`, {
      method: 'GET',
      headers: {
        'X-API-Key': config.apiKey,
        'Content-Type': 'application/json',
      },
    })

    const data = await response.json()

    console.log('Backend tiers response:', {
      status: response.status,
      success: data.success,
      hasData: !!data.data,
      responseKeys: Object.keys(data),
    })

    if (!response.ok) {
      console.error('Backend tiers error:', {
        status: response.status,
        statusText: response.statusText,
        data,
      })
      
      return NextResponse.json(
        {
          success: false,
          message: data.message || 'Failed to fetch tiers',
          data: null,
        },
        { status: response.status }
      )
    }

    // Return tiers data
    return NextResponse.json({
      success: true,
      message: data.message || 'Tiers fetched successfully',
      data: data.data || data,
    })

  } catch (error) {
    console.error('Tiers API error:', error)
    
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
      message: 'Method not allowed. Use GET to fetch tiers information.',
      data: null,
    },
    { status: 405 }
  )
}