/**
 * Monitoring API Route
 * 
 * This API route provides endpoints for controlling the scheduled monitoring system.
 * It allows starting and stopping the monitoring system, as well as running manual price checks.
 */

import { NextRequest, NextResponse } from 'next/server';
import { startMonitoring, stopMonitoring, isMonitoringRunning, runManualPriceCheck } from '@/lib/scheduled-monitoring';

// Define the request body interface for the start endpoint
interface StartMonitoringRequestBody {
  hourlyLimit?: number;
  dailyLimit?: number;
  enableNotifications?: boolean;
}

// Define the request body interface for the manual check endpoint
interface ManualCheckRequestBody {
  limit?: number;
  retryFailedChecks?: boolean;
  notifyAdmins?: boolean;
}

/**
 * POST handler for starting the monitoring system
 * @param request The incoming request
 * @returns The API response
 */
export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    // Parse the request body
    const body: StartMonitoringRequestBody = await request.json();
    
    // Start the monitoring system with the provided options
    startMonitoring({
      hourlyLimit: body.hourlyLimit,
      dailyLimit: body.dailyLimit,
      enableNotifications: body.enableNotifications,
    });
    
    return NextResponse.json({
      success: true,
      message: 'Monitoring system started successfully',
      isRunning: true,
      options: {
        hourlyLimit: body.hourlyLimit || 50,
        dailyLimit: body.dailyLimit || 1000,
        enableNotifications: body.enableNotifications !== false,
      },
    });
  } catch (error) {
    console.error('Error starting monitoring system:', error);
    
    return NextResponse.json(
      {
        success: false,
        message: error instanceof Error ? error.message : 'Failed to start monitoring system',
        isRunning: isMonitoringRunning(),
      },
      { status: 500 }
    );
  }
}

/**
 * DELETE handler for stopping the monitoring system
 * @returns The API response
 */
export async function DELETE(): Promise<NextResponse> {
  try {
    // Stop the monitoring system
    stopMonitoring();
    
    return NextResponse.json({
      success: true,
      message: 'Monitoring system stopped successfully',
      isRunning: false,
    });
  } catch (error) {
    console.error('Error stopping monitoring system:', error);
    
    return NextResponse.json(
      {
        success: false,
        message: error instanceof Error ? error.message : 'Failed to stop monitoring system',
        isRunning: isMonitoringRunning(),
      },
      { status: 500 }
    );
  }
}

/**
 * GET handler for checking the monitoring system status
 * @returns The API response
 */
export async function GET(): Promise<NextResponse> {
  try {
    // Check if the monitoring system is running
    const isRunning = isMonitoringRunning();
    
    return NextResponse.json({
      success: true,
      isRunning,
      message: isRunning ? 'Monitoring system is running' : 'Monitoring system is not running',
    });
  } catch (error) {
    console.error('Error checking monitoring system status:', error);
    
    return NextResponse.json(
      {
        success: false,
        message: error instanceof Error ? error.message : 'Failed to check monitoring system status',
      },
      { status: 500 }
    );
  }
}

/**
 * PATCH handler for running a manual price check
 * @param request The incoming request
 * @returns The API response
 */
export async function PATCH(request: NextRequest): Promise<NextResponse> {
  try {
    // Parse the request body
    const body: ManualCheckRequestBody = await request.json();
    
    // Run a manual price check with the provided parameters
    const result = await runManualPriceCheck(
      body.limit,
      body.retryFailedChecks !== false, // Default to true if not specified
      body.notifyAdmins !== false // Default to true if not specified
    );
    
    return NextResponse.json({
      success: true,
      message: 'Manual price check completed successfully',
      result,
    });
  } catch (error) {
    console.error('Error running manual price check:', error);
    
    return NextResponse.json(
      {
        success: false,
        message: error instanceof Error ? error.message : 'Failed to run manual price check',
      },
      { status: 500 }
    );
  }
}
