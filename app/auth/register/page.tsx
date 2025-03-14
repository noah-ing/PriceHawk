// This is a server component that doesn't use client-side hooks like useSearchParams
export const dynamic = 'force-dynamic';

import { Suspense } from "react";
import RegisterClient from "./register-client";

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
export default function RegisterPage({
  searchParams,
}: {
  searchParams: { callbackUrl?: string };
}) {
  const { callbackUrl } = searchParams;

  return (
    <Suspense fallback={<LoadingFallback />}>
      <RegisterClient callbackUrl={callbackUrl || '/'} />
    </Suspense>
  );
}
