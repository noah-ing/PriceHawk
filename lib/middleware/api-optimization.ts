import { NextResponse, NextRequest } from 'next/server';
import { getToken } from 'next-auth/jwt';

/**
 * API optimization middleware that adds:
 * - Security headers
 * - Standard response formatting
 * - Performance logging
 * 
 * Note: Next.js 15+ already includes response compression by default
 */
export async function apiOptimizationMiddleware(
  req: NextRequest,
  handler: (req: NextRequest) => Promise<NextResponse>
): Promise<NextResponse> {
  const startTime = Date.now();
  const requestId = crypto.randomUUID();
  
  // Add request ID to response headers for debugging
  const headers = new Headers();
  headers.set('x-request-id', requestId);
  
  try {
    // Add security headers
    headers.set('X-Content-Type-Options', 'nosniff');
    headers.set('X-Frame-Options', 'DENY');
    headers.set('X-XSS-Protection', '1; mode=block');
    headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
    
    // Process the request
    const response = await handler(req);
    
    // Copy headers from original response
    for (const [key, value] of response.headers.entries()) {
      headers.set(key, value);
    }
    
    // Add performance metrics
    const duration = Date.now() - startTime;
    headers.set('x-response-time', `${duration}ms`);
    
    // Create a new response with our headers
    const optimizedResponse = new NextResponse(response.body, {
      status: response.status,
      statusText: response.statusText,
      headers
    });
    
    return optimizedResponse;
  } catch (error: any) {
    console.error(`[API Error] [${requestId}]:`, error);
    
    // Create a standardized error response
    const errorResponse = new NextResponse(
      JSON.stringify({
        error: error.name || 'InternalServerError',
        message: process.env.NODE_ENV === 'production' 
          ? 'An unexpected error occurred' 
          : error.message || 'Unknown error',
        requestId
      }),
      {
        status: error.status || 500,
        headers: {
          'Content-Type': 'application/json',
          ...Object.fromEntries(headers.entries())
        }
      }
    );
    
    // Log detailed error information for server logs
    const duration = Date.now() - startTime;
    console.error(`[API Error] [${requestId}] ${req.method} ${req.url} ${errorResponse.status} - ${duration}ms`);
    
    return errorResponse;
  }
}

/**
 * Helper factory to wrap API route handlers with optimization middleware
 */
export function withApiOptimization(handler: (req: NextRequest) => Promise<NextResponse>) {
  return async (req: NextRequest) => {
    return apiOptimizationMiddleware(req, handler);
  };
}
