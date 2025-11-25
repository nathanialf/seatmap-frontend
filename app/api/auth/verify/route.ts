/**
 * Next.js API Route for Email Verification
 * Handles email verification with MySeatMap backend API using server-side cookies
 */

import { NextRequest, NextResponse } from 'next/server'
import { createConfig } from '@/lib/config-runtime'

/**
 * GET /api/auth/verify?token={verification_token}
 * Verify email address using token from verification email
 */
export async function GET(request: NextRequest) {
  try {
    // Create config from environment variables
    const config = createConfig();
    
    // Extract token from query parameters
    const { searchParams } = new URL(request.url);
    const token = searchParams.get('token');
    
    // Validate token parameter
    if (!token) {
      return NextResponse.json(
        {
          success: false,
          message: 'Verification token is required',
          data: null,
        },
        { status: 400 }
      );
    }

    // Make request to backend API
    const response = await fetch(`${config.apiBaseUrl}/auth/verify?token=${encodeURIComponent(token)}`, {
      method: 'GET',
      headers: {
        'X-API-Key': config.apiKey,
      },
    });

    const data = await response.json();

    if (!response.ok) {
      return NextResponse.json(
        {
          success: false,
          message: data.message || 'Email verification failed',
          data: null,
        },
        { status: response.status }
      );
    }

    // Verification successful, set auth cookies (same as login)
    const expiresAt = Date.now() + (data.expiresIn * 1000) - 60000; // 1 minute buffer
    const maxAge = data.expiresIn - 60; // seconds

    const apiResponse = NextResponse.json({
      success: true,
      message: data.message || 'Email verified successfully! Welcome to MySeatMap.',
      data: {
        email: data.email,
        firstName: data.firstName,
        lastName: data.lastName,
        userId: data.userId,
        newUser: true,
      },
    });

    // Set auth cookies (httpOnly for security)
    apiResponse.cookies.set('myseatmap_jwt_token', data.token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: maxAge
    });
    
    apiResponse.cookies.set('myseatmap_token_expires', expiresAt.toString(), {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: maxAge
    });
    
    apiResponse.cookies.set('myseatmap_auth_provider', data.authProvider || 'EMAIL', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: maxAge
    });
    
    apiResponse.cookies.set('myseatmap_user_id', data.userId, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: maxAge
    });

    return apiResponse;

  } catch (error) {
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
export async function POST() {
  return NextResponse.json(
    {
      success: false,
      message: 'Method not allowed. Use GET with token parameter to verify email.',
      data: null,
    },
    { status: 405 }
  );
}