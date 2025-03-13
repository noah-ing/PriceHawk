"use client";

// Skip static generation - force dynamic rendering
export const dynamic = 'force-dynamic';

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { AlertTriangle } from "lucide-react";
import Link from "next/link";

export default function AuthErrorPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [error, setError] = useState<string | null>(null);
  
  useEffect(() => {
    // Get error from URL query parameters
    const errorParam = searchParams.get("error");
    
    if (errorParam) {
      // Map error codes to user-friendly messages
      const errorMessages: Record<string, string> = {
        "Configuration": "There is a problem with the server configuration. Please try again later.",
        "AccessDenied": "Access denied. You do not have permission to access this resource.",
        "Verification": "The verification link is invalid or has expired.",
        "Default": "An authentication error occurred. Please try again.",
      };
      
      setError(errorMessages[errorParam] || errorMessages.Default);
    } else {
      setError("An unknown error occurred. Please try again.");
    }
  }, [searchParams]);
  
  return (
    <div className="container mx-auto py-8 px-4 flex items-center justify-center min-h-[80vh]">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle className="text-2xl">Authentication Error</CardTitle>
          <CardDescription>
            There was a problem with your authentication request.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Alert variant="destructive" className="mb-4">
            <AlertTriangle className="h-4 w-4" />
            <AlertTitle>Error</AlertTitle>
            <AlertDescription>{error}</AlertDescription>
          </Alert>
          <p className="text-sm text-gray-500 mb-4">
            Please try signing in again. If the problem persists, contact support.
          </p>
        </CardContent>
        <CardFooter className="flex justify-between">
          <Button variant="outline" onClick={() => router.back()}>
            Go Back
          </Button>
          <Button asChild>
            <Link href="/auth/signin">
              Sign In
            </Link>
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}
