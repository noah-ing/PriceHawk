/**
 * Startup API Route
 * 
 * This API route runs at application startup to initialize services like monitoring.
 * It is called automatically when the app starts.
 */

import { NextResponse } from 'next/server';
import { startMonitoring, isMonitoringRunning } from '@/lib/scheduled-monitoring';

// Initialize flag to avoid duplicate initialization
let initialized = false;

// Initialize the application
function initialize() {
  if (initialized) return;
  
  console.log('Running application startup initialization...');
  
  // Start the monitoring system if it's not already running
  if (!isMonitoringRunning()) {
    console.log('Starting monitoring system on application startup');
    
    // Start with default options
    startMonitoring({
      hourlyLimit: 50,
      dailyLimit: 1000,
      enableNotifications: true,
    });
  } else {
    console.log('Monitoring system is already running');
  }
  
  initialized = true;
  console.log('Application startup initialization complete');
}

// Call initialize function
initialize();

/**
 * GET handler for the startup route
 * @returns The API response
 */
export async function GET(): Promise<NextResponse> {
  try {
    initialize();
    
    return NextResponse.json({
      success: true,
      message: 'Application initialized successfully',
      isMonitoringRunning: isMonitoringRunning(),
    });
  } catch (error) {
    console.error('Error during application startup:', error);
    
    return NextResponse.json(
      {
        success: false,
        message: error instanceof Error ? error.message : 'Failed to initialize application',
      },
      { status: 500 }
    );
  }
}
