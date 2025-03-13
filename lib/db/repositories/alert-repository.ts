import { PrismaClient } from '@prisma/client';

// Define Alert type until Prisma client is properly generated
type Alert = {
  id: string;
  targetPrice: number;
  isTriggered: boolean;
  createdAt: Date;
  updatedAt: Date;
  productId: string;
  userId: string;
};
import { prisma } from '../prisma';
import { BaseRepository } from './base-repository';

/**
 * Repository for Alert entity operations
 */
export class AlertRepository implements BaseRepository<Alert, string> {
  /**
   * Find an alert by its ID
   */
  async findById(id: string): Promise<Alert | null> {
    return prisma.alert.findUnique({
      where: { id },
    });
  }

  /**
   * Find all alerts
   */
  async findAll(): Promise<Alert[]> {
    return prisma.alert.findMany();
  }

  /**
   * Find alerts by user ID
   */
  async findByUserId(userId: string): Promise<Alert[]> {
    return prisma.alert.findMany({
      where: { userId },
      include: { product: true },
      orderBy: { createdAt: 'desc' },
    });
  }

  /**
   * Find alerts by product ID
   */
  async findByProductId(productId: string): Promise<Alert[]> {
    return prisma.alert.findMany({
      where: { productId },
      include: { user: true },
    });
  }

  /**
   * Find active (non-triggered) alerts for a product
   */
  async findActiveAlertsByProductId(productId: string): Promise<Alert[]> {
    return prisma.alert.findMany({
      where: {
        productId,
        isTriggered: false,
      },
      include: { user: true },
    });
  }

  /**
   * Create a new alert
   */
  async create(data: Omit<Alert, 'id' | 'createdAt' | 'updatedAt'>): Promise<Alert> {
    // Use unchecked create to avoid relation validation
    return prisma.alert.create({
      data: {
        targetPrice: data.targetPrice,
        isTriggered: data.isTriggered,
        productId: data.productId,
        userId: data.userId,
      },
    });
  }

  /**
   * Update an alert
   */
  async update(
    id: string,
    data: Partial<Omit<Alert, 'id' | 'createdAt' | 'updatedAt'>>
  ): Promise<Alert> {
    return prisma.alert.update({
      where: { id },
      data,
    });
  }

  /**
   * Delete an alert
   */
  async delete(id: string): Promise<boolean> {
    await prisma.alert.delete({
      where: { id },
    });
    return true;
  }

  /**
   * Mark an alert as triggered
   */
  async markAsTriggered(id: string): Promise<Alert> {
    return prisma.alert.update({
      where: { id },
      data: {
        isTriggered: true,
        updatedAt: new Date(),
      },
    });
  }

  /**
   * Reset an alert (mark as not triggered)
   */
  async resetAlert(id: string): Promise<Alert> {
    return prisma.alert.update({
      where: { id },
      data: {
        isTriggered: false,
        updatedAt: new Date(),
      },
    });
  }

  /**
   * Find alerts that should be triggered based on current price
   */
  async findAlertsToTrigger(productId: string, currentPrice: number): Promise<Alert[]> {
    return prisma.alert.findMany({
      where: {
        productId,
        targetPrice: { gte: currentPrice },
        isTriggered: false,
      },
      include: { user: true, product: true },
    });
  }
}

// Export singleton instance
export const alertRepository = new AlertRepository();
