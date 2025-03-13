import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { userProductSettingsRepository } from '@/lib/db/repositories/user-product-settings-repository';
import { z } from 'zod';

// Validation schema for updating markup
const markupUpdateSchema = z.object({
  markupPercentage: z.number().min(5).max(100)
});

/**
 * GET /api/product-settings/:id
 * Retrieves product settings for a specific product
 */
export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await auth();
    
    if (!session?.user) {
      return NextResponse.json(
        { success: false, error: { message: 'Unauthorized' } },
        { status: 401 }
      );
    }
    
    const userId = session.user.id;
    const productId = params.id;
    
    // Get settings for this user and product
    const settings = await userProductSettingsRepository.getByUserAndProduct(userId, productId);
    
    if (!settings) {
      // Return default settings if none found
      return NextResponse.json({
        success: true,
        data: {
          productId,
          markupPercentage: 30 // Default markup percentage
        }
      });
    }
    
    return NextResponse.json({
      success: true,
      data: settings
    });
    
  } catch (error) {
    console.error('Error getting product settings:', error);
    return NextResponse.json(
      { success: false, error: { message: 'Failed to get product settings' } },
      { status: 500 }
    );
  }
}

/**
 * PUT /api/product-settings/:id
 * Updates product settings for a specific product
 */
export async function PUT(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await auth();
    
    if (!session?.user) {
      return NextResponse.json(
        { success: false, error: { message: 'Unauthorized' } },
        { status: 401 }
      );
    }
    
    const userId = session.user.id;
    const productId = params.id;
    
    // Parse and validate the request body
    const requestBody = await req.json();
    const validationResult = markupUpdateSchema.safeParse(requestBody);
    
    if (!validationResult.success) {
      return NextResponse.json(
        { 
          success: false, 
          error: { 
            message: 'Invalid request data',
            details: validationResult.error.errors 
          } 
        },
        { status: 400 }
      );
    }
    
    const { markupPercentage } = validationResult.data;
    
    // Save the settings
    const updatedSettings = await userProductSettingsRepository.upsert({
      userId,
      productId,
      markupPercentage
    });
    
    return NextResponse.json({
      success: true,
      data: updatedSettings
    });
    
  } catch (error) {
    console.error('Error updating product settings:', error);
    return NextResponse.json(
      { success: false, error: { message: 'Failed to update product settings' } },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/product-settings/:id
 * Removes product settings for a specific product
 */
export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await auth();
    
    if (!session?.user) {
      return NextResponse.json(
        { success: false, error: { message: 'Unauthorized' } },
        { status: 401 }
      );
    }
    
    const userId = session.user.id;
    const productId = params.id;
    
    // Delete the settings
    await userProductSettingsRepository.deleteByUserAndProduct(userId, productId);
    
    return NextResponse.json({
      success: true,
      data: { message: 'Settings deleted successfully' }
    });
    
  } catch (error) {
    console.error('Error deleting product settings:', error);
    return NextResponse.json(
      { success: false, error: { message: 'Failed to delete product settings' } },
      { status: 500 }
    );
  }
}
