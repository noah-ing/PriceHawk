"use client";

// Skip static generation - force dynamic rendering
export const dynamic = 'force-dynamic';

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Skeleton } from "@/components/ui/skeleton";
import { Mail, AlertTriangle, ArrowRight } from "lucide-react";
import Link from "next/link";

export default function VerificationRequiredPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isResending, setIsResending] = useState(false);
  const [resendSuccess, setResendSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const email = searchParams.get("email") || "";
  
  const handleResendVerification = async () => {
    if (!email) {
      setError("Email address is missing. Please sign in again.");
      return;
    }
    
    setIsResending(true);
    setError(null);
    setResendSuccess(false);
    
    try {
      const response = await fetch("/api/auth/verify-email", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email }),
      });
      
      const data = await response.json();
      
      if (data.success) {
        if (data.alreadyVerified) {
          // If the user is already verified, redirect to sign in
          router.push("/auth/signin");
        } else {
          setResendSuccess(true);
        }
      } else {
        throw new Error(data.error || "Failed to resend verification email");
      }
    } catch (err) {
      console.error("Error resending verification email:", err);
      setError(err instanceof Error ? err.message : "An unexpected error occurred");
    } finally {
      setIsResending(false);
    }
  };
  
  return (
    <div className="container mx-auto py-8 px-4 flex items-center justify-center min-h-[80vh]">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle className="text-2xl">Email Verification Required</CardTitle>
          <CardDescription>
            Please verify your email address to continue
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col items-center justify-center py-4">
            <Mail className="h-16 w-16 text-amber-500 mb-4" />
            <p className="text-center mb-4">
              We've sent a verification email to <strong>{email || "your email address"}</strong>. 
              Please check your inbox and click the verification link to activate your account.
            </p>
            <p className="text-sm text-gray-500 text-center mb-4">
              If you don't see the email, please check your spam folder.
            </p>
            
            {error && (
              <Alert variant="destructive" className="mb-4 w-full">
                <AlertTriangle className="h-4 w-4" />
                <AlertTitle>Error</AlertTitle>
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}
            
            {resendSuccess && (
              <Alert variant="default" className="mb-4 w-full bg-green-50 text-green-800 border-green-200">
                <AlertTitle>Success</AlertTitle>
                <AlertDescription>
                  Verification email has been resent. Please check your inbox.
                </AlertDescription>
              </Alert>
            )}
          </div>
        </CardContent>
        <CardFooter className="flex flex-col gap-2">
          <Button 
            onClick={handleResendVerification} 
            disabled={isResending} 
            className="w-full"
          >
            {isResending ? "Sending..." : "Resend Verification Email"}
          </Button>
          <Button variant="outline" asChild className="w-full">
            <Link href="/auth/signin">
              Back to Sign In
            </Link>
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}
