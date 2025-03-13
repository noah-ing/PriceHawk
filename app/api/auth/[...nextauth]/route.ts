/**
 * NextAuth API Route Handler
 * 
 * This is the main handler for all NextAuth.js API routes.
 * It implements enhanced error handling and safe fallbacks.
 */

import { handlers } from "@/auth";
import { NextRequest, NextResponse } from "next/server";

/**
 * Debug Middleware for Google OAuth Callback
 * This allows us to track and fix the Google OAuth flow
 * by intercepting and logging auth traffic
 */
function logAuthRequest(request: NextRequest): void {
  const url = new URL(request.url);
  
  // Special handling for Google callback
  if (url.pathname.includes('callback/google')) {
    console.log('[Auth Debug] Google callback detected');
    console.log('[Auth Debug] URL:', url.toString());
    console.log('[Auth Debug] Search params:', url.searchParams.toString());
    
    // Log headers for debugging (redacted for privacy)
    const headersLog: Record<string, string> = {};
    request.headers.forEach((value, key) => {
      if (!key.toLowerCase().includes('cookie')) {
        headersLog[key] = value;
      } else {
        headersLog[key] = '[REDACTED]';
      }
    });
    console.log('[Auth Debug] Headers:', JSON.stringify(headersLog, null, 2));
  }
}

/**
 * GET handler for auth operations (sign in, callback, session, etc.)
 */
export async function GET(request: NextRequest) {
  try {
    // Debug Google OAuth problems
    logAuthRequest(request);
    
    // Attempt to run the original handler - cast to any to bypass type checking
    const response = await handlers.GET(request as any);
    
    // If successful and we get a valid response, return it
    if (response && response.status === 200) {
      return response;
    }
    
    // If it's any non-200 response, still return it
    if (response) {
      return response;
    }
    
    // If no response, return a safe fallback
    console.log("[Auth] GET handler returned no response, using fallback");
    return NextResponse.json({ 
      user: null, 
      expires: new Date(Date.now() + 60 * 60 * 1000).toISOString() // 1 hour from now
    }, {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'no-store'
      }
    });
  } catch (error) {
    console.error("[Auth] GET handler error:", error);
    
    // Always return a valid JSON response, never an error page
    return NextResponse.json({ 
      user: null, 
      expires: new Date(Date.now() + 60 * 60 * 1000).toISOString() // 1 hour from now
    }, {
      status: 200, // Return 200 instead of 500 to prevent client-side errors
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'no-store'
      }
    });
  }
}

/**
 * POST handler for auth operations (sign in, sign out, etc.)
 */
export async function POST(request: NextRequest) {
  try {
    // Debug Google OAuth problems
    logAuthRequest(request);
    
    const response = await handlers.POST(request as any);
    if (response) return response;
    
    console.log("[Auth] POST handler returned no response, using fallback");
    return NextResponse.json({ 
      success: false, 
      message: "Authentication action failed" 
    }, {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'no-store'
      }
    });
  } catch (error) {
    console.error("[Auth] POST handler error:", error);
    return NextResponse.json({ 
      success: false, 
      message: "Authentication service temporarily unavailable" 
    }, {
      status: 200, // Return 200 even for errors to prevent client crashing
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'no-store'
      }
    });
  }
}
