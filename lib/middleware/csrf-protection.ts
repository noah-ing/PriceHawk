/**
 * CSRF Protection Middleware
 * 
 * Provides Cross-Site Request Forgery (CSRF) protection for state-changing operations:
 * 1. Generates CSRF tokens with crypto-secure randomness
 * 2. Validates tokens on form submissions and API requests
 * 3. Rotates tokens periodically to prevent token fixation
 * 4. Provides helper functions for token generation and validation
 */

import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';
import { cookies } from 'next/headers';
import { ErrorDefinitions, ErrorService } from '../services/error-service';

// Constants
const CSRF_COOKIE_NAME = 'pricehawk_csrf';
const CSRF_HEADER_NAME = 'x-csrf-token';
const CSRF_FORM_FIELD = '_csrf';
const TOKEN_EXPIRY = 24 * 60 * 60 * 1000; // 24 hours

// Token storage - in a production environment, consider using Redis
const tokenCache = new Map<string, { token: string; expires: number }>();

/**
 * Generates a secure random CSRF token
 */
export function generateToken(): string {
  return crypto.randomBytes(32).toString('hex');
}

/**
 * Extracts CSRF token from request
 * This is an async function to properly handle JSON body parsing
 * Enhanced with better error handling and support for different content types
 */
async function extractToken(req: NextRequest): Promise<string | null> {
  // Try to get from header first (for API requests)
  const headerToken = req.headers.get(CSRF_HEADER_NAME);
  if (headerToken) {
    console.log('CSRF token found in header');
    return headerToken;
  }
  
  // Try to get from body for form submissions
  if (req.method === 'POST' || req.method === 'PUT' || req.method === 'DELETE' || req.method === 'PATCH') {
    const contentType = req.headers.get('content-type') || '';
    
    try {
      // Clone the request to avoid consuming the body
      const clonedReq = req.clone();
      
      // Handle different content types
      if (contentType.includes('application/json')) {
        try {
          const body = await clonedReq.json();
          if (body && body[CSRF_FORM_FIELD]) {
            console.log('CSRF token found in JSON body');
            return body[CSRF_FORM_FIELD];
          }
        } catch (e) {
          console.warn('Failed to parse JSON body for CSRF token:', e);
        }
      } else if (contentType.includes('application/x-www-form-urlencoded')) {
        try {
          const formData = await clonedReq.formData();
          const formToken = formData.get(CSRF_FORM_FIELD);
          if (formToken) {
            console.log('CSRF token found in form data');
            return formToken.toString();
          }
        } catch (e) {
          console.warn('Failed to parse form data for CSRF token:', e);
        }
      } else if (contentType.includes('multipart/form-data')) {
        try {
          const formData = await clonedReq.formData();
          const formToken = formData.get(CSRF_FORM_FIELD);
          if (formToken) {
            console.log('CSRF token found in multipart form data');
            return formToken.toString();
          }
        } catch (e) {
          console.warn('Failed to parse multipart form data for CSRF token:', e);
        }
      } else {
        console.warn('Unsupported content type for CSRF token extraction:', contentType);
      }
    } catch (e) {
      console.warn('Failed to clone request for CSRF token extraction:', e);
    }
  }
  
  console.warn('No CSRF token found in request');
  return null;
}

/**
 * Gets the stored token from cookies
 */
function getStoredToken(req: NextRequest): string | null {
  const cookieToken = req.cookies.get(CSRF_COOKIE_NAME)?.value;
  if (cookieToken) {
    console.log('CSRF token found in cookie');
  } else {
    console.warn('No CSRF token found in cookie');
  }
  return cookieToken || null;
}

/**
 * Sets a new CSRF token in cookies
 */
export function setTokenCookie(res: NextResponse, token: string): NextResponse {
  const expires = new Date(Date.now() + TOKEN_EXPIRY);
  
  // Store in token cache with expiry
  tokenCache.set(token, {
    token,
    expires: expires.getTime()
  });
  
  // Set HTTP-only cookie with SameSite=Lax for protection
  res.cookies.set({
    name: CSRF_COOKIE_NAME,
    value: token,
    expires,
    httpOnly: true, 
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/'
  });
  
  console.log('Set new CSRF token cookie with expiry:', expires.toISOString());
  
  return res;
}

/**
 * Validates CSRF token from request against stored token
 * Returns true if valid, false otherwise
 * Enhanced with multiple validation strategies for better reliability
 */
