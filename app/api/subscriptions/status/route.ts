import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { subscriptionService } from '@/lib/services/subscription-service';

/**
 * API route to get the user's subscription status
 * 
 * GET /api/subscriptions/status
 */
export async function GET(req: NextRequest) {
  // Check if the user is authenticated
  const session = await auth();
  
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  
  try {
    const userId = session.user.id;
    const url = new URL(req.url);
    
    // Check for different flags that might indicate we need a fresh subscription
    const isReturningFromCheckout = url.searchParams.has('session_id');
    const isReturningFromPortal = url.searchParams.has('return_from_portal');
    const isForceRefresh = url.searchParams.has('force_refresh');
    const shouldRefreshFromStripe = isReturningFromCheckout || isReturningFromPortal || isForceRefresh;
    
    // If returning from checkout/portal or explicitly requesting a refresh, get data directly from Stripe
    if (shouldRefreshFromStripe) {
      console.log(`[SubscriptionStatusAPI] Force refreshing subscription data for user ${userId} from Stripe`);
      // Use the more aggressive refresh method for stronger synchronization
      await subscriptionService.forceFullSubscriptionRefresh(userId);
    }
    
    // Get the user's subscription information
    const subscriptionInfo = await subscriptionService.getSubscriptionInfo(userId);
    
    // Set cache control headers to prevent browser caching
    const headers = new Headers();
    headers.set('Cache-Control', 'no-store, max-age=0');
    headers.set('Pragma', 'no-cache');
    
    // Return the subscription information
    return NextResponse.json(subscriptionInfo, {
      headers
    });
  } catch (error: any) {
    console.error('Subscription status error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
