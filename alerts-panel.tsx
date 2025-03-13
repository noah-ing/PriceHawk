"use client"

import { useState, useEffect } from "react"
import { Bell, Check, Clock, Trash } from "lucide-react"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Alert as AlertComponent, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { useFetchWithCsrf } from "@/components/CsrfToken"

import { useSession } from "next-auth/react";

// Alert type definition
interface Alert {
  id: string;
  targetPrice: number;
  isTriggered: boolean;
  createdAt: string;
  updatedAt: string;
  productId: string;
  userId: string;
  product?: {
    id: string;
    title: string;
    currentPrice: number;
    retailer: string;
  };
}

// Product type definition
interface Product {
  id: string;
  title: string;
  currentPrice: number;
  retailer: string;
}

export function AlertsPanel() {
  const { data: session } = useSession();
  const userId = session?.user?.id || "";
  const { fetchWithCsrf } = useFetchWithCsrf();
  
  const [alerts, setAlerts] = useState<Alert[]>([])
  const [products, setProducts] = useState<Product[]>([])
  const [activeTab, setActiveTab] = useState("active")
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [createAlertData, setCreateAlertData] = useState({
    productId: "",
    targetPrice: "",
  })
  const [createError, setCreateError] = useState<string | null>(null)
  const [createSuccess, setCreateSuccess] = useState<boolean>(false)

  // Fetch alerts from the API
  const fetchAlerts = async () => {
    if (!userId) return;
    
    setIsLoading(true);
    setError(null);
    
    try {
      const response = await fetch(`/api/alerts?userId=${userId}`);
      const result = await response.json();
      
      if (!response.ok || !result.success) {
        throw new Error(result.error?.message || 'Failed to fetch alerts');
      }
      
      setAlerts(result.data);
    } catch (err) {
      console.error('Error fetching alerts:', err);
      setError('Failed to load alerts. Please try again later.');
    } finally {
      setIsLoading(false);
    }
  };

  // Fetch products from the API
  const fetchProducts = async () => {
    if (!userId) return;
    
    try {
      const response = await fetch(`/api/products?userId=${userId}`);
      const result = await response.json();
      
      if (!response.ok || !result.success) {
        throw new Error(result.error?.message || 'Failed to fetch products');
      }
      
      // Fix: The API returns a nested structure with 'products' inside 'data'
      if (result.data && Array.isArray(result.data.products)) {
        setProducts(result.data.products);
      } else if (Array.isArray(result.data)) {
        setProducts(result.data);
      } else {
        console.error('Unexpected products data structure:', result.data);
        setProducts([]);
      }
    } catch (err) {
      console.error('Error fetching products:', err);
      setProducts([]);
    }
  };

  // Toggle alert active state
  const toggleAlert = async (id: string, isTriggered: boolean) => {
    if (!userId) return;
    
    try {
      // Use fetchWithCsrf to automatically include the CSRF token
      const response = await fetchWithCsrf(`/api/alerts/${id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId: userId,
          isTriggered: !isTriggered,
        }),
      });
      
      const result = await response.json();
      
      if (!response.ok || !result.success) {
        throw new Error(result.error?.message || 'Failed to update alert');
      }
      
      // Update the alerts list
      setAlerts(alerts.map((alert) => 
        alert.id === id ? { ...alert, isTriggered: !isTriggered } : alert
      ));
    } catch (err) {
      console.error('Error updating alert:', err);
      setError('Failed to update alert. Please try again later.');
    }
  };

  // Delete an alert
  const deleteAlert = async (id: string) => {
    if (!userId) return;
    
    try {
      // Use fetchWithCsrf to automatically include the CSRF token
      const response = await fetchWithCsrf(`/api/alerts/${id}?userId=${userId}`, {
        method: 'DELETE',
      });
      
      const result = await response.json();
      
      if (!response.ok || !result.success) {
        throw new Error(result.error?.message || 'Failed to delete alert');
      }
      
      // Remove the alert from the list
      setAlerts(alerts.filter((alert) => alert.id !== id));
    } catch (err) {
      console.error('Error deleting alert:', err);
      setError('Failed to delete alert. Please try again later.');
    }
  };

  // Create a new alert
  const createAlert = async () => {
    if (!userId) return;
    
    setCreateError(null);
    setCreateSuccess(false);
    
    if (!createAlertData.productId) {
      setCreateError('Please select a product');
      return;
    }
    
    if (!createAlertData.targetPrice || parseFloat(createAlertData.targetPrice) <= 0) {
      setCreateError('Please enter a valid target price');
      return;
    }
    
    try {
      // Use fetchWithCsrf to automatically include the CSRF token
      const response = await fetchWithCsrf('/api/alerts', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          productId: createAlertData.productId,
          userId: userId,
          targetPrice: parseFloat(createAlertData.targetPrice),
        }),
      });
      
      const result = await response.json();
      
      if (!response.ok || !result.success) {
        throw new Error(result.error?.message || 'Failed to create alert');
      }
      
      // Reset the form
      setCreateAlertData({
        productId: "",
        targetPrice: "",
      });
      
      // Show success message
      setCreateSuccess(true);
      
      // Refresh the alerts list
      fetchAlerts();
      
      // Switch to the active tab
      setActiveTab("active");
    } catch (err) {
      console.error('Error creating alert:', err);
      setCreateError('Failed to create alert. Please try again later.');
    }
  };

  // Format price for display
  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(price);
  };

  // Format date for display
  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
  };

  // Fetch alerts and products when userId changes
  useEffect(() => {
    if (userId) {
      fetchAlerts();
      fetchProducts();
    }
  }, [userId]);

  // Get active alerts
  const activeAlerts = alerts.filter((alert) => !alert.isTriggered);

  // Get triggered alerts
  const triggeredAlerts = alerts.filter((alert) => alert.isTriggered);

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Price Alerts</CardTitle>
          <CardDescription>Get notified when prices drop below your target</CardDescription>
        </CardHeader>
        <CardContent>
          {error && (
            <AlertComponent variant="destructive" className="mb-4">
              <AlertTitle>Error</AlertTitle>
              <AlertDescription>{error}</AlertDescription>
            </AlertComponent>
          )}
          
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="mb-4">
              <TabsTrigger value="active">Active Alerts</TabsTrigger>
              <TabsTrigger value="triggered">Triggered</TabsTrigger>
              <TabsTrigger value="create">Create Alert</TabsTrigger>
            </TabsList>

            <TabsContent value="active">
              <div className="space-y-4">
                {isLoading ? (
                  <div className="flex justify-center p-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                  </div>
                ) : activeAlerts.length > 0 ? (
                  activeAlerts.map((alert) => (
                    <div key={alert.id} className="flex items-center justify-between rounded-lg border p-4">
                      <div className="flex-1">
                        <h3 className="font-medium">{alert.product?.title || 'Unknown Product'}</h3>
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <span>Target: {formatPrice(alert.targetPrice)}</span>
                          <span>•</span>
                          <span>Current: {formatPrice(alert.product?.currentPrice || 0)}</span>
                          <span>•</span>
                          <span>{alert.product?.retailer || 'Unknown Retailer'}</span>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="flex items-center">
                          <Switch 
                            checked={!alert.isTriggered} 
                            onCheckedChange={() => toggleAlert(alert.id, alert.isTriggered)} 
                          />
                        </div>
                        <Button variant="ghost" size="icon" onClick={() => deleteAlert(alert.id)}>
                          <Trash className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="flex flex-col items-center justify-center rounded-lg border border-dashed p-8 text-center">
                    <Bell className="mb-2 h-10 w-10 text-muted-foreground" />
                    <h3 className="mb-1 text-lg font-medium">No active alerts</h3>
                    <p className="text-sm text-muted-foreground">Create an alert to get notified when prices drop</p>
                  </div>
                )}
              </div>
            </TabsContent>

            <TabsContent value="triggered">
              <div className="space-y-4">
                {isLoading ? (
                  <div className="flex justify-center p-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                  </div>
                ) : triggeredAlerts.length > 0 ? (
                  triggeredAlerts.map((alert) => (
                    <div key={alert.id} className="flex items-center justify-between rounded-lg border p-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <h3 className="font-medium">{alert.product?.title || 'Unknown Product'}</h3>
                          <Badge className="bg-green-600 hover:bg-green-700">Triggered</Badge>
                        </div>
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <span>Target: {formatPrice(alert.targetPrice)}</span>
                          <span>•</span>
                          <span className="text-green-600 font-medium">Current: {formatPrice(alert.product?.currentPrice || 0)}</span>
                          <span>•</span>
                          <span>{alert.product?.retailer || 'Unknown Retailer'}</span>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Button variant="outline" size="sm" onClick={() => toggleAlert(alert.id, alert.isTriggered)}>
                          <Check className="mr-1 h-3 w-3" />
                          Reset Alert
                        </Button>
                        <Button variant="ghost" size="icon" onClick={() => deleteAlert(alert.id)}>
                          <Trash className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="flex flex-col items-center justify-center rounded-lg border border-dashed p-8 text-center">
                    <Clock className="mb-2 h-10 w-10 text-muted-foreground" />
                    <h3 className="mb-1 text-lg font-medium">No triggered alerts</h3>
                    <p className="text-sm text-muted-foreground">Your price alerts will appear here when triggered</p>
                  </div>
                )}
              </div>
            </TabsContent>

            <TabsContent value="create">
              <div className="space-y-4">
                {createError && (
                  <AlertComponent variant="destructive">
                    <AlertDescription>{createError}</AlertDescription>
                  </AlertComponent>
                )}
                
                {createSuccess && (
                  <AlertComponent variant="default" className="bg-green-50 text-green-800 border-green-200">
                    <AlertDescription>Alert created successfully!</AlertDescription>
                  </AlertComponent>
                )}
                
                <div className="space-y-2">
                  <Label htmlFor="product">Product</Label>
                  <Select 
                    value={createAlertData.productId} 
                    onValueChange={(value) => setCreateAlertData({ ...createAlertData, productId: value })}
                  >
                    <SelectTrigger id="product">
                      <SelectValue placeholder="Select product" />
                    </SelectTrigger>
                    <SelectContent>
                      {products.map((product) => (
                        <SelectItem key={product.id} value={product.id}>
                          {product.title} ({formatPrice(product.currentPrice)})
                        </SelectItem>
                      ))}
                      {products.length === 0 && (
                        <SelectItem value="none" disabled>
                          No products available
                        </SelectItem>
                      )}
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="target-price">Target Price</Label>
                  <div className="flex items-center">
                    <span className="mr-2 text-muted-foreground">$</span>
                    <Input 
                      id="target-price" 
                      type="number" 
                      placeholder="0.00" 
                      value={createAlertData.targetPrice}
                      onChange={(e) => setCreateAlertData({ ...createAlertData, targetPrice: e.target.value })}
                      step="0.01"
                      min="0.01"
                    />
                  </div>
                </div>
                
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="notify-email">Email Notification</Label>
                    <Switch id="notify-email" defaultChecked />
                  </div>
                  <div className="flex items-center justify-between">
                    <Label htmlFor="notify-push">Push Notification</Label>
                    <Switch id="notify-push" defaultChecked />
                  </div>
                </div>
                
                <Button className="w-full" onClick={createAlert}>
                  Create Alert
                </Button>
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  )
}
