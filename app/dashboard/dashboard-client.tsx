"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useSession } from "next-auth/react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { LineChart, BarChart, PieChart, Activity, AlertCircle, BarChart2 } from "lucide-react";

// Import the dropshipper dashboard component if user has that role
import DropshipperDashboard from "./dropshipper-page";

// Interface for search parameters
interface SearchParams {
  [key: string]: string | string[] | undefined;
}

// Simulated product interface
interface Product {
  id: string;
  name: string;
  price: number;
  store: string;
  imageUrl: string;
  lastUpdated: string;
}

// Simulated alert interface
interface PriceAlert {
  id: string;
  productId: string;
  productName: string;
  targetPrice: number;
  currentPrice: number;
  createdAt: string;
}

// Client component for dashboard
export default function DashboardClient({ 
  initialSearchParams 
}: { 
  initialSearchParams: SearchParams
}) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { data: session, status } = useSession();
  
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState("overview");
  const [recentProducts, setRecentProducts] = useState<Product[]>([]);
  const [recentAlerts, setRecentAlerts] = useState<PriceAlert[]>([]);
  const [userRole, setUserRole] = useState("standard"); // standard or dropshipper

  // Check if user is a dropshipper from role or subscription
  useEffect(() => {
    if (session?.user) {
      // This would typically check a role or subscription level
      // For demo, randomly assign a role
      setUserRole(Math.random() > 0.5 ? "dropshipper" : "standard");
    }
  }, [session]);

  // Fetch dashboard data
  useEffect(() => {
    const fetchDashboardData = async () => {
      setIsLoading(true);
      try {
        // In a real app, these would be API calls
        // const productsResponse = await fetch('/api/products/recent');
        // const alertsResponse = await fetch('/api/alerts/recent');
        
        // For demo, using mock data
        setTimeout(() => {
          // Mock recent products
          setRecentProducts([
            {
              id: "p1",
              name: "Sony WH-1000XM4 Wireless Noise Cancelling Headphones",
              price: 299.99,
              store: "Amazon",
              imageUrl: "/images/placeholder-product.jpg",
              lastUpdated: "2025-03-12T14:30:00Z",
            },
            {
              id: "p2",
              name: "Samsung 55-Inch 4K UHD Smart TV",
              price: 499.99,
              store: "Best Buy",
              imageUrl: "/images/placeholder-product.jpg",
              lastUpdated: "2025-03-10T09:15:00Z",
            }
          ]);
          
          // Mock recent alerts
          setRecentAlerts([
            {
              id: "a1",
              productId: "p1",
              productName: "Sony WH-1000XM4 Wireless Noise Cancelling Headphones",
              targetPrice: 249.99,
              currentPrice: 299.99,
              createdAt: "2025-03-01T10:30:00Z",
            },
            {
              id: "a2",
              productId: "p2",
              productName: "Samsung 55-Inch 4K UHD Smart TV",
              targetPrice: 449.99,
              currentPrice: 499.99,
              createdAt: "2025-03-05T14:20:00Z",
            }
          ]);
          
          setIsLoading(false);
        }, 800);
      } catch (err) {
        console.error("Error fetching dashboard data:", err);
        setError("Failed to load dashboard data. Please try again.");
        setIsLoading(false);
      }
    };

    if (status === "authenticated") {
      fetchDashboardData();
    } else if (status === "unauthenticated") {
      router.push("/auth/signin");
    }
  }, [status, router]);

  // If loading or not authenticated yet
  if (status === "loading" || isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-center">
          <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
          <p className="mt-4 text-muted-foreground">Loading your dashboard...</p>
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

  // If user is a dropshipper, show specialized dashboard
  if (userRole === "dropshipper") {
    return <DropshipperDashboard />;
  }

  // Default dashboard for standard users
  return (
    <div className="container mx-auto py-8 px-4">
      <h1 className="text-3xl font-bold mb-6">Dashboard</h1>
      
      <Tabs defaultValue="overview" onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full max-w-md grid-cols-3">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="products">Products</TabsTrigger>
          <TabsTrigger value="alerts">Alerts</TabsTrigger>
        </TabsList>
        
        <TabsContent value="overview" className="space-y-6">
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Tracked Products</CardTitle>
                <BarChart2 className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{recentProducts.length}</div>
                <p className="text-xs text-muted-foreground">Products you're tracking across different stores</p>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Active Alerts</CardTitle>
                <Activity className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{recentAlerts.length}</div>
                <p className="text-xs text-muted-foreground">Price alerts waiting to be triggered</p>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Average Savings</CardTitle>
                <LineChart className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">15%</div>
                <p className="text-xs text-muted-foreground">Estimated potential savings based on your alerts</p>
              </CardContent>
            </Card>
          </div>
          
          <div className="grid gap-6 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Recent Products</CardTitle>
                <CardDescription>
                  Your most recently tracked products
                </CardDescription>
              </CardHeader>
              <CardContent>
                {recentProducts.length > 0 ? (
                  <div className="space-y-4">
                    {recentProducts.map(product => (
                      <div key={product.id} className="flex items-center space-x-4">
                        <div className="w-12 h-12 bg-gray-100 rounded flex-shrink-0"></div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium truncate">{product.name}</p>
                          <p className="text-sm text-muted-foreground">${product.price.toFixed(2)} • {product.store}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-6 text-muted-foreground">
                    <p>No products tracked yet</p>
                    <Button 
                      variant="link" 
                      onClick={() => router.push("/products")}
                      className="mt-2"
                    >
                      Add your first product
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader>
                <CardTitle>Recent Alerts</CardTitle>
                <CardDescription>
                  Your most recently created price alerts
                </CardDescription>
              </CardHeader>
              <CardContent>
                {recentAlerts.length > 0 ? (
                  <div className="space-y-4">
                    {recentAlerts.map(alert => (
                      <div key={alert.id} className="space-y-1">
                        <p className="text-sm font-medium truncate">{alert.productName}</p>
                        <div className="flex justify-between text-sm">
                          <span>Current: ${alert.currentPrice.toFixed(2)}</span>
                          <span>Target: ${alert.targetPrice.toFixed(2)}</span>
                        </div>
                        <div className="w-full bg-muted rounded-full h-2">
                          <div 
                            className="bg-primary h-2 rounded-full" 
                            style={{ 
                              width: `${Math.min(100, (alert.currentPrice / alert.targetPrice) * 100)}%` 
                            }}
                          ></div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-6 text-muted-foreground">
                    <p>No alerts created yet</p>
                    <Button 
                      variant="link" 
                      onClick={() => router.push("/alerts")}
                      className="mt-2"
                    >
                      Create your first alert
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>
        
        <TabsContent value="products">
          <Card>
            <CardHeader>
              <CardTitle>Your Tracked Products</CardTitle>
              <CardDescription>
                Manage all your tracked products and their price history
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center py-10">
                <Button onClick={() => router.push("/products")}>View All Products</Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="alerts">
          <Card>
            <CardHeader>
              <CardTitle>Your Price Alerts</CardTitle>
              <CardDescription>
                Manage your price alerts and notification settings
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center py-10">
                <Button onClick={() => router.push("/alerts")}>View All Alerts</Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
