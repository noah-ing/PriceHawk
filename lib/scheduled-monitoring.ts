/**
 * Scheduled Monitoring System
 * 
 * This module provides a comprehensive scheduled monitoring system for checking prices
 * of tracked products at regular intervals, with robust logging, error handling,
 * and notification capabilities.
 */

import cron from 'node-cron';
import { productService, notificationService, NotificationType } from './services';
import { userRepository } from './db/repositories/user-repository';
import { trackScrapingResult, trackPriceChange } from './mcp-integration';

// Flag to track if the monitoring system is running
let isMonitoringActive = false;

// Store the cron job instances
const cronJobs: { [key: string]: cron.ScheduledTask } = {};

// Store price changes for weekly summary
const weeklyPriceChanges: {
  productId: string;
  oldPrice: number;
  newPrice: number;
  timestamp: string;
}[] = [];

/**
 * Start the scheduled monitoring system
 * @param options Configuration options for the monitoring system
 */
export function startMonitoring(options: {
  hourlyLimit?: number;
  dailyLimit?: number;
  enableNotifications?: boolean;
} = {}) {
  if (isMonitoringActive) {
    console.log('Monitoring system is already running');
    return;
  }

  const {
    hourlyLimit = 50,
    dailyLimit = 1000,
    enableNotifications = true,
  } = options;

  console.log('Starting scheduled monitoring system with options:', {
    hourlyLimit,
    dailyLimit,
    enableNotifications,
  });

  // Schedule hourly price checks
  // Run every hour at minute 0
  cronJobs.hourly = cron.schedule('0 * * * *', async () => {
    console.log('Running hourly price check');
    await runPriceCheck(hourlyLimit);
  });

  // Schedule daily full scan
  // Run every day at 2:00 AM
  cronJobs.daily = cron.schedule('0 2 * * *', async () => {
    console.log('Running daily full scan');
    await runPriceCheck(dailyLimit);
  });
  
  // Schedule weekly summary
  // Run every Sunday at 9:00 AM
  cronJobs.weekly = cron.schedule('0 9 * * 0', async () => {
    console.log('Sending weekly summary notifications');
    await sendWeeklySummary();
  });

  isMonitoringActive = true;
  console.log('Scheduled monitoring system started');
}

/**
 * Stop the scheduled monitoring system
 */
export function stopMonitoring() {
  if (!isMonitoringActive) {
    console.log('Monitoring system is not running');
    return;
  }

  // Stop all cron jobs
  Object.values(cronJobs).forEach(job => job.stop());

  isMonitoringActive = false;
  console.log('Scheduled monitoring system stopped');
}

// Maximum number of retry attempts for failed price checks
const MAX_RETRY_ATTEMPTS = 3;

// Delay between retry attempts (in milliseconds)
const RETRY_DELAY = 5000; // 5 seconds

/**
 * Run a price check for products
 * @param limit Maximum number of products to check
 * @param retryFailedChecks Whether to retry failed price checks
 * @param notifyAdmins Whether to send notifications to admin users
 */
