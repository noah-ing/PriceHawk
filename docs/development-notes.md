# Development Notes

This document contains important notes about temporary development configurations that must be adjusted before production deployment.

## CSRF Protection

CSRF protection has been temporarily disabled for the following routes during development:

- `app/api/alerts/route.ts` - POST handler
- `app/api/products/route.ts` - POST handler

Before production deployment, these must be re-enabled by changing the `csrfProtection` option to `true`:

```typescript
// Change from
{ csrfProtection: false } // Temporarily disabled for development

// To
{ csrfProtection: true } // Re-enabled for production
```

## API Route Parameter Fixes

The following API routes have been updated to use the correct Next.js App Router parameter handling pattern:

- `app/api/products/[id]/price-history/route.ts` - Changed to use the correct parameter extraction from context

## CSRF Token Component Enhancement

The CSRF token component has been enhanced to better handle token loading and ensure tokens are properly included in requests:

- Added token preloading before API requests
- Improved error handling and debugging for token-related issues
- Enhanced content type handling in the fetch wrapper

This fix ensures frontend components that use the `useFetchWithCsrf` hook correctly include CSRF tokens with every request.
