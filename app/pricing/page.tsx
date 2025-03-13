'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { loadStripe } from '@stripe/stripe-js';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { useToast } from '@/hooks/use-toast';
import { Badge } from '@/components/ui/badge';

// Initialize Stripe
const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!);

// Define subscription tiers
const tiers = [
  {
    name: 'Free',
    tierName: 'FREE',
    price: { monthly: 0, yearly: 0 },
    description: 'Basic price tracking for casual shoppers',
    features: [
      'Track up to 3 products',
      'Basic price alerts (1 per product)',
      '30 days of price history',
    ],
    buttonText: 'Free Plan',
  },
  {
    name: 'Basic',
    tierName: 'BASIC',
    price: { monthly: 7.99, yearly: 79.99 },
    description: 'Enhanced tracking for regular online shoppers',
    features: [
      'Track up to 10 products',
      'Up to 5 price alerts per product',
      '90 days of price history',
      'Weekly summary emails',
      'Ad-free experience',
    ],
    buttonText: 'Subscribe',
  },
  {
    name: 'Premium',
    tierName: 'PREMIUM',
    price: { monthly: 14.99, yearly: 149.99 },
    description: 'Advanced tracking for deal hunters',
    features: [
      'Track up to 30 products',
      'Unlimited price alerts',
      'Unlimited price history',
      'Daily summary emails',
      'Price trend predictions',
      'Retailer comparison',
      'Deal sharing with friends',
    ],
    buttonText: 'Subscribe',
  },
  {
    name: 'Professional',
    tierName: 'PROFESSIONAL',
    price: { monthly: 29.99, yearly: 299.99 },
    description: 'Complete solution for power users',
    features: [
      'Track up to 100 products',
      'Unlimited price alerts',
      'Unlimited price history',
      'Real-time notifications',
      'Advanced analytics',
      'API access',
      'Priority support',
      'Custom alert rules',
      'Bulk import/export',
      'Team sharing (up to 3 users)',
    ],
    buttonText: 'Subscribe',
  },
];

export default function PricingPage() {
  const [isYearly, setIsYearly] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedTier, setSelectedTier] = useState('FREE'); 
  const [currentPlan, setCurrentPlan] = useState('FREE');
  const [isLoadingPlan, setIsLoadingPlan] = useState(true);
  const [isSyncing, setIsSyncing] = useState(false);
  const router = useRouter();
  const { toast } = useToast();
  
  // Normalize tier name to ensure consistent comparison
  const normalizeTierName = (tierName: string) => {
    // Convert to uppercase and trim whitespace
    const normalized = String(tierName).toUpperCase().trim();
    
    // Map common variations to standard tier names
    const tierMap: Record<string, string> = {
      'FREE': 'FREE',
      'BASIC': 'BASIC',
      'PREMIUM': 'PREMIUM',
      'PROFESSIONAL': 'PROFESSIONAL',
      'PRO': 'PROFESSIONAL', // Handle potential "PRO" shorthand
    };
    
    return tierMap[normalized] || normalized;
  };
  
  // Fetch current subscription with improved sync mechanism - matching the subscription page implementation
  const fetchSubscription = async (forceRefresh = false) => {
    try {
      if (forceRefresh) {
        setIsSyncing(true);
      }
      
      // Add cache-busting timestamp and force parameter if needed
      const url = new URL('/api/subscriptions/status', window.location.origin);
      url.searchParams.append('t', Date.now().toString());
      
      if (forceRefresh) {
        url.searchParams.append('force_refresh', 'true');
      }
      
      const response = await fetch(url.toString(), {
        cache: 'no-store', // Tell fetch to bypass cache
        headers: {
          'Cache-Control': 'no-cache, no-store', // Also set cache control headers
          'Pragma': 'no-cache'
        }
      });
      
      if (!response.ok) {
        throw new Error('Failed to fetch subscription status');
      }
      
      const data = await response.json();
      console.log('Raw subscription data:', data);
      
    console.log('Raw subscription data:', data);
    
    // Handle the response structure correctly - it comes directly as the subscription info
    if (data && data.tier) {
      // Extract and normalize the tier from the subscription data
      const rawTierName = data.tier || '';
      const normalizedTierName = normalizeTierName(rawTierName);
      
      console.log('Raw tier from API:', rawTierName);
      console.log('Normalized tier name:', normalizedTierName);
      
      // Default to FREE only if we don't have a tier at all
      const finalTierName = normalizedTierName || 'FREE';
      
      setCurrentPlan(finalTierName);
      setSelectedTier(finalTierName);
      console.log('Current plan set to:', finalTierName);
    } else {
      console.log('No subscription data found, using FREE as default');
      setCurrentPlan('FREE');
    }
    } catch (error) {
      console.error('Error fetching subscription:', error);
      toast({
        title: "Subscription Error",
        description: "Could not load your subscription data. Using free plan as default.",
        variant: "destructive"
      });
    } finally {
      setIsLoadingPlan(false);
      setIsSyncing(false);
    }
  };
  
  // Force sync subscription with Stripe
  const syncWithStripe = async () => {
    setIsSyncing(true);
    try {
      // Call the force sync API endpoint for a comprehensive refresh
      const response = await fetch('/api/subscriptions/force-sync', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        }
      });
      
      if (!response.ok) {
        throw new Error('Failed to synchronize subscription');
      }
      
      toast({
        title: 'Subscription Synchronized',
        description: 'Your subscription has been synchronized with Stripe.',
      });
      
      // Refresh subscription data
      await fetchSubscription(true);
    } catch (error: any) {
      console.error('Failed to sync subscription:', error);
      toast({
        title: 'Error',
        description: error.message || 'Failed to synchronize subscription',
        variant: 'destructive',
      });
    } finally {
      setIsSyncing(false);
    }
  };
  
  // Initial fetch on component mount
  useEffect(() => {
    fetchSubscription();
  }, []);
  
  const handleSubscribe = async (tierName: string, isYearly: boolean) => {
    if (!tierName) return;
    
    // Update the selected tier
    setSelectedTier(tierName);
    
    // Don't proceed if it's the free tier
    if (tierName === 'FREE') return;
    
    // Don't proceed if it's the current plan
    if (tierName === currentPlan) {
      toast({
        title: 'Information',
        description: `You are already subscribed to the ${tierName} plan.`,
      });
      return;
    }
    
    setIsLoading(true);
    
    try {
      // Create a checkout session
      const response = await fetch('/api/subscriptions/create-checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tierName, isYearly }),
      });
      
      if (!response.ok) {
        throw new Error('Failed to create checkout session');
      }
      
      const { sessionId } = await response.json();
      
      // Redirect to Stripe checkout
      const stripe = await stripePromise;
      if (stripe) {
        const { error } = await stripe.redirectToCheckout({ sessionId });
        if (error) {
          throw new Error(error.message);
        }
      }
    } catch (error: any) {
      console.error('Subscription error:', error);
      toast({
        title: 'Error',
        description: error.message || 'Failed to create checkout session',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };
  
  const handlePlanClick = (tierName: string) => {
    setSelectedTier(tierName);
  };
  
  // Determine button text based on current plan and selected tier
  const getButtonText = (tier: any) => {
    if (isLoading && selectedTier === tier.tierName) {
      return 'Processing...';
    }
    
    if (tier.tierName === currentPlan) {
      return 'Current Plan';
    }
    
    return tier.buttonText;
  };
  
  // Determine button variant based on whether this is the current plan or selected tier
  const getButtonVariant = (tier: any) => {
    if (tier.tierName === currentPlan) {
      return 'secondary';
    }
    
    if (selectedTier === tier.tierName) {
      return 'default';
    }
    
    return 'outline';
  };
  
  return (
    <div className="container mx-auto py-12">
      <div className="text-center mb-12">
        <h1 className="text-4xl font-bold mb-4">Choose Your Plan</h1>
        <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
          Select the plan that best fits your needs. All plans include our core price tracking features.
        </p>
      </div>
      
      <div className="flex items-center justify-center mb-8">
        <span className={`mr-2 ${!isYearly ? 'font-bold' : ''}`}>Monthly</span>
        <Switch checked={isYearly} onCheckedChange={setIsYearly} />
        <span className={`ml-2 ${isYearly ? 'font-bold' : ''}`}>
          Yearly <span className="text-green-500">(Save 16%)</span>
        </span>
      </div>
      
      {/* Subscription sync alert */}
      {!isLoadingPlan && currentPlan !== 'FREE' && (
        <div className="flex items-center justify-center mb-4">
          <div className="p-3 rounded-md bg-blue-50 text-blue-800 flex items-center max-w-xl">
            <div>
              <p className="font-medium text-sm">Having trouble with your subscription display?</p>
              <div className="flex items-center mt-1">
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={syncWithStripe} 
                  disabled={isSyncing}
                  className="h-7 text-xs bg-white"
                >
                  {isSyncing ? 'Syncing...' : 'Sync with Stripe'}
                </Button>
                <span className="text-xs ml-2">to refresh your subscription data</span>
              </div>
            </div>
          </div>
        </div>
      )}
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {tiers.map((tier) => (
          <Card 
            key={tier.name} 
            className={`p-6 cursor-pointer transition-all duration-200 hover:shadow-md ${
              selectedTier === tier.tierName ? 'border-primary shadow-lg' : 
              tier.tierName === currentPlan ? 'border-secondary shadow-md' : ''
            }`}
            onClick={() => handlePlanClick(tier.tierName)}
          >
            <div className="flex justify-between items-start mb-2">
              <h2 className="text-2xl font-bold">{tier.name}</h2>
              {/* Removed "YOUR PLAN" badge as requested */}
            </div>
            <p className="text-muted-foreground mb-4">{tier.description}</p>
            
            <div className="text-3xl font-bold mb-4">
              ${isYearly ? tier.price.yearly : tier.price.monthly}
              {tier.price.monthly > 0 && (
                <span className="text-sm font-normal text-muted-foreground">
                  /{isYearly ? 'year' : 'month'}
                </span>
              )}
            </div>
            
            <ul className="mb-6 space-y-2">
              {tier.features.map((feature) => (
                <li key={feature} className="flex items-center">
                  <svg className="w-4 h-4 mr-2 text-green-500" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                  {feature}
                </li>
              ))}
            </ul>
            
            <Button 
              className="w-full" 
              variant={getButtonVariant(tier) as any}
              onClick={(e) => {
                e.stopPropagation(); // Prevent card click from triggering
                if (tier.price.monthly > 0 && tier.tierName !== currentPlan) {
                  handleSubscribe(tier.tierName, isYearly);
                }
              }}
              disabled={isLoadingPlan || (tier.tierName === currentPlan) || (isLoading && selectedTier === tier.tierName)}
            >
              {isLoadingPlan ? 'Loading...' : getButtonText(tier)}
            </Button>
          </Card>
        ))}
      </div>
      
      <div className="mt-12 text-center">
        <h2 className="text-2xl font-bold mb-4">All Plans Include</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 max-w-3xl mx-auto">
          <div className="p-4">
            <h3 className="font-bold mb-2">Real-Time Price Tracking</h3>
            <p className="text-muted-foreground">Track prices across Amazon, Walmart, Best Buy, and more.</p>
          </div>
          <div className="p-4">
            <h3 className="font-bold mb-2">Price Drop Alerts</h3>
            <p className="text-muted-foreground">Get notified when prices drop to your desired threshold.</p>
          </div>
          <div className="p-4">
            <h3 className="font-bold mb-2">Price History Charts</h3>
            <p className="text-muted-foreground">Visualize price changes over time to make informed decisions.</p>
          </div>
        </div>
      </div>
      
      <div className="mt-12 text-center">
        <h2 className="text-2xl font-bold mb-4">Frequently Asked Questions</h2>
        <div className="max-w-3xl mx-auto space-y-6">
          <div>
            <h3 className="font-bold mb-2">Can I change plans later?</h3>
            <p className="text-muted-foreground">Yes, you can upgrade or downgrade your plan at any time. Changes take effect at the start of your next billing cycle.</p>
          </div>
          <div>
            <h3 className="font-bold mb-2">Is there a free trial?</h3>
            <p className="text-muted-foreground">We offer a free tier with limited features that you can use indefinitely. This allows you to try the core functionality before subscribing.</p>
          </div>
          <div>
            <h3 className="font-bold mb-2">How do I cancel my subscription?</h3>
            <p className="text-muted-foreground">You can cancel your subscription at any time from your account settings. You'll continue to have access until the end of your current billing period.</p>
          </div>
        </div>
      </div>
    </div>
  );
}
