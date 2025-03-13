// Define types based on the existing repository types
type User = {
  id: string;
  email: string;
  name?: string | null;
};

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

type Alert = {
  id: string;
  targetPrice: number;
  isTriggered: boolean;
  createdAt: Date;
  updatedAt: Date;
  productId: string;
  userId: string;
};
import { formatPrice } from '../mcp-integration';

// Define the types of notifications we can send
export enum NotificationType {
  PRICE_DROP = 'PRICE_DROP',
  ALERT_TRIGGERED = 'ALERT_TRIGGERED',
  WEEKLY_SUMMARY = 'WEEKLY_SUMMARY',
  SYSTEM_NOTIFICATION = 'SYSTEM_NOTIFICATION',
}

// Define the notification options
export interface NotificationOptions {
  type: NotificationType;
  user: User;
  data: any;
}

/**
 * Service for sending notifications to users
 */
export class NotificationService {
  /**
   * Send a notification to a user
   * @param options The notification options
   */
  async sendNotification(options: NotificationOptions): Promise<boolean> {
    const { type, user, data } = options;

    try {
      switch (type) {
        case NotificationType.PRICE_DROP:
          return await this.sendPriceDropNotification(user, data);
        case NotificationType.ALERT_TRIGGERED:
          return await this.sendAlertTriggeredNotification(user, data);
        case NotificationType.WEEKLY_SUMMARY:
          return await this.sendWeeklySummaryNotification(user, data);
        case NotificationType.SYSTEM_NOTIFICATION:
          return await this.sendSystemNotification(user, data);
        default:
          console.error(`Unknown notification type: ${type}`);
          return false;
      }
    } catch (error) {
      console.error('Error sending notification:', error);
      return false;
    }
  }

  /**
   * Send a price drop notification
   * @param user The user to notify
   * @param data The notification data
   */
  private async sendPriceDropNotification(
    user: User,
    data: { product: Product; oldPrice: number; newPrice: number }
  ): Promise<boolean> {
    const { product, oldPrice, newPrice } = data;
    
    // Calculate the price difference and percentage
    const priceDifference = oldPrice - newPrice;
    const percentageChange = (priceDifference / oldPrice) * 100;
    
    // Format the prices
    const formattedOldPrice = formatPrice(oldPrice, product.currency);
    const formattedNewPrice = formatPrice(newPrice, product.currency);
    const formattedDifference = formatPrice(priceDifference, product.currency);
    
    // Create the email subject and body
    const subject = `Price Drop Alert: ${product.title}`;
    const body = `
      <h1>Price Drop Alert</h1>
      <p>Good news! The price of <strong>${product.title}</strong> has dropped.</p>
      <p>
        <strong>Old Price:</strong> ${formattedOldPrice}<br>
        <strong>New Price:</strong> ${formattedNewPrice}<br>
        <strong>You Save:</strong> ${formattedDifference} (${percentageChange.toFixed(2)}%)
      </p>
      <p><a href="${product.url}">View Product</a></p>
      <p><a href="${process.env.NEXTAUTH_URL}/dashboard">View Dashboard</a></p>
    `;
    
    // Send the email
    return await this.sendEmail(user.email, subject, body);
  }

  /**
   * Send an alert triggered notification
   * @param user The user to notify
   * @param data The notification data
   */
  private async sendAlertTriggeredNotification(
    user: User,
    data: { alert: Alert; product: Product }
  ): Promise<boolean> {
    const { alert, product } = data;
    
    // Format the prices
    const formattedTargetPrice = formatPrice(alert.targetPrice, product.currency);
    const formattedCurrentPrice = formatPrice(product.currentPrice, product.currency);
    
    // Create the email subject and body
    const subject = `Price Alert Triggered: ${product.title}`;
    const body = `
      <h1>Price Alert Triggered</h1>
      <p>Good news! Your price alert for <strong>${product.title}</strong> has been triggered.</p>
      <p>
        <strong>Target Price:</strong> ${formattedTargetPrice}<br>
        <strong>Current Price:</strong> ${formattedCurrentPrice}
      </p>
      <p><a href="${product.url}">View Product</a></p>
      <p><a href="${process.env.NEXTAUTH_URL}/dashboard">View Dashboard</a></p>
    `;
    
    // Send the email
    return await this.sendEmail(user.email, subject, body);
  }

