import { PrismaClient } from '@prisma/client';

// Define Product type until Prisma client is properly generated
type Product = {
  id: string;
  title: string;
  description?: string | null;
  imageUrl?: string | null;
  url: string;
  retailer: string;
  productId: string;
  currentPrice: number;
  currency: string;
  createdAt: Date;
  updatedAt: Date;
  userId: string;
};
import { prisma } from '../prisma';
import { BaseRepository } from './base-repository';

/**
 * Repository for Product entity operations
 */
export class ProductRepository implements BaseRepository<Product, string> {
  /**
   * Find a product by its ID
   */
  async findById(id: string): Promise<Product | null> {
    return prisma.product.findUnique({
      where: { id },
    });
  }

  /**
   * Find all products
   */
  async findAll(): Promise<Product[]> {
    return prisma.product.findMany();
  }

  /**
   * Find products by user ID with pagination support
   * @param userId The user ID
   * @param page Page number (1-based)
   * @param pageSize Number of items per page
   * @param orderBy Optional field to order by
   * @param orderDirection Optional order direction ('asc' or 'desc')
   * @returns Object containing products array and pagination metadata
   */
  async findByUserId(
    userId: string, 
    page: number = 1, 
    pageSize: number = 10,
    orderBy: string = 'createdAt',
    orderDirection: 'asc' | 'desc' = 'desc'
  ): Promise<{
    products: Product[];
    pagination: {
      total: number;
      pageCount: number;
      page: number;
      pageSize: number;
    };
  }> {
    // Validate and sanitize pagination params
    const sanitizedPage = Math.max(1, page);
    const sanitizedPageSize = Math.min(100, Math.max(1, pageSize)); // Limit max page size to 100
    const skip = (sanitizedPage - 1) * sanitizedPageSize;
    
    // Validate orderBy field to prevent SQL injection
    const validOrderByFields = ['title', 'currentPrice', 'createdAt', 'updatedAt', 'retailer'];
    const sanitizedOrderBy = validOrderByFields.includes(orderBy) ? orderBy : 'createdAt';
    
    // Get total count for pagination calculation
    const total = await prisma.product.count({
      where: { userId },
    });
    
    // Get products with pagination
    const products = await prisma.product.findMany({
      where: { userId },
      orderBy: {
        [sanitizedOrderBy]: orderDirection,
      },
      skip,
      take: sanitizedPageSize,
    });
    
    return {
      products,
      pagination: {
        total,
        pageCount: Math.ceil(total / sanitizedPageSize),
        page: sanitizedPage,
        pageSize: sanitizedPageSize,
      },
    };
  }

  /**
   * Find a product by retailer and product ID
   */
  async findByRetailerAndProductId(retailer: string, productId: string): Promise<Product | null> {
    return prisma.product.findUnique({
      where: {
        retailer_productId: {
          retailer,
          productId,
        },
      },
    });
  }

  /**
   * Create a new product
   */
  async create(data: Omit<Product, 'id' | 'createdAt' | 'updatedAt'>): Promise<Product> {
    // Use unchecked create to avoid relation validation
    return prisma.product.create({
      data: {
        title: data.title,
        description: data.description,
        imageUrl: data.imageUrl,
        url: data.url,
        retailer: data.retailer,
        productId: data.productId,
        currentPrice: data.currentPrice,
        currency: data.currency,
        userId: data.userId,
      },
    });
  }

  /**
   * Update a product
   */
  async update(
    id: string,
    data: Partial<Omit<Product, 'id' | 'createdAt' | 'updatedAt'>>
  ): Promise<Product> {
    return prisma.product.update({
      where: { id },
      data,
    });
  }

  /**
   * Update product price
   */
  async updatePrice(id: string, price: number, currency: string = 'USD'): Promise<Product> {
    return prisma.product.update({
      where: { id },
      data: {
        currentPrice: price,
        currency,
        updatedAt: new Date(),
      },
    });
  }

  /**
   * Delete a product
   */
  async delete(id: string): Promise<boolean> {
    await prisma.product.delete({
      where: { id },
    });
    return true;
  }

  /**
   * Get products due for price check based on last check time and priority
   */
  async getProductsDueForCheck(limit: number = 10): Promise<Product[]> {
    // Get products that haven't been checked in the last 24 hours
    // Order by last check time (oldest first)
    return prisma.product.findMany({
      where: {
        updatedAt: {
          lt: new Date(Date.now() - 24 * 60 * 60 * 1000), // 24 hours ago
        },
      },
      orderBy: {
        updatedAt: 'asc',
      },
      take: limit,
    });
  }
}

// Export singleton instance
export const productRepository = new ProductRepository();
