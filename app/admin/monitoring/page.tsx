"use client";

import { useState, useEffect } from "react";
import { NavBar } from "@/components/nav-bar";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Play, Pause, RefreshCw, AlertTriangle, CheckCircle } from "lucide-react";

export default function MonitoringPage() {
  // State for monitoring system status
  const [isRunning, setIsRunning] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  
  // State for monitoring options
  const [options, setOptions] = useState({
    hourlyLimit: 50,
    dailyLimit: 1000,
    enableNotifications: true,
  });
  
  // State for manual check
  const [manualCheckLimit, setManualCheckLimit] = useState(10);
  const [retryFailedChecks, setRetryFailedChecks] = useState(true);
  const [notifyAdmins, setNotifyAdmins] = useState(true);
  const [isRunningManualCheck, setIsRunningManualCheck] = useState(false);
  const [manualCheckResult, setManualCheckResult] = useState<any>(null);
  
  // Fetch monitoring system status on page load
  useEffect(() => {
    fetchStatus();
  }, []);
  
  // Function to fetch monitoring system status
  const fetchStatus = async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      const response = await fetch('/api/monitoring');
      const result = await response.json();
      
      if (!response.ok) {
        throw new Error(result.message || 'Failed to fetch monitoring status');
      }
      
      setIsRunning(result.isRunning);
    } catch (err) {
      console.error('Error fetching monitoring status:', err);
      setError('Failed to fetch monitoring status. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };
  
  // Function to start the monitoring system
  const startMonitoring = async () => {
    setIsLoading(true);
    setError(null);
    setSuccessMessage(null);
    
    try {
      const response = await fetch('/api/monitoring', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(options),
      });
      
      const result = await response.json();
      
      if (!response.ok) {
        throw new Error(result.message || 'Failed to start monitoring system');
      }
      
      setIsRunning(result.isRunning);
      setSuccessMessage('Monitoring system started successfully');
      
      // Hide success message after 3 seconds
      setTimeout(() => {
        setSuccessMessage(null);
      }, 3000);
    } catch (err) {
      console.error('Error starting monitoring system:', err);
      setError('Failed to start monitoring system. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };
  
  // Function to stop the monitoring system
  const stopMonitoring = async () => {
    setIsLoading(true);
    setError(null);
    setSuccessMessage(null);
    
    try {
      const response = await fetch('/api/monitoring', {
        method: 'DELETE',
      });
      
      const result = await response.json();
      
      if (!response.ok) {
        throw new Error(result.message || 'Failed to stop monitoring system');
      }
      
      setIsRunning(result.isRunning);
      setSuccessMessage('Monitoring system stopped successfully');
      
      // Hide success message after 3 seconds
      setTimeout(() => {
        setSuccessMessage(null);
      }, 3000);
    } catch (err) {
      console.error('Error stopping monitoring system:', err);
      setError('Failed to stop monitoring system. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };
  
  // Function to run a manual price check
  const runManualCheck = async () => {
    setIsRunningManualCheck(true);
    setError(null);
    setSuccessMessage(null);
    setManualCheckResult(null);
    
    try {
      const response = await fetch('/api/monitoring', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          limit: manualCheckLimit,
          retryFailedChecks,
          notifyAdmins
        }),
      });
      
      const result = await response.json();
      
      if (!response.ok) {
        throw new Error(result.message || 'Failed to run manual price check');
      }
      
      setManualCheckResult(result.result);
      setSuccessMessage('Manual price check completed successfully');
      
      // Hide success message after 3 seconds
      setTimeout(() => {
        setSuccessMessage(null);
      }, 3000);
    } catch (err) {
      console.error('Error running manual price check:', err);
      setError('Failed to run manual price check. Please try again.');
    } finally {
      setIsRunningManualCheck(false);
    }
  };
  
  // Handle option changes
  const handleOptionChange = (key: string, value: any) => {
    setOptions({
      ...options,
      [key]: value,
    });
  };
  
  return (
    <div className="flex min-h-screen w-full bg-muted/10">
      <NavBar />

      <div className="flex flex-1 flex-col">
        <main className="flex-1 p-6">
          <div className="flex flex-col gap-6">
            <div className="flex items-center justify-between">
              <h1 className="text-3xl font-bold tracking-tight">Monitoring System</h1>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="icon"
                  onClick={fetchStatus}
                  disabled={isLoading}
                >
                  <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
                </Button>
                {isRunning ? (
                  <Button
                    variant="destructive"
                    onClick={stopMonitoring}
                    disabled={isLoading}
                  >
                    <Pause className="mr-2 h-4 w-4" />
                    Stop Monitoring
                  </Button>
                ) : (
                  <Button
                    variant="default"
                    onClick={startMonitoring}
                    disabled={isLoading}
                  >
                    <Play className="mr-2 h-4 w-4" />
                    Start Monitoring
                  </Button>
                )}
              </div>
            </div>
            
            {error && (
              <Alert variant="destructive">
                <AlertTriangle className="h-4 w-4" />
                <AlertTitle>Error</AlertTitle>
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}
            
            {successMessage && (
              <Alert variant="default" className="bg-green-50 text-green-800 border-green-200">
                <CheckCircle className="h-4 w-4" />
                <AlertTitle>Success</AlertTitle>
                <AlertDescription>{successMessage}</AlertDescription>
              </Alert>
            )}
            
            <div className="grid gap-6 md:grid-cols-2">
              <Card>
                <CardHeader>
                  <CardTitle>Monitoring Status</CardTitle>
                  <CardDescription>
                    Current status of the price monitoring system
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="text-lg font-medium">System Status</h3>
                        <p className="text-sm text-muted-foreground">
                          Whether the monitoring system is currently running
                        </p>
                      </div>
                      <div className={`px-3 py-1 rounded-full text-sm font-medium ${
                        isRunning
                          ? 'bg-green-100 text-green-800'
                          : 'bg-red-100 text-red-800'
                      }`}>
                        {isRunning ? 'Running' : 'Stopped'}
                      </div>
                    </div>
                    
                    <Separator />
                    
                    <div className="space-y-4">
                      <h3 className="text-lg font-medium">Configuration</h3>
                      
                      <div className="space-y-2">
                        <Label htmlFor="hourly-limit">Hourly Check Limit</Label>
                        <Input
                          id="hourly-limit"
                          type="number"
                          value={options.hourlyLimit}
                          onChange={(e) => handleOptionChange('hourlyLimit', parseInt(e.target.value))}
                          min={1}
                          max={1000}
                        />
                        <p className="text-xs text-muted-foreground">
                          Maximum number of products to check per hour
                        </p>
                      </div>
                      
                      <div className="space-y-2">
                        <Label htmlFor="daily-limit">Daily Check Limit</Label>
                        <Input
                          id="daily-limit"
                          type="number"
                          value={options.dailyLimit}
                          onChange={(e) => handleOptionChange('dailyLimit', parseInt(e.target.value))}
                          min={1}
                          max={10000}
                        />
                        <p className="text-xs text-muted-foreground">
                          Maximum number of products to check per day
                        </p>
                      </div>
                      
                      <div className="flex items-center justify-between">
                        <div>
                          <Label htmlFor="enable-notifications" className="text-base">Enable Notifications</Label>
                          <p className="text-sm text-muted-foreground">
                            Send notifications for price changes
                          </p>
                        </div>
                        <Switch
                          id="enable-notifications"
                          checked={options.enableNotifications}
                          onCheckedChange={(checked) => handleOptionChange('enableNotifications', checked)}
                        />
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader>
                  <CardTitle>Manual Price Check</CardTitle>
                  <CardDescription>
                    Run a manual price check for products
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="space-y-4">
                      <div className="space-y-2">
                        <Label htmlFor="manual-check-limit">Number of Products</Label>
                        <Input
                          id="manual-check-limit"
                          type="number"
                          value={manualCheckLimit}
                          onChange={(e) => setManualCheckLimit(parseInt(e.target.value))}
                          min={1}
                          max={100}
                        />
                        <p className="text-xs text-muted-foreground">
                          Number of products to check in this manual run
                        </p>
                      </div>
                      
                      <div className="flex items-center justify-between">
                        <div>
                          <Label htmlFor="retry-failed-checks" className="text-base">Retry Failed Checks</Label>
                          <p className="text-sm text-muted-foreground">
                            Automatically retry failed price checks
                          </p>
                        </div>
                        <Switch
                          id="retry-failed-checks"
                          checked={retryFailedChecks}
                          onCheckedChange={setRetryFailedChecks}
                        />
                      </div>
                      
                      <div className="flex items-center justify-between">
                        <div>
                          <Label htmlFor="notify-admins" className="text-base">Notify Admins</Label>
                          <p className="text-sm text-muted-foreground">
                            Send notifications to admins on failures
                          </p>
                        </div>
                        <Switch
                          id="notify-admins"
                          checked={notifyAdmins}
                          onCheckedChange={setNotifyAdmins}
                        />
                      </div>
                      
                      <Button
                        onClick={runManualCheck}
                        disabled={isRunningManualCheck}
                        className="w-full"
                      >
                        {isRunningManualCheck ? (
                          <>
                            <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                            Running Price Check...
                          </>
                        ) : (
                          <>
                            <RefreshCw className="mr-2 h-4 w-4" />
                            Run Manual Price Check
                          </>
                        )}
                      </Button>
                    </div>
                    
                    <Separator />
                    
                    <div className="space-y-2">
                      <h3 className="text-lg font-medium">Results</h3>
                      
                      {manualCheckResult ? (
                        <div className="rounded-md bg-muted p-4">
                          <div className="space-y-2">
                            <div className="flex items-center justify-between">
                              <span className="text-sm font-medium">Products Checked:</span>
                              <span>{manualCheckResult.productsChecked || 0}</span>
                            </div>
                            <div className="flex items-center justify-between">
                              <span className="text-sm font-medium">Price Changes:</span>
                              <span>{manualCheckResult.priceChanges || 0}</span>
                            </div>
                            <div className="flex items-center justify-between">
                              <span className="text-sm font-medium">Response Time:</span>
                              <span>{manualCheckResult.responseTime ? `${manualCheckResult.responseTime}ms` : 'N/A'}</span>
                            </div>
                            <div className="flex items-center justify-between">
                              <span className="text-sm font-medium">Errors:</span>
                              <span className={manualCheckResult.errors > 0 ? 'text-red-600 font-medium' : ''}>
                                {manualCheckResult.errors || 0}
                              </span>
                            </div>
                            {manualCheckResult.errorMessage && (
                              <div className="mt-2 text-sm text-red-600">
                                <span className="font-medium">Error: </span>
                                {manualCheckResult.errorMessage}
                              </div>
                            )}
                            {manualCheckResult.priceChangeDetails && manualCheckResult.priceChangeDetails.length > 0 && (
                              <div className="mt-3">
                                <h4 className="text-sm font-medium mb-2">Price Change Details:</h4>
                                <div className="max-h-40 overflow-y-auto text-xs">
                                  {manualCheckResult.priceChangeDetails.map((change: any, index: number) => (
                                    <div key={index} className="mb-1 pb-1 border-b border-gray-200 last:border-0">
                                      <div>Product ID: {change.productId}</div>
                                      <div className="flex justify-between">
                                        <span>Old: {change.oldPrice}</span>
                                        <span>→</span>
                                        <span>New: {change.newPrice}</span>
                                      </div>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            )}
                          </div>
                        </div>
                      ) : (
                        <div className="flex flex-col items-center justify-center rounded-md border border-dashed p-4 text-center">
                          <p className="text-sm text-muted-foreground">
                            Run a manual check to see results
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
