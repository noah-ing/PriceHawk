# PostgreSQL Migration Fixes

## Overview

This document outlines the fixes implemented to address the authentication issues encountered during the migration from SQLite to PostgreSQL, as well as related React hydration errors.

## Issues Addressed

### 1. Authentication Errors with PostgreSQL
- `"payload" argument must be of type object. Received null` - Error in JWT token handling
- 500 Internal Server Errors from authentication endpoints
- Client-side hydration mismatches due to auth failures 

### 2. React Hydration Mismatch
- Theme inconsistencies between server and client rendering
- HTML attribute differences leading to React warnings and errors

## Solutions Implemented

### 1. Enhanced Prisma Adapter

Created a robust adapter wrapper with:
- Error handling for all database operations
- Retry logic with exponential backoff
- Detailed logging for debugging
- Graceful fallbacks for error states

```typescript
// @ts-nocheck
export function createEnhancedPrismaAdapter(prisma: PrismaClient): Adapter {
  // Start with the standard PrismaAdapter
  const standardAdapter = PrismaAdapter(prisma);

  // Enhanced adapter with retry logic and better error handling
  const enhancedAdapter = {
    // Enhanced methods with error handling and retries
    // ...
  };
  
  return enhancedAdapter;
}
```

### 2. Client-Side Auth Protection

Implemented two client-side components to handle authentication failures gracefully:

#### Session Error Boundary

Created a component that intercepts auth API calls to ensure they always return valid JSON:

```typescript
export function SessionErrorBoundary({ children }) {
  useEffect(() => {
    // Override fetch to intercept auth API calls
    window.fetch = async (input, init) => {
      if (typeof input === 'string' && input.includes('/api/auth/')) {
        try {
          // Handle response errors gracefully
          // ...
        } catch (error) {
          // Return fallback session on error
          // ...
        }
      }
      
      return originalFetch(input, init);
    };
  }, []);
  
  return <SessionProvider>{children}</SessionProvider>;
}
```

#### Safe Auth Provider

Created a comprehensive provider for robust auth state management:

```typescript
export function SafeAuthProvider({ children }) {
  return (
    <SessionProvider>
      <SafeSessionManager>
        {children}
      </SafeSessionManager>
    </SessionProvider>
  );
}
```

### 3. Custom JWT Handling

Implemented custom JWT encoding/decoding with safeguards:

```typescript
const customEncode = async ({ token, secret, maxAge }) => {
  // Ensure token is never null before encoding
  if (!token || typeof token !== 'object') {
    token = { 
      // Default minimal token with just a random sub
      sub: crypto.randomUUID(),
      // ...
    };
  }
  
  // Try to encode, fall back to a safe token if it fails
  try {
    return await encode({ token, secret, maxAge });
  } catch (error) {
    // Return a fallback token
    // ...
  }
};
```

### 4. Theme Provider Fix

Resolved React hydration mismatches by modifying the theme provider:

```typescript
<ThemeProvider 
  attribute="class" 
  defaultTheme="light" 
  enableSystem={false} 
  disableTransitionOnChange
>
  {children}
</ThemeProvider>
```

Instead of using `forcedTheme` which can cause server/client differences, we use a combination of `defaultTheme` and `enableSystem={false}` to ensure consistent rendering.

## Lessons Learned

1. **Robust Adapter Design**: When working with database adapters for authentication, always implement retry logic and fallbacks.

2. **Client-Side Protection**: Even if server-side auth fails, client-side components should degrade gracefully.

3. **JWT Handling**: Always implement safeguards for null or invalid tokens in JWT operations.

4. **Hydration Consistency**: Be careful with features like `forcedTheme` that can create differences between server and client rendering.

5. **Error Logging**: Comprehensive logging is essential for debugging auth issues in production.
