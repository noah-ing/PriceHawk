"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useSession } from "next-auth/react";
import Link from "next/link";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { LineChart, BarChart, PieChart, TrendingDown, TrendingUp, AlertCircle, Calendar, BarChart2 } from "lucide-react";

// Interface for search parameters
interface SearchParams {
  [key: string]: string | string[] | undefined;
}

// Simulated product interface
interface Product {
  id: string;
  name: string;
  store: string;
  currentPrice: number;
  lowestPrice: number;
  highestPrice: number;
  priceHistory: {
    date: string;
    price: number;
  }[];
}

// Client component for price history
export default function HistoryClient({ 
  initialSearchParams 
}: { 
  initialSearchParams: SearchParams
}) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { data: session, status } = useSession();
  
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [selectedProduct, setSelectedProduct] = useState<string | null>(null);
  const [timeRange, setTimeRange] = useState("30days");
  
  // Get the product ID from URL if provided
  const productId = searchParams.get("productId");

  // Fetch products and their price history
  useEffect(() => {
    const fetchProducts = async () => {
      setIsLoading(true);
      try {
        // In a real app, this would be an API call
        // const response = await fetch('/api/products?includeHistory=true');
        
        // For demo, using mock data
        setTimeout(() => {
          // Mock product data with price history
          const mockProducts = [
            {
              id: "p1",
              name: "Sony WH-1000XM4 Wireless Noise Cancelling Headphones",
              store: "Amazon",
              currentPrice: 299.99,
              lowestPrice: 249.99,
              highestPrice: 349.99,
              priceHistory: Array.from({ length: 60 }, (_, i) => ({
                date: new Date(Date.now() - (59 - i) * 24 * 60 * 60 * 1000).toISOString(),
                price: 300 - Math.random() * 50 + (i % 10 === 0 ? 20 : 0),
              })),
            },
            {
              id: "p2",
              name: "Samsung 55-Inch 4K UHD Smart TV",
              store: "Best Buy",
              currentPrice: 499.99,
              lowestPrice: 449.99,
              highestPrice: 599.99,
              priceHistory: Array.from({ length: 60 }, (_, i) => ({
                date: new Date(Date.now() - (59 - i) * 24 * 60 * 60 * 1000).toISOString(),
                price: 500 - Math.random() * 50 + (i % 15 === 0 ? -30 : 0),
              })),
            },
            {
              id: "p3",
              name: "Apple iPad Pro 11-inch",
              store: "Apple",
              currentPrice: 799.99,
              lowestPrice: 749.99,
              highestPrice: 849.99,
              priceHistory: Array.from({ length: 60 }, (_, i) => ({
                date: new Date(Date.now() - (59 - i) * 24 * 60 * 60 * 1000).toISOString(),
                price: 800 - Math.random() * 50 + (i % 20 === 0 ? -40 : 0),
              })),
            },
          ];
          
          setProducts(mockProducts);
          
          // If product ID is provided in URL, select it
          if (productId && mockProducts.some(p => p.id === productId)) {
            setSelectedProduct(productId);
          } else if (mockProducts.length > 0) {
            // Otherwise select the first product
            setSelectedProduct(mockProducts[0].id);
          }
          
          setIsLoading(false);
        }, 800);
      } catch (err) {
        console.error("Error fetching products:", err);
        setError("Failed to load price history. Please try again.");
        setIsLoading(false);
      }
    };

    if (status === "authenticated") {
      fetchProducts();
    } else if (status === "unauthenticated") {
      router.push("/auth/signin");
    }
  }, [status, router, productId]);

  // Filter price history based on selected time range
  const getFilteredHistory = (product: Product | undefined) => {
    if (!product) return [];
    
    const now = new Date();
    let daysToShow = 30;
    
    switch (timeRange) {
      case "7days":
        daysToShow = 7;
        break;
      case "30days":
        daysToShow = 30;
        break;
      case "90days":
        daysToShow = 90;
        break;
      case "all":
        return product.priceHistory;
      default:
        daysToShow = 30;
    }
    
    const cutoffDate = new Date(now.setDate(now.getDate() - daysToShow));
    return product.priceHistory.filter(item => new Date(item.date) >= cutoffDate);
  };

  // Find the selected product object
  const activeProduct = products.find(p => p.id === selectedProduct);
  
  // Find price trends
  const calculateTrend = (history: { date: string; price: number }[]) => {
    if (history.length < 2) return { trend: "stable", percentage: 0 };
    
    const oldestPrice = history[0].price;
    const latestPrice = history[history.length - 1].price;
    const difference = latestPrice - oldestPrice;
    const percentage = (difference / oldestPrice) * 100;
    
    if (percentage > 2) return { trend: "up", percentage };
    if (percentage < -2) return { trend: "down", percentage: Math.abs(percentage) };
    return { trend: "stable", percentage: 0 };
  };
  
  const filteredHistory = activeProduct ? getFilteredHistory(activeProduct) : [];
  const priceTrend = calculateTrend(filteredHistory);

  // Format date for display
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
    });
  };

  // If loading or not authenticated yet
  if (status === "loading" || isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-center">
          <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
          <p className="mt-4 text-muted-foreground">Loading price history...</p>
        </div>
      </div>
    );
  }

  // If there's an error
  if (error) {
    return (
      <div className="container mx-auto py-8 px-4">
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      </div>
    );
  }

  // If no products are tracked
  if (products.length === 0) {
    return (
      <div className="container mx-auto py-8 px-4">
        <h1 className="text-3xl font-bold mb-6">Price History</h1>
        <Card>
          <CardHeader>
            <CardTitle>No Products Tracked</CardTitle>
            <CardDescription>
              You haven't added any products to track their price history
            </CardDescription>
          </CardHeader>
          <CardContent className="text-center py-6">
            <p className="mb-4 text-muted-foreground">
              Start tracking product prices to see their price history and trends
            </p>
            <Button onClick={() => router.push("/products")}>
              Add Products
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8 px-4">
      <h1 className="text-3xl font-bold mb-6">Price History</h1>
      
      <div className="grid gap-6 md:grid-cols-4">
        <div className="md:col-span-1">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Products</CardTitle>
            </CardHeader>
            <CardContent>
              <nav className="space-y-2">
                {products.map(product => (
                  <Button
                    key={product.id}
                    variant={selectedProduct === product.id ? "default" : "ghost"}
                    className="w-full justify-start text-left"
                    onClick={() => setSelectedProduct(product.id)}
                  >
                    <span className="truncate">{product.name}</span>
                  </Button>
                ))}
              </nav>
            </CardContent>
          </Card>
        </div>
        
        <div className="md:col-span-3">
          {activeProduct && (
            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <div className="flex flex-wrap items-start justify-between gap-4">
                    <div>
                      <CardTitle>{activeProduct.name}</CardTitle>
                      <CardDescription>
                        {activeProduct.store} • Current Price: ${activeProduct.currentPrice.toFixed(2)}
                      </CardDescription>
                    </div>
                    <Select value={timeRange} onValueChange={setTimeRange}>
                      <SelectTrigger className="w-[120px]">
                        <SelectValue placeholder="Time Range" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="7days">Last 7 Days</SelectItem>
                        <SelectItem value="30days">Last 30 Days</SelectItem>
                        <SelectItem value="90days">Last 90 Days</SelectItem>
                        <SelectItem value="all">All Time</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="grid gap-4 md:grid-cols-3">
                    <Card>
                      <CardHeader className="py-2">
                        <CardTitle className="text-sm font-medium">Current Price</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="text-2xl font-bold">${activeProduct.currentPrice.toFixed(2)}</div>
                      </CardContent>
                    </Card>
                    
                    <Card>
                      <CardHeader className="py-2">
                        <CardTitle className="text-sm font-medium">Lowest Price</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="text-2xl font-bold">${activeProduct.lowestPrice.toFixed(2)}</div>
                      </CardContent>
                    </Card>
                    
                    <Card>
                      <CardHeader className="py-2">
                        <CardTitle className="text-sm font-medium">Highest Price</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="text-2xl font-bold">${activeProduct.highestPrice.toFixed(2)}</div>
                      </CardContent>
                    </Card>
                  </div>
                  
                  <div>
                    <div className="mb-4 flex items-center gap-2">
                      <h3 className="font-medium">Price Trend</h3>
                      <Badge 
                        variant={priceTrend.trend === "down" ? "default" : priceTrend.trend === "up" ? "destructive" : "secondary"}
                        className={`ml-2 ${priceTrend.trend === "down" ? "bg-green-500" : ""}`}
                      >
                        {priceTrend.trend === "down" ? (
                          <span className="flex items-center gap-1">
                            <TrendingDown className="h-3 w-3" /> Down {priceTrend.percentage.toFixed(1)}%
                          </span>
                        ) : priceTrend.trend === "up" ? (
                          <span className="flex items-center gap-1">
                            <TrendingUp className="h-3 w-3" /> Up {priceTrend.percentage.toFixed(1)}%
                          </span>
                        ) : (
                          "Stable"
                        )}
                      </Badge>
                    </div>
                    
                    {/* In a real app, this would be a proper chart component */}
                    <div className="p-4 border rounded-md relative h-64">
                      <div className="absolute inset-0 flex items-center justify-center">
                        <p className="text-muted-foreground">
                          [Price History Chart Would Render Here]
                        </p>
                        <p className="text-xs text-muted-foreground absolute bottom-2 right-2">
                          {filteredHistory.length} data points
                        </p>
                      </div>
                    </div>
                  </div>
                  
                  <div>
                    <h3 className="font-medium mb-2">Price History Data</h3>
                    <div className="border rounded-md overflow-hidden">
                      <div className="grid grid-cols-2 gap-4 p-3 bg-muted font-medium">
                        <div>Date</div>
                        <div>Price</div>
                      </div>
                      <div className="max-h-64 overflow-y-auto">
                        {filteredHistory.map((item, index) => (
                          <div 
                            key={index} 
                            className="grid grid-cols-2 gap-4 p-3 border-t"
                          >
                            <div>{formatDate(item.date)}</div>
                            <div>${item.price.toFixed(2)}</div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
              
              <div className="flex justify-between items-center">
                <Button
                  variant="outline"
                  onClick={() => router.push(`/products/${activeProduct.id}`)}
                >
                  View Product Details
                </Button>
                
                <Button
                  variant="outline"
                  onClick={() => router.push(`/alerts/new?productId=${activeProduct.id}`)}
                >
                  Set Price Alert
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
