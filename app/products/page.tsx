/**
 * Products Page
 * 
 * This page displays all products tracked by the user and allows for management
 * of these products (delete, refresh prices, etc.)
 */

"use client";

// Skip static generation - force dynamic rendering
export const dynamic = 'force-dynamic';

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Skeleton } from "@/components/ui/skeleton";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RefreshCw, Trash2, AlertTriangle, PlusCircle, Bell } from "lucide-react";
import Link from "next/link";

// Define Product type
type Product = {
  id: string;
  title: string;
  description?: string | null;
  imageUrl?: string | null;
  url: string;
  retailer: string;
  productId: string;
  currentPrice: number;
  currency: string;
  createdAt: string;
  updatedAt: string;
};

export default function ProductsPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshingProduct, setRefreshingProduct] = useState<string | null>(null);
  const [deletingProduct, setDeletingProduct] = useState<string | null>(null);
  const [isAlertDialogOpen, setIsAlertDialogOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [targetPrice, setTargetPrice] = useState("");
  const [creatingAlert, setCreatingAlert] = useState(false);

  // Fetch products when session is available
  useEffect(() => {
    if (status === "loading") return;
    
    // Let the middleware handle redirects for unauthenticated users
    if (status === "authenticated") {
      fetchProducts();
    }
  }, [status, session]);

  // Fetch products from the API
  const fetchProducts = async () => {
    setLoading(true);
    setError(null);
    
    try {
      // Add a timestamp to prevent caching issues
      const timestamp = new Date().getTime();
      const response = await fetch(`/api/products?userId=${session?.user?.id}&t=${timestamp}`);
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error("API error response:", errorText);
        throw new Error(`Failed to fetch products: ${response.status} ${response.statusText}`);
      }
      
      const result = await response.json();
      
      if (result.success) {
        // Fix: Access the products array correctly from the nested structure
        setProducts(result.data.products || []);
      } else {
        throw new Error(result.error?.message || "Failed to fetch products");
      }
    } catch (err) {
      console.error("Error fetching products:", err);
      setError("Failed to load products. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  // Refresh a product's price
  const refreshProduct = async (productId: string) => {
    setRefreshingProduct(productId);
    
    try {
      const response = await fetch(`/api/products/${productId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          action: "refresh",
        }),
      });
      
      if (!response.ok) {
        throw new Error("Failed to refresh product");
      }
      
      const result = await response.json();
      
      if (result.success) {
        // Update the product in the local state
        setProducts(products.map(p => 
          p.id === productId ? result.data : p
        ));
      } else {
        throw new Error(result.error?.message || "Failed to refresh product");
      }
    } catch (err) {
      console.error("Error refreshing product:", err);
      setError("Failed to refresh product. Please try again.");
    } finally {
      setRefreshingProduct(null);
    }
  };

  // Delete a product
  const deleteProduct = async (productId: string) => {
    setDeletingProduct(productId);
    
    try {
      const response = await fetch(`/api/products/${productId}`, {
        method: "DELETE",
      });
      
      if (!response.ok) {
        throw new Error("Failed to delete product");
      }
      
      const result = await response.json();
      
      if (result.success) {
        // Remove the product from the local state
        setProducts(products.filter(p => p.id !== productId));
      } else {
        throw new Error(result.error?.message || "Failed to delete product");
      }
    } catch (err) {
      console.error("Error deleting product:", err);
      setError("Failed to delete product. Please try again.");
    } finally {
      setDeletingProduct(null);
    }
  };

  // Open the alert dialog for a product
  const openAlertDialog = (product: Product) => {
    setSelectedProduct(product);
    // Default target price to 10% lower than current price
    setTargetPrice((product.currentPrice * 0.9).toFixed(2));
    setIsAlertDialogOpen(true);
  };

  // Create a price alert
  const createAlert = async () => {
    if (!selectedProduct || !targetPrice) return;
    
    setCreatingAlert(true);
    
    try {
      const response = await fetch("/api/alerts", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          productId: selectedProduct.id,
          targetPrice: parseFloat(targetPrice),
          userId: session?.user?.id,
        }),
      });
      
      if (!response.ok) {
        throw new Error("Failed to create alert");
      }
      
      const result = await response.json();
      
      if (result.success) {
        // Close the dialog and show success message
        setIsAlertDialogOpen(false);
        setError(null);
        // You could add a success toast here
      } else {
        throw new Error(result.error?.message || "Failed to create alert");
      }
    } catch (err) {
      console.error("Error creating alert:", err);
      setError("Failed to create alert. Please try again.");
    } finally {
      setCreatingAlert(false);
    }
  };

  // Render loading state
  if (loading) {
    return (
      <div className="container mx-auto py-8 px-4">
        <h1 className="text-3xl font-bold mb-6">Your Products</h1>
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
          <h1 className="text-3xl font-bold">Your Products</h1>
        </div>
        <Button asChild>
          <Link href="/scraper-test">
            <PlusCircle className="mr-2 h-4 w-4" />
            Add New Product
          </Link>
        </Button>
      </div>
      
      {error && (
        <Alert variant="destructive" className="mb-6">
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}
      
      {products.length === 0 ? (
        <Card className="text-center p-8">
          <CardTitle className="mb-2">No Products Found</CardTitle>
          <CardDescription className="mb-6">
            You haven't added any products to track yet.
          </CardDescription>
          <Button asChild>
            <Link href="/scraper-test">
              <PlusCircle className="mr-2 h-4 w-4" />
              Add Your First Product
            </Link>
          </Button>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {products.map((product) => (
            <Card key={product.id} className="overflow-hidden">
              <CardHeader className="pb-2">
                <CardTitle className="line-clamp-2">{product.title}</CardTitle>
                <CardDescription>{product.retailer}</CardDescription>
              </CardHeader>
              <CardContent>
                {product.imageUrl && (
                  <div className="relative h-40 mb-4">
                    <img
                      src={product.imageUrl}
                      alt={product.title}
                      className="absolute inset-0 w-full h-full object-contain"
                    />
                  </div>
                )}
                <div className="flex items-baseline space-x-2 mb-2">
                  <span className="text-2xl font-bold">
                    {new Intl.NumberFormat('en-US', {
                      style: 'currency',
                      currency: product.currency,
                    }).format(product.currentPrice)}
                  </span>
                </div>
                <p className="text-sm text-gray-500">
                  Last updated: {new Date(product.updatedAt).toLocaleString()}
                </p>
              </CardContent>
              <CardFooter className="flex justify-between">
                <div className="flex space-x-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => refreshProduct(product.id)}
                    disabled={refreshingProduct === product.id}
                  >
                    {refreshingProduct === product.id ? (
                      <RefreshCw className="h-4 w-4 animate-spin" />
                    ) : (
                      <>
                        <RefreshCw className="mr-2 h-4 w-4" />
                        Refresh
                      </>
                    )}
                  </Button>
                  
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => openAlertDialog(product)}
                    className="text-amber-600 hover:text-amber-800"
                  >
                    <Bell className="mr-2 h-4 w-4" />
                    Alert
                  </Button>
                </div>
                
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => deleteProduct(product.id)}
                  disabled={deletingProduct === product.id}
                  className="text-red-500 hover:text-red-700"
                >
                  {deletingProduct === product.id ? (
                    <span>Deleting...</span>
                  ) : (
                    <>
                      <Trash2 className="mr-2 h-4 w-4" />
                      Delete
                    </>
                  )}
                </Button>
              </CardFooter>
            </Card>
          ))}
        </div>
      )}

      {/* Alert Dialog */}
      <Dialog open={isAlertDialogOpen} onOpenChange={setIsAlertDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create Price Alert</DialogTitle>
            <DialogDescription>
              Set a target price for this product. You'll be notified when the price drops below this amount.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            {selectedProduct && (
              <>
                <div className="flex items-center gap-4">
                  {selectedProduct.imageUrl && (
                    <img
                      src={selectedProduct.imageUrl}
                      alt={selectedProduct.title}
                      className="h-16 w-16 object-contain"
                    />
                  )}
                  <div>
                    <h3 className="font-semibold">{selectedProduct.title}</h3>
                    <p className="text-sm text-muted-foreground">
                      Current price:{' '}
                      {new Intl.NumberFormat('en-US', {
                        style: 'currency',
                        currency: selectedProduct.currency,
                      }).format(selectedProduct.currentPrice)}
                    </p>
                  </div>
                </div>
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
              </>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsAlertDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={createAlert} disabled={creatingAlert}>
              {creatingAlert ? 'Creating...' : 'Create Alert'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
