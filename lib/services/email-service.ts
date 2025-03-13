import sgMail from '@sendgrid/mail';

// Initialize SendGrid with the API key from environment variables (if available)
const SENDGRID_API_KEY = process.env.SENDGRID_API_KEY;
const EMAIL_ENABLED = !!SENDGRID_API_KEY && 
  process.env.ENABLE_EMAIL_NOTIFICATIONS === 'true';

if (EMAIL_ENABLED) {
  try {
    sgMail.setApiKey(SENDGRID_API_KEY);
    console.log('Email service initialized successfully');
  } catch (error) {
    console.error('Failed to initialize email service:', error);
  }
}

export type EmailTemplate = 
  | 'price_alert' 
  | 'weekly_summary' 
  | 'subscription_confirmation' 
  | 'payment_receipt'
  | 'email_verification';

export interface EmailData {
  to: string;
  subject: string;
  templateData: Record<string, any>;
}

export class EmailService {
  private fromEmail: string;

  constructor() {
    // Use the environment variable or a default value
    this.fromEmail = process.env.SENDGRID_FROM_EMAIL || 'noreply@pricehawk.com';
  }

  /**
   * Get HTML template based on template name
   */
  private getTemplate(template: EmailTemplate, data: Record<string, any>): string {
    switch (template) {
      case 'email_verification':
        return `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2 style="color: #333;">Verify Your Email Address</h2>
            <p>Thank you for signing up for PriceHawk! Please verify your email address by clicking the button below:</p>
            <div style="text-align: center; margin: 30px 0;">
              <a href="${data.verificationUrl}" style="background-color: #007bff; color: white; padding: 12px 24px; text-decoration: none; border-radius: 4px; display: inline-block;">Verify Email Address</a>
            </div>
            <p>If the button doesn't work, you can also copy and paste the following link into your browser:</p>
            <p style="word-break: break-all; color: #666;">${data.verificationUrl}</p>
            <p>This link will expire in 24 hours.</p>
            <p>If you didn't sign up for PriceHawk, you can safely ignore this email.</p>
          </div>
        `;
        
      case 'price_alert':
        return `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h1 style="color: #007bff;">Price Drop Alert!</h1>
            <p>Good news! The price of <strong>${data.productTitle}</strong> has dropped to <strong>${data.currentPrice}</strong>.</p>
            <p>Previous price: ${data.previousPrice}</p>
            <div style="margin: 20px 0;">
              <a href="${data.productUrl}" style="background-color: #007bff; color: white; padding: 10px 15px; text-decoration: none; border-radius: 4px;">View Product</a>
            </div>
            <p style="color: #666; font-size: 12px;">You're receiving this email because you set up a price alert on PriceHawk.</p>
          </div>
        `;

      case 'weekly_summary':
        const productItems = data.products.map((p: any) => {
          const priceChangeText = p.priceChange > 0 
            ? `<span style="color: #dc3545;">Price increased by ${p.priceChange}</span>` 
            : p.priceChange < 0 
              ? `<span style="color: #28a745;">Price dropped by ${Math.abs(p.priceChange)}!</span>` 
              : 'No price change';
          
          return `
            <tr>
              <td style="padding: 10px; border-bottom: 1px solid #eee;">
                <strong>${p.title}</strong>
              </td>
              <td style="padding: 10px; border-bottom: 1px solid #eee;">
                ${p.currentPrice}
              </td>
              <td style="padding: 10px; border-bottom: 1px solid #eee;">
                ${priceChangeText}
              </td>
            </tr>
          `;
        }).join('');

        return `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h1 style="color: #007bff;">Your Weekly Price Summary</h1>
            <p>Here's what happened with your tracked products this week:</p>
            
            <table style="width: 100%; border-collapse: collapse;">
              <thead>
                <tr style="background-color: #f8f9fa;">
                  <th style="padding: 10px; text-align: left;">Product</th>
                  <th style="padding: 10px; text-align: left;">Current Price</th>
                  <th style="padding: 10px; text-align: left;">Price Change</th>
                </tr>
              </thead>
              <tbody>
                ${productItems}
              </tbody>
            </table>
            
            <div style="margin: 20px 0;">
              <a href="${process.env.NEXTAUTH_URL}/dashboard" style="background-color: #007bff; color: white; padding: 10px 15px; text-decoration: none; border-radius: 4px;">View Dashboard</a>
            </div>
            
            <p style="color: #666; font-size: 12px;">You're receiving this email because you're subscribed to weekly summaries on PriceHawk.</p>
          </div>
        `;

      case 'subscription_confirmation':
        return `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h1 style="color: #007bff;">Subscription Confirmed</h1>
            <p>Thank you for subscribing to PriceHawk ${data.tier} plan!</p>
            <p>Your subscription is now active and you have access to all the features included in your plan.</p>
            
            <h2 style="margin-top: 20px;">Your Plan Details</h2>
            <ul>
              <li>Plan: <strong>${data.tier}</strong></li>
              <li>Price: <strong>${data.price}</strong></li>
              <li>Billing Cycle: <strong>${data.billingCycle}</strong></li>
              <li>Next Billing Date: <strong>${data.nextBillingDate}</strong></li>
            </ul>
            
            <div style="margin: 20px 0;">
              <a href="${process.env.NEXTAUTH_URL}/settings" style="background-color: #007bff; color: white; padding: 10px 15px; text-decoration: none; border-radius: 4px;">Manage Subscription</a>
            </div>
            
            <p style="color: #666; font-size: 12px;">If you have any questions about your subscription, please contact our support team.</p>
          </div>
        `;

      case 'payment_receipt':
        return `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h1 style="color: #007bff;">Payment Receipt</h1>
            <p>Thank you for your payment to PriceHawk.</p>
            
            <div style="border: 1px solid #eee; padding: 15px; margin: 20px 0;">
              <h2 style="margin-top: 0;">Receipt Details</h2>
              <p><strong>Date:</strong> ${data.date}</p>
              <p><strong>Invoice Number:</strong> ${data.invoiceNumber}</p>
              <p><strong>Amount:</strong> ${data.amount}</p>
              <p><strong>Payment Method:</strong> ${data.paymentMethod}</p>
            </div>
            
            <div style="margin: 20px 0;">
              <a href="${data.invoiceUrl}" style="background-color: #007bff; color: white; padding: 10px 15px; text-decoration: none; border-radius: 4px;">View Invoice</a>
            </div>
            
            <p style="color: #666; font-size: 12px;">This is an automated receipt. Please keep it for your records.</p>
          </div>
        `;

      default:
        return '<p>Email content</p>';
    }
  }

