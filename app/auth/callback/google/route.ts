/**
 * Google OAuth Redirect Handler for NextAuth v5
 * 
 * This file handles the redirect for Google OAuth. NextAuth v5 uses a different callback path
 * than v4, but we maintain compatibility with existing Google OAuth configurations by
 * redirecting from the v5 expected path to our actual implementation.
 */

import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  console.log('[Auth] Google callback redirect handler called');
  
  // Get the search params from the current URL
  const searchParams = request.nextUrl.searchParams.toString();
  
  // Create the redirect URL - redirect to our actual NextAuth.js handler
  const redirectUrl = `/api/auth/callback/google?${searchParams}`;
  
  console.log(`[Auth] Redirecting Google callback to: ${redirectUrl}`);
  
  // Return a redirect response
  return NextResponse.redirect(new URL(redirectUrl, request.url));
}
