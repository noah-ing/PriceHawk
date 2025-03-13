#!/usr/bin/env node
/**
 * Database Optimization Script
 * 
 * This script applies optimizations to the PostgreSQL database:
 * 1. Creates necessary indexes for common query patterns
 * 2. Updates statistics for the query planner
 * 3. Performs basic maintenance
 * 
 * Usage: 
 *   node scripts/optimize-db.js
 */

// Use ES Modules in Node.js
import { PrismaClient } from '@prisma/client';
import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

const prisma = new PrismaClient();

async function createIndexes() {
  console.log('Creating optimized indexes...');
  
  // Use raw SQL through Prisma to create indexes (only if they don't exist)
  const queries = [
    // Product indexes
    `CREATE INDEX IF NOT EXISTS "Product_userId_idx" ON "Product"("userId")`,
    `CREATE INDEX IF NOT EXISTS "Product_retailer_idx" ON "Product"("retailer")`,
    `CREATE INDEX IF NOT EXISTS "Product_currentPrice_idx" ON "Product"("currentPrice")`,
    
    // Alert indexes
    `CREATE INDEX IF NOT EXISTS "Alert_productId_idx" ON "Alert"("productId")`,
    `CREATE INDEX IF NOT EXISTS "Alert_userId_idx" ON "Alert"("userId")`,
    `CREATE INDEX IF NOT EXISTS "Alert_targetPrice_idx" ON "Alert"("targetPrice")`,
    `CREATE INDEX IF NOT EXISTS "Alert_status_idx" ON "Alert"("status")`,
    
    // PriceHistory indexes
    `CREATE INDEX IF NOT EXISTS "PriceHistory_productId_timestamp_idx" ON "PriceHistory"("productId", "timestamp")`,
    
    // Subscription indexes
    `CREATE INDEX IF NOT EXISTS "User_subscriptionTier_idx" ON "User"("subscriptionTier")`,
    `CREATE INDEX IF NOT EXISTS "User_subscriptionStatus_idx" ON "User"("subscriptionStatus")`,
    `CREATE INDEX IF NOT EXISTS "User_stripeCustomerId_idx" ON "User"("stripeCustomerId")`,
  ];
  
  for (const query of queries) {
    try {
      await prisma.$executeRawUnsafe(query);
      console.log(`✅ Successfully executed: ${query}`);
    } catch (error) {
      console.error(`❌ Error executing: ${query}`);
      console.error(error);
    }
  }
}

async function updateStatistics() {
  console.log('\nUpdating PostgreSQL statistics...');
  
  // Use ANALYZE to update statistics for the query planner
  try {
    await prisma.$executeRawUnsafe(`ANALYZE`);
    console.log('✅ Successfully updated statistics');
  } catch (error) {
    console.error('❌ Error updating statistics');
    console.error(error);
  }
}

async function performMaintenance() {
  console.log('\nPerforming database maintenance...');
  
  // VACUUM ANALYZE to reclaim storage and update statistics
  try {
    // Note: Some operations can't be executed through Prisma's $executeRawUnsafe
    // because they don't run inside a transaction
    // We'll use command line for these operations
    const { stdout, stderr } = await execAsync(
      `PGPASSWORD="${process.env.DATABASE_PASSWORD}" psql -h ${process.env.DATABASE_HOST} -U ${process.env.DATABASE_USER} -d ${process.env.DATABASE_NAME} -c "VACUUM ANALYZE"`
    );
    
    if (stdout) console.log(stdout);
    if (stderr) console.error(stderr);
    
    console.log('✅ Successfully performed maintenance');
  } catch (error) {
    console.error('❌ Error performing maintenance');
    console.error(error);
    console.log('ℹ️ Maintenance operations might require direct database access.');
    console.log('ℹ️ You can run manually: VACUUM ANALYZE');
  }
}

async function checkTableSizes() {
  console.log('\nChecking table sizes...');
  
  const query = `
    SELECT
      table_name,
      pg_size_pretty(pg_total_relation_size(quote_ident(table_name))) as total_size,
      pg_size_pretty(pg_relation_size(quote_ident(table_name))) as table_size,
      pg_size_pretty(pg_total_relation_size(quote_ident(table_name)) - pg_relation_size(quote_ident(table_name))) as index_size
    FROM
      information_schema.tables
    WHERE
      table_schema = 'public'
    ORDER BY
      pg_total_relation_size(quote_ident(table_name)) DESC
    LIMIT 10;
  `;
  
  try {
    const result = await prisma.$queryRawUnsafe(query);
    console.log('Top 10 tables by size:');
    console.table(result);
  } catch (error) {
    console.error('❌ Error checking table sizes');
    console.error(error);
  }
}

async function runOptimizations() {
  console.log('🚀 Starting database optimization...');
  
  try {
    await createIndexes();
    await updateStatistics();
    await checkTableSizes();
    
    // Maintenance is optional and may require direct database access
    // Uncomment if you have the necessary permissions
    // await performMaintenance();
    
    console.log('\n✅ Database optimization completed successfully');
  } catch (error) {
    console.error('\n❌ Database optimization failed');
    console.error(error);
  } finally {
    await prisma.$disconnect();
  }
}

// Run the optimizations
runOptimizations()
  .catch(e => {
    console.error('Unhandled error in optimization script');
    console.error(e);
    process.exit(1);
  });
