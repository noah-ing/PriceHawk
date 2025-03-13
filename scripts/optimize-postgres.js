#!/usr/bin/env node
/**
 * PostgreSQL Database Optimization Script
 * 
 * This script analyzes the database and applies performance optimizations:
 * 1. Adds indexes to frequently queried fields
 * 2. Analyzes query performance
 * 3. Provides recommendations for further optimization
 * 
 * Usage:
 * - Run: node scripts/optimize-postgres.js
 */

import { PrismaClient } from '@prisma/client';
import { exec } from 'child_process';
import dotenv from 'dotenv';
import readline from 'readline';

// Load environment variables
dotenv.config();

// Create a readline interface for user input
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

// Prompt for confirmation
const confirm = (message) => {
  return new Promise((resolve) => {
    rl.question(`${message} (y/n): `, (answer) => {
      resolve(answer.toLowerCase() === 'y');
    });
  });
};

// Initialize Prisma client
const prisma = new PrismaClient({
  log: ['query', 'info', 'warn', 'error'],
});

// Execute raw SQL query
const executeRawQuery = async (sql) => {
  try {
    console.log(`Executing SQL: ${sql}`);
    const result = await prisma.$executeRawUnsafe(sql);
    console.log('Query executed successfully');
    return result;
  } catch (error) {
    console.error('Error executing query:', error);
    throw error;
  }
};

// Create indexes for performance optimization
const createIndexes = async () => {
  console.log('Creating indexes for performance optimization...');
  
  // Define indexes to create
  const indexes = [
    // User indexes
    {
      table: 'User',
      name: 'idx_user_email',
      columns: 'email',
      description: 'Speeds up user lookup by email',
    },
    {
      table: 'User',
      name: 'idx_user_subscription_tier',
      columns: 'subscriptionTier',
      description: 'Speeds up filtering users by subscription tier',
    },
    {
      table: 'User',
      name: 'idx_user_subscription_status',
      columns: 'subscriptionStatus',
      description: 'Speeds up filtering users by subscription status',
    },
    
    // Product indexes
    {
      table: 'Product',
      name: 'idx_product_retailer',
      columns: 'retailer',
      description: 'Speeds up filtering products by retailer',
    },
    {
      table: 'Product',
      name: 'idx_product_created_at',
      columns: 'createdAt',
      description: 'Speeds up sorting products by creation date',
    },
    {
      table: 'Product',
      name: 'idx_product_current_price',
      columns: 'currentPrice',
      description: 'Speeds up filtering and sorting products by price',
    },
    
    // PriceHistory indexes
    {
      table: 'PriceHistory',
      name: 'idx_price_history_price',
      columns: 'price',
      description: 'Speeds up filtering price history by price value',
    },
    {
      table: 'PriceHistory',
      name: 'idx_price_history_timestamp_price',
      columns: 'timestamp, price',
      description: 'Speeds up time-series analysis of prices',
    },
    
    // Alert indexes
    {
      table: 'Alert',
      name: 'idx_alert_is_triggered',
      columns: 'isTriggered',
      description: 'Speeds up filtering alerts by triggered status',
    },
    {
      table: 'Alert',
      name: 'idx_alert_target_price',
      columns: 'targetPrice',
      description: 'Speeds up filtering alerts by target price',
    },
    {
      table: 'Alert',
      name: 'idx_alert_created_at',
      columns: 'createdAt',
      description: 'Speeds up sorting alerts by creation date',
    },
  ];
  
  // Create each index
  for (const index of indexes) {
    try {
      // Check if index already exists
      const checkIndexSql = `
        SELECT 1
        FROM pg_indexes
        WHERE tablename = '${index.table.toLowerCase()}'
        AND indexname = '${index.name.toLowerCase()}'
      `;
      
      const indexExists = await prisma.$queryRaw`${checkIndexSql}`;
      
      if (indexExists && indexExists.length > 0) {
        console.log(`Index ${index.name} already exists on ${index.table}.${index.columns}`);
        continue;
      }
      
      // Create the index
      const createIndexSql = `
        CREATE INDEX "${index.name}" ON "${index.table}" (${index.columns});
      `;
      
      await executeRawQuery(createIndexSql);
      console.log(`Created index ${index.name} on ${index.table}.${index.columns} - ${index.description}`);
    } catch (error) {
      console.error(`Failed to create index ${index.name}:`, error);
    }
  }
  
  console.log('Index creation completed');
};

