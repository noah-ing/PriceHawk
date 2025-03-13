/**
 * URL Parser Utility
 * 
 * This module provides functions for parsing product URLs, extracting domains,
 * and identifying retailers based on URL patterns.
 */

// Supported retailers with their domain patterns
export const SUPPORTED_RETAILERS = {
  AMAZON: 'amazon',
  WALMART: 'walmart',
  BESTBUY: 'bestbuy',
  // Add more retailers as needed
};

// Type for retailer identification
export type RetailerType = keyof typeof SUPPORTED_RETAILERS;

// Interface for parsed URL information
export interface ParsedUrlInfo {
  retailer: RetailerType | null;
  domain: string;
  productId: string | null;
  isValid: boolean;
  validationMessage?: string;
}

/**
 * Extracts the domain from a URL
 * @param url The URL to extract the domain from
 * @returns The domain or null if invalid
 */
export function extractDomain(url: string): string | null {
  try {
    const urlObj = new URL(url);
    // Remove 'www.' if present
    return urlObj.hostname.replace(/^www\./, '');
  } catch (error) {
    return null;
  }
}

/**
 * Identifies the retailer based on the domain
 * @param domain The domain to identify
 * @returns The retailer type or null if not supported
 */
export function identifyRetailer(domain: string): RetailerType | null {
  if (!domain) return null;
  
  const domainLower = domain.toLowerCase();
  
  if (domainLower.includes('amazon')) {
    return 'AMAZON';
  } else if (domainLower.includes('walmart')) {
    return 'WALMART';
  } else if (domainLower.includes('bestbuy')) {
    return 'BESTBUY';
  }
  
  return null;
}

/**
 * Extracts the product ID from a URL based on the retailer
 * @param url The product URL
 * @param retailer The identified retailer
 * @returns The product ID or null if not found
 */
export function extractProductId(url: string, retailer: RetailerType | null): string | null {
  if (!url || !retailer) return null;
  
  try {
    const urlObj = new URL(url);
    
    switch (retailer) {
      case 'AMAZON':
        // Amazon product IDs are typically in the URL path as /dp/PRODUCTID or /gp/product/PRODUCTID
        const amazonDpMatch = url.match(/\/dp\/([A-Z0-9]{10})/i);
        const amazonGpMatch = url.match(/\/gp\/product\/([A-Z0-9]{10})/i);
        return amazonDpMatch?.[1] || amazonGpMatch?.[1] || null;
        
      case 'WALMART':
        // Walmart product IDs are typically in the URL path as /ip/PRODUCTNAME/PRODUCTID
        const walmartMatch = url.match(/\/ip\/(?:.+\/)?(\d+)(?:\?|$)/);
        return walmartMatch?.[1] || null;
        
      case 'BESTBUY':
        // Best Buy product IDs are typically in the URL path as /site/PRODUCTNAME/PRODUCTID.p
        const bestBuyMatch = url.match(/\/site\/(?:.+\/)?(\d+)\.p/);
        return bestBuyMatch?.[1] || null;
        
      default:
        return null;
    }
  } catch (error) {
    return null;
  }
}

/**
 * Validates a URL format and structure
 * @param url The URL to validate
 * @returns Boolean indicating if the URL is valid
 */
export function isValidUrl(url: string): boolean {
  try {
    new URL(url);
    return true;
  } catch (error) {
    return false;
  }
}

/**
 * Validates if a URL is from a supported retailer
 * @param url The URL to validate
 * @returns Boolean indicating if the retailer is supported
 */
export function isSupportedRetailer(url: string): boolean {
  const domain = extractDomain(url);
  return domain !== null && identifyRetailer(domain) !== null;
}

/**
 * Parses a product URL and extracts relevant information
 * @param url The product URL to parse
 * @returns Object containing parsed information
 */
export function parseProductUrl(url: string): ParsedUrlInfo {
  // Check if URL is valid
  if (!isValidUrl(url)) {
    return {
      retailer: null,
      domain: '',
      productId: null,
      isValid: false,
      validationMessage: 'Invalid URL format',
    };
  }
  
  // Extract domain
  const domain = extractDomain(url);
  if (!domain) {
    return {
      retailer: null,
      domain: '',
      productId: null,
      isValid: false,
      validationMessage: 'Could not extract domain from URL',
    };
  }
  
  // Identify retailer
  const retailer = identifyRetailer(domain);
  if (!retailer) {
    return {
      retailer: null,
      domain,
      productId: null,
      isValid: false,
      validationMessage: 'Unsupported retailer',
    };
  }
  
  // Extract product ID
  const productId = extractProductId(url, retailer);
  if (!productId) {
    return {
      retailer,
      domain,
      productId: null,
      isValid: false,
      validationMessage: 'Could not extract product ID from URL',
    };
  }
  
  // All checks passed
  return {
    retailer,
    domain,
    productId,
    isValid: true,
  };
}
