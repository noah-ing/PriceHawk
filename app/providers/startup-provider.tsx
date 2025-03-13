'use client';

import { useEffect, useState } from 'react';

/**
 * StartupProvider Component
 * 
 * This component initializes application services by calling the startup API route.
 * It should be included in the app's root layout to ensure services are started.
 */
export function StartupProvider() {
  const [initialized, setInitialized] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Only run once
    if (initialized) return;

    const initializeServices = async () => {
      try {
        const timestamp = new Date().getTime(); // Add timestamp to prevent caching
        const response = await fetch(`/api/startup?t=${timestamp}`);
        
        if (!response.ok) {
          throw new Error(`Failed to initialize services: ${response.status}`);
        }
        
        const result = await response.json();
        
        if (!result.success) {
          throw new Error(result.message || 'Unknown error during initialization');
        }
        
        console.log('Services initialized successfully');
        setInitialized(true);
      } catch (err) {
        console.error('Error initializing services:', err);
        setError(err instanceof Error ? err.message : 'Unknown error');
      }
    };
    
    // Initialize services when the component mounts
    initializeServices();
  }, [initialized]);

  return null; // This component doesn't render anything
}
