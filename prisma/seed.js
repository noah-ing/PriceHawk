import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  // Create subscription tiers
  const subscriptionTiers = [
    {
      name: 'FREE',
      displayName: 'Free',
      description: 'Basic price tracking for casual shoppers',
      monthlyPrice: 0,
      yearlyPrice: 0,
      maxProducts: 3,
      maxAlertsPerProduct: 1,
      priceHistoryDays: 30,
      features: JSON.stringify(['basic_alerts']),
    },
    {
      name: 'BASIC',
      displayName: 'Basic',
      description: 'Enhanced tracking for regular online shoppers',
      monthlyPrice: 7.99,
      yearlyPrice: 79.99,
      stripePriceIdMonthly: 'price_monthly_basic', // Will be updated with actual Stripe price IDs
      stripePriceIdYearly: 'price_yearly_basic',
      maxProducts: 10,
      maxAlertsPerProduct: 5,
      priceHistoryDays: 90,
      features: JSON.stringify([
        'basic_alerts',
        'weekly_summary',
        'ad_free',
      ]),
    },
    {
      name: 'PREMIUM',
      displayName: 'Premium',
      description: 'Advanced tracking for deal hunters',
      monthlyPrice: 14.99,
      yearlyPrice: 149.99,
      stripePriceIdMonthly: 'price_monthly_premium',
      stripePriceIdYearly: 'price_yearly_premium',
      maxProducts: 30,
      maxAlertsPerProduct: 999, // Unlimited
      priceHistoryDays: 365, // 1 year
      features: JSON.stringify([
        'basic_alerts',
        'weekly_summary',
        'ad_free',
        'daily_summary',
        'price_trends',
        'retailer_comparison',
        'deal_sharing',
      ]),
    },
    {
      name: 'PROFESSIONAL',
      displayName: 'Professional',
      description: 'Complete solution for power users',
      monthlyPrice: 29.99,
      yearlyPrice: 299.99,
      stripePriceIdMonthly: 'price_monthly_professional',
      stripePriceIdYearly: 'price_yearly_professional',
      maxProducts: 100,
      maxAlertsPerProduct: 999, // Unlimited
      priceHistoryDays: 730, // 2 years
      features: JSON.stringify([
        'basic_alerts',
        'weekly_summary',
        'ad_free',
        'daily_summary',
        'price_trends',
        'retailer_comparison',
        'deal_sharing',
        'real_time_notifications',
        'advanced_analytics',
        'api_access',
        'priority_support',
        'custom_alert_rules',
        'bulk_import_export',
        'team_sharing',
      ]),
    },
  ];

  // Upsert subscription tiers
  for (const tier of subscriptionTiers) {
    await prisma.subscriptionTier.upsert({
      where: { name: tier.name },
      update: tier,
      create: tier,
    });
    console.log(`Subscription tier ${tier.name} created or updated`);
  }

  // Create a test user if it doesn't exist
  const testUser = await prisma.user.upsert({
    where: { id: 'user_1234567890' },
    update: {},
    create: {
      id: 'user_1234567890',
      name: 'Test User',
      email: 'test@example.com',
      subscriptionTier: 'FREE', // Default to free tier
      createdAt: new Date(),
      updatedAt: new Date(),
    },
  });

  console.log('Test user created or updated:', testUser);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
