#!/usr/bin/env node
/**
 * Migration script to transfer data from SQLite to PostgreSQL
 * 
 * This script:
 * 1. Connects to both SQLite and PostgreSQL databases
 * 2. Extracts data from SQLite
 * 3. Transforms data if needed
 * 4. Loads data into PostgreSQL
 * 5. Verifies the migration was successful
 * 
 * Usage:
 * 1. Make sure both SQLite and PostgreSQL connection strings are available
 * 2. Run: node scripts/migrate-to-postgres.js
 */

import { PrismaClient as PrismaClientSqlite } from '@prisma/client';
import pg from 'pg';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

// Get the directory name
const __dirname = path.dirname(fileURLToPath(import.meta.url));

// SQLite database file path
const SQLITE_DB_PATH = path.resolve(__dirname, '../prisma/dev.db');

// PostgreSQL connection string
const PG_CONNECTION_STRING = process.env.DATABASE_URL;

// Backup directory
const BACKUP_DIR = path.resolve(__dirname, '../backups');

// Ensure backup directory exists
if (!fs.existsSync(BACKUP_DIR)) {
  fs.mkdirSync(BACKUP_DIR, { recursive: true });
}

// Create a backup of the SQLite database
function backupSqliteDatabase() {
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const backupPath = path.join(BACKUP_DIR, `dev-${timestamp}.db`);
  
  console.log(`Creating backup of SQLite database at ${backupPath}`);
  fs.copyFileSync(SQLITE_DB_PATH, backupPath);
  console.log('Backup created successfully');
  
  return backupPath;
}

// Connect to PostgreSQL
async function connectToPostgres() {
  const client = new pg.Client({
    connectionString: PG_CONNECTION_STRING,
  });
  
  try {
    await client.connect();
    console.log('Connected to PostgreSQL');
    return client;
  } catch (error) {
    console.error('Failed to connect to PostgreSQL:', error);
    throw error;
  }
}

// Main migration function
async function migrateData() {
  console.log('Starting migration from SQLite to PostgreSQL');
  
  // Create a backup first
  const backupPath = backupSqliteDatabase();
  console.log(`SQLite database backed up to ${backupPath}`);
  
  // Initialize Prisma client for SQLite
  const prismaSqlite = new PrismaClientSqlite({
    datasources: {
      db: {
        url: `file:${SQLITE_DB_PATH}`,
      },
    },
  });
  
  // Connect to PostgreSQL
  const pgClient = await connectToPostgres();
  
  try {
    // Get all data from SQLite
    console.log('Extracting data from SQLite...');
    
    // Extract data from each table
    const users = await prismaSqlite.user.findMany();
    const accounts = await prismaSqlite.account.findMany();
    const sessions = await prismaSqlite.session.findMany();
    const products = await prismaSqlite.product.findMany();
    const priceHistory = await prismaSqlite.priceHistory.findMany();
    const alerts = await prismaSqlite.alert.findMany();
    const subscriptionTiers = await prismaSqlite.subscriptionTier.findMany();
    
    console.log(`Extracted data from SQLite:
      - ${users.length} users
      - ${accounts.length} accounts
      - ${sessions.length} sessions
      - ${products.length} products
      - ${priceHistory.length} price history records
      - ${alerts.length} alerts
      - ${subscriptionTiers.length} subscription tiers
    `);
    
    // Start a transaction in PostgreSQL
    await pgClient.query('BEGIN');
    
    // Insert data into PostgreSQL
    console.log('Inserting data into PostgreSQL...');
    
    // Helper function to insert data
    async function insertData(tableName, data, idField = 'id') {
      if (data.length === 0) return;
      
      // Get column names from the first object
      const columns = Object.keys(data[0]);
      
      for (const item of data) {
        const placeholders = columns.map((_, i) => `$${i + 1}`).join(', ');
        const values = columns.map(col => item[col]);
        
        const query = `
          INSERT INTO "${tableName}" (${columns.map(c => `"${c}"`).join(', ')})
          VALUES (${placeholders})
          ON CONFLICT ("${idField}") DO NOTHING
        `;
        
        await pgClient.query(query, values);
      }
      
      console.log(`Inserted ${data.length} records into ${tableName}`);
    }
    
    // Insert data in the correct order to maintain referential integrity
    await insertData('User', users);
    await insertData('Account', accounts);
    await insertData('Session', sessions);
    await insertData('Product', products);
    await insertData('PriceHistory', priceHistory);
    await insertData('Alert', alerts);
    await insertData('SubscriptionTier', subscriptionTiers);
    
    // Commit the transaction
    await pgClient.query('COMMIT');
    console.log('Migration completed successfully');
    
  } catch (error) {
    // Rollback the transaction if there was an error
    await pgClient.query('ROLLBACK');
    console.error('Migration failed:', error);
    console.log('Rolling back changes...');
    throw error;
  } finally {
    // Close connections
    await prismaSqlite.$disconnect();
    await pgClient.end();
  }
}

// Verify the migration
async function verifyMigration() {
  console.log('Verifying migration...');
  
  // Initialize Prisma client for SQLite
  const prismaSqlite = new PrismaClientSqlite({
    datasources: {
      db: {
        url: `file:${SQLITE_DB_PATH}`,
      },
    },
  });
  
  // Initialize Prisma client for PostgreSQL
  const prismaPostgres = new PrismaClientSqlite({
    datasources: {
      db: {
        url: PG_CONNECTION_STRING,
      },
    },
  });
  
  try {
    // Count records in each database
    const sqliteCounts = {
      users: await prismaSqlite.user.count(),
      accounts: await prismaSqlite.account.count(),
      sessions: await prismaSqlite.session.count(),
      products: await prismaSqlite.product.count(),
      priceHistory: await prismaSqlite.priceHistory.count(),
      alerts: await prismaSqlite.alert.count(),
      subscriptionTiers: await prismaSqlite.subscriptionTier.count(),
    };
    
    const postgresCounts = {
      users: await prismaPostgres.user.count(),
      accounts: await prismaPostgres.account.count(),
      sessions: await prismaPostgres.session.count(),
      products: await prismaPostgres.product.count(),
      priceHistory: await prismaPostgres.priceHistory.count(),
      alerts: await prismaPostgres.alert.count(),
      subscriptionTiers: await prismaPostgres.subscriptionTier.count(),
    };
    
    console.log('Record counts:');
    console.log('SQLite:');
    console.table(sqliteCounts);
    console.log('PostgreSQL:');
    console.table(postgresCounts);
    
    // Check if counts match
    const allMatch = Object.keys(sqliteCounts).every(
      key => sqliteCounts[key] === postgresCounts[key]
    );
    
    if (allMatch) {
      console.log('Verification successful: All record counts match');
    } else {
      console.warn('Verification warning: Record counts do not match');
      
      // Show differences
      Object.keys(sqliteCounts).forEach(key => {
        if (sqliteCounts[key] !== postgresCounts[key]) {
          console.warn(`  - ${key}: SQLite=${sqliteCounts[key]}, PostgreSQL=${postgresCounts[key]}`);
        }
      });
    }
    
  } catch (error) {
    console.error('Verification failed:', error);
  } finally {
    // Close connections
    await prismaSqlite.$disconnect();
    await prismaPostgres.$disconnect();
  }
}

// Run the migration
async function run() {
  try {
    await migrateData();
    await verifyMigration();
    console.log('Migration process completed');
  } catch (error) {
    console.error('Migration process failed:', error);
    process.exit(1);
  }
}

run();
