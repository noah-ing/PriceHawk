import { PrismaClient, Prisma } from '@prisma/client';

// PrismaClient is attached to the `global` object in development to prevent
// exhausting your database connection limit.
// Learn more: https://pris.ly/d/help/next-prisma-client-js-errors

const globalForPrisma = global as unknown as { prisma: PrismaClient };

// Configure connection pooling for PostgreSQL
const prismaClientSingleton = () => {
  // Standard logging configuration
  const logLevels = process.env.NODE_ENV === 'development' 
    ? ['query', 'error', 'warn'] as Prisma.LogLevel[]
    : ['error'] as Prisma.LogLevel[];
  
  console.log('[Prisma] Initializing client with database URL:', 
    process.env.DATABASE_URL?.replace(/\/\/.*:.*@/, '//***:***@'));
    
  // Create client with optimized PostgreSQL connection pooling
  // Connection pooling is configured via the connection string parameters
  // and via Prisma's built-in connection handling
  
  // Get the existing DATABASE_URL
  let connectionUrl = process.env.DATABASE_URL || '';
  
  // Add connection pooling parameters if they don't already exist
  // These parameters will be passed to PostgreSQL
  if (!connectionUrl.includes('connection_limit=')) {
    connectionUrl += connectionUrl.includes('?') ? '&' : '?';
    connectionUrl += 'connection_limit=20&pool_timeout=30&idle_timeout=600&connect_timeout=10';
  }
  
  const client = new PrismaClient({
    log: logLevels,
    datasources: {
      db: {
        url: connectionUrl,
      },
    },
  });
  
  // Only test connection when not in build/CI environment
  if (process.env.NEXT_PHASE !== 'phase-production-build' && process.env.CI !== 'true') {
    // In runtime environments, test the connection
    client.$connect()
      .then(() => console.log('[Prisma] Initial connection successful'))
      .catch((error: unknown) => console.error('[Prisma] Initial connection failed:', error));
  } else {
    console.log('[Prisma] Skipping database connection test during build phase');
  }

  // Add middleware for logging and diagnostics
  client.$use(async (params: any, next: any) => {
    const before = Date.now();
    try {
      const result = await next(params);
      const after = Date.now();
      
      // Log slow queries in development
      if (process.env.NODE_ENV === 'development' && (after - before) > 200) {
        console.log(`[Prisma] Slow query (${after - before}ms): ${params.model}.${params.action}`);
      }
      
      return result;
    } catch (error: unknown) {
      // Enhanced error logging
      console.error(`[Prisma] Error in ${params.model}.${params.action}:`, error);
      
      // Handle JWT null payload errors explicitly
      const errorMessage = (error as any)?.message || '';
      if (errorMessage.includes('payload') && errorMessage.includes('null')) {
        console.error('[Prisma] JWT null payload error detected - this is likely an authentication issue.');
        // Return empty result instead of throwing to prevent cascade failures
        if (params.action === 'findUnique' || params.action === 'findFirst' || params.action === 'findMany') {
          return params.action === 'findMany' ? [] : null;
        }
      }
      
      // Add connection diagnostics for certain types of errors
      const prismaError = error as any;
      if (prismaError.code && typeof prismaError.code === 'string' && prismaError.code.startsWith('P')) {
        console.error('[Prisma] Connection details:', {
          url: process.env.DATABASE_URL?.replace(/\/\/.*:.*@/, '//***:***@'), // Redact credentials
          model: params.model,
          operation: params.action,
          args: JSON.stringify(params.args).slice(0, 200) + '...' // Limit size for logging
        });
      }
      
      throw error;
    }
  });

  return client;
};

// Create and export the Prisma client
export const prisma = globalForPrisma.prisma || prismaClientSingleton();

// In development, attach to global to prevent multiple client instances
if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma;

// Handle graceful shutdown to properly close database connections
process.on('beforeExit', async () => {
  await prisma.$disconnect();
});

// Handle unexpected errors to ensure proper disconnection
process.on('uncaughtException', async (error) => {
  console.error('[Prisma] Uncaught exception, disconnecting client:', error);
  await prisma.$disconnect();
});
