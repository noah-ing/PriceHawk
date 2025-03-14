"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useSession } from "next-auth/react";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { 
  AlertCircle, User, Bell, CreditCard, ShieldCheck, LogOut, 
  Mail, Phone, Home, Settings, Lock, Eye, EyeOff, Save, Loader2,
  CheckCircle, ShoppingCart
} from "lucide-react";

// Interface for search parameters
interface SearchParams {
  [key: string]: string | string[] | undefined;
}

// Profile client component
export default function ProfileClient({ 
  initialSearchParams 
}: { 
  initialSearchParams: SearchParams
}) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { data: session, status } = useSession();
  
  const [activeTab, setActiveTab] = useState("account");
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  
  // Form states
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [address, setAddress] = useState("");
  const [password, setPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  
  // Notification preferences
  const [emailNotifications, setEmailNotifications] = useState(true);
  const [priceDropNotifications, setPriceDropNotifications] = useState(true);
  const [backInStockNotifications, setBackInStockNotifications] = useState(true);
  const [weeklyDigestNotifications, setWeeklyDigestNotifications] = useState(false);
  const [marketingNotifications, setMarketingNotifications] = useState(false);
  
  // Track products
  const [trackedProducts, setTrackedProducts] = useState([
    {
      id: "prod_1",
      name: "Sony WH-1000XM4 Wireless Headphones",
      store: "Amazon",
      currentPrice: 278.99,
      originalPrice: 349.99,
      imageUrl: "https://m.media-amazon.com/images/I/71o8Q5XJS5L._AC_SL1500_.jpg",
      lastUpdated: new Date().toISOString(),
      notify: true,
    },
    {
      id: "prod_2",
      name: "Apple AirPods Pro (2nd Generation)",
      store: "Best Buy",
      currentPrice: 189.99,
      originalPrice: 249.99,
      imageUrl: "https://pisces.bbystatic.com/image2/BestBuy_US/images/products/4900/4900964_sd.jpg",
      lastUpdated: new Date().toISOString(),
      notify: true,
    },
    {
      id: "prod_3",
      name: "PlayStation 5 Console",
      store: "Walmart",
      currentPrice: 499.99,
      originalPrice: 499.99,
      imageUrl: "https://i5.walmartimages.com/seo/PlayStation-5-Console-Marvel-s-Spider-Man-2-Bundle_3000617250.jpg",
      lastUpdated: new Date().toISOString(),
      notify: true,
    },
  ]);
  
  // Recent price alerts
  const [priceAlerts, setPriceAlerts] = useState([
    {
      id: "alert_1",
      productName: "Sony WH-1000XM4 Wireless Headphones",
      store: "Amazon",
      oldPrice: 349.99,
      newPrice: 278.99,
      percentChange: 20,
      timestamp: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(), // 2 days ago
    },
    {
      id: "alert_2",
      productName: "Apple AirPods Pro (2nd Generation)",
      store: "Best Buy",
      oldPrice: 249.99,
      newPrice: 189.99,
      percentChange: 24,
      timestamp: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(), // 5 days ago
    },
  ]);
  
  // Load user data when session is available
  useEffect(() => {
    if (status === "authenticated" && session?.user) {
      setIsLoading(true);
      
      // In a real app, we would fetch user data from an API
      // For demo, use session data and simulate API call with timeout
      setTimeout(() => {
        if (session.user) {
          setName(session.user.name || "");
          setEmail(session.user.email || "");
          // Mock additional data
          setPhone("555-123-4567");
          setAddress("123 Main St, Anytown, USA");
        }
        setIsLoading(false);
      }, 500);
    } else if (status === "unauthenticated") {
      // Redirect to sign in if not authenticated
      router.push("/auth/signin?callbackUrl=/profile");
    }
  }, [status, session, router]);
  
  // Handle account info save
  const handleSaveAccountInfo = async (e: React.FormEvent) => {
    e.preventDefault();
    
    setIsSaving(true);
    setError(null);
    setSuccessMessage(null);
    
    try {
      // In a real app, we would save data to an API
      // For demo, simulate API call with timeout
      await new Promise(resolve => setTimeout(resolve, 800));
      
      setSuccessMessage("Account information updated successfully");
      setIsSaving(false);
    } catch (err) {
      console.error("Error saving account info:", err);
      setError("Failed to save account information. Please try again.");
      setIsSaving(false);
    }
  };
  
  // Handle password change
  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (newPassword !== confirmPassword) {
      setError("New passwords do not match");
      return;
    }
    
    setIsSaving(true);
    setError(null);
    setSuccessMessage(null);
    
    try {
      // In a real app, we would save data to an API
      // For demo, simulate API call with timeout
      await new Promise(resolve => setTimeout(resolve, 800));
      
      setSuccessMessage("Password changed successfully");
      setPassword("");
      setNewPassword("");
      setConfirmPassword("");
      setIsSaving(false);
    } catch (err) {
      console.error("Error changing password:", err);
      setError("Failed to change password. Please try again.");
      setIsSaving(false);
    }
  };
  
  // Handle notification preferences save
  const handleSaveNotificationPreferences = async (e: React.FormEvent) => {
    e.preventDefault();
    
    setIsSaving(true);
    setError(null);
    setSuccessMessage(null);
    
    try {
      // In a real app, we would save data to an API
      // For demo, simulate API call with timeout
      await new Promise(resolve => setTimeout(resolve, 800));
      
      setSuccessMessage("Notification preferences updated successfully");
      setIsSaving(false);
    } catch (err) {
      console.error("Error saving notification preferences:", err);
      setError("Failed to save notification preferences. Please try again.");
      setIsSaving(false);
    }
  };
  
  // Handle removing a tracked product
  const handleRemoveProduct = async (productId: string) => {
    try {
      // In a real app, we would call an API to remove product
      // For demo, just update local state
      setTrackedProducts(trackedProducts.filter(p => p.id !== productId));
    } catch (err) {
      console.error("Error removing product:", err);
      setError("Failed to remove product. Please try again.");
    }
  };
  
  // Format price
  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(price);
  };
  
  // Format date
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    }).format(date);
  };

  // If loading or not authenticated yet
  if (status === "loading" || isLoading) {
    return (
      <div className="container mx-auto py-8 px-4">
        <div className="max-w-4xl mx-auto">
          <Skeleton className="h-10 w-48 mb-6" />
          <Card>
            <CardHeader>
              <Skeleton className="h-7 w-32 mb-2" />
              <Skeleton className="h-4 w-64" />
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <Skeleton className="h-8 w-full" />
                <Skeleton className="h-8 w-full" />
                <Skeleton className="h-8 w-full" />
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8 px-4">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold mb-6">Your Profile</h1>
        
        {/* Success message */}
        {successMessage && (
          <Alert className="mb-6 bg-green-50 border-green-200">
            <CheckCircle className="h-4 w-4 text-green-600" />
            <AlertTitle className="text-green-800">Success</AlertTitle>
            <AlertDescription className="text-green-700">{successMessage}</AlertDescription>
          </Alert>
        )}
        
        {/* Error message */}
        {error && (
          <Alert variant="destructive" className="mb-6">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Error</AlertTitle>
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}
        
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="mb-6">
            <TabsTrigger value="account">
              <User className="h-4 w-4 mr-2" />
              Account
            </TabsTrigger>
            <TabsTrigger value="security">
              <ShieldCheck className="h-4 w-4 mr-2" />
              Security
            </TabsTrigger>
            <TabsTrigger value="notifications">
              <Bell className="h-4 w-4 mr-2" />
              Notifications
            </TabsTrigger>
            <TabsTrigger value="tracking">
              <Eye className="h-4 w-4 mr-2" />
              Tracked Products
            </TabsTrigger>
            <TabsTrigger value="alerts">
              <AlertCircle className="h-4 w-4 mr-2" />
              Alerts
            </TabsTrigger>
          </TabsList>
          
          {/* Account Tab */}
          <TabsContent value="account">
            <Card>
              <CardHeader>
                <CardTitle>Account Information</CardTitle>
                <CardDescription>
                  Update your personal information and preferences
                </CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleSaveAccountInfo} className="space-y-6">
                  <div className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="name">Full Name</Label>
                        <Input 
                          id="name" 
                          value={name}
                          onChange={(e) => setName(e.target.value)}
                          placeholder="Your full name"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="email">Email Address</Label>
                        <Input 
                          id="email" 
                          type="email"
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                          placeholder="Your email address"
                        />
                      </div>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="phone">Phone Number</Label>
                        <Input 
                          id="phone" 
                          value={phone}
                          onChange={(e) => setPhone(e.target.value)}
                          placeholder="Your phone number"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="address">Address</Label>
                        <Input 
                          id="address" 
                          value={address}
                          onChange={(e) => setAddress(e.target.value)}
                          placeholder="Your address"
                        />
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex justify-end">
                    <Button type="submit" disabled={isSaving}>
                      {isSaving ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Saving...
                        </>
                      ) : (
                        <>
                          <Save className="mr-2 h-4 w-4" />
                          Save Changes
                        </>
                      )}
                    </Button>
                  </div>
                </form>
              </CardContent>
            </Card>
          </TabsContent>
          
          {/* Security Tab */}
          <TabsContent value="security">
            <Card>
              <CardHeader>
                <CardTitle>Security Settings</CardTitle>
                <CardDescription>
                  Update your password and security preferences
                </CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleChangePassword} className="space-y-6">
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="current-password">Current Password</Label>
                      <div className="relative">
                        <Input 
                          id="current-password" 
                          type={showPassword ? "text" : "password"}
                          value={password}
                          onChange={(e) => setPassword(e.target.value)}
                          placeholder="Enter your current password"
                        />
                        <Button 
                          type="button"
                          variant="ghost" 
                          size="icon"
                          className="absolute right-2 top-1/2 -translate-y-1/2"
                          onClick={() => setShowPassword(!showPassword)}
                        >
                          {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                        </Button>
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="new-password">New Password</Label>
                      <Input 
                        id="new-password" 
                        type="password"
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                        placeholder="Enter your new password"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="confirm-password">Confirm New Password</Label>
                      <Input 
                        id="confirm-password" 
                        type="password"
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        placeholder="Confirm your new password"
                      />
                    </div>
                  </div>
                  
                  <div className="flex justify-end">
                    <Button 
                      type="submit" 
                      disabled={isSaving || !password || !newPassword || !confirmPassword}
                    >
                      {isSaving ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Changing Password...
                        </>
                      ) : (
                        <>
                          <Lock className="mr-2 h-4 w-4" />
                          Change Password
                        </>
                      )}
                    </Button>
                  </div>
                </form>
                
                <div className="mt-8 pt-6 border-t">
                  <h3 className="text-lg font-medium mb-4">Two-Factor Authentication</h3>
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium">Two-Factor Authentication is disabled</p>
                      <p className="text-sm text-muted-foreground">
                        Add an extra layer of security to your account
                      </p>
                    </div>
                    <Button variant="outline">
                      Enable
                    </Button>
                  </div>
                </div>
                
                <div className="mt-8 pt-6 border-t">
                  <h3 className="text-lg font-medium mb-4">Session Management</h3>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium">Current Session</p>
                        <p className="text-sm text-muted-foreground">
                          Chrome on Windows • Active now
                        </p>
                      </div>
                      <Badge>Current</Badge>
                    </div>
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium">iPhone App</p>
                        <p className="text-sm text-muted-foreground">
                          Last active 2 hours ago
                        </p>
                      </div>
                      <Button variant="outline" size="sm">Sign Out</Button>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
          
          {/* Notifications Tab */}
          <TabsContent value="notifications">
            <Card>
              <CardHeader>
                <CardTitle>Notification Preferences</CardTitle>
                <CardDescription>
                  Choose how and when you'd like to be notified
                </CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleSaveNotificationPreferences} className="space-y-6">
                  <div className="space-y-4">
                    <div className="flex items-center space-x-2">
                      <Checkbox 
                        id="email-notifications" 
                        checked={emailNotifications}
                        onCheckedChange={(checked) => setEmailNotifications(checked as boolean)}
                      />
                      <div className="grid gap-1.5 leading-none">
                        <Label htmlFor="email-notifications" className="font-medium">
                          Email Notifications
                        </Label>
                        <p className="text-sm text-muted-foreground">
                          Receive notifications via email
                        </p>
                      </div>
                    </div>
                    
                    <div className="pl-6 space-y-4">
                      <div className="flex items-center space-x-2">
                        <Checkbox 
                          id="price-drop" 
                          checked={priceDropNotifications}
                          onCheckedChange={(checked) => setPriceDropNotifications(checked as boolean)}
                          disabled={!emailNotifications}
                        />
                        <Label 
                          htmlFor="price-drop" 
                          className={emailNotifications ? "" : "text-muted-foreground"}
                        >
                          Price drop alerts
                        </Label>
                      </div>
                      
                      <div className="flex items-center space-x-2">
                        <Checkbox 
                          id="back-in-stock" 
                          checked={backInStockNotifications}
                          onCheckedChange={(checked) => setBackInStockNotifications(checked as boolean)}
                          disabled={!emailNotifications}
                        />
                        <Label 
                          htmlFor="back-in-stock"
                          className={emailNotifications ? "" : "text-muted-foreground"}
                        >
                          Back in stock alerts
                        </Label>
                      </div>
                      
                      <div className="flex items-center space-x-2">
                        <Checkbox 
                          id="weekly-digest" 
                          checked={weeklyDigestNotifications}
                          onCheckedChange={(checked) => setWeeklyDigestNotifications(checked as boolean)}
                          disabled={!emailNotifications}
                        />
                        <Label 
                          htmlFor="weekly-digest"
                          className={emailNotifications ? "" : "text-muted-foreground"}
                        >
                          Weekly price digest
                        </Label>
                      </div>
                    </div>
                    
                    <div className="flex items-center space-x-2 pt-4 border-t">
                      <Checkbox 
                        id="marketing" 
                        checked={marketingNotifications}
                        onCheckedChange={(checked) => setMarketingNotifications(checked as boolean)}
                      />
                      <div className="grid gap-1.5 leading-none">
                        <Label htmlFor="marketing" className="font-medium">
                          Marketing Emails
                        </Label>
                        <p className="text-sm text-muted-foreground">
                          Receive occasional emails about special deals and new features
                        </p>
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex justify-end">
                    <Button type="submit" disabled={isSaving}>
                      {isSaving ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Saving...
                        </>
                      ) : (
                        <>
                          <Save className="mr-2 h-4 w-4" />
                          Save Preferences
                        </>
                      )}
                    </Button>
                  </div>
                </form>
              </CardContent>
            </Card>
          </TabsContent>
          
          {/* Tracked Products Tab */}
          <TabsContent value="tracking">
            <Card>
              <CardHeader>
                <CardTitle>Tracked Products</CardTitle>
                <CardDescription>
                  Manage the products you're currently tracking
                </CardDescription>
              </CardHeader>
              <CardContent>
                {trackedProducts.length > 0 ? (
                  <div className="space-y-6">
                    {trackedProducts.map((product) => (
                      <div 
                        key={product.id} 
                        className="flex flex-col sm:flex-row gap-4 border-b pb-6 last:border-0 last:pb-0"
                      >
                        <div className="w-24 h-24 bg-muted rounded-md flex-shrink-0 flex items-center justify-center overflow-hidden">
                          {product.imageUrl ? (
                            <img 
                              src={product.imageUrl} 
                              alt={product.name} 
                              className="max-w-full max-h-full object-contain"
                            />
                          ) : (
                            <ShoppingCart className="h-8 w-8 text-muted-foreground" />
                          )}
                        </div>
                        <div className="flex-1">
                          <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-2">
                            <div>
                              <h3 className="font-medium">{product.name}</h3>
                              <p className="text-sm text-muted-foreground">{product.store}</p>
                              <div className="flex items-baseline gap-2 mt-1">
                                <span className="font-bold">{formatPrice(product.currentPrice)}</span>
                                {product.originalPrice > product.currentPrice && (
                                  <span className="text-sm text-muted-foreground line-through">
                                    {formatPrice(product.originalPrice)}
                                  </span>
                                )}
                              </div>
                              <p className="text-xs text-muted-foreground mt-1">
                                Last updated: {formatDate(product.lastUpdated)}
                              </p>
                            </div>
                            <div className="flex flex-wrap gap-2">
                              <Button 
                                variant="outline" 
                                size="sm"
                                onClick={() => router.push(`/products?url=https://example.com/product/${product.id}`)} // Simulated URL
                              >
                                View Details
                              </Button>
                              <Button 
                                variant="destructive" 
                                size="sm"
                                onClick={() => handleRemoveProduct(product.id)}
                              >
                                Stop Tracking
                              </Button>
                            </div>
                          </div>
                          <div className="flex items-center space-x-2 mt-2">
                            <Checkbox 
                              id={`notify-${product.id}`}
                              checked={product.notify}
                              onCheckedChange={(checked) => {
                                setTrackedProducts(trackedProducts.map(p => 
                                  p.id === product.id ? {...p, notify: checked as boolean} : p
                                ));
                              }}
                            />
                            <Label htmlFor={`notify-${product.id}`} className="text-sm">
                              Notify me about price changes
                            </Label>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <div className="mx-auto w-12 h-12 rounded-full bg-muted flex items-center justify-center mb-4">
                      <Eye className="h-6 w-6 text-muted-foreground" />
                    </div>
                    <h3 className="text-lg font-medium mb-2">No products tracked yet</h3>
                    <p className="text-muted-foreground mb-4">
                      You're not currently tracking any products. Add a product to start tracking its price.
                    </p>
                    <Button onClick={() => router.push('/scraper-test')}>
                      Add a Product
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
          
          {/* Alerts Tab */}
          <TabsContent value="alerts">
            <Card>
              <CardHeader>
                <CardTitle>Price Alerts</CardTitle>
                <CardDescription>
                  Recent price changes for your tracked products
                </CardDescription>
              </CardHeader>
              <CardContent>
                {priceAlerts.length > 0 ? (
                  <div className="space-y-4">
                    {priceAlerts.map((alert) => (
                      <div 
                        key={alert.id} 
                        className="bg-muted p-4 rounded-md"
                      >
                        <div className="flex flex-col sm:flex-row justify-between gap-2">
                          <div>
                            <h3 className="font-medium">{alert.productName}</h3>
                            <p className="text-sm text-muted-foreground">{alert.store}</p>
                          </div>
                          <div className="text-right">
                            <div className="text-green-600 font-medium">-{alert.percentChange}%</div>
                            <div className="text-sm">
                              <span className="text-muted-foreground line-through mr-2">
                                {formatPrice(alert.oldPrice)}
                              </span>
                              <span className="font-medium">
                                {formatPrice(alert.newPrice)}
                              </span>
                            </div>
                          </div>
                        </div>
                        <div className="text-xs text-muted-foreground mt-2">
                          {formatDate(alert.timestamp)}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <div className="mx-auto w-12 h-12 rounded-full bg-muted flex items-center justify-center mb-4">
                      <Bell className="h-6 w-6 text-muted-foreground" />
                    </div>
                    <h3 className="text-lg font-medium mb-2">No price alerts yet</h3>
                    <p className="text-muted-foreground mb-4">
                      When prices change on your tracked products, alerts will appear here.
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
