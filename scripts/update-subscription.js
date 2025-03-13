// This script directly updates a user's subscription in the database
// Usage: node scripts/update-subscription.js USER_ID TIER_NAME
// Example: node scripts/update-subscription.js cm82jhcb60000u2j4jsdx8ptu PREMIUM

import { PrismaClient } from '@prisma/client';
import Stripe from 'stripe';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

const prisma = new PrismaClient();
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

async function updateSubscription() {
  try {
    // Get the user ID from command line args
    const userId = process.argv[2];
    if (!userId) {
      console.error('Error: User ID is required.');
      console.log('Usage: node scripts/update-subscription.js USER_ID [TIER_NAME]');
      process.exit(1);
    }

    // Get the desired tier name from command line args or default to PREMIUM
    const desiredTierName = process.argv[3] || 'PREMIUM';
    console.log(`Updating subscription for user ${userId} to ${desiredTierName} tier...`);

    // First, get the user
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
      tier: user.subscriptionTier,
      status: user.subscriptionStatus,
      subscriptionId: user.subscriptionId,
    });

    // Get the desired tier data
    const tier = await prisma.subscriptionTier.findUnique({
      where: { name: desiredTierName },
    });

    if (!tier) {
      console.error(`Subscription tier ${desiredTierName} not found.`);
      process.exit(1);
    }

    console.log('Found tier:', {
      name: tier.name,
      displayName: tier.displayName,
      monthlyPrice: tier.monthlyPrice,
      yearlyPrice: tier.yearlyPrice,
    });

    // Generate a subscription period end date (1 month from now)
    const periodEnd = new Date();
    periodEnd.setMonth(periodEnd.getMonth() + 1);

    // Get or create a Stripe subscription if needed
    let subscriptionId = user.subscriptionId;
    
    if (!subscriptionId && user.stripeCustomerId) {
      try {
        console.log(`User has Stripe customer ID ${user.stripeCustomerId} but no subscription ID. Checking Stripe...`);
        
        // Check if customer already has active subscriptions
        const subscriptions = await stripe.subscriptions.list({
          customer: user.stripeCustomerId,
          status: 'active',
          limit: 1,
        });
        
        if (subscriptions.data.length > 0) {
          subscriptionId = subscriptions.data[0].id;
          console.log(`Found active subscription in Stripe: ${subscriptionId}`);
        } else {
          console.log('No active subscriptions found in Stripe.');
        }
      } catch (stripeError) {
        console.log(`Error checking Stripe: ${stripeError.message}`);
        console.log('Continuing with manual update only...');
      }
    }

    // Update the user's subscription data in the database
    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: {
        subscriptionTier: tier.name,
        subscriptionStatus: 'active',
        subscriptionPeriodEnd: periodEnd,
        subscriptionId: subscriptionId,
      },
    });

    console.log('Subscription updated successfully!');
    console.log('New subscription data:');
    console.log({
      id: updatedUser.id,
      email: updatedUser.email,
      tier: updatedUser.subscriptionTier,
      status: updatedUser.subscriptionStatus,
      periodEnd: updatedUser.subscriptionPeriodEnd,
      subscriptionId: updatedUser.subscriptionId,
    });

  } catch (error) {
    console.error('Error updating subscription:', error);
  } finally {
    await prisma.$disconnect();
  }
}

updateSubscription();
