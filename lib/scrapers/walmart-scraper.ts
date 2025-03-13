/**
 * Walmart Scraper Implementation
 * 
 * This module implements the scraper for Walmart product pages.
 * It extends the BaseScraper class and implements the scrape method.
 */

import * as cheerio from 'cheerio';
import axios from 'axios';
import { chromium } from 'playwright';
import { BaseScraper, ProductData, ScrapingResult } from './base-scraper';
import { extractProductId } from '../url-parser';

export class WalmartScraper extends BaseScraper {
  private productId: string | null;
  
  constructor(url: string, options = {}) {
    super(url, options);
    this.productId = extractProductId(url, 'WALMART');
  }
  
  /**
   * Scrape Walmart product data
   * Walmart heavily relies on JavaScript, so we primarily use Playwright
   * but attempt Cheerio first for performance
   */
  async scrape(): Promise<ScrapingResult> {
    if (!this.productId) {
      return this.handleError(
        'Invalid Walmart product URL',
        'INVALID_URL',
        { url: this.url }
      );
    }
    
    const startTime = Date.now();
    
    try {
      // First attempt: Direct HTTP request with Cheerio 
      const cheerioResult = await this.scrapeWithCheerio();
      
      // Check if we hit a "Robot or human?" challenge
      if (cheerioResult.error && 
          cheerioResult.error.details && 
          typeof cheerioResult.error.details === 'object' && 
          'title' in cheerioResult.error.details && 
          cheerioResult.error.details.title === 'Robot or human?') {
        // We hit a captcha or anti-bot page - return a clean error
        return {
          success: false,
          error: {
            message: 'Walmart anti-bot protection detected. Please try again later or try a different retailer.',
            code: 'WALMART_ANTI_BOT',
            details: { url: this.url }
          },
          responseTime: Date.now() - startTime
        };
      }
      
      // If successful, return the result
      if (cheerioResult.success && cheerioResult.data) {
        return {
          ...cheerioResult,
          responseTime: Date.now() - startTime
        };
      }
      
      // Second attempt: Use simplified Playwright approach
      // But don't try if we already hit anti-bot detection
      const playwrightResult = await this.scrapeWithPlaywright();
      
      // If we got the anti-bot detection here too, provide a clear message
      if (playwrightResult.error && 
          playwrightResult.error.message && 
          playwrightResult.error.message.includes('Anti-bot detection')) {
        return {
          success: false,
          error: {
            message: 'Walmart anti-bot protection detected. Please try again later or try a different retailer.',
            code: 'WALMART_ANTI_BOT',
            details: { url: this.url }
          },
          responseTime: Date.now() - startTime
        };
      }
      
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
   * This might work for some Walmart pages but is less reliable
   */
  private async scrapeWithCheerio(): Promise<ScrapingResult> {
    try {
      // Get proxy if enabled
      const proxy = this.options.useProxy ? await this.getProxy('walmart.com') : undefined;
      
      // Make the request with minimal headers to avoid overflow
      const response = await axios.get(this.url, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/121.0.0.0 Safari/537.36',
          'Accept': 'text/html',
        },
        timeout: this.options.timeout || 15000,
        proxy,
        maxContentLength: Infinity,
        maxBodyLength: Infinity,
      });
      
      // Load the HTML into Cheerio
      const $ = cheerio.load(response.data);
      
      // Extract product data
      // Walmart's selectors can change frequently, so we try multiple options
      
      // Title selectors - expanded list
      const title = $('[data-testid="product-title"]').text().trim() || 
                    $('h1.prod-ProductTitle').text().trim() ||
                    $('h1[itemprop="name"]').text().trim() ||
                    $('h1.w_iUH7').text().trim() || // New Walmart selector
                    $('h1.lh-copy').text().trim() || // Another possible selector
                    $('h1').first().text().trim(); // Last resort
      
      // Price selectors - expanded list
      let priceString = $('[data-testid="price-value"]').text().trim() ||
                        $('[itemprop="price"]').text().trim() ||
                        $('[data-automation-id="product-price"]').text().trim() ||
                        $('.b.black.f1.ma0').text().trim();
      
      // Try composite price if no direct price found
      if (!priceString) {
        const characteristic = $('span.price-characteristic').text().trim();
        const mantissa = $('span.price-mantissa').text().trim();
        if (characteristic && mantissa) {
          priceString = characteristic + '.' + mantissa;
        }
      }
      
      // Original price selectors (for discounted items) - expanded list
      const originalPriceString = $('span.strike-through-price').text().trim() ||
                                 $('[data-testid="was-price"]').text().trim() ||
                                 $('del').text().trim() ||
                                 $('s').text().trim();
      
      // Image URL - expanded list
      const imageUrl = $('img[data-testid="main-image"]').attr('src') ||
                       $('img.prod-hero-image').attr('src') ||
                       $('img[itemprop="image"]').attr('src') ||
                       $('img[data-automation-id="image-gallery-image"]').attr('src') ||
                       $('.cc-picture img').attr('src') ||
                       $('.high-res-image').attr('src') || '';
      
      // Description - expanded list
      const description = $('[data-testid="product-description"]').text().trim() ||
                          $('.about-product').text().trim() ||
                          $('[itemprop="description"]').text().trim() ||
                          $('.product-description-container').text().trim() ||
                          $('[data-automation-id="product-description"]').text().trim();
      
      // Availability - expanded list
      const availabilityText = $('[data-testid="availability-message"]').text().trim() ||
                              $('.prod-ProductOffer-oosMsg').text().trim() ||
                              $('[data-automation-id="out-of-stock-message"]').text().trim() ||
                              $('.availability-status').text().trim();
      
      // Determine availability
      let availability = true;
      if (availabilityText) {
        availability = !availabilityText.toLowerCase().includes('out of stock') &&
                      !availabilityText.toLowerCase().includes('unavailable');
      } else {
        // Check for add to cart button as fallback
        availability = $('[data-automation-id="add-to-cart"]').length > 0 ||
                      $('[data-tl-id="ProductPrimaryCTA-cta_add_to_cart"]').length > 0 ||
                      $('.add-to-cart-btn').length > 0;
      }
      
      // Format prices
      const currentPrice = this.formatPrice(priceString);
      const originalPrice = this.formatPrice(originalPriceString);
      const currency = this.extractCurrency(priceString) || 'USD';
      
      // If we couldn't extract essential data, return failure
      if (!title || currentPrice === null) {
        console.log('Cheerio extraction failed: Missing title or price', { title, currentPrice });
        return {
          success: false,
          error: {
            message: 'Failed to extract essential product data with Cheerio',
            code: 'CHEERIO_EXTRACTION_FAILED',
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
        retailer: 'Walmart',
        additionalInfo: {
          availabilityText,
          method: 'cheerio'
        }
      }, this.productId!);
      
      console.log('Cheerio extraction successful:', { title: title.substring(0, 30) + '...', price: currentPrice });
      
      return {
        success: true,
        data: productData,
        responseTime: 0 // Will be set by the caller
      };
    } catch (error) {
      console.error('Cheerio scraping failed:', error instanceof Error ? error.message : error);
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
   * This is more reliable for Walmart's JavaScript-heavy pages
   */
  private async scrapeWithPlaywright(): Promise<ScrapingResult> {
    let browser = null;
    let context = null;
    
    try {
      console.log('Starting Playwright for Walmart scraping...');
      
      // Launch browser with minimal configuration, following Amazon/BestBuy pattern
      browser = await chromium.launch({ 
        headless: true,
        timeout: 30000
      });
      
      // Simple context setup, similar to working scrapers
      context = await browser.newContext({
        userAgent: this.options.userAgent || 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0.0.0 Safari/537.36',
        viewport: { width: 1280, height: 800 }
      });
      
      // Create new page
      const page = await context.newPage();
      
      // Enable more verbose logging
      console.log(`Navigating to Walmart URL: ${this.url}`);
      page.on('console', msg => console.log(`Browser console [${msg.type()}]: ${msg.text()}`));
      page.on('pageerror', err => console.error(`Browser page error: ${err.message}`));
      page.on('requestfailed', request => console.error(`Request failed: ${request.url()} - ${request.failure()?.errorText}`));
      
      // Set extended timeout
      page.setDefaultTimeout(45000);
      
      // Navigate to URL with retries and better error handling
      let navigationSuccess = false;
      let navigationAttempts = 0;
      
      while (!navigationSuccess && navigationAttempts < 4) {
        try {
          navigationAttempts++;
          console.log(`Navigation attempt ${navigationAttempts} to ${this.url}`);
          
          // Add a random delay before navigation to avoid detection patterns
          await page.waitForTimeout(1000 + Math.random() * 2000);
          
          // First try with standard navigation
          await page.goto(this.url, { 
            waitUntil: 'domcontentloaded',
            timeout: 60000
          });
          
          // Check if we got redirected to a bot detection page
          const currentUrl = page.url();
          const pageContent = await page.content();
          
          if (currentUrl.includes('captcha') || 
              pageContent.includes('robot') || 
              pageContent.includes('captcha') ||
              pageContent.includes('unusual activity')) {
            console.log(`Detected anti-bot page, retrying with different approach`);
            throw new Error('Anti-bot detection triggered');
          }
          
          navigationSuccess = true;
          console.log('Navigation successful');
        } catch (navError) {
          console.error(`Navigation error (attempt ${navigationAttempts}): ${navError instanceof Error ? navError.message : 'Unknown error'}`);
          
          if (navigationAttempts >= 4) {
            throw navError;
          }
          
          // Increase wait time between retries (progressive backoff)
          await new Promise(resolve => setTimeout(resolve, 2000 * navigationAttempts));
          
          // Clear cookies and cache between attempts
          if (navigationAttempts > 1) {
            await context.clearCookies();
          }
        }
      }
      
      console.log('Waiting for page to settle...');
      
      // Wait for network to be mostly idle
      await page.waitForLoadState('networkidle', { timeout: 15000 }).catch(e => {
        console.warn('Network did not fully idle, continuing anyway:', e.message);
      });
      
      // Scroll multiple times to trigger lazy loading and ensure page is fully loaded
      for (let i = 1; i <= 5; i++) {
        await page.evaluate((scrollStep) => {
          window.scrollBy(0, scrollStep);
        }, i * 300);
        await page.waitForTimeout(500);
      }
      
      // Scroll back to top
      await page.evaluate(() => {
        window.scrollTo(0, 0);
      });
      
      console.log('Looking for product elements...');
      
      // Use an expanded list of selectors for Walmart
      const titleSelectors = [
        '[data-testid="product-title"]',
        'h1.prod-ProductTitle',
        'h1[itemprop="name"]',
        '.f3.fw6.lh-copy.dark-gray',
        '[data-automation-id="product-title"]',
        'h1.w_iUH7', // New Walmart selector
        'h1.lh-copy', // Another possible selector
        'h1', // Last resort
      ];
      
      const priceSelectors = [
        '[data-testid="price-value"]',
        '[itemprop="price"]',
        '[data-automation-id="product-price"]',
        'span.price-characteristic',
        '.b.black.f1.ma0',
        '.inline-flex.flex-wrap.items-baseline.mr1.mb2', // New Walmart price container
        '[data-testid="price-original"]', // Main price section
        '.w_L_mA' // Another price class
      ];
      
      // Wait for any title selector to appear (with longer timeout)
      console.log('Waiting for title element...');
      for (const selector of titleSelectors) {
        try {
          await page.waitForSelector(selector, { timeout: 10000 });
          console.log(`Found title selector: ${selector}`);
          break;
        } catch (e) {
          console.log(`Title selector not found: ${selector}`);
          continue;
        }
      }
      
      // Wait for any price selector to appear (with longer timeout)
      console.log('Waiting for price element...');
      let priceElementFound = false;
      for (const selector of priceSelectors) {
        try {
          await page.waitForSelector(selector, { timeout: 8000 });
          console.log(`Found price selector: ${selector}`);
          priceElementFound = true;
          break;
        } catch (e) {
          console.log(`Price selector not found: ${selector}`);
          continue;
        }
      }
      
      // Wait longer for any dynamic content to load
      await page.waitForTimeout(4000);
      
      console.log('Extracting product information...');
      
      // Extract title with retry and fallback mechanism
      let title = '';
      for (const selector of titleSelectors) {
        if (title) break;
        try {
          title = await page.$eval(selector, el => el.textContent?.trim() || '');
          if (title) console.log(`Extracted title using selector ${selector}: ${title.substring(0, 30)}...`);
        } catch (e) {
          console.log(`Failed to extract title with selector ${selector}`);
        }
      }
      
      // If still no title, try getting all h1 elements
      if (!title) {
        try {
          const allH1s = await page.$$eval('h1', elements => 
            elements.map(el => el.textContent?.trim() || '')
              .filter(text => text.length > 0)
          );
          
          if (allH1s.length > 0) {
            // Take the longest h1 as it's likely to be the product title
            title = allH1s.reduce((a, b) => a.length > b.length ? a : b);
            console.log(`Extracted title from all h1 elements: ${title.substring(0, 30)}...`);
          }
        } catch (e) {
          console.log('Failed to extract title from all h1 elements');
        }
      }
      
      // Extract price with multiple strategies
      let priceString = '';
      
      // Try direct price selectors first
      for (const selector of priceSelectors) {
        if (priceString) break;
        try {
          priceString = await page.$eval(selector, el => el.textContent?.trim() || '');
          if (priceString) console.log(`Extracted price using selector ${selector}: ${priceString}`);
        } catch (e) {
          console.log(`Failed to extract price with selector ${selector}`);
        }
      }
      
      // If direct extraction failed, try to find parts of the price
      if (!priceString) {
        try {
          const characteristic = await page.$eval('span.price-characteristic', el => el.textContent?.trim() || '');
          const mantissa = await page.$eval('span.price-mantissa', el => el.textContent?.trim() || '');
          if (characteristic && mantissa) {
            priceString = characteristic + '.' + mantissa;
            console.log(`Extracted composite price: ${priceString}`);
          }
        } catch (e) {
          console.log('Failed to extract composite price');
        }
      }
      
      // Last resort: try to find any element that looks like a price using regex
      if (!priceString) {
        try {
          priceString = await page.evaluate(() => {
            const priceRegex = /\$\d+(\.\d{2})?/;
            const elements = Array.from(document.querySelectorAll('*'));
            for (const element of elements) {
              const text = element.textContent || '';
              const match = text.match(priceRegex);
              if (match && match[0].length > 0 && 
                  !element.closest('del') && // Not a crossed-out price
                  !element.textContent?.includes('was') && // Not a "was" price
                  (element as HTMLElement).offsetWidth > 0) { // Is visible - cast to HTMLElement
                return match[0];
              }
            }
            return '';
          });
          
          if (priceString) console.log(`Extracted price using regex: ${priceString}`);
        } catch (e) {
          console.log('Failed to extract price using regex');
        }
      }
      
      // Extract other product information with robust error handling
      
      // Original price (for sale items)
      const originalPriceString = await page.$eval('span.strike-through-price, [data-testid="was-price"], del, s', 
        el => el.textContent?.trim() || '').catch(() => '');
      if (originalPriceString) console.log(`Extracted original price: ${originalPriceString}`);
      
      // Image URL with multiple selector attempts
      let imageUrl = '';
      const imageSelectors = [
        'img[data-testid="main-image"]',
        'img.prod-hero-image',
        'img[itemprop="image"]',
        'img[data-automation-id="image-gallery-image"]',
        '.cc-picture img',
        '.high-res-image'
      ];
      
      for (const selector of imageSelectors) {
        if (imageUrl) break;
        try {
          imageUrl = await page.$eval(selector, el => el.getAttribute('src') || '');
          if (imageUrl) console.log(`Extracted image URL using selector ${selector}`);
        } catch (e) {
          console.log(`Failed to extract image with selector ${selector}`);
        }
      }
      
      // If still no image, try fallback to any large image
      if (!imageUrl) {
        try {
          imageUrl = await page.evaluate(() => {
            const images = Array.from(document.querySelectorAll('img'));
            // Filter for likely product images (large, not icons)
            const productImages = images.filter(img => {
              const w = parseInt(img.getAttribute('width') || '0');
              const h = parseInt(img.getAttribute('height') || '0');
              return (w > 200 || h > 200) && 
                     img.src && 
                     !img.src.includes('icon') && 
                     !img.src.includes('logo');
            });
            return productImages.length > 0 ? productImages[0].src : '';
          });
          if (imageUrl) console.log(`Extracted image URL using fallback method`);
        } catch (e) {
          console.log('Failed to extract image URL using fallback');
        }
      }
      
      // Description with multiple selector attempts
      let description = '';
      const descriptionSelectors = [
        '[data-testid="product-description"]',
        '.about-product',
        '[itemprop="description"]',
        '.product-description-container',
        '[data-automation-id="product-description"]'
      ];
      
      for (const selector of descriptionSelectors) {
        if (description) break;
        try {
          description = await page.$eval(selector, el => el.textContent?.trim() || '');
          if (description) console.log(`Extracted description (truncated): ${description.substring(0, 30)}...`);
        } catch (e) {
          console.log(`Failed to extract description with selector ${selector}`);
        }
      }
      
      // Availability check with multiple methods
      let availabilityText = '';
      const availabilitySelectors = [
        '[data-testid="availability-message"]',
        '.prod-ProductOffer-oosMsg',
        '[data-automation-id="out-of-stock-message"]',
        '.availability-status'
      ];
      
      for (const selector of availabilitySelectors) {
        if (availabilityText) break;
        try {
          availabilityText = await page.$eval(selector, el => el.textContent?.trim() || '');
          if (availabilityText) console.log(`Extracted availability: ${availabilityText}`);
        } catch (e) {
          console.log(`Failed to extract availability with selector ${selector}`);
        }
      }
      
      // Fallback availability check - check for add to cart button
      if (!availabilityText) {
        try {
          const addToCartButton = await page.$('[data-automation-id="add-to-cart"], [data-tl-id="ProductPrimaryCTA-cta_add_to_cart"], .add-to-cart-btn');
          availabilityText = addToCartButton ? 'In Stock' : 'Out of Stock';
          console.log(`Determined availability based on cart button: ${availabilityText}`);
        } catch (e) {
          console.log('Failed to determine availability based on cart button');
          availabilityText = 'Unknown';
        }
      }
      
      // Determine availability boolean
      const availability = !availabilityText.toLowerCase().includes('out of stock') &&
                          !availabilityText.toLowerCase().includes('unavailable') &&
                          availabilityText !== 'Unknown';
      
      // Format prices
      const currentPrice = this.formatPrice(priceString);
      const originalPrice = this.formatPrice(originalPriceString);
      const currency = this.extractCurrency(priceString) || 'USD';
      
      // Take screenshot for debugging if needed
      // const screenshotBuffer = await page.screenshot({ fullPage: true });
      // Save to file or analyze for debugging purposes
      
      // Close browser resources
      await context.close();
      await browser.close();
      browser = null;
      
      // If we couldn't extract essential data, return failure
      if (!title || currentPrice === null) {
        console.error('Playwright extraction failed: Missing title or price', { title, priceString, currentPrice });
        return {
          success: false,
          error: {
            message: 'Failed to extract essential product data with Playwright',
            code: 'PLAYWRIGHT_EXTRACTION_FAILED',
            details: { 
              title, 
              currentPrice,
              url: this.url,
              // If needed for debugging:
              // priceSelectors,
              // titleSelectors
            }
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
        retailer: 'Walmart',
        additionalInfo: {
          availabilityText,
          method: 'playwright'
        }
      }, this.productId!);
      
      console.log('Playwright extraction successful:', {
        title: title.substring(0, 30) + '...',
        price: currentPrice,
        currency
      });
      
      return {
        success: true,
        data: productData,
        responseTime: 0 // Will be set by the caller
      };
    } catch (error) {
      console.error('Playwright scraping failed:', error instanceof Error ? error.message : error);
      return {
        success: false,
        error: {
          message: 'Playwright scraping failed: ' + (error instanceof Error ? error.message : 'Unknown error'),
          code: 'PLAYWRIGHT_FAILED',
          details: error instanceof Error ? error.message : error
        },
        responseTime: 0
      };
    } finally {
      // Ensure resources are closed
      if (context) {
        await context.close().catch(() => {});
      }
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
