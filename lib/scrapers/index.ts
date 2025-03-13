/**
 * Scrapers Index
 * 
 * This module exports all the retailer-specific scrapers and provides
 * a factory function to get the appropriate scraper for a given retailer.
 */

import { BaseScraper } from './base-scraper';
import { AmazonScraper } from './amazon-scraper';
import { WalmartScraper } from './walmart-scraper';
import { BestBuyScraper } from './bestbuy-scraper';
import { RetailerType, parseProductUrl } from '../url-parser';

// Export all scrapers
export * from './base-scraper';
export * from './amazon-scraper';
export * from './walmart-scraper';
export * from './bestbuy-scraper';

/**
 * Get the appropriate scraper for a given retailer
 * @param retailer The retailer type
 * @param url The product URL
 * @param options Optional scraping configuration
 * @returns The appropriate scraper instance
 */
export function getScraperForRetailer(
  retailer: RetailerType | null,
  url: string,
  options = {}
): BaseScraper | null {
  if (!retailer) return null;
  
  switch (retailer) {
    case 'AMAZON':
      return new AmazonScraper(url, options);
    case 'WALMART':
      return new WalmartScraper(url, options);
    case 'BESTBUY':
      return new BestBuyScraper(url, options);
    default:
      return null;
  }
}

/**
 * Get a scraper for a URL without needing to specify the retailer
 * @param url The product URL
 * @param options Optional scraping configuration
 * @returns The appropriate scraper instance or null if retailer not supported
 */
export function getScraperForUrl(url: string, options = {}): BaseScraper | null {
  // Use the URL parser to identify the retailer
  const { retailer, isValid } = parseProductUrl(url);
  
  // If the URL is not valid or the retailer is not supported, return null
  if (!isValid || !retailer) {
    return null;
  }
  
  // Get the appropriate scraper for the retailer
  return getScraperForRetailer(retailer, url, options);
}