async function runPriceCheck(
  limit: number,
  retryFailedChecks: boolean = true,
  notifyAdmins: boolean = true
) {
  try {
    console.log(`Starting price check with limit: ${limit}`);
    
    // Get products due for check
    const products = await productService.getProductsDueForCheck(limit);
    
    if (products.length === 0) {
      console.log('No products due for price check');
      return {
        productsChecked: 0,
        priceChanges: 0,
        responseTime: 0,
        errors: 0,
      };
    }
    
    console.log(`Checking prices for ${products.length} products`);
    
    // Extract product IDs
    const productIds = products.map(product => product.id);
    
    // Start time for performance tracking
    const startTime = Date.now();
    
    // Track successful and failed checks
    const successfulChecks: string[] = [];
    const failedChecks: { id: string; error: string; retryCount: number }[] = [];
    
    // Check prices for products
    const updatedProducts = await productService.checkPricesForProducts(productIds);
    
    // End time for performance tracking
    const endTime = Date.now();
    const responseTime = endTime - startTime;
    
    // Count price changes and track successful/failed checks
    let priceChanges = 0;
    const priceChangeDetails: { productId: string; oldPrice: number; newPrice: number }[] = [];
    
    // Track price changes and log them
    for (let i = 0; i < updatedProducts.length; i++) {
      const product = updatedProducts[i];
      const originalProduct = products[i];
      
      if (!product) {
        // This product check failed
        failedChecks.push({
          id: originalProduct.id,
          error: 'Failed to update price',
          retryCount: 0,
        });
        continue;
      }
      
      // Mark as successful
      successfulChecks.push(product.id);
      
      if (product.currentPrice !== originalProduct.currentPrice) {
        priceChanges++;
        
        console.log(`Price change detected for ${product.title}: ${originalProduct.currentPrice} -> ${product.currentPrice}`);
        
        // Store price change details for weekly summary
        const priceChangeDetail = {
          productId: product.id,
          oldPrice: originalProduct.currentPrice,
          newPrice: product.currentPrice,
        };
        
        priceChangeDetails.push(priceChangeDetail);
        
        // Store for weekly summary
        storePriceChangeForWeeklySummary(
          product.id,
          originalProduct.currentPrice,
          product.currentPrice
        );
        
        // Track price change with MCP server
        try {
          await trackPriceChange({
            itemId: product.id,
            oldPrice: originalProduct.currentPrice,
            newPrice: product.currentPrice,
            timestamp: new Date().toISOString(),
          });
        } catch (error) {
          console.error('Error tracking price change:', error);
        }
      }
    }
    
    // Retry failed checks if enabled
    if (retryFailedChecks && failedChecks.length > 0) {
      console.log(`Retrying ${failedChecks.length} failed price checks...`);
      
      for (const failedCheck of failedChecks) {
        let retrySuccessful = false;
        
        // Try up to MAX_RETRY_ATTEMPTS times
        for (let attempt = 1; attempt <= MAX_RETRY_ATTEMPTS; attempt++) {
          if (failedCheck.retryCount >= MAX_RETRY_ATTEMPTS) {
            break;
          }
          
          failedCheck.retryCount++;
          
          console.log(`Retry attempt ${attempt} for product ${failedCheck.id}`);
          
          try {
            // Wait before retrying
            await new Promise(resolve => setTimeout(resolve, RETRY_DELAY));
            
            // Try to update the price again
            const originalProduct = products.find(p => p.id === failedCheck.id);
            if (!originalProduct) continue;
            
            const updatedProduct = await productService.updateProductPrice(failedCheck.id);
            
            // Check if price changed
            if (updatedProduct.currentPrice !== originalProduct.currentPrice) {
              priceChanges++;
              
              console.log(`Price change detected on retry for ${updatedProduct.title}: ${originalProduct.currentPrice} -> ${updatedProduct.currentPrice}`);
              
              // Store price change details for weekly summary
              const priceChangeDetail = {
                productId: updatedProduct.id,
                oldPrice: originalProduct.currentPrice,
                newPrice: updatedProduct.currentPrice,
              };
              
              priceChangeDetails.push(priceChangeDetail);
              
              // Store for weekly summary
              storePriceChangeForWeeklySummary(
                updatedProduct.id,
                originalProduct.currentPrice,
                updatedProduct.currentPrice
              );
              
              // Track price change with MCP server
              try {
                await trackPriceChange({
                  itemId: updatedProduct.id,
                  oldPrice: originalProduct.currentPrice,
                  newPrice: updatedProduct.currentPrice,
                  timestamp: new Date().toISOString(),
                });
              } catch (error) {
                console.error('Error tracking price change:', error);
              }
            }
            
            // Mark as successful
            successfulChecks.push(failedCheck.id);
            retrySuccessful = true;
            break;
          } catch (error) {
            console.error(`Retry attempt ${attempt} failed for product ${failedCheck.id}:`, error);
          }
        }
        
        if (!retrySuccessful) {
          console.error(`All retry attempts failed for product ${failedCheck.id}`);
        }
      }
    }
    
    // Calculate final stats
    const finalSuccessCount = successfulChecks.length;
    const finalFailureCount = productIds.length - finalSuccessCount;
    
    // Track scraping result with MCP server
    try {
      await trackScrapingResult({
        success: finalFailureCount === 0,
        responseTime,
        errorType: finalFailureCount > 0 ? `${finalFailureCount} products failed to update` : null,
      });
    } catch (error) {
      console.error('Error tracking scraping result:', error);
    }
    
    console.log(`Price check completed: ${finalSuccessCount} products checked successfully, ${finalFailureCount} failures, ${priceChanges} price changes detected`);
    
    // Send notification to admin users if there were failures and notifications are enabled
    if (notifyAdmins && finalFailureCount > 0) {
      try {
        // Get admin users
        const adminUsers = await userRepository.findAdminUsers();
        
        // Send notification to each admin
        for (const admin of adminUsers) {
          await notificationService.sendNotification({
            type: NotificationType.SYSTEM_NOTIFICATION,
            user: admin,
            data: {
              subject: 'Price Check Failures Detected',
              message: `${finalFailureCount} out of ${productIds.length} price checks failed. Please check the system logs for more details.`,
            },
          });
        }
      } catch (error) {
        console.error('Error sending admin notifications:', error);
      }
    }
    
    // Return the results
    return {
      productsChecked: finalSuccessCount,
      priceChanges,
      responseTime,
      errors: finalFailureCount,
      priceChangeDetails,
    };
  } catch (error) {
    console.error('Error running price check:', error);
    
    // Track scraping result with MCP server
    try {
      await trackScrapingResult({
        success: false,
        responseTime: 0,
        errorType: error instanceof Error ? error.message : 'Unknown error',
      });
    } catch (trackingError) {
      console.error('Error tracking scraping result:', trackingError);
    }
    
    // Send notification to admin users
    try {
      // Get admin users
      const adminUsers = await userRepository.findAdminUsers();
      
      // Send notification to each admin
      for (const admin of adminUsers) {
        await notificationService.sendNotification({
          type: NotificationType.SYSTEM_NOTIFICATION,
          user: admin,
          data: {
            subject: 'Critical Price Check Error',
            message: `A critical error occurred during the scheduled price check: ${error instanceof Error ? error.message : 'Unknown error'}`,
          },
        });
      }
    } catch (notifyError) {
      console.error('Error sending admin notifications:', notifyError);
    }
    
    // Return error information
    return {
      productsChecked: 0,
      priceChanges: 0,
      responseTime: 0,
      errors: 1,
      errorMessage: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * Check if the monitoring system is running
 * @returns True if the monitoring system is running, false otherwise
 */
export function isMonitoringRunning() {
  return isMonitoringActive;
}

/**
 * Run a manual price check
 * @param limit Maximum number of products to check
 * @param retryFailedChecks Whether to retry failed price checks
 * @param notifyAdmins Whether to send notifications to admin users
 * @returns Results of the price check
 */
export async function runManualPriceCheck(
  limit: number = 10,
  retryFailedChecks: boolean = true,
  notifyAdmins: boolean = true
) {
  console.log(`Running manual price check for up to ${limit} products (retry: ${retryFailedChecks}, notify: ${notifyAdmins})`);
  return runPriceCheck(limit, retryFailedChecks, notifyAdmins);
}

/**
 * Store a price change for the weekly summary
 * @param productId The ID of the product
 * @param oldPrice The old price
 * @param newPrice The new price
 */
export function storePriceChangeForWeeklySummary(
  productId: string,
  oldPrice: number,
  newPrice: number
) {
  weeklyPriceChanges.push({
    productId,
    oldPrice,
    newPrice,
    timestamp: new Date().toISOString(),
  });
}

/**
 * Send weekly summary notifications to users
 */
async function sendWeeklySummary() {
  try {
    console.log('Preparing weekly summary notifications...');
    
    // Skip if there are no price changes
    if (weeklyPriceChanges.length === 0) {
      console.log('No price changes to report in weekly summary');
      return;
    }
    
    // Get all users
    const users = await userRepository.findAll();
    
    // Group price changes by user
    const userProductMap = new Map<string, string[]>();
    
    // Get all products for each user
    for (const user of users) {
      const userProducts = await productService.getProductsForUser(user.id);
      userProductMap.set(user.id, userProducts.map(product => product.id));
    }
    
    // Send summary to each user
    for (const user of users) {
      // Get the user's products
      const userProductIds = userProductMap.get(user.id) || [];
      
      // Filter price changes for this user's products
      const userPriceChanges = weeklyPriceChanges.filter(change => 
        userProductIds.includes(change.productId)
      );
      
      // Skip if there are no price changes for this user
      if (userPriceChanges.length === 0) {
        continue;
      }
      
      // Get the products for these price changes
      const productIds = [...new Set(userPriceChanges.map(change => change.productId))];
      const products = await Promise.all(
        productIds.map(id => productService.getProductById(id))
      );
      
      // Filter out null products
      const validProducts = products.filter(product => product !== null) as any[];
      
      // Send the notification
      await notificationService.sendNotification({
        type: NotificationType.WEEKLY_SUMMARY,
        user,
        data: {
          products: validProducts,
          priceChanges: userPriceChanges,
        },
      });
      
      console.log(`Sent weekly summary to user ${user.id} with ${userPriceChanges.length} price changes`);
    }
    
    // Clear the weekly price changes
    weeklyPriceChanges.length = 0;
    
    console.log('Weekly summary notifications sent successfully');
  } catch (error) {
    console.error('Error sending weekly summary notifications:', error);
    
    // Try to notify admins about the error
    try {
      const adminUsers = await userRepository.findAdminUsers();
      
      for (const admin of adminUsers) {
        await notificationService.sendNotification({
          type: NotificationType.SYSTEM_NOTIFICATION,
          user: admin,
          data: {
            subject: 'Weekly Summary Error',
            message: `Failed to send weekly summary notifications: ${error instanceof Error ? error.message : 'Unknown error'}`,
          },
        });
      }
    } catch (notifyError) {
      console.error('Error sending admin notifications:', notifyError);
    }
  }
}
