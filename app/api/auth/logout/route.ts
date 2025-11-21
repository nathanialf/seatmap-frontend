/**
 * Next.js API Route for User Logout
 * Clears authentication cookies
 */

import { NextResponse } from 'next/server'

/**
 * POST /api/auth/logout
 * Clear auth cookies to log out user
 */
export async function POST() {
  try {
    const response = NextResponse.json({
      success: true,
      message: 'Logged out successfully',
      data: null,
    });

    // Clear all auth cookies by setting them to expire immediately
    const cookieOptions = {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax' as const,
      expires: new Date(0), // Set to past date to delete
    };

    response.cookies.set('myseatmap_jwt_token', '', cookieOptions);
    response.cookies.set('myseatmap_token_expires', '', cookieOptions);
    response.cookies.set('myseatmap_auth_provider', '', cookieOptions);
    response.cookies.set('myseatmap_user_id', '', cookieOptions);

    return response;

  } catch (error) {
    console.error('Logout API error:', error);
    
    return NextResponse.json(
      {
        success: false,
        message: 'Logout failed',
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
      message: 'Method not allowed. Use POST to logout.',
      data: null,
    },
    { status: 405 }
  );
}