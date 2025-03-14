"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { AlertCircle, Mail } from "lucide-react";

// Client component for verification required page
export default function VerificationRequiredClient({ email }: { email?: string }) {
  const router = useRouter();
  const [isResending, setIsResending] = useState(false);
  const [resendSuccess, setResendSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Handler for resending verification email
  const handleResendVerification = async () => {
    if (!email) {
      setError("Email address is missing. Please go back to sign in.");
      return;
    }

    setIsResending(true);
    setError(null);
    setResendSuccess(false);

    try {
      // API call to resend verification email
      const response = await fetch('/api/auth/resend-verification', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error?.message || 'Failed to resend verification email');
      }

      setResendSuccess(true);
    } catch (err) {
      console.error('Error resending verification email:', err);
      setError(
        err instanceof Error
          ? err.message
          : 'An error occurred while resending the verification email. Please try again.'
      );
    } finally {
      setIsResending(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="w-full max-w-md">
        <Card>
          <CardHeader className="space-y-1">
            <div className="flex justify-center mb-4">
              <Mail className="h-12 w-12 text-primary" />
            </div>
            <CardTitle className="text-2xl font-bold text-center">Verification Required</CardTitle>
            <CardDescription className="text-center">
              Please verify your email address to continue
            </CardDescription>
          </CardHeader>

          <CardContent className="space-y-4">
            <div className="text-center text-sm text-muted-foreground">
              <p>
                We've sent a verification email to <span className="font-medium">{email || "your email address"}</span>.
              </p>
              <p className="mt-2">
                Please check your inbox and click on the verification link to activate your account.
              </p>
            </div>

            {error && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertTitle>Error</AlertTitle>
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            {resendSuccess && (
              <Alert className="bg-green-50 text-green-800 border-green-200">
                <AlertCircle className="h-4 w-4" />
                <AlertTitle>Email Sent</AlertTitle>
                <AlertDescription>
                  We've sent a new verification email to {email}. Please check your inbox.
                </AlertDescription>
              </Alert>
            )}
          </CardContent>

          <CardFooter className="flex flex-col space-y-4">
            <Button 
              onClick={handleResendVerification} 
              disabled={isResending || resendSuccess} 
              className="w-full"
            >
              {isResending ? "Sending..." : resendSuccess ? "Email Sent" : "Resend Verification Email"}
            </Button>
            <div className="text-sm text-center space-y-2">
              <div>
                <Link href="/auth/signin" className="text-primary hover:underline">
                  Back to Sign In
                </Link>
              </div>
              <div>
                <span className="text-muted-foreground">
                  Need help?{" "}
                  <Link href="/contact" className="text-primary hover:underline">
                    Contact Support
                  </Link>
                </span>
              </div>
            </div>
          </CardFooter>
        </Card>
      </div>
    </div>
  );
}
