import { Prisma } from '@prisma/client';
import { productRepository } from '../db/repositories/product-repository';
import { priceHistoryRepository } from '../db/repositories/price-history-repository';
import { alertRepository } from '../db/repositories/alert-repository';
import { userRepository } from '../db/repositories/user-repository';
import { parseProductUrl } from '../url-parser';
import { getScraperForUrl, ProductData } from '../scrapers';
import { notificationService, NotificationType } from './notification-service';

// Define Product type until Prisma client is properly generated
type Product = {
  id: string;
  title: string;
  description?: string | null;
  imageUrl?: string | null;
  url: string;
  retailer: string;
  productId: string;
  currentPrice: number;
  currency: string;
  createdAt: Date;
  updatedAt: Date;
  userId: string;
};

/**
 * Service for product-related operations
 */
export class ProductService {
  /**
   * Add a product from a URL
   * This method parses the URL, scrapes the product data, and saves it to the database
   */
  async addProductFromUrl(url: string, userId: string): Promise<Product> {
    try {
      // Parse the URL to get retailer and product ID
      const parsedUrl = parseProductUrl(url);
      if (!parsedUrl.isValid || !parsedUrl.retailer || !parsedUrl.productId) {
        throw new Error('Invalid or unsupported product URL');
      }

      // Check if the product already exists for this retailer and product ID
      const existingProduct = await productRepository.findByRetailerAndProductId(
        parsedUrl.retailer,
        parsedUrl.productId
      );

      // If the product exists and belongs to this user, return it
      if (existingProduct && existingProduct.userId === userId) {
        console.log(`[ProductService] Product already exists for user, returning existing product: ${existingProduct.id}`);
        return existingProduct;
      }

      // If the product exists but belongs to a different user
      // We need to use a modified productId to avoid unique constraint errors
      let uniqueProductId = parsedUrl.productId;
      if (existingProduct) {
        console.log(`[ProductService] Product already exists but for a different user. Creating unique variant.`);
        // Add user-specific suffix to make it unique
        uniqueProductId = `${parsedUrl.productId}-user-${userId.slice(0, 8)}`;
      }

      // Get the appropriate scraper for this URL
      const scraper = getScraperForUrl(url);
      if (!scraper) {
        throw new Error(`No scraper available for ${parsedUrl.retailer}`);
      }

      // Scrape the product data
      let scrapedData: ProductData;
      
      if (existingProduct) {
        // Use data from existing product (with required fields for ProductData)
        scrapedData = {
          title: existingProduct.title,
          description: existingProduct.description || '',
          imageUrl: existingProduct.imageUrl || '',
          currentPrice: existingProduct.currentPrice,
          currency: existingProduct.currency,
          availability: true,
          retailer: existingProduct.retailer,
          productUrl: existingProduct.url,
          productId: existingProduct.productId,
          timestamp: new Date().toISOString()
        };
        console.log(`[ProductService] Using existing product data: ${scrapedData.title}`);
      } else {
        // Scrape the product data
        const scrapingResult = await scraper.scrape();
        if (!scrapingResult.success || !scrapingResult.data) {
          throw new Error('Failed to scrape product data');
        }
        scrapedData = scrapingResult.data;
        console.log(`[ProductService] Successfully scraped new product: ${scrapedData.title}`);
      }

      // Create the product in the database with try/catch for better error handling
      try {
        const product = await productRepository.create({
          title: scrapedData.title,
          description: scrapedData.description || null,
          imageUrl: scrapedData.imageUrl,
          url: url,
          retailer: parsedUrl.retailer,
          productId: uniqueProductId,
          currentPrice: scrapedData.currentPrice,
          currency: scrapedData.currency,
          userId,
        });
        
        console.log(`[ProductService] Successfully created product: ${product.id}`);
        
        // Record the initial price in price history
        await priceHistoryRepository.recordPrice(
          product.id,
          scrapedData.currentPrice,
          scrapedData.currency
        );
        
        return product;
      } catch (error) {
        console.error(`[ProductService] Failed to create product:`, error);
        
        // If we still encounter a unique constraint error, use a timestamp to make it unique
        if ((error as any)?.code === 'P2002') {
          console.log(`[ProductService] Retrying with timestamp-based unique ID`);
          const timestamp = Date.now().toString();
          uniqueProductId = `${parsedUrl.productId}-${timestamp}`;
          
          const product = await productRepository.create({
            title: scrapedData.title,
            description: scrapedData.description || null,
            imageUrl: scrapedData.imageUrl,
            url: url,
            retailer: parsedUrl.retailer,
            productId: uniqueProductId,
            currentPrice: scrapedData.currentPrice,
            currency: scrapedData.currency,
            userId,
          });
          
          // Record the initial price in price history
          await priceHistoryRepository.recordPrice(
            product.id,
            scrapedData.currentPrice,
            scrapedData.currency
          );
          
          return product;
        }
        
        throw error;
      }
    } catch (error) {
      console.error(`[ProductService] Error in addProductFromUrl:`, error);
      throw error;
    }
  }

