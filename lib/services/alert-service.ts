import { alertRepository } from '../db/repositories/alert-repository';
import { productRepository } from '../db/repositories/product-repository';

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

/**
 * Service for alert-related operations
 */
export class AlertService {
  /**
   * Get an alert by ID
   */
  async getAlertById(id: string): Promise<Alert | null> {
    return alertRepository.findById(id);
  }
  /**
   * Create a new price alert for a product
   */
  async createAlert(productId: string, userId: string, targetPrice: number): Promise<Alert> {
    // Check if the product exists and belongs to the user
    const product = await productRepository.findById(productId);
    if (!product) {
      throw new Error('Product not found');
    }

    // Check if the user has permission to create an alert for this product
    if (product.userId !== userId) {
      throw new Error('You do not have permission to create an alert for this product');
    }

    // Create the alert
    return alertRepository.create({
      targetPrice,
      isTriggered: false,
      productId,
      userId,
    });
  }

  /**
   * Get alerts for a user
   */
  async getAlertsForUser(userId: string): Promise<Alert[]> {
    return alertRepository.findByUserId(userId);
  }

  /**
   * Get alerts for a product
   */
  async getAlertsForProduct(productId: string, userId: string): Promise<Alert[]> {
    // Check if the product exists and belongs to the user
    const product = await productRepository.findById(productId);
    if (!product) {
      throw new Error('Product not found');
    }

    // Check if the user has permission to view alerts for this product
    if (product.userId !== userId) {
      throw new Error('You do not have permission to view alerts for this product');
    }

    return alertRepository.findByProductId(productId);
  }

  /**
   * Update an alert
   */
  async updateAlert(
    id: string,
    userId: string,
    data: { targetPrice?: number; isTriggered?: boolean }
  ): Promise<Alert> {
    // Check if the alert exists
    const alert = await alertRepository.findById(id);
    if (!alert) {
      throw new Error('Alert not found');
    }

    // Check if the user has permission to update this alert
    if (alert.userId !== userId) {
      throw new Error('You do not have permission to update this alert');
    }

    // Update the alert
    return alertRepository.update(id, data);
  }

  /**
   * Delete an alert
   */
  async deleteAlert(id: string, userId: string): Promise<boolean> {
    // Check if the alert exists
    const alert = await alertRepository.findById(id);
    if (!alert) {
      throw new Error('Alert not found');
    }

    // Check if the user has permission to delete this alert
    if (alert.userId !== userId) {
      throw new Error('You do not have permission to delete this alert');
    }

    // Delete the alert
    return alertRepository.delete(id);
  }

  /**
   * Reset an alert (mark as not triggered)
   */
  async resetAlert(id: string, userId: string): Promise<Alert> {
    // Check if the alert exists
    const alert = await alertRepository.findById(id);
    if (!alert) {
      throw new Error('Alert not found');
    }

    // Check if the user has permission to reset this alert
    if (alert.userId !== userId) {
      throw new Error('You do not have permission to reset this alert');
    }

    // Reset the alert
    return alertRepository.resetAlert(id);
  }

  /**
   * Check if any alerts should be triggered for a product
   * This is called when a product price is updated
   */
  async checkAlertsForProduct(productId: string, currentPrice: number): Promise<Alert[]> {
    // Find alerts that should be triggered
    const alertsToTrigger = await alertRepository.findAlertsToTrigger(productId, currentPrice);

    // Mark alerts as triggered
    for (const alert of alertsToTrigger) {
      await alertRepository.markAsTriggered(alert.id);
      // Note: In a real implementation, we would send notifications here
    }

    return alertsToTrigger;
  }

  /**
   * Get triggered alerts for a user
   */
  async getTriggeredAlertsForUser(userId: string): Promise<Alert[]> {
    const alerts = await alertRepository.findByUserId(userId);
    return alerts.filter(alert => alert.isTriggered);
  }
}

// Export singleton instance
export const alertService = new AlertService();
