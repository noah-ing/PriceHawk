"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useSession } from "next-auth/react";
import Link from "next/link";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { CheckCircle2, TrendingDown, ShoppingCart, Bell, Search, ArrowRight, ExternalLink } from "lucide-react";

// Interface for search parameters
interface SearchParams {
  [key: string]: string | string[] | undefined;
}

// Client component for home page
export default function HomeClient({ 
  initialSearchParams 
}: { 
  initialSearchParams: SearchParams
}) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { data: session, status } = useSession();
  
  const [url, setUrl] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Handle URL submission
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!url.trim()) return;
    
    setIsSubmitting(true);
    
    // In a real app, we would validate the URL format here
    // For now, just redirect to the products page with the URL as a query parameter
    router.push(`/products?url=${encodeURIComponent(url)}`);
  };

  // Sample feature list
  const features = [
    {
      icon: <ShoppingCart className="h-5 w-5 text-blue-500" />,
      title: "Track unlimited products",
      description: "Track prices across major retailers including Amazon, Best Buy, Walmart, and more."
    },
    {
      icon: <Bell className="h-5 w-5 text-yellow-500" />,
      title: "Get price drop alerts",
      description: "Receive instant notifications when prices drop on your tracked items."
    },
    {
      icon: <TrendingDown className="h-5 w-5 text-green-500" />,
      title: "View price history",
      description: "See detailed price history charts to identify trends and best times to buy."
    }
  ];
  
  // Sample testimonials
  const testimonials = [
    {
      quote: "This app helped me save over $200 on my new TV by alerting me when the price dropped!",
      name: "Sarah J.",
      title: "Verified User"
    },
    {
      quote: "As a bargain hunter, the price history feature is invaluable for finding the best deals.",
      name: "Michael T.",
      title: "Premium Subscriber"
    },
    {
      quote: "The email alerts are so convenient. I no longer have to manually check prices every day.",
      name: "Lisa R.",
      title: "Verified User"
    }
  ];

  return (
    <div>
      {/* Hero section */}
      <section className="bg-gradient-to-b from-gray-50 to-white py-20">
        <div className="container mx-auto px-4 text-center">
          <Badge className="mb-4">Version 1.0</Badge>
          <h1 className="text-4xl md:text-5xl font-extrabold mb-6">
            Never Overpay Again with 
            <span className="text-primary"> Price Tracker</span>
          </h1>
          <p className="text-xl text-muted-foreground mb-10 max-w-3xl mx-auto">
            Track prices across major online retailers, get alerts when prices drop, 
            and make smarter purchasing decisions with historical price data.
          </p>
          
          {/* URL input form */}
          <div className="max-w-2xl mx-auto mb-10">
            <form onSubmit={handleSubmit} className="flex flex-col sm:flex-row gap-2">
              <Input 
                type="text" 
                placeholder="Paste product URL to start tracking..." 
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                className="flex-1"
              />
              <Button type="submit" disabled={isSubmitting || !url.trim()}>
                {isSubmitting ? "Processing..." : "Track Price"}
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </form>
            <p className="text-xs text-muted-foreground mt-2">
              Works with Amazon, Best Buy, Walmart, and many more retailers
            </p>
          </div>
          
          {/* CTA buttons */}
          <div className="flex flex-wrap justify-center gap-4 mb-12">
            {status === "authenticated" ? (
              <Button size="lg" onClick={() => router.push("/dashboard")}>
                Go to Dashboard
              </Button>
            ) : (
              <>
                <Button size="lg" onClick={() => router.push("/auth/register")}>
                  Sign Up Free
                </Button>
                <Button variant="outline" size="lg" onClick={() => router.push("/auth/signin")}>
                  Log In
                </Button>
              </>
            )}
          </div>
          
          {/* Stats */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-4xl mx-auto">
            <div className="bg-white p-6 rounded-lg shadow-sm">
              <p className="text-3xl font-bold">2,500+</p>
              <p className="text-muted-foreground">Products Tracked</p>
            </div>
            <div className="bg-white p-6 rounded-lg shadow-sm">
              <p className="text-3xl font-bold">$156,000+</p>
              <p className="text-muted-foreground">Money Saved</p>
            </div>
            <div className="bg-white p-6 rounded-lg shadow-sm">
              <p className="text-3xl font-bold">1,200+</p>
              <p className="text-muted-foreground">Happy Users</p>
            </div>
          </div>
        </div>
      </section>
      
      {/* Features section */}
      <section className="py-20 bg-white">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold mb-4">Why Choose Price Tracker?</h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              Our powerful features help you make smarter purchasing decisions and save money
            </p>
          </div>
          
          <div className="grid md:grid-cols-3 gap-10">
            {features.map((feature, index) => (
              <div key={index} className="text-center">
                <div className="bg-primary/10 rounded-full p-4 inline-flex mb-6">
                  {feature.icon}
                </div>
                <h3 className="text-xl font-semibold mb-3">{feature.title}</h3>
                <p className="text-muted-foreground">{feature.description}</p>
              </div>
            ))}
          </div>
          
          <div className="mt-16 text-center">
            <Button size="lg" onClick={() => router.push("/pricing")}>
              View All Features
            </Button>
          </div>
        </div>
      </section>
      
      {/* How it works section */}
      <section className="py-20 bg-gray-50">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold mb-4">How It Works</h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              Start saving money in three simple steps
            </p>
          </div>
          
          <div className="grid md:grid-cols-3 gap-10 max-w-4xl mx-auto">
            <div className="flex flex-col items-center text-center">
              <div className="bg-primary text-white rounded-full w-12 h-12 flex items-center justify-center mb-6 text-xl font-bold">1</div>
              <h3 className="text-xl font-semibold mb-3">Paste Product URL</h3>
              <p className="text-muted-foreground">Copy the URL of any product from a supported retailer</p>
            </div>
            
            <div className="flex flex-col items-center text-center">
              <div className="bg-primary text-white rounded-full w-12 h-12 flex items-center justify-center mb-6 text-xl font-bold">2</div>
              <h3 className="text-xl font-semibold mb-3">Set Price Alerts</h3>
              <p className="text-muted-foreground">Choose your target price or percentage drop to be notified</p>
            </div>
            
            <div className="flex flex-col items-center text-center">
              <div className="bg-primary text-white rounded-full w-12 h-12 flex items-center justify-center mb-6 text-xl font-bold">3</div>
              <h3 className="text-xl font-semibold mb-3">Get Notified</h3>
              <p className="text-muted-foreground">Receive alerts via email or SMS when prices drop</p>
            </div>
          </div>
          
          <div className="mt-16 text-center">
            <Button variant="outline" size="lg" onClick={() => router.push("/scraper-test")}>
              Try Demo
            </Button>
          </div>
        </div>
      </section>
      
      {/* Testimonials section */}
      <section className="py-20 bg-white">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold mb-4">What Our Users Say</h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              Join thousands of smart shoppers who never overpay
            </p>
          </div>
          
          <div className="grid md:grid-cols-3 gap-8">
            {testimonials.map((testimonial, index) => (
              <Card key={index}>
                <CardContent className="pt-6">
                  <div className="flex text-yellow-400 mb-4">
                    {[...Array(5)].map((_, i) => (
                      <svg key={i} xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5">
                        <path fillRule="evenodd" d="M10.788 3.21c.448-1.077 1.976-1.077 2.424 0l2.082 5.007 5.404.433c1.164.093 1.636 1.545.749 2.305l-4.117 3.527 1.257 5.273c.271 1.136-.964 2.033-1.96 1.425L12 18.354 7.373 21.18c-.996.608-2.231-.29-1.96-1.425l1.257-5.273-4.117-3.527c-.887-.76-.415-2.212.749-2.305l5.404-.433 2.082-5.006z" clipRule="evenodd" />
                      </svg>
                    ))}
                  </div>
                  <p className="italic mb-6">"{testimonial.quote}"</p>
                  <div>
                    <p className="font-semibold">{testimonial.name}</p>
                    <p className="text-sm text-muted-foreground">{testimonial.title}</p>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>
      
      {/* CTA section */}
      <section className="py-20 bg-primary/10">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-3xl font-bold mb-6">Ready to Start Saving?</h2>
          <p className="text-xl text-muted-foreground mb-10 max-w-3xl mx-auto">
            Join thousands of smart shoppers who never overpay on their online purchases.
            Sign up for free and start tracking prices today!
          </p>
          
          <div className="flex flex-wrap justify-center gap-4">
            {status === "authenticated" ? (
              <Button size="lg" onClick={() => router.push("/dashboard")}>
                Go to Dashboard
              </Button>
            ) : (
              <>
                <Button size="lg" onClick={() => router.push("/auth/register")}>
                  Create Free Account
                </Button>
                <Button variant="outline" size="lg" onClick={() => router.push("/pricing")}>
                  View Pricing Plans
                </Button>
              </>
            )}
          </div>
        </div>
      </section>
    </div>
  );
}
