/**
 * Next.js API Route for Bookmarks
 * Proxies requests to MySeatMap backend API with server-side authentication
 */

import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { createConfig } from '@/lib/config-runtime'

// API Response types are handled by the backend and typed dynamically

/**
 * Get a valid auth token from cookies
 */
async function getAuthToken(): Promise<string> {
  const cookieStore = await cookies();
  const tokenCookie = cookieStore.get('myseatmap_jwt_token');
  const expiryCookie = cookieStore.get('myseatmap_token_expires'); 
  const providerCookie = cookieStore.get('myseatmap_auth_provider');
  
  const now = Date.now();
  const expiresAt = expiryCookie ? parseInt(expiryCookie.value) : 0;
  const authProvider = providerCookie?.value;
  
  console.log('Token cookie check:', {
    hasTokenCookie: !!tokenCookie,
    hasExpiryCookie: !!expiryCookie,
    authProvider,
    currentTime: now,
    cookieExpiresAt: expiresAt,
    isValid: tokenCookie && expiresAt > now,
    timeUntilExpiry: expiresAt > now ? expiresAt - now : 'expired'
  });
  
  // Check if we have a valid cached token in cookies
  if (tokenCookie && expiresAt > now) {
    console.log(`Using cached ${authProvider || 'unknown'} token from cookies`);
    return tokenCookie.value;
  }
  
  // Bookmarks require user authentication, not guest tokens
  throw new Error('Valid user authentication token required for bookmarks access');
}

/**
 * GET /api/bookmarks
 * Retrieve user's bookmarks and saved searches
 */
export async function GET(request: NextRequest) {
  try {
    // Create config from environment variables
    const config = createConfig();
    
    const { searchParams } = new URL(request.url);
    const type = searchParams.get('type'); // Optional filter: BOOKMARK or SAVED_SEARCH

    // Get auth token (user tokens only, no guest tokens for bookmarks)
    const authToken = await getAuthToken();

    // Build query parameters for backend API
    const queryParams = new URLSearchParams();
    if (type) {
      queryParams.set('type', type);
    }
    
    const apiUrl = `${config.apiBaseUrl}/bookmarks${queryParams.toString() ? `?${queryParams}` : ''}`;
    
    console.log('Bookmarks request details:', {
      type,
      endpoint: apiUrl
    });

    // Make request to backend API
    const response = await fetch(apiUrl, {
      method: 'GET',
      headers: {
        'X-API-Key': config.apiKey,
        'Authorization': `Bearer ${authToken}`,
        'Content-Type': 'application/json',
      },
    });

    const data = await response.json();

    console.log('Backend bookmarks response debug:', {
      status: response.status,
      hasData: !!data,
      dataKeys: Object.keys(data || {}),
      dataType: typeof data?.data,
      total: data?.data?.total
    });

    if (!response.ok) {
      console.error('Backend API error:', {
        status: response.status,
        statusText: response.statusText,
        data,
      });
      
      return NextResponse.json(
        {
          success: false,
          message: data.message || `Backend API error: ${response.status}`,
          data: null,
        },
        { status: response.status }
      );
    }

    // Success response
    const responseData = {
      success: true,
      data: data.data || data,
      message: 'Bookmarks retrieved successfully',
    };
    
    console.log('API route returning to frontend:', {
      hasData: !!responseData.data,
      dataStructure: Object.keys(responseData.data || {}),
      bookmarkCount: responseData.data?.total || 'no total field',
      status: response.status
    });
    
    return NextResponse.json(responseData, { status: 200 });

  } catch (error) {
    console.error('Bookmarks API error:', error);
    
    return NextResponse.json(
      {
        success: false,
        message: error instanceof Error ? error.message : 'Internal server error',
        data: null,
      },
      { status: error instanceof Error && error.message.includes('authentication') ? 401 : 500 }
    );
  }
}

/**
 * POST /api/bookmarks
 * Create a new bookmark or saved search
 */
export async function POST(request: NextRequest) {
  try {
    // Create config from environment variables
    const config = createConfig();
    
    // Parse request body
    const body = await request.json();
    
    // Validate required fields
    if (!body.itemType) {
      return NextResponse.json(
        {
          success: false,
          message: 'Item type is required',
          data: null,
        },
        { status: 400 }
      );
    }

    if (!body.title) {
      return NextResponse.json(
        {
          success: false,
          message: 'Title is required',
          data: null,
        },
        { status: 400 }
      );
    }

    // Get auth token (user tokens only)
    const authToken = await getAuthToken();

    console.log('Bookmark creation request details:', {
      itemType: body.itemType,
      title: body.title,
      hasFlightOfferData: !!body.flightOfferData,
      hasSearchRequest: !!body.searchRequest,
      endpoint: `${config.apiBaseUrl}/bookmarks`
    });

    // Make request to backend API
    const response = await fetch(`${config.apiBaseUrl}/bookmarks`, {
      method: 'POST',
      headers: {
        'X-API-Key': config.apiKey,
        'Authorization': `Bearer ${authToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    });

    const data = await response.json();

    console.log('Backend bookmark creation response debug:', {
      status: response.status,
      hasData: !!data,
      dataKeys: Object.keys(data || {}),
      success: data.success
    });

    if (!response.ok) {
      console.error('Backend API error:', {
        status: response.status,
        statusText: response.statusText,
        data,
      });
      
      return NextResponse.json(
        {
          success: false,
          message: data.message || `Backend API error: ${response.status}`,
          data: null,
        },
        { status: response.status }
      );
    }

    // Success response
    const responseData = {
      success: true,
      data: data.data || data,
      message: `${body.itemType.toLowerCase().replace('_', ' ')} created successfully`,
    };
    
    console.log('API route returning to frontend:', {
      hasData: !!responseData.data,
      dataStructure: Object.keys(responseData.data || {}),
      status: response.status
    });
    
    return NextResponse.json(responseData, { status: 201 });

  } catch (error) {
    console.error('Bookmark creation API error:', error);
    
    return NextResponse.json(
      {
        success: false,
        message: error instanceof Error ? error.message : 'Internal server error',
        data: null,
      },
      { status: error instanceof Error && error.message.includes('authentication') ? 401 : 500 }
    );
  }
}

/**
 * Handle unsupported methods
 */
export async function PUT() {
  return NextResponse.json(
    {
      success: false,
      message: 'Method not allowed. Use GET to retrieve bookmarks or POST to create bookmarks.',
      data: null,
    },
    { status: 405 }
  );
}

export async function DELETE() {
  return NextResponse.json(
    {
      success: false,
      message: 'Method not allowed. Use DELETE /api/bookmarks/{id} to delete specific bookmarks.',
      data: null,
    },
    { status: 405 }
  );
}

export async function PATCH() {
  return NextResponse.json(
    {
      success: false,
      message: 'Method not allowed. Use GET to retrieve bookmarks or POST to create bookmarks.',
      data: null,
    },
    { status: 405 }
  );
}