/**
 * SearchParamsProvider Component
 * 
 * This component wraps children in a Suspense boundary to properly handle useSearchParams() usage.
 * Next.js requires components that use useSearchParams to be wrapped in Suspense 
 * to ensure proper client-side navigation.
 */
"use client";

import { ReactNode, Suspense } from "react";

interface SearchParamsProviderProps {
  children: ReactNode;
  fallback: ReactNode; // Required fallback UI
}

/**
 * A wrapper component that provides a Suspense boundary for components that use useSearchParams.
 * 
 * @param {ReactNode} children - The component(s) that use useSearchParams
 * @param {ReactNode} fallback - Loading UI to show while the main content is loading
 * @returns A component wrapped in a Suspense boundary
 */
export function SearchParamsProvider({ 
  children, 
  fallback 
}: SearchParamsProviderProps) {
  return (
    <Suspense fallback={fallback}>
      {children}
    </Suspense>
  );
}

/**
 * Default loading component with a clean, minimal design.
 * Can be used as a fallback for SearchParamsProvider.
 */
export function DefaultLoadingFallback() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background">
      <div className="text-center">
        <div className="mb-4 flex justify-center">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
        </div>
        <p className="text-sm text-muted-foreground">Loading...</p>
      </div>
    </div>
  );
}
