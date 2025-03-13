/**
 * Advanced Product Search Page
 * 
 * This page provides advanced product search and URL-based product tracking functionality.
 * It allows users to add products to their dashboard via direct URL entry.
 */

"use client";

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { UrlInputForm } from '@/components/url-input-form';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { ProductData } from '@/lib/scrapers/base-scraper';
import { useSession } from 'next-auth/react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { NavBar } from '@/components/nav-bar';
import { Info, Store, ShoppingBag, Globe } from 'lucide-react';

export default function AdvancedSearchPage() {
  const router = useRouter();
  const { data: session, status } = useSession();
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

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
  
  return (
    <div className="flex min-h-screen w-full bg-muted/10">
      <NavBar />
      
      <div className="flex flex-1 flex-col">
        <main className="flex-1 p-6">
          <div className="container max-w-5xl mx-auto">
            <div className="flex items-center justify-between mb-6">
              <h1 className="text-3xl font-bold tracking-tight">Advanced Product Search</h1>
              <div className="bg-blue-50 text-blue-800 px-3 py-1 rounded-md text-sm flex items-center">
                <Info className="h-4 w-4 mr-1" />
                <span>Pro Feature</span>
              </div>
            </div>
            
            <p className="text-muted-foreground mb-8">
              Add products directly from any supported retailer using a product URL.
            </p>
            
            {error && (
              <Alert variant="destructive" className="mb-6">
                <AlertTitle>Error</AlertTitle>
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}
            
            {success && (
              <Alert variant="default" className="mb-6 bg-green-50 text-green-800 border-green-200">
                <AlertTitle>Success</AlertTitle>
                <AlertDescription>{success}</AlertDescription>
              </Alert>
            )}
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
              <Card className="bg-gradient-to-br from-sky-50 to-indigo-50 border-sky-100">
                <CardHeader>
                  <div className="flex items-center">
                    <Store className="h-5 w-5 text-sky-600 mr-2" />
                    <CardTitle className="text-sky-900">Direct URL Tracking</CardTitle>
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-sky-800 text-sm">
                    Track products from your favorite online retailers with a direct URL.
                  </p>
                </CardContent>
              </Card>
              
              <Card className="bg-gradient-to-br from-purple-50 to-pink-50 border-purple-100">
                <CardHeader>
                  <div className="flex items-center">
                    <ShoppingBag className="h-5 w-5 text-purple-600 mr-2" />
                    <CardTitle className="text-purple-900">Instant Price Tracking</CardTitle>
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-purple-800 text-sm">
                    Start tracking prices instantly without manually entering product details.
                  </p>
                </CardContent>
              </Card>
              
              <Card className="bg-gradient-to-br from-green-50 to-teal-50 border-green-100">
                <CardHeader>
                  <div className="flex items-center">
                    <Globe className="h-5 w-5 text-green-600 mr-2" />
                    <CardTitle className="text-green-900">Multi-Retailer Support</CardTitle>
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-green-800 text-sm">
                    Track products across multiple retailers to find the best deals.
                  </p>
                </CardContent>
              </Card>
            </div>
            
            <Card className="mb-8">
              <CardHeader>
                <CardTitle>URL-Based Product Tracking</CardTitle>
                <CardDescription>
                  Paste a product URL below to extract pricing and product information in real-time.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <UrlInputForm onSuccess={handleAddProduct} />
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader>
                <CardTitle>Supported Retailers</CardTitle>
                <CardDescription>
                  The following retailers are currently supported for price tracking.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="border rounded-lg p-4">
                    <h3 className="font-semibold text-lg mb-2">Amazon</h3>
                    <p className="text-sm text-gray-600 mb-3">Wide range of products across multiple categories.</p>
                    <Separator className="my-2" />
                    <div className="flex items-center justify-between mt-2">
                      <span className="text-xs text-muted-foreground">Support Level</span>
                      <div className="flex">
                        <div className="w-2 h-2 bg-green-500 rounded-full mr-1"></div>
                        <div className="w-2 h-2 bg-green-500 rounded-full mr-1"></div>
                        <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                      </div>
                    </div>
                  </div>
                  <div className="border rounded-lg p-4">
                    <h3 className="font-semibold text-lg mb-2">Walmart</h3>
                    <p className="text-sm text-gray-600 mb-3">Competitive pricing on electronics, home goods, and more.</p>
                    <Separator className="my-2" />
                    <div className="flex items-center justify-between mt-2">
                      <span className="text-xs text-muted-foreground">Support Level</span>
                      <div className="flex">
                        <div className="w-2 h-2 bg-green-500 rounded-full mr-1"></div>
                        <div className="w-2 h-2 bg-green-500 rounded-full mr-1"></div>
                        <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                      </div>
                    </div>
                  </div>
                  <div className="border rounded-lg p-4">
                    <h3 className="font-semibold text-lg mb-2">Best Buy</h3>
                    <p className="text-sm text-gray-600 mb-3">Specializes in electronics and appliances.</p>
                    <Separator className="my-2" />
                    <div className="flex items-center justify-between mt-2">
                      <span className="text-xs text-muted-foreground">Support Level</span>
                      <div className="flex">
                        <div className="w-2 h-2 bg-green-500 rounded-full mr-1"></div>
                        <div className="w-2 h-2 bg-green-500 rounded-full mr-1"></div>
                        <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </main>
      </div>
    </div>
  );
}
