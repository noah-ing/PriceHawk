"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { ShoppingCart, LineChart, Package, Bell, DollarSign } from "lucide-react";
import Link from "next/link";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { UrlInputForm } from "@/components/url-input-form";
import { PriceHistoryChart } from "../../price-history-chart";
import DropshipperProductCard from "../../components/dropshipper-product-card";
import { useWebSocket } from "@/hooks/use-websocket";
import { ProductWithPriceHistory } from "@/types";

interface Product {
  id: string;
  title: string;
  description: string | null;
  imageUrl: string | null;
  url: string;
  retailer: string;
  productId: string;
  currentPrice: number;
  currency: string;
  lastCheckedAt: Date;
  createdAt: Date;
  updatedAt: Date;
  userId: string;
}

export default function DropshipperDashboardPage() {
  const { data: session } = useSession({ required: true });
  const userId = session?.user?.id || "";
  const { isConnected } = useWebSocket();
  
  const [products, setProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isAddProductOpen, setIsAddProductOpen] = useState(false);
  const [stats, setStats] = useState({
    trackedProducts: 0,
    activeAlerts: 0,
    priceDrops: 0,
    savedAmount: 0,
    avgMargin: 0,
    totalProfit: 0
  });

  // Fetch products from the API
  const fetchProducts = async () => {
    if (!userId) return;
    
    setIsLoading(true);
    setError(null);
    
    try {
      const response = await fetch(`/api/products?userId=${userId}`);
      const result = await response.json();
      
      if (!response.ok || !result.success) {
        throw new Error(result.error?.message || 'Failed to fetch products');
      }
      
      // Get the products array correctly from the nested structure
      const fetchedProducts = result.data.products || [];
      setProducts(fetchedProducts);
      
      // Calculate profit metrics
      let totalMargin = 0;
      let totalProfit = 0;
      
      fetchedProducts.forEach((product: Product) => {
        const sellingPrice = product.currentPrice * 1.3; // 30% markup
        const profit = sellingPrice - product.currentPrice;
        const margin = (profit / sellingPrice) * 100;
        
        totalMargin += margin;
        totalProfit += profit;
      });
      
      // Update stats with real data
      const fetchAlerts = async () => {
        try {
          const alertsResponse = await fetch(`/api/alerts?userId=${userId}`);
          if (alertsResponse.ok) {
            const alertsResult = await alertsResponse.json();
            if (alertsResult.success) {
              // Get active alerts (not triggered)
              const activeAlerts = alertsResult.data.filter((alert: any) => !alert.isTriggered).length;
              
              // Count price drops and calculate savings
              const priceDrops = fetchedProducts.filter((p: Product) => {
                // Assume a product has dropped in price if current price is less than 90% of its original price
                return p.currentPrice < (p.currentPrice * 1.1 * 0.9);
              }).length;
              
              // Calculate approximate savings based on price drops
              const savedAmount = fetchedProducts.reduce((total: number, product: Product) => {
                const originalEstimate = product.currentPrice * 1.1; // Placeholder for original price
                const saving = originalEstimate > product.currentPrice ? originalEstimate - product.currentPrice : 0;
                return total + saving;
              }, 0);
              
              setStats({
                trackedProducts: fetchedProducts.length,
                activeAlerts,
                priceDrops,
                savedAmount,
                avgMargin: fetchedProducts.length > 0 ? totalMargin / fetchedProducts.length : 0,
                totalProfit
              });
            }
          }
        } catch (error) {
          console.error('Error fetching alerts stats:', error);
          // Set default stats
          setStats({
            trackedProducts: fetchedProducts.length,
            activeAlerts: 0,
            priceDrops: 0,
            savedAmount: 0,
            avgMargin: fetchedProducts.length > 0 ? totalMargin / fetchedProducts.length : 0,
            totalProfit
          });
        }
      };
      
      fetchAlerts();
    } catch (err) {
      console.error('Error fetching products:', err);
      setError('Failed to load products. Please try again later.');
    } finally {
      setIsLoading(false);
    }
  };

  // Add a product from URL
  const handleAddProduct = async (productData: any) => {
    if (!userId) return;
    
    try {
      // Close the dialog
      setIsAddProductOpen(false);
      
      // Extract the product URL from the product data
      const productUrl = productData.productUrl || productData.url;
      
      if (!productUrl) {
        throw new Error('Product URL is missing');
      }
      
      // Make API call to add the product
      const response = await fetch('/api/products', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          url: productUrl,
          userId: userId
        }),
      });
      
      const result = await response.json();
      
      if (!response.ok || !result.success) {
        throw new Error(result.error?.message || 'Failed to add product');
      }
      
      // Refresh the products list
      fetchProducts();
    } catch (err) {
      console.error('Error adding product:', err);
      setError('Failed to add product. Please try again later.');
    }
  };

  // Format price for display
  const formatPrice = (price: number, currency: string = 'USD') => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency,
    }).format(price);
  };

  // Calculate price drop percentage
  const calculatePriceDropPercent = (currentPrice: number, originalPrice: number) => {
    if (originalPrice <= currentPrice) return 0;
    return Math.round(((originalPrice - currentPrice) / originalPrice) * 100);
  };

  // Fetch products when the user ID changes
  useEffect(() => {
    if (userId) {
      fetchProducts();
    }
  }, [userId]);

  // Simple loading state while checking authentication
  if (isLoading && products.length === 0) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen w-full flex-col bg-muted/10 p-4 md:p-6 lg:p-8">
      <div className="max-w-7xl mx-auto w-full space-y-6">
        {/* Dashboard header with add product button */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold tracking-tight">Dropshipper Dashboard</h1>
            <p className="text-muted-foreground">Track your inventory opportunities and profit margins</p>
          </div>
          <Dialog open={isAddProductOpen} onOpenChange={setIsAddProductOpen}>
            <DialogTrigger asChild>
              <Button>
                <ShoppingCart className="mr-2 h-4 w-4" />
                Add Product
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[600px]">
              <DialogHeader>
                <DialogTitle>Add a Product to Track</DialogTitle>
                <DialogDescription>
                  Paste a product URL from Amazon, Walmart, or Best Buy to start tracking its price.
                </DialogDescription>
              </DialogHeader>
              <UrlInputForm onSuccess={handleAddProduct} />
            </DialogContent>
          </Dialog>
        </div>

        {/* Error message */}
        {error && (
          <div className="rounded-md bg-red-50 p-4 text-red-800">
            <p>{error}</p>
          </div>
        )}

        {/* Real-time connection indicator */}
        {isConnected && (
          <div className="flex items-center gap-2 text-sm text-green-600">
            <div className="h-2 w-2 rounded-full bg-green-600 animate-pulse"></div>
            <span>Real-time updates active</span>
          </div>
        )}

        {/* Profit Overview Section */}
        <Card className="shadow-sm">
          <CardHeader>
            <CardTitle>Profit Overview</CardTitle>
            <CardDescription>Key metrics for your dropshipping business</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {/* Total Potential Profit Card */}
              <div className="bg-green-50 rounded-lg p-4">
                <div className="text-sm font-medium text-green-800">Total Potential Profit</div>
                <div className="flex items-center mt-1">
                  <DollarSign className="h-5 w-5 text-green-600 mr-1" />
                  <div className="text-2xl font-bold text-green-700">
                    {formatPrice(stats.totalProfit)}
                  </div>
                </div>
                <div className="text-xs text-green-600 mt-1">
                  Across all {stats.trackedProducts} products
                </div>
              </div>
              
              {/* Average Profit Margin Card */}
              <div className="bg-blue-50 rounded-lg p-4">
                <div className="text-sm font-medium text-blue-800">Average Profit Margin</div>
                <div className="text-2xl font-bold text-blue-700">
                  {stats.avgMargin.toFixed(1)}%
                </div>
                <div className="text-xs text-blue-600 mt-1">
                  {stats.avgMargin >= 25 ? 'Excellent margin across portfolio' : 
                   stats.avgMargin >= 15 ? 'Good margin across portfolio' : 
                   'Consider optimizing your product selection'}
                </div>
              </div>
              
              {/* Tracked Products Card */}
              <div className="bg-indigo-50 rounded-lg p-4">
                <div className="text-sm font-medium text-indigo-800">Tracked Products</div>
                <div className="text-2xl font-bold text-indigo-700">
                  {stats.trackedProducts}
                </div>
                <div className="text-xs text-indigo-600 mt-1">
                  {stats.trackedProducts > 0 ? 
                    `${stats.trackedProducts} products being monitored` : 
                    'Add products to start tracking prices'}
                </div>
              </div>
              
              {/* Money Saved Card */}
              <div className="bg-purple-50 rounded-lg p-4">
                <div className="text-sm font-medium text-purple-800">Money Saved</div>
                <div className="text-2xl font-bold text-purple-700">
                  {formatPrice(stats.savedAmount)}
                </div>
                <div className="text-xs text-purple-600 mt-1">
                  From {stats.priceDrops} tracked price drops
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Charts section */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Price history chart */}
          <Card className="shadow-sm">
            <CardHeader>
              <CardTitle>Price History</CardTitle>
              <CardDescription>Track price changes over time for your most watched items</CardDescription>
            </CardHeader>
            <CardContent className="min-h-[300px]">
              {products.length > 0 ? (
                <PriceHistoryChart 
                  productId={products[0].id} 
                  sellingPrice={products[0].currentPrice * 1.3}
                />
              ) : (
                <div className="flex h-full w-full items-center justify-center rounded-md border border-dashed py-12">
                  <div className="text-center">
                    <LineChart className="mx-auto h-10 w-10 text-muted-foreground" />
                    <h3 className="mt-2 text-lg font-medium">No Price History</h3>
                    <p className="text-sm text-muted-foreground">Add products to start tracking price changes</p>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
          
          {/* Active alerts summary */}
          <Card className="shadow-sm">
            <CardHeader>
              <CardTitle>Active Alerts</CardTitle>
              <CardDescription>Your active price alerts and profit opportunities</CardDescription>
            </CardHeader>
            <CardContent className="min-h-[300px]">
              {products.length > 0 ? (
                <div className="space-y-4">
                  <div className="bg-green-50 p-4 rounded-md">
                    <h3 className="text-sm font-medium text-green-800">Active Alerts</h3>
                    <p className="text-2xl font-bold text-green-700">{stats.activeAlerts}</p>
                    <p className="text-xs text-green-600 mt-1">Monitoring price drops</p>
                  </div>
                  
                  <div className="border rounded-md p-4">
                    <h3 className="text-sm font-medium mb-3">Top Profit Opportunities</h3>
                    <div className="text-center py-4">
                      <Button variant="outline" size="sm" asChild>
                        <Link href="/alerts">Manage All Alerts</Link>
                      </Button>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="flex h-full w-full items-center justify-center rounded-md border border-dashed py-12">
                  <div className="text-center">
                    <Bell className="mx-auto h-10 w-10 text-muted-foreground" />
                    <h3 className="mt-2 text-lg font-medium">No Alerts Set</h3>
                    <p className="text-sm text-muted-foreground">Add products and set alerts to get notified of price drops</p>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Recently added products with profit metrics */}
        <div>
          <h2 className="mb-4 text-xl font-semibold">Products with Profit Analysis</h2>
          {isLoading ? (
            <div className="flex justify-center p-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
          ) : products.length > 0 ? (
            <div className="grid gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {products.map((product) => (
                <DropshipperProductCard
                  key={product.id}
                  product={{
                    ...product,
                    priceHistory: [] // Add empty price history since we don't have real data yet
                  }}
                  onSettingsUpdated={() => fetchProducts()}
                />
              ))}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center rounded-lg border border-dashed p-8 text-center">
              <ShoppingCart className="mb-2 h-10 w-10 text-muted-foreground" />
              <h3 className="mb-1 text-lg font-medium">No products yet</h3>
              <p className="text-sm text-muted-foreground mb-4">Add your first product to start tracking prices</p>
              <Button onClick={() => setIsAddProductOpen(true)}>
                <ShoppingCart className="mr-2 h-4 w-4" />
                Add Product
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