  /**
   * Get products for a user with pagination support
   * @param userId The user ID 
   * @param page Optional page number (1-based)
   * @param pageSize Optional number of items per page
   * @param orderBy Optional field to order by
   * @param orderDirection Optional order direction ('asc' or 'desc')
   * @returns Object containing products and pagination metadata
   */
  async getProductsForUser(
    userId: string,
    page?: number,
    pageSize?: number,
    orderBy?: string,
    orderDirection?: 'asc' | 'desc'
  ): Promise<{
    products: Product[];
    pagination: {
      total: number;
      pageCount: number;
      page: number;
      pageSize: number;
    };
  }> {
    return productRepository.findByUserId(
      userId,
      page,
      pageSize,
      orderBy,
      orderDirection
    );
  }

  /**
   * Get a product by ID
   */
  async getProductById(id: string): Promise<Product | null> {
    return productRepository.findById(id);
  }

  /**
   * Delete a product
   */
  async deleteProduct(id: string, userId: string): Promise<boolean> {
    const product = await productRepository.findById(id);
    if (!product || product.userId !== userId) {
      throw new Error('Product not found or access denied');
    }

    return productRepository.delete(id);
  }

  /**
   * Update product price
   * This method scrapes the current price and updates the product and price history
   */
  async updateProductPrice(id: string): Promise<Product> {
    const product = await productRepository.findById(id);
    if (!product) {
      throw new Error('Product not found');
    }

    // Get the appropriate scraper for this product
    const scraper = getScraperForUrl(product.url);
    if (!scraper) {
      throw new Error(`No scraper available for ${product.retailer}`);
    }

    // Scrape the current price
    const scrapingResult = await scraper.scrape();
    if (!scrapingResult.success || !scrapingResult.data) {
      throw new Error('Failed to scrape product data');
    }
    
    const scrapedData = scrapingResult.data;

    // Check if the price has changed
    if (scrapedData.currentPrice !== product.currentPrice) {
      const oldPrice = product.currentPrice;
      const newPrice = scrapedData.currentPrice;
      
      // Update the product with the new price
      const updatedProduct = await productRepository.updatePrice(
        id,
        newPrice,
        scrapedData.currency
      );

      // Record the new price in price history
      await priceHistoryRepository.recordPrice(
        id,
        newPrice,
        scrapedData.currency
      );

      // Check for alerts that should be triggered
      const alertsToTrigger = await alertRepository.findAlertsToTrigger(id, newPrice);
      
      // Mark alerts as triggered and send notifications
      for (const alert of alertsToTrigger) {
        await alertRepository.markAsTriggered(alert.id);
        
        // Get the user who created this alert
        const alertUser = await userRepository.findById(alert.userId);
        if (alertUser) {
          // Send alert triggered notification
          await notificationService.sendNotification({
            type: NotificationType.ALERT_TRIGGERED,
            user: alertUser,
            data: {
              alert,
              product: updatedProduct
            }
          });
        }
      }
      
      // Send price drop notification if price decreased
      if (newPrice < oldPrice) {
        const user = await userRepository.findById(updatedProduct.userId);
        if (user) {
          await notificationService.sendNotification({
            type: NotificationType.PRICE_DROP,
            user,
            data: {
              product: updatedProduct,
              oldPrice,
              newPrice
            }
          });
        }
      }

      return updatedProduct;
    }

    return product;
  }

  /**
   * Get price history for a product
   */
  async getPriceHistory(productId: string, limit?: number): Promise<any[]> {
    return priceHistoryRepository.findByProductId(productId, limit);
  }

  /**
   * Get price statistics for a product
   */
  async getPriceStats(productId: string): Promise<{
    lowest: number | null;
    highest: number | null;
    average: number | null;
  }> {
    const lowest = await priceHistoryRepository.getLowestPrice(productId);
    const highest = await priceHistoryRepository.getHighestPrice(productId);
    const average = await priceHistoryRepository.getAveragePrice(productId);

    return {
      lowest,
      highest,
      average,
    };
  }

  /**
   * Check prices for multiple products
   * Used for batch processing in scheduled jobs
   */
  async checkPricesForProducts(productIds: string[]): Promise<Product[]> {
    const updatedProducts: Product[] = [];

    for (const id of productIds) {
      try {
        const updatedProduct = await this.updateProductPrice(id);
        updatedProducts.push(updatedProduct);
      } catch (error) {
        console.error(`Error updating price for product ${id}:`, error);
        // Continue with the next product
      }
    }

    return updatedProducts;
  }

  /**
   * Get products due for price check
   */
  async getProductsDueForCheck(limit: number = 10): Promise<Product[]> {
    return productRepository.getProductsDueForCheck(limit);
  }
}

// Export singleton instance
export const productService = new ProductService();
