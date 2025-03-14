# SearchParams Usage Guide

## The Problem

Next.js requires components that use `useSearchParams()` to be wrapped in a Suspense boundary to ensure proper rendering during client-side navigation. Without this, you'll see build errors like:

```
useSearchParams() should be wrapped in a suspense boundary
```

## Solution: SearchParamsProvider Component

We've implemented a reusable component to solve this issue consistently across the application.

### Basic Usage

```tsx
import { SearchParamsProvider, DefaultLoadingFallback } from "@/components/search-params-provider";

// Component that uses useSearchParams
function PageContent() {
  const searchParams = useSearchParams();
  // Rest of your component...
}

// Exported page component with proper Suspense boundary
export default function Page() {
  return (
    <SearchParamsProvider fallback={<DefaultLoadingFallback />}>
      <PageContent />
    </SearchParamsProvider>
  );
}
```

### Custom Loading State

You can provide your own loading component:

```tsx
function CustomLoading() {
  return (
    <div className="my-custom-loading">
      Loading...
    </div>
  );
}

export default function Page() {
  return (
    <SearchParamsProvider fallback={<CustomLoading />}>
      <PageContent />
    </SearchParamsProvider>
  );
}
```

## Best Practices

1. **Component Structure**: Always split your page into:
   - Main exported page component (doesn't use `useSearchParams`)
   - Content component (can safely use `useSearchParams`)
   - Optional custom loading component

2. **Code Organization**:
   - The component using `useSearchParams` should be defined separately
   - Wrap it with `SearchParamsProvider` in the default export

3. **Consistent Loading UI**:
   - Use `DefaultLoadingFallback` for simple cases
   - Create custom loading states that match your page layout for better UX

## Example Implementation

```tsx
"use client";

import { useState } from "react";
import { useSearchParams } from "next/navigation";
import { SearchParamsProvider } from "@/components/search-params-provider";

// Content component that can use useSearchParams
function ExamplePageContent() {
  const searchParams = useSearchParams();
  const query = searchParams.get('q') || '';
  const [results, setResults] = useState([]);
  
  // Logic that depends on search params...
  
  return (
    <div>
      <h1>Search Results for: {query}</h1>
      {/* Rest of component */}
    </div>
  );
}

// Loading component specific to this page
function ExampleLoading() {
  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-center">
        <div className="animate-spin h-10 w-10 border-4 border-blue-500 border-t-transparent rounded-full mx-auto"></div>
        <p className="mt-4 text-gray-500">Loading search results...</p>
      </div>
    </div>
  );
}

// Main exported component
export default function ExamplePage() {
  return (
    <SearchParamsProvider fallback={<ExampleLoading />}>
      <ExamplePageContent />
    </SearchParamsProvider>
  );
}
```

## When To Use

Apply this pattern to any component that uses:
- `useSearchParams()`
- Any other hooks that might cause the "missing Suspense boundary" warning during build

This includes pages with:
- URL query parameter handling
- Search functionality
- Filter functionality
- Pagination that uses URL parameters
