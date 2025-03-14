"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Label } from "@/components/ui/label";
import { AlertCircle, Check, ExternalLink, ShoppingCart, AlertTriangle, Clock, X } from "lucide-react";

// Interface for search parameters
interface SearchParams {
  [key: string]: string | string[] | undefined;
}

// Mock product information
interface ProductInfo {
  title: string;
  price: number;
  originalPrice?: number;
  discount?: number;
  currency: string;
  store: string;
  inStock: boolean;
  imageUrl: string;
  url: string;
  scraped: boolean;
  scrapedAt: string;
}

// Client component for scraper test
export default function ScraperTestClient({ 
  initialSearchParams 
}: { 
  initialSearchParams: SearchParams
}) {
  const router = useRouter();
  const searchParams = useSearchParams();
  
  const [url, setUrl] = useState(searchParams.get("url") || "");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [productInfo, setProductInfo] = useState<ProductInfo | null>(null);
  const [scrapingLogs, setScrapingLogs] = useState<string[]>([]);
  const [activeTab, setActiveTab] = useState("result");
  
  // Sample product URLs for testing
  const sampleUrls = [
    {
      store: "Amazon",
      url: "https://www.amazon.com/Sony-WH-1000XM4-Canceling-Headphones-phone-call/dp/B0863TXGM3/",
      description: "Sony WH-1000XM4 Headphones"
    },
    {
      store: "Best Buy",
      url: "https://www.bestbuy.com/site/apple-airpods-pro-2nd-generation-white/4900964.p?skuId=4900964",
      description: "Apple AirPods Pro"
    },
    {
      store: "Walmart",
      url: "https://www.walmart.com/ip/PlayStation-5-Console-Marvel-s-Spider-Man-2-Bundle/3000617250",
      description: "PlayStation 5 Console"
    }
  ];
  
  // Handle URL submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!url.trim()) return;
    
    setIsLoading(true);
    setError(null);
    setProductInfo(null);
    setScrapingLogs([]);
    
    // Log the start of scraping
    addLog("🚀 Starting scraper for URL: " + url);
    addLog("⏱️ Initializing scraper...");
    
    try {
      // In a real app, we would call the scraping API
      // const response = await fetch('/api/scrape', {
      //   method: 'POST',
      //   headers: { 'Content-Type': 'application/json' },
      //   body: JSON.stringify({ url }),
      // });
      
      // For demo, simulate API call with timeout and mock data
      setTimeout(() => {
        // Randomly decide if scraping succeeds or fails for demo purposes
        const success = Math.random() > 0.2; // 80% success rate
        
        if (!success) {
          addLog("❌ Error: Failed to extract product information.");
          addLog("🔍 Checking if site has anti-scraping measures...");
          addLog("⚠️ Detected potential CAPTCHA or IP blocking.");
          setError("Failed to scrape product information. The website may have anti-scraping measures in place.");
          setIsLoading(false);
          return;
        }
        
        addLog("✓ Connected to website successfully.");
        addLog("🔍 Looking for product elements...");
        
        // For demo purposes, determine store from URL to customize the mock response
        let store = "Unknown";
        if (url.includes("amazon")) {
          store = "Amazon";
          addLog("✓ Detected Amazon store, using Amazon scraper.");
        } else if (url.includes("bestbuy")) {
          store = "Best Buy";
          addLog("✓ Detected Best Buy store, using Best Buy scraper.");
        } else if (url.includes("walmart")) {
          store = "Walmart";
          addLog("✓ Detected Walmart store, using Walmart scraper.");
        } else if (url.includes("target")) {
          store = "Target";
          addLog("✓ Detected Target store, using Target scraper.");
        } else {
          addLog("⚠️ Unknown store, attempting generic scraper.");
        }
        
        addLog("🔍 Extracting product title...");
        addLog("🔍 Extracting product price...");
        addLog("🔍 Checking stock status...");
        addLog("🔍 Extracting product image...");
        
        // Create mock product data
        const mockProduct: ProductInfo = {
          title: store === "Amazon" ? "Sony WH-1000XM4 Wireless Noise-Canceling Headphones" :
                 store === "Best Buy" ? "Apple AirPods Pro (2nd Generation) - White" :
                 store === "Walmart" ? "PlayStation 5 Console Marvel's Spider-Man 2 Bundle" :
                 "Mock Product Title - Demo Only",
          price: store === "Amazon" ? 278.99 :
                store === "Best Buy" ? 189.99 :
                store === "Walmart" ? 499.99 :
                Math.round(Math.random() * 100000) / 100,
          originalPrice: store === "Amazon" ? 349.99 :
                       store === "Best Buy" ? 249.99 :
                       store === "Walmart" ? 549.99 :
                       Math.round(Math.random() * 150000) / 100,
          discount: store === "Amazon" ? 20 :
                  store === "Best Buy" ? 24 :
                  store === "Walmart" ? 9 :
                  Math.round(Math.random() * 30),
          currency: "USD",
          store: store,
          inStock: Math.random() > 0.2, // 80% in stock rate
          imageUrl: store === "Amazon" ? "https://m.media-amazon.com/images/I/71o8Q5XJS5L._AC_SL1500_.jpg" :
                  store === "Best Buy" ? "https://pisces.bbystatic.com/image2/BestBuy_US/images/products/4900/4900964_sd.jpg" :
                  store === "Walmart" ? "https://i5.walmartimages.com/seo/PlayStation-5-Console-Marvel-s-Spider-Man-2-Bundle_3000617250.jpg" :
                  "/placeholder-product.jpg",
          url: url,
          scraped: true,
          scrapedAt: new Date().toISOString(),
        };
        
        addLog("✓ Found product: " + mockProduct.title);
        addLog("✓ Current price: $" + mockProduct.price);
        if (mockProduct.originalPrice && mockProduct.originalPrice > mockProduct.price) {
          addLog("💰 Price drop detected! Original price: $" + mockProduct.originalPrice);
          addLog("💰 You save: $" + (mockProduct.originalPrice - mockProduct.price).toFixed(2) + " (" + mockProduct.discount + "%)");
        }
        addLog("✓ Stock status: " + (mockProduct.inStock ? "In Stock" : "Out of Stock"));
        addLog("✓ Product image found.");
        addLog("✅ Scraping completed successfully!");
        
        setProductInfo(mockProduct);
        setIsLoading(false);
        
        // Update URL with the scraped URL
        router.push(`/scraper-test?url=${encodeURIComponent(url)}`);
      }, 2500); // Simulated loading time
    } catch (err) {
      console.error("Error scraping URL:", err);
      setError("An unexpected error occurred. Please try again.");
      setIsLoading(false);
    }
  };
  
  // Add a log entry
  const addLog = (message: string) => {
    setScrapingLogs((prevLogs) => [...prevLogs, message]);
  };
  
  // Handle selecting a sample URL
  const handleSampleUrlClick = (sampleUrl: string) => {
    setUrl(sampleUrl);
    // Auto-submit the form with the selected URL
    setIsLoading(true);
    setError(null);
    setProductInfo(null);
    setScrapingLogs([]);
    
    // Wait a bit before "submitting" to make it seem like the form is being processed
    setTimeout(() => {
      router.push(`/scraper-test?url=${encodeURIComponent(sampleUrl)}`);
      handleSubmit({ preventDefault: () => {} } as React.FormEvent);
    }, 100);
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
      <h1 className="text-3xl font-bold mb-6">Scraper Test Tool</h1>
      <p className="text-muted-foreground mb-8">
        Test our price scraping capability on product pages from popular retailers.
      </p>
      
      {/* URL input form */}
      <Card className="mb-8">
        <CardHeader>
          <CardTitle>Enter Product URL</CardTitle>
          <CardDescription>
            Paste a URL from Amazon, Best Buy, Walmart, or other supported retailers to test scraping.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
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
                {isLoading ? "Scraping..." : "Scrape URL"}
              </Button>
            </div>
          </form>
          
          {/* Sample URLs */}
          <div className="mt-4">
            <p className="text-sm text-muted-foreground mb-2">Try one of these sample URLs:</p>
            <div className="flex flex-wrap gap-2">
              {sampleUrls.map((sample, index) => (
                <Button 
                  key={index}
                  variant="outline" 
                  size="sm"
                  disabled={isLoading}
                  onClick={() => handleSampleUrlClick(sample.url)}
                >
                  <ShoppingCart className="h-3 w-3 mr-1" />
                  {sample.description}
                </Button>
              ))}
            </div>
          </div>
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
      
      {/* Results section */}
      {(isLoading || productInfo) && (
        <div className="mb-8">
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="mb-4">
              <TabsTrigger value="result">Result</TabsTrigger>
              <TabsTrigger value="logs">Scraping Logs</TabsTrigger>
            </TabsList>
            
            <TabsContent value="result">
              <Card>
                <CardHeader>
                  <CardTitle>Product Information</CardTitle>
                  <CardDescription>
                    Scraped data from the provided URL
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {isLoading ? (
                    // Loading state
                    <div className="space-y-4">
                      <div className="flex flex-col sm:flex-row gap-6">
                        <Skeleton className="h-48 w-48 rounded-md" />
                        <div className="flex-1 space-y-2">
                          <Skeleton className="h-10 w-4/5" />
                          <Skeleton className="h-8 w-1/3" />
                          <Skeleton className="h-6 w-1/4 mt-4" />
                          <div className="flex gap-2 mt-2">
                            <Skeleton className="h-6 w-16" />
                            <Skeleton className="h-6 w-16" />
                          </div>
                        </div>
                      </div>
                    </div>
                  ) : productInfo ? (
                    // Product information
                    <div className="space-y-4">
                      <div className="flex flex-col sm:flex-row gap-6">
                        <div className="w-48 h-48 bg-muted rounded-md flex items-center justify-center overflow-hidden">
                          {productInfo.imageUrl ? (
                            <img 
                              src={productInfo.imageUrl} 
                              alt={productInfo.title} 
                              className="max-w-full max-h-full object-contain"
                            />
                          ) : (
                            <ShoppingCart className="h-12 w-12 text-muted-foreground" />
                          )}
                        </div>
                        <div className="flex-1">
                          <h3 className="text-xl font-semibold mb-2">{productInfo.title}</h3>
                          <p className="text-sm text-muted-foreground mb-4">
                            Scraped from <span className="font-medium">{productInfo.store}</span>
                          </p>
                          
                          <div className="flex items-baseline gap-2 mb-1">
                            <span className="text-2xl font-bold">{formatPrice(productInfo.price, productInfo.currency)}</span>
                            {productInfo.originalPrice && productInfo.originalPrice > productInfo.price && (
                              <span className="text-sm text-muted-foreground line-through">
                                {formatPrice(productInfo.originalPrice, productInfo.currency)}
                              </span>
                            )}
                          </div>
                          
                          {productInfo.originalPrice && productInfo.originalPrice > productInfo.price && (
                            <Badge className="mb-4 bg-green-100 text-green-800 hover:bg-green-100">
                              {productInfo.discount}% off
                            </Badge>
                          )}
                          
                          <div className="flex items-center gap-2 text-sm">
                            {productInfo.inStock ? (
                              <Badge variant="outline" className="gap-1 text-green-600 border-green-600">
                                <Check className="h-3 w-3" />
                                In Stock
                              </Badge>
                            ) : (
                              <Badge variant="outline" className="gap-1 text-red-600 border-red-600">
                                <X className="h-3 w-3" />
                                Out of Stock
                              </Badge>
                            )}
                            
                            <Badge variant="outline" className="gap-1">
                              <Clock className="h-3 w-3" />
                              Scraped {new Date(productInfo.scrapedAt).toLocaleTimeString()}
                            </Badge>
                          </div>
                        </div>
                      </div>
                      
                      <div className="pt-4 border-t">
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => window.open(productInfo.url, '_blank')}
                          className="gap-1"
                        >
                          <ExternalLink className="h-4 w-4" />
                          Visit Product Page
                        </Button>
                      </div>
                    </div>
                  ) : null}
                </CardContent>
              </Card>
            </TabsContent>
            
            <TabsContent value="logs">
              <Card>
                <CardHeader>
                  <CardTitle>Scraping Logs</CardTitle>
                  <CardDescription>
                    Technical details about the scraping process
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="bg-black text-white font-mono text-sm p-4 rounded-md h-80 overflow-y-auto">
                    {scrapingLogs.length > 0 ? (
                      scrapingLogs.map((log, index) => (
                        <div key={index} className="mb-1">{log}</div>
                      ))
                    ) : isLoading ? (
                      <div className="animate-pulse">Initializing scraper...</div>
                    ) : (
                      <div className="text-gray-500">No logs available yet. Scrape a URL to see logs.</div>
                    )}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      )}
      
      {/* Supported retailers */}
      <Card>
        <CardHeader>
          <CardTitle>Supported Retailers</CardTitle>
          <CardDescription>
            Our scraper works with these popular online retailers
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
            {["Amazon", "Best Buy", "Walmart", "Target", "Newegg", "eBay", "Home Depot", "B&H Photo", "Adorama", "Costco"].map((retailer) => (
              <div key={retailer} className="flex flex-col items-center p-4 bg-muted rounded-md">
                <div className="font-medium">{retailer}</div>
                <div className="text-xs text-muted-foreground mt-1">Supported</div>
              </div>
            ))}
          </div>
          <div className="mt-4 text-sm text-muted-foreground">
            <AlertTriangle className="h-4 w-4 inline mr-1" />
            Note: This is a demo. Actual scraping results and supported retailers may vary.
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
