"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import { NavBar } from "@/components/nav-bar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import Link from "next/link";

// This is a simple placeholder for category pages
export default function CategoryPage() {
  const params = useParams();
  const slug = params?.slug as string;
  const [categoryName, setCategoryName] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    // Format the category name for display (capitalize first letter, replace hyphens with spaces)
    if (slug) {
      setCategoryName(
        slug
          .split("-")
          .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
          .join(" ")
      );
    }
  }, [slug]);

  const getCategoryDescription = () => {
    switch (slug) {
      case "electronics":
        return "Track prices for electronics, including smartphones, laptops, TVs, and more.";
      case "fashion":
        return "Stay updated on price changes for clothing, shoes, accessories, and more.";
      case "home":
        return "Monitor prices for home and kitchen appliances, furniture, and decor.";
      default:
        return "Track prices for products in this category.";
    }
  };

  return (
    <div className="flex min-h-screen w-full bg-muted/10">
      <NavBar />

      <div className="flex flex-1 flex-col">
        <main className="flex-1 p-6">
          <div className="flex flex-col gap-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <Button variant="outline" asChild>
                  <Link href="/">
                    <span className="mr-2">🏠</span>
                    Home
                  </Link>
                </Button>
                <h1 className="text-3xl font-bold tracking-tight">{categoryName}</h1>
              </div>
            </div>

            <Card>
              <CardHeader>
                <CardTitle>{categoryName} Products</CardTitle>
                <CardDescription>{getCategoryDescription()}</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex flex-col items-center justify-center py-8 text-center">
                  <p className="max-w-[600px] text-lg text-muted-foreground">
                    Category browsing functionality will be available in the next update.
                    For now, you can add products directly from the dashboard by pasting product URLs.
                  </p>
                </div>
              </CardContent>
              <CardFooter className="flex justify-between">
                <Button variant="outline" asChild>
                  <Link href="/">Back to Dashboard</Link>
                </Button>
                <Button asChild>
                  <Link href="/products">View Your Products</Link>
                </Button>
              </CardFooter>
            </Card>
          </div>
        </main>
      </div>
    </div>
  );
}
