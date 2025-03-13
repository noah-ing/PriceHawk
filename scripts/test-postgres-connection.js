#!/usr/bin/env node
/**
 * Test PostgreSQL Connection
 * 
 * This script tests the connection to the PostgreSQL database
 * and verifies that the database is properly configured.
 * 
 * Usage:
 * - Run: node scripts/test-postgres-connection.js
 */

import { PrismaClient } from '@prisma/client';
import pg from 'pg';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

// PostgreSQL connection string
const PG_CONNECTION_STRING = process.env.DATABASE_URL;

// Test connection using pg client
const testPgConnection = async () => {
  console.log('Testing PostgreSQL connection using pg client...');
  
  const client = new pg.Client({
    connectionString: PG_CONNECTION_STRING,
  });
  
  try {
    await client.connect();
    console.log('✅ Successfully connected to PostgreSQL using pg client');
    
    // Get PostgreSQL version
    const result = await client.query('SELECT version()');
    console.log(`PostgreSQL version: ${result.rows[0].version}`);
    
    // Test query execution
    const testResult = await client.query('SELECT 1 as test');
    console.log(`Test query result: ${testResult.rows[0].test}`);
    
    return true;
  } catch (error) {
    console.error('❌ Failed to connect to PostgreSQL using pg client:', error);
    return false;
  } finally {
    await client.end();
  }
};

// Test connection using Prisma client
const testPrismaConnection = async () => {
  console.log('\nTesting PostgreSQL connection using Prisma client...');
  
  const prisma = new PrismaClient();
  
  try {
    // Test query execution
    const result = await prisma.$queryRaw`SELECT 1 as test`;
    console.log(`✅ Successfully connected to PostgreSQL using Prisma client`);
    console.log(`Test query result: ${result[0].test}`);
    
    // Check if database schema is set up
    console.log('\nChecking database schema...');
    
    try {
      // Try to query the User table
      const userCount = await prisma.user.count();
      console.log(`✅ Database schema is set up (User table exists with ${userCount} records)`);
      
      // Get table counts
      const productCount = await prisma.product.count();
      const priceHistoryCount = await prisma.priceHistory.count();
      const alertCount = await prisma.alert.count();
      
      console.log('\nTable record counts:');
      console.log(`- Users: ${userCount}`);
      console.log(`- Products: ${productCount}`);
      console.log(`- Price History: ${priceHistoryCount}`);
      console.log(`- Alerts: ${alertCount}`);
    } catch (error) {
      console.error('❌ Database schema is not set up:', error);
      console.log('\nYou need to run migrations to set up the database schema:');
      console.log('npm run db:migrate');
    }
    
    return true;
  } catch (error) {
    console.error('❌ Failed to connect to PostgreSQL using Prisma client:', error);
    
    if (error.message.includes('database') && error.message.includes('does not exist')) {
      console.log('\nThe database does not exist. You need to create it first:');
      console.log(`createdb -h ${new URL(PG_CONNECTION_STRING).hostname} -U ${new URL(PG_CONNECTION_STRING).username} ${new URL(PG_CONNECTION_STRING).pathname.substring(1)}`);
    }
    
    return false;
  } finally {
    await prisma.$disconnect();
  }
};

// Check database configuration
const checkDatabaseConfig = () => {
  console.log('\nChecking database configuration...');
  
  try {
    const url = new URL(PG_CONNECTION_STRING);
    
    console.log('Database configuration:');
    console.log(`- Host: ${url.hostname}`);
    console.log(`- Port: ${url.port || '5432'}`);
    console.log(`- Database: ${url.pathname.substring(1)}`);
    console.log(`- User: ${url.username}`);
    console.log(`- Password: ${'*'.repeat(url.password.length)}`);
    
    // Check for common issues
    if (url.protocol !== 'postgresql:') {
      console.warn('⚠️ Warning: Protocol should be "postgresql:" for PostgreSQL connections');
    }
    
    if (!url.pathname || url.pathname === '/') {
      console.error('❌ Error: Database name is missing in the connection string');
    }
    
    return true;
  } catch (error) {
    console.error('❌ Invalid connection string:', error);
    console.log('\nThe DATABASE_URL environment variable should be in the format:');
    console.log('postgresql://username:password@hostname:port/database');
    
    return false;
  }
};

// Main function
const main = async () => {
  console.log('PostgreSQL Connection Test');
  console.log('=========================');
  
  // Check if DATABASE_URL is set
  if (!PG_CONNECTION_STRING) {
    console.error('❌ DATABASE_URL environment variable is not set');
    console.log('\nPlease set the DATABASE_URL environment variable in your .env file:');
    console.log('DATABASE_URL="postgresql://username:password@hostname:port/database"');
    return;
  }
  
  // Check database configuration
  const configValid = checkDatabaseConfig();
  
  if (!configValid) {
    return;
  }
  
  // Test connection using pg client
  const pgConnected = await testPgConnection();
  
  // Test connection using Prisma client
  if (pgConnected) {
    await testPrismaConnection();
  }
  
  console.log('\nConnection test completed');
};

main().catch(console.error);
