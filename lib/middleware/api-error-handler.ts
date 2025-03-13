/**
 * API Error Handler Middleware
 *
 * Provides standardized error handling for Next.js API routes:
 * - Catches and normalizes all errors
 * - Logs errors with appropriate severity
 * - Returns standardized error responses
 * - Adds performance metrics for monitoring
 * - Implements rate limiting for sensitive endpoints
 */

import { NextRequest, NextResponse } from 'next/server';
import { ErrorService, ErrorDefinitions, ErrorCategory } from '../services/error-service';

// Interface for route handler function
export type ApiRouteHandler = (
  req: NextRequest, 
  context: any
) => Promise<NextResponse | Response> | NextResponse | Response;

// Track request counts for rate limiting
const requestCounts = new Map<string, { count: number; resetTime: number }>();

// Rate limit configuration
const RATE_LIMITS = {
  // Authentication endpoints
  authentication: { limit: 10, windowMs: 60 * 1000 }, // 10 requests per minute
  // Normal API endpoints
  default: { limit: 60, windowMs: 60 * 1000 }, // 60 requests per minute
  // Scraping endpoints
  scraping: { limit: 5, windowMs: 60 * 1000 } // 5 requests per minute
};

/**
 * Gets the client IP address from request
 */
function getClientIp(req: NextRequest): string {
  const forwarded = req.headers.get('x-forwarded-for');
  if (forwarded) {
    // Use the first IP if there are multiple in the header
    return forwarded.split(',')[0].trim();
  }
  return 'unknown-ip';
}

/**
 * Implements rate limiting based on IP address and endpoint type
 */
function checkRateLimit(req: NextRequest, endpointType: keyof typeof RATE_LIMITS = 'default'): boolean {
  const ip = getClientIp(req);
  const key = `${ip}:${endpointType}`;
  const now = Date.now();
  const config = RATE_LIMITS[endpointType];
  
  // Initialize or reset counter if window has passed
  const record = requestCounts.get(key);
  if (!record || record.resetTime < now) {
    requestCounts.set(key, { count: 1, resetTime: now + config.windowMs });
    return true;
  }
  
  // Increment counter and check against limit
  record.count += 1;
  if (record.count > config.limit) {
    return false;
  }
  
  return true;
}

/**
 * Creates a middleware that applies error handling to an API route
 * 
 * @param handler The API route handler function
 * @param options Configuration options for the middleware
 * @returns A wrapped handler function with error handling
 */
export function withErrorHandling(
  handler: ApiRouteHandler,
  options: {
    endpointType?: keyof typeof RATE_LIMITS;
    requiresAuth?: boolean;
  } = {}
) {
  return async (req: NextRequest, context: any) => {
    const startTime = performance.now();
    const requestId = crypto.randomUUID();
    
    try {
      // Apply rate limiting
      const endpointType = options.endpointType || 'default';
      if (!checkRateLimit(req, endpointType)) {
        const { statusCode, response } = ErrorService.handleError(
          ErrorDefinitions.RATE_LIMIT_EXCEEDED
        );
        return NextResponse.json(response, { status: statusCode, headers: {
          'X-Rate-Limit-Limit': RATE_LIMITS[endpointType].limit.toString(),
          'X-Rate-Limit-Window-Ms': RATE_LIMITS[endpointType].windowMs.toString(),
          'X-Request-ID': requestId
        } });
      }
      
      // Add request ID header for tracing
      const response = await handler(req, context);
      const endTime = performance.now();
      
      // Add performance metrics headers
      const headers = new Headers(response.headers);
      headers.set('X-Response-Time', `${(endTime - startTime).toFixed(2)}ms`);
      headers.set('X-Request-ID', requestId);
      
      // Return the response with additional headers
      if (response instanceof NextResponse) {
        // Clone the response with the new headers
        return NextResponse.json(
          await response.json(), 
          { 
            status: response.status, 
            headers: Object.fromEntries(headers.entries())
          }
        );
      }
      
      return response;
    } catch (error) {
      // Log and handle error
      const { statusCode, response } = ErrorService.handleError(error);
      const endTime = performance.now();
      
      // Return standardized error response
      return NextResponse.json(response, { 
        status: statusCode,
        headers: {
          'X-Response-Time': `${(endTime - startTime).toFixed(2)}ms`,
          'X-Request-ID': requestId
        }
      });
    }
  };
}

/**
 * Client-side utility for parsing API responses
 */
export async function parseApiResponse<T>(response: Response): Promise<T> {
  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(
      errorData.error?.message || 'An unexpected error occurred',
      { cause: errorData }
    );
  }
  
  const responseData = await response.json();
  if (responseData.success === false) {
    throw new Error(
      responseData.error?.message || 'An unexpected error occurred',
      { cause: responseData }
    );
  }
  
  return responseData.data;
}