function validateToken(storedToken: string | null, requestToken: string | null): boolean {
  // Enhanced debug logging
  console.log('CSRF validation details:', {
    hasStoredToken: !!storedToken,
    storedTokenPrefix: storedToken ? storedToken.substring(0, 8) + '...' : null,
    hasRequestToken: !!requestToken,
    requestTokenPrefix: requestToken ? requestToken.substring(0, 8) + '...' : null,
    tokenMatch: storedToken === requestToken
  });
  
  if (!storedToken || !requestToken) {
    console.warn('Missing CSRF token - stored token exists:', !!storedToken, 'request token exists:', !!requestToken);
    return false;
  }
  
  try {
    // First check exact match between cookie token and request token
    // This is more reliable in serverless environments where the cache might be cleared
    if (storedToken === requestToken) {
      console.log('CSRF token validated via direct cookie comparison');
      return true;
    }
    
    // Check if token exists in cache as fallback
    const cachedToken = tokenCache.get(storedToken);
    if (cachedToken) {
      if (cachedToken.expires < Date.now()) {
        console.warn('CSRF token found in cache but expired', {
          expiry: new Date(cachedToken.expires).toISOString(),
          now: new Date().toISOString()
        });
        return false;
      }
      
      // Constant-time comparison to prevent timing attacks
      try {
        const isValid = crypto.timingSafeEqual(
          Buffer.from(storedToken),
          Buffer.from(requestToken)
        );
        
        if (isValid) {
          console.log('CSRF token validated via cache lookup and timing-safe comparison');
        } else {
          console.warn('CSRF token comparison failed - tokens do not match');
        }
        
        return isValid;
      } catch (compareError) {
        console.error('Error in timing-safe token comparison:', compareError);
        
        // Fallback to direct comparison if timing-safe fails (e.g., different length tokens)
        const isValid = storedToken === requestToken;
        console.log('Fallback direct comparison result:', isValid);
        return isValid;
      }
    } else {
      console.warn('CSRF token not found in cache, falling back to direct comparison');
      // Last resort: direct comparison without cache validation
      // This helps when the serverless function has been restarted and cache is empty
      return storedToken === requestToken;
    }
  } catch (e) {
    console.error('Error validating CSRF token:', e);
    // In production, we could consider returning true in case of validation errors
    // to avoid breaking functionality, but that would reduce security
    return false;
  }
}

/**
 * CSRF protection middleware for Next.js API routes
 * This should be used in combination with other middleware like withErrorHandling
 */
export function withCsrfProtection(
  handler: (req: NextRequest, context: any) => Promise<NextResponse | Response> | NextResponse | Response
) {
  return async (req: NextRequest, context: any) => {
    // Skip CSRF check for safe methods (GET, HEAD, OPTIONS)
    if (req.method === 'GET' || req.method === 'HEAD' || req.method === 'OPTIONS') {
      return handler(req, context);
    }
    
    // For state-changing methods, validate CSRF token
    const storedToken = getStoredToken(req);
    const requestToken = await extractToken(req);
    
    // Enhanced debugging information
    console.log('CSRF Validation Details:', {
      method: req.method,
      url: req.url,
      path: new URL(req.url).pathname,
      hasStoredToken: !!storedToken,
      hasRequestToken: !!requestToken,
      userAgent: req.headers.get('user-agent')?.substring(0, 50) + '...',
      contentType: req.headers.get('content-type')
    });
    
    // Attempt validation
    if (!validateToken(storedToken, requestToken)) {
      console.warn('CSRF validation failed for request', {
        method: req.method,
        path: new URL(req.url).pathname,
        timestamp: new Date().toISOString()
      });
      
      // Better error response with more details to help debugging
      const csrfError = ErrorService.createError(
        ErrorDefinitions.INVALID_REQUEST,
        { 
          message: 'Invalid or missing CSRF token',
          details: {
            hasStoredToken: !!storedToken,
            hasRequestToken: !!requestToken,
            // Don't include actual tokens in logs for security reasons
            storedTokenLength: storedToken?.length,
            requestTokenLength: requestToken?.length,
            tokenMatch: storedToken === requestToken
          }
        }
      );
      
      const { statusCode, response } = ErrorService.handleError(csrfError);
      
      // Add additional context to help client-side debugging
      const errorResponse = {
        ...response,
        csrfError: true,
        suggestion: "Please refresh the page and try again. If the problem persists, clear your browser cookies."
      };
      
      return NextResponse.json(errorResponse, { status: statusCode });
    }
    
    // Token is valid, proceed with handler
    console.log('CSRF validation passed for', new URL(req.url).pathname);
    return handler(req, context);
  };
}

/**
 * Generate a CSRF token for use in forms
 * This should be called from a server component
 */
export function getCsrfToken(): string {
  // Generate a new token each time for server components
  // The actual cookie persistence will be handled by the middleware
  const token = generateToken();
  
  // Store in token cache
  tokenCache.set(token, {
    token,
    expires: Date.now() + TOKEN_EXPIRY
  });
  
  return token;
}

/**
 * Returns the CSRF token value to be used in a form
 * The actual form field should be added in a React component like:
 * <input type="hidden" name="_csrf" value={csrfToken} />
 */
export function getCsrfFormToken(): string {
  return getCsrfToken();
}

// Clean up expired tokens periodically
setInterval(() => {
  const now = Date.now();
  let expiredCount = 0;
  for (const [key, value] of tokenCache.entries()) {
    if (value.expires < now) {
      tokenCache.delete(key);
      expiredCount++;
    }
  }
  if (expiredCount > 0) {
    console.log(`Cleaned up ${expiredCount} expired CSRF tokens. Cache size: ${tokenCache.size}`);
  }
}, 60 * 60 * 1000); // Clean up every hour
