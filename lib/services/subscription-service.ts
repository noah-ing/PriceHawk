import stripe from '../stripe';
import { prisma } from '../db/prisma';
import { PrismaClient } from '@prisma/client';

export type SubscriptionStatus = 'active' | 'past_due' | 'canceled' | 'incomplete' | 'incomplete_expired' | 'trialing' | 'unpaid';

export interface SubscriptionInfo {
  tier: string;
  status: string | null;
  periodEnd: Date | null;
  limits: {
    maxProducts: number;
    maxAlertsPerProduct: number;
    priceHistoryDays: number;
  };
  features: string[];
}

export class SubscriptionService {
  /**
   * Get or create a Stripe customer for a user
   */
  async getOrCreateCustomer(userId: string): Promise<string> {
    const user = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new Error('User not found');
    }

    // If the user already has a Stripe customer ID, return it
    if (user.stripeCustomerId) {
      return user.stripeCustomerId;
    }

    // Otherwise, create a new customer in Stripe
    const customer = await stripe.customers.create({
      email: user.email,
      name: user.name || undefined,
      metadata: {
        userId,
      },
    });

    // Update the user with the new Stripe customer ID
    await prisma.user.update({
      where: { id: userId },
      data: {
        stripeCustomerId: customer.id,
      },
    });

