/**
 * Next.js API Route for User Registration
 * Handles user registration with MySeatMap backend API
 */

import { NextRequest, NextResponse } from 'next/server'
import { createConfig } from '@/lib/config-runtime'

/**
 * POST /api/auth/register
 * Register a new user with email verification
 */
export async function POST(request: NextRequest) {
  try {
    // Create config from environment variables
    const config = createConfig();
    
    // Parse request body
    const body = await request.json();
    
    // Validate required fields
    if (!body.email || !body.password || !body.firstName || !body.lastName) {
      return NextResponse.json(
        {
          success: false,
          message: 'Email, password, first name, and last name are required',
          data: null,
        },
        { status: 400 }
      );
    }

    console.log('Registration request for email:', body.email);

    // Make request to backend API
    const response = await fetch(`${config.apiBaseUrl}/auth/register`, {
      method: 'POST',
      headers: {
        'X-API-Key': config.apiKey,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email: body.email,
        password: body.password,
        firstName: body.firstName,
        lastName: body.lastName,
      }),
    });

    const data = await response.json();

    console.log('Backend registration response:', {
      status: response.status,
      success: data.success,
      message: data.message,
    });

    if (!response.ok) {
      console.error('Backend registration error:', {
        status: response.status,
        statusText: response.statusText,
        data,
      });
      
      return NextResponse.json(
        {
          success: false,
          message: data.message || 'Registration failed',
          data: null,
        },
        { status: response.status }
      );
    }

    // Registration successful - return success response
    return NextResponse.json({
      success: true,
      message: data.message || 'Registration successful. Please check your email to verify your account.',
      data: {
        email: data.email,
        firstName: data.firstName,
        lastName: data.lastName,
        pending: data.pending,
        newUser: data.newUser,
      },
    });

  } catch (error) {
    console.error('Registration API error:', error);
    
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
      message: 'Method not allowed. Use POST to register.',
      data: null,
    },
    { status: 405 }
  );
}