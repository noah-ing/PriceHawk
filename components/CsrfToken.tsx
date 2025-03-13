/**
 * CSRF Token Component
 * 
 * Provides CSRF protection for forms:
 * 1. Generates a CSRF token via the server
 * 2. Injects a hidden input field with the token
 * 3. Automatically includes the token in form submissions
 * 4. Works with both regular forms and React Hook Form
 */

'use client';

import { useEffect, useState } from 'react';

// The token name used in the CSRF protection middleware
const CSRF_FORM_FIELD = '_csrf';
const CSRF_HEADER_NAME = 'x-csrf-token';

// Fetch a new CSRF token from the server
async function fetchCsrfToken(): Promise<string> {
  try {
    const response = await fetch('/api/csrf/token', {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include', // Important: include cookies
    });
    
    if (!response.ok) {
      console.error('Failed to fetch CSRF token:', response.statusText);
      return '';
    }
    
    const data = await response.json();
    return data.token || '';
  } catch (error) {
    console.error('Error fetching CSRF token:', error);
    return '';
  }
}

/**
 * Hidden input field containing a CSRF token for form submissions
 * Include this component inside any form that submits to a protected endpoint
 */
export default function CsrfToken() {
  const [token, setToken] = useState('');
  
  useEffect(() => {
    // Fetch a token when the component mounts with retry logic
    const fetchInitialToken = async () => {
      try {
        const newToken = await fetchCsrfToken();
        if (newToken) {
          setToken(newToken);
          console.log('Initial CSRF token fetched successfully');
        } else {
          console.warn('Empty initial CSRF token received, retrying...');
          setTimeout(async () => {
            const retryToken = await fetchCsrfToken();
            if (retryToken) {
              setToken(retryToken);
              console.log('CSRF token fetched successfully after retry');
            }
          }, 1000);
        }
      } catch (error) {
        console.error('Error fetching initial CSRF token:', error);
        // Try once more after a delay
        setTimeout(async () => {
          try {
            const retryToken = await fetchCsrfToken();
            if (retryToken) {
              setToken(retryToken);
              console.log('CSRF token fetched successfully after error retry');
            }
          } catch (retryError) {
            console.error('Failed to fetch token after retry:', retryError);
          }
        }, 2000);
      }
    };
    
    fetchInitialToken();
    
    // Refetch the token every 5 minutes to prevent expiration (reduced from 15 minutes)
    const interval = setInterval(async () => {
      try {
        const newToken = await fetchCsrfToken();
        if (newToken) {
          setToken(newToken);
          console.log('CSRF token refreshed successfully in periodic update');
        } else {
          console.warn('Empty token received during periodic refresh');
        }
      } catch (error) {
        console.error('Error during periodic token refresh:', error);
      }
    }, 5 * 60 * 1000); // 5 minutes instead of 15
    
    return () => clearInterval(interval);
  }, []);
  
  // Return a hidden input field with the token
  return <input type="hidden" name={CSRF_FORM_FIELD} value={token} />;
}

/**
 * Hook to get the CSRF token for use with React Hook Form
 * Example usage:
 * 
 * const { csrfToken, csrfField } = useCsrfToken();
 * 
 * // With React Hook Form:
 * const { register, handleSubmit } = useForm();
 * const onSubmit = (data) => {
 *   // The CSRF token is automatically included in the form data
 *   fetch('/api/protected', {
 *     method: 'POST',
 *     headers: { 'Content-Type': 'application/json' },
 *     body: JSON.stringify({ ...data, _csrf: csrfToken })
 *   });
 * };
 * 
 * // In your form:
 * <form onSubmit={handleSubmit(onSubmit)}>
 *   {csrfField}
 *   <input {...register('name')} />
 *   <button type="submit">Submit</button>
 * </form>
 */
export function useCsrfToken() {
  const [token, setToken] = useState('');
  const [lastFetchTime, setLastFetchTime] = useState(0);
  
  useEffect(() => {
    // Fetch a token when the component mounts with retry logic
    const fetchInitialToken = async () => {
      try {
        const newToken = await fetchCsrfToken();
        if (newToken) {
          setToken(newToken);
          setLastFetchTime(Date.now());
          console.log('Initial CSRF token fetched successfully for hook');
        } else {
          console.warn('Empty initial CSRF token received in hook, retrying...');
          setTimeout(async () => {
            const retryToken = await fetchCsrfToken();
            if (retryToken) {
              setToken(retryToken);
              setLastFetchTime(Date.now());
              console.log('CSRF token fetched successfully after retry in hook');
            }
          }, 1000);
        }
      } catch (error) {
        console.error('Error fetching initial CSRF token in hook:', error);
        // Try once more after a delay
        setTimeout(async () => {
          try {
            const retryToken = await fetchCsrfToken();
            if (retryToken) {
              setToken(retryToken);
              setLastFetchTime(Date.now());
              console.log('CSRF token fetched successfully after error retry in hook');
            }
          } catch (retryError) {
            console.error('Failed to fetch token after retry in hook:', retryError);
          }
        }, 2000);
      }
    };
    
    fetchInitialToken();
    
    // Refetch the token every 5 minutes to prevent expiration (reduced from 15 minutes)
    const interval = setInterval(async () => {
      try {
        const newToken = await fetchCsrfToken();
        if (newToken) {
          setToken(newToken);
          setLastFetchTime(Date.now());
          console.log('CSRF token refreshed successfully in periodic update for hook');
        } else {
          console.warn('Empty token received during periodic refresh in hook');
        }
      } catch (error) {
        console.error('Error during periodic token refresh in hook:', error);
      }
    }, 5 * 60 * 1000); // 5 minutes instead of 15
    
    return () => clearInterval(interval);
  }, []);
  
  // A method to force refresh the token if needed
  const refreshToken = async (): Promise<string> => {
    try {
      console.log('Manually refreshing CSRF token');
      const newToken = await fetchCsrfToken();
      if (newToken) {
        setToken(newToken);
        setLastFetchTime(Date.now());
        console.log('CSRF token manually refreshed successfully');
        return newToken;
      } else {
        console.warn('Empty token received during manual refresh');
        return token; // Fallback to existing token
      }
    } catch (error) {
      console.error('Error during manual token refresh:', error);
      return token; // Fallback to existing token
    }
  };
  
  // Return both the token, field component, and refresh method
  return {
    csrfToken: token,
    csrfField: <input type="hidden" name={CSRF_FORM_FIELD} value={token} />,
    refreshToken
  };
}

/**
 * Utility to add CSRF token to fetch requests
 * Example usage:
 * 
 * const { fetchWithCsrf } = useFetchWithCsrf();
 * 
 * // Later in your code:
 * const response = await fetchWithCsrf('/api/protected', {
 *   method: 'POST',
 *   body: JSON.stringify({ name: 'John' })
 * });
 */
