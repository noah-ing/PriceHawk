#!/usr/bin/env node
/**
 * PriceHawk Database Index Verification Script
 * 
 * This script verifies that all required indexes are present in the database
 * and reports any missing indexes that should be created for optimal performance.
 * 
 * Usage:
 * node scripts/verify-indexes.js
 */

import { PrismaClient } from '@prisma/client';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

// Expected indexes for optimal performance
const EXPECTED_INDEXES = [
  {
    table: 'Product',
    name: 'Product_userId_idx',
    columns: ['userId']
  },
  {
    table: 'Product',
    name: 'Product_url_idx',
    columns: ['url']
  },
  {
    table: 'PriceHistory',
    name: 'PriceHistory_productId_timestamp_idx',
    columns: ['productId', 'timestamp']
  },
  {
    table: 'Alert',
    name: 'Alert_productId_idx',
    columns: ['productId']
  },
  {
    table: 'Alert',
    name: 'Alert_userId_idx',
    columns: ['userId']
  },
  {
    table: 'Alert',
    name: 'Alert_triggered_idx',
    columns: ['triggered']
  },
  {
    table: 'User',
    name: 'User_email_idx',
    columns: ['email']
  },
  {
    table: 'User',
    name: 'User_subscriptionTier_idx',
    columns: ['subscriptionTier']
  }
];

// Initialize Prisma client
const prisma = new PrismaClient();

// Function to get existing indexes from PostgreSQL
async function getExistingIndexes() {
  const indexes = await prisma.$queryRaw`
    SELECT
      t.relname AS table_name,
      i.relname AS index_name,
      array_agg(a.attname) AS column_names
    FROM
      pg_class t,
      pg_class i,
      pg_index ix,
      pg_attribute a
    WHERE
      t.oid = ix.indrelid
      AND i.oid = ix.indexrelid
      AND a.attrelid = t.oid
      AND a.attnum = ANY(ix.indkey)
      AND t.relkind = 'r'
      AND t.relname IN ('Product', 'PriceHistory', 'Alert', 'User')
    GROUP BY
      t.relname,
      i.relname
    ORDER BY
      t.relname,
      i.relname;
  `;

  return indexes;
}

// Function to format column names for display
function formatColumns(columns) {
  if (Array.isArray(columns)) {
    return columns.join(', ');
  }
  return String(columns);
}

// Main function
async function main() {
  try {
    console.log('PriceHawk Database Index Verification');
    console.log('====================================');
    console.log();

    const existingIndexes = await getExistingIndexes();
    console.log(`Found ${existingIndexes.length} existing indexes`);

    const missingIndexes = [];
    const presentIndexes = [];

    // Check each expected index
    for (const expectedIndex of EXPECTED_INDEXES) {
      const found = existingIndexes.some(index => {
        // Check if table matches
        if (index.table_name.toLowerCase() !== expectedIndex.table.toLowerCase()) {
          return false;
        }
        
        // Check if index name matches or columns match
        const indexNameMatches = index.index_name.toLowerCase().includes(expectedIndex.name.toLowerCase());
        
        // Check if all expected columns are in the index (order might be different)
        const columnSet = new Set(index.column_names.map(col => col.toLowerCase()));
        const allExpectedColumnsPresent = expectedIndex.columns.every(col => 
          columnSet.has(col.toLowerCase())
        );
        
        return indexNameMatches || allExpectedColumnsPresent;
      });

      if (found) {
        presentIndexes.push(expectedIndex);
      } else {
        missingIndexes.push(expectedIndex);
      }
    }

    // Display results
    console.log();
    console.log('Present Indexes:');
    console.log('---------------');
    if (presentIndexes.length === 0) {
      console.log('None of the expected indexes are present!');
    } else {
      presentIndexes.forEach(index => {
        console.log(`✅ ${index.table}.${index.name} (${formatColumns(index.columns)})`);
      });
    }

    console.log();
    console.log('Missing Indexes:');
    console.log('---------------');
    if (missingIndexes.length === 0) {
      console.log('All expected indexes are present. Database is optimized!');
    } else {
      missingIndexes.forEach(index => {
        console.log(`❌ ${index.table}.${index.name} (${formatColumns(index.columns)})`);
      });
      
      console.log();
      console.log('SQL to create missing indexes:');
      console.log();
      
      missingIndexes.forEach(index => {
        const columnsStr = index.columns.join('", "');
        console.log(`CREATE INDEX IF NOT EXISTS "${index.name}" ON "${index.table}"("${columnsStr}");`);
      });
    }

  } catch (error) {
    console.error('Error verifying indexes:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

main();
