/**
 * CSRF Token API Route
 * 
 * This endpoint generates and returns CSRF tokens for use in forms.
 * The token is stored in both a cookie and the token cache, allowing
 * the CSRF protection middleware to validate it on subsequent requests.
 */

import { NextRequest, NextResponse } from 'next/server';
import { generateToken, setTokenCookie } from '@/lib/middleware/csrf-protection';
import { withErrorHandling } from '@/lib/middleware/api-error-handler';
import { ErrorService } from '@/lib/services/error-service';

/**
 * GET handler for generating and returning a CSRF token
 * This endpoint is used by the CsrfToken component to get tokens for forms
 */
export const GET = withErrorHandling(
  async (request: NextRequest): Promise<NextResponse> => {
    try {
      // Generate a new token
      const token = generateToken();
      
      // Create the response
      const response = NextResponse.json({
        success: true,
        token,
        expires: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
      });
      
      // Set the token cookie on the response
      setTokenCookie(response, token);
      
      return response;
    } catch (error) {
      console.error('Error generating CSRF token:', error);
      
      // Return a standardized error response
      return NextResponse.json(
        {
          success: false,
          error: {
            message: 'Failed to generate CSRF token',
            code: 'CSRF_TOKEN_GENERATION_FAILED',
          },
        },
        { status: 500 }
      );
    }
  },
  { 
    endpointType: 'default', // Use standard rate limiting
    requiresAuth: false // No auth required to get a CSRF token 
  }
);
