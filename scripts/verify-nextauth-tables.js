import { PrismaClient } from '@prisma/client';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

const prisma = new PrismaClient();

/**
 * Verify NextAuth tables in PostgreSQL
 * This script checks if all required NextAuth tables exist and have the correct structure
 */
async function verifyNextAuthTables() {
  console.log('Verifying NextAuth tables in PostgreSQL...');
  
  try {
    // Check database connection
    await prisma.$connect();
    console.log('✅ Database connection successful');
    
    // Check if tables exist
    const tables = ['User', 'Account', 'Session'];
    
    for (const table of tables) {
      try {
        // Try a simple query to check if the table exists
        const count = await prisma[table.toLowerCase()].count();
        console.log(`✅ Table '${table}' exists (${count} records)`);
      } catch (error) {
        console.error(`❌ Table '${table}' error:`, error.message);
      }
    }
    
    // Check User table structure
    try {
      const userSample = await prisma.user.findFirst();
      console.log('User table structure:', userSample ? Object.keys(userSample) : 'No records');
    } catch (error) {
      console.error('❌ Failed to query User table:', error.message);
    }
    
    // Check Account table structure
    try {
      const accountSample = await prisma.account.findFirst();
      console.log('Account table structure:', accountSample ? Object.keys(accountSample) : 'No records');
    } catch (error) {
      console.error('❌ Failed to query Account table:', error.message);
    }
    
    // Check Session table structure
    try {
      const sessionSample = await prisma.session.findFirst();
      console.log('Session table structure:', sessionSample ? Object.keys(sessionSample) : 'No records');
    } catch (error) {
      console.error('❌ Failed to query Session table:', error.message);
    }
    
  } catch (error) {
    console.error('Failed to connect to database:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Run the verification
verifyNextAuthTables().catch(console.error);
