"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { AlertCircle, Bell, BellOff, CheckCircle, Edit, Trash2 } from "lucide-react";
import { Switch } from "@/components/ui/switch";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

// Interface for search parameters
interface SearchParams {
  [key: string]: string | string[] | undefined;
}

// Simulated alert interface
interface PriceAlert {
  id: string;
  productId: string;
  productName: string;
  currentPrice: number;
  targetPrice: number;
  isActive: boolean;
  createdAt: string;
  lastTriggered?: string;
  store: string;
  imageUrl: string;
}

// Client component for alerts page
export default function AlertsClient({ 
  initialSearchParams 
}: { 
  initialSearchParams: SearchParams
}) {
  const router = useRouter();
  const searchParams = useSearchParams();
  
  // State for alerts data
  const [loading, setLoading] = useState(true);
  const [alerts, setAlerts] = useState<PriceAlert[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState("all");
  const [sortBy, setSortBy] = useState("newest");

  // Load alerts on component mount
  useEffect(() => {
    const fetchAlerts = async () => {
      setLoading(true);
      try {
        // In a real app, this would be a fetch to your API
        // const response = await fetch('/api/alerts');
        // const data = await response.json();
        
        // For demo, using mock data
        const mockAlerts: PriceAlert[] = [
          {
            id: "1",
            productId: "p123",
            productName: "Sony WH-1000XM4 Wireless Noise Cancelling Headphones",
            currentPrice: 299.99,
            targetPrice: 249.99,
            isActive: true,
            createdAt: "2025-03-01T10:30:00Z",
            store: "Amazon",
            imageUrl: "/images/placeholder-product.jpg",
          },
          {
            id: "2",
            productId: "p456",
            productName: "Samsung 55-Inch 4K UHD Smart TV",
            currentPrice: 499.99,
            targetPrice: 449.99,
            isActive: true,
            createdAt: "2025-03-05T14:20:00Z",
            lastTriggered: "2025-03-10T09:15:00Z",
            store: "Best Buy",
            imageUrl: "/images/placeholder-product.jpg",
          },
          {
            id: "3",
            productId: "p789",
            productName: "Dyson V11 Torque Drive Cordless Vacuum Cleaner",
            currentPrice: 599.99,
            targetPrice: 549.99,
            isActive: false,
            createdAt: "2025-02-20T16:45:00Z",
            store: "Walmart",
            imageUrl: "/images/placeholder-product.jpg",
          }
        ];
        
        setTimeout(() => {
          setAlerts(mockAlerts);
          setLoading(false);
        }, 800); // Simulate network delay
      } catch (err) {
        setError("Failed to load alerts. Please try again later.");
        setLoading(false);
      }
    };

    fetchAlerts();
  }, []);

  // Filter alerts based on the selected filter
  const filteredAlerts = alerts.filter(alert => {
    if (filter === "active") return alert.isActive;
    if (filter === "inactive") return !alert.isActive;
    // If reached price, would check if currentPrice <= targetPrice
    return true; // 'all' filter
  });

  // Sort alerts based on the selected sort option
  const sortedAlerts = [...filteredAlerts].sort((a, b) => {
    if (sortBy === "newest") {
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    }
    if (sortBy === "oldest") {
      return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
    }
    if (sortBy === "priceHighToLow") {
      return b.currentPrice - a.currentPrice;
    }
    if (sortBy === "priceLowToHigh") {
      return a.currentPrice - b.currentPrice;
    }
    return 0;
  });

  // Toggle alert activation status
  const toggleAlertStatus = (id: string) => {
    setAlerts(alerts.map(alert => 
      alert.id === id ? { ...alert, isActive: !alert.isActive } : alert
    ));
  };

  // Delete an alert
  const deleteAlert = (id: string) => {
    setAlerts(alerts.filter(alert => alert.id !== id));
  };

  // Edit alert (in a real app, this would open a modal or navigate to an edit page)
  const editAlert = (id: string) => {
    // Example implementation - navigate to edit page
    router.push(`/alerts/edit/${id}`);
  };

  const renderAlertCard = (alert: PriceAlert) => (
    <Card key={alert.id} className="mb-4">
      <CardContent className="p-6">
        <div className="flex flex-col md:flex-row gap-4">
          {/* Product image placeholder */}
          <div className="w-full md:w-1/4 flex-shrink-0 flex items-center justify-center bg-gray-100 rounded-md h-32">
            <span className="text-sm text-gray-500">Product Image</span>
          </div>
          
          <div className="flex-grow">
            <div className="flex justify-between items-start">
              <div>
                <h3 className="text-lg font-medium">{alert.productName}</h3>
                <p className="text-sm text-muted-foreground">
                  <span className="font-medium">Store:</span> {alert.store}
                </p>
              </div>
              
              <div className="flex gap-2">
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="h-8 w-8 p-0" 
                  onClick={() => editAlert(alert.id)}
                >
                  <Edit className="h-4 w-4" />
                  <span className="sr-only">Edit</span>
                </Button>
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="h-8 w-8 p-0" 
                  onClick={() => deleteAlert(alert.id)}
                >
                  <Trash2 className="h-4 w-4" />
                  <span className="sr-only">Delete</span>
                </Button>
              </div>
            </div>
            
            <div className="grid grid-cols-2 gap-4 mt-4">
              <div>
                <p className="text-sm font-medium">Current Price</p>
                <p className="text-lg font-bold">${alert.currentPrice.toFixed(2)}</p>
              </div>
              <div>
                <p className="text-sm font-medium">Target Price</p>
                <p className="text-lg font-bold">${alert.targetPrice.toFixed(2)}</p>
                <p className="text-xs text-muted-foreground">
                  {(((alert.currentPrice - alert.targetPrice) / alert.currentPrice) * 100).toFixed(2)}% drop needed
                </p>
              </div>
            </div>
            
            <div className="flex justify-between items-center mt-4">
              <div className="flex items-center gap-2">
                <Switch 
                  checked={alert.isActive} 
                  onCheckedChange={() => toggleAlertStatus(alert.id)} 
                  id={`active-${alert.id}`}
                />
                <Label htmlFor={`active-${alert.id}`}>
                  {alert.isActive ? 'Active' : 'Inactive'}
                </Label>
              </div>
              
              <Badge variant={alert.isActive ? "default" : "outline"}>
                {alert.isActive ? (
                  <span className="flex items-center gap-1">
                    <Bell className="h-3 w-3" /> Monitoring
                  </span>
                ) : (
                  <span className="flex items-center gap-1">
                    <BellOff className="h-3 w-3" /> Paused
                  </span>
                )}
              </Badge>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );

  return (
    <div className="container mx-auto py-8 px-4">
      <div className="flex flex-col space-y-6">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <h1 className="text-3xl font-bold tracking-tight">Price Alerts</h1>
          
          <div className="flex flex-col sm:flex-row gap-2 w-full md:w-auto">
            <div className="w-full sm:w-auto">
              <Select value={filter} onValueChange={setFilter}>
                <SelectTrigger className="w-full sm:w-[160px]">
                  <SelectValue placeholder="Filter alerts" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Alerts</SelectItem>
                  <SelectItem value="active">Active Only</SelectItem>
                  <SelectItem value="inactive">Inactive Only</SelectItem>
                  <SelectItem value="reached">Price Reached</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div className="w-full sm:w-auto">
              <Select value={sortBy} onValueChange={setSortBy}>
                <SelectTrigger className="w-full sm:w-[180px]">
                  <SelectValue placeholder="Sort by" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="newest">Newest First</SelectItem>
                  <SelectItem value="oldest">Oldest First</SelectItem>
                  <SelectItem value="priceHighToLow">Price: High to Low</SelectItem>
                  <SelectItem value="priceLowToHigh">Price: Low to High</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>
        
        {error && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Error</AlertTitle>
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}
        
        {loading ? (
          <div className="py-20 text-center">
            <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
            <p className="mt-4 text-muted-foreground">Loading your price alerts...</p>
          </div>
        ) : sortedAlerts.length > 0 ? (
          <div>
            {sortedAlerts.map(renderAlertCard)}
          </div>
        ) : (
          <Card className="py-10">
            <CardContent className="text-center">
              <div className="mb-4 flex justify-center">
                <Bell className="h-12 w-12 text-muted-foreground" />
              </div>
              <CardTitle className="text-xl mb-2">No Alerts Found</CardTitle>
              <CardDescription>
                You don't have any price alerts yet. Start tracking product prices by adding an alert.
              </CardDescription>
              <Button className="mt-6" onClick={() => router.push("/products")}>
                Browse Products
              </Button>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
