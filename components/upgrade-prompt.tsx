'use client';

import { useRouter } from 'next/navigation';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';

interface UpgradePromptProps {
  open: boolean;
  onClose: () => void;
  feature?: string;
  message?: string;
  tier?: 'BASIC' | 'PREMIUM' | 'PROFESSIONAL';
}

/**
 * A component that displays a prompt to upgrade the user's subscription
 * when they try to access a feature that's not available in their current tier.
 */
export function UpgradePrompt({
  open,
  onClose,
  feature,
  message,
  tier = 'BASIC',
}: UpgradePromptProps) {
  const router = useRouter();
  
  // Format the feature name for display
  const formatFeatureName = (feature?: string) => {
    if (!feature) return 'Premium Feature';
    
    return feature
      .split('_')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  };
  
  // Get the tier display name
  const getTierDisplayName = (tier: string) => {
    switch (tier) {
      case 'BASIC':
        return 'Basic';
      case 'PREMIUM':
        return 'Premium';
      case 'PROFESSIONAL':
        return 'Professional';
      default:
        return tier;
    }
  };
  
  // Get the tier features
  const getTierFeatures = (tier: string) => {
    switch (tier) {
      case 'BASIC':
        return [
          'Track up to 10 products',
          'Up to 5 price alerts per product',
          '90 days of price history',
          'Weekly summary emails',
          'Ad-free experience',
        ];
      case 'PREMIUM':
        return [
          'Track up to 30 products',
          'Unlimited price alerts',
          'Unlimited price history',
          'Daily summary emails',
          'Price trend predictions',
          'Retailer comparison',
          'Deal sharing with friends',
        ];
      case 'PROFESSIONAL':
        return [
          'Track up to 100 products',
          'Unlimited price alerts',
          'Unlimited price history',
          'Real-time notifications',
          'Advanced analytics',
          'API access',
          'Priority support',
          'Custom alert rules',
          'Bulk import/export',
          'Team sharing (up to 3 users)',
        ];
      default:
        return [];
    }
  };
  
  const handleUpgrade = () => {
    onClose();
    router.push('/pricing');
  };
  
  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Upgrade Required</DialogTitle>
          <DialogDescription>
            {message || `The ${formatFeatureName(feature)} is only available on higher subscription tiers.`}
          </DialogDescription>
        </DialogHeader>
        
        <div className="py-4">
          <h3 className="font-medium mb-2">
            Upgrade to {getTierDisplayName(tier)} to unlock:
          </h3>
          <ul className="space-y-1">
            {getTierFeatures(tier).map((feature) => (
              <li key={feature} className="flex items-center">
                <svg className="w-4 h-4 mr-2 text-green-500" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
                {feature}
              </li>
            ))}
          </ul>
        </div>
        
        <DialogFooter className="flex flex-col sm:flex-row sm:justify-between gap-2">
          <Button variant="outline" onClick={onClose}>
            Maybe Later
          </Button>
          <Button onClick={handleUpgrade}>
            View Pricing Plans
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
