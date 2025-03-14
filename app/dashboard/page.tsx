"use client";

// Skip static generation - force dynamic rendering
export const dynamic = 'force-dynamic';

import { redirect } from "next/navigation";
import { useState, useEffect } from "react";
import Dashboard from "../../dashboard";
import DropshipperDashboardPage from "./dropshipper-page";
import { useSession } from "next-auth/react";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";

export default function DashboardPage() {
  // Use { required: true } to automatically redirect to sign-in page if not authenticated
  const { data: session, status } = useSession({ required: true });
  
  // State to track which dashboard view to show
  const [isDropshipperView, setIsDropshipperView] = useState(false);
  
  // Load user preference from localStorage on component mount
  useEffect(() => {
    const savedPreference = localStorage.getItem('dashboardView');
    if (savedPreference === 'dropshipper') {
      setIsDropshipperView(true);
    }
  }, []);
  
  // Save preference to localStorage when it changes
  useEffect(() => {
    localStorage.setItem('dashboardView', isDropshipperView ? 'dropshipper' : 'standard');
  }, [isDropshipperView]);
  
  // Simple loading state while checking authentication
  if (status === "loading") {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
      </div>
    );
  }
  
  return (
    <div className="flex flex-col min-h-screen">
      {/* View Toggle */}
      <div className="fixed top-2 right-2 z-50 bg-white/80 dark:bg-gray-900/90 backdrop-blur-sm p-2 rounded-lg shadow-md flex items-center space-x-2">
        <Switch 
          id="dashboard-view-toggle" 
          checked={isDropshipperView}
          onCheckedChange={setIsDropshipperView}
        />
        <Label htmlFor="dashboard-view-toggle" className="text-xs font-medium">
          {isDropshipperView ? 'Dropshipper View' : 'Standard View'}
        </Label>
      </div>
      
      {/* Dashboard Content */}
      {isDropshipperView ? <DropshipperDashboardPage /> : <Dashboard />}
    </div>
  );
}
