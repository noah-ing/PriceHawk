"use client";

// Skip static generation - force dynamic rendering
export const dynamic = 'force-dynamic';

import { useState, Suspense } from "react";
import { useSession } from "next-auth/react";
import { NavBar } from "@/components/nav-bar";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Bell, User, Moon, Sun, Globe, Shield, LogOut } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

// The actual Settings component
function SettingsContent() {
  const { data: session } = useSession();
  const [activeTab, setActiveTab] = useState("account");
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  
  // Account settings state
  const [accountSettings, setAccountSettings] = useState({
    name: session?.user?.name || "",
    email: session?.user?.email || "",
  });
  
  // Notification settings state
  const [notificationSettings, setNotificationSettings] = useState({
    emailNotifications: true,
    priceDrops: true,
    priceIncreases: false,
    dailySummary: false,
    weeklySummary: true,
  });
  
  // Appearance settings state
  const [appearanceSettings, setAppearanceSettings] = useState({
    theme: "system",
    currency: "USD",
    language: "en",
  });
  
  // Privacy settings state
  const [privacySettings, setPrivacySettings] = useState({
    shareUsageData: true,
    storeSearchHistory: true,
  });
  
  // Handle account settings change
  const handleAccountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setAccountSettings({
      ...accountSettings,
      [e.target.name]: e.target.value,
    });
  };
  
  // Handle notification settings change
  const handleNotificationChange = (key: string, value: boolean) => {
    setNotificationSettings({
      ...notificationSettings,
      [key]: value,
    });
  };
  
  // Handle appearance settings change
  const handleAppearanceChange = (key: string, value: string) => {
    setAppearanceSettings({
      ...appearanceSettings,
      [key]: value,
    });
  };
  
  // Handle privacy settings change
  const handlePrivacyChange = (key: string, value: boolean) => {
    setPrivacySettings({
      ...privacySettings,
      [key]: value,
    });
  };
  
  // Handle settings save
  const handleSaveSettings = () => {
    // In a real implementation, we would save the settings to the database
    // For now, we'll just show a success message
    setSaveSuccess(true);
    setSaveError(null);
    
    // Hide the success message after 3 seconds
    setTimeout(() => {
      setSaveSuccess(false);
    }, 3000);
  };
  
  return (
    <div className="flex min-h-screen w-full bg-muted/10">
      <NavBar />

      <div className="flex flex-1 flex-col">
        <main className="flex-1 p-6">
          <div className="flex flex-col gap-6">
            <div className="flex items-center justify-between">
              <h1 className="text-3xl font-bold tracking-tight">Settings</h1>
              <Button onClick={handleSaveSettings}>Save Changes</Button>
            </div>
            
            {saveSuccess && (
              <Alert variant="default" className="bg-green-50 text-green-800 border-green-200">
                <AlertTitle>Success</AlertTitle>
                <AlertDescription>Your settings have been saved successfully.</AlertDescription>
              </Alert>
            )}
            
            {saveError && (
              <Alert variant="destructive">
                <AlertTitle>Error</AlertTitle>
                <AlertDescription>{saveError}</AlertDescription>
              </Alert>
            )}

            <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
              <TabsList>
                <TabsTrigger value="account">
                  <User className="mr-2 h-4 w-4" />
                  Account
                </TabsTrigger>
                <TabsTrigger value="notifications">
                  <Bell className="mr-2 h-4 w-4" />
                  Notifications
                </TabsTrigger>
                <TabsTrigger value="appearance">
                  <Sun className="mr-2 h-4 w-4" />
                  Appearance
                </TabsTrigger>
                <TabsTrigger value="privacy">
                  <Shield className="mr-2 h-4 w-4" />
                  Privacy
                </TabsTrigger>
              </TabsList>
              
              <TabsContent value="account" className="space-y-4">
                <Card>
                  <CardHeader>
                    <CardTitle>Account Information</CardTitle>
                    <CardDescription>
                      Manage your account details and preferences
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="name">Name</Label>
                      <Input
                        id="name"
                        name="name"
                        value={accountSettings.name}
                        onChange={handleAccountChange}
                        placeholder="Your name"
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="email">Email</Label>
                      <Input
                        id="email"
                        name="email"
                        value={accountSettings.email}
                        onChange={handleAccountChange}
                        placeholder="Your email"
                        disabled={session?.user?.email?.includes("demo") || false}
                      />
                      {session?.user?.email?.includes("demo") && (
                        <p className="text-xs text-muted-foreground">
                          Email cannot be changed for demo accounts
                        </p>
                      )}
                    </div>
                    
                    <Separator className="my-4" />
                    
                    <div className="space-y-2">
                      <h3 className="text-lg font-medium">Account Actions</h3>
                      <div className="flex flex-col space-y-2">
                        <Button variant="outline" className="justify-start">
                          <Shield className="mr-2 h-4 w-4" />
                          Change Password
                        </Button>
                        <Button variant="outline" className="justify-start text-red-500 hover:text-red-600">
                          <LogOut className="mr-2 h-4 w-4" />
                          Sign Out
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
              
              <TabsContent value="notifications" className="space-y-4">
                <Card>
                  <CardHeader>
                    <CardTitle>Notification Preferences</CardTitle>
                    <CardDescription>
                      Manage how and when you receive notifications
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <div>
                          <Label htmlFor="email-notifications" className="text-base">Email Notifications</Label>
                          <p className="text-sm text-muted-foreground">
                            Receive notifications via email
                          </p>
                        </div>
                        <Switch
                          id="email-notifications"
                          checked={notificationSettings.emailNotifications}
                          onCheckedChange={(checked) => handleNotificationChange("emailNotifications", checked)}
                        />
                      </div>
                    </div>
                    
                    <Separator />
                    
                    <div className="space-y-4">
                      <h3 className="text-lg font-medium">Price Alerts</h3>
                      
                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <div>
                            <Label htmlFor="price-drops" className="text-base">Price Drops</Label>
                            <p className="text-sm text-muted-foreground">
                              Get notified when prices drop below your alert thresholds
                            </p>
                          </div>
                          <Switch
                            id="price-drops"
                            checked={notificationSettings.priceDrops}
                            onCheckedChange={(checked) => handleNotificationChange("priceDrops", checked)}
                          />
                        </div>
                      </div>
                      
                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <div>
                            <Label htmlFor="price-increases" className="text-base">Price Increases</Label>
                            <p className="text-sm text-muted-foreground">
                              Get notified when prices increase
                            </p>
                          </div>
                          <Switch
                            id="price-increases"
                            checked={notificationSettings.priceIncreases}
                            onCheckedChange={(checked) => handleNotificationChange("priceIncreases", checked)}
                          />
                        </div>
                      </div>
                    </div>
                    
                    <Separator />
                    
                    <div className="space-y-4">
                      <h3 className="text-lg font-medium">Summary Reports</h3>
                      
                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <div>
                            <Label htmlFor="daily-summary" className="text-base">Daily Summary</Label>
                            <p className="text-sm text-muted-foreground">
                              Receive a daily summary of price changes
                            </p>
                          </div>
                          <Switch
                            id="daily-summary"
                            checked={notificationSettings.dailySummary}
                            onCheckedChange={(checked) => handleNotificationChange("dailySummary", checked)}
                          />
                        </div>
                      </div>
                      
                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <div>
                            <Label htmlFor="weekly-summary" className="text-base">Weekly Summary</Label>
                            <p className="text-sm text-muted-foreground">
                              Receive a weekly summary of price changes and savings
                            </p>
                          </div>
                          <Switch
                            id="weekly-summary"
                            checked={notificationSettings.weeklySummary}
                            onCheckedChange={(checked) => handleNotificationChange("weeklySummary", checked)}
                          />
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
              
              <TabsContent value="appearance" className="space-y-4">
                <Card>
                  <CardHeader>
                    <CardTitle>Appearance Settings</CardTitle>
                    <CardDescription>
                      Customize how PriceHawk looks and displays information
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    <div className="space-y-2">
                      <Label htmlFor="theme">Theme</Label>
                      <Select
                        value={appearanceSettings.theme}
                        onValueChange={(value) => handleAppearanceChange("theme", value)}
                      >
                        <SelectTrigger id="theme">
                          <SelectValue placeholder="Select theme" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="light">
                            <div className="flex items-center">
                              <Sun className="mr-2 h-4 w-4" />
                              Light
                            </div>
                          </SelectItem>
                          <SelectItem value="dark">
                            <div className="flex items-center">
                              <Moon className="mr-2 h-4 w-4" />
                              Dark
                            </div>
                          </SelectItem>
                          <SelectItem value="system">
                            <div className="flex items-center">
                              <div className="mr-2 flex h-4 w-4">
                                <Sun className="h-4 w-4 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
                                <Moon className="absolute h-4 w-4 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
                              </div>
                              System
                            </div>
                          </SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="currency">Currency</Label>
                      <Select
                        value={appearanceSettings.currency}
                        onValueChange={(value) => handleAppearanceChange("currency", value)}
                      >
                        <SelectTrigger id="currency">
                          <SelectValue placeholder="Select currency" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="USD">USD ($)</SelectItem>
                          <SelectItem value="EUR">EUR (€)</SelectItem>
                          <SelectItem value="GBP">GBP (£)</SelectItem>
                          <SelectItem value="JPY">JPY (¥)</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="language">Language</Label>
                      <Select
                        value={appearanceSettings.language}
                        onValueChange={(value) => handleAppearanceChange("language", value)}
                      >
                        <SelectTrigger id="language">
                          <SelectValue placeholder="Select language" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="en">
                            <div className="flex items-center">
                              <Globe className="mr-2 h-4 w-4" />
                              English
                            </div>
                          </SelectItem>
                          <SelectItem value="es" disabled>
                            <div className="flex items-center">
                              <Globe className="mr-2 h-4 w-4" />
                              Spanish (Coming Soon)
                            </div>
                          </SelectItem>
                          <SelectItem value="fr" disabled>
                            <div className="flex items-center">
                              <Globe className="mr-2 h-4 w-4" />
                              French (Coming Soon)
                            </div>
                          </SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
              
              <TabsContent value="privacy" className="space-y-4">
                <Card>
                  <CardHeader>
                    <CardTitle>Privacy Settings</CardTitle>
                    <CardDescription>
                      Manage your data and privacy preferences
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <div>
                          <Label htmlFor="share-usage-data" className="text-base">Share Usage Data</Label>
                          <p className="text-sm text-muted-foreground">
                            Help us improve PriceHawk by sharing anonymous usage data
                          </p>
                        </div>
                        <Switch
                          id="share-usage-data"
                          checked={privacySettings.shareUsageData}
                          onCheckedChange={(checked) => handlePrivacyChange("shareUsageData", checked)}
                        />
                      </div>
                    </div>
                    
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <div>
                          <Label htmlFor="store-search-history" className="text-base">Store Search History</Label>
                          <p className="text-sm text-muted-foreground">
                            Save your search history to improve recommendations
                          </p>
                        </div>
                        <Switch
                          id="store-search-history"
                          checked={privacySettings.storeSearchHistory}
                          onCheckedChange={(checked) => handlePrivacyChange("storeSearchHistory", checked)}
                        />
                      </div>
                    </div>
                    
                    <Separator className="my-4" />
                    
                    <div className="space-y-2">
                      <h3 className="text-lg font-medium">Data Management</h3>
                      <div className="flex flex-col space-y-2">
                        <Button variant="outline" className="justify-start">
                          <Shield className="mr-2 h-4 w-4" />
                          Export My Data
                        </Button>
                        <Button variant="outline" className="justify-start text-red-500 hover:text-red-600">
                          <Shield className="mr-2 h-4 w-4" />
                          Delete My Account
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </div>
        </main>
      </div>
    </div>
  );
}

// Export a Suspense-wrapped component to handle any useSearchParams() calls
export default function SettingsPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <SettingsContent />
    </Suspense>
  );
}
