"use client";

// Skip static generation - force dynamic rendering
export const dynamic = 'force-dynamic';

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { NavBar } from "@/components/nav-bar";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Calendar, Clock, ArrowDown, ArrowUp, LineChart } from "lucide-react";
import { Separator } from "@/components/ui/separator";
import Link from "next/link";
import { PriceHistoryChart } from "@/price-history-chart";

// Price history entry type
interface PriceHistoryEntry {
  id: string;
  price: number;
  currency: string;
  timestamp: string;
  productId: string;
  product?: {
    id: string;
    title: string;
    retailer: string;
    imageUrl: string | null;
    currentPrice?: number;
  };
}

export default function HistoryPage() {
  const { data: session } = useSession();
  const userId = session?.user?.id || "";
  
  const [priceHistory, setPriceHistory] = useState<PriceHistoryEntry[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState("all");
  const [timeRange, setTimeRange] = useState("7d");
  const [productFilter, setProductFilter] = useState("all");
  const [products, setProducts] = useState<any[]>([]);
  const [selectedProductId, setSelectedProductId] = useState<string | null>(null);

  // Fetch products for the filter dropdown
  const fetchProducts = async () => {
    if (!userId) return;
    
    try {
      console.log("Fetching products for user:", userId);
      const response = await fetch(`/api/products?userId=${userId}`);
      const result = await response.json();
      
      if (!response.ok || !result.success) {
        throw new Error(result.error?.message || 'Failed to fetch products');
      }
      
      // Fix: The API returns a nested structure with 'products' inside 'data'
      let productList = [];
      if (result.data && Array.isArray(result.data.products)) {
        productList = result.data.products;
      } else if (Array.isArray(result.data)) {
        productList = result.data;
      } else {
        console.warn("Unexpected product data structure:", result.data);
        productList = [];
      }
      
      console.log("Fetched products:", productList.length);
      setProducts(productList);
      
      // Set the first product as selected if there is one
      if (productList.length > 0 && !selectedProductId) {
        setSelectedProductId(productList[0].id);
      }
    } catch (err) {
      console.error('Error fetching products:', err);
      setError('Failed to load products. Please try again later.');
    }
  };

  // Fetch price history data
  const fetchPriceHistory = async () => {
    if (!userId) return;
    
    setIsLoading(true);
    setError(null);
    
    try {
      // In a real implementation, we would have an API endpoint for fetching all price history
      // For now, we'll fetch price history for each product
      const allHistory: PriceHistoryEntry[] = [];
      
      // Ensure products is an array before attempting to iterate
      const productsArray = Array.isArray(products) ? products : [];
      
      console.log(`Fetching price history for ${productsArray.length} products`);
      
      for (const product of productsArray) {
        try {
          console.log(`Fetching history for product ${product.id}`);
          const response = await fetch(`/api/products/${product.id}/price-history?limit=100`);
          
          if (!response.ok) {
            console.error(`Failed to fetch price history for product ${product.id} - status: ${response.status}`);
            continue;
          }
          
          const result = await response.json();
          
          if (!result.success) {
            console.error(`API error for product ${product.id}:`, result.error);
            continue;
          }
          
          // Add product information to each price history entry
          const historyWithProduct = result.data.history.map((entry: any) => ({
            ...entry,
            product: {
              id: product.id,
              title: product.title,
              retailer: product.retailer,
              imageUrl: product.imageUrl,
              currentPrice: product.currentPrice,
            },
          }));
          
          allHistory.push(...historyWithProduct);
        } catch (err) {
          console.error(`Error fetching history for product ${product.id}:`, err);
          // Continue with next product
        }
      }
      
      // Sort by timestamp (newest first)
      allHistory.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
      setPriceHistory(allHistory);
    } catch (err) {
      console.error('Error fetching price history:', err);
      setError('Failed to load price history. Please try again later.');
    } finally {
      setIsLoading(false);
    }
  };

  // Fetch data when the user ID changes
  useEffect(() => {
    if (userId) {
      fetchProducts();
    }
  }, [userId]);

  // Fetch price history when products change
  useEffect(() => {
    if (products.length > 0) {
      fetchPriceHistory();
    }
  }, [products]);

  // Format price for display
  const formatPrice = (price: number, currency: string = 'USD') => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency,
    }).format(price);
  };

  // Format date for display
  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  // Handle product selection
  const handleProductSelect = (value: string) => {
    setProductFilter(value);
    setSelectedProductId(value === 'all' ? null : value);
  };

  // Filter price history based on active tab, time range, and product filter
  const filteredHistory = priceHistory.filter((entry) => {
    // Filter by price change type
    if (activeTab === 'increases' && entry.price <= (entry.product?.currentPrice || 0)) {
      return false;
    }
    if (activeTab === 'decreases' && entry.price >= (entry.product?.currentPrice || 0)) {
      return false;
    }
    
    // Filter by time range
    const entryDate = new Date(entry.timestamp);
    const now = new Date();
    
    if (timeRange === '24h' && now.getTime() - entryDate.getTime() > 24 * 60 * 60 * 1000) {
      return false;
    }
    if (timeRange === '7d' && now.getTime() - entryDate.getTime() > 7 * 24 * 60 * 60 * 1000) {
      return false;
    }
    if (timeRange === '30d' && now.getTime() - entryDate.getTime() > 30 * 24 * 60 * 60 * 1000) {
      return false;
    }
    
    // Filter by product
    if (productFilter !== 'all' && entry.productId !== productFilter) {
      return false;
    }
    
    return true;
  });

  return (
    <div className="flex min-h-screen w-full bg-muted/10">
      <NavBar />

      <div className="flex flex-1 flex-col">
        <main className="flex-1 p-6">
          <div className="flex flex-col gap-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <Button variant="outline" asChild>
                  <Link href="/">
                    <span className="mr-2">🏠</span>
                    Home
                  </Link>
                </Button>
                <h1 className="text-3xl font-bold tracking-tight">Price History</h1>
              </div>
              <div className="flex items-center gap-2">
                <Select value={timeRange} onValueChange={setTimeRange}>
                  <SelectTrigger className="w-[120px]">
                    <SelectValue placeholder="Time Range" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="24h">Last 24 Hours</SelectItem>
                    <SelectItem value="7d">Last 7 Days</SelectItem>
                    <SelectItem value="30d">Last 30 Days</SelectItem>
                    <SelectItem value="all">All Time</SelectItem>
                  </SelectContent>
                </Select>
                
                <Select value={productFilter} onValueChange={handleProductSelect}>
                  <SelectTrigger className="w-[180px]">
                    <SelectValue placeholder="All Products" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Products</SelectItem>
                    {Array.isArray(products) && products.length > 0 ? 
                      products.map((product) => (
                        <SelectItem key={product.id} value={product.id}>
                          {product.title}
                        </SelectItem>
                      ))
                    : (
                      <SelectItem value="none" disabled>
                        No products available
                      </SelectItem>
                    )}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {error && (
              <div className="rounded-md bg-red-50 p-4 text-red-800">
                <p>{error}</p>
              </div>
            )}

            {/* Price Chart Card with Product Navigation */}
            <Card>
              <CardHeader className="flex flex-col md:flex-row md:items-center md:justify-between pb-4">
                <div>
                  <CardTitle>Price History Chart</CardTitle>
                  <CardDescription>
                    Visual representation of price trends over time
                  </CardDescription>
                </div>
                
                {/* Product Navigation Pills */}
                {products.length > 0 && (
                  <div className="flex flex-wrap gap-2 mt-4 md:mt-0">
                    {products.slice(0, 5).map((product) => (
                      <Button 
                        key={product.id}
                        variant={selectedProductId === product.id ? "default" : "outline"}
                        size="sm"
                        onClick={() => setSelectedProductId(product.id)}
                        className="rounded-full text-xs py-1 h-8"
                      >
                        {product.title.length > 20 
                          ? `${product.title.substring(0, 18)}...` 
                          : product.title
                        }
                      </Button>
                    ))}
                    {products.length > 5 && (
                      <Select value={selectedProductId || ""} onValueChange={(value) => setSelectedProductId(value)}>
                        <SelectTrigger className="w-[140px] h-8 text-xs py-1 rounded-full">
                          <SelectValue placeholder="More Products" />
                        </SelectTrigger>
                        <SelectContent>
                          {products.slice(5).map((product) => (
                            <SelectItem key={product.id} value={product.id}>
                              {product.title}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    )}
                  </div>
                )}
              </CardHeader>
              <Separator />
              <CardContent className="pt-6">
                <div className="h-[300px]">
                  <PriceHistoryChart 
                    productId={selectedProductId || undefined}
                    // Pass additional props for dropshipper insights
                    sellingPrice={
                      selectedProductId && products.length > 0
                        ? products.find(p => p.id === selectedProductId)?.currentPrice * 1.3
                        : undefined
                    }
                  />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Price Change History</CardTitle>
                <CardDescription>
                  Track all price changes for your monitored products
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
                  <TabsList>
                    <TabsTrigger value="all">All Changes</TabsTrigger>
                    <TabsTrigger value="decreases">Price Drops</TabsTrigger>
                    <TabsTrigger value="increases">Price Increases</TabsTrigger>
                  </TabsList>
                  
                  <TabsContent value={activeTab} className="space-y-4">
                    {isLoading ? (
                      <div className="flex justify-center p-8">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                      </div>
                    ) : filteredHistory.length > 0 ? (
                      <div className="space-y-4">
                        {filteredHistory.map((entry) => (
                          <div key={entry.id} className="flex items-center justify-between rounded-lg border p-4">
                            <div className="flex items-center gap-4">
                              {entry.product?.imageUrl && (
                                <img
                                  src={entry.product.imageUrl}
                                  alt={entry.product?.title || 'Product'}
                                  className="h-16 w-16 rounded-md object-cover"
                                />
                              )}
                              <div>
                                <h3 className="font-medium">{entry.product?.title || 'Unknown Product'}</h3>
                                <p className="text-sm text-muted-foreground">{entry.product?.retailer || 'Unknown Retailer'}</p>
                              </div>
                            </div>
                            <div className="flex items-center gap-4">
                              <div className="text-right">
                                <div className="font-medium">{formatPrice(entry.price, entry.currency)}</div>
                                <div className="flex items-center justify-end gap-1 text-sm">
                                  {entry.price < (entry.product?.currentPrice || 0) ? (
                                    <>
                                      <ArrowUp className="h-3 w-3 text-red-500" />
                                      <span className="text-red-500">Price increased</span>
                                    </>
                                  ) : entry.price > (entry.product?.currentPrice || 0) ? (
                                    <>
                                      <ArrowDown className="h-3 w-3 text-green-500" />
                                      <span className="text-green-500">Price dropped</span>
                                    </>
                                  ) : (
                                    <span className="text-muted-foreground">No change</span>
                                  )}
                                </div>
                              </div>
                              <div className="text-right">
                                <div className="flex items-center gap-1 text-sm text-muted-foreground">
                                  <Calendar className="h-3 w-3" />
                                  <span>{formatDate(entry.timestamp)}</span>
                                </div>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="flex flex-col items-center justify-center rounded-lg border border-dashed p-8 text-center">
                        <LineChart className="mb-2 h-10 w-10 text-muted-foreground" />
                        <h3 className="mb-1 text-lg font-medium">No price history</h3>
                        <p className="text-sm text-muted-foreground">
                          {activeTab === 'all'
                            ? 'No price changes have been recorded yet'
                            : activeTab === 'decreases'
                            ? 'No price drops have been recorded yet'
                            : 'No price increases have been recorded yet'}
                        </p>
                      </div>
                    )}
                  </TabsContent>
                </Tabs>
              </CardContent>
            </Card>
          </div>
        </main>
      </div>
    </div>
  );
}
