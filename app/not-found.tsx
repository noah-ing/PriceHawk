// Server component that doesn't use client hooks
export const dynamic = 'force-dynamic';

import { Suspense } from "react";
import NotFoundClient from "./not-found-client";

// Simple loading fallback
function LoadingFallback() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50 p-4">
      <div className="text-center">
        <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-gray-500 border-t-transparent"></div>
        <p className="mt-2">Loading...</p>
      </div>
    </div>
  );
}

// Server component for 404 page
export default function NotFoundPage() {
  return (
    <Suspense fallback={<LoadingFallback />}>
      <NotFoundClient />
    </Suspense>
  );
}