export function useFetchWithCsrf() {
  const [token, setToken] = useState('');
  const [isTokenLoaded, setIsTokenLoaded] = useState(false);
  const [lastFetchTime, setLastFetchTime] = useState(0);
  
  // Token refresh interval - 15 minutes in milliseconds
  const TOKEN_REFRESH_INTERVAL = 15 * 60 * 1000;
  // Maximum token age for auto-refresh before a request - 14 minutes
  const TOKEN_MAX_AGE = 14 * 60 * 1000;
  // Maximum retries for token fetch
  const MAX_RETRIES = 3;
  
// This function ensures the token is loaded before making the request
  // with built-in retry mechanism and token freshness check
  const ensureTokenLoaded = async (forceRefresh = false): Promise<string> => {
    // If token is loaded and not forcing refresh, check if it's fresh enough
    if (isTokenLoaded && token && !forceRefresh) {
      const tokenAge = Date.now() - lastFetchTime;
      // Make this more aggressive - refresh if token is older than 10 minutes
      if (tokenAge < 10 * 60 * 1000) { // 10 minutes instead of 14
        return token;
      }
      console.log('CSRF token is potentially stale, refreshing before request');
      // Otherwise continue to refresh
    }
    
    // Implement retry mechanism for token fetch
    let retries = 0;
    let newToken = '';
    let error: any = null;
    
    while (retries < MAX_RETRIES) {
      try {
        console.log(`Fetching new CSRF token before request (attempt ${retries + 1})`);
        newToken = await fetchCsrfToken();
        
        if (newToken) {
          setToken(newToken);
          setIsTokenLoaded(true);
          setLastFetchTime(Date.now());
          return newToken;
        }
        
        console.warn('Empty CSRF token received, retrying...');
      } catch (err) {
        error = err;
        console.error(`Error fetching CSRF token (attempt ${retries + 1}):`, err);
      }
      
      retries++;
      if (retries < MAX_RETRIES) {
        // Exponential backoff: 200ms, 400ms, 800ms, etc.
        const backoff = Math.pow(2, retries) * 100;
        console.log(`Retrying CSRF token fetch in ${backoff}ms`);
        await new Promise(resolve => setTimeout(resolve, backoff));
      }
    }
    
    // After all retries, if we still have a token, use it as fallback
    if (token) {
      console.warn('Using existing token as fallback after fetch failures');
      return token;
    }
    
    // If all retries failed and we have no token, throw an error
    throw new Error('Failed to fetch CSRF token after multiple attempts');
  };
  
  useEffect(() => {
    // Initial token fetch with retries
    const fetchInitialToken = async () => {
      try {
        await ensureTokenLoaded(true);
      } catch (err) {
        console.error('Failed to fetch initial CSRF token:', err);
        // Try once more after a delay for initial load
        setTimeout(async () => {
          try {
            await ensureTokenLoaded(true);
          } catch (retryErr) {
            console.error('Failed to fetch token after retry:', retryErr);
          }
        }, 2000);
      }
    };
    
    fetchInitialToken();
    
    // Refetch the token more frequently - every 5 minutes
    const TOKEN_REFRESH_INTERVAL = 5 * 60 * 1000; // 5 minutes instead of 15
    
    const interval = setInterval(async () => {
      try {
        const newToken = await fetchCsrfToken();
        if (newToken) {
          setToken(newToken);
          setLastFetchTime(Date.now());
          console.log('CSRF token refreshed successfully in periodic update');
        } else {
          console.warn('Empty token received during periodic refresh');
          // Try once more after a short delay
          setTimeout(async () => {
            try {
              const retryToken = await fetchCsrfToken();
              if (retryToken) {
                setToken(retryToken);
                setLastFetchTime(Date.now());
                console.log('CSRF token refreshed successfully after retry');
              }
            } catch (retryErr) {
              console.error('Error in token refresh retry:', retryErr);
            }
          }, 1000);
        }
      } catch (err) {
        console.error('Error during periodic token refresh:', err);
      }
    }, TOKEN_REFRESH_INTERVAL);
    
    return () => clearInterval(interval);
  }, []);
  
  // Return a fetch wrapper that includes the CSRF token
  return {
    fetchWithCsrf: async (url: string, options: RequestInit = {}) => {
      // Always ensure we have a fresh token before making the request
      let currentToken;
      try {
        // Force a token refresh for critical endpoints to minimize token issues
        const isCriticalEndpoint = 
          url.includes('/api/scrape') || 
          url.includes('/api/products') || 
          url.includes('/api/alerts');
        
        currentToken = await ensureTokenLoaded(isCriticalEndpoint);
        console.log('Using CSRF token:', currentToken.substring(0, 8) + '...', 
          isCriticalEndpoint ? '(forced refresh for critical endpoint)' : '');
      } catch (err) {
        console.error('Critical error ensuring CSRF token:', err);
        throw new Error('Failed to get CSRF token for request');
      }
      
      const headers = new Headers(options.headers || {});
      
      // Set the content type to JSON if not specified
      if (!headers.has('Content-Type') && options.method !== 'GET') {
        headers.set('Content-Type', 'application/json');
      }
      
      // Add the CSRF token to the headers
      headers.set(CSRF_HEADER_NAME, currentToken);
      
      // If this is a state-changing request, add the token to the body as well
      let body = options.body;
      
      if (options.method && options.method !== 'GET' && options.method !== 'HEAD') {
        // Check if the content type is JSON
        const contentType = headers.get('Content-Type');
        if (contentType?.includes('application/json')) {
          try {
            // If body is a string, parse it, otherwise use it directly
            const bodyObj = typeof body === 'string' ? JSON.parse(body as string) : body || {};
            
            // Add the CSRF token to the body
            bodyObj[CSRF_FORM_FIELD] = currentToken;
            
            // Update the body
            body = JSON.stringify(bodyObj);
            console.log('Added CSRF token to request body');
          } catch (error) {
            console.error('Error adding CSRF token to request body:', error);
            // Continue with the request even if we couldn't add the token to the body
            // The header-based token should still work
          }
        } else {
          console.warn('Non-JSON content type, token only added to headers');
        }
      }
      
      // For critical endpoints, add retry logic
      const isCriticalEndpoint = 
        url.includes('/api/scrape') || 
        url.includes('/api/products') || 
        url.includes('/api/alerts');
      
      const maxRetries = isCriticalEndpoint ? 2 : 0;
      let retries = 0;
      
      const attemptFetch = async (): Promise<Response> => {
        try {
          // Return the fetch promise with the modified options
          const response = await fetch(url, {
            ...options,
            headers,
            credentials: 'include', // Include cookies
            body,
          });
          
          // If we get a CSRF error and have retries left, get a new token and try again
          if (response.status === 403 && retries < maxRetries) {
            const responseData = await response.json();
            if (responseData.csrfError) {
              console.warn('CSRF validation failed, refreshing token and retrying...');
              retries++;
              
              // Get a new token and update the request
              currentToken = await ensureTokenLoaded(true); // Force refresh
              
              // Update headers
              headers.set(CSRF_HEADER_NAME, currentToken);
              
              // Update body if JSON
              if (options.method && options.method !== 'GET' && options.method !== 'HEAD') {
                const contentType = headers.get('Content-Type');
                if (contentType?.includes('application/json')) {
                  try {
                    const bodyObj = typeof body === 'string' ? JSON.parse(body as string) : body || {};
                    bodyObj[CSRF_FORM_FIELD] = currentToken;
                    body = JSON.stringify(bodyObj);
                  } catch (error) {
                    console.error('Error updating CSRF token in body for retry:', error);
                  }
                }
              }
              
              // Try again with the new token
              return attemptFetch();
            }
          }
          
          return response;
        } catch (error) {
          console.error(`Fetch operation failed (attempt ${retries + 1}):`, error);
          
          if (retries < maxRetries) {
            retries++;
            console.log(`Retrying fetch operation (attempt ${retries + 1})...`);
            return attemptFetch();
          }
          
          throw error;
        }
      };
      
      return attemptFetch();
    },
    
    // Expose a way to manually refresh the token
    refreshCsrfToken: async () => {
      try {
        return await ensureTokenLoaded(true);
      } catch (err) {
        console.error('Manual token refresh failed:', err);
        throw err;
      }
    }
  };
}
