import { PrismaClient } from '@prisma/client';

// Define User type based on the Prisma schema
type User = {
  id: string;
  name?: string | null;
  email: string;
  emailVerified?: Date | null;
  image?: string | null;
  password?: string | null;
  createdAt: Date;
  updatedAt: Date;
};
import { prisma } from '../prisma';
import { BaseRepository } from './base-repository';

/**
 * Repository for User entity operations
 */
export class UserRepository implements BaseRepository<User, string> {
  /**
   * Find a user by their ID
   */
  async findById(id: string): Promise<User | null> {
    return prisma.user.findUnique({
      where: { id },
    });
  }

  /**
   * Find a user by their email
   */
  async findByEmail(email: string): Promise<User | null> {
    return prisma.user.findUnique({
      where: { email },
    });
  }

  /**
   * Find all users
   */
  async findAll(): Promise<User[]> {
    return prisma.user.findMany();
  }

  /**
   * Create a new user
   */
  async create(data: Omit<User, 'id' | 'createdAt' | 'updatedAt'>): Promise<User> {
    return prisma.user.create({
      data: {
        name: data.name,
        email: data.email,
        emailVerified: data.emailVerified,
        image: data.image,
        password: data.password,
      },
    });
  }

  /**
   * Update a user
   */
  async update(
    id: string,
    data: Partial<Omit<User, 'id' | 'createdAt' | 'updatedAt'>>
  ): Promise<User> {
    return prisma.user.update({
      where: { id },
      data,
    });
  }

  /**
   * Delete a user
   */
  async delete(id: string): Promise<boolean> {
    await prisma.user.delete({
      where: { id },
    });
    return true;
  }

  /**
   * Get user with their products
   */
  async getUserWithProducts(id: string): Promise<User & { products: any[] } | null> {
    return prisma.user.findUnique({
      where: { id },
      include: { products: true },
    });
  }

  /**
   * Get user with their alerts
   */
  async getUserWithAlerts(id: string): Promise<User & { alerts: any[] } | null> {
    return prisma.user.findUnique({
      where: { id },
      include: { alerts: true },
    });
  }

  /**
   * Get user statistics (product count, alert count, etc.)
   */
  async getUserStats(id: string): Promise<{
    productCount: number;
    alertCount: number;
    triggeredAlertCount: number;
  }> {
    const productCount = await prisma.product.count({
      where: { userId: id },
    });

    const alertCount = await prisma.alert.count({
      where: { userId: id },
    });

    const triggeredAlertCount = await prisma.alert.count({
      where: {
        userId: id,
        isTriggered: true,
      },
    });

    return {
      productCount,
      alertCount,
      triggeredAlertCount,
    };
  }
  
  /**
   * Find admin users
   * In a real implementation, this would check for an admin role or similar
   * For now, we'll just return all users as a placeholder
   */
  async findAdminUsers(): Promise<User[]> {
    // In a real implementation, this would filter by role
    // For example: return prisma.user.findMany({ where: { role: 'ADMIN' } });
    
    // For now, we'll just return all users as a placeholder
    // In a production system, you would want to implement proper role-based access control
    return this.findAll();
  }
}

// Export singleton instance
export const userRepository = new UserRepository();
