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
import { CheckCircle2, AlertCircle, CreditCard, Calendar, Package, Clock } from "lucide-react";

// Interface for search parameters
interface SearchParams {
  [key: string]: string | string[] | undefined;
}

// Simulated subscription interface
interface Subscription {
  id: string;
  status: "active" | "canceled" | "past_due" | "trial" | "none";
  plan: {
    name: string;
    features: string[];
    price: number;
    interval: "month" | "year";
  };
  currentPeriodEnd: string;
  cancelAtPeriodEnd: boolean;
}

// Client component for subscription management
export default function SubscriptionClient({ 
  initialSearchParams 
}: { 
  initialSearchParams: SearchParams
}) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { data: session, status } = useSession();
  
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [subscription, setSubscription] = useState<Subscription | null>(null);
  const [upgradingPlan, setUpgradingPlan] = useState(false);
  
  // Check if user has a subscription message in URL
  const successMessage = searchParams.get("success");
  const cancelMessage = searchParams.get("canceled");

  // Get subscription data
  useEffect(() => {
    const fetchSubscription = async () => {
      setIsLoading(true);
      try {
        // In a real app, this would be an API call
        // const response = await fetch('/api/subscriptions/status');
        
        // For demo, using mock data
        setTimeout(() => {
          // Simulated subscription data
          setSubscription({
            id: "sub_123456",
            status: "active",
            plan: {
              name: "Professional",
              features: [
                "Unlimited product tracking",
                "Real-time price alerts",
                "Price history charts",
                "Email & SMS notifications",
                "Price drop predictions"
              ],
              price: 9.99,
              interval: "month"
            },
            currentPeriodEnd: "2025-04-13T00:00:00Z",
            cancelAtPeriodEnd: false
          });
          
          setIsLoading(false);
        }, 800);
      } catch (err) {
        console.error("Error fetching subscription:", err);
        setError("Failed to load subscription information. Please try again.");
        setIsLoading(false);
      }
    };

    if (status === "authenticated") {
      fetchSubscription();
    } else if (status === "unauthenticated") {
      router.push("/auth/signin");
    }
  }, [status, router]);

  // Handle subscription management
  const handleManageSubscription = async () => {
    try {
      setUpgradingPlan(true);
      
      // In a real app, this would call an API to create a portal session
      // const response = await fetch('/api/subscriptions/portal', { method: 'POST' });
      // const { url } = await response.json();
      // window.location.href = url;
      
      // For demo, simulate redirect after a delay
      setTimeout(() => {
        alert("In a real app, this would redirect to the Stripe customer portal.");
        setUpgradingPlan(false);
      }, 1000);
    } catch (err) {
      console.error("Error creating portal session:", err);
      setError("Failed to redirect to billing portal. Please try again.");
      setUpgradingPlan(false);
    }
  };

  // Handle checkout for a new subscription
  const handleCheckout = async () => {
    try {
      setUpgradingPlan(true);
      
      // In a real app, this would call an API to create a checkout session
      // const response = await fetch('/api/subscriptions/create-checkout', { 
      //   method: 'POST',
      //   headers: { 'Content-Type': 'application/json' },
      //   body: JSON.stringify({ priceId: 'price_123' }),
      // });
      // const { url } = await response.json();
      // window.location.href = url;
      
      // For demo, simulate redirect after a delay
      setTimeout(() => {
        alert("In a real app, this would redirect to the Stripe checkout page.");
        setUpgradingPlan(false);
      }, 1000);
    } catch (err) {
      console.error("Error creating checkout session:", err);
      setError("Failed to redirect to checkout. Please try again.");
      setUpgradingPlan(false);
    }
  };

  // Format date for display
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  // If loading or not authenticated yet
  if (status === "loading" || isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-center">
          <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
          <p className="mt-4 text-muted-foreground">Loading your subscription details...</p>
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
      <div className="mb-6">
        <Link href="/settings" className="text-primary hover:underline">&larr; Back to Settings</Link>
      </div>
      
      <h1 className="text-3xl font-bold mb-6">Subscription Management</h1>
      
      {/* Success message after checkout */}
      {successMessage && (
        <Alert className="mb-6 bg-green-50 text-green-800 border-green-200">
          <CheckCircle2 className="h-4 w-4" />
          <AlertTitle>Subscription Active</AlertTitle>
          <AlertDescription>
            Your subscription has been successfully activated! You now have access to all premium features.
          </AlertDescription>
        </Alert>
      )}
      
      {/* Canceled message */}
      {cancelMessage && (
        <Alert className="mb-6">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Checkout Canceled</AlertTitle>
          <AlertDescription>
            Your checkout process was canceled. No changes have been made to your subscription.
          </AlertDescription>
        </Alert>
      )}
      
      {subscription ? (
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <div className="flex justify-between items-start">
                <div>
                  <CardTitle>Current Plan</CardTitle>
                  <CardDescription>Your subscription details</CardDescription>
                </div>
                <Badge variant={subscription.status === "active" ? "default" : "secondary"}>
                  {subscription.status === "active" ? "Active" : 
                   subscription.status === "canceled" ? "Canceled" : 
                   subscription.status === "past_due" ? "Past Due" : 
                   subscription.status === "trial" ? "Trial" : "Inactive"}
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <h3 className="font-medium flex items-center gap-2">
                    <Package className="h-4 w-4" />
                    Plan Details
                  </h3>
                  <div className="mt-2 space-y-1">
                    <p className="font-bold text-xl">{subscription.plan.name}</p>
                    <p className="text-muted-foreground">${subscription.plan.price.toFixed(2)} / {subscription.plan.interval}</p>
                  </div>
                </div>
                
                <div>
                  <h3 className="font-medium flex items-center gap-2">
                    <Calendar className="h-4 w-4" />
                    Billing Period
                  </h3>
                  <div className="mt-2 space-y-1">
                    <p>
                      Current period ends: <span className="font-medium">{formatDate(subscription.currentPeriodEnd)}</span>
                    </p>
                    <p>
                      {subscription.cancelAtPeriodEnd 
                        ? "Your subscription will end after the current period" 
                        : "Your subscription will renew automatically"}
                    </p>
                  </div>
                </div>
              </div>
              
              <div>
                <h3 className="font-medium">Included Features</h3>
                <ul className="mt-2 space-y-1">
                  {subscription.plan.features.map((feature, index) => (
                    <li key={index} className="flex items-start gap-2">
                      <CheckCircle2 className="h-4 w-4 mt-1 text-green-500" />
                      <span>{feature}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </CardContent>
            <CardFooter>
              <Button 
                onClick={handleManageSubscription} 
                disabled={upgradingPlan}
                className="w-full"
              >
                {upgradingPlan ? "Redirecting..." : "Manage Subscription"}
              </Button>
            </CardFooter>
          </Card>
        </div>
      ) : (
        // No subscription - show plans
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>You don't have an active subscription</CardTitle>
              <CardDescription>
                Upgrade to unlock premium features and enhance your price tracking experience
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                <div className="grid gap-6 md:grid-cols-2">
                  <Card className="border-2 border-muted">
                    <CardHeader>
                      <CardTitle>Free Plan</CardTitle>
                      <CardDescription>
                        <span className="font-medium text-lg">$0</span> / month
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <ul className="space-y-2">
                        <li className="flex items-start gap-2">
                          <CheckCircle2 className="h-4 w-4 mt-1 text-green-500" />
                          <span>Track up to 3 products</span>
                        </li>
                        <li className="flex items-start gap-2">
                          <CheckCircle2 className="h-4 w-4 mt-1 text-green-500" />
                          <span>Basic price alerts</span>
                        </li>
                        <li className="flex items-start gap-2">
                          <CheckCircle2 className="h-4 w-4 mt-1 text-green-500" />
                          <span>7-day price history</span>
                        </li>
                      </ul>
                    </CardContent>
                    <CardFooter>
                      <Button variant="outline" className="w-full" disabled>
                        Current Plan
                      </Button>
                    </CardFooter>
                  </Card>
                  
                  <Card className="border-2 border-primary">
                    <CardHeader>
                      <div className="flex justify-between items-center">
                        <CardTitle>Premium</CardTitle>
                        <Badge>Recommended</Badge>
                      </div>
                      <CardDescription>
                        <span className="font-medium text-lg">$9.99</span> / month
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <ul className="space-y-2">
                        <li className="flex items-start gap-2">
                          <CheckCircle2 className="h-4 w-4 mt-1 text-green-500" />
                          <span>Unlimited product tracking</span>
                        </li>
                        <li className="flex items-start gap-2">
                          <CheckCircle2 className="h-4 w-4 mt-1 text-green-500" />
                          <span>Advanced price alerts</span>
                        </li>
                        <li className="flex items-start gap-2">
                          <CheckCircle2 className="h-4 w-4 mt-1 text-green-500" />
                          <span>Full price history</span>
                        </li>
                        <li className="flex items-start gap-2">
                          <CheckCircle2 className="h-4 w-4 mt-1 text-green-500" />
                          <span>Email & SMS notifications</span>
                        </li>
                        <li className="flex items-start gap-2">
                          <CheckCircle2 className="h-4 w-4 mt-1 text-green-500" />
                          <span>Price drop predictions</span>
                        </li>
                      </ul>
                    </CardContent>
                    <CardFooter>
                      <Button 
                        onClick={handleCheckout} 
                        disabled={upgradingPlan}
                        className="w-full"
                      >
                        {upgradingPlan ? "Redirecting..." : "Upgrade Now"}
                      </Button>
                    </CardFooter>
                  </Card>
                </div>
                
                <p className="text-sm text-center text-muted-foreground">
                  All plans include a 7-day free trial. You can cancel anytime during the trial period.
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
