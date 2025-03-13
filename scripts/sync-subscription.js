/**
 * Stripe Subscription Sync Utility
 * 
 * This script forces a full synchronization between Stripe and the local database
 * for a specific user's subscription status. It's useful when a user has upgraded
 * their subscription in Stripe, but the application doesn't reflect the change.
 * 
 * Usage:
 * node scripts/sync-subscription.js <userId>
 */

// Import required modules
const { PrismaClient } = require('@prisma/client');
const { subscriptionService } = require('../lib/services/subscription-service');

// Create a Prisma client
const prisma = new PrismaClient();

async function syncSubscription() {
  try {
    // Get the user ID from command line arguments
    const userId = process.argv[2];
    
    if (!userId) {
      console.error('Error: User ID is required');
      console.log('Usage: node scripts/sync-subscription.js <userId>');
      process.exit(1);
    }
    
    console.log(`Syncing subscription for user: ${userId}`);
    
    // First, verify the user exists
    const user = await prisma.user.findUnique({
      where: { id: userId },
    });
    
    if (!user) {
      console.error(`Error: User not found with ID: ${userId}`);
      process.exit(1);
    }
    
    console.log(`Found user: ${user.email}`);
    console.log(`Current subscription state: Tier=${user.subscriptionTier}, Status=${user.subscriptionStatus || 'None'}`);
    
    // Perform the full subscription refresh
    console.log('Performing full subscription refresh with Stripe...');
    await subscriptionService.forceFullSubscriptionRefresh(userId);
    
    // Get the updated user info to confirm changes
    const updatedUser = await prisma.user.findUnique({
      where: { id: userId },
    });
    
    console.log('\nSubscription sync completed:');
    console.log(`Updated subscription state: Tier=${updatedUser.subscriptionTier}, Status=${updatedUser.subscriptionStatus || 'None'}`);
    
    if (updatedUser.subscriptionTier !== user.subscriptionTier || 
        updatedUser.subscriptionStatus !== user.subscriptionStatus) {
      console.log('\n✅ Subscription successfully updated!');
    } else {
      console.log('\nⓘ No changes made to subscription.');
    }
    
    // Additional details for debugging
    console.log('\nDetailed subscription information:');
    const info = await subscriptionService.getSubscriptionInfo(userId);
    console.log(JSON.stringify(info, null, 2));
    
  } catch (error) {
    console.error('Error syncing subscription:', error);
  } finally {
    await prisma.$disconnect();
    process.exit(0);
  }
}

// Run the sync
syncSubscription();
