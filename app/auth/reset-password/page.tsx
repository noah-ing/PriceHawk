// Server component that doesn't use client hooks
import { Suspense } from "react";
import ResetPasswordForm from "./reset-password-form";

export const dynamic = 'force-dynamic';

// Loading fallback for Suspense
function Loading() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50 p-4">
      <div className="text-center">
        <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-gray-500 border-t-transparent"></div>
        <p className="mt-2">Loading...</p>
      </div>
    </div>
  );
}

// Server component that passes the token from searchParams
export default function ResetPasswordPage({
  searchParams,
}: {
  searchParams: { token?: string };
}) {
  const { token } = searchParams;

  return (
    <Suspense fallback={<Loading />}>
      <ResetPasswordForm token={token} />
    </Suspense>
  );
}
