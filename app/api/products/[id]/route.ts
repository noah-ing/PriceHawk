/**
 * Product API Route
 * 
 * This API route handles operations for a specific product.
 * It provides endpoints for retrieving, updating, and deleting a product.
 */

import { NextRequest, NextResponse } from 'next/server';
import { productService } from '@/lib/services';

interface RouteParams {
  params: {
    id: string;
  };
}

/**
 * GET handler for retrieving a specific product
 * @param request The incoming request
 * @param params The route parameters
 * @returns The API response with the product
 */
export async function GET(
  request: NextRequest,
  { params }: RouteParams
): Promise<NextResponse> {
  try {
    const id = params.id;
    
    // Get the product by ID
    const product = await productService.getProductById(id);
    
    // Check if the product exists
    if (!product) {
      return NextResponse.json(
        {
          success: false,
          error: {
            message: 'Product not found',
            code: 'PRODUCT_NOT_FOUND',
          },
        },
        { status: 404 }
      );
    }
    
    // Return the product
    return NextResponse.json(
      {
        success: true,
        data: product,
        meta: {
          timestamp: new Date().toISOString(),
        },
      },
      { status: 200 }
    );
  } catch (error) {
    // Handle any unexpected errors
    console.error('Unexpected error in product API route:', error);
    
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

/**
 * DELETE handler for deleting a product
 * @param request The incoming request
 * @param params The route parameters
 * @returns The API response
 */
export async function DELETE(
  request: NextRequest,
  { params }: RouteParams
): Promise<NextResponse> {
  try {
    const id = params.id;
    
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
    
    // Delete the product
    try {
      await productService.deleteProduct(id, userId);
    } catch (error) {
      // Handle specific errors
      if (error instanceof Error && error.message.includes('not found')) {
        return NextResponse.json(
          {
            success: false,
            error: {
              message: 'Product not found',
              code: 'PRODUCT_NOT_FOUND',
            },
          },
          { status: 404 }
        );
      }
      
      if (error instanceof Error && error.message.includes('access denied')) {
        return NextResponse.json(
          {
            success: false,
            error: {
              message: 'Access denied',
              code: 'ACCESS_DENIED',
            },
          },
          { status: 403 }
        );
      }
      
      throw error;
    }
    
    // Return success response
    return NextResponse.json(
      {
        success: true,
        meta: {
          timestamp: new Date().toISOString(),
        },
      },
      { status: 200 }
    );
  } catch (error) {
    // Handle any unexpected errors
    console.error('Unexpected error in product API route:', error);
    
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

/**
 * PATCH handler for updating a product's price
 * @param request The incoming request
 * @param params The route parameters
 * @returns The API response with the updated product
 */
export async function PATCH(
  request: NextRequest,
  { params }: RouteParams
): Promise<NextResponse> {
  try {
    const id = params.id;
    
    // Update the product price
    const updatedProduct = await productService.updateProductPrice(id);
    
    // Return the updated product
    return NextResponse.json(
      {
        success: true,
        data: updatedProduct,
        meta: {
          timestamp: new Date().toISOString(),
        },
      },
      { status: 200 }
    );
  } catch (error) {
    // Handle specific errors
    if (error instanceof Error && error.message.includes('not found')) {
      return NextResponse.json(
        {
          success: false,
          error: {
            message: 'Product not found',
            code: 'PRODUCT_NOT_FOUND',
          },
        },
        { status: 404 }
      );
    }
    
    // Handle any unexpected errors
    console.error('Unexpected error in product API route:', error);
    
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
