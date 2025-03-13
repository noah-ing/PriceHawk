'use client';

import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { useToast } from '@/hooks/use-toast';
import { SubscriptionInfo } from '@/lib/services/subscription-service';
import { NavBar } from '@/components/nav-bar';
import { Badge } from '@/components/ui/badge';
import { AlertCircle, CheckCircle2 } from 'lucide-react';

export default function SubscriptionPage() {
  const [subscription, setSubscription] = useState<SubscriptionInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [managingSubscription, setManagingSubscription] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [showSuccessBanner, setShowSuccessBanner] = useState(false);
  const router = useRouter();
  const { toast } = useToast();
  const searchParams = useSearchParams();
  
  // Get query parameters to detect if we're returning from checkout or portal
  const sessionId = searchParams.get('session_id');
  const returnFromPortal = searchParams.get('return_from_portal');
  
  // Track if we're coming back from checkout or portal
  const isReturningFromCheckout = !!sessionId;
  const isReturningFromPortal = !!returnFromPortal;
  
  const fetchSubscription = async (forceRefresh = false) => {
    try {
      setIsRefreshing(forceRefresh);
      
      // Add cache-busting timestamp and force parameter if needed
      const url = new URL('/api/subscriptions/status', window.location.origin);
      url.searchParams.append('t', Date.now().toString());
      
      if (forceRefresh) {
        url.searchParams.append('force_refresh', 'true');
      }
      
      if (isReturningFromCheckout) {
        url.searchParams.append('session_id', sessionId || '');
      }
      
      if (isReturningFromPortal) {
        url.searchParams.append('return_from_portal', 'true');
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
      console.log('Subscription data:', data);
      setSubscription(data);
      
      // Show success banner if we just completed checkout
      if (isReturningFromCheckout && forceRefresh) {
        setShowSuccessBanner(true);
        setTimeout(() => setShowSuccessBanner(false), 5000); // Hide after 5 seconds
      }
    } catch (error: any) {
      console.error('Failed to fetch subscription:', error);
      toast({
        title: 'Error',
        description: error.message || 'Failed to fetch subscription status',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
      setIsRefreshing(false);
    }
  };
  
  // Initial fetch on component mount
  useEffect(() => {
    const initialFetch = async () => {
      // If returning from checkout or portal, force a refresh
      if (isReturningFromCheckout || isReturningFromPortal) {
        console.log('Returning from checkout or portal, forcing refresh');
        await fetchSubscription(true);
      } else {
        await fetchSubscription(false);
      }
    };
    
    initialFetch();
    
    // Add a second fetch with delay if returning from checkout to handle race conditions
    if (isReturningFromCheckout) {
      const timeoutId = setTimeout(() => {
        console.log('Running delayed forced refresh after checkout');
        fetchSubscription(true);
      }, 2000); // 2 second delay
      
      return () => clearTimeout(timeoutId);
    }
  }, [sessionId, returnFromPortal]);
  
  const handleManageSubscription = async () => {
    setManagingSubscription(true);
    
    try {
      const response = await fetch('/api/subscriptions/portal', {
        method: 'POST',
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        // Handle the specific case of portal not being configured
        if (data.error === 'portal_not_configured') {
          toast({
            title: 'Portal Not Configured',
            description: (
              <div className="space-y-2">
                <p>{data.message}</p>
                <p className="text-sm">To configure your Stripe portal:</p>
                <p className="text-sm">
                  <a 
                    href={data.stripeConfigUrl} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="underline text-blue-600"
                  >
                    Configure in Stripe Dashboard
                  </a>
                </p>
              </div>
            ),
            variant: 'destructive',
            duration: 10000 // Show for longer
          });
          // Redirect to pricing page as a fallback
          router.push('/pricing');
        } else {
          // Generic error handling
          throw new Error(data.message || 'Failed to create portal session');
        }
        
        setManagingSubscription(false);
        return;
      }
      
      if (data.url) {
        window.location.href = data.url;
      } else {
        throw new Error('No URL returned from portal session creation');
      }
    } catch (error: any) {
      console.error('Failed to create portal session:', error);
      toast({
        title: 'Error',
        description: error.message || 'Failed to create portal session',
        variant: 'destructive',
      });
      setManagingSubscription(false);
    }
  };
  
  const formatFeatureName = (feature: string) => {
    return feature
      .split('_')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  };
  
  if (loading) {
    return (
      <div className="flex min-h-screen w-full bg-muted/10">
        <NavBar />
        <div className="flex flex-1 flex-col">
          <main className="flex-1 p-6">
            <div className="flex flex-col gap-6">
              <h1 className="text-3xl font-bold tracking-tight">Subscription</h1>
              <div className="space-y-4">
                <Skeleton className="h-8 w-1/3" />
                <Skeleton className="h-32 w-full" />
                <Skeleton className="h-32 w-full" />
              </div>
            </div>
          </main>
        </div>
      </div>
    );
  }
  
  if (!subscription) {
    return (
      <div className="flex min-h-screen w-full bg-muted/10">
        <NavBar />
        <div className="flex flex-1 flex-col">
          <main className="flex-1 p-6">
            <div className="flex flex-col gap-6">
              <h1 className="text-3xl font-bold tracking-tight">Subscription</h1>
              <div className="p-4 border rounded-md bg-red-50 text-red-800">
                <p>Failed to load subscription data. Please try refreshing the page.</p>
                <Button 
                  variant="outline" 
                  className="mt-2" 
                  onClick={() => fetchSubscription(true)}
                  disabled={isRefreshing}
                >
                  {isRefreshing ? 'Refreshing...' : 'Refresh Now'}
                </Button>
              </div>
            </div>
          </main>
        </div>
      </div>
    );
  }
  
  const tierDisplay = subscription.tier === 'FREE' 
    ? 'Free Plan' 
    : `${subscription.tier.charAt(0)}${subscription.tier.slice(1).toLowerCase()} Plan`;
  
  return (
    <div className="flex min-h-screen w-full bg-muted/10">
      <NavBar />
      <div className="flex flex-1 flex-col">
        <main className="flex-1 p-6">
          <div className="flex flex-col gap-6">
            <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
              <h1 className="text-3xl font-bold tracking-tight">Subscription</h1>
              <div className="flex gap-2">
                <Button 
                  variant="default"
                  onClick={async () => {
                    setIsRefreshing(true);
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
                      setIsRefreshing(false);
                    }
                  }}
                  disabled={isRefreshing}
                >
                  {isRefreshing ? 'Synchronizing...' : 'Synchronize Subscription'}
                </Button>
                
                {subscription.tier !== 'FREE' && (
                  <Button 
                    onClick={handleManageSubscription}
                    disabled={managingSubscription}
                  >
                    {managingSubscription ? 'Loading...' : 'Manage Subscription'}
                  </Button>
                )}
              </div>
            </div>
            
            {!isRefreshing && subscription.tier !== 'FREE' && (
              <div className="p-4 rounded-md bg-blue-50 text-blue-800 flex items-center">
                <AlertCircle className="h-5 w-5 mr-2" />
                <div>
                  <p className="font-medium">Having trouble with your subscription?</p>
                  <p className="text-sm">If your subscription status doesn't match what you expect, click the "Sync with Stripe" button above to refresh your data.</p>
                </div>
              </div>
            )}
            
            {showSuccessBanner && (
              <div className="p-4 rounded-md bg-green-50 text-green-800 flex items-center">
                <CheckCircle2 className="h-5 w-5 mr-2" />
                <p>Subscription updated successfully! Your new plan is now active.</p>
              </div>
            )}
            
            {isRefreshing && (
              <div className="p-4 rounded-md bg-blue-50 text-blue-800 flex items-center">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-800 mr-2"></div>
                <p>Refreshing subscription data...</p>
              </div>
            )}
            
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-xl font-semibold">{tierDisplay}</CardTitle>
                  {subscription.status && subscription.status !== 'active' && (
                    <Badge variant="destructive">{subscription.status}</Badge>
                  )}
                </div>
                {subscription.periodEnd && (
                  <p className="text-sm text-muted-foreground">
                    Next billing date: {new Date(subscription.periodEnd).toLocaleDateString()}
                  </p>
                )}
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                  <div className="border rounded-md p-4">
                    <h3 className="font-medium mb-2">Product Limit</h3>
                    <p className="text-2xl font-bold">{subscription.limits.maxProducts}</p>
                  </div>
                  
                  <div className="border rounded-md p-4">
                    <h3 className="font-medium mb-2">Alerts Per Product</h3>
                    <p className="text-2xl font-bold">
                      {subscription.limits.maxAlertsPerProduct === 999 ? 'Unlimited' : subscription.limits.maxAlertsPerProduct}
                    </p>
                  </div>
                  
                  <div className="border rounded-md p-4">
                    <h3 className="font-medium mb-2">Price History</h3>
                    <p className="text-2xl font-bold">
                      {subscription.limits.priceHistoryDays === 730 ? '2 years' : 
                      subscription.limits.priceHistoryDays === 365 ? '1 year' : 
                      `${subscription.limits.priceHistoryDays} days`}
                    </p>
                  </div>
                </div>
                
                <div>
                  <h3 className="font-medium mb-2">Features</h3>
                  <ul className="space-y-1">
                    {Array.isArray(subscription.features) && subscription.features.length > 0 ? (
                      subscription.features.map((feature) => (
                        <li key={feature} className="flex items-center">
                          <svg className="w-4 h-4 mr-2 text-green-500" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                          </svg>
                          {formatFeatureName(feature)}
                        </li>
                      ))
                    ) : (
                      <li className="text-muted-foreground">No additional features</li>
                    )}
                  </ul>
                </div>
                
                {subscription.tier === 'FREE' && (
                  <div className="mt-6">
                    <Button onClick={() => router.push('/pricing')}>
                      Upgrade Your Plan
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader>
                <CardTitle className="text-xl font-semibold">Email Preferences</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground mb-4">
                  Manage your email notification preferences. These settings apply to all subscription tiers,
                  though some notification types may only be available on higher tiers.
                </p>
                
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="font-medium">Price Drop Alerts</h3>
                      <p className="text-sm text-muted-foreground">Get notified when prices drop to your target price</p>
                    </div>
                    <Button variant="outline" size="sm">
                      Manage
                    </Button>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="font-medium">Weekly Summaries</h3>
                      <p className="text-sm text-muted-foreground">Receive a weekly summary of price changes</p>
                    </div>
                    <Button variant="outline" size="sm">
                      Manage
                    </Button>
                  </div>
                  
                  {(subscription.tier === 'PREMIUM' || subscription.tier === 'PROFESSIONAL') && (
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="font-medium">Daily Summaries</h3>
                        <p className="text-sm text-muted-foreground">Receive a daily summary of price changes</p>
                      </div>
                      <Button variant="outline" size="sm">
                        Manage
                      </Button>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </main>
      </div>
    </div>
  );
}
