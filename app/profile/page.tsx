"use client";

// Skip static generation - force dynamic rendering
export const dynamic = 'force-dynamic';

import { useState, Suspense } from 'react';
import { useSession } from 'next-auth/react';
import { useSearchParams } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Separator } from '@/components/ui/separator';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { CheckCircle, AlertCircle, Mail } from 'lucide-react';

// Define the form schema using Zod
const formSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  email: z.string().email('Invalid email address').optional(),
  emailNotifications: z.boolean().default(true),
  weeklyDigest: z.boolean().default(true),
  priceDropAlerts: z.boolean().default(true),
});

// Type for the form values
type FormValues = z.infer<typeof formSchema>;

// The actual Profile component
function ProfileContent() {
  // Even though we don't use searchParams, explicitly declare it 
  // to ensure Next.js properly detects it's within Suspense
  const searchParams = useSearchParams();
  const { data: session, update } = useSession();
  const [isLoading, setIsLoading] = useState(false);
  const [isResendingVerification, setIsResendingVerification] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  
  // Handle resending verification email
  const handleResendVerification = async () => {
    if (!session?.user?.email) {
      setError('Email address is missing. Please try again later.');
      return;
    }
    
    setIsResendingVerification(true);
    setError(null);
    setSuccess(null);
    
    try {
      const response = await fetch('/api/auth/verify-email', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email: session.user.email }),
      });
      
      const data = await response.json();
      
      if (data.success) {
        if (data.alreadyVerified) {
          // If the user is already verified, update the session
          if (session?.user) {
            await update({
              ...session,
              user: {
                ...session.user,
                emailVerified: new Date(),
              },
            });
          }
          setSuccess('Your email is already verified!');
        } else {
          setSuccess('Verification email sent! Please check your inbox.');
        }
      } else {
        throw new Error(data.error || 'Failed to send verification email');
      }
    } catch (err) {
      console.error('Error sending verification email:', err);
      setError(err instanceof Error ? err.message : 'An unexpected error occurred');
    } finally {
      setIsResendingVerification(false);
    }
  };

  // Initialize the form
  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: session?.user?.name || '',
      email: session?.user?.email || '',
      emailNotifications: true,
      weeklyDigest: true,
      priceDropAlerts: true,
    },
  });

  // Handle form submission
  const onSubmit = async (data: FormValues) => {
    setIsLoading(true);
    setError(null);
    setSuccess(null);

    try {
      // In a real implementation, this would call an API endpoint to update the user profile
      // For now, we'll just simulate a successful update
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Update the session with the new name
      if (session?.user) {
        await update({
          ...session,
          user: {
            ...session.user,
            name: data.name,
          },
        });
      }
      
      setSuccess('Profile updated successfully!');
    } catch (err) {
      setError('Failed to update profile. Please try again.');
      console.error('Profile update error:', err);
    } finally {
      setIsLoading(false);
    }
  };

  // Get initials for avatar
  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase();
  };

  return (
    <div className="container mx-auto py-8 px-4">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold mb-2">Your Profile</h1>
        <p className="text-gray-500 mb-8">
          Manage your account information and notification preferences
        </p>

        {error && (
          <Alert variant="destructive" className="mb-4">
            <AlertTitle>Error</AlertTitle>
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}
        
        {success && (
          <Alert variant="default" className="mb-4 bg-green-50 text-green-800 border-green-200">
            <AlertTitle>Success</AlertTitle>
            <AlertDescription>{success}</AlertDescription>
          </Alert>
        )}

        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <div className="md:col-span-1">
            <Card>
              <CardContent className="pt-6 flex flex-col items-center">
                <Avatar className="h-24 w-24 mb-4">
                  <AvatarImage src={session?.user?.image || ""} alt={session?.user?.name || ""} />
                  <AvatarFallback className="text-2xl">
                    {session?.user?.name ? getInitials(session.user.name) : "U"}
                  </AvatarFallback>
                </Avatar>
                <h2 className="text-xl font-semibold">{session?.user?.name || "User"}</h2>
                <p className="text-sm text-gray-500">{session?.user?.email || ""}</p>
                <div className="mt-2">
                  {session?.user?.emailVerified ? (
                    <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200 flex items-center gap-1">
                      <CheckCircle className="h-3 w-3" />
                      Verified
                    </Badge>
                  ) : (
                    <Badge variant="outline" className="bg-amber-50 text-amber-700 border-amber-200 flex items-center gap-1">
                      <AlertCircle className="h-3 w-3" />
                      Not Verified
                    </Badge>
                  )}
                </div>
                <div className="mt-4 text-sm">
                  <p className="text-gray-500">Member since</p>
                  <p>March 2025</p>
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="md:col-span-3">
            <Card>
              <CardHeader>
                <CardTitle>Account Information</CardTitle>
                <CardDescription>
                  Update your personal information
                </CardDescription>
              </CardHeader>
              <CardContent className="pb-2">
                <Form {...form}>
                  <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                    <FormField
                      control={form.control}
                      name="name"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Name</FormLabel>
                          <FormControl>
                            <Input {...field} disabled={isLoading} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={form.control}
                      name="email"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Email</FormLabel>
                          <FormControl>
                            <Input {...field} disabled={true} />
                          </FormControl>
                          <FormMessage />
                          <div className="flex items-center justify-between">
                            <p className="text-sm text-gray-500">Email cannot be changed</p>
                            {!session?.user?.emailVerified && (
                              <Button 
                                variant="outline" 
                                size="sm" 
                                className="text-amber-600 border-amber-200 hover:bg-amber-50"
                                onClick={handleResendVerification}
                                disabled={isResendingVerification}
                              >
                                <Mail className="mr-2 h-4 w-4" />
                                {isResendingVerification ? 'Sending...' : 'Verify Email'}
                              </Button>
                            )}
                          </div>
                        </FormItem>
                      )}
                    />

                    <Separator className="my-6" />
                    
                    <div>
                      <h3 className="text-lg font-medium mb-4">Notification Preferences</h3>
                      
                      <div className="space-y-4">
                        <FormField
                          control={form.control}
                          name="emailNotifications"
                          render={({ field }) => (
                            <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                              <div className="space-y-0.5">
                                <FormLabel className="text-base">Email Notifications</FormLabel>
                                <FormDescription>
                                  Receive notifications via email
                                </FormDescription>
                              </div>
                              <FormControl>
                                <Switch
                                  checked={field.value}
                                  onCheckedChange={field.onChange}
                                  disabled={isLoading}
                                />
                              </FormControl>
                            </FormItem>
                          )}
                        />
                        
                        <FormField
                          control={form.control}
                          name="weeklyDigest"
                          render={({ field }) => (
                            <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                              <div className="space-y-0.5">
                                <FormLabel className="text-base">Weekly Digest</FormLabel>
                                <FormDescription>
                                  Receive a weekly summary of price changes
                                </FormDescription>
                              </div>
                              <FormControl>
                                <Switch
                                  checked={field.value}
                                  onCheckedChange={field.onChange}
                                  disabled={isLoading || !form.watch('emailNotifications')}
                                />
                              </FormControl>
                            </FormItem>
                          )}
                        />
                        
                        <FormField
                          control={form.control}
                          name="priceDropAlerts"
                          render={({ field }) => (
                            <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                              <div className="space-y-0.5">
                                <FormLabel className="text-base">Price Drop Alerts</FormLabel>
                                <FormDescription>
                                  Get notified when prices drop to your target
                                </FormDescription>
                              </div>
                              <FormControl>
                                <Switch
                                  checked={field.value}
                                  onCheckedChange={field.onChange}
                                  disabled={isLoading || !form.watch('emailNotifications')}
                                />
                              </FormControl>
                            </FormItem>
                          )}
                        />
                      </div>
                    </div>
                    
                    <div className="flex justify-end">
                      <Button type="submit" disabled={isLoading}>
                        {isLoading ? 'Saving...' : 'Save Changes'}
                      </Button>
                    </div>
                  </form>
                </Form>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}

// Export a Suspense-wrapped component to handle any useSearchParams() calls
export default function ProfilePage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <ProfileContent />
    </Suspense>
  );
}
