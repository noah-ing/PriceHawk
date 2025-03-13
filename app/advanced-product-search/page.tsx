/**
 * Advanced Product Search
 * 
 * Premium feature that provides advanced product search and analysis capabilities.
 * This page is only accessible to paid subscription tiers.
 */

"use client";

// Skip static generation - force dynamic rendering
export const dynamic = 'force-dynamic';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { UrlInputForm } from '@/components/url-input-form';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { ProductData } from '@/lib/scrapers/base-scraper';
import { useSession } from 'next-auth/react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { MessageSquare, Clock, Zap, Shield, LineChart } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function AdvancedProductSearchPage() {
  const router = useRouter();
  const { data: session, status } = useSession();
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [hasAccess, setHasAccess] = useState<boolean | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  
  // Check if user has access to this premium feature
  useEffect(() => {
    async function checkSubscription() {
      if (status === 'loading') return;

      if (status === 'unauthenticated') {
        setHasAccess(false);
        setIsLoading(false);
        return;
      }

      try {
        const response = await fetch('/api/subscriptions/status');
        const data = await response.json();
        
        // Only Basic tier and above have access to this feature
        const hasAccessToFeature = data.subscription && 
          ['BASIC', 'PREMIUM', 'PROFESSIONAL'].includes(data.subscription.tier?.toUpperCase());
        
        setHasAccess(hasAccessToFeature);
      } catch (err) {
        console.error('Error checking subscription:', err);
        setError('Failed to verify subscription status');
      } finally {
        setIsLoading(false);
      }
    }

    checkSubscription();
  }, [status]);

  const handleAddProduct = async (productData: ProductData) => {
    if (!session?.user) {
      setError('You must be logged in to add products to your dashboard');
      return;
    }

    try {
      // First, ensure we have the product URL
      if (!productData.productUrl) {
        throw new Error('Product URL is missing');
      }

      // Clear any previous errors or success messages
      setError(null);
      setSuccess(null);
      
      console.log('Adding product to dashboard:', productData.productUrl);

      // Make the API request to add the product
      const response = await fetch('/api/products', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          url: productData.productUrl,
        }),
      });

      // Parse the response
      const result = await response.json();
      
      console.log('API response:', response.status, result);

      // Check if the request was successful
      if (!response.ok) {
        if (response.status === 401) {
          setError('Authentication error. Please sign in again.');
          return;
        }
        throw new Error(result.error?.message || 'Failed to add product');
      }

      // Show success message
      setSuccess('Product added to your dashboard successfully!');
      
      // Redirect to products page after a short delay
      setTimeout(() => {
        router.push('/products');
      }, 2000);
    } catch (err) {
      console.error('Error adding product:', err);
      setError(`Failed to add product to dashboard: ${err instanceof Error ? err.message : 'Unknown error'}`);
    }
  };

  // Show loading state
  if (isLoading) {
    return (
      <div className="container mx-auto py-16 px-4 flex justify-center">
        <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full"></div>
      </div>
    );
  }

  // Show upgrade prompt if user doesn't have access
  if (hasAccess === false) {
    return (
      <div className="container mx-auto py-8 px-4">
        <div className="max-w-4xl mx-auto">
          <div className="bg-gradient-to-r from-blue-600 to-indigo-600 rounded-lg p-6 mb-6 text-white">
            <h1 className="text-3xl font-bold mb-2">Advanced Product Search</h1>
            <p className="opacity-90 mb-0">
              A premium feature for detailed product analysis and smarter shopping.
            </p>
          </div>
          
          <Card className="mb-8 border-2 border-primary/20">
            <CardHeader className="bg-muted/30">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Subscription Required</CardTitle>
                  <CardDescription>
                    This feature is available to Basic, Premium, and Professional subscribers.
                  </CardDescription>
                </div>
                <Badge variant="outline" className="bg-primary/10 text-primary">Premium Feature</Badge>
              </div>
            </CardHeader>
            <CardContent className="pt-6">
              <div className="text-center py-8">
                <div className="mb-6">
                  <LineChart className="h-16 w-16 mx-auto text-primary opacity-70 mb-4" />
                  <h2 className="text-2xl font-semibold mb-2">Unlock Advanced Product Search</h2>
                  <p className="text-muted-foreground max-w-md mx-auto">
                    Upgrade your subscription to gain access to our advanced product search capabilities, 
                    real-time price analysis, and deeper market insights.
                  </p>
                </div>
                
                <div className="flex gap-4 flex-col sm:flex-row justify-center mb-6">
                  <Button 
                    variant="default" 
                    className="px-6"
                    onClick={() => router.push('/pricing')}
                  >
                    View Pricing Options
                  </Button>
                  <Button 
                    variant="outline"
                    onClick={() => router.push('/products')}
                  >
                    Return to Dashboard
                  </Button>
                </div>
              </div>
              
              <Separator className="my-6" />
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="flex items-start gap-3">
                  <Zap className="h-5 w-5 text-primary mt-0.5" />
                  <div>
                    <h3 className="font-medium">Real-Time Market Analysis</h3>
                    <p className="text-sm text-muted-foreground">Comprehensive market data for smarter purchasing decisions</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <MessageSquare className="h-5 w-5 text-primary mt-0.5" />
                  <div>
                    <h3 className="font-medium">Product Insights</h3>
                    <p className="text-sm text-muted-foreground">Deeper analysis of product pricing, availability, and history</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <Clock className="h-5 w-5 text-primary mt-0.5" />
                  <div>
                    <h3 className="font-medium">Extended Price History</h3>
                    <p className="text-sm text-muted-foreground">View longer price history trends across multiple retailers</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <Shield className="h-5 w-5 text-primary mt-0.5" />
                  <div>
                    <h3 className="font-medium">Anti-Bot Protection</h3>
                    <p className="text-sm text-muted-foreground">Cutting-edge techniques to scrape even protected retail sites</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  // Main content for users with access
  return (
    <div className="container mx-auto py-8 px-4">
      <div className="max-w-4xl mx-auto">
        <div className="bg-gradient-to-r from-blue-600 to-indigo-600 rounded-lg p-6 mb-6 text-white">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold mb-2">Advanced Product Search</h1>
              <p className="opacity-90 mb-0">
                Find the best deals with real-time price tracking and detailed analysis.
              </p>
            </div>
            <Badge variant="outline" className="bg-white/10 text-white border-white/20">
              Premium Feature
            </Badge>
          </div>
        </div>
        
        <Card className="mb-8 shadow-md">
          <CardHeader>
            <CardTitle>Market Price Analysis</CardTitle>
            <CardDescription>
              Paste a product URL from any supported retailer for instant analysis and detailed insights.
            </CardDescription>
          </CardHeader>
          <CardContent>
            {error && (
              <Alert variant="destructive" className="mb-4">
                <AlertTitle>Error</AlertTitle>
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}
            
            {success && (
              <Alert variant="default" className="mb-4 bg-green-50 text-green-800 border-green-200">
                <AlertTitle>Success</AlertTitle>
                <AlertDescription>{success}</AlertDescription>
              </Alert>
            )}
            
            <div className="bg-muted/30 p-4 rounded-lg mb-6">
              <UrlInputForm onSuccess={handleAddProduct} />
            </div>
            
            <div className="text-sm text-muted-foreground p-3 bg-primary/5 rounded-md mt-4">
              <p className="font-medium text-primary">Pro Tip:</p>
              <p>For best results, use direct product URLs from the retailer's website rather than search result pages.</p>
            </div>
          </CardContent>
        </Card>
        
        <Card className="shadow-md">
          <CardHeader>
            <CardTitle>Supported Retailers</CardTitle>
            <CardDescription>
              We support price tracking across these major retailers with premium accuracy.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="rounded-lg p-4 bg-gradient-to-br from-amber-50 to-amber-100 border border-amber-200">
                <h3 className="font-semibold text-lg mb-2 text-amber-800">Amazon</h3>
                <p className="text-sm text-amber-700 mb-3">Wide range of products across multiple categories with advanced price tracking.</p>
                <div className="flex items-center text-xs text-amber-600">
                  <Shield className="h-3 w-3 mr-1" />
                  <span>Anti-Bot Protection Active</span>
                </div>
              </div>
              <div className="rounded-lg p-4 bg-gradient-to-br from-blue-50 to-blue-100 border border-blue-200">
                <h3 className="font-semibold text-lg mb-2 text-blue-800">Walmart</h3>
                <p className="text-sm text-blue-700 mb-3">Competitive pricing on electronics, home goods, with enhanced availability tracking.</p>
                <div className="flex items-center text-xs text-blue-600">
                  <Zap className="h-3 w-3 mr-1" />
                  <span>Real-Time Analytics</span>
                </div>
              </div>
              <div className="rounded-lg p-4 bg-gradient-to-br from-yellow-50 to-yellow-100 border border-yellow-200">
                <h3 className="font-semibold text-lg mb-2 text-yellow-800">Best Buy</h3>
                <p className="text-sm text-yellow-700 mb-3">Specialized electronics tracking with detailed specification comparison.</p>
                <div className="flex items-center text-xs text-yellow-600">
                  <LineChart className="h-3 w-3 mr-1" />
                  <span>Price Trend Analysis</span>
                </div>
              </div>
            </div>
          </CardContent>
          <CardFooter className="bg-muted/20 px-6 py-4">
            <p className="text-xs text-muted-foreground">
              Data is extracted in real-time using our enterprise-grade scraping engine with advanced anti-bot protection.
              Always ensure you have the rights to access and use the data in compliance with retailers' terms of service.
            </p>
          </CardFooter>
        </Card>
      </div>
    </div>
  );
}
