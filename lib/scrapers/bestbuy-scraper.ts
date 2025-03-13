/**
 * Best Buy Scraper Implementation
 * 
 * This module implements the scraper for Best Buy product pages.
 * It extends the BaseScraper class and implements the scrape method.
 */

import * as cheerio from 'cheerio';
import axios from 'axios';
import { chromium } from 'playwright';
import { BaseScraper, ProductData, ScrapingResult } from './base-scraper';
import { extractProductId } from '../url-parser';

export class BestBuyScraper extends BaseScraper {
  private productId: string | null;
  
  constructor(url: string, options = {}) {
    super(url, options);
    this.productId = extractProductId(url, 'BESTBUY');
  }
  
  /**
   * Scrape Best Buy product data
   * Best Buy uses a mix of server-rendered and client-rendered content,
   * so we try both Cheerio and Playwright approaches
   */
  async scrape(): Promise<ScrapingResult> {
    if (!this.productId) {
      return this.handleError(
        'Invalid Best Buy product URL',
        'INVALID_URL',
        { url: this.url }
      );
    }
    
    const startTime = Date.now();
    
    try {
      // First attempt: Direct HTTP request with Cheerio
      const cheerioResult = await this.scrapeWithCheerio();
      
      // If successful, return the result
      if (cheerioResult.success && cheerioResult.data) {
        return {
          ...cheerioResult,
          responseTime: Date.now() - startTime
        };
      }
      
      // Second attempt: Use Playwright for JavaScript-rendered content
      const playwrightResult = await this.scrapeWithPlaywright();
      return {
        ...playwrightResult,
        responseTime: Date.now() - startTime
      };
    } catch (error) {
      return {
        success: false,
        error: {
          message: error instanceof Error ? error.message : 'Unknown error occurred',
          code: 'SCRAPING_ERROR',
          details: error
        },
        responseTime: Date.now() - startTime
      };
    }
  }
  
  /**
   * Scrape using direct HTTP request and Cheerio
   */
  private async scrapeWithCheerio(): Promise<ScrapingResult> {
    try {
      // Get proxy if enabled
      const proxy = this.options.useProxy ? await this.getProxy('bestbuy.com') : undefined;
      
      // Make the request
      const response = await axios.get(this.url, {
        headers: {
          'User-Agent': this.options.userAgent,
          'Accept': 'text/html,application/xhtml+xml,application/xml',
          'Accept-Language': 'en-US,en;q=0.9',
        },
        timeout: this.options.timeout,
        proxy,
      });
      
      // Load the HTML into Cheerio
      const $ = cheerio.load(response.data);
      
      // Extract product data
      // Best Buy's selectors can change, so we try multiple options
      
      // Title selectors
      const title = $('.sku-title h1').text().trim() ||
                    $('h1[data-track="product-title"]').text().trim() ||
                    $('h1.heading-5').text().trim();
      
      // Price selectors
      const priceString = $('.priceView-customer-price span').first().text().trim() ||
                          $('.priceView-hero-price span').first().text().trim() ||
                          $('.pricing-price__regular-price').text().trim();
      
      // Original price selectors (for discounted items)
      const originalPriceString = $('.pricing-price__regular-price').text().trim() ||
                                 $('.pricing-price__was-price').text().trim() ||
                                 $('.pricing-price__savings-price').text().trim();
      
      // Image URL
      const imageUrl = $('.primary-image').attr('src') ||
                       $('img.picture-wrapper img').attr('src') ||
                       $('img.product-image').attr('src') || '';
      
      // Description
      const description = $('.product-description').text().trim() ||
                          $('.long-description').text().trim() ||
                          $('.product-data-value').text().trim();
      
      // Availability
      const availabilityText = $('.fulfillment-add-to-cart-button').text().trim() ||
                              $('.fulfillment-fulfillment-summary').text().trim();
      const availability = !availabilityText.toLowerCase().includes('sold out') &&
                          !availabilityText.toLowerCase().includes('unavailable');
      
      // Format prices
      const currentPrice = this.formatPrice(priceString);
      const originalPrice = this.formatPrice(originalPriceString);
      const currency = this.extractCurrency(priceString);
      
      // If we couldn't extract essential data, return failure
      if (!title || currentPrice === null) {
        return {
          success: false,
          error: {
            message: 'Failed to extract essential product data',
            code: 'EXTRACTION_FAILED',
            details: { title, currentPrice }
          },
          responseTime: 0
        };
      }
      
      // Normalize and return the data
      const productData = this.normalizeProductData({
        title,
        currentPrice,
        originalPrice: originalPrice || undefined,
        currency,
        imageUrl,
        description,
        availability,
        retailer: 'Best Buy',
        additionalInfo: {
          availabilityText,
        }
      }, this.productId!);
      
      return {
        success: true,
        data: productData,
        responseTime: 0 // Will be set by the caller
      };
    } catch (error) {
      // If Cheerio scraping fails, we'll try Playwright next
      return {
        success: false,
        error: {
          message: 'Cheerio scraping failed',
          code: 'CHEERIO_FAILED',
          details: error instanceof Error ? error.message : error
        },
        responseTime: 0
      };
    }
  }
  
