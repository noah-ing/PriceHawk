'use client';

import React, { useState, useEffect } from 'react';
import { SessionProvider } from 'next-auth/react';

/**
 * SessionErrorBoundary
 * This component wraps the NextAuth SessionProvider to handle API errors gracefully
 * It intercepts fetch calls to auth endpoints and ensures they always return valid JSON
 */
export function SessionErrorBoundary({ children }: { children: React.ReactNode }) {
  // Track if we've installed our fetch interceptor
  const [interceptorInstalled, setInterceptorInstalled] = useState(false);

  useEffect(() => {
    // Only install once
    if (interceptorInstalled) return;
    
    console.log('[Auth] Installing SessionErrorBoundary fetch interceptor');
    
    // Save the original fetch function
    const originalFetch = window.fetch;
    
    // Override fetch to intercept auth API calls
    window.fetch = async (input, init) => {
      // Log all auth requests for debugging
      if (typeof input === 'string' && input.includes('/api/auth/')) {
        console.log(`[Auth] Intercepting fetch to ${input}`);
      }
      
      // Only intercept auth API calls
      if (typeof input === 'string' && (
        input.includes('/api/auth/session') || 
        input.includes('/api/auth/signin') || 
        input.includes('/api/auth/callback')
      )) {
        try {
          // Try the original fetch
          const response = await originalFetch(input, init);
          
          // If response is not OK or not JSON, we need to fix it
          if (!response.ok || !response.headers.get('content-type')?.includes('application/json')) {
            console.warn(`[Auth] Non-JSON response from ${input}, using fallback session`);
            
            // Create a new Response with a valid JSON session
            return new Response(JSON.stringify({
              user: null,
              expires: new Date(Date.now() + 60 * 60 * 1000).toISOString() // 1 hour
            }), {
              status: 200,
              headers: {
                'Content-Type': 'application/json'
              }
            });
          }
          
          return response;
        } catch (error) {
          console.error('[Auth] Fetch interceptor caught error:', error);
          
          // Return a valid session response even when fetch fails
          return new Response(JSON.stringify({
            user: null,
            expires: new Date(Date.now() + 60 * 60 * 1000).toISOString() // 1 hour
          }), {
            status: 200,
            headers: {
              'Content-Type': 'application/json'
            }
          });
        }
      }
      
      // For all other requests, use the original fetch
      return originalFetch(input, init);
    };
    
    setInterceptorInstalled(true);
    
    // Cleanup function to restore original fetch
    return () => {
      window.fetch = originalFetch;
    };
  }, [interceptorInstalled]);
  
  return (
    <SessionProvider>
      {children}
    </SessionProvider>
  );
}