    return customer.id;
  }

  /**
   * Create a checkout session for a subscription
   */
  async createCheckoutSession(
    userId: string,
    priceId: string,
    isYearly: boolean
  ) {
    const customerId = await this.getOrCreateCustomer(userId);

    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      payment_method_types: ['card'],
      line_items: [
        {
          price: priceId,
          quantity: 1,
        },
      ],
      mode: 'subscription',
      success_url: `${process.env.NEXTAUTH_URL}/settings/subscription?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${process.env.NEXTAUTH_URL}/pricing`,
      metadata: {
        userId,
        isYearly: isYearly ? 'true' : 'false',
      },
    });

    return session;
  }

  /**
   * Create a customer portal session for managing subscriptions
   * @param userId The user ID
   * @param returnUrl Optional custom return URL (defaults to settings page)
   */
  async createCustomerPortalSession(userId: string, returnUrl?: string) {
    try {
      const customerId = await this.getOrCreateCustomer(userId);

      const session = await stripe.billingPortal.sessions.create({
        customer: customerId,
        return_url: returnUrl || `${process.env.NEXTAUTH_URL}/settings/subscription?return_from_portal=true`,
      });

      return {
        success: true,
        url: session.url
      };
    } catch (error: any) {
      console.error('[SubscriptionService] Portal session creation error:', error);
      
      // Check for specific portal configuration error
      if (error?.type === 'StripeInvalidRequestError' && 
          error?.message?.includes('default configuration has not been created')) {
        return {
          success: false,
          error: 'portal_not_configured',
          message: 'The Stripe Customer Portal has not been configured. Please configure it in the Stripe Dashboard.',
          url: null
        };
      }
      
      // Other types of errors
      return {
        success: false,
        error: error?.type || 'unknown_error',
        message: error?.message || 'An unknown error occurred',
        url: null
      };
    }
  }

  /**
   * Handle a subscription update from Stripe
   * This is a critical function that needs to be very robust
   */
  async handleSubscriptionUpdated(subscription: any) {
    // Start a new Prisma client to ensure fresh connections
    const localPrisma = new PrismaClient();
    
    try {
      const customerId = subscription.customer as string;
      console.log('[SubscriptionService] Processing subscription update for customer:', customerId);

      // Find the user with this Stripe customer ID
      const user = await localPrisma.user.findFirst({
        where: { stripeCustomerId: customerId },
      });

      if (!user) {
        console.error(`[SubscriptionService] No user found with Stripe customer ID: ${customerId}`);
        return;
      }
      
      console.log(`[SubscriptionService] Found user:`, {
        id: user.id,
        email: user.email,
        currentTier: user.subscriptionTier
      });

      // Get the price ID from the subscription
      const priceId = subscription.items.data[0].price.id;
      console.log(`[SubscriptionService] Price ID from subscription:`, priceId);

      // Find the subscription tier with this price ID
      const tier = await localPrisma.subscriptionTier.findFirst({
        where: {
          OR: [
            { stripePriceIdMonthly: priceId },
            { stripePriceIdYearly: priceId },
          ],
        },
      });
      
      console.log(`[SubscriptionService] Found tier:`, tier ? {
        name: tier.name,
        monthlyPriceId: tier.stripePriceIdMonthly,
        yearlyPriceId: tier.stripePriceIdYearly
      } : 'No tier found');

      // Make sure we have the correct tier name (default to FREE if not found)
      const tierName = tier?.name || 'FREE';
      
      // Generate period end date from subscription
      const periodEnd = subscription.current_period_end 
        ? new Date(subscription.current_period_end * 1000) 
        : null;
      
      // Do the actual update without using transaction
      console.log(`[SubscriptionService] Updating user subscription to ${tierName} (status: ${subscription.status})`);
      
      const updatedUser = await localPrisma.user.update({
        where: { id: user.id },
        data: {
          subscriptionId: subscription.id,
          subscriptionStatus: subscription.status,
          subscriptionTier: tierName,
          subscriptionPeriodEnd: periodEnd,
        },
      });
      
      console.log(`[SubscriptionService] User subscription updated successfully:`, {
        id: updatedUser.id,
        tier: updatedUser.subscriptionTier,
        status: updatedUser.subscriptionStatus,
        periodEnd: updatedUser.subscriptionPeriodEnd
      });
      
      // Verify the update worked
      const verifiedUser = await localPrisma.user.findUnique({
        where: { id: user.id },
      });
      
      console.log(`[SubscriptionService] Verification check:`, {
        id: verifiedUser?.id,
        tier: verifiedUser?.subscriptionTier,
        status: verifiedUser?.subscriptionStatus
      });
      
      return updatedUser;
    } catch (error) {
      console.error('[SubscriptionService] Error updating subscription:', error);
      throw error; // Re-throw so the webhook knows it failed
    } finally {
      // Ensure we disconnect this client
      await localPrisma.$disconnect();
    }
  }

  /**
   * Get a user's subscription information
   */
  async getSubscriptionInfo(userId: string): Promise<SubscriptionInfo> {
    console.log(`[SubscriptionService] Getting subscription info for user: ${userId}`);
    
    // Always create a fresh Prisma client to avoid stale connections
    const localPrisma = new PrismaClient();
    
    try {
      // Get the user with current subscription data
      const user = await localPrisma.user.findUnique({
        where: { id: userId },
      });

      if (!user) {
        console.error(`[SubscriptionService] User not found: ${userId}`);
        throw new Error('User not found');
      }
      
      console.log(`[SubscriptionService] User subscription data:`, {
        userId: user.id,
        tier: user.subscriptionTier,
        status: user.subscriptionStatus,
        periodEnd: user.subscriptionPeriodEnd,
        subscriptionId: user.subscriptionId
      });

      // Get the subscription tier info
      const tier = await localPrisma.subscriptionTier.findUnique({
        where: { name: user.subscriptionTier || 'FREE' },
      });

      if (!tier) {
        console.error(`[SubscriptionService] Subscription tier not found: ${user.subscriptionTier || 'FREE'}`);
        throw new Error('Subscription tier not found');
      }
      
      console.log(`[SubscriptionService] Tier details:`, {
        name: tier.name,
        maxProducts: tier.maxProducts,
        maxAlertsPerProduct: tier.maxAlertsPerProduct,
        priceHistoryDays: tier.priceHistoryDays
      });

      // Parse features (safely)
      let features: string[] = [];
      try {
        features = JSON.parse(tier.features);
        if (!Array.isArray(features)) {
          console.warn(`[SubscriptionService] Features not an array, resetting:`, tier.features);
          features = [];
        }
      } catch (e) {
        console.error(`[SubscriptionService] Failed to parse features:`, tier.features, e);
      }
      
      const info: SubscriptionInfo = {
        tier: user.subscriptionTier,
        status: user.subscriptionStatus,
        periodEnd: user.subscriptionPeriodEnd,
        limits: {
          maxProducts: tier.maxProducts,
          maxAlertsPerProduct: tier.maxAlertsPerProduct,
          priceHistoryDays: tier.priceHistoryDays,
        },
        features: features,
      };
      
      console.log(`[SubscriptionService] Returning subscription info:`, info);
      return info;
    } catch (error) {
      console.error(`[SubscriptionService] Error getting subscription info:`, error);
      throw error;
    } finally {
      // Always disconnect the client to avoid connection leaks
      await localPrisma.$disconnect();
    }
  }

  /**
   * Check if a user has access to a specific feature
   */
  async hasAccess(userId: string, feature: string): Promise<boolean> {
    const info = await this.getSubscriptionInfo(userId);
    return info.features.includes(feature);
  }

  /**
   * Check if a user can add more products
   */
  async canAddProduct(userId: string): Promise<boolean> {
    console.log('canAddProduct - Checking if user can add more products, userId:', userId);
    
    // Always create a fresh Prisma client to avoid stale connections
    const localPrisma = new PrismaClient();
    
    try {
      const user = await localPrisma.user.findUnique({
        where: { id: userId },
        include: {
          _count: {
            select: { products: true },
          },
        },
      });

      if (!user) {
        console.log('User not found in database');
        return false;
      }

      console.log('User found:', {
        id: user.id,
        email: user.email,
        subscriptionTier: user.subscriptionTier,
        productCount: user._count.products
      });

      const tier = await localPrisma.subscriptionTier.findUnique({
        where: { name: user.subscriptionTier || 'FREE' },
      });

      if (!tier) {
        console.log('Subscription tier not found:', user.subscriptionTier || 'FREE');
        return false;
      }

      console.log('Subscription tier found:', {
        name: tier.name,
        maxProducts: tier.maxProducts
      });

      const canAdd = user._count.products < tier.maxProducts;
      console.log(`User has ${user._count.products} products, tier limit is ${tier.maxProducts}, canAdd: ${canAdd}`);
      
      return canAdd;
    } catch (error) {
      console.error('Error checking if user can add products:', error);
      return false;
    } finally {
      await localPrisma.$disconnect();
    }
  }

  /**
   * Check if a user can add more alerts to a product
   */
  async canAddAlert(userId: string, productId: string): Promise<boolean> {
    // Always create a fresh Prisma client to avoid stale connections
    const localPrisma = new PrismaClient();
    
    try {
      const user = await localPrisma.user.findUnique({
        where: { id: userId },
      });

      if (!user) {
        return false;
      }

      const tier = await localPrisma.subscriptionTier.findUnique({
        where: { name: user.subscriptionTier || 'FREE' },
      });

      if (!tier) {
        return false;
      }

      const alertCount = await localPrisma.alert.count({
        where: {
          userId,
          productId,
        },
      });

      return alertCount < tier.maxAlertsPerProduct;
    } catch (error) {
      console.error('Error checking if user can add alerts:', error);
      return false;
    } finally {
      await localPrisma.$disconnect();
    }
  }
  
  /**
   * Manually refresh a user's subscription from Stripe
   * This can be called when we suspect the subscription cache might be stale
   */
  async refreshSubscriptionFromStripe(userId: string): Promise<void> {
    console.log(`[SubscriptionService] Manually refreshing subscription for user: ${userId}`);
    
    // Always create a fresh Prisma client to avoid stale connections
    const localPrisma = new PrismaClient();
    
    try {
      const user = await localPrisma.user.findUnique({
        where: { id: userId },
      });

      if (!user) {
        console.error(`[SubscriptionService] User not found for refresh: ${userId}`);
        return;
      }
      
      if (!user.stripeCustomerId) {
        console.log(`[SubscriptionService] User has no Stripe customer ID, nothing to refresh`);
        return;
      }
      
      // Check if customer has any active subscriptions in Stripe
      console.log(`[SubscriptionService] Checking Stripe for active subscriptions for customer: ${user.stripeCustomerId}`);
      const subscriptions = await stripe.subscriptions.list({
        customer: user.stripeCustomerId,
        status: 'active',
        limit: 1
      });
      
      if (subscriptions.data.length > 0) {
        const subscription = subscriptions.data[0];
        console.log(`[SubscriptionService] Found active subscription in Stripe: ${subscription.id}`);
        
        // User has an active subscription, update from it
        await this.handleSubscriptionUpdated(subscription);
      } else if (user.subscriptionTier !== 'FREE') {
        // User doesn't have an active subscription in Stripe but has a non-FREE tier in our DB
        // This is a mismatch, reset to FREE
        console.log(`[SubscriptionService] No active subscriptions found in Stripe but user has ${user.subscriptionTier} tier. Resetting to FREE.`);
        
        await localPrisma.user.update({
          where: { id: user.id },
          data: {
            subscriptionTier: 'FREE',
            subscriptionStatus: null,
            subscriptionPeriodEnd: null,
            subscriptionId: null,
          },
        });
      } else {
        console.log(`[SubscriptionService] No active subscriptions found in Stripe for user with FREE tier. No change needed.`);
      }
    } catch (error) {
      console.error(`[SubscriptionService] Error refreshing subscription from Stripe:`, error);
    } finally {
      await localPrisma.$disconnect();
    }
  }
  
  /**
   * Force a complete refresh of the subscription data
   * This is more aggressive than refreshSubscriptionFromStripe and will
   * sync all data with Stripe, then update the database.
   */
  /**
   * Force a complete refresh of the subscription data
   * This is more aggressive than refreshSubscriptionFromStripe and will
   * sync all data with Stripe, then update the database.
   * 
   * We use a multi-step approach to avoid Stripe API expansion limits.
   */
  async forceFullSubscriptionRefresh(userId: string): Promise<void> {
    console.log(`[SubscriptionService] Performing FULL subscription refresh for user: ${userId}`);
    
    const localPrisma = new PrismaClient();
    
    try {
      // Step 1: Get user with current data
      const user = await localPrisma.user.findUnique({
        where: { id: userId }
      });
      
      if (!user) {
        console.error(`[SubscriptionService] User not found for refresh: ${userId}`);
        return;
      }
      
      if (!user.stripeCustomerId) {
        console.log(`[SubscriptionService] User has no Stripe customer ID, nothing to refresh`);
        return;
      }
      
      // Step 2: Get basic customer data from Stripe (no expansions)
      const customer = await stripe.customers.retrieve(user.stripeCustomerId);
      
      if (customer.deleted) {
        console.log(`[SubscriptionService] Customer deleted in Stripe, resetting subscription to FREE`);
        await localPrisma.user.update({
          where: { id: userId },
          data: {
            subscriptionTier: 'FREE',
            subscriptionStatus: null,
            subscriptionPeriodEnd: null,
            subscriptionId: null,
          }
        });
        return;
      }
      
      // Step 3: Get active subscriptions without deep expansions
      const subscriptions = await stripe.subscriptions.list({
        customer: user.stripeCustomerId,
        status: 'active',
        limit: 100
      });
      
      // Step 4: If we find an active subscription, get its details separately
      const activeSubscription = subscriptions.data.find(sub => 
        sub.status === 'active' || sub.status === 'trialing'
      );
      
      if (activeSubscription) {
        console.log(`[SubscriptionService] Found active subscription: ${activeSubscription.id}`);
        
        // Step 5: Get subscription item details
        const subscription = await stripe.subscriptions.retrieve(activeSubscription.id, {
          expand: ['items.data.price']
        });
        
        // Step 6: If subscription items exist, look up the price data
        if (subscription.items?.data && subscription.items.data.length > 0) {
          const priceId = subscription.items.data[0].price?.id;
          
          if (priceId) {
            // Step 7: Find the subscription tier with this price ID
            const tier = await localPrisma.subscriptionTier.findFirst({
              where: {
                OR: [
                  { stripePriceIdMonthly: priceId },
                  { stripePriceIdYearly: priceId },
                ],
              },
            });
            
            // Step 8: Update the user with the correct subscription data
            if (tier) {
              console.log(`[SubscriptionService] Found matching tier: ${tier.name}`);
              
              // Generate period end date from subscription
              const periodEnd = subscription.current_period_end 
                ? new Date(subscription.current_period_end * 1000) 
                : null;
              
              await localPrisma.user.update({
                where: { id: userId },
                data: {
                  subscriptionId: subscription.id,
                  subscriptionStatus: subscription.status,
                  subscriptionTier: tier.name,
                  subscriptionPeriodEnd: periodEnd,
                },
              });
              
              console.log(`[SubscriptionService] Updated user subscription to ${tier.name}`);
            } else {
              console.log(`[SubscriptionService] No matching tier found for price ID: ${priceId}`);
            }
          }
        }
      } else {
        // No active subscription, set to FREE
        console.log(`[SubscriptionService] No active subscriptions found, setting to FREE tier`);
        await localPrisma.user.update({
          where: { id: userId },
          data: {
            subscriptionTier: 'FREE',
            subscriptionStatus: null,
            subscriptionPeriodEnd: null,
            subscriptionId: null,
          }
        });
      }
      
      // Step 9: Verify final state
      const updatedUser = await localPrisma.user.findUnique({
        where: { id: userId }
      });
      
      console.log(`[SubscriptionService] Final subscription state after full refresh:`, {
        id: updatedUser?.id,
        tier: updatedUser?.subscriptionTier,
        status: updatedUser?.subscriptionStatus,
      });
    } catch (error) {
      console.error(`[SubscriptionService] Error during full subscription refresh:`, error);
    } finally {
      await localPrisma.$disconnect();
    }
  }
}

// Export a singleton instance
export const subscriptionService = new SubscriptionService();