  /**
   * Scrape using Playwright headless browser
   */
  private async scrapeWithPlaywright(): Promise<ScrapingResult> {
    let browser = null;
    
    try {
      // Launch browser
      browser = await chromium.launch({ headless: true });
      const context = await browser.newContext({
        userAgent: this.options.userAgent,
        viewport: { width: 1280, height: 800 }
      });
      
      // Create new page
      const page = await context.newPage();
      
      // Set timeout
      page.setDefaultTimeout(this.options.timeout || 10000);
      
      // Navigate to URL
      await page.goto(this.url, { waitUntil: 'domcontentloaded' });
      
      // Wait for product title to be visible (try multiple selectors)
      await Promise.race([
        page.waitForSelector('.sku-title h1', { timeout: 5000 }).catch(() => {}),
        page.waitForSelector('h1[data-track="product-title"]', { timeout: 5000 }).catch(() => {}),
        page.waitForSelector('h1.heading-5', { timeout: 5000 }).catch(() => {})
      ]);
      
      // Wait a bit for dynamic content to load
      await page.waitForTimeout(1000);
      
      // Extract product data
      const title = await page.$eval('.sku-title h1, h1[data-track="product-title"], h1.heading-5', 
        el => el.textContent?.trim() || '').catch(() => '');
      
      // Handle different price selectors
      const priceString = await page.$eval('.priceView-customer-price span, .priceView-hero-price span, .pricing-price__regular-price', 
        el => el.textContent?.trim() || '').catch(() => '');
      
      // Try to find original price (if on sale)
      const originalPriceString = await page.$eval('.pricing-price__regular-price, .pricing-price__was-price, .pricing-price__savings-price', 
        el => el.textContent?.trim() || '').catch(() => '');
      
      // Extract image URL
      const imageUrl = await page.$eval('.primary-image, img.picture-wrapper img, img.product-image', 
        el => el.getAttribute('src') || '').catch(() => '');
      
      // Extract description
      const description = await page.$eval('.product-description, .long-description, .product-data-value', 
        el => el.textContent?.trim() || '').catch(() => '');
      
      // Check availability
      const availabilityText = await page.$eval('.fulfillment-add-to-cart-button, .fulfillment-fulfillment-summary', 
        el => el.textContent?.trim() || '').catch(() => '');
      const availability = !availabilityText.toLowerCase().includes('sold out') &&
                          !availabilityText.toLowerCase().includes('unavailable');
      
      // Format prices
      const currentPrice = this.formatPrice(priceString);
      const originalPrice = this.formatPrice(originalPriceString);
      const currency = this.extractCurrency(priceString);
      
      // Close browser
      await browser.close();
      browser = null;
      
      // If we couldn't extract essential data, return failure
      if (!title || currentPrice === null) {
        return {
          success: false,
          error: {
            message: 'Failed to extract essential product data with Playwright',
            code: 'PLAYWRIGHT_EXTRACTION_FAILED',
            details: { title, currentPrice }
          },
          responseTime: 0
        };
      }
      
      // Normalize and return the data
      const productData = this.normalizeProductData({
        title,
        currentPrice,
        originalPrice: originalPrice || undefined,
        currency,
        imageUrl,
        description,
        availability,
        retailer: 'Best Buy',
        additionalInfo: {
          availabilityText,
        }
      }, this.productId!);
      
      return {
        success: true,
        data: productData,
        responseTime: 0 // Will be set by the caller
      };
    } catch (error) {
      return {
        success: false,
        error: {
          message: 'Playwright scraping failed',
          code: 'PLAYWRIGHT_FAILED',
          details: error instanceof Error ? error.message : error
        },
        responseTime: 0
      };
    } finally {
      // Ensure browser is closed
      if (browser) {
        await browser.close().catch(() => {});
      }
    }
  }
  
  /**
   * Get a proxy for the specified domain
   * Uses the proxy-management MCP server
   */
  private async getProxy(domain: string): Promise<any> {
    try {
      // This would be implemented using the proxy-management MCP server
      // For now, return undefined to use direct connection
      return undefined;
    } catch (error) {
      console.error('Failed to get proxy:', error);
      return undefined;
    }
  }
}
