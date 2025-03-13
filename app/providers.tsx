// This file is no longer used as we've moved providers directly to layout.tsx
// to fix hydration mismatches with the theme

"use client";

import { SafeAuthProvider } from "./providers/safe-auth-provider";
import { SubscriptionProvider } from "./providers/subscription-provider";
import { Toaster } from "@/components/ui/toaster";

// NOTE: This component is no longer used.
// Providers are now directly included in layout.tsx to prevent hydration mismatches
export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <SafeAuthProvider>
      <SubscriptionProvider>
        {children}
        <Toaster />
      </SubscriptionProvider>
    </SafeAuthProvider>
  );
}