// Analyze database for optimization opportunities
const analyzeDatabasePerformance = async () => {
  console.log('Analyzing database performance...');
  
  // Analyze all tables
  const analyzeSql = 'ANALYZE;';
  await executeRawQuery(analyzeSql);
  
  // Get table statistics
  const tableStatsSql = `
    SELECT
      relname as table_name,
      n_live_tup as row_count,
      pg_size_pretty(pg_total_relation_size(relid)) as total_size,
      pg_size_pretty(pg_relation_size(relid)) as table_size,
      pg_size_pretty(pg_total_relation_size(relid) - pg_relation_size(relid)) as index_size
    FROM pg_stat_user_tables
    ORDER BY n_live_tup DESC;
  `;
  
  const tableStats = await prisma.$queryRawUnsafe(tableStatsSql);
  
  console.log('\nTable Statistics:');
  console.table(tableStats);
  
  // Get index statistics
  const indexStatsSql = `
    SELECT
      indexrelname as index_name,
      relname as table_name,
      idx_scan as index_scans,
      idx_tup_read as tuples_read,
      idx_tup_fetch as tuples_fetched,
      pg_size_pretty(pg_relation_size(indexrelid)) as index_size
    FROM pg_stat_user_indexes
    ORDER BY idx_scan DESC;
  `;
  
  const indexStats = await prisma.$queryRawUnsafe(indexStatsSql);
  
  console.log('\nIndex Statistics:');
  console.table(indexStats);
  
  // Identify unused indexes
  const unusedIndexes = indexStats.filter(index => index.index_scans === 0);
  
  if (unusedIndexes.length > 0) {
    console.log('\nUnused Indexes (candidates for removal):');
    console.table(unusedIndexes);
  }
  
  // Get slow queries
  const slowQueriesSql = `
    SELECT
      query,
      calls,
      total_time,
      min_time,
      max_time,
      mean_time,
      stddev_time,
      rows
    FROM pg_stat_statements
    ORDER BY total_time DESC
    LIMIT 10;
  `;
  
  try {
    const slowQueries = await prisma.$queryRawUnsafe(slowQueriesSql);
    
    if (slowQueries.length > 0) {
      console.log('\nSlow Queries:');
      console.table(slowQueries);
    }
  } catch (error) {
    console.log('\nCould not retrieve slow queries. The pg_stat_statements extension may not be enabled.');
    console.log('To enable it, run: CREATE EXTENSION pg_stat_statements;');
  }
  
  // Provide optimization recommendations
  console.log('\nOptimization Recommendations:');
  
  // Check for tables without primary keys
  const tablesWithoutPKSql = `
    SELECT t.relname as table_name
    FROM pg_class t
    JOIN pg_namespace n ON n.oid = t.relnamespace
    LEFT JOIN pg_constraint c ON c.conrelid = t.oid AND c.contype = 'p'
    WHERE t.relkind = 'r'
    AND n.nspname = 'public'
    AND c.oid IS NULL;
  `;
  
  const tablesWithoutPK = await prisma.$queryRawUnsafe(tablesWithoutPKSql);
  
  if (tablesWithoutPK.length > 0) {
    console.log('- Tables without primary keys:');
    tablesWithoutPK.forEach(table => {
      console.log(`  * ${table.table_name} - Consider adding a primary key for better performance`);
    });
  }
  
  // Check for large tables without indexes
  const tablesWithoutIndexesSql = `
    SELECT t.relname as table_name, n_live_tup as row_count
    FROM pg_stat_user_tables t
    LEFT JOIN pg_indexes i ON i.tablename = t.relname
    WHERE i.indexname IS NULL
    AND t.n_live_tup > 100
    ORDER BY n_live_tup DESC;
  `;
  
  const tablesWithoutIndexes = await prisma.$queryRawUnsafe(tablesWithoutIndexesSql);
  
  if (tablesWithoutIndexes.length > 0) {
    console.log('- Tables with more than 100 rows but no indexes:');
    tablesWithoutIndexes.forEach(table => {
      console.log(`  * ${table.table_name} (${table.row_count} rows) - Consider adding indexes for frequently queried columns`);
    });
  }
  
  console.log('\nPerformance analysis completed');
};

// Optimize database
const optimizeDatabase = async () => {
  console.log('Optimizing database...');
  
  // Vacuum analyze to reclaim space and update statistics
  const vacuumSql = 'VACUUM ANALYZE;';
  await executeRawQuery(vacuumSql);
  
  console.log('Database optimization completed');
};

// Main function
const main = async () => {
  try {
    console.log('PostgreSQL Database Optimization Script');
    console.log('======================================');
    
    // Create indexes
    const createIndexesConfirmed = await confirm('Do you want to create recommended indexes?');
    if (createIndexesConfirmed) {
      await createIndexes();
    }
    
    // Analyze database performance
    const analyzeConfirmed = await confirm('Do you want to analyze database performance?');
    if (analyzeConfirmed) {
      await analyzeDatabasePerformance();
    }
    
    // Optimize database
    const optimizeConfirmed = await confirm('Do you want to optimize the database (VACUUM ANALYZE)?');
    if (optimizeConfirmed) {
      await optimizeDatabase();
    }
    
    console.log('Database optimization script completed');
  } catch (error) {
    console.error('Error:', error);
  } finally {
    // Close Prisma client and readline interface
    await prisma.$disconnect();
    rl.close();
  }
};

main();
