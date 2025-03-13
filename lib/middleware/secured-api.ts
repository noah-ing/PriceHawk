/**
 * Secured API Middleware
 * 
 * Combines multiple security middleware into a single composable function:
 * 1. CSRF protection for state-changing operations
 * 2. Error handling with standardized responses
 * 3. Rate limiting for abuse prevention
 * 4. Performance metrics for monitoring
 */

import { NextRequest, NextResponse } from 'next/server';
import { withErrorHandling, ApiRouteHandler } from './api-error-handler';
import { withCsrfProtection } from './csrf-protection';

// Rate limit endpoint types from api-error-handler
type EndpointType = 'authentication' | 'default' | 'scraping';

/**
 * Configuration options for secured API routes
 */
interface SecuredApiOptions {
  endpointType?: EndpointType;
  requiresAuth?: boolean;
  csrfProtection?: boolean;
}

/**
 * Creates a middleware that applies multiple security measures to an API route
 * 
 * @param handler The API route handler function
 * @param options Configuration options for the middleware
 * @returns A wrapped handler function with security measures
 */
export function withSecuredApi(
  handler: ApiRouteHandler,
  options: SecuredApiOptions = { 
    csrfProtection: true,
    endpointType: 'default',
    requiresAuth: true 
  }
) {
  // First apply error handling middleware (outermost wrapper)
  let securedHandler = withErrorHandling(handler, {
    endpointType: options.endpointType,
    requiresAuth: options.requiresAuth
  });
  
  // Then apply CSRF protection if needed (for state-changing operations)
  if (options.csrfProtection) {
    securedHandler = withCsrfProtection(securedHandler);
  }
  
  return securedHandler;
}
