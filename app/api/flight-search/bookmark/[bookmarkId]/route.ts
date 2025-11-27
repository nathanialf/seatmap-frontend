/**
 * Next.js API Route for Flight Search Bookmark
 * Proxies requests to MySeatMap backend API for retrieving seat map data from saved flight bookmarks
 */

import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'

// API Response types - removed unused interface

/**
 * Get a valid auth token from cookies (user authentication required for bookmarks)
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
  if (authProvider === 'GUEST') {
    throw new Error('Bookmark access requires user authentication. Please log in.');
  }
  
  // If expired user token, this should redirect to login (handled by frontend)
  if (authProvider === 'USER') {
    throw new Error('User token expired. Please log in again.');
  }

  throw new Error('No valid authentication token found. Please log in to access bookmarks.');
}

/**
 * GET /api/flight-search/bookmark/[bookmarkId]
 * Retrieve seat map data for a saved flight bookmark
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ bookmarkId: string }> }
) {
  const resolvedParams = await params;
  console.log('=== FLIGHT-SEARCH BOOKMARK API START ===');
  console.log('Request URL:', request.url);
  console.log('Raw params object:', resolvedParams);
  console.log('Bookmark ID:', resolvedParams?.bookmarkId);
  console.log('Bookmark ID type:', typeof resolvedParams?.bookmarkId);
  console.log('Params keys:', Object.keys(resolvedParams || {}));
  console.log('Request headers:', Object.fromEntries(request.headers.entries()));

  try {
    // Create config object directly from environment variables
    const apiBaseUrl = process.env.API_BASE_URL;
    const apiKey = process.env.API_KEY;
    
    if (!apiBaseUrl) {
      throw new Error('Missing required environment variable: API_BASE_URL');
    }
    if (!apiKey) {
      throw new Error('Missing required environment variable: API_KEY');
    }
    
    const config = {
      apiBaseUrl,
      apiKey,
    };
    
    console.log('Config created successfully:', {
      apiBaseUrl: config.apiBaseUrl,
    });

    // Get auth token (user authentication required for bookmarks)
    console.log('Getting auth token...');
    const authToken = await getAuthToken();

    console.log('Flight search bookmark request details:', {
      bookmarkId: resolvedParams.bookmarkId,
      endpoint: `${config.apiBaseUrl}/flight-search/bookmark/${resolvedParams.bookmarkId}`
    });

    // Make request to backend API
    const response = await fetch(`${config.apiBaseUrl}/flight-search/bookmark/${resolvedParams.bookmarkId}`, {
      method: 'GET',
      headers: {
        'X-API-Key': config.apiKey,
        'Authorization': `Bearer ${authToken}`,
        'Content-Type': 'application/json',
      },
    });

    const data = await response.json();

    console.log('Backend response debug:', {
      status: response.status,
      hasData: !!data,
      dataKeys: Object.keys(data || {}),
      dataType: typeof data?.data,
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
          message: data?.message || `Backend API error: ${response.status} ${response.statusText}`,
          data: null,
          meta: {
            backendStatus: response.status,
            backendStatusText: response.statusText,
            backendResponse: data
          }
        },
        { status: response.ok ? 200 : 500 } // Always return 200 to frontend with error details
      );
    }

    // Return successful response
    console.log('API route returning to frontend:', {
      hasData: !!data,
      dataStructure: Object.keys(data || {}),
      status: response.status
    });
    
    return NextResponse.json({
      success: true,
      data: data,
      message: 'Flight seat map data retrieved successfully',
    });

  } catch (error) {
    console.error('=== FLIGHT-SEARCH BOOKMARK API ERROR ===');
    console.error('Error type:', typeof error);
    console.error('Error constructor:', error?.constructor?.name);
    console.error('Error message:', error instanceof Error ? error.message : 'Unknown error');
    console.error('Error stack:', error instanceof Error ? error.stack : 'No stack');
    console.error('Full error object:', error);
    
    const errorMessage = error instanceof Error ? error.message : 'Internal server error';
    console.error('Returning error response:', errorMessage);
    
    return NextResponse.json(
      {
        success: false,
        message: `API Route Error: ${errorMessage}`,
        data: null,
        meta: {
          errorCode: 'FLIGHT_SEARCH_BOOKMARK_ERROR',
          timestamp: new Date().toISOString(),
          errorType: error?.constructor?.name || 'UnknownError',
          isApiRouteError: true
        }
      },
      { status: 200 } // Return 200 so frontend gets the error details
    );
  }
}

/**
 * Handle unsupported methods
 */
export async function POST() {
  return NextResponse.json(
    {
      success: false,
      message: 'Method not allowed. Use GET to retrieve flight bookmark seat map data.',
      data: null,
    },
    { status: 405 }
  );
}

export async function PUT() {
  return NextResponse.json(
    {
      success: false,
      message: 'Method not allowed. Use GET to retrieve flight bookmark seat map data.',
      data: null,
    },
    { status: 405 }
  );
}

export async function DELETE() {
  return NextResponse.json(
    {
      success: false,
      message: 'Method not allowed. Use GET to retrieve flight bookmark seat map data.',
      data: null,
    },
    { status: 405 }
  );
}