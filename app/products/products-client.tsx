"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useSession } from "next-auth/react";
import Link from "next/link";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Label } from "@/components/ui/label";
import { AlertCircle, Check, ExternalLink, ShoppingCart, ArrowRight, TrendingDown, Bell, History } from "lucide-react";

// Interface for search parameters
interface SearchParams {
  [key: string]: string | string[] | undefined;
}

// Mock product information
interface ProductInfo {
  id: string;
  title: string;
  price: number;
  originalPrice?: number;
  discount?: number;
  currency: string;
  store: string;
  inStock: boolean;
  imageUrl: string;
  url: string;
  scrapedAt: string;
  lastChecked: string;
  priceHistory: {
    date: string;
    price: number;
  }[];
}

// Client component for products page
export default function ProductsClient({ 
  initialSearchParams 
}: { 
  initialSearchParams: SearchParams
}) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { data: session, status } = useSession();
  
  const [url, setUrl] = useState(searchParams.get("url") || "");
  const [isLoading, setIsLoading] = useState(!!searchParams.get("url"));
  const [error, setError] = useState<string | null>(null);
  const [product, setProduct] = useState<ProductInfo | null>(null);
  const [priceDropAlertValue, setPriceDropAlertValue] = useState<number | null>(null);
  const [isAlertSaving, setIsAlertSaving] = useState(false);
  const [isProductTracked, setIsProductTracked] = useState(false);
  const [activeTab, setActiveTab] = useState("overview");
  
  // Load product details if URL is provided
  useEffect(() => {
    const urlParam = searchParams.get("url");
    if (urlParam) {
      setUrl(urlParam);
      fetchProductDetails(urlParam);
    }
  }, [searchParams]);
  
  // Mock function to fetch product details
  const fetchProductDetails = async (productUrl: string) => {
    setIsLoading(true);
    setError(null);
    
    try {
      // In a real app, we would call an API
      // const response = await fetch(`/api/products/details?url=${encodeURIComponent(productUrl)}`);
      
      // For demo, simulate API call with timeout and mock data
      setTimeout(() => {
        // Determine store from URL for demo
        let store = "Unknown";
        if (productUrl.includes("amazon")) {
          store = "Amazon";
        } else if (productUrl.includes("bestbuy")) {
          store = "Best Buy";
        } else if (productUrl.includes("walmart")) {
          store = "Walmart";
        } else if (productUrl.includes("target")) {
          store = "Target";
        }
        
        // Create mock product data
        const mockProduct: ProductInfo = {
          id: "prod_" + Math.random().toString(36).substring(2, 10),
          title: store === "Amazon" ? "Sony WH-1000XM4 Wireless Noise-Canceling Headphones" :
                 store === "Best Buy" ? "Apple AirPods Pro (2nd Generation) - White" :
                 store === "Walmart" ? "PlayStation 5 Console Marvel's Spider-Man 2 Bundle" :
                 "Unknown Product - " + productUrl.substring(0, 30) + "...",
          price: store === "Amazon" ? 278.99 :
                 store === "Best Buy" ? 189.99 :
                 store === "Walmart" ? 499.99 :
                 Math.round(Math.random() * 100000) / 100,
          originalPrice: store === "Amazon" ? 349.99 :
                        store === "Best Buy" ? 249.99 :
                        store === "Walmart" ? 549.99 :
                        undefined,
          discount: store === "Amazon" ? 20 :
                   store === "Best Buy" ? 24 :
                   store === "Walmart" ? 9 :
                   undefined,
          currency: "USD",
          store: store,
          inStock: Math.random() > 0.2, // 80% in stock
          imageUrl: store === "Amazon" ? "https://m.media-amazon.com/images/I/71o8Q5XJS5L._AC_SL1500_.jpg" :
                   store === "Best Buy" ? "https://pisces.bbystatic.com/image2/BestBuy_US/images/products/4900/4900964_sd.jpg" :
                   store === "Walmart" ? "https://i5.walmartimages.com/seo/PlayStation-5-Console-Marvel-s-Spider-Man-2-Bundle_3000617250.jpg" :
                   "/placeholder-product.jpg",
          url: productUrl,
          scrapedAt: new Date().toISOString(),
          lastChecked: new Date().toISOString(),
          priceHistory: generateMockPriceHistory(
            store === "Amazon" ? 278.99 : 
            store === "Best Buy" ? 189.99 : 
            store === "Walmart" ? 499.99 : 
            Math.round(Math.random() * 100000) / 100
          ),
        };
        
        setProduct(mockProduct);
        setIsLoading(false);
        // Set mock state for tracked products
        setIsProductTracked(Math.random() > 0.5); // 50% chance of being tracked for demo
      }, 1500);
    } catch (err) {
      console.error("Error fetching product details:", err);
      setError("Failed to load product details. Please try again.");
      setIsLoading(false);
    }
  };
  
  // Generate mock price history data for the past 30 days
  const generateMockPriceHistory = (currentPrice: number) => {
    const history = [];
    const today = new Date();
    let price = currentPrice;
    
    for (let i = 30; i >= 0; i--) {
      const date = new Date();
      date.setDate(today.getDate() - i);
      
      // Add some random fluctuation to the price
      if (i > 0) { // For all days except today
        const fluctuation = (Math.random() * 0.1) - 0.05; // Between -5% and +5%
        price = price * (1 + fluctuation);
        // Occasionally add a bigger price change
        if (i % 7 === 0) {
          const bigChange = (Math.random() * 0.15) - 0.05; // Between -5% and +15%
          price = price * (1 + bigChange);
        }
      } else {
        // Ensure the last price matches the current price
        price = currentPrice;
      }
      
      history.push({
        date: date.toISOString(),
        price: Math.round(price * 100) / 100
      });
    }
    
    return history;
  };
  
  // Handle URL form submission
  const handleUrlSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!url.trim()) return;
    
    router.push(`/products?url=${encodeURIComponent(url)}`);
  };
  
  // Handle tracking this product
  const handleTrackProduct = async () => {
    if (!product) return;
    
    if (!session) {
      // Redirect to login if not authenticated
      router.push(`/auth/signin?callbackUrl=${encodeURIComponent(`/products?url=${encodeURIComponent(url)}`)}`);
      return;
    }
    
    setIsProductTracked(true);
    // In a real app, we would call an API to save this product to the user's tracked items
    // For demo, just simulate success
    await new Promise(resolve => setTimeout(resolve, 500));
  };
  
  // Handle removing product from tracking
  const handleUntrackProduct = async () => {
    if (!product) return;
    
    setIsProductTracked(false);
    // In a real app, we would call an API to remove this product from tracking
    // For demo, just simulate success
    await new Promise(resolve => setTimeout(resolve, 500));
  };
  
  // Handle saving price alert
  const handleSavePriceAlert = async () => {
    if (!product || priceDropAlertValue === null) return;
    
    setIsAlertSaving(true);
    
    try {
      // In a real app, we would call an API to save the alert
      // For demo, just simulate API call
      await new Promise(resolve => setTimeout(resolve, 800));
      
      setIsAlertSaving(false);
      // Show confirmation (would be handled by a toast in real app)
      alert(`Alert set! We'll notify you when price drops below $${priceDropAlertValue.toFixed(2)}`);
    } catch (err) {
      console.error("Error saving price alert:", err);
      setIsAlertSaving(false);
    }
  };
  
  // Format price
  const formatPrice = (price: number, currency: string = "USD") => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency,
    }).format(price);
  };

  return (
    <div className="container mx-auto py-8 px-4">
      <h1 className="text-3xl font-bold mb-6">Product Details</h1>
      
      {/* URL input form */}
      <Card className="mb-8">
        <CardHeader>
          <CardTitle>Track a Product</CardTitle>
          <CardDescription>
            Enter a product URL to view details and track its price.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleUrlSubmit} className="space-y-4">
            <div className="flex flex-col sm:flex-row gap-3">
              <div className="flex-1">
                <Label htmlFor="url" className="sr-only">Product URL</Label>
                <Input 
                  id="url"
                  type="text" 
                  placeholder="https://www.example.com/product" 
                  value={url}
                  onChange={(e) => setUrl(e.target.value)}
                  className="w-full"
                  disabled={isLoading}
                />
              </div>
              <Button type="submit" disabled={isLoading || !url.trim()}>
                {isLoading ? "Loading..." : "Get Details"}
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
      
      {/* Error display */}
      {error && (
        <Alert variant="destructive" className="mb-6">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}
      
      {/* Product details */}
      {isLoading ? (
        <div className="space-y-4">
          <Skeleton className="h-8 w-1/3" />
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Skeleton className="h-64 rounded-md" />
            <Skeleton className="h-64 rounded-md md:col-span-2" />
          </div>
        </div>
      ) : product ? (
        <div className="space-y-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Product image */}
            <Card>
              <CardContent className="p-6">
                <div className="bg-muted rounded-md w-full aspect-square flex items-center justify-center overflow-hidden">
                  {product.imageUrl ? (
                    <img 
                      src={product.imageUrl} 
                      alt={product.title} 
                      className="max-w-full max-h-full object-contain"
                    />
                  ) : (
                    <ShoppingCart className="h-16 w-16 text-muted-foreground" />
                  )}
                </div>
                <div className="mt-4 text-sm text-muted-foreground text-center">
                  Last updated: {new Date(product.lastChecked).toLocaleString()}
                </div>
              </CardContent>
            </Card>
            
            {/* Product info */}
            <Card className="md:col-span-2">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div>
                    <CardTitle className="text-2xl">{product.title}</CardTitle>
                    <CardDescription>
                      From <span className="font-medium">{product.store}</span>
                    </CardDescription>
                  </div>
                  {product.inStock ? (
                    <Badge variant="outline" className="gap-1 text-green-600 border-green-600">
                      <Check className="h-3 w-3" />
                      In Stock
                    </Badge>
                  ) : (
                    <Badge variant="outline" className="gap-1 text-red-600 border-red-600">
                      Out of Stock
                    </Badge>
                  )}
                </div>
              </CardHeader>
              <CardContent className="space-y-6">
                <div>
                  <div className="flex items-baseline gap-2">
                    <div className="text-3xl font-bold">{formatPrice(product.price, product.currency)}</div>
                    {product.originalPrice && product.originalPrice > product.price && (
                      <div className="text-muted-foreground line-through">
                        {formatPrice(product.originalPrice, product.currency)}
                      </div>
                    )}
                  </div>
                  {product.discount && (
                    <Badge className="mt-1 bg-green-100 text-green-800 hover:bg-green-100">
                      {product.discount}% off
                    </Badge>
                  )}
                </div>
                
                {/* Price trend summary */}
                {product.priceHistory.length > 1 && (
                  <div className="bg-muted p-4 rounded-md">
                    <h3 className="font-medium mb-2">Price Trend</h3>
                    <div className="grid grid-cols-3 gap-4">
                      <div>
                        <div className="text-sm text-muted-foreground">Current Price</div>
                        <div className="font-medium">{formatPrice(product.price)}</div>
                      </div>
                      <div>
                        <div className="text-sm text-muted-foreground">Highest Price</div>
                        <div className="font-medium">
                          {formatPrice(Math.max(...product.priceHistory.map(p => p.price)))}
                        </div>
                      </div>
                      <div>
                        <div className="text-sm text-muted-foreground">Lowest Price</div>
                        <div className="font-medium">
                          {formatPrice(Math.min(...product.priceHistory.map(p => p.price)))}
                        </div>
                      </div>
                    </div>
                  </div>
                )}
                
                {/* Action buttons */}
                <div className="flex flex-wrap gap-3">
                  <Button 
                    variant={isProductTracked ? "outline" : "default"}
                    onClick={isProductTracked ? handleUntrackProduct : handleTrackProduct}
                    className="gap-2"
                  >
                    {isProductTracked ? (
                      <>
                        <Check className="h-4 w-4" />
                        Tracking
                      </>
                    ) : (
                      <>
                        <TrendingDown className="h-4 w-4" />
                        Track Price
                      </>
                    )}
                  </Button>
                  
                  <Button 
                    variant="outline" 
                    onClick={() => window.open(product.url, '_blank')}
                    className="gap-2"
                  >
                    <ExternalLink className="h-4 w-4" />
                    Visit Store
                  </Button>
                  
                  <Button 
                    variant="outline"
                    onClick={() => setActiveTab("history")}
                    className="gap-2"
                  >
                    <History className="h-4 w-4" />
                    Price History
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
          
          {/* Tabs for more details */}
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="mb-4">
              <TabsTrigger value="overview">Overview</TabsTrigger>
              <TabsTrigger value="alerts">Price Alerts</TabsTrigger>
              <TabsTrigger value="history">Price History</TabsTrigger>
              <TabsTrigger value="similar">Similar Products</TabsTrigger>
            </TabsList>
            
            <TabsContent value="overview">
              <Card>
                <CardHeader>
                  <CardTitle>Product Overview</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                      <div className="space-y-2">
                        <h3 className="font-medium flex items-center gap-2">
                          <TrendingDown className="h-4 w-4 text-primary" />
                          Price Tracking
                        </h3>
                        <p className="text-sm text-muted-foreground">
                          We check this product's price multiple times per day to ensure you get accurate information.
                        </p>
                      </div>
                      
                      <div className="space-y-2">
                        <h3 className="font-medium flex items-center gap-2">
                          <Bell className="h-4 w-4 text-primary" />
                          Price Alerts
                        </h3>
                        <p className="text-sm text-muted-foreground">
                          Set price drop alerts to be notified when this product reaches your target price.
                        </p>
                      </div>
                      
                      <div className="space-y-2">
                        <h3 className="font-medium flex items-center gap-2">
                          <History className="h-4 w-4 text-primary" />
                          Price History
                        </h3>
                        <p className="text-sm text-muted-foreground">
                          View detailed price history charts to identify trends and make informed buying decisions.
                        </p>
                      </div>
                    </div>
                    
                    {!isProductTracked && (
                      <Alert className="bg-primary/10 border-primary/20">
                        <div className="flex items-center gap-2">
                          <TrendingDown className="h-4 w-4" />
                          <AlertTitle>Start tracking this product</AlertTitle>
                        </div>
                        <AlertDescription>
                          Track this product to get price drop alerts and see detailed price history charts.
                        </AlertDescription>
                        <div className="mt-4">
                          <Button onClick={handleTrackProduct}>
                            Track Price
                          </Button>
                        </div>
                      </Alert>
                    )}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
            
            <TabsContent value="alerts">
              <Card>
                <CardHeader>
                  <CardTitle>Price Alerts</CardTitle>
                  <CardDescription>
                    Get notified when the price drops below a certain amount
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {!session ? (
                    <Alert className="mb-4">
                      <AlertCircle className="h-4 w-4" />
                      <AlertTitle>Sign in required</AlertTitle>
                      <AlertDescription>
                        You need to sign in to set price alerts.
                      </AlertDescription>
                      <div className="mt-4">
                        <Button onClick={() => router.push(`/auth/signin?callbackUrl=${encodeURIComponent(`/products?url=${encodeURIComponent(url)}`)}`)}
>
                          Sign In
                        </Button>
                      </div>
                    </Alert>
                  ) : (
                    <div className="space-y-6">
                      <div className="flex flex-col sm:flex-row sm:items-end gap-4">
                        <div className="flex-1 space-y-2">
                          <Label htmlFor="alert-price">Alert me when price drops below</Label>
                          <div className="flex items-center gap-2">
                            <span className="text-lg">$</span>
                            <Input
                              id="alert-price"
                              type="number"
                              min={1}
                              step={0.01}
                              value={priceDropAlertValue !== null ? priceDropAlertValue : ''}
                              onChange={(e) => setPriceDropAlertValue(e.target.value ? parseFloat(e.target.value) : null)}
                              placeholder={(product.price * 0.9).toFixed(2)}
                            />
                          </div>
                        </div>
                        <Button 
                          onClick={handleSavePriceAlert} 
                          disabled={isAlertSaving || priceDropAlertValue === null || priceDropAlertValue >= product.price}
                        >
                          {isAlertSaving ? "Saving..." : "Set Alert"}
                        </Button>
                      </div>
                      
                      <div className="bg-muted p-4 rounded-md">
                        <h3 className="font-medium mb-2">Suggested Alert Thresholds</h3>
                        <div className="grid grid-cols-3 gap-4">
                          <Button 
                            variant="outline" 
                            onClick={() => setPriceDropAlertValue(Math.round(product.price * 0.9 * 100) / 100)}
                          >
                            10% off ({formatPrice(product.price * 0.9)})
                          </Button>
                          <Button 
                            variant="outline" 
                            onClick={() => setPriceDropAlertValue(Math.round(product.price * 0.8 * 100) / 100)}
                          >
                            20% off ({formatPrice(product.price * 0.8)})
                          </Button>
                          <Button 
                            variant="outline" 
                            onClick={() => setPriceDropAlertValue(Math.round(product.price * 0.7 * 100) / 100)}
                          >
                            30% off ({formatPrice(product.price * 0.7)})
                          </Button>
                        </div>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
            
            <TabsContent value="history">
              <Card>
                <CardHeader>
                  <CardTitle>Price History</CardTitle>
                  <CardDescription>
                    Price changes over the past 30 days
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {/* Placeholder for price history chart */}
                  <div className="h-72 bg-muted rounded-md flex items-center justify-center">
                    <p className="text-muted-foreground">
                      Price history chart would be displayed here
                    </p>
                  </div>
                  
                  {/* Price history data table */}
                  <div className="mt-6">
                    <h3 className="font-medium mb-2">Recent Price Changes</h3>
                    <div className="border rounded-md overflow-hidden">
                      <table className="w-full">
                        <thead className="bg-muted">
                          <tr>
                            <th className="px-4 py-2 text-left">Date</th>
                            <th className="px-4 py-2 text-right">Price</th>
                            <th className="px-4 py-2 text-right">Change</th>
                          </tr>
                        </thead>
                        <tbody>
                          {product.priceHistory.slice(-5).reverse().map((point, index, array) => {
                            const prevPrice = index < array.length - 1 ? array[index + 1].price : point.price;
                            const change = point.price - prevPrice;
                            const changePercent = (change / prevPrice) * 100;
                            
                            return (
                              <tr key={point.date} className="border-t">
                                <td className="px-4 py-2 text-left">
                                  {new Date(point.date).toLocaleDateString()}
                                </td>
                                <td className="px-4 py-2 text-right font-medium">
                                  {formatPrice(point.price)}
                                </td>
                                <td className="px-4 py-2 text-right">
                                  {index < array.length - 1 && (
                                    <span className={change === 0 ? 'text-gray-500' : change < 0 ? 'text-green-600' : 'text-red-600'}>
                                      {change === 0 ? '--' : change < 0 ? '↓' : '↑'} {Math.abs(changePercent).toFixed(1)}%
                                    </span>
                                  )}
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
            
            <TabsContent value="similar">
              <Card>
                <CardHeader>
                  <CardTitle>Similar Products</CardTitle>
                  <CardDescription>
                    Other products you might be interested in
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    {/* Placeholder for similar products */}
                    {[1, 2, 3].map((_, i) => (
                      <Card key={i}>
                        <div className="p-4">
                          <div className="bg-muted h-32 rounded-md mb-2 flex items-center justify-center">
                            <ShoppingCart className="h-8 w-8 text-muted-foreground" />
                          </div>
                          <h3 className="font-medium truncate">Similar Product {i + 1}</h3>
                          <p className="text-sm text-muted-foreground mb-2">
                            {product.store}
                          </p>
                          <div className="font-bold">{formatPrice(Math.round(product.price * (0.8 + Math.random() * 0.4) * 100) / 100)}</div>
                        </div>
                      </Card>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      ) : (
        // Initial state - no product loaded yet
        <Card>
          <CardContent className="p-8 text-center">
            <div className="mb-4">
              <ShoppingCart className="h-12 w-12 mx-auto text-muted-foreground" />
            </div>
            <h2 className="text-xl font-semibold mb-2">No product loaded</h2>
            <p className="text-muted-foreground mb-6">
              Enter a product URL above to view details and track its price.
            </p>
            <div className="flex justify-center">
              <Button 
                variant="outline"
                onClick={() => router.push("/scraper-test")}
              >
                Try the Scraper Test Tool
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
