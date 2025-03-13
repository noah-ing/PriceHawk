import { prisma } from '@/lib/db/prisma';
import { BaseRepository } from './base-repository';

// Define UserProductSettings type until Prisma client is properly generated
type UserProductSettings = {
  id: string;
  userId: string;
  productId: string;
  markupPercentage: number;
  createdAt: Date;
  updatedAt: Date;
};

/**
 * Repository for UserProductSettings entity operations
 */
export class UserProductSettingsRepository implements BaseRepository<UserProductSettings, string> {
  /**
   * Find by ID
   */
  async findById(id: string): Promise<UserProductSettings | null> {
    return (prisma as any).userProductSettings.findUnique({
      where: { id }
    });
  }

  /**
   * Find all settings
   */
  async findAll(): Promise<UserProductSettings[]> {
    return (prisma as any).userProductSettings.findMany();
  }

  /**
   * Create new settings
   */
  async create(data: Omit<UserProductSettings, 'id' | 'createdAt' | 'updatedAt'>): Promise<UserProductSettings> {
    return (prisma as any).userProductSettings.create({
      data: {
        userId: data.userId,
        productId: data.productId,
        markupPercentage: data.markupPercentage
      }
    });
  }

  /**
   * Update settings
   */
  async update(id: string, data: Partial<Omit<UserProductSettings, 'id' | 'createdAt' | 'updatedAt'>>): Promise<UserProductSettings> {
    return (prisma as any).userProductSettings.update({
      where: { id },
      data
    });
  }

  /**
   * Delete settings
   */
  async delete(id: string): Promise<boolean> {
    await (prisma as any).userProductSettings.delete({
      where: { id }
    });
    return true;
  }

  /**
   * Get user product settings by user ID and product ID
   */
  async getByUserAndProduct(userId: string, productId: string): Promise<UserProductSettings | null> {
    return (prisma as any).userProductSettings.findUnique({
      where: {
        userId_productId: {
          userId,
          productId
        }
      }
    });
  }

  /**
   * Get all settings for a user
   */
  async getAllForUser(userId: string): Promise<UserProductSettings[]> {
    return (prisma as any).userProductSettings.findMany({
      where: {
        userId
      },
      orderBy: {
        updatedAt: 'desc'
      }
    });
  }

  /**
   * Get all settings for a product
   */
  async getAllForProduct(productId: string): Promise<UserProductSettings[]> {
    return (prisma as any).userProductSettings.findMany({
      where: {
        productId
      }
    });
  }

  /**
   * Create or update user product settings
   */
  async upsert(data: {
    userId: string;
    productId: string;
    markupPercentage: number;
  }): Promise<UserProductSettings> {
    const { userId, productId, markupPercentage } = data;
    
    return (prisma as any).userProductSettings.upsert({
      where: {
        userId_productId: {
          userId,
          productId
        }
      },
      update: {
        markupPercentage
      },
      create: {
        userId,
        productId,
        markupPercentage
      }
    });
  }

  /**
   * Delete user product settings
   */
  async deleteByUserAndProduct(userId: string, productId: string): Promise<void> {
    await (prisma as any).userProductSettings.delete({
      where: {
        userId_productId: {
          userId,
          productId
        }
      }
    });
  }

  /**
   * Get user product settings with product details
   */
  async getWithProductDetails(userId: string): Promise<any[]> {
    return (prisma as any).userProductSettings.findMany({
      where: {
        userId
      },
      include: {
        product: {
          select: {
            id: true,
            title: true,
            imageUrl: true,
            currentPrice: true,
            retailer: true,
            url: true
          }
        }
      },
      orderBy: {
        updatedAt: 'desc'
      }
    });
  }
}

export const userProductSettingsRepository = new UserProductSettingsRepository();
