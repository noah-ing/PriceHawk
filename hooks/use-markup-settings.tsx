"use client";

import { useState, useEffect, useCallback } from 'react';
import { useSession } from 'next-auth/react';
import { useWebSocket } from './use-websocket';

// Settings for product markup
interface MarkupSettings {
  productId: string;
  markupPercentage: number;
}

// Profit calculation results
interface ProfitCalcResult {
  markupPercentage: number;
  profit: number;
  sellingPrice: number;
  profitMargin: number;
  isFavorable: boolean;
}

/**
 * Custom hook for managing markup settings and profit calculations
 * for dropshipping and reselling
 */
export function useMarkupSettings(productId: string) {
  const { data: session } = useSession();
  const { emit, isConnected, on } = useWebSocket();
  const [settings, setSettings] = useState<MarkupSettings | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  /**
   * Fetch markup settings from the API
   */
  const fetchSettings = useCallback(async () => {
    if (!productId || !session?.user?.id) return;
    
    setIsLoading(true);
    setError(null);
    
    try {
      const response = await fetch(`/api/product-settings/${productId}`);
      const data = await response.json();
      
      if (response.ok && data.success) {
        setSettings(data.data);
      } else {
        // If no settings found, use default 30% markup
        setSettings({
          productId,
          markupPercentage: 30,
        });
      }
    } catch (err) {
      console.error('Error fetching markup settings:', err);
      setError('Failed to load markup settings');
      // Set default value on error
      setSettings({
        productId,
        markupPercentage: 30,
      });
    } finally {
      setIsLoading(false);
    }
  }, [productId, session?.user?.id]);

  /**
   * Update markup percentage for a product
   */
  const updateMarkupPercentage = useCallback(async (percentage: number) => {
    if (!productId || !session?.user?.id) {
      setError('You must be logged in to update settings');
      return false;
    }
    
    try {
      // Optimistic update
      setSettings((prev) => {
        if (!prev) return { productId, markupPercentage: percentage };
        return { ...prev, markupPercentage: percentage };
      });
      
      // Send to API
      const response = await fetch(`/api/product-settings/${productId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ markupPercentage: percentage }),
      });
      
      const data = await response.json();
      
      if (!response.ok || !data.success) {
        throw new Error(data.error?.message || 'Failed to update settings');
      }
      
      // Notify others via WebSocket if connected
      if (isConnected) {
        emit('markup:updated', {
          productId,
          markupPercentage: percentage
        });
      }
      
      return true;
    } catch (err) {
      console.error('Error updating markup settings:', err);
      setError('Failed to update markup settings');
      
      // Revert optimistic update
      fetchSettings();
      return false;
    }
  }, [productId, session?.user?.id, emit, isConnected, fetchSettings]);

  /**
   * Calculate profit metrics based on current price and markup settings
   */
  const calculateProfit = useCallback((price: number): ProfitCalcResult => {
    const markupPercentage = settings?.markupPercentage || 30;
    const sellingPrice = price * (1 + markupPercentage / 100);
    const profit = sellingPrice - price;
    const profitMargin = (profit / sellingPrice) * 100;
    
    return {
      markupPercentage,
      sellingPrice,
      profit,
      profitMargin,
      isFavorable: profitMargin >= 20 // Consider 20%+ profit margin as favorable
    };
  }, [settings?.markupPercentage]);

  // Listen for markup updates from other clients
  useEffect(() => {
    if (!isConnected || !productId) return;
    
    const handleMarkupUpdate = (data: any) => {
      if (data.productId === productId) {
        setSettings((prev) => {
          if (!prev) return data;
          return { ...prev, markupPercentage: data.markupPercentage };
        });
      }
    };
    
    // Subscribe to markup updates
    const unsubscribe = on('markup:updated', handleMarkupUpdate);
    
    return () => {
      unsubscribe();
    };
  }, [isConnected, productId, on]);

  // Fetch settings on component mount
  useEffect(() => {
    fetchSettings();
  }, [fetchSettings]);

  return {
    settings,
    isLoading,
    error,
    updateMarkupPercentage,
    calculateProfit,
    fetchSettings
  };
}
