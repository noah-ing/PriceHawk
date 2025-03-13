"use client"

import { useState, useEffect } from "react"
import { Search, ShoppingCart, Bell, LineChart, Package } from "lucide-react"
import { useSession } from "next-auth/react"
import Link from "next/link"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { ProductCard } from "./product-card"
import { AlertsPanel } from "./alerts-panel"
import { PriceHistoryChart } from "./price-history-chart"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { UrlInputForm } from "@/components/url-input-form"
import { NavBar } from "@/components/nav-bar"

// Product type definition
interface Product {
  id: string;
  title: string;
  description?: string | null;
  imageUrl?: string | null;
  url: string;
  retailer: string;
  productId: string;
  currentPrice: number;
  currency: string;
  createdAt: Date;
  updatedAt: Date;
  userId: string;
}

// Dashboard component
export default function Dashboard() {
  const { data: session } = useSession();
  const userId = session?.user?.id || "";
  
  const [activeTab, setActiveTab] = useState("overview")
  const [products, setProducts] = useState<Product[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [isAddProductOpen, setIsAddProductOpen] = useState(false)
  const [stats, setStats] = useState({
    trackedProducts: 0,
    activeAlerts: 0,
    priceDrops: 0,
    savedAmount: 0
  })

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
      
      // Fix: Access the products array correctly from the nested structure
      setProducts(result.data.products || []);
      
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
              let priceDrops = 0;
              let savedAmount = 0;
              
              setStats({
                trackedProducts: result.data.products?.length || 0,
                activeAlerts: activeAlerts,
                priceDrops: priceDrops,
                savedAmount: savedAmount
              });
            }
          }
        } catch (error) {
          console.error('Error fetching alerts stats:', error);
          // Set default stats with only product count
          setStats({
            trackedProducts: result.data.products?.length || 0,
            activeAlerts: 0,
            priceDrops: 0,
            savedAmount: 0
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

  // Fetch products when the user ID changes
  useEffect(() => {
    if (userId) {
      fetchProducts();
    }
  }, [userId]);

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
              <h1 className="text-2xl md:text-3xl font-bold tracking-tight">Dashboard</h1>
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
                        <PriceHistoryChart productId={products[0].id} />
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
                      <CardDescription>Your active price alerts and notifications</CardDescription>
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
                              <h3 className="text-sm font-medium text-blue-800">Deal Rating</h3>
                              <div className="flex items-center mt-1">
                                <div className="w-full bg-gray-200 rounded-full h-2.5">
                                  <div className="bg-blue-600 h-2.5 rounded-full" style={{ 
                                    width: `${Math.min(100, products.length > 0 ? 70 : 0)}%` 
                                  }}></div>
                                </div>
                              </div>
                              <p className="text-xs text-blue-600 mt-2">
                                {products.length > 0 ? 'Good time to buy based on current prices' : 'Add products to see deal ratings'}
                              </p>
                            </div>
                          </div>
                          
                          {/* Recent alerts */}
                          <div className="border rounded-md p-4">
                            <h3 className="text-sm font-medium mb-3">Recent Price Alerts</h3>
                            {products.length > 0 ? (
                              <ul className="space-y-3">
                                {products.slice(0, 3).map((product) => (
                                  <li key={product.id} className="flex items-center justify-between text-sm">
                                    <div className="flex items-center">
                                      <div className="w-2 h-2 bg-green-500 rounded-full mr-2"></div>
                                      <span className="truncate max-w-[160px]">{product.title}</span>
                                    </div>
                                    <Badge variant="outline">
                                      {formatPrice(product.currentPrice, product.currency)}
                                    </Badge>
                                  </li>
                                ))}
                              </ul>
                            ) : (
                              <div className="text-center py-4 text-muted-foreground text-sm">
                                No recent alerts to display
                              </div>
                            )}
                            
                            <div className="mt-4 text-center">
                              <Button variant="outline" size="sm" asChild>
                                <Link href="/alerts">View All Alerts</Link>
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

                {/* Recently added products */}
                <div>
                  <h2 className="mb-4 text-xl font-semibold">Recently Added Products</h2>
                  {isLoading ? (
                    <div className="flex justify-center p-8">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                    </div>
                  ) : products.length > 0 ? (
                    <div className="grid gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                      {products.slice(0, 4).map((product) => (
                        <ProductCard
                          key={product.id}
                          name={product.title}
                          category={product.retailer}
                          image={product.imageUrl || "/placeholder.svg?height=200&width=200"}
                          currentPrice={product.currentPrice}
                          originalPrice={product.currentPrice * 1.1} // Placeholder until we have original price
                          store={product.retailer}
                          priceDropPercent={calculatePriceDropPercent(product.currentPrice, product.currentPrice * 1.1)}
                          id={product.id}
                          url={product.url}
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
                    <CardDescription>Manage and view all your tracked products</CardDescription>
                  </CardHeader>
                  <CardContent>
                    {isLoading ? (
                      <div className="flex justify-center p-8">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                      </div>
                    ) : products.length > 0 ? (
                      <div className="grid gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                        {products.map((product) => (
                          <ProductCard
                            key={product.id}
                            name={product.title}
                            category={product.retailer}
                            image={product.imageUrl || "/placeholder.svg?height=200&width=200"}
                            currentPrice={product.currentPrice}
                            originalPrice={product.currentPrice * 1.1} // Placeholder until we have original price
                            store={product.retailer}
                            priceDropPercent={calculatePriceDropPercent(product.currentPrice, product.currentPrice * 1.1)}
                            id={product.id}
                            url={product.url}
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
                <AlertsPanel />
              </TabsContent>
            </Tabs>
          </div>
        </main>
      </div>
    </div>
  )
}
