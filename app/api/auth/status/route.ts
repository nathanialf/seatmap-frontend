/**
 * Next.js API Route for Authentication Status
 * Checks if user is authenticated based on server-side cookies
 */

import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'

/**
 * GET /api/auth/status
 * Check current authentication status
 */
export async function GET() {
  try {
    const cookieStore = await cookies();
    const tokenCookie = cookieStore.get('myseatmap_jwt_token');
    const expiryCookie = cookieStore.get('myseatmap_token_expires');
    const providerCookie = cookieStore.get('myseatmap_auth_provider');
    const userIdCookie = cookieStore.get('myseatmap_user_id');
    
    const now = Date.now();
    const expiresAt = expiryCookie ? parseInt(expiryCookie.value) : 0;
    const authProvider = providerCookie?.value;
    const userId = userIdCookie?.value;
    
    // Check if we have a valid token
    const isAuthenticated = !!(tokenCookie && expiresAt > now);
    const isUser = isAuthenticated && authProvider === 'EMAIL';
    const isGuest = isAuthenticated && authProvider === 'GUEST';

    return NextResponse.json({
      success: true,
      data: {
        isAuthenticated,
        isUser,
        isGuest,
        authProvider: authProvider || null,
        userId: userId || null,
        expiresAt: isAuthenticated ? expiresAt : null,
      },
    });

  } catch (error) {
    console.error('Auth status check error:', error);
    
    return NextResponse.json(
      {
        success: false,
        message: 'Failed to check authentication status',
        data: {
          isAuthenticated: false,
          isUser: false,
          isGuest: false,
          authProvider: null,
          userId: null,
          expiresAt: null,
        },
      },
      { status: 500 }
    );
  }
}