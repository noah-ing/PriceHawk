'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import { SessionProvider, useSession } from 'next-auth/react';

// Create a context to provide a safe session fallback
const SafeAuthContext = createContext<{
  safeSession: any;
  isLoading: boolean;
}>({
  safeSession: { user: null },
  isLoading: true
});

// Hook to use the safe session
export const useSafeSession = () => useContext(SafeAuthContext);

/**
 * SafeSessionManager
 * This component listens to the NextAuth session and provides a safe fallback
 * When authentication fails, it prevents the UI from crashing
 */
function SafeSessionManager({ children }: { children: React.ReactNode }) {
  const nextAuthSession = useSession();
  const [safeSession, setSafeSession] = useState<any>({ user: null });
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Install global error handler for fetch errors
    const originalFetch = window.fetch;
    window.fetch = async (input, init) => {
      if (typeof input === 'string' && input.includes('/api/auth/')) {
        try {
          console.log(`[SafeAuth] Intercepting fetch to ${input}`);
          const response = await originalFetch(input, init);
          
          // Check if response is not valid JSON
          if (!response.ok || !response.headers.get('content-type')?.includes('application/json')) {
            console.warn('[SafeAuth] Invalid auth API response, using fallback');
            return new Response(JSON.stringify({
              user: null,
              expires: new Date(Date.now() + 60 * 60 * 1000).toISOString()
            }), {
              status: 200,
              headers: { 'Content-Type': 'application/json' }
            });
          }
          
          return response;
        } catch (error) {
          console.error('[SafeAuth] Auth API fetch error:', error);
          return new Response(JSON.stringify({
            user: null,
            expires: new Date(Date.now() + 60 * 60 * 1000).toISOString()
          }), {
            status: 200,
            headers: { 'Content-Type': 'application/json' }
          });
        }
      }
      
      return originalFetch(input, init);
    };
    
    return () => {
      window.fetch = originalFetch;
    };
  }, []);
  
  // Update the safe session whenever NextAuth session changes
  useEffect(() => {
    try {
      if (nextAuthSession.status === 'loading') {
        setIsLoading(true);
        return;
      }
      
      // Session loaded, update safe session
      setIsLoading(false);
      
      if (nextAuthSession.status === 'authenticated' && nextAuthSession.data) {
        setSafeSession({
          ...nextAuthSession.data,
          user: nextAuthSession.data.user || null
        });
        console.log('[SafeAuth] Using authenticated session');
      } else {
        setSafeSession({ user: null });
        console.log('[SafeAuth] Using unauthenticated session');
      }
    } catch (error) {
      console.error('[SafeAuth] Error handling session:', error);
      setIsLoading(false);
      setSafeSession({ user: null });
    }
  }, [nextAuthSession]);

  return (
    <SafeAuthContext.Provider value={{ safeSession, isLoading }}>
      {children}
    </SafeAuthContext.Provider>
  );
}

/**
 * SafeAuthProvider
 * This component provides a safe authentication experience
 * It prevents auth errors from crashing the application
 */
export function SafeAuthProvider({ children }: { children: React.ReactNode }) {
  return (
    <SessionProvider>
      <SafeSessionManager>
        {children}
      </SafeSessionManager>
    </SessionProvider>
  );
}
