/**
 * Scrape API Route
 * 
 * This API route handles product URL scraping requests.
 * It validates the URL, identifies the retailer, and calls the appropriate scraper.
 * If a userId is provided, it also saves the product to the database.
 */

import { NextRequest, NextResponse } from 'next/server';
import { parseProductUrl } from '@/lib/url-parser';
import { getScraperForRetailer } from '@/lib/scrapers';
import { ProductData, ScrapingResult } from '@/lib/scrapers/base-scraper';
import { validatePrice as validatePriceString, trackScrapingResult } from '@/lib/mcp-integration';
import { productService } from '@/lib/services';
import { withSecuredApi } from '@/lib/middleware/secured-api';

// Define the request body interface
interface ScrapeRequestBody {
  url: string;
  userId?: string; // Optional user ID for saving the product
  saveProduct?: boolean; // Whether to save the product to the database
  options?: {
    useProxy?: boolean;
    timeout?: number;
    retries?: number;
  };
}

// Define the response interface
interface ScrapeResponse {
  success: boolean;
  data?: ProductData;
  error?: {
    message: string;
    code: string;
    details?: any;
  };
  meta: {
    url: string;
    retailer: string | null;
    responseTime: number;
    timestamp: string;
  };
}

/**
 * POST handler for the scrape API route
 * @param request The incoming request
 * @returns The API response
 */
const handlePost = async (request: NextRequest): Promise<NextResponse> => {
  const startTime = Date.now();
  
  try {
    // Parse the request body
    const body: ScrapeRequestBody = await request.json();
    
    // Validate the request body
    if (!body.url) {
      return NextResponse.json(
        {
          success: false,
          error: {
            message: 'URL is required',
            code: 'MISSING_URL',
          },
          meta: {
            url: '',
            retailer: null,
            responseTime: Date.now() - startTime,
            timestamp: new Date().toISOString(),
          },
        } as ScrapeResponse,
        { status: 400 }
      );
    }
    
    // Parse the URL to identify the retailer
    const parsedUrl = parseProductUrl(body.url);
    
    // Check if the URL is valid
    if (!parsedUrl.isValid) {
      return NextResponse.json(
        {
          success: false,
          error: {
            message: parsedUrl.validationMessage || 'Invalid URL',
            code: 'INVALID_URL',
            details: { url: body.url },
          },
          meta: {
            url: body.url,
            retailer: null,
            responseTime: Date.now() - startTime,
            timestamp: new Date().toISOString(),
          },
        } as ScrapeResponse,
        { status: 400 }
      );
    }
    
    // Check if the retailer is supported
    if (!parsedUrl.retailer) {
      return NextResponse.json(
        {
          success: false,
          error: {
            message: 'Unsupported retailer',
            code: 'UNSUPPORTED_RETAILER',
            details: { url: body.url, domain: parsedUrl.domain },
          },
          meta: {
            url: body.url,
            retailer: null,
            responseTime: Date.now() - startTime,
            timestamp: new Date().toISOString(),
          },
        } as ScrapeResponse,
        { status: 400 }
      );
    }
    
    // Get the appropriate scraper for the retailer
    const scraper = getScraperForRetailer(
      parsedUrl.retailer,
      body.url,
      body.options || {}
    );
    
    // Check if a scraper was found
    if (!scraper) {
      return NextResponse.json(
        {
          success: false,
          error: {
            message: 'Failed to initialize scraper',
            code: 'SCRAPER_INIT_FAILED',
            details: { retailer: parsedUrl.retailer },
          },
          meta: {
            url: body.url,
            retailer: parsedUrl.retailer,
            responseTime: Date.now() - startTime,
            timestamp: new Date().toISOString(),
          },
        } as ScrapeResponse,
        { status: 500 }
      );
    }
    
    // Scrape the product data
    const result: ScrapingResult = await scraper.scrape();
    
    // Track the scraping result using the monitoring MCP server
    try {
      await trackScrapingResult({
        success: result.success,
        responseTime: result.responseTime,
        errorType: result.error?.code
      });
    } catch (error) {
      console.error('Failed to track scraping result:', error);
    }
    
    // If scraping failed, return the error
    if (!result.success || !result.data) {
      return NextResponse.json(
        {
          success: false,
          error: result.error || {
            message: 'Failed to scrape product data',
            code: 'SCRAPING_FAILED',
          },
          meta: {
            url: body.url,
            retailer: parsedUrl.retailer,
            responseTime: Date.now() - startTime,
            timestamp: new Date().toISOString(),
          },
        } as ScrapeResponse,
        { status: 500 }
      );
    }
    
    // Validate and normalize the price using the price-format MCP server
    const priceValidationResult = await validatePriceString(
      result.data.currentPrice.toString(),
      result.data.currency
    );
    
    const validatedPrice = priceValidationResult.isValid && priceValidationResult.value !== null
      ? priceValidationResult.value
      : result.data.currentPrice;
    
    // Update the product data with the validated price
    const productData: ProductData = {
      ...result.data,
      currentPrice: validatedPrice,
    };
    
    // Return the successful response
    return NextResponse.json(
      {
        success: true,
        data: productData,
        meta: {
          url: body.url,
          retailer: parsedUrl.retailer,
          responseTime: Date.now() - startTime,
          timestamp: new Date().toISOString(),
        },
      } as ScrapeResponse,
      { status: 200 }
    );
  } catch (error) {
    // Handle any unexpected errors
    console.error('Unexpected error in scrape API route:', error);
    
    return NextResponse.json(
      {
        success: false,
        error: {
          message: error instanceof Error ? error.message : 'An unexpected error occurred',
          code: 'UNEXPECTED_ERROR',
          details: error,
        },
        meta: {
          url: '',
          retailer: null,
          responseTime: Date.now() - startTime,
          timestamp: new Date().toISOString(),
        },
      } as ScrapeResponse,
      { status: 500 }
    );
  }
};

// Apply the SecuredApi middleware with customized settings
export const POST = withSecuredApi(handlePost, {
  csrfProtection: true, // Enable CSRF protection
  endpointType: 'scraping', // Use scraping-specific rate limits
  requiresAuth: false // Allow unauthenticated access for testing scrapers
});
