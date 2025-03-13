/**
 * Alert API Route
 * 
 * This API route handles operations for a specific alert.
 * It provides endpoints for retrieving, updating, and deleting an alert.
 */

import { NextRequest, NextResponse } from 'next/server';
import { alertService } from '@/lib/services';

interface RouteParams {
  params: {
    id: string;
  };
}

/**
 * GET handler for retrieving a specific alert
 * @param request The incoming request
 * @param params The route parameters
 * @returns The API response with the alert
 */
export async function GET(
  request: NextRequest,
  { params }: RouteParams
): Promise<NextResponse> {
  try {
    const id = params.id;
    
    // Get the alert by ID
    const alert = await alertService.getAlertById(id);
    
    // Check if the alert exists
    if (!alert) {
      return NextResponse.json(
        {
          success: false,
          error: {
            message: 'Alert not found',
            code: 'ALERT_NOT_FOUND',
          },
        },
        { status: 404 }
      );
    }
    
    // Return the alert
    return NextResponse.json(
      {
        success: true,
        data: alert,
        meta: {
          timestamp: new Date().toISOString(),
        },
      },
      { status: 200 }
    );
  } catch (error) {
    // Handle any unexpected errors
    console.error('Unexpected error in alert API route:', error);
    
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
 * PATCH handler for updating an alert
 * @param request The incoming request
 * @param params The route parameters
 * @returns The API response with the updated alert
 */
export async function PATCH(
  request: NextRequest,
  { params }: RouteParams
): Promise<NextResponse> {
  try {
    const id = params.id;
    
    // Parse the request body
    const body = await request.json();
    
    // Validate the user ID
    if (!body.userId) {
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
    
    // Check if we're resetting the alert
    if (body.reset === true) {
      try {
        const alert = await alertService.resetAlert(id, body.userId);
        
        // Return the updated alert
        return NextResponse.json(
          {
            success: true,
            data: alert,
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
                message: 'Alert not found',
                code: 'ALERT_NOT_FOUND',
              },
            },
            { status: 404 }
          );
        }
        
        if (error instanceof Error && error.message.includes('permission')) {
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
    }
    
    // Prepare update data
    const updateData: { targetPrice?: number; isTriggered?: boolean } = {};
    
    if (body.targetPrice !== undefined) {
      updateData.targetPrice = body.targetPrice;
    }
    
    if (body.isTriggered !== undefined) {
      updateData.isTriggered = body.isTriggered;
    }
    
    // Update the alert
    try {
      const alert = await alertService.updateAlert(id, body.userId, updateData);
      
      // Return the updated alert
      return NextResponse.json(
        {
          success: true,
          data: alert,
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
              message: 'Alert not found',
              code: 'ALERT_NOT_FOUND',
            },
          },
          { status: 404 }
        );
      }
      
      if (error instanceof Error && error.message.includes('permission')) {
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
  } catch (error) {
    // Handle any unexpected errors
    console.error('Unexpected error in alert API route:', error);
    
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
 * DELETE handler for deleting an alert
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
    
    // Delete the alert
    try {
      await alertService.deleteAlert(id, userId);
    } catch (error) {
      // Handle specific errors
      if (error instanceof Error && error.message.includes('not found')) {
        return NextResponse.json(
          {
            success: false,
            error: {
              message: 'Alert not found',
              code: 'ALERT_NOT_FOUND',
            },
          },
          { status: 404 }
        );
      }
      
      if (error instanceof Error && error.message.includes('permission')) {
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
    console.error('Unexpected error in alert API route:', error);
    
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
