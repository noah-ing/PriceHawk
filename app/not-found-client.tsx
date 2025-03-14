"use client";

import Link from "next/link";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { FileSearch } from "lucide-react";

// Client component for 404 Not Found page
export default function NotFoundClient() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="w-full max-w-md">
        <Card className="shadow-lg">
          <CardHeader className="space-y-1">
            <div className="flex justify-center mb-4">
              <FileSearch className="h-16 w-16 text-primary" />
            </div>
            <CardTitle className="text-3xl font-bold text-center">Page Not Found</CardTitle>
            <CardDescription className="text-center text-base">
              Oops! We couldn't find the page you're looking for.
            </CardDescription>
          </CardHeader>
          
          <CardContent className="space-y-4 text-center">
            <p className="text-muted-foreground">
              The page you requested may have been moved, deleted, or maybe never existed.
            </p>
            
            <div className="bg-muted p-4 rounded-md text-sm">
              <p className="font-medium mb-1">Possible reasons:</p>
              <ul className="list-disc pl-5 text-left">
                <li>The URL might be misspelled</li>
                <li>The page might have been removed</li>
                <li>You might not have permission to view this page</li>
              </ul>
            </div>
          </CardContent>
          
          <CardFooter className="flex flex-col space-y-3">
            <Button asChild size="lg" className="w-full">
              <Link href="/">
                Return to Home
              </Link>
            </Button>
            
            <div className="flex justify-center space-x-4 text-sm">
              <Link href="/products" className="text-primary hover:underline">
                Browse Products
              </Link>
              <span className="text-muted-foreground">•</span>
              <Link href="/contact" className="text-primary hover:underline">
                Contact Support
              </Link>
            </div>
          </CardFooter>
        </Card>
      </div>
    </div>
  );
}
