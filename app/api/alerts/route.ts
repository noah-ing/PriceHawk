/**
 * Alerts API Route
 * 
 * This API route handles alert management operations.
 * It provides endpoints for listing and creating alerts.
 * 
 * Security:
 * - GET: Secured with error handling and rate limiting, but no CSRF (read-only operation)
 * - POST: Full CSRF protection enabled for all state-changing operations
 */

import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { alertService } from '@/lib/services';
import { canAddAlertMiddleware } from '@/lib/middleware/subscription';
import { withSecuredApi } from '@/lib/middleware/secured-api';
import { ErrorService } from '@/lib/services/error-service';

/**
 * GET handler for retrieving alerts
 * Secured with error handling but not CSRF (read-only operation)
 */
export const GET = withSecuredApi(
  async (request: NextRequest): Promise<NextResponse> => {
    // Get the user ID from the query parameters
    const userId = request.nextUrl.searchParams.get('userId');
    
    // Validate the user ID
    if (!userId) {
      return NextResponse.json(
        {
          success: false,
          error: {
            message: 'User ID is required',
            code: 'MISSING_USER_ID',
          },
        },
        { status: 400 }
      );
    }
    
    // Check if we should only return triggered alerts
    const triggeredOnly = request.nextUrl.searchParams.get('triggered') === 'true';
    
    // Get alerts for the user
    const alerts = triggeredOnly
      ? await alertService.getTriggeredAlertsForUser(userId)
      : await alertService.getAlertsForUser(userId);
    
    // Return the alerts
    return NextResponse.json(
      {
        success: true,
        data: alerts,
        meta: {
          count: alerts.length,
          timestamp: new Date().toISOString(),
        },
      },
      { status: 200 }
    );
  },
  { csrfProtection: false } // No CSRF needed for GET requests
);

/**
 * POST handler for creating an alert
 * 
 * CSRF protection is now enabled for security
 */
export const POST = withSecuredApi(
  async (request: NextRequest): Promise<NextResponse> => {
    // Parse the request body to get the product ID for the middleware check
    const body = await request.json();
    
    if (!body.productId) {
      return NextResponse.json(
        {
          success: false,
          error: {
            message: 'Product ID is required',
            code: 'MISSING_PRODUCT_ID',
          },
        },
        { status: 400 }
      );
    }
    
    // Use the middleware to check if the user can add more alerts to this product
    return canAddAlertMiddleware(request, body.productId, async (req) => {
      // Get the authenticated user
      const session = await auth();
      
      if (!session?.user?.id) {
        return NextResponse.json(
          {
            success: false,
            error: {
              message: 'Unauthorized',
              code: 'UNAUTHORIZED',
            },
          },
          { status: 401 }
        );
      }
      
      // Validate the target price
      if (body.targetPrice === undefined || body.targetPrice === null) {
        return NextResponse.json(
          {
            success: false,
            error: {
              message: 'Target price is required',
              code: 'MISSING_TARGET_PRICE',
            },
          },
          { status: 400 }
        );
      }
      
      // Create the alert using the authenticated user's ID
      const alert = await alertService.createAlert(
        body.productId,
        session.user.id,
        body.targetPrice
      );
      
      // Return the created alert
      return NextResponse.json(
        {
          success: true,
          data: alert,
          meta: {
            timestamp: new Date().toISOString(),
          },
        },
        { status: 201 }
      );
    });
  },
  { csrfProtection: true } // Re-enabled for production
);
