/**
 * Next.js API Route for Individual Bookmark Operations
 * Handles DELETE operations for specific bookmarks
 */

import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import config from '@/lib/config'

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
  throw new Error('Valid user authentication token required for bookmark operations');
}

/**
 * DELETE /api/bookmarks/[bookmarkId]
 * Delete a specific bookmark
 */
export async function DELETE(
  request: NextRequest,
  context: { params: Promise<{ bookmarkId: string }> }
) {
  try {
    const params = await context.params;
    const { bookmarkId } = params;
    
    console.log('DELETE bookmark - bookmarkId:', bookmarkId);

    if (!bookmarkId) {
      return NextResponse.json(
        {
          success: false,
          message: 'Bookmark ID is required',
          data: null,
        },
        { status: 400 }
      );
    }

    // Get auth token (user tokens only)
    const authToken = await getAuthToken();

    console.log('Bookmark deletion request details:', {
      bookmarkId,
      endpoint: `${config.apiBaseUrl}/bookmarks/${bookmarkId}`
    });

    // Make request to backend API
    const response = await fetch(`${config.apiBaseUrl}/bookmarks/${bookmarkId}`, {
      method: 'DELETE',
      headers: {
        'X-API-Key': config.apiKey,
        'Authorization': `Bearer ${authToken}`,
        'Content-Type': 'application/json',
      },
    });

    const data = await response.json();

    console.log('Backend bookmark deletion response debug:', {
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
      message: 'Bookmark deleted successfully',
    };
    
    console.log('API route returning to frontend:', {
      hasData: !!responseData.data,
      status: response.status
    });
    
    return NextResponse.json(responseData, { status: 200 });

  } catch (error) {
    console.error('Bookmark deletion API error:', error);
    
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
export async function GET() {
  return NextResponse.json(
    {
      success: false,
      message: 'Method not allowed. Use DELETE to delete this bookmark.',
      data: null,
    },
    { status: 405 }
  );
}

export async function POST() {
  return NextResponse.json(
    {
      success: false,
      message: 'Method not allowed. Use DELETE to delete this bookmark.',
      data: null,
    },
    { status: 405 }
  );
}

export async function PUT() {
  return NextResponse.json(
    {
      success: false,
      message: 'Method not allowed. Use DELETE to delete this bookmark.',
      data: null,
    },
    { status: 405 }
  );
}

export async function PATCH() {
  return NextResponse.json(
    {
      success: false,
      message: 'Method not allowed. Use DELETE to delete this bookmark.',
      data: null,
    },
    { status: 405 }
  );
}