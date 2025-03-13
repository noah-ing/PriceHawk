import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db/prisma';
import { ErrorService, ErrorDefinitions } from '@/lib/services/error-service';

/**
 * Health check endpoint for monitoring application health
 * 
 * Checks:
 * 1. Database connectivity
 * 2. API functionality
 * 3. Environment configuration
 */
export async function GET(req: NextRequest) {
  const startTime = performance.now();
  const checks = {
    database: false,
    api: true,
    environment: checkRequiredEnvVars()
  };
  
  let overallStatus = 'healthy';
  
  try {
    // Test database connection
    await prisma.$queryRaw`SELECT 1 as health_check`;
    checks.database = true;
  } catch (error) {
    overallStatus = 'unhealthy';
    ErrorService.logError(ErrorService.normalizeError(error));
  }
  
  // Check for any failed checks
  if (Object.values(checks).includes(false)) {
    overallStatus = 'unhealthy';
  }
  
  const endTime = performance.now();
  const responseTimeMs = Math.round(endTime - startTime);
  
  const response = {
    status: overallStatus,
    timestamp: new Date().toISOString(),
    version: process.env.NEXT_PUBLIC_APP_VERSION || '1.0.0',
    environment: process.env.NODE_ENV,
    responseTimeMs,
    checks,
    uptime: process.uptime(),
  };
  
  // Return appropriate status code based on health
  const statusCode = overallStatus === 'healthy' ? 200 : 503;
  
  return NextResponse.json(response, { 
    status: statusCode,
    headers: {
      'Cache-Control': 'no-store, max-age=0',
    }
  });
}

/**
 * Check that required environment variables are set
 */
function checkRequiredEnvVars(): boolean {
  const requiredVars = [
    'DATABASE_URL',
    'NEXTAUTH_SECRET',
    'NEXTAUTH_URL',
  ];
  
  const optionalProductionVars = [
    'STRIPE_SECRET_KEY',
    'STRIPE_PUBLISHABLE_KEY',
    'NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY',
    'STRIPE_WEBHOOK_SECRET',
    'SENDGRID_API_KEY',
    'SENDGRID_FROM_EMAIL',
  ];
  
  // Add production-only vars if in production
  const varsToCheck = process.env.NODE_ENV === 'production' 
    ? [...requiredVars, ...optionalProductionVars]
    : requiredVars;
  
  const missingVars = varsToCheck.filter(varName => !process.env[varName]);
  
  if (missingVars.length > 0 && process.env.NODE_ENV === 'production') {
    console.warn(`Health check: Missing environment variables: ${missingVars.join(', ')}`);
    return false;
  }
  
  return true;
}

/**
 * We include a HEAD method for lightweight health checks
 * This is useful for infrastructure monitoring that doesn't need the full health data
 */
export async function HEAD() {
  try {
    await prisma.$queryRaw`SELECT 1 as health_check`;
    return new Response(null, { status: 200 });
  } catch (error) {
    return new Response(null, { status: 503 });
  }
}
