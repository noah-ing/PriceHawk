"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { CheckCircle, CreditCard, Clock, AlertCircle } from "lucide-react";

// Interface for search parameters
interface SearchParams {
  [key: string]: string | string[] | undefined;
}

// Client component for pricing page
export default function PricingClient({ 
  initialSearchParams 
}: { 
  initialSearchParams: SearchParams
}) {
  const router = useRouter();
  const searchParams = useSearchParams();
  
  const [billingPeriod, setBillingPeriod] = useState<"monthly" | "yearly">("monthly");
  
  // Pricing plans with features and pricing
  const plans = [
    {
      id: "free",
      name: "Free",
      description: "Basic price tracking for casual users",
      monthlyPrice: 0,
      yearlyPrice: 0,
      features: [
        "Track up to 3 products",
        "Basic price alerts",
        "7-day price history",
        "Email notifications",
      ],
      limited: [
        "Limited scraping frequency",
        "No advanced features",
      ],
      cta: "Current Plan",
      highlighted: false,
      disabled: true,
    },
    {
      id: "pro",
      name: "Pro",
      description: "Advanced price tracking for power users",
      monthlyPrice: 9.99,
      yearlyPrice: 99.99,
      features: [
        "Track up to 25 products",
        "Advanced price alerts",
        "Full price history",
        "Email & SMS notifications",
        "Price drop predictions",
        "Priority scraping",
        "Data export",
      ],
      cta: "Upgrade to Pro",
      highlighted: true,
      disabled: false,
    },
    {
      id: "business",
      name: "Business",
      description: "Enterprise-grade price tracking for businesses",
      monthlyPrice: 29.99,
      yearlyPrice: 299.99,
      features: [
        "Unlimited product tracking",
        "Advanced analytics dashboard",
        "Competitor price monitoring",
        "API access",
        "Custom reports",
        "Dedicated support",
        "Multiple user accounts",
        "White-label alerts",
      ],
      cta: "Contact Sales",
      highlighted: false,
      disabled: false,
    }
  ];

  // Handle plan selection
  const handleSelectPlan = (planId: string) => {
    if (planId === "free") {
      return; // Current plan, do nothing
    }
    
    if (planId === "business") {
      // Redirect to contact page for Business plan
      router.push("/contact?subject=Business Plan Inquiry");
      return;
    }
    
    // Redirect to checkout for Pro plan
    router.push(`/settings/subscription?plan=${planId}&billing=${billingPeriod}`);
  };

  // Calculate savings from yearly billing
  const calculateYearlySavings = (monthlyPrice: number, yearlyPrice: number) => {
    if (monthlyPrice === 0) {
      return {
        amount: "0.00",
        percentage: "0",
      };
    }
    
    const monthlyTotal = monthlyPrice * 12;
    const savings = monthlyTotal - yearlyPrice;
    const savingsPercentage = (savings / monthlyTotal) * 100;
    
    return {
      amount: savings.toFixed(2),
      percentage: savingsPercentage.toFixed(0),
    };
  };

  return (
    <div className="container mx-auto py-12 px-4">
      <div className="max-w-4xl mx-auto text-center mb-12">
        <h1 className="text-4xl font-bold mb-4">Choose Your Plan</h1>
        <p className="text-xl text-muted-foreground mb-8">
          Select the perfect plan for your price tracking needs
        </p>
        
        {/* Billing period toggle */}
        <div className="inline-flex items-center bg-muted p-1 rounded-lg mb-8">
          <div className="flex items-center gap-4 p-2">
            <Label htmlFor="billing-toggle" className={`text-sm ${billingPeriod === "monthly" ? "font-semibold" : ""}`}>
              Monthly
            </Label>
            <Switch
              id="billing-toggle"
              checked={billingPeriod === "yearly"}
              onCheckedChange={(checked) => setBillingPeriod(checked ? "yearly" : "monthly")}
            />
            <Label htmlFor="billing-toggle" className="flex items-center gap-2">
              <span className={`text-sm ${billingPeriod === "yearly" ? "font-semibold" : ""}`}>
                Yearly
              </span>
              {billingPeriod === "yearly" && (
                <Badge variant="outline" className="bg-green-100 text-green-800 border-green-200">
                  Save up to 16%
                </Badge>
              )}
            </Label>
          </div>
        </div>
        
        {/* Pricing cards */}
        <div className="grid gap-8 md:grid-cols-3">
          {plans.map((plan) => {
            const price = billingPeriod === "monthly" ? plan.monthlyPrice : plan.yearlyPrice;
            const savings = calculateYearlySavings(plan.monthlyPrice, plan.yearlyPrice);
            
            return (
              <Card key={plan.id} className={`relative ${plan.highlighted ? "border-2 border-primary shadow-lg" : ""}`}>
                {plan.highlighted && (
                  <div className="absolute -top-3 left-0 right-0 flex justify-center">
                    <Badge>Most Popular</Badge>
                  </div>
                )}
                
                <CardHeader>
                  <CardTitle>{plan.name}</CardTitle>
                  <CardDescription>{plan.description}</CardDescription>
                </CardHeader>
                
                <CardContent>
                  <div className="mb-6">
                    <p className="flex items-end">
                      <span className="text-3xl font-bold">${price.toFixed(2)}</span>
                      <span className="text-sm text-muted-foreground">/{billingPeriod === "monthly" ? "month" : "year"}</span>
                    </p>
                    {billingPeriod === "yearly" && price > 0 && (
                      <p className="text-sm text-green-600 mt-1">
                        Save ${savings.amount} ({savings.percentage}%) with annual billing
                      </p>
                    )}
                  </div>
                  
                  <div className="space-y-4">
                    <h4 className="text-sm font-semibold">What's included:</h4>
                    <ul className="space-y-2">
                      {plan.features.map((feature, index) => (
                        <li key={index} className="flex items-start gap-2 text-sm">
                          <CheckCircle className="h-4 w-4 mt-1 text-green-500 flex-shrink-0" />
                          <span>{feature}</span>
                        </li>
                      ))}
                    </ul>
                    
                    {plan.limited && plan.limited.length > 0 && (
                      <div className="mt-4">
                        <h4 className="text-sm font-semibold text-muted-foreground">Limitations:</h4>
                        <ul className="space-y-2 mt-2">
                          {plan.limited.map((limitation, index) => (
                            <li key={index} className="flex items-start gap-2 text-sm text-muted-foreground">
                              <AlertCircle className="h-4 w-4 mt-1 flex-shrink-0" />
                              <span>{limitation}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                </CardContent>
                
                <CardFooter>
                  <Button 
                    variant={plan.highlighted ? "default" : "outline"}
                    className="w-full"
                    disabled={plan.disabled}
                    onClick={() => handleSelectPlan(plan.id)}
                  >
                    {plan.cta}
                  </Button>
                </CardFooter>
              </Card>
            );
          })}
        </div>
        
        {/* FAQ section */}
        <div className="mt-16 text-left max-w-3xl mx-auto">
          <h2 className="text-2xl font-bold mb-6 text-center">Frequently Asked Questions</h2>
          
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-semibold mb-2">Can I change plans later?</h3>
              <p className="text-muted-foreground">
                Yes, you can upgrade, downgrade, or cancel your plan at any time. Changes will take effect at the end of your current billing cycle.
              </p>
            </div>
            
            <div>
              <h3 className="text-lg font-semibold mb-2">How do refunds work?</h3>
              <p className="text-muted-foreground">
                If you're not satisfied with your subscription, you can request a refund within the first 14 days of your subscription. Contact our support team for assistance.
              </p>
            </div>
            
            <div>
              <h3 className="text-lg font-semibold mb-2">What payment methods do you accept?</h3>
              <p className="text-muted-foreground">
                We accept all major credit cards, including Visa, Mastercard, American Express, and Discover. We also support PayPal.
              </p>
            </div>
            
            <div>
              <h3 className="text-lg font-semibold mb-2">Do you offer discounts for students?</h3>
              <p className="text-muted-foreground">
                Yes, we offer a 50% discount on Pro plans for students with a valid school email address. Contact our support team with your school ID for verification.
              </p>
            </div>
          </div>
        </div>
        
        {/* CTA section */}
        <div className="mt-16 p-8 bg-muted rounded-xl">
          <h2 className="text-2xl font-bold mb-4">Start Tracking Today</h2>
          <p className="text-muted-foreground mb-6 max-w-xl mx-auto">
            Join thousands of smart shoppers who never overpay. Start tracking prices and save money on your favorite products.
          </p>
          <div className="flex gap-4 justify-center">
            <Button onClick={() => router.push("/auth/register")}>
              Create Free Account
            </Button>
            <Button variant="outline" onClick={() => router.push("/contact")}>
              Contact Sales
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
