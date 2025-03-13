"use client";

import { useState, useEffect, useMemo } from "react";
import { Search, ShoppingCart, Bell, LineChart, Package, TrendingDown, TrendingUp, DollarSign, BarChart2 } from "lucide-react";
import { useSession } from "next-auth/react";
import Link from "next/link";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { UrlInputForm } from "@/components/url-input-form";
import { NavBar } from "@/components/nav-bar";
import DropshipperProductCard from "./dropshipper-product-card";
import { PriceHistoryChart } from "../price-history-chart";
import { AlertsPanel } from "../alerts-panel";
import { useWebSocket, DashboardStatsUpdateEvent } from "@/hooks/use-websocket";

// Product type definition (from dashboard.tsx)
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

// Profit analysis interface
interface ProfitAnalysis {
  lowestMargin: number;
  highestMargin: number;
  averageMargin: number;
  totalPotentialProfit: number;
  bestProductId: string | null;
  needsAttentionProductId: string | null;
}

export function DropshipperDashboard() {
  const { data: session } = useSession();
  const userId = session?.user?.id || "";
  const { isConnected, on } = useWebSocket();
  
  const [activeTab, setActiveTab] = useState("overview");
  const [products, setProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isAddProductOpen, setIsAddProductOpen] = useState(false);
  const [stats, setStats] = useState({
    trackedProducts: 0,
    activeAlerts: 0,
    priceDrops: 0,
    savedAmount: 0
  });
  const [profitAnalysis, setProfitAnalysis] = useState<ProfitAnalysis>({
    lowestMargin: 0,
    highestMargin: 0,
    averageMargin: 0,
    totalPotentialProfit: 0,
    bestProductId: null,
    needsAttentionProductId: null
  });
  const [searchTerm, setSearchTerm] = useState("");

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
                // This is a placeholder - in reality, we'd compare with the historical high or initial price
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
                savedAmount
              });
            }
          }
        } catch (error) {
          console.error('Error fetching alerts stats:', error);
          // Set default stats with only product count
          setStats({
            trackedProducts: fetchedProducts.length,
            activeAlerts: 0,
            priceDrops: 0,
            savedAmount: 0
          });
        }
      };
      
      fetchAlerts();
      
      // Calculate profit metrics
      calculateProfitAnalysis(fetchedProducts);
      
    } catch (err) {
      console.error('Error fetching products:', err);
      setError('Failed to load products. Please try again later.');
    } finally {
      setIsLoading(false);
    }
  };

  // Calculate profit analysis for all products
  const calculateProfitAnalysis = (productList: Product[]) => {
    if (!productList.length) {
      return;
    }
    
    let lowestMargin = 100;  // Start high to find minimum
    let highestMargin = 0;
    let totalMargin = 0;
    let totalProfit = 0;
    let bestProductId = null;
    let needsAttentionProductId = null;
    
    productList.forEach(product => {
      // Calculate estimated selling price (30% markup by default)
      const sellingPrice = product.currentPrice * 1.3;
      
      // Calculate profit margin
      const profit = sellingPrice - product.currentPrice;
      const margin = (profit / sellingPrice) * 100;
      
      // Update aggregates
      totalMargin += margin;
      totalProfit += profit;
      
      // Check for highest/lowest margins
      if (margin > highestMargin) {
        highestMargin = margin;
        bestProductId = product.id;
      }
      
      if (margin < lowestMargin) {
        lowestMargin = margin;
        needsAttentionProductId = product.id;
      }
    });
    
    setProfitAnalysis({
      lowestMargin,
      highestMargin,
      averageMargin: totalMargin / productList.length,
      totalPotentialProfit: totalProfit,
      bestProductId,
      needsAttentionProductId
    });
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

  // Set up WebSocket listeners for real-time updates
  useEffect(() => {
    if (isConnected && userId) {
      // Listen for dashboard stats updates
      const statsCleanup = on('dashboard-stats-update', (data: DashboardStatsUpdateEvent) => {
        setStats({
          trackedProducts: data.trackedProducts,
          activeAlerts: data.activeAlerts,
          priceDrops: data.priceDrops,
          savedAmount: data.savedAmount
        });
      });
      
      // Listen for product updates that might affect our profit analysis
      const updateCleanup = on('price-update', () => {
        // Simple refresh approach - in a production app we'd update specific products
        fetchProducts();
      });
      
      // Listen for new products being added by other sessions
      const productAddedCleanup = on('product-added', () => {
        fetchProducts();
      });
      
      return () => {
        statsCleanup();
        updateCleanup();
        productAddedCleanup();
      };
    }
  }, [isConnected, userId, on]);

  // Fetch products when the user ID changes
  useEffect(() => {
    if (userId) {
      fetchProducts();
    }
  }, [userId]);

  // Filter products based on search term
  const filteredProducts = useMemo(() => {
    if (!searchTerm.trim()) return products;
    
    const lowerSearchTerm = searchTerm.toLowerCase();
    return products.filter(product => 
      product.title.toLowerCase().includes(lowerSearchTerm) || 
      product.retailer.toLowerCase().includes(lowerSearchTerm)
    );
  }, [products, searchTerm]);

  // Find product with best profit margin
  const bestProfitProduct = useMemo(() => {
    if (!profitAnalysis.bestProductId) return null;
    return products.find(p => p.id === profitAnalysis.bestProductId);
  }, [products, profitAnalysis.bestProductId]);

  return (
    <div className="flex min-h-screen w-full bg-muted/10">
      {/* Fixed sidebar */}
      <div className="w-64 flex-shrink-0 hidden lg:block">
        <NavBar />
      </div>

      {/* Mobile navbar */}
      <div className="lg:hidden fixed top-0 left-0 right-0 z-40">
        <NavBar />
      </div>

      {/* Main content area */}
      <div className="flex-1 max-w-full overflow-x-hidden">
        {/* Mobile header with search */}
        <header className="sticky top-0 z-30 flex h-16 items-center gap-4 border-b bg-background px-6 lg:hidden mt-14">
          <div className="w-full flex-1">
            <form className="relative">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                type="search"
                placeholder="Search products..."
                className="w-full bg-background pl-8"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </form>
          </div>
          <Button variant="outline" size="icon">
            <Bell className="h-4 w-4" />
            <span className="sr-only">Notifications</span>
          </Button>
        </header>

        {/* Main content */}
        <main className="flex-1 p-4 md:p-6 lg:p-8 mt-14 lg:mt-0">
          <div className="flex flex-col gap-6 max-w-7xl mx-auto">
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
                        {formatPrice(profitAnalysis.totalPotentialProfit)}
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
                      {profitAnalysis.averageMargin.toFixed(1)}%
                    </div>
                    <div className="text-xs text-blue-600 mt-1">
                      {profitAnalysis.averageMargin >= 25 ? 'Excellent margin across portfolio' : 
                       profitAnalysis.averageMargin >= 15 ? 'Good margin across portfolio' : 
                       'Consider optimizing your product selection'}
                    </div>
                  </div>
                  
                  {/* Best Opportunity Card */}
                  <div className="bg-indigo-50 rounded-lg p-4">
                    <div className="text-sm font-medium text-indigo-800">Best Opportunity</div>
                    <div className="text-2xl font-bold text-indigo-700 line-clamp-1">
                      {bestProfitProduct ? bestProfitProduct.title.substring(0, 20) + '...' : 'None yet'}
                    </div>
                    <div className="text-xs text-indigo-600 mt-1">
                      {bestProfitProduct ? 
                        `${profitAnalysis.highestMargin.toFixed(1)}% margin potential` : 
                        'Add products to find opportunities'}
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

            {/* Statistics cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <Card className="shadow-sm">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Tracked Products</CardTitle>
                  <Package className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{stats.trackedProducts}</div>
                  <p className="text-xs text-muted-foreground">
                    {stats.trackedProducts > 0 ? `${stats.trackedProducts} products being tracked` : 'No products tracked yet'}
                  </p>
                </CardContent>
              </Card>
              <Card className="shadow-sm">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Active Alerts</CardTitle>
                  <Bell className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{stats.activeAlerts}</div>
                  <p className="text-xs text-muted-foreground">
                    {stats.activeAlerts > 0 ? `${stats.activeAlerts} active alerts` : 'No active alerts'}
                  </p>
                </CardContent>
              </Card>
              <Card className="shadow-sm">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Price Drops</CardTitle>
                  <LineChart className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{stats.priceDrops}</div>
                  <p className="text-xs text-muted-foreground">
                    {stats.priceDrops > 0 ? `${stats.priceDrops} detected price drops` : 'No recent price drops'}
                  </p>
                </CardContent>
              </Card>
              <Card className="shadow-sm">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Saved Amount</CardTitle>
                  <ShoppingCart className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{formatPrice(stats.savedAmount)}</div>
                  <p className="text-xs text-muted-foreground">
                    {stats.savedAmount > 0 ? `${formatPrice(stats.savedAmount)} saved` : 'No savings recorded yet'}
                  </p>
                </CardContent>
              </Card>
            </div>

            {/* Desktop search input */}
            <div className="hidden lg:block">
              <div className="relative">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  type="search"
                  placeholder="Search products by name or retailer..."
                  className="w-full pl-8"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
            </div>

            {/* Tabs for different sections */}
            <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
              <TabsList className="w-full sm:w-auto grid grid-cols-3 sm:flex">
                <TabsTrigger value="overview" className="flex-1 sm:flex-auto">Overview</TabsTrigger>
                <TabsTrigger value="products" className="flex-1 sm:flex-auto">Products</TabsTrigger>
                <TabsTrigger value="alerts" className="flex-1 sm:flex-auto">Alerts</TabsTrigger>
              </TabsList>
              
              {/* Overview tab content */}
              <TabsContent value="overview" className="space-y-6">
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
                          sellingPrice={products[0].currentPrice * 1.3} // Example selling price
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
                  
                  {/* Price alerts summary */}
                  <Card className="shadow-sm">
                    <CardHeader>
                      <CardTitle>Price Alerts Summary</CardTitle>
                      <CardDescription>Your active price alerts and profit opportunities</CardDescription>
                    </CardHeader>
                    <CardContent className="min-h-[300px]">
                      {products.length > 0 ? (
                        <div className="space-y-4">
                          {/* Alert stats */}
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div className="bg-green-50 p-4 rounded-md">
                              <h3 className="text-sm font-medium text-green-800">Active Alerts</h3>
                              <p className="text-2xl font-bold text-green-700">{stats.activeAlerts}</p>
                              <p className="text-xs text-green-600 mt-1">Monitoring price drops</p>
                            </div>
                            <div className="bg-blue-50 p-4 rounded-md">
                              <h3 className="text-sm font-medium text-blue-800">Potential Profit</h3>
                              <p className="text-2xl font-bold text-blue-700">
                                {formatPrice(profitAnalysis.totalPotentialProfit)}
                              </p>
                              <p className="text-xs text-blue-600 mt-1">Based on current prices</p>
                            </div>
                          </div>
                          
                          {/* Recent alerts */}
                          <div className="border rounded-md p-4">
                            <h3 className="text-sm font-medium mb-3">Profit Opportunities</h3>
                            {products.length > 0 ? (
                              <ul className="space-y-3">
                                {products.slice(0, 3).map((product) => {
                                  const sellingPrice = product.currentPrice * 1.3;
                                  const profit = sellingPrice - product.currentPrice;
                                  const margin = (profit / sellingPrice) * 100;
                                  
                                  return (
                                    <li key={product.id} className="flex items-center justify-between text-sm">
                                      <div className="flex items-center">
                                        <div className={`w-2 h-2 rounded-full mr-2 ${
                                          margin >= 30 ? 'bg-green-500' : 
                                          margin >= 20 ? 'bg-blue-500' : 
                                          margin >= 10 ? 'bg-yellow-500' : 'bg-red-500'
                                        }`}></div>
                                        <span className="truncate max-w-[160px]">{product.title}</span>
                                      </div>
                                      <div className="flex items-center gap-2">
                                        <Badge variant="outline">
                                          {margin.toFixed(1)}%
                                        </Badge>
                                        <Badge>
                                          {formatPrice(profit)}
                                        </Badge>
                                      </div>
                                    </li>
                                  );
                                })}
                              </ul>
                            ) : (
                              <div className="text-center py-4 text-muted-foreground text-sm">
                                No products to analyze
                              </div>
                            )}
                            
                            <div className="mt-4 text-center">
                              <Button variant="outline" size="sm" asChild>
                                <Link href="/products">View All Products</Link>
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
                  <h2 className="mb-4 text-xl font-semibold">Recently Added Products</h2>
                  {isLoading ? (
                    <div className="flex justify-center p-8">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                    </div>
                  ) : filteredProducts.length > 0 ? (
                    <div className="grid gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                      {filteredProducts.slice(0, 4).map((product) => (
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
              </TabsContent>
              
              {/* Products tab content */}
              <TabsContent value="products" className="space-y-4">
                <Card className="shadow-sm">
                  <CardHeader>
                    <CardTitle>All Tracked Products</CardTitle>
                    <CardDescription>Manage and view all your tracked products with profit analysis</CardDescription>
                  </CardHeader>
                  <CardContent>
                    {isLoading ? (
                      <div className="flex justify-center p-8">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                      </div>
                    ) : filteredProducts.length > 0 ? (
                      <div className="grid gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                        {filteredProducts.map((product) => (
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
                  </CardContent>
                </Card>
              </TabsContent>
              
              {/* Alerts tab content */}
              <TabsContent value="alerts" className="space-y-4">
                <Card className="shadow-sm">
                  <CardHeader>
                    <CardTitle>Price Alerts</CardTitle>
                    <CardDescription>Manage your price drop alerts</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <AlertsPanel />
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </div>
        </main>
      </div>
    </div>
  );
}
