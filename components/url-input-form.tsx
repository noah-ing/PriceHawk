/**
 * URL Input Form Component
 * 
 * This component provides a form for entering product URLs and displays
 * the scraped product information or error messages.
 */

"use client";

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { ProductData } from '@/lib/scrapers/base-scraper';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Separator } from '@/components/ui/separator';
import { useFetchWithCsrf } from '@/components/CsrfToken';

// Define the form schema using Zod
const formSchema = z.object({
  url: z
    .string()
    .url('Please enter a valid URL')
    .min(1, 'URL is required'),
});

// Type for the form values
type FormValues = z.infer<typeof formSchema>;

// Type for the component props
interface UrlInputFormProps {
  onSuccess?: (data: ProductData) => void;
}

export function UrlInputForm({ onSuccess }: UrlInputFormProps) {
  // Form state
  const {
    register,
    handleSubmit,
    getValues,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      url: '',
    },
  });

  // Component state
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [productData, setProductData] = useState<ProductData | null>(null);

  // Get the CSRF-enabled fetch function
  const { fetchWithCsrf } = useFetchWithCsrf();

  // Handle form submission
  const onSubmit = async (data: FormValues) => {
    setIsLoading(true);
    setError(null);
    setProductData(null);

    try {
      // Call the scrape API with CSRF protection
      const response = await fetchWithCsrf('/api/scrape', {
        method: 'POST',
        body: JSON.stringify({
          url: data.url,
          options: {
            useProxy: true,
            timeout: 15000, // 15 seconds
            retries: 2,
          },
        }),
      });

      // Parse the response
      const result = await response.json();

      // Check if the request was successful
      if (!response.ok || !result.success) {
        const errorMessage = result.error?.message || 'Failed to scrape product data';
        setError(errorMessage);
        return;
      }

      // Set the product data
      setProductData(result.data);
      
      // Note: We don't call onSuccess here anymore, it's called when the "Add to Dashboard" button is clicked
    } catch (err) {
      setError('An unexpected error occurred. Please try again.');
      console.error('Error scraping product:', err);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="w-full max-w-3xl mx-auto">
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <div className="flex flex-col space-y-2">
          <label htmlFor="url" className="text-sm font-medium">
            Product URL
          </label>
          <div className="flex space-x-2">
            <Input
              id="url"
              placeholder="Paste a product URL from Amazon, Walmart, or Best Buy"
              {...register('url')}
              className="flex-1"
              disabled={isLoading}
            />
            <Button type="submit" disabled={isLoading}>
              {isLoading ? 'Scraping...' : 'Track Price'}
            </Button>
          </div>
          {errors.url && (
            <p className="text-sm text-red-500">{errors.url.message}</p>
          )}
        </div>
      </form>

      {error && (
        <Alert variant="destructive" className="mt-4">
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {productData && (
        <Card className="mt-6">
          <CardHeader>
            <CardTitle>{productData.title}</CardTitle>
            <CardDescription>{productData.retailer}</CardDescription>
          </CardHeader>
          <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              {productData.imageUrl && (
                <img
                  src={productData.imageUrl}
                  alt={productData.title}
                  className="w-full h-auto object-contain max-h-64 rounded-md"
                />
              )}
            </div>
            <div className="space-y-4">
              <div>
                <h3 className="text-lg font-semibold">Price</h3>
                <div className="flex items-baseline space-x-2">
                  <span className="text-2xl font-bold">
                    {new Intl.NumberFormat('en-US', {
                      style: 'currency',
                      currency: productData.currency,
                    }).format(productData.currentPrice)}
                  </span>
                  {productData.originalPrice && productData.originalPrice > productData.currentPrice && (
                    <span className="text-lg line-through text-gray-500">
                      {new Intl.NumberFormat('en-US', {
                        style: 'currency',
                        currency: productData.currency,
                      }).format(productData.originalPrice)}
                    </span>
                  )}
                </div>
              </div>
              
              <div>
                <h3 className="text-lg font-semibold">Availability</h3>
                <p className={productData.availability ? 'text-green-600' : 'text-red-600'}>
                  {productData.availability ? 'In Stock' : 'Out of Stock'}
                </p>
              </div>
              
              {productData.description && (
                <div>
                  <h3 className="text-lg font-semibold">Description</h3>
                  <p className="text-sm text-gray-600 line-clamp-4">{productData.description}</p>
                </div>
              )}
            </div>
          </CardContent>
          <Separator />
          <CardFooter className="pt-4 flex justify-between items-center">
            <div className="text-sm text-gray-500">
              <p>Product ID: {productData.productId}</p>
              <p>Last Updated: {new Date(productData.timestamp).toLocaleString()}</p>
            </div>
            <Button 
              onClick={async () => {
                console.log('Add to Dashboard button clicked');
                
                if (onSuccess) {
                  try {
                    const productWithUrl = { ...productData, productUrl: getValues('url') };
                    
                    // Use CSRF-protected fetch when adding to dashboard via onSuccess
                    // The dashboard component will make API calls with this data
                    console.log('Calling onSuccess with data:', productWithUrl);
                    onSuccess(productWithUrl);
                  } catch (err) {
                    console.error('Error adding product to dashboard:', err);
                    setError('Failed to add product to dashboard. Please try again.');
                  }
                } else {
                  console.error('onSuccess callback is not defined');
                  setError('Failed to add product to dashboard: internal error');
                }
              }}
              variant="default"
              className="bg-green-600 hover:bg-green-700"
            >
              Add to Dashboard
            </Button>
          </CardFooter>
        </Card>
      )}
    </div>
  );
}
