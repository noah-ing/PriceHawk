"use client";

import { redirect } from 'next/navigation';

/**
 * Redirect from Scraper Test Page to Advanced Search
 * 
 * This provides backward compatibility by redirecting users
 * from the old scraper-test URL to the new advanced-search page.
 */

// Skip static generation - force dynamic rendering
export const dynamic = 'force-dynamic';

export default function ScraperTestPage() {
  redirect('/advanced-search');
}
