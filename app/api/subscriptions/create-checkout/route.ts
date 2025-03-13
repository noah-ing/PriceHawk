import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { subscriptionService } from '@/lib/services/subscription-service';
import { prisma } from '@/lib/db/prisma';

/**
 * API route to create a Stripe checkout session for subscription
 * 
 * POST /api/subscriptions/create-checkout
 * Body: { tierName: string, isYearly: boolean }
 */
export async function POST(req: NextRequest) {
  // Check if the user is authenticated
  const session = await auth();
  
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  
  try {
    // Parse the request body
    const body = await req.json();
    const { tierName, isYearly } = body;
    
    if (!tierName) {
      return NextResponse.json({ error: 'Subscription tier name is required' }, { status: 400 });
    }
    
    // Find the subscription tier
    const tier = await prisma.subscriptionTier.findUnique({
      where: { name: tierName },
    });
    
    if (!tier) {
      return NextResponse.json({ error: 'Invalid subscription tier' }, { status: 400 });
    }
    
    // Get the appropriate price ID
    const priceId = isYearly ? tier.stripePriceIdYearly : tier.stripePriceIdMonthly;
    
    if (!priceId) {
      return NextResponse.json(
        { 
          error: 'This subscription plan is not available for purchase yet',
          details: `No ${isYearly ? 'yearly' : 'monthly'} price configured for ${tier.displayName} plan` 
        }, 
        { status: 400 }
      );
    }
    
    // Create a checkout session
    const checkoutSession = await subscriptionService.createCheckoutSession(
      session.user.id,
      priceId,
      isYearly
    );
  
    // Return the session ID
    return NextResponse.json({ sessionId: checkoutSession.id });
  } catch (error: any) {
    console.error('Checkout error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
