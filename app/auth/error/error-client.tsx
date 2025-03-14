"use client";

import Link from "next/link";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { AlertCircle } from "lucide-react";

// Function to get a user-friendly error message
function getErrorMessage(errorCode?: string): string {
  if (!errorCode) {
    return "An unknown authentication error occurred.";
  }

  // Map error codes to user-friendly messages
  const errorMessages: Record<string, string> = {
    OAuthSignin: "There was an error when signing in with your provider.",
    OAuthCallback: "There was an error when processing the authentication callback.",
    OAuthCreateAccount: "There was an error creating your account with the provider.",
    EmailCreateAccount: "There was an error creating your account with the email provided.",
    Callback: "There was an error during the authentication callback.",
    OAuthAccountNotLinked: "This email is already associated with another account. Please sign in using your original method.",
    EmailSignin: "There was an error sending the sign-in email. Please try again.",
    CredentialsSignin: "The email or password you entered is incorrect.",
    SessionRequired: "You need to be signed in to access this page.",
    Configuration: "There is a problem with the server configuration.",
    AccessDenied: "You do not have permission to access this resource.",
    Verification: "The verification link you used is invalid or has expired.",
    Default: "An authentication error occurred."
  };

  return errorMessages[errorCode] || `Authentication error: ${errorCode}`;
}

// Main error display component
export default function ErrorClient({ errorCode }: { errorCode?: string }) {
  const errorMessage = getErrorMessage(errorCode);

  return (
    <div className="flex min-h-screen items-center justify-center bg-muted/10 p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-1">
          <CardTitle className="text-2xl font-bold text-center">Authentication Error</CardTitle>
          <CardDescription className="text-center">
            There was a problem signing you in
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Alert variant="destructive" className="mb-4">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Error</AlertTitle>
            <AlertDescription>{errorMessage}</AlertDescription>
          </Alert>
        </CardContent>
        <CardFooter className="flex flex-col space-y-4">
          <Button asChild className="w-full">
            <Link href="/auth/signin">Return to Sign In</Link>
          </Button>
          <div className="text-sm text-center">
            <Link href="/" className="text-muted-foreground hover:text-foreground">
              Return to Home
            </Link>
          </div>
        </CardFooter>
      </Card>
    </div>
  );
}
