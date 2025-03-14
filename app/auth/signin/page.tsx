// Server component that doesn't use client hooks
export const dynamic = 'force-dynamic';

import { Suspense } from "react";
import SignInClient from "./signin-client";

// Loading fallback
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

// Server component that passes the callbackUrl from searchParams
export default function SignInPage({
  searchParams,
}: {
  searchParams: { callbackUrl?: string; error?: string };
}) {
  const { callbackUrl, error } = searchParams;
  
  return (
    <Suspense fallback={<LoadingFallback />}>
      <SignInClient callbackUrl={callbackUrl || '/'} error={error} />
    </Suspense>
  );
}
