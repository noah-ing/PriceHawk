import { NextRequest, NextResponse } from 'next/server';
import { subscriptionService } from '@/lib/services/subscription-service';
import { auth } from '@/auth';
import { ErrorService } from '@/lib/services/error-service';

/**
 * Force a full subscription refresh
 * This forces a complete refresh of the user's subscription 
 * status directly from Stripe
 */
export async function POST(req: NextRequest) {
  try {
    // Verify user is authenticated
    const session = await auth();
    
    if (!session?.user?.id) {
      return NextResponse.json({
        success: false,
        error: {
          message: 'Unauthorized',
        }
      }, { status: 401 });
    }

    // Get user ID from session
    const userId = session.user.id;
    
    // Call the aggressive force sync method
    await subscriptionService.forceFullSubscriptionRefresh(userId);
    
    // Return success response
    return NextResponse.json({
      success: true,
      message: 'Subscription force synced successfully'
    });
  } catch (error) {
    console.error('[API] Error in force-sync:', error);
    
    // Use standard error handling
    return NextResponse.json({
      success: false,
      error: {
        message: error instanceof Error ? error.message : 'Failed to force sync subscription'
      }
    }, { status: 500 });
  }
}
