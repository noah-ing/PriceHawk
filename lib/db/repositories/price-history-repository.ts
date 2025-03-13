import { PrismaClient } from '@prisma/client';

// Define PriceHistory type until Prisma client is properly generated
type PriceHistory = {
  id: string;
  price: number;
  currency: string;
  timestamp: Date;
  productId: string;
};
import { prisma } from '../prisma';
import { BaseRepository } from './base-repository';

/**
 * Repository for PriceHistory entity operations
 */
export class PriceHistoryRepository implements BaseRepository<PriceHistory, string> {
  /**
   * Find a price history entry by its ID
   */
  async findById(id: string): Promise<PriceHistory | null> {
    return prisma.priceHistory.findUnique({
      where: { id },
    });
  }

  /**
   * Find all price history entries
   */
  async findAll(): Promise<PriceHistory[]> {
    return prisma.priceHistory.findMany();
  }

  /**
   * Find price history entries by product ID
   */
  async findByProductId(productId: string, limit?: number): Promise<PriceHistory[]> {
    return prisma.priceHistory.findMany({
      where: { productId },
      orderBy: { timestamp: 'desc' },
      take: limit,
    });
  }

  /**
   * Get price history for a product within a date range
   */
  async findByProductIdAndDateRange(
    productId: string,
    startDate: Date,
    endDate: Date
  ): Promise<PriceHistory[]> {
    return prisma.priceHistory.findMany({
      where: {
        productId,
        timestamp: {
          gte: startDate,
          lte: endDate,
        },
      },
      orderBy: { timestamp: 'asc' },
    });
  }

  /**
   * Create a new price history entry
   */
  async create(data: Omit<PriceHistory, 'id' | 'createdAt' | 'updatedAt'>): Promise<PriceHistory> {
    // Use unchecked create to avoid relation validation
    return prisma.priceHistory.create({
      data: {
        price: data.price,
        currency: data.currency,
        timestamp: data.timestamp,
        productId: data.productId,
      },
    });
  }

  /**
   * Update a price history entry
   */
  async update(
    id: string,
    data: Partial<Omit<PriceHistory, 'id' | 'createdAt' | 'updatedAt'>>
  ): Promise<PriceHistory> {
    return prisma.priceHistory.update({
      where: { id },
      data,
    });
  }

  /**
   * Delete a price history entry
   */
  async delete(id: string): Promise<boolean> {
    await prisma.priceHistory.delete({
      where: { id },
    });
    return true;
  }

  /**
   * Get the lowest price for a product
   */
  async getLowestPrice(productId: string): Promise<number | null> {
    const result = await prisma.priceHistory.aggregate({
      where: { productId },
      _min: { price: true },
    });
    return result._min.price;
  }

  /**
   * Get the highest price for a product
   */
  async getHighestPrice(productId: string): Promise<number | null> {
    const result = await prisma.priceHistory.aggregate({
      where: { productId },
      _max: { price: true },
    });
    return result._max.price;
  }

  /**
   * Get the average price for a product
   */
  async getAveragePrice(productId: string): Promise<number | null> {
    const result = await prisma.priceHistory.aggregate({
      where: { productId },
      _avg: { price: true },
    });
    return result._avg.price;
  }

  /**
   * Record a new price for a product
   */
  async recordPrice(
    productId: string,
    price: number,
    currency: string = 'USD'
  ): Promise<PriceHistory> {
    return this.create({
      productId,
      price,
      currency,
      timestamp: new Date(),
    });
  }
}

// Export singleton instance
export const priceHistoryRepository = new PriceHistoryRepository();
