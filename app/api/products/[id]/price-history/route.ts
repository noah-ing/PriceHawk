/**
 * Price History API Route
 * 
 * This API route handles operations for retrieving a product's price history.
 * Enhanced with Redis caching to improve performance.
 */

import { NextRequest, NextResponse } from 'next/server';
import { productService } from '@/lib/services';
import { getCachedData, generateCacheKey } from '@/lib/cache';

// Cache TTL settings
const PRICE_HISTORY_TTL = 60 * 30; // 30 minutes for price history
const PRICE_STATS_TTL = 60 * 60 * 6; // 6 hours for price statistics

// Function to handle GET requests
export async function GET(
  request: NextRequest,
  context: { params: { id: string } }
): Promise<NextResponse> {
  try {
    // Properly await params to fix the "params should be awaited" error
    const params = await context.params;
    const { id } = params;
    
    // Check if ID is provided
    if (!id) {
      return NextResponse.json(
        {
          success: false,
          error: {
            message: 'Product ID is required',
            code: 'MISSING_PARAMETER',
          },
        },
        { status: 400 }
      );
    }
    
    // Get the limit from the query parameters
    const limitParam = request.nextUrl.searchParams.get('limit');
    const limit = limitParam ? parseInt(limitParam, 10) : undefined;
    
    // Cache key includes the limit param to ensure proper caching based on requested data size
    const historyCacheKey = generateCacheKey('product', id, `history_${limit || 'all'}`);
    const statsCacheKey = generateCacheKey('product', id, 'stats');
    
    // Get the price history with caching
    const priceHistory = await getCachedData(
      historyCacheKey,
      () => productService.getPriceHistory(id, limit),
      PRICE_HISTORY_TTL
    );
    
    // Get price statistics with caching
    const priceStats = await getCachedData(
      statsCacheKey,
      () => productService.getPriceStats(id),
      PRICE_STATS_TTL
    );
    
    // Return the price history and statistics
    return NextResponse.json(
      {
        success: true,
        data: {
          history: priceHistory,
          stats: priceStats,
        },
        meta: {
          productId: id,
          count: priceHistory.length,
          timestamp: new Date().toISOString(),
        },
      },
      { status: 200 }
    );
  } catch (error) {
    // Handle any unexpected errors
    console.error('Unexpected error in price history API route:', error);
    
    return NextResponse.json(
      {
        success: false,
        error: {
          message: error instanceof Error ? error.message : 'An unexpected error occurred',
          code: 'UNEXPECTED_ERROR',
          details: error instanceof Error ? error.message : String(error),
        },
      },
      { status: 500 }
    );
  }
}