  /**
   * Send a custom email with provided HTML and text content
   */
  async sendEmail(data: {
    to: string;
    subject: string;
    text: string;
    html: string;
  }): Promise<boolean> {
    // Check if email service is enabled
    if (!EMAIL_ENABLED) {
      console.log('Email service is disabled. Would have sent:', {
        to: data.to,
        subject: data.subject,
        text: data.text.substring(0, 50) + '...' // Log just a snippet
      });
      return false;
    }
    
    try {
      const msg = {
        to: data.to,
        from: this.fromEmail,
        subject: data.subject,
        text: data.text,
        html: data.html,
      };

      await sgMail.send(msg);
      return true;
    } catch (error) {
      console.error('Email sending error:', error);
      return false;
    }
  }

  /**
   * Send email using template
   */
  async sendTemplateEmail(template: EmailTemplate, data: EmailData): Promise<boolean> {
    // Check if email service is enabled
    if (!EMAIL_ENABLED) {
      console.log(`Email service is disabled. Would have sent ${template} template to:`, {
        to: data.to,
        subject: data.subject
      });
      return false;
    }
    
    try {
      const html = this.getTemplate(template, data.templateData);
      const text = `${data.subject} - Please view this email in an HTML capable client.`;
      
      const msg = {
        to: data.to,
        from: this.fromEmail,
        subject: data.subject,
        text: text,
        html: html,
      };

      await sgMail.send(msg);
      return true;
    } catch (error) {
      console.error('Email sending error:', error);
      return false;
    }
  }

  /**
   * Send price alert email
   */
  async sendPriceAlert(email: string, productData: {
    productTitle: string;
    currentPrice: string;
    previousPrice: string;
    productUrl: string;
  }): Promise<boolean> {
    return this.sendTemplateEmail('price_alert', {
      to: email,
      subject: `Price Drop Alert: ${productData.productTitle}`,
      templateData: productData,
    });
  }

  /**
   * Send weekly summary email
   */
  async sendWeeklySummary(email: string, productsData: Array<{
    title: string;
    currentPrice: string;
    priceChange: number;
  }>): Promise<boolean> {
    return this.sendTemplateEmail('weekly_summary', {
      to: email,
      subject: 'Your Weekly Price Tracking Summary',
      templateData: { products: productsData },
    });
  }

  /**
   * Send subscription confirmation email
   */
  async sendSubscriptionConfirmation(email: string, subscriptionData: {
    tier: string;
    price: string;
    billingCycle: string;
    nextBillingDate: string;
  }): Promise<boolean> {
    return this.sendTemplateEmail('subscription_confirmation', {
      to: email,
      subject: 'Your PriceHawk Subscription Confirmation',
      templateData: subscriptionData,
    });
  }

  /**
   * Send payment receipt email
   */
  async sendPaymentReceipt(email: string, paymentData: {
    date: string;
    invoiceNumber: string;
    amount: string;
    paymentMethod: string;
    invoiceUrl: string;
  }): Promise<boolean> {
    return this.sendTemplateEmail('payment_receipt', {
      to: email,
      subject: 'Your PriceHawk Payment Receipt',
      templateData: paymentData,
    });
  }

  /**
   * Send email verification email
   */
  async sendVerificationEmail(email: string, token: string): Promise<boolean> {
    const verificationUrl = `${process.env.NEXTAUTH_URL}/auth/verify?token=${token}`;
    
    return this.sendTemplateEmail('email_verification', {
      to: email,
      subject: 'Verify your email address for PriceHawk',
      templateData: {
        verificationUrl,
      },
    });
  }
}

// Export a singleton instance
export const emailService = new EmailService();
