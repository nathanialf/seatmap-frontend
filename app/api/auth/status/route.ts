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
  console.log('=== AUTH STATUS API START ===');
  console.log('Environment check:', {
    nodeEnv: process.env.NODE_ENV,
    hasApiBaseUrl: !!process.env.API_BASE_URL,
    hasApiKey: !!process.env.API_KEY,
    apiBaseUrlValue: process.env.API_BASE_URL,
  });

  try {
    console.log('Importing config...');
    const { default: config } = await import('@/lib/config').catch(err => {
      console.error('Config import failed in auth status:', err.message || err);
      throw new Error(`Config loading failed: ${err.message}`);
    });
    console.log('Config loaded in auth status:', {
      apiBaseUrl: config.apiBaseUrl,
      environment: config.environment,
    });

    console.log('Reading cookies...');
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

    let userTier = null;

    // If user is authenticated (not guest), fetch their tier from profile
    if (isUser && tokenCookie) {
      try {
        console.log('Fetching profile for tier extraction...');
        const profileResponse = await fetch(`${config.apiBaseUrl}/auth/profile`, {
          method: 'GET',
          headers: {
            'X-API-Key': config.apiKey,
            'Authorization': `Bearer ${tokenCookie.value}`,
            'Content-Type': 'application/json',
          },
        });

        console.log('Profile response status:', profileResponse.status);
        
        if (profileResponse.ok) {
          const profileData = await profileResponse.json();
          console.log('Profile data in auth status:', {
            success: profileData.success,
            hasData: !!profileData.data,
            accountTier: profileData.data?.accountTier,
            fullData: profileData
          });
          
          // Handle both wrapped and unwrapped response structures
          if (profileData.success && profileData.data) {
            // Frontend API structure: { success: true, data: { accountTier: "PRO" } }
            userTier = profileData.data.accountTier || null;
          } else if (profileData.accountTier) {
            // Backend API direct structure: { accountTier: "PRO", userId: "...", ... }
            userTier = profileData.accountTier;
          }
          
          console.log('Extracted userTier:', userTier);
        } else {
          console.error('Profile response not OK in auth status:', profileResponse.status, profileResponse.statusText);
        }
      } catch (error) {
        console.error('Failed to fetch user tier:', error);
        // Don't fail the auth status check if tier fetch fails
      }
    }

    return NextResponse.json({
      success: true,
      data: {
        isAuthenticated,
        isUser,
        isGuest,
        authProvider: authProvider || null,
        userId: userId || null,
        expiresAt: isAuthenticated ? expiresAt : null,
        userTier,
      },
    });

  } catch (error) {
    console.error('=== AUTH STATUS API ERROR ===');
    console.error('Error type:', typeof error);
    console.error('Error constructor:', error?.constructor?.name);
    console.error('Error message:', error instanceof Error ? error.message : 'Unknown error');
    console.error('Error stack:', error instanceof Error ? error.stack : 'No stack');
    console.error('Full error object:', error);
    
    const errorMessage = error instanceof Error ? error.message : 'Failed to check authentication status';
    console.error('Returning auth status error response:', errorMessage);
    
    return NextResponse.json(
      {
        success: false,
        message: errorMessage,
        data: {
          isAuthenticated: false,
          isUser: false,
          isGuest: false,
          authProvider: null,
          userId: null,
          expiresAt: null,
          userTier: null,
        },
        meta: {
          errorCode: 'AUTH_STATUS_ERROR',
          timestamp: new Date().toISOString(),
          errorType: error?.constructor?.name || 'UnknownError'
        }
      },
      { status: 500 }
    );
  }
}