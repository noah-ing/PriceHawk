/**
 * Base Scraper Interface
 * 
 * This module defines the interface that all retailer-specific scrapers must implement.
 * It provides a common structure for scraping operations across different retailers.
 */

// Product data interface
export interface ProductData {
  title: string;
  currentPrice: number;
  originalPrice?: number;
  currency: string;
  imageUrl: string;
  description?: string;
  availability: boolean;
  retailer: string;
  productUrl: string;
  productId: string;
  timestamp: string;
  additionalInfo?: Record<string, any>;
}

// Scraping options interface
export interface ScrapingOptions {
  useProxy?: boolean;
  timeout?: number;
  retries?: number;
  userAgent?: string;
}

// Scraping result interface
export interface ScrapingResult {
  success: boolean;
  data?: ProductData;
  error?: {
    message: string;
    code: string;
    details?: any;
  };
  responseTime: number;
}

/**
 * Base Scraper abstract class
 * All retailer-specific scrapers should extend this class
 */
export abstract class BaseScraper {
  protected url: string;
  protected options: ScrapingOptions;
  
  /**
   * Constructor for the base scraper
   * @param url The product URL to scrape
   * @param options Optional scraping configuration
   */
  constructor(url: string, options: ScrapingOptions = {}) {
    this.url = url;
    this.options = {
      useProxy: true,
      timeout: 10000, // 10 seconds
      retries: 3,
      userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      ...options
    };
  }
  
  /**
   * Abstract method to scrape product data
   * Must be implemented by all retailer-specific scrapers
   */
  abstract scrape(): Promise<ScrapingResult>;
  
  /**
   * Helper method to format price strings to numbers
   * @param priceString The price string to format
   * @returns Formatted price as a number
   */
  protected formatPrice(priceString: string | null): number | null {
    if (!priceString) return null;
    
    // Remove currency symbols, commas, and other non-numeric characters
    // Keep decimal point
    const numericString = priceString.replace(/[^0-9.]/g, '');
    
    // Convert to number
    const price = parseFloat(numericString);
    
    // Return null if not a valid number
    return isNaN(price) ? null : price;
  }
  
  /**
   * Helper method to extract currency from price string
   * @param priceString The price string to extract currency from
   * @returns Currency code (default: USD)
   */
  protected extractCurrency(priceString: string | null): string {
    if (!priceString) return 'USD';
    
    // Look for common currency symbols
    if (priceString.includes('$')) return 'USD';
    if (priceString.includes('€')) return 'EUR';
    if (priceString.includes('£')) return 'GBP';
    if (priceString.includes('¥')) return 'JPY';
    
    // Default to USD if no currency symbol found
    return 'USD';
  }
  
  /**
   * Helper method to normalize product data
   * @param data Partial product data
   * @param productId Product ID
   * @returns Complete normalized product data
   */
  protected normalizeProductData(data: Partial<ProductData>, productId: string): ProductData {
    return {
      title: data.title || 'Unknown Product',
      currentPrice: data.currentPrice || 0,
      originalPrice: data.originalPrice,
      currency: data.currency || 'USD',
      imageUrl: data.imageUrl || '',
      description: data.description,
      availability: data.availability !== undefined ? data.availability : true,
      retailer: data.retailer || '',
      productUrl: this.url,
      productId: productId,
      timestamp: new Date().toISOString(),
      additionalInfo: data.additionalInfo,
    };
  }
  
  /**
   * Helper method to handle scraping errors
   * @param message Error message
   * @param code Error code
   * @param details Additional error details
   * @returns Scraping result with error
   */
  protected handleError(message: string, code: string, details?: any): ScrapingResult {
    return {
      success: false,
      error: {
        message,
        code,
        details,
      },
      responseTime: 0,
    };
  }
}
