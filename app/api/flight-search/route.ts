/**
 * Next.js API Route for Flight Search
 * Proxies requests to MySeatMap backend API with server-side authentication
 */

import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import config from '@/lib/config'
import { prepareFlightSearchPayload, type FlightSearchParams } from '@/lib/api-helpers'

// API Response types
interface ApiResponse<T = unknown> {
  success: boolean;
  message?: string;
  data: T;
  meta?: {
    errorCode?: string;
    timestamp?: string;
  };
}

interface GuestTokenResponse {
  success: true;
  token: string;
  userId: string;
  authProvider: 'GUEST';
  expiresIn: number;
  guestLimits: {
    maxFlights: number;
    flightsViewed: number;
  };
}

/**
 * Get a valid auth token (user or guest) from cookies, or create fresh guest token
 */
async function getAuthToken(): Promise<string | { token: string; cookieData: Record<string, unknown> }> {
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
  
  // If expired user token, this should redirect to login (handled by frontend)
  if (authProvider === 'USER') {
    throw new Error('User token expired. Please log in again.');
  }

  // Get new guest token
  try {
    const response = await fetch(`${config.apiBaseUrl}/auth/guest`, {
      method: 'POST',
      headers: {
        'X-API-Key': config.apiKey,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error(`Failed to get guest token: ${response.status}`);
    }

    const data: ApiResponse<GuestTokenResponse> = await response.json();
    
    console.log('Guest token response debug:', {
      success: data.success,
      message: data.message,
      hasToken: !!(data as Record<string, unknown>).token,
      expiresIn: (data as Record<string, unknown>).expiresIn
    });
    
    // The backend returns the token directly in the response, not nested under 'data'
    // Check if we have a token, regardless of seat map view warnings
    const responseData = data as Record<string, unknown>; // Backend returns flat structure, not nested under 'data'
    
    if (responseData.token && responseData.expiresIn) {
      console.log('Accepting guest token for flight search (ignoring seat map view limitations)');
      
      // Store token info for cookie setting later
      const expiresAt = Date.now() + (responseData.expiresIn * 1000) - 60000; // 1 minute buffer
      
      // Return token and cookie data for setting in the main response
      return {
        token: responseData.token,
        cookieData: {
          token: responseData.token,
          expiresAt,
          provider: 'GUEST',
          userId: responseData.userId || '',
          maxAge: responseData.expiresIn - 60
        }
      };
    } else {
      console.error('No token found in response:', data);
      throw new Error(data.message || 'Failed to get guest token - no token in response');
    }
  } catch (error) {
    console.error('Guest token error:', error);
    throw error;
  }
}

/**
 * POST /api/flight-search
 * Search for flights using the MySeatMap backend API
 */
export async function POST(request: NextRequest) {
  try {
    // Parse request body
    const body: FlightSearchParams = await request.json();
    
    // Validate required fields
    if (!body.origin || !body.destination || !body.date) {
      return NextResponse.json(
        {
          success: false,
          message: 'Missing required fields: origin, destination, and date are required',
          data: null,
        },
        { status: 400 }
      );
    }

    // Get auth token (user or guest) for authentication (always required)
    const authResult = await getAuthToken();
    
    let authToken: string;
    let newCookieData: Record<string, unknown> | null = null;
    
    if (typeof authResult === 'string') {
      // Existing token from cookies
      authToken = authResult;
    } else {
      // New token with cookie data to set
      authToken = authResult.token;
      newCookieData = authResult.cookieData;
    }

    // Prepare API payload
    const apiPayload = prepareFlightSearchPayload(body);

    console.log('Flight search request details:', {
      originalParams: body,
      apiPayload,
      endpoint: `${config.apiBaseUrl}/flight-search`
    });

    // Make request to backend API using correct endpoint
    const response = await fetch(`${config.apiBaseUrl}/flight-search`, {
      method: 'POST',
      headers: {
        'X-API-Key': config.apiKey,
        'Authorization': `Bearer ${authToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(apiPayload),
    });

    const data = await response.json();

    // Set cookies for new token regardless of API response (so token persists for retries)
    let apiResponse: NextResponse;
    
    if (newCookieData) {
      console.log('Setting new auth cookies for', newCookieData.provider, 'token (before response handling)');
      
      // Create base response
      const responseData = response.ok ? {
        success: true,
        data: data,
        message: 'Flights retrieved successfully',
      } : {
        success: false,
        message: data.message || `Backend API error: ${response.status}`,
        data: null,
      };
      
      apiResponse = NextResponse.json(responseData, { 
        status: response.status 
      });
      
      // Set new auth cookies
      apiResponse.cookies.set('myseatmap_jwt_token', newCookieData.token as string, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: newCookieData.maxAge as number
      });
      
      apiResponse.cookies.set('myseatmap_token_expires', newCookieData.expiresAt.toString(), {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax', 
        maxAge: newCookieData.maxAge as number
      });
      
      apiResponse.cookies.set('myseatmap_auth_provider', newCookieData.provider as string, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: newCookieData.maxAge as number
      });
      
      apiResponse.cookies.set('myseatmap_user_id', newCookieData.userId as string, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: newCookieData.maxAge as number
      });
    }

    console.log('Backend response debug:', {
      status: response.status,
      hasData: !!data,
      dataKeys: Object.keys(data || {}),
      dataType: Array.isArray(data?.data) ? 'array' : typeof data?.data,
      dataLength: Array.isArray(data?.data) ? data.data.length : 'not array',
      sampleData: data?.data?.[0] ? Object.keys(data.data[0]) : 'no sample'
    });

    if (!response.ok) {
      console.error('Backend API error:', {
        status: response.status,
        statusText: response.statusText,
        data,
      });
    }

    // Handle response - either return the response with cookies set above, or create new one
    if (newCookieData) {
      // Cookies already set above
      console.log('API route returning to frontend (with new cookies):', {
        hasData: !!data,
        dataStructure: Object.keys(data || {}),
        flightCount: response.ok ? data?.data?.length || 'no data.data' : 'error response',
        status: response.status
      });
      
      return apiResponse!; // TypeScript assertion since we know it's set when newCookieData exists
    } else {
      // No new cookies to set, return simple response
      const responseData = response.ok ? {
        success: true,
        data: data,
        message: 'Flights retrieved successfully',
      } : {
        success: false,
        message: data.message || `Backend API error: ${response.status}`,
        data: null,
      };
      
      console.log('API route returning to frontend (existing cookies):', {
        hasData: !!responseData.data,
        dataStructure: Object.keys(responseData.data || {}),
        flightCount: responseData.data?.data?.length || 'no data.data',
        status: response.status
      });
      
      return NextResponse.json(responseData, { status: response.status });
    }

  } catch (error) {
    console.error('Flight search API error:', error);
    
    return NextResponse.json(
      {
        success: false,
        message: error instanceof Error ? error.message : 'Internal server error',
        data: null,
      },
      { status: 500 }
    );
  }
}

/**
 * Handle unsupported methods
 */
export async function GET() {
  return NextResponse.json(
    {
      success: false,
      message: 'Method not allowed. Use POST to search for flights.',
      data: null,
    },
    { status: 405 }
  );
}