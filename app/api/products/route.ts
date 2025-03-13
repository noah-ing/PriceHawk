/**
 * Products API Route
 * 
 * This API route handles product management operations with standardized
 * error handling, response formatting, and performance tracking.
 */

import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { productService } from '@/lib/services';
import { canAddProductMiddleware } from '@/lib/middleware/subscription';
import { withSecuredApi } from '@/lib/middleware/secured-api';
import { ErrorService, ErrorDefinitions } from '@/lib/services/error-service';

/**
 * GET handler for retrieving products with pagination
 */
export const GET = withSecuredApi(
  async (request: NextRequest): Promise<NextResponse> => {
    // Get the user ID from the query parameters
    const userId = request.nextUrl.searchParams.get('userId');
    
    // Validate the user ID
    if (!userId) {
      throw ErrorService.createError(
        ErrorDefinitions.MISSING_REQUIRED_FIELD,
        { field: 'userId' }
      );
    }
    
    // Parse pagination parameters from query string
    const page = request.nextUrl.searchParams.get('page') 
      ? parseInt(request.nextUrl.searchParams.get('page') || '1', 10) 
      : 1;
    
    const pageSize = request.nextUrl.searchParams.get('pageSize') 
      ? parseInt(request.nextUrl.searchParams.get('pageSize') || '10', 10) 
      : 10;
    
    const orderBy = request.nextUrl.searchParams.get('orderBy') || 'createdAt';
    const orderDirection = (
      request.nextUrl.searchParams.get('orderDirection') === 'asc' ? 'asc' : 'desc'
    ) as 'asc' | 'desc';
    
    // Get products for the user with pagination
    const result = await productService.getProductsForUser(
      userId,
      page,
      pageSize,
      orderBy,
      orderDirection
    );
    
    // Apply optimized response with caching headers
    const response = NextResponse.json(
      ErrorService.createSuccessResponse({
        products: result.products,
        pagination: result.pagination,
        meta: {
          timestamp: new Date().toISOString(),
        },
      }),
      { status: 200 }
    );
    
    // Add cache control headers
    response.headers.set('Cache-Control', 'private, max-age=30');
    
    return response;
  },
  { csrfProtection: false } // No CSRF needed for GET requests
);

/**
 * POST handler for creating a product
 */
export const POST = withSecuredApi(
  async (request: NextRequest): Promise<NextResponse> => {
    // Use the subscription middleware to check if the user can add more products
    return canAddProductMiddleware(request, async (req) => {
      // Get the authenticated user (auth check already done in canAddProductMiddleware)
      const session = await auth();
      
      // Double-check session exists with a user ID
      if (!session?.user?.id) {
        throw ErrorService.createError(
          ErrorDefinitions.UNAUTHENTICATED,
          { message: 'User authentication required' }
        );
      }
      
      // Parse the request body
      const body = await req.json();
      
      // Validate the request body
      if (!body.url) {
        throw ErrorService.createError(
          ErrorDefinitions.MISSING_REQUIRED_FIELD,
          { field: 'url' }
        );
      }
      
      // Add the product from the URL using the authenticated user's ID
      const product = await productService.addProductFromUrl(body.url, session.user.id);
      
      // Return the created product with standardized success response
      return NextResponse.json(
        ErrorService.createSuccessResponse({
          product,
          meta: {
            timestamp: new Date().toISOString(),
          },
        }),
        { status: 201 }
      );
    });
  },
  { csrfProtection: true } // Re-enabled for production
);
