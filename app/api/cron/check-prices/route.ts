/**
 * Scheduled Price Check API Route
 * 
 * This API route is designed to be called by a cron job to periodically
 * check prices for products that are due for a check.
 */

import { NextRequest, NextResponse } from 'next/server';
import { productService } from '@/lib/services';

/**
 * POST handler for checking prices
 * @param request The incoming request
 * @returns The API response with the results of the price checks
 */
export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    // Check if scheduled checks are enabled
    if (process.env.ENABLE_SCHEDULED_CHECKS !== 'true') {
      return NextResponse.json(
        {
          success: false,
          error: {
            message: 'Scheduled price checks are disabled',
            code: 'FEATURE_DISABLED',
          },
        },
        { status: 400 }
      );
    }
    
    // Parse the request body
    const body = await request.json();
    
    // Get the limit from the request body or use default
    const limit = body.limit || 10;
    
    // Get products due for price check
    const productsDueForCheck = await productService.getProductsDueForCheck(limit);
    
    if (productsDueForCheck.length === 0) {
      return NextResponse.json(
        {
          success: true,
          data: {
            message: 'No products due for price check',
            productsChecked: 0,
            priceChanges: 0,
          },
          meta: {
            timestamp: new Date().toISOString(),
          },
        },
        { status: 200 }
      );
    }
    
    // Extract product IDs
    const productIds = productsDueForCheck.map(product => product.id);
    
    // Check prices for products
    const updatedProducts = await productService.checkPricesForProducts(productIds);
    
    // Count price changes
    const priceChanges = updatedProducts.filter(
      (product, index) => product.currentPrice !== productsDueForCheck[index].currentPrice
    ).length;
    
    // Return the results
    return NextResponse.json(
      {
        success: true,
        data: {
          productsChecked: productsDueForCheck.length,
          priceChanges,
          products: updatedProducts.map(product => ({
            id: product.id,
            title: product.title,
            currentPrice: product.currentPrice,
            currency: product.currency,
            retailer: product.retailer,
          })),
        },
        meta: {
          timestamp: new Date().toISOString(),
        },
      },
      { status: 200 }
    );
  } catch (error) {
    // Handle any unexpected errors
    console.error('Unexpected error in scheduled price check API route:', error);
    
    return NextResponse.json(
      {
        success: false,
        error: {
          message: error instanceof Error ? error.message : 'An unexpected error occurred',
          code: 'UNEXPECTED_ERROR',
          details: error,
        },
      },
      { status: 500 }
    );
  }
}
