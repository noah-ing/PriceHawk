import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { subscriptionService } from '@/lib/services/subscription-service';

/**
 * Middleware to check if a user can add more products
 */
export async function canAddProductMiddleware(
  req: NextRequest,
  handler: (req: NextRequest) => Promise<NextResponse>
) {
  console.log('canAddProductMiddleware - Checking if user can add product');
  
  // Check if the user is authenticated
  console.log('Getting auth session');
  const session = await auth();
  console.log('Session received:', session?.user ? 'User authenticated' : 'No user in session');
  
  if (!session?.user?.id) {
    console.log('No user ID in session, returning 401');
    return NextResponse.json({ 
      success: false,
      error: { 
        message: 'Unauthorized',
        code: 'UNAUTHORIZED'
      } 
    }, { status: 401 });
  }
  
  // Check if the user can add more products
  console.log('Checking if user can add more products, user ID:', session.user.id);
  const canAddProduct = await subscriptionService.canAddProduct(session.user.id);
  console.log('Can add product result:', canAddProduct);
  
  if (!canAddProduct) {
    console.log('User cannot add more products, returning 403');
    return NextResponse.json(
      {
        success: false,
        error: {
          message: 'You have reached the maximum number of products for your subscription tier. Please upgrade to add more products.',
          code: 'PRODUCT_LIMIT_REACHED'
        },
        upgradeRequired: true
      },
      { status: 403 }
    );
  }
  
  // If the user can add more products, proceed with the handler
  console.log('User can add product, proceeding with handler');
  return handler(req);
}

/**
 * Middleware to check if a user can add more alerts to a product
 */
export async function canAddAlertMiddleware(
  req: NextRequest,
  productId: string,
  handler: (req: NextRequest) => Promise<NextResponse>
) {
  // Check if the user is authenticated
  const session = await auth();
  
  if (!session?.user?.id) {
    return NextResponse.json({ 
      success: false,
      error: { 
        message: 'Unauthorized',
        code: 'UNAUTHORIZED'
      } 
    }, { status: 401 });
  }
  
  // Check if the user can add more alerts to this product
  const canAddAlert = await subscriptionService.canAddAlert(session.user.id, productId);
  
  if (!canAddAlert) {
    return NextResponse.json(
      {
        success: false,
        error: {
          message: 'You have reached the maximum number of alerts for this product. Please upgrade to add more alerts.',
          code: 'ALERT_LIMIT_REACHED'
        },
        upgradeRequired: true
      },
      { status: 403 }
    );
  }
  
  // If the user can add more alerts, proceed with the handler
  return handler(req);
}

/**
 * Middleware to check if a user has access to a specific feature
 */
export async function hasFeatureAccessMiddleware(
  req: NextRequest,
  feature: string,
  handler: (req: NextRequest) => Promise<NextResponse>
) {
  // Check if the user is authenticated
  const session = await auth();
  
  if (!session?.user?.id) {
    return NextResponse.json({ 
      success: false,
      error: { 
        message: 'Unauthorized',
        code: 'UNAUTHORIZED'
      } 
    }, { status: 401 });
  }
  
  // Check if the user has access to this feature
  const hasAccess = await subscriptionService.hasAccess(session.user.id, feature);
  
  if (!hasAccess) {
    return NextResponse.json(
      {
        success: false,
        error: {
          message: `The ${feature.replace('_', ' ')} feature is not available on your current subscription tier. Please upgrade to access this feature.`,
          code: 'FEATURE_NOT_AVAILABLE'
        },
        upgradeRequired: true
      },
      { status: 403 }
    );
  }
  
  // If the user has access to the feature, proceed with the handler
  return handler(req);
}
