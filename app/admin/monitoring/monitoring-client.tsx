"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useSession } from "next-auth/react";
import Link from "next/link";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCaption, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { AlertCircle, Clock, Server, Database, Activity, BarChart, ArrowUpRight, ArrowDownRight, CheckCircle2, XCircle, RefreshCcw } from "lucide-react";

// Interface for search parameters
interface SearchParams {
  [key: string]: string | string[] | undefined;
}

// Interface for monitoring data
interface SystemMetrics {
  cpuUsage: number;
  memoryUsage: number;
  diskUsage: number;
  requestsPerMinute: number;
  averageResponseTime: number;
  activeConnections: number;
  lastUpdated: string;
}

interface ScrapingStats {
  totalToday: number;
  successfulToday: number;
  failedToday: number;
  totalThisWeek: number;
  successfulThisWeek: number;
  failedThisWeek: number;
  averageResponseTime: number;
}

interface ErrorLog {
  id: string;
  timestamp: string;
  level: "info" | "warning" | "error" | "critical";
  message: string;
  source: string;
  count: number;
  resolved: boolean;
}

interface PriceAlert {
  id: string;
  productId: string;
  productName: string;
  userId: string;
  userEmail: string;
  oldPrice: number;
  newPrice: number;
  percentChange: number;
  timestamp: string;
  notificationSent: boolean;
}

