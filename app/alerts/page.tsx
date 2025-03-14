/**
 * Alerts Page
 * 
 * This page displays all price alerts set by the user and allows for management
 * of these alerts (create, edit, delete, etc.)
 */

"use client";

// Skip static generation - force dynamic rendering
export const dynamic = 'force-dynamic';

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Skeleton } from "@/components/ui/skeleton";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Bell, BellOff, Edit, Trash2, AlertTriangle, PlusCircle } from "lucide-react";
import Link from "next/link";

// Define Alert type
type Alert = {
  id: string;
  targetPrice: number;
  isTriggered: boolean;
  createdAt: string;
  updatedAt: string;
  productId: string;
  userId: string;
  product: {
    id: string;
    title: string;
    imageUrl?: string | null;
    currentPrice: number;
    currency: string;
    retailer: string;
  };
};

// Define CreateAlertData type
type CreateAlertData = {
  productId: string;
  targetPrice: number;
};

export default function AlertsPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [deletingAlert, setDeletingAlert] = useState<string | null>(null);
  const [newAlertData, setNewAlertData] = useState<CreateAlertData | null>(null);
  const [editingAlert, setEditingAlert] = useState<Alert | null>(null);
  const [targetPrice, setTargetPrice] = useState<string>("");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [activeTab, setActiveTab] = useState("all");

  // Fetch alerts when session is available
  useEffect(() => {
    if (status === "loading") return;
    
    // Let the middleware handle redirects for unauthenticated users
    if (status === "authenticated") {
      fetchAlerts();
    }
  }, [status, session]);

  // Reset form when dialog closes
  useEffect(() => {
    if (!isDialogOpen) {
      setEditingAlert(null);
      setTargetPrice("");
    }
  }, [isDialogOpen]);

  // Set target price when editing alert
  useEffect(() => {
    if (editingAlert) {
      setTargetPrice(editingAlert.targetPrice.toString());
    }
  }, [editingAlert]);

  // Fetch alerts from the API
  const fetchAlerts = async () => {
    setLoading(true);
    setError(null);
    
    try {
      // Add a timestamp to prevent caching issues
      const timestamp = new Date().getTime();
      const response = await fetch(`/api/alerts?userId=${session?.user?.id}&t=${timestamp}`);
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error("API error response:", errorText);
        throw new Error(`Failed to fetch alerts: ${response.status} ${response.statusText}`);
      }
      
      const result = await response.json();
      
      if (result.success) {
        setAlerts(result.data);
      } else {
        throw new Error(result.error?.message || "Failed to fetch alerts");
      }
    } catch (err) {
      console.error("Error fetching alerts:", err);
      setError("Failed to load alerts. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  // Create a new alert
  const createAlert = async () => {
    if (!newAlertData) return;
    
    try {
      const response = await fetch("/api/alerts", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          productId: newAlertData.productId,
          targetPrice: parseFloat(targetPrice),
          userId: session?.user?.id,
        }),
      });
      
      if (!response.ok) {
        throw new Error("Failed to create alert");
      }
      
      const result = await response.json();
      
      if (result.success) {
        // Add the new alert to the local state
        setAlerts([...alerts, result.data]);
        setIsDialogOpen(false);
      } else {
        throw new Error(result.error?.message || "Failed to create alert");
      }
    } catch (err) {
      console.error("Error creating alert:", err);
      setError("Failed to create alert. Please try again.");
    }
  };

  // Update an existing alert
  const updateAlert = async () => {
    if (!editingAlert) return;
    
    try {
      const response = await fetch(`/api/alerts/${editingAlert.id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          targetPrice: parseFloat(targetPrice),
        }),
      });
      
      if (!response.ok) {
        throw new Error("Failed to update alert");
      }
      
      const result = await response.json();
      
      if (result.success) {
        // Update the alert in the local state
        setAlerts(alerts.map(a => 
          a.id === editingAlert.id ? result.data : a
        ));
        setIsDialogOpen(false);
      } else {
        throw new Error(result.error?.message || "Failed to update alert");
      }
    } catch (err) {
      console.error("Error updating alert:", err);
      setError("Failed to update alert. Please try again.");
    }
  };

  // Delete an alert
  const deleteAlert = async (alertId: string) => {
    setDeletingAlert(alertId);
    
    try {
      const response = await fetch(`/api/alerts/${alertId}`, {
        method: "DELETE",
      });
      
      if (!response.ok) {
        throw new Error("Failed to delete alert");
      }
      
      const result = await response.json();
      
      if (result.success) {
        // Remove the alert from the local state
        setAlerts(alerts.filter(a => a.id !== alertId));
      } else {
        throw new Error(result.error?.message || "Failed to delete alert");
      }
    } catch (err) {
      console.error("Error deleting alert:", err);
      setError("Failed to delete alert. Please try again.");
    } finally {
      setDeletingAlert(null);
    }
  };

  // Reset an alert (mark as not triggered)
  const resetAlert = async (alertId: string) => {
    try {
      const response = await fetch(`/api/alerts/${alertId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          isTriggered: false,
        }),
      });
      
      if (!response.ok) {
        throw new Error("Failed to reset alert");
      }
      
      const result = await response.json();
      
      if (result.success) {
        // Update the alert in the local state
        setAlerts(alerts.map(a => 
          a.id === alertId ? result.data : a
        ));
      } else {
        throw new Error(result.error?.message || "Failed to reset alert");
      }
    } catch (err) {
      console.error("Error resetting alert:", err);
      setError("Failed to reset alert. Please try again.");
    }
  };

  // Handle dialog submit
  const handleDialogSubmit = () => {
    if (editingAlert) {
      updateAlert();
    } else {
      createAlert();
    }
  };

  // Filter alerts based on active tab
  const filteredAlerts = alerts.filter(alert => {
    if (activeTab === "active") return !alert.isTriggered;
    if (activeTab === "triggered") return alert.isTriggered;
    return true; // "all" tab
  });

  // Render loading state
  if (loading) {
    return (
      <div className="container mx-auto py-8 px-4">
        <h1 className="text-3xl font-bold mb-6">Price Alerts</h1>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3].map((i) => (
            <Card key={i} className="overflow-hidden">
              <CardHeader className="pb-2">
                <Skeleton className="h-6 w-3/4 mb-2" />
                <Skeleton className="h-4 w-1/2" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-32 w-full mb-4" />
                <Skeleton className="h-6 w-1/3 mb-2" />
                <Skeleton className="h-4 w-1/2" />
              </CardContent>
              <CardFooter className="flex justify-between">
                <Skeleton className="h-10 w-20" />
                <Skeleton className="h-10 w-20" />
              </CardFooter>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8 px-4">
      <div className="flex justify-between items-center mb-6">
        <div className="flex items-center gap-4">
          <Button variant="outline" asChild>
            <Link href="/">
              <span className="mr-2">🏠</span>
              Home
            </Link>
          </Button>
          <h1 className="text-3xl font-bold">Price Alerts</h1>
        </div>
        <Button onClick={() => {
          // Similar approach as the "Create Your First Alert" button
          if (session && session.user) {
            // Fetch products first, then open dialog
            fetch(`/api/products?userId=${session.user.id}`)
              .then(response => response.json())
              .then(result => {
                if (result.success && result.data && result.data.length > 0) {
                  setNewAlertData({
                    productId: result.data[0].id,
                    targetPrice: result.data[0].currentPrice * 0.9 // Default to 10% below current price
                  });
                  setTargetPrice((result.data[0].currentPrice * 0.9).toFixed(2));
                  setIsDialogOpen(true);
                } else {
                  // No products available, redirect to products page to add product first
                  router.push('/products');
                }
              })
              .catch(err => {
                console.error('Error fetching products:', err);
                // Fallback to products page on error
                router.push('/products');
              });
          }
        }}>
          <PlusCircle className="mr-2 h-4 w-4" />
          Create New Alert
        </Button>
      </div>
      
      {error && (
        <Alert variant="destructive" className="mb-6">
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}
      
      <Tabs defaultValue="all" className="mb-6" onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="all">All Alerts ({alerts.length})</TabsTrigger>
          <TabsTrigger value="active">Active ({alerts.filter(a => !a.isTriggered).length})</TabsTrigger>
          <TabsTrigger value="triggered">Triggered ({alerts.filter(a => a.isTriggered).length})</TabsTrigger>
        </TabsList>
      </Tabs>
      
      {filteredAlerts.length === 0 ? (
        <Card className="text-center p-8">
          <CardTitle className="mb-2">No Alerts Found</CardTitle>
          <CardDescription className="mb-6">
            {activeTab === "all" 
              ? "You haven't created any price alerts yet."
              : activeTab === "active"
                ? "You don't have any active price alerts."
                : "You don't have any triggered price alerts."}
          </CardDescription>
          {activeTab === "all" && (
            <Button onClick={() => {
              // Check if products are available
              if (session && session.user) {
                // Fetch products first, then open dialog or redirect only if no products
                console.log("Fetching products for alert creation");
                fetch(`/api/products?userId=${session.user.id}`)
                  .then(response => response.json())
                  .then(result => {
                    console.log("Products fetch result:", result);
                    if (result.success && result.data && result.data.length > 0) {
                      // Products found, open dialog
                      const productToUse = result.data[0];
                      console.log("Opening dialog for product:", productToUse.title);
                      setNewAlertData({
                        productId: productToUse.id,
                        targetPrice: productToUse.currentPrice * 0.9 // Default to 10% below current price
                      });
                      setTargetPrice((productToUse.currentPrice * 0.9).toFixed(2));
                      setIsDialogOpen(true);
                    } else {
                      // No products available, redirect to products page to add product first
                      console.log("No products found, redirecting to products page");
                      router.push('/products');
                    }
                  })
                  .catch(err => {
                    console.error('Error fetching products:', err);
                    // Fallback to products page on error
                    router.push('/products');
                  });
              }
            }}>
              <PlusCircle className="mr-2 h-4 w-4" />
              Create Your First Alert
            </Button>
          )}
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredAlerts.map((alert) => (
            <Card key={alert.id} className={`overflow-hidden ${alert.isTriggered ? 'border-green-500' : ''}`}>
              <CardHeader className="pb-2">
                <div className="flex justify-between items-start">
                  <CardTitle className="line-clamp-2">{alert.product.title}</CardTitle>
                  {alert.isTriggered && (
                    <Badge className="bg-green-500">Triggered</Badge>
                  )}
                </div>
                <CardDescription>{alert.product.retailer}</CardDescription>
              </CardHeader>
              <CardContent>
                {alert.product.imageUrl && (
                  <div className="relative h-40 mb-4">
                    <img
                      src={alert.product.imageUrl}
                      alt={alert.product.title}
                      className="absolute inset-0 w-full h-full object-contain"
                    />
                  </div>
                )}
                <div className="flex flex-col space-y-2 mb-2">
                  <div className="flex justify-between">
                    <span className="text-sm font-medium">Current Price:</span>
                    <span className="font-bold">
                      {new Intl.NumberFormat('en-US', {
                        style: 'currency',
                        currency: alert.product.currency,
                      }).format(alert.product.currentPrice)}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm font-medium">Target Price:</span>
                    <span className="font-bold text-amber-600">
                      {new Intl.NumberFormat('en-US', {
                        style: 'currency',
                        currency: alert.product.currency,
                      }).format(alert.targetPrice)}
                    </span>
                  </div>
                </div>
                <p className="text-sm text-gray-500">
                  Created: {new Date(alert.createdAt).toLocaleDateString()}
                </p>
              </CardContent>
              <CardFooter className="flex justify-between">
                <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                  <DialogTrigger asChild>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setEditingAlert(alert)}
                    >
                      <Edit className="mr-2 h-4 w-4" />
                      Edit
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>
                        {editingAlert ? "Edit Price Alert" : "Create Price Alert"}
                      </DialogTitle>
                      <DialogDescription>
                        Set the target price for this product. You'll be notified when the price drops below this amount.
                      </DialogDescription>
                    </DialogHeader>
                    <div className="grid gap-4 py-4">
                      <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="targetPrice" className="text-right">
                          Target Price
                        </Label>
                        <div className="col-span-3">
                          <Input
                            id="targetPrice"
                            type="number"
                            step="0.01"
                            min="0"
                            value={targetPrice}
                            onChange={(e) => setTargetPrice(e.target.value)}
                            placeholder="Enter target price"
                            className="w-full"
                          />
                        </div>
                      </div>
                    </div>
                    <DialogFooter>
                      <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
                        Cancel
                      </Button>
                      <Button onClick={handleDialogSubmit}>
                        {editingAlert ? "Update Alert" : "Create Alert"}
                      </Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
                
                <div className="flex space-x-2">
                  {alert.isTriggered && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => resetAlert(alert.id)}
                      className="text-green-600 hover:text-green-800"
                    >
                      <Bell className="mr-2 h-4 w-4" />
                      Reset
                    </Button>
                  )}
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => deleteAlert(alert.id)}
                    disabled={deletingAlert === alert.id}
                    className="text-red-500 hover:text-red-700"
                  >
                    {deletingAlert === alert.id ? (
                      <span>Deleting...</span>
                    ) : (
                      <>
                        <Trash2 className="mr-2 h-4 w-4" />
                        Delete
                      </>
                    )}
                  </Button>
                </div>
              </CardFooter>
            </Card>
          ))}
        </div>
      )}
      
      {/* Dialog for creating a new alert */}
      <Dialog open={isDialogOpen && !editingAlert} onOpenChange={setIsDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create Price Alert</DialogTitle>
            <DialogDescription>
              Set the target price for this product. You'll be notified when the price drops below this amount.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="targetPrice" className="text-right">
                Target Price
              </Label>
              <div className="col-span-3">
                <Input
                  id="targetPrice"
                  type="number"
                  step="0.01"
                  min="0"
                  value={targetPrice}
                  onChange={(e) => setTargetPrice(e.target.value)}
                  placeholder="Enter target price"
                  className="w-full"
                />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={createAlert}>
              Create Alert
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
