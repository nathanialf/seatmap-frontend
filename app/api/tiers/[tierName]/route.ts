/**
 * Next.js API Route for Tier Information
 * Fetches specific tier data from MySeatMap backend API
 */

import { NextRequest, NextResponse } from 'next/server'
import { createConfig } from '@/lib/config-runtime'

/**
 * GET /api/tiers/[tierName]
 * Get specific tier information by tier name
 */
export async function GET(
  _request: NextRequest,
  { params }: { params: { tierName: string } }
) {
  try {
    // Create config from environment variables
    const config = createConfig();
    const { tierName } = params

    if (!tierName) {
      return NextResponse.json(
        {
          success: false,
          message: 'Tier name is required',
          data: null,
        },
        { status: 400 }
      )
    }

    // Make request to backend API (publicly accessible endpoint)
    const response = await fetch(`${config.apiBaseUrl}/tiers/${tierName}?region=US`, {
      method: 'GET',
      headers: {
        'X-API-Key': config.apiKey,
        'Content-Type': 'application/json',
      },
    })

    const data = await response.json()

    if (!response.ok) {
      console.error('Backend tier error:', {
        status: response.status,
        statusText: response.statusText,
        data,
      })
      
      return NextResponse.json(
        {
          success: false,
          message: data.message || `Failed to fetch tier: ${tierName}`,
          data: null,
        },
        { status: response.status }
      )
    }

    // Return tier data
    return NextResponse.json({
      success: true,
      message: data.message || 'Tier fetched successfully',
      data: data.data || data,
    })

  } catch (error) {
    console.error('Tier API error:', error)
    
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
      message: 'Method not allowed. Use GET to fetch tier information.',
      data: null,
    },
    { status: 405 }
  )
}