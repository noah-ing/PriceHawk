"use client";

// Skip static generation - force dynamic rendering
export const dynamic = 'force-dynamic';

import { Button } from "@/components/ui/button";
import Link from "next/link";
import { Suspense } from "react";
import { useSearchParams } from "next/navigation";

// The actual NotFound component
function NotFoundContent() {
  // Even though we don't use searchParams, explicitly declare it 
  // to ensure Next.js properly detects it's within Suspense
  const searchParams = useSearchParams();
  return (
    <div className="flex min-h-screen items-center justify-center bg-muted/10 p-4">
      <div className="text-center max-w-md">
        <h2 className="text-4xl font-bold mb-4">404</h2>
        <h3 className="text-2xl font-semibold mb-6">Page Not Found</h3>
        <p className="text-muted-foreground mb-8">
          The page you are looking for doesn't exist or has been moved.
        </p>
        <Button asChild>
          <Link href="/">
            Return to Home
          </Link>
        </Button>
      </div>
    </div>
  );
}

// Export a Suspense-wrapped component to handle any useSearchParams() calls
export default function NotFound() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <NotFoundContent />
    </Suspense>
  );
}
