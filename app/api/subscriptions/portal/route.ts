import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { subscriptionService } from '@/lib/services/subscription-service';
import { ErrorService } from '@/lib/services/error-service';
import { withApiOptimization } from '@/lib/middleware/api-optimization';

/**
 * API route to create a Stripe Customer Portal session
 * 
 * POST /api/subscriptions/portal
 */
export const POST = withApiOptimization(async (req: NextRequest) => {
  try {
    const session = await auth();
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    const userId = session.user.id;
    
    // Create a Stripe Customer Portal session with a return URL that will trigger subscription refresh
    const result = await subscriptionService.createCustomerPortalSession(
      userId,
      `${process.env.NEXTAUTH_URL}/settings?return_from_portal=true`
    );
    
    if (!result.success) {
      // Handle specific error cases
      if (result.error === 'portal_not_configured') {
        // The portal hasn't been configured in Stripe dashboard
        return NextResponse.json(
          { 
            error: 'portal_not_configured',
            message: 'The Stripe Customer Portal has not been configured yet. Please visit the pricing page to upgrade your subscription.',
            stripeConfigUrl: 'https://billing.stripe.com/p/login/test_6oE9Ek0WgeGW1eoeUU' 
          },
          { status: 400 }
        );
      }
      
      // Other errors
      return NextResponse.json(
        { error: result.error, message: result.message },
        { status: 400 }
      );
    }
    
    // Success case
    return NextResponse.json({ url: result.url });
  } catch (error) {
    // Log the error
    console.error('Failed to create portal session:', error);
    
    // Return a friendly error message
    return NextResponse.json(
      { error: 'server_error', message: 'Failed to create portal session. Please try again later.' },
      { status: 500 }
    );
  }
});
