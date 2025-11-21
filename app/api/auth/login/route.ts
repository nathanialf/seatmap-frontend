/**
 * Next.js API Route for User Login
 * Handles authentication with MySeatMap backend API using server-side cookies
 */

import { NextRequest, NextResponse } from 'next/server'
import config from '@/lib/config'

// These interfaces are for documentation - the actual response comes from backend

/**
 * POST /api/auth/login
 * Authenticate user with email and password
 */
export async function POST(request: NextRequest) {
  try {
    // Parse request body
    const body = await request.json();
    
    // Validate required fields
    if (!body.email || !body.password) {
      return NextResponse.json(
        {
          success: false,
          message: 'Email and password are required',
          data: null,
        },
        { status: 400 }
      );
    }

    console.log('Login request for email:', body.email);

    // Make request to backend API
    const response = await fetch(`${config.apiBaseUrl}/auth/login`, {
      method: 'POST',
      headers: {
        'X-API-Key': config.apiKey,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email: body.email,
        password: body.password,
      }),
    });

    const data = await response.json();

    console.log('Backend login response:', {
      status: response.status,
      success: data.success,
      message: data.message,
      hasToken: !!data.token,
    });

    if (!response.ok) {
      console.error('Backend login error:', {
        status: response.status,
        statusText: response.statusText,
        data,
      });
      
      return NextResponse.json(
        {
          success: false,
          message: data.message || 'Login failed',
          data: null,
        },
        { status: response.status }
      );
    }

    // Login successful, set auth cookies
    const expiresAt = Date.now() + (data.expiresIn * 1000) - 60000; // 1 minute buffer
    const maxAge = data.expiresIn - 60; // seconds

    const apiResponse = NextResponse.json({
      success: true,
      message: data.message || 'Login successful',
      data: {
        email: data.email,
        firstName: data.firstName,
        lastName: data.lastName,
        userId: data.userId,
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
    
    apiResponse.cookies.set('myseatmap_auth_provider', 'EMAIL', {
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

    console.log('Login successful, cookies set for user:', data.email);

    return apiResponse;

  } catch (error) {
    console.error('Login API error:', error);
    
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
      message: 'Method not allowed. Use POST to login.',
      data: null,
    },
    { status: 405 }
  );
}