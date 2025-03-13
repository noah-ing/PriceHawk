'use client';

import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { useSession } from 'next-auth/react';
import { useSafeSession } from './safe-auth-provider';
import { SubscriptionInfo } from '@/lib/services/subscription-service';
import { useSearchParams } from 'next/navigation';

interface SubscriptionContextType {
  subscription: SubscriptionInfo | null;
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
}

const SubscriptionContext = createContext<SubscriptionContextType>({
  subscription: null,
  loading: true,
  error: null,
  refetch: async () => {},
});

/**
 * Hook to access subscription information
 */
export const useSubscription = () => useContext(SubscriptionContext);

/**
 * Provider component for subscription information
 */
export function SubscriptionProvider({ children }: { children: ReactNode }) {
  const { data: session, status } = useSession();
  const { safeSession, isLoading: safeLoading } = useSafeSession();
  const [subscription, setSubscription] = useState<SubscriptionInfo | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const searchParams = useSearchParams();
  
  const fetchSubscription = async () => {
    // Try to use the regular session first, fall back to safe session if needed
    const isRegularSessionAvailable = status === 'authenticated' && session?.user;
    const isSafeSessionAvailable = !safeLoading && safeSession?.user;
    
    // Don't fetch if no session is available
    if (!isRegularSessionAvailable && !isSafeSessionAvailable) {
      console.log('[Subscription] No session available, using free tier');
      setLoading(false);
      // Set default free tier
      setSubscription({
        tier: 'FREE',
        status: 'active',
        periodEnd: null,
        features: [],
        limits: {
          maxProducts: 3,
          maxAlertsPerProduct: 1,
          priceHistoryDays: 30
        }
      });
      return;
    }
    
    // Log which session we're using
    if (isRegularSessionAvailable) {
      console.log('[Subscription] Using regular session');
    } else if (isSafeSessionAvailable) {
      console.log('[Subscription] Using safe session fallback');
    }
    
    setLoading(true);
    setError(null);
    
    try {
      // Add a timestamp to prevent caching issues
      const timestamp = new Date().getTime();
      const response = await fetch(`/api/subscriptions/status?t=${timestamp}`);
      
      if (response.status === 401) {
        // Handle unauthorized error gracefully
        console.warn('User not authenticated for subscription status');
        setSubscription(null);
        return;
      }
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error('API error response:', errorText);
        throw new Error(`Failed to fetch subscription status: ${response.status} ${response.statusText}`);
      }
      
      const data = await response.json();
      console.log('[Subscription] Received updated subscription data:', data);
      setSubscription(data);
    } catch (error) {
      console.error('Failed to fetch subscription:', error);
      setError(error instanceof Error ? error.message : 'An unexpected error occurred');
      // Set default free tier subscription on error
      setSubscription({
        tier: 'FREE',
        status: 'active',
        periodEnd: null,
        features: [],
        limits: {
          maxProducts: 3,
          maxAlertsPerProduct: 1,
          priceHistoryDays: 30
        }
      });
    } finally {
      setLoading(false);
    }
  };
  
  // Fetch subscription when session changes
  useEffect(() => {
    fetchSubscription();
  }, [session, status]);
  
  // Enhanced refresh subscription data when returning from checkout
  useEffect(() => {
    // Check if we're coming back from a checkout or portal session
    const sessionId = searchParams.get('session_id');
    const returnFromPortal = searchParams.get('return_from_portal');
    
    if (sessionId || returnFromPortal) {
      console.log('[Subscription] Detected return from checkout or portal, refreshing subscription data');
      
      // Set specific loading state for returning from Stripe
      setLoading(true);
      setError(null);
      
      // Add a delay to ensure Stripe webhook has time to process
      setTimeout(() => {
        fetchSubscription()
          .catch(err => {
            console.error('[Subscription] Error refreshing after Stripe return:', err);
            // Force another refresh with delay if this one fails
            setTimeout(fetchSubscription, 2000);
          });
      }, 1000);
    }
  }, [searchParams]);
  
  return (
    <SubscriptionContext.Provider
      value={{
        subscription,
        loading,
        error,
        refetch: fetchSubscription,
      }}
    >
      {children}
    </SubscriptionContext.Provider>
  );
}

/**
 * Helper hook to check if a user has access to a specific feature
 */
export const useFeatureAccess = (feature: string) => {
  const { subscription, loading } = useSubscription();
  
  if (loading) {
    return { hasAccess: false, loading: true };
  }
  
  if (!subscription) {
    return { hasAccess: false, loading: false };
  }
  
  return {
    hasAccess: subscription.features.includes(feature),
    loading: false,
  };
};

/**
 * Helper hook to check if a user can add more products
 */
export const useCanAddProduct = () => {
  const { subscription, loading } = useSubscription();
  
  if (loading) {
    return { canAdd: false, loading: true };
  }
  
  if (!subscription) {
    return { canAdd: false, loading: false };
  }
  
  // This is a simplified check. In reality, we would need to fetch the current product count
  // and compare it to the limit. For now, we'll just return true.
  return {
    canAdd: true,
    loading: false,
    limit: subscription.limits.maxProducts,
  };
};

/**
 * Helper hook to check if a user can add more alerts to a product
 */
export const useCanAddAlert = (productId: string) => {
  const { subscription, loading } = useSubscription();
  
  if (loading) {
    return { canAdd: false, loading: true };
  }
  
  if (!subscription) {
    return { canAdd: false, loading: false };
  }
  
  // This is a simplified check. In reality, we would need to fetch the current alert count
  // for this product and compare it to the limit. For now, we'll just return true.
  return {
    canAdd: true,
    loading: false,
    limit: subscription.limits.maxAlertsPerProduct,
  };
};
