"use client";

// Skip static generation - force dynamic rendering
export const dynamic = 'force-dynamic';

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Skeleton } from "@/components/ui/skeleton";
import { CheckCircle2, AlertTriangle, XCircle } from "lucide-react";
import Link from "next/link";

enum VerificationStatus {
  LOADING = "loading",
  SUCCESS = "success",
  ERROR = "error",
}

export default function VerifyEmailPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [status, setStatus] = useState<VerificationStatus>(VerificationStatus.LOADING);
  const [error, setError] = useState<string | null>(null);
  
  useEffect(() => {
    const verifyEmail = async () => {
      const token = searchParams.get("token");
      
      if (!token) {
        setStatus(VerificationStatus.ERROR);
        setError("Verification token is missing.");
        return;
      }
      
      try {
        const response = await fetch(`/api/auth/verify-email?token=${token}`);
        const data = await response.json();
        
        if (data.success) {
          setStatus(VerificationStatus.SUCCESS);
        } else {
          setStatus(VerificationStatus.ERROR);
          setError(data.error || "Failed to verify email. The link may be invalid or expired.");
        }
      } catch (err) {
        console.error("Error verifying email:", err);
        setStatus(VerificationStatus.ERROR);
        setError("An unexpected error occurred. Please try again.");
      }
    };
    
    verifyEmail();
  }, [searchParams]);
  
  return (
    <div className="container mx-auto py-8 px-4 flex items-center justify-center min-h-[80vh]">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle className="text-2xl">Email Verification</CardTitle>
          <CardDescription>
            {status === VerificationStatus.LOADING && "Verifying your email address..."}
            {status === VerificationStatus.SUCCESS && "Your email has been verified!"}
            {status === VerificationStatus.ERROR && "Verification Failed"}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {status === VerificationStatus.LOADING && (
            <div className="flex flex-col items-center justify-center py-8">
              <Skeleton className="h-12 w-12 rounded-full mb-4" />
              <Skeleton className="h-4 w-3/4 mb-2" />
              <Skeleton className="h-4 w-1/2" />
            </div>
          )}
          
          {status === VerificationStatus.SUCCESS && (
            <div className="flex flex-col items-center justify-center py-8">
              <CheckCircle2 className="h-16 w-16 text-green-500 mb-4" />
              <p className="text-center mb-4">
                Thank you for verifying your email address. Your account is now fully activated.
              </p>
              <p className="text-sm text-gray-500 text-center">
                You can now access all features of PriceHawk.
              </p>
            </div>
          )}
          
          {status === VerificationStatus.ERROR && (
            <div className="flex flex-col items-center justify-center py-4">
              <XCircle className="h-16 w-16 text-red-500 mb-4" />
              <Alert variant="destructive" className="mb-4">
                <AlertTriangle className="h-4 w-4" />
                <AlertTitle>Verification Failed</AlertTitle>
                <AlertDescription>{error}</AlertDescription>
              </Alert>
              <p className="text-sm text-gray-500 text-center">
                Please try again or request a new verification email.
              </p>
            </div>
          )}
        </CardContent>
        <CardFooter className="flex justify-center">
          {status === VerificationStatus.LOADING && (
            <Skeleton className="h-10 w-32" />
          )}
          
          {status === VerificationStatus.SUCCESS && (
            <Button asChild>
              <Link href="/">
                Go to Dashboard
              </Link>
            </Button>
          )}
          
          {status === VerificationStatus.ERROR && (
            <div className="flex flex-col w-full gap-2">
              <Button asChild variant="outline" className="w-full">
                <Link href="/auth/signin">
                  Sign In
                </Link>
              </Button>
              <Button asChild className="w-full">
                <Link href="/auth/register">
                  Register Again
                </Link>
              </Button>
            </div>
          )}
        </CardFooter>
      </Card>
    </div>
  );
}
