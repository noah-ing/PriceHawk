import { NextRequest, NextResponse } from 'next/server';
import stripe from '@/lib/stripe';
import { subscriptionService } from '@/lib/services/subscription-service';
import { emailService } from '@/lib/services/email-service';
import { prisma } from '@/lib/db/prisma';

/**
 * API route to handle Stripe webhook events
 * 
 * POST /api/subscriptions/webhook
 */
export async function POST(req: NextRequest) {
  const body = await req.text();
  const signature = req.headers.get('stripe-signature') as string;
  
  if (!signature) {
    return NextResponse.json({ error: 'Missing signature' }, { status: 400 });
  }
  
  if (!process.env.STRIPE_WEBHOOK_SECRET) {
    return NextResponse.json({ error: 'Webhook secret not configured' }, { status: 500 });
  }
  
  try {
    // Verify the webhook signature
    const event = stripe.webhooks.constructEvent(
      body,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET
    );
    
    // Handle different event types
    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object as any;
        
        // If this is a subscription checkout, handle it
        if (session.mode === 'subscription') {
          const subscriptionId = session.subscription;
          const userId = session.metadata.userId;
          
          // Get the subscription details from Stripe
          const subscription = await stripe.subscriptions.retrieve(subscriptionId);
          
          // Update the user's subscription information
          await subscriptionService.handleSubscriptionUpdated(subscription);
          
          // Get the user's email
          const user = await prisma.user.findUnique({
            where: { id: userId },
          });
          
          if (user && user.email) {
            // Get the price ID from the subscription
            const priceId = subscription.items.data[0].price.id;
            
            // Find the subscription tier with this price ID
            const tier = await prisma.subscriptionTier.findFirst({
              where: {
                OR: [
                  { stripePriceIdMonthly: priceId },
                  { stripePriceIdYearly: priceId },
                ],
              },
            });
            
            if (tier) {
              // Determine if this is a monthly or yearly subscription
              const isYearly = tier.stripePriceIdYearly === priceId;
              const price = isYearly ? `$${tier.yearlyPrice}/year` : `$${tier.monthlyPrice}/month`;
              
              // Send a subscription confirmation email
              await emailService.sendSubscriptionConfirmation(user.email, {
                tier: tier.displayName,
                price,
                billingCycle: isYearly ? 'Yearly' : 'Monthly',
                nextBillingDate: new Date(subscription.current_period_end * 1000).toLocaleDateString(),
              });
            }
          }
        }
        break;
      }
      
      case 'customer.subscription.created':
      case 'customer.subscription.updated': {
        const subscription = event.data.object;
        await subscriptionService.handleSubscriptionUpdated(subscription);
        break;
      }
      
      case 'customer.subscription.deleted': {
        const subscription = event.data.object;
        
        // Find the user with this subscription ID
        const user = await prisma.user.findFirst({
          where: { subscriptionId: subscription.id },
        });
        
        if (user) {
          // Reset the user's subscription to FREE
          await prisma.user.update({
            where: { id: user.id },
            data: {
              subscriptionTier: 'FREE',
              subscriptionStatus: 'canceled',
              subscriptionPeriodEnd: null,
              subscriptionId: null,
            },
          });
        }
        break;
      }
      
      case 'invoice.payment_succeeded': {
        const invoice = event.data.object as any;
        
        // Only handle subscription invoices
        if (invoice.subscription) {
          // Find the user with this subscription ID
          const user = await prisma.user.findFirst({
            where: { subscriptionId: invoice.subscription },
          });
          
          if (user && user.email) {
            // Send a payment receipt email
            await emailService.sendPaymentReceipt(user.email, {
              date: new Date(invoice.created * 1000).toLocaleDateString(),
              invoiceNumber: invoice.number,
              amount: `$${(invoice.amount_paid / 100).toFixed(2)}`,
              paymentMethod: invoice.payment_method_details?.type || 'Card',
              invoiceUrl: invoice.hosted_invoice_url,
            });
          }
        }
        break;
      }
      
      case 'invoice.payment_failed': {
        const invoice = event.data.object as any;
        
        // Find the user with this subscription ID
        const user = await prisma.user.findFirst({
          where: { subscriptionId: invoice.subscription },
        });
        
        if (user) {
          // Update the subscription status
          await prisma.user.update({
            where: { id: user.id },
            data: {
              subscriptionStatus: 'past_due',
            },
          });
        }
        break;
      }
    }
    
    return NextResponse.json({ received: true });
  } catch (error: any) {
    console.error('Webhook error:', error);
    return NextResponse.json({ error: error.message }, { status: 400 });
  }
}

// Disable body parsing for webhook requests
export const config = {
  api: {
    bodyParser: false,
  },
};
