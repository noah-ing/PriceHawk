// This script creates products and prices in Stripe for our subscription tiers
import dotenv from 'dotenv';
import Stripe from 'stripe';
import { PrismaClient } from '@prisma/client';

dotenv.config();

const prisma = new PrismaClient();
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
  apiVersion: '2023-10-16',
});

async function main() {
  console.log('Setting up Stripe products and prices...');

  try {
    // Define subscription tiers
    const tiers = [
      {
        name: 'BASIC',
        displayName: 'Basic Plan',
        description: 'Enhanced tracking for regular online shoppers',
        priceMonthly: 7.99,
        priceYearly: 79.99,
      },
      {
        name: 'PREMIUM',
        displayName: 'Premium Plan',
        description: 'Advanced tracking for deal hunters',
        priceMonthly: 14.99,
        priceYearly: 149.99,
      },
      {
        name: 'PROFESSIONAL',
        displayName: 'Professional Plan',
        description: 'Complete solution for power users',
        priceMonthly: 29.99,
        priceYearly: 299.99,
      },
    ];

    for (const tier of tiers) {
      console.log(`Creating Stripe product for ${tier.name}...`);

      // Create product
      const product = await stripe.products.create({
        name: tier.displayName,
        description: tier.description,
        metadata: {
          tier: tier.name,
        },
      });

      console.log(`Created product: ${product.id}`);

      // Create monthly price
      const monthlyPrice = await stripe.prices.create({
        product: product.id,
        unit_amount: Math.round(tier.priceMonthly * 100), // Convert to cents
        currency: 'usd',
        recurring: {
          interval: 'month',
        },
        metadata: {
          tier: tier.name,
          billing: 'monthly',
        },
      });

      console.log(`Created monthly price: ${monthlyPrice.id}`);

      // Create yearly price
      const yearlyPrice = await stripe.prices.create({
        product: product.id,
        unit_amount: Math.round(tier.priceYearly * 100), // Convert to cents
        currency: 'usd',
        recurring: {
          interval: 'year',
        },
        metadata: {
          tier: tier.name,
          billing: 'yearly',
        },
      });

      console.log(`Created yearly price: ${yearlyPrice.id}`);

      // Update subscription tier in database with price IDs
      await prisma.subscriptionTier.update({
        where: {
          name: tier.name,
        },
        data: {
          stripePriceIdMonthly: monthlyPrice.id,
          stripePriceIdYearly: yearlyPrice.id,
        },
      });

      console.log(`Updated ${tier.name} subscription tier with Stripe price IDs`);
    }

    console.log('Stripe setup completed successfully!');
  } catch (error) {
    console.error('Error setting up Stripe:', error);
  } finally {
    await prisma.$disconnect();
  }
}

main();
