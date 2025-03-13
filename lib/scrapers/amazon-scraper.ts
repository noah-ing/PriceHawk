/**
 * Amazon Scraper Implementation
 * 
 * This module implements the scraper for Amazon product pages.
 * It extends the BaseScraper class and implements the scrape method.
 */

import * as cheerio from 'cheerio';
import axios from 'axios';
import { chromium } from 'playwright';
import { BaseScraper, ProductData, ScrapingResult } from './base-scraper';
import { extractProductId } from '../url-parser';
import { getBestProxy, reportProxyResult } from '../mcp-integration';

export class AmazonScraper extends BaseScraper {
  private productId: string | null;
  
  constructor(url: string, options = {}) {
    super(url, options);
    this.productId = extractProductId(url, 'AMAZON');
  }
  
  /**
   * Scrape Amazon product data
   * Uses a multi-strategy approach:
   * 1. Try direct HTTP request with Cheerio first (faster)
   * 2. Fall back to Playwright if needed (for JavaScript-rendered content)
   */
  async scrape(): Promise<ScrapingResult> {
    if (!this.productId) {
      return this.handleError(
        'Invalid Amazon product URL',
        'INVALID_URL',
        { url: this.url }
      );
    }
    
    const startTime = Date.now();
    
    try {
      // First attempt: Direct HTTP request with Cheerio (faster)
      const result = await this.scrapeWithCheerio();
      
      // If successful, return the result
      if (result.success && result.data) {
        return {
          ...result,
          responseTime: Date.now() - startTime
        };
      }
      
      // Second attempt: Use Playwright (for JavaScript-rendered content)
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
   * This is faster but may not work for all pages
   */
  private async scrapeWithCheerio(): Promise<ScrapingResult> {
    const startTime = Date.now();
    let proxyInfo = null;
    
    try {
      // Get proxy if enabled
      const proxy = this.options.useProxy ? await this.getProxy('amazon.com') : undefined;
      if (proxy) {
        proxyInfo = {
          url: `${proxy.protocol}://${proxy.host}:${proxy.port}`,
          domain: 'amazon.com'
        };
      }
      
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
      
      // Report successful proxy use if a proxy was used
      if (proxyInfo) {
        await reportProxyResult(
          proxyInfo.url,
          proxyInfo.domain,
          true,
          Date.now() - startTime
        );
      }
      
      // Load the HTML into Cheerio
      const $ = cheerio.load(response.data);
      
      // Extract product data
      const title = $('#productTitle').text().trim();
      
      // Handle different price selectors
      const priceElement = $('.a-price .a-offscreen').first();
      const priceString = priceElement.text().trim();
      
      // Try to find original price (if on sale)
      const originalPriceElement = $('.a-text-price .a-offscreen').first();
      const originalPriceString = originalPriceElement.text().trim();
      
      // Extract image URL
      const imageUrl = $('#landingImage').attr('src') || 
                       $('#imgBlkFront').attr('src') || 
                       $('#ebooksImgBlkFront').attr('src') || 
                       '';
      
      // Extract description
      const description = $('#productDescription p').text().trim() || 
                          $('#feature-bullets .a-list-item').map((i, el) => $(el).text().trim()).get().join(' ');
      
      // Check availability
      const availabilityText = $('#availability').text().trim();
      const availability = !availabilityText.toLowerCase().includes('unavailable') && 
                          !availabilityText.toLowerCase().includes('out of stock');
      
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
        retailer: 'Amazon',
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
      // Report failed proxy use if a proxy was used
      if (proxyInfo) {
        await reportProxyResult(
          proxyInfo.url,
          proxyInfo.domain,
          false,
          Date.now() - startTime
        ).catch(err => console.error('Failed to report proxy result:', err));
      }
      
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
   * This is slower but more reliable for JavaScript-heavy pages
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
      
      // Wait for product title to be visible
      await page.waitForSelector('#productTitle', { timeout: 5000 }).catch(() => {});
      
      // Extract product data
      const title = await page.$eval('#productTitle', el => el.textContent?.trim() || '')
        .catch(() => '');
      
      // Handle different price selectors
      const priceString = await page.$eval('.a-price .a-offscreen', el => el.textContent?.trim() || '')
        .catch(() => '');
      
      // Try to find original price (if on sale)
      const originalPriceString = await page.$eval('.a-text-price .a-offscreen', el => el.textContent?.trim() || '')
        .catch(() => '');
      
      // Extract image URL
      const imageUrl = await page.$eval('#landingImage, #imgBlkFront, #ebooksImgBlkFront', el => el.getAttribute('src') || '')
        .catch(() => '');
      
      // Extract description
      const description = await page.$eval('#productDescription p', el => el.textContent?.trim() || '')
        .catch(async () => {
          // Try alternative selector for bullet points
          return await page.$$eval('#feature-bullets .a-list-item', elements => 
            elements.map(el => el.textContent?.trim()).join(' ')
          ).catch(() => '');
        });
      
      // Check availability
      const availabilityText = await page.$eval('#availability', el => el.textContent?.trim() || '')
        .catch(() => '');
      const availability = !availabilityText.toLowerCase().includes('unavailable') && 
                          !availabilityText.toLowerCase().includes('out of stock');
      
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
        retailer: 'Amazon',
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
      // Get the best proxy for this domain
      const proxyInfo = await getBestProxy(domain);
      
      if (!proxyInfo) {
        return undefined;
      }
      
      // Return the proxy in the format expected by axios
      return {
        host: new URL(proxyInfo.proxyUrl).hostname,
        port: parseInt(new URL(proxyInfo.proxyUrl).port),
        protocol: new URL(proxyInfo.proxyUrl).protocol.replace(':', '')
      };
    } catch (error) {
      console.error('Failed to get proxy:', error);
      return undefined;
    }
  }
}
