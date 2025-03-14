"use client";

import { redirect } from 'next/navigation';
import { Suspense } from 'react';
import { useSearchParams } from 'next/navigation';

/**
 * Redirect from Scraper Test Page to Advanced Search
 * 
 * This provides backward compatibility by redirecting users
 * from the old scraper-test URL to the new advanced-search page.
 */

// Skip static generation - force dynamic rendering
export const dynamic = 'force-dynamic';

// The actual redirect component
function ScraperTestContent() {
  // Even though we don't use searchParams, explicitly declare it 
  // to ensure Next.js properly detects it's within Suspense
  const searchParams = useSearchParams();
  redirect('/advanced-search');
  return null; // This will never be rendered due to the redirect
}

// Export a Suspense-wrapped component to handle any useSearchParams() calls
export default function ScraperTestPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <ScraperTestContent />
    </Suspense>
  );
}
