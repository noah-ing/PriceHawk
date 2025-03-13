import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export async function middleware(request: NextRequest) {
  const isAuthPage = request.nextUrl.pathname.startsWith("/auth");
  const isHomePage = request.nextUrl.pathname === "/";
  const isApiRoute = request.nextUrl.pathname.startsWith("/api");
  const isVerificationPage = request.nextUrl.pathname === "/auth/verification-required" || 
                             request.nextUrl.pathname === "/auth/verify";
  const isPublicRoute = isHomePage || 
                        (isAuthPage && !isVerificationPage) || 
                        isApiRoute || 
                        request.nextUrl.pathname.startsWith("/_next") ||
                        request.nextUrl.pathname.startsWith("/favicon.ico");
  
  // Check for auth cookie instead of using auth() function
  const authCookie = request.cookies.get("next-auth.session-token");
  const isLoggedIn = !!authCookie;
  
  // If the user is not logged in and trying to access a protected route
  if (!isLoggedIn && !isPublicRoute) {
    // Store the original URL to redirect back after login
    const callbackUrl = encodeURIComponent(request.nextUrl.pathname + request.nextUrl.search);
    return NextResponse.redirect(new URL(`/auth/signin?callbackUrl=${callbackUrl}`, request.url));
  }

  // If the user is logged in and trying to access an auth page
  if (isLoggedIn && isAuthPage && !isVerificationPage) {
    return NextResponse.redirect(new URL("/", request.url));
  }
  
  // For now, skip email verification check in middleware
  // We'll handle this in the individual pages with client-side redirects
  // This is because token decoding in Edge middleware is more complex
  
  return NextResponse.next();
}

// Specify which routes this middleware should run on
export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico).*)"],
};
