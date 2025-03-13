// This script directly updates a user's subscription in the database
// Usage: node scripts/direct-subscription-update.js USER_ID TIER_NAME
// Example: node scripts/direct-subscription-update.js cm82jhcb60000u2j4jsdx8ptu PREMIUM

import { PrismaClient } from '@prisma/client';

// Create a new Prisma client
const prisma = new PrismaClient();

// Get command line arguments
const userId = process.argv[2];
const tierName = process.argv[3] || 'PREMIUM';

if (!userId) {
  console.error('Error: User ID is required');
  console.error('Usage: node scripts/direct-subscription-update.js USER_ID TIER_NAME');
  process.exit(1);
}

console.log(`Updating subscription for user ${userId} to ${tierName}...`);

// Generate a subscription period end date (1 month from now)
const periodEnd = new Date();
periodEnd.setMonth(periodEnd.getMonth() + 1);

async function updateSubscription() {
  try {
    // Get the current user data
    const user = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      console.error(`User with ID ${userId} not found.`);
      process.exit(1);
    }

    console.log('Current user subscription data:');
    console.log({
      id: user.id,
      email: user.email,
      name: user.name,
      tier: user.subscriptionTier,
      status: user.subscriptionStatus,
    });

    // Get the desired tier
    const tier = await prisma.subscriptionTier.findUnique({
      where: { name: tierName },
    });

    if (!tier) {
      console.error(`Subscription tier ${tierName} not found.`);
      process.exit(1);
    }

    console.log('Found tier:', {
      name: tier.name,
      displayName: tier.displayName,
      features: tier.features,
    });

    // Update the user's subscription
    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: {
        subscriptionTier: tierName,
        subscriptionStatus: 'active',
        subscriptionPeriodEnd: periodEnd,
      },
    });

    console.log('User subscription updated successfully!');
    console.log('New subscription data:');
    console.log({
      id: updatedUser.id,
      email: updatedUser.email,
      tier: updatedUser.subscriptionTier,
      status: updatedUser.subscriptionStatus,
      periodEnd: updatedUser.subscriptionPeriodEnd,
    });

    // Clear any cached data in the database
    await prisma.$executeRawUnsafe(`NOTIFY subscription_updated, '${userId}'`);
    console.log('Sent database notification to clear caches');

  } catch (error) {
    console.error('Error updating subscription:', error);
  } finally {
    await prisma.$disconnect();
  }
}

updateSubscription();