// Client component for admin monitoring dashboard
export default function MonitoringClient({ 
  initialSearchParams 
}: { 
  initialSearchParams: SearchParams
}) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { data: session, status } = useSession();
  
  // Check if user is admin, if not redirect
  useEffect(() => {
    if (status === "authenticated") {
      // In a real app, you would check if user has admin role
      // For demo, we assume they do
      // if (!session?.user?.isAdmin) router.push('/');
    } else if (status === "unauthenticated") {
      router.push('/auth/signin?callbackUrl=/admin/monitoring');
    }
  }, [status, router]);

  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState("overview");
  const [timeframeFilter, setTimeframeFilter] = useState("24h");
  const [systemMetrics, setSystemMetrics] = useState<SystemMetrics | null>(null);
  const [scrapingStats, setScrapingStats] = useState<ScrapingStats | null>(null);
  const [errorLogs, setErrorLogs] = useState<ErrorLog[]>([]);
  const [priceAlerts, setPriceAlerts] = useState<PriceAlert[]>([]);

  // Load monitoring data
  useEffect(() => {
    const fetchMonitoringData = async () => {
      setIsLoading(true);
      try {
        // In a real app, this would be API calls
        // const metricsResponse = await fetch('/api/monitoring/metrics?timeframe=' + timeframeFilter);
        // const scrapingResponse = await fetch('/api/monitoring/scraping?timeframe=' + timeframeFilter);
        // const errorsResponse = await fetch('/api/monitoring/errors?timeframe=' + timeframeFilter);
        // const alertsResponse = await fetch('/api/monitoring/price-alerts?timeframe=' + timeframeFilter);
        
        // For demo, use mock data
        setTimeout(() => {
          // Mock system metrics
          setSystemMetrics({
            cpuUsage: 32.5,
            memoryUsage: 1843,
            diskUsage: 65.2,
            requestsPerMinute: 75,
            averageResponseTime: 246,
            activeConnections: 18,
            lastUpdated: new Date().toISOString(),
          });
          
          // Mock scraping stats
          setScrapingStats({
            totalToday: 4285,
            successfulToday: 4102,
            failedToday: 183,
            totalThisWeek: 28546,
            successfulThisWeek: 27254,
            failedThisWeek: 1292,
            averageResponseTime: 873,
          });
          
          // Mock error logs
          setErrorLogs([
            {
              id: "err_1",
              timestamp: new Date(Date.now() - 15 * 60 * 1000).toISOString(),
              level: "error",
              message: "Failed to scrape Amazon product: Rate limit exceeded",
              source: "amazon-scraper.ts",
              count: 37,
              resolved: false,
            },
            {
              id: "err_2",
              timestamp: new Date(Date.now() - 45 * 60 * 1000).toISOString(),
              level: "warning",
              message: "Database connection pool reached 80% capacity",
              source: "database-connection.ts",
              count: 1,
              resolved: true,
            },
            {
              id: "err_3",
              timestamp: new Date(Date.now() - 3 * 60 * 60 * 1000).toISOString(),
              level: "critical",
              message: "Email notification service unreachable",
              source: "notification-service.ts",
              count: 128,
              resolved: false,
            },
            {
              id: "err_4",
              timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
              level: "info",
              message: "Cache invalidation scheduled",
              source: "cache-manager.ts",
              count: 1,
              resolved: true,
            },
            {
              id: "err_5",
              timestamp: new Date(Date.now() - 8 * 60 * 60 * 1000).toISOString(),
              level: "error",
              message: "Stripe webhook processing failed",
              source: "subscription-webhook.ts",
              count: 3,
              resolved: true,
            },
          ]);
          
          // Mock price alerts
          setPriceAlerts([
            {
              id: "alert_1",
              productId: "prod_123",
              productName: "Sony WH-1000XM4 Wireless Headphones",
              userId: "user_456",
              userEmail: "user@example.com",
              oldPrice: 349.99,
              newPrice: 279.99,
              percentChange: 20,
              timestamp: new Date(Date.now() - 25 * 60 * 1000).toISOString(),
              notificationSent: true,
            },
            {
              id: "alert_2",
              productId: "prod_124",
              productName: "Apple iPad Pro 11-inch",
              userId: "user_457",
              userEmail: "another@example.com",
              oldPrice: 799.99,
              newPrice: 729.99,
              percentChange: 8.75,
              timestamp: new Date(Date.now() - 45 * 60 * 1000).toISOString(),
              notificationSent: true,
            },
            {
              id: "alert_3",
              productId: "prod_125",
              productName: "Samsung 55-Inch 4K UHD Smart TV",
              userId: "user_458",
              userEmail: "third@example.com",
              oldPrice: 699.99,
              newPrice: 499.99,
              percentChange: 28.57,
              timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
              notificationSent: false,
            },
          ]);
          
          setIsLoading(false);
          setError(null);
        }, 800);
      } catch (err) {
        console.error("Error fetching monitoring data:", err);
        setError("Failed to load monitoring data. Please try again.");
        setIsLoading(false);
      }
    };

    fetchMonitoringData();
  }, [timeframeFilter]);

  // Format timestamp
  const formatTimestamp = (timestamp: string) => {
    const date = new Date(timestamp);
    return new Intl.DateTimeFormat('en-US', {
      month: 'short',
      day: 'numeric',
      hour: 'numeric',
      minute: 'numeric',
      hour12: true,
    }).format(date);
  };

  // If not authenticated or loading
  if (status === "loading" || isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-center">
          <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
          <p className="mt-4 text-muted-foreground">Loading monitoring dashboard...</p>
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

  return (
    <div className="container mx-auto py-8 px-4">
      <h1 className="text-3xl font-bold mb-2">Monitoring Dashboard</h1>
      <p className="text-muted-foreground mb-6">
        Track system performance, scraping statistics, and error logs
      </p>
      
      <div className="flex flex-col sm:flex-row sm:items-center gap-4 mb-6">
        <Select value={timeframeFilter} onValueChange={setTimeframeFilter}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Select timeframe" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="1h">Last Hour</SelectItem>
            <SelectItem value="24h">Last 24 Hours</SelectItem>
            <SelectItem value="7d">Last 7 Days</SelectItem>
            <SelectItem value="30d">Last 30 Days</SelectItem>
          </SelectContent>
        </Select>
        
        <Button variant="outline" size="icon" onClick={() => {
          setIsLoading(true);
          setTimeout(() => setIsLoading(false), 800);
        }}>
          <RefreshCcw className="h-4 w-4" />
        </Button>
        
        <div className="ml-auto flex items-center gap-2">
          <div className="flex items-center space-x-2">
            <Switch id="auto-refresh" />
            <Label htmlFor="auto-refresh">Auto-refresh (1 min)</Label>
          </div>
        </div>
      </div>
      
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="mb-6">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="system">System</TabsTrigger>
          <TabsTrigger value="scraping">Scraping</TabsTrigger>
          <TabsTrigger value="errors">Errors</TabsTrigger>
          <TabsTrigger value="alerts">Price Alerts</TabsTrigger>
        </TabsList>
        
        {/* Overview Tab */}
        <TabsContent value="overview">
          {systemMetrics && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Server className="h-5 w-5" />
                    System Health
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div>
                      <div className="flex justify-between items-center mb-1">
                        <span className="text-sm">CPU Usage</span>
                        <span className="text-sm font-medium">{systemMetrics.cpuUsage}%</span>
                      </div>
                      <div className="h-2 bg-muted rounded-full overflow-hidden">
                        <div 
                          className={`h-full ${systemMetrics.cpuUsage > 80 ? 'bg-red-500' : systemMetrics.cpuUsage > 60 ? 'bg-yellow-500' : 'bg-green-500'}`} 
                          style={{ width: `${systemMetrics.cpuUsage}%` }}
                        ></div>
                      </div>
                    </div>
                    <div>
                      <div className="flex justify-between items-center mb-1">
                        <span className="text-sm">Memory Usage</span>
                        <span className="text-sm font-medium">{systemMetrics.memoryUsage} MB</span>
                      </div>
                      <div className="h-2 bg-muted rounded-full overflow-hidden">
                        <div 
                          className="h-full bg-blue-500" 
                          style={{ width: `${(systemMetrics.memoryUsage / 4096) * 100}%` }}
                        ></div>
                      </div>
                    </div>
                    <div>
                      <div className="flex justify-between items-center mb-1">
                        <span className="text-sm">Disk Usage</span>
                        <span className="text-sm font-medium">{systemMetrics.diskUsage}%</span>
                      </div>
                      <div className="h-2 bg-muted rounded-full overflow-hidden">
                        <div 
                          className={`h-full ${systemMetrics.diskUsage > 85 ? 'bg-red-500' : systemMetrics.diskUsage > 70 ? 'bg-yellow-500' : 'bg-green-500'}`} 
                          style={{ width: `${systemMetrics.diskUsage}%` }}
                        ></div>
                      </div>
                    </div>
                  </div>
                  <div className="mt-4 pt-4 border-t text-xs text-muted-foreground">
                    Last updated: {formatTimestamp(systemMetrics.lastUpdated)}
                  </div>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Activity className="h-5 w-5" />
                    Request Metrics
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-5">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium">Requests per minute</p>
                        <h3 className="text-2xl font-bold">{systemMetrics.requestsPerMinute}</h3>
                      </div>
                      <div className="h-8 w-8 bg-green-100 rounded-full flex items-center justify-center">
                        <ArrowUpRight className="h-5 w-5 text-green-600" />
                      </div>
                    </div>
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium">Avg. Response Time</p>
                        <h3 className="text-2xl font-bold">{systemMetrics.averageResponseTime} ms</h3>
                      </div>
                      <div className="h-8 w-8 bg-yellow-100 rounded-full flex items-center justify-center">
                        <ArrowDownRight className="h-5 w-5 text-yellow-600" />
                      </div>
                    </div>
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium">Active Connections</p>
                        <h3 className="text-2xl font-bold">{systemMetrics.activeConnections}</h3>
                      </div>
                      <div className="h-8 w-8 bg-blue-100 rounded-full flex items-center justify-center">
                        <Activity className="h-5 w-5 text-blue-600" />
                      </div>
                    </div>
                  </div>
                  <div className="mt-4 pt-4 border-t text-xs text-muted-foreground">
                    Last updated: {formatTimestamp(systemMetrics.lastUpdated)}
                  </div>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-lg flex items-center gap-2">
                    <BarChart className="h-5 w-5" />
                    Scraping Summary
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {scrapingStats && (
                    <div className="space-y-5">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm font-medium">Success Rate Today</p>
                          <h3 className="text-2xl font-bold">
                            {((scrapingStats.successfulToday / scrapingStats.totalToday) * 100).toFixed(1)}%
                          </h3>
                        </div>
                        <div className={`h-8 w-8 rounded-full flex items-center justify-center ${
                          (scrapingStats.successfulToday / scrapingStats.totalToday) > 0.95 
                            ? 'bg-green-100' 
                            : (scrapingStats.successfulToday / scrapingStats.totalToday) > 0.9 
                              ? 'bg-yellow-100' 
                              : 'bg-red-100'
                        }`}>
                          {(scrapingStats.successfulToday / scrapingStats.totalToday) > 0.95 ? (
                            <CheckCircle2 className="h-5 w-5 text-green-600" />
                          ) : (
                            <AlertCircle className="h-5 w-5 text-red-600" />
                          )}
                        </div>
                      </div>
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm font-medium">Total Scrapes Today</p>
                          <h3 className="text-2xl font-bold">{scrapingStats.totalToday}</h3>
                        </div>
                        <div className="text-sm text-muted-foreground">
                          <span className="text-green-600">{scrapingStats.successfulToday}</span> /
                          <span className="text-red-600"> {scrapingStats.failedToday}</span>
                        </div>
                      </div>
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm font-medium">Avg. Scrape Time</p>
                          <h3 className="text-2xl font-bold">{scrapingStats.averageResponseTime} ms</h3>
                        </div>
                        <Badge variant={scrapingStats.averageResponseTime > 1000 ? "destructive" : "outline"}>
                          {scrapingStats.averageResponseTime > 1000 ? "Slow" : "Normal"}
                        </Badge>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          )}
          
          {errorLogs.length > 0 && (
            <Card className="mb-6">
              <CardHeader>
                <CardTitle>Recent Errors</CardTitle>
                <CardDescription>
                  Showing the {Math.min(errorLogs.length, 3)} most recent errors
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {errorLogs.slice(0, 3).map((log) => (
                    <div key={log.id} className="p-4 rounded-md bg-muted">
                      <div className="flex items-start gap-3">
                        <div className={`mt-0.5 h-5 w-5 rounded-full flex items-center justify-center ${
                          log.level === 'critical' ? 'bg-red-100 text-red-600' : 
                          log.level === 'error' ? 'bg-orange-100 text-orange-600' :
                          log.level === 'warning' ? 'bg-yellow-100 text-yellow-600' :
                          'bg-blue-100 text-blue-600'
                        }`}>
                          {log.level === 'info' ? (
                            <CheckCircle2 className="h-3 w-3" />
                          ) : (
                            <AlertCircle className="h-3 w-3" />
                          )}
                        </div>
                        <div className="flex-1">
                          <div className="flex justify-between">
                            <p className="font-medium text-sm">{log.message}</p>
                            <Badge variant={log.resolved ? "outline" : "destructive"}>
                              {log.resolved ? "Resolved" : "Active"}
                            </Badge>
                          </div>
                          <div className="flex items-center gap-2 mt-1 text-xs text-muted-foreground">
                            <span>{log.source}</span>
                            <span>•</span>
                            <span>{formatTimestamp(log.timestamp)}</span>
                            <span>•</span>
                            <span>Occurred {log.count} {log.count === 1 ? 'time' : 'times'}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
              <CardFooter>
                <Button variant="outline" className="w-full" onClick={() => setActiveTab("errors")}>
                  View All Errors
                </Button>
              </CardFooter>
            </Card>
          )}
          
          {priceAlerts.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Recent Price Alerts</CardTitle>
                <CardDescription>
                  Showing the {Math.min(priceAlerts.length, 3)} most recent price alerts
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {priceAlerts.slice(0, 3).map((alert) => (
                    <div key={alert.id} className="p-4 rounded-md bg-muted">
                      <div className="flex items-start gap-3">
                        <div className="flex-1">
                          <div className="flex justify-between">
                            <p className="font-medium">{alert.productName}</p>
                            <p className="font-medium text-green-600">-{alert.percentChange.toFixed(1)}%</p>
                          </div>
                          <p className="text-sm mt-1">
                            Price dropped from ${alert.oldPrice.toFixed(2)} to ${alert.newPrice.toFixed(2)}
                          </p>
                          <div className="flex items-center gap-2 mt-1 text-xs text-muted-foreground">
                            <span>User: {alert.userEmail}</span>
                            <span>•</span>
                            <span>{formatTimestamp(alert.timestamp)}</span>
                            <span>•</span>
                            <Badge variant={alert.notificationSent ? "outline" : "secondary"} className="text-xs">
                              {alert.notificationSent ? "Notification Sent" : "Pending Notification"}
                            </Badge>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
              <CardFooter>
                <Button variant="outline" className="w-full" onClick={() => setActiveTab("alerts")}>
                  View All Price Alerts
                </Button>
              </CardFooter>
            </Card>
          )}
        </TabsContent>
        
        {/* System Tab */}
        <TabsContent value="system">
          <Card>
            <CardHeader>
              <CardTitle>System Performance</CardTitle>
              <CardDescription>
                Detailed system metrics and server performance
              </CardDescription>
            </CardHeader>
            <CardContent>
              {systemMetrics && (
                <div className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="p-4 bg-muted rounded-md">
                      <h4 className="text-sm font-medium mb-2">CPU Usage</h4>
                      <div className="text-3xl font-bold mb-2">{systemMetrics.cpuUsage}%</div>
                      <div className="h-2 bg-background rounded-full overflow-hidden">
                        <div 
                          className={`h-full ${systemMetrics.cpuUsage > 80 ? 'bg-red-500' : systemMetrics.cpuUsage > 60 ? 'bg-yellow-500' : 'bg-green-500'}`} 
                          style={{ width: `${systemMetrics.cpuUsage}%` }}
                        ></div>
                      </div>
                    </div>
                    
                    <div className="p-4 bg-muted rounded-md">
                      <h4 className="text-sm font-medium mb-2">Memory Usage</h4>
                      <div className="text-3xl font-bold mb-2">{systemMetrics.memoryUsage} MB</div>
                      <div className="text-xs text-muted-foreground mb-1">of 4096 MB total</div>
                      <div className="h-2 bg-background rounded-full overflow-hidden">
                        <div 
                          className="h-full bg-blue-500" 
                          style={{ width: `${(systemMetrics.memoryUsage / 4096) * 100}%` }}
                        ></div>
                      </div>
                    </div>
                    
                    <div className="p-4 bg-muted rounded-md">
                      <h4 className="text-sm font-medium mb-2">Disk Usage</h4>
                      <div className="text-3xl font-bold mb-2">{systemMetrics.diskUsage}%</div>
                      <div className="h-2 bg-background rounded-full overflow-hidden">
                        <div 
                          className={`h-full ${systemMetrics.diskUsage > 85 ? 'bg-red-500' : systemMetrics.diskUsage > 70 ? 'bg-yellow-500' : 'bg-green-500'}`} 
                          style={{ width: `${systemMetrics.diskUsage}%` }}
                        ></div>
                      </div>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="p-4 bg-muted rounded-md">
                      <h4 className="text-sm font-medium mb-2">Requests Per Minute</h4>
                      <div className="text-3xl font-bold">{systemMetrics.requestsPerMinute}</div>
                    </div>
                    
                    <div className="p-4 bg-muted rounded-md">
                      <h4 className="text-sm font-medium mb-2">Average Response Time</h4>
                      <div className="text-3xl font-bold">{systemMetrics.averageResponseTime} ms</div>
                    </div>
                    
                    <div className="p-4 bg-muted rounded-md">
                      <h4 className="text-sm font-medium mb-2">Active Connections</h4>
                      <div className="text-3xl font-bold">{systemMetrics.activeConnections}</div>
                    </div>
                  </div>
                  
                  {/* Mock system charts would go here */}
                  <div className="p-8 border border-dashed rounded-md flex items-center justify-center">
                    <p className="text-muted-foreground">System performance charts would be displayed here</p>
                  </div>
                  
                  <div className="text-sm text-muted-foreground">
                    Last updated: {formatTimestamp(systemMetrics.lastUpdated)}
                  </div>
                </div>
              )}
            </CardContent>
            <CardFooter className="border-t pt-6 flex justify-between">
              <Button variant="outline" onClick={() => {
                setIsLoading(true);
                setTimeout(() => setIsLoading(false), 800);
              }}>
                <RefreshCcw className="h-4 w-4 mr-2" />
                Refresh Data
              </Button>
              
              <Button variant="secondary">
                Run Diagnostics
              </Button>
            </CardFooter>
          </Card>
        </TabsContent>
        
        {/* Scraping Tab */}
        <TabsContent value="scraping">
          <Card>
            <CardHeader>
              <CardTitle>Scraping Performance</CardTitle>
              <CardDescription>
                Statistics on web scraping operations
              </CardDescription>
            </CardHeader>
            <CardContent>
          {scrapingStats && (
                <div className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="p-4 bg-muted rounded-md">
                      <h4 className="text-sm font-medium mb-1">Today's Scrapes</h4>
                      <div className="text-3xl font-bold">{scrapingStats.totalToday}</div>
                      <div className="flex items-center mt-1 text-sm text-muted-foreground">
                        <span className="text-green-600">{scrapingStats.successfulToday}</span>
                        <span className="mx-1">successful,</span> 
                        <span className="text-red-600">{scrapingStats.failedToday}</span>
                        <span className="ml-1">failed</span>
                      </div>
                    </div>
                    
                    <div className="p-4 bg-muted rounded-md">
                      <h4 className="text-sm font-medium mb-1">Weekly Total</h4>
                      <div className="text-3xl font-bold">{scrapingStats.totalThisWeek}</div>
                      <div className="flex items-center mt-1 text-sm text-muted-foreground">
                        <span className="text-green-600">{scrapingStats.successfulThisWeek}</span>
                        <span className="mx-1">successful,</span> 
                        <span className="text-red-600">{scrapingStats.failedThisWeek}</span>
                        <span className="ml-1">failed</span>
                      </div>
                    </div>
                    
                    <div className="p-4 bg-muted rounded-md">
                      <h4 className="text-sm font-medium mb-1">Scraping Speed</h4>
                      <div className="text-3xl font-bold">{scrapingStats.averageResponseTime} ms</div>
                      <div className="text-sm text-muted-foreground mt-1">Average response time</div>
                    </div>
                  </div>
                  
                  {/* Mock scraping charts would go here */}
                  <div className="p-8 border border-dashed rounded-md flex items-center justify-center">
                    <p className="text-muted-foreground">Scraping performance charts would be displayed here</p>
                  </div>
                </div>
              )}
            </CardContent>
            <CardFooter className="border-t pt-6 flex justify-between">
              <Button variant="outline" onClick={() => {
                setIsLoading(true);
                setTimeout(() => setIsLoading(false), 800);
              }}>
                <RefreshCcw className="h-4 w-4 mr-2" />
                Refresh Data
              </Button>
              
              <Button variant="secondary">
                View Detailed Reports
              </Button>
            </CardFooter>
          </Card>
        </TabsContent>
        
        {/* Errors Tab */}
        <TabsContent value="errors">
          <Card>
            <CardHeader>
              <CardTitle>Error Logs</CardTitle>
              <CardDescription>
                Recent system and application error logs
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Status</TableHead>
                    <TableHead>Message</TableHead>
                    <TableHead>Source</TableHead>
                    <TableHead>Timestamp</TableHead>
                    <TableHead>Count</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {errorLogs.map((log) => (
                    <TableRow key={log.id}>
                      <TableCell>
                        <Badge
                          variant={log.resolved ? "outline" : 
                            log.level === "critical" ? "destructive" : 
                            log.level === "error" ? "destructive" : 
                            log.level === "warning" ? "default" : "secondary"
                          }
                        >
                          {log.resolved ? "Resolved" : log.level}
                        </Badge>
                      </TableCell>
                      <TableCell className="font-medium">{log.message}</TableCell>
                      <TableCell>{log.source}</TableCell>
                      <TableCell>{formatTimestamp(log.timestamp)}</TableCell>
                      <TableCell>{log.count}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
        
        {/* Price Alerts Tab */}
        <TabsContent value="alerts">
          <Card>
            <CardHeader>
              <CardTitle>Price Alerts</CardTitle>
              <CardDescription>
                Recent price drop alerts and notifications
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Product</TableHead>
                    <TableHead>Price Change</TableHead>
                    <TableHead>User</TableHead>
                    <TableHead>Timestamp</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {priceAlerts.map((alert) => (
                    <TableRow key={alert.id}>
                      <TableCell className="font-medium">{alert.productName}</TableCell>
                      <TableCell>
                        <div className="flex flex-col">
                          <span className="text-sm text-green-600">-{alert.percentChange.toFixed(1)}%</span>
                          <span className="text-xs text-muted-foreground">
                            ${alert.oldPrice.toFixed(2)} → ${alert.newPrice.toFixed(2)}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell>{alert.userEmail}</TableCell>
                      <TableCell>{formatTimestamp(alert.timestamp)}</TableCell>
                      <TableCell>
                        <Badge variant={alert.notificationSent ? "outline" : "secondary"}>
                          {alert.notificationSent ? "Sent" : "Pending"}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