  /**
   * Send a weekly summary notification
   * @param user The user to notify
   * @param data The notification data
   */
  private async sendWeeklySummaryNotification(
    user: User,
    data: { products: Product[]; priceChanges: { productId: string; oldPrice: number; newPrice: number }[] }
  ): Promise<boolean> {
    const { products, priceChanges } = data;
    
    // Create a map of product IDs to products for easy lookup
    const productMap = new Map<string, Product>();
    products.forEach(product => productMap.set(product.id, product));
    
    // Create the email subject
    const subject = 'Your Weekly Price Tracking Summary';
    
    // Create the email body
    let body = `
      <h1>Your Weekly Price Tracking Summary</h1>
      <p>Here's a summary of price changes for your tracked products this week:</p>
    `;
    
    // Add price changes to the email body
    if (priceChanges.length > 0) {
      body += '<h2>Price Changes</h2><ul>';
      
      priceChanges.forEach(change => {
        const product = productMap.get(change.productId);
        if (product) {
          const priceDifference = change.oldPrice - change.newPrice;
          const percentageChange = (priceDifference / change.oldPrice) * 100;
          const formattedOldPrice = formatPrice(change.oldPrice, product.currency);
          const formattedNewPrice = formatPrice(change.newPrice, product.currency);
          const formattedDifference = formatPrice(Math.abs(priceDifference), product.currency);
          
          body += `
            <li>
              <strong>${product.title}</strong><br>
              ${priceDifference > 0 ? 'Price dropped' : 'Price increased'} from ${formattedOldPrice} to ${formattedNewPrice}
              (${priceDifference > 0 ? '-' : '+'}${formattedDifference}, ${Math.abs(percentageChange).toFixed(2)}%)
            </li>
          `;
        }
      });
      
      body += '</ul>';
    } else {
      body += '<p>No price changes detected this week.</p>';
    }
    
    // Add a link to the dashboard
    body += `<p><a href="${process.env.NEXTAUTH_URL}/dashboard">View Dashboard</a></p>`;
    
    // Send the email
    return await this.sendEmail(user.email, subject, body);
  }

  /**
   * Send a system notification
   * @param user The user to notify
   * @param data The notification data
   */
  private async sendSystemNotification(
    user: User,
    data: { subject: string; message: string }
  ): Promise<boolean> {
    const { subject, message } = data;
    
    // Create the email body
    const body = `
      <h1>${subject}</h1>
      <p>${message}</p>
      <p><a href="${process.env.NEXTAUTH_URL}/dashboard">View Dashboard</a></p>
    `;
    
    // Send the email
    return await this.sendEmail(user.email, subject, body);
  }

  /**
   * Send an email
   * @param to The recipient email address
   * @param subject The email subject
   * @param body The email body (HTML)
   */
  private async sendEmail(to: string, subject: string, body: string): Promise<boolean> {
    try {
      // In a real implementation, this would use an email service like SendGrid
      // For now, we'll just log the email
      console.log(`Sending email to ${to}`);
      console.log(`Subject: ${subject}`);
      console.log(`Body: ${body}`);
      
      // TODO: Implement actual email sending with SendGrid or similar service
      // Example implementation with SendGrid:
      /*
      const msg = {
        to,
        from: 'notifications@pricehawk.com',
        subject,
        html: body,
      };
      await sgMail.send(msg);
      */
      
      return true;
    } catch (error) {
      console.error('Error sending email:', error);
      return false;
    }
  }
}

// Export singleton instance
export const notificationService = new NotificationService();
