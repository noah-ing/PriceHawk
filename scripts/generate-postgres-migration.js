#!/usr/bin/env node
/**
 * Generate Prisma Migration for PostgreSQL
 * 
 * This script:
 * 1. Creates a Prisma migration for PostgreSQL
 * 2. Applies the migration to the database
 * 3. Generates the Prisma client
 * 
 * Usage:
 * - Run: node scripts/generate-postgres-migration.js
 */

import { exec } from 'child_process';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import readline from 'readline';

// Load environment variables
dotenv.config();

// Get the directory name
const __dirname = path.dirname(fileURLToPath(import.meta.url));

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

// Execute a command and return a promise
const execCommand = (command) => {
  return new Promise((resolve, reject) => {
    console.log(`Executing: ${command}`);
    
    exec(command, (error, stdout, stderr) => {
      if (error) {
        console.error(`Error: ${error.message}`);
        console.error(stderr);
        reject(error);
        return;
      }
      
      console.log(stdout);
      resolve(stdout);
    });
  });
};

// Generate Prisma migration
const generateMigration = async (name) => {
  try {
    // Create migration
    await execCommand(`npx prisma migrate dev --name ${name} --create-only`);
    console.log('Migration created successfully');
    
    return true;
  } catch (error) {
    console.error('Failed to create migration:', error);
    return false;
  }
};

// Apply migration
const applyMigration = async () => {
  try {
    // Apply migration
    await execCommand('npx prisma migrate dev');
    console.log('Migration applied successfully');
    
    return true;
  } catch (error) {
    console.error('Failed to apply migration:', error);
    return false;
  }
};

// Generate Prisma client
const generateClient = async () => {
  try {
    // Generate client
    await execCommand('npx prisma generate');
    console.log('Prisma client generated successfully');
    
    return true;
  } catch (error) {
    console.error('Failed to generate Prisma client:', error);
    return false;
  }
};

// Main function
const main = async () => {
  try {
    console.log('PostgreSQL Migration Generator');
    console.log('=============================');
    
    // Confirm database URL
    console.log(`Current DATABASE_URL: ${process.env.DATABASE_URL}`);
    const confirmUrl = await confirm('Is this the correct PostgreSQL connection string?');
    
    if (!confirmUrl) {
      console.log('Please update the DATABASE_URL in your .env file and try again');
      return;
    }
    
    // Get migration name
    const migrationName = await new Promise((resolve) => {
      rl.question('Enter a name for the migration (e.g., "init_postgres"): ', (answer) => {
        resolve(answer || 'init_postgres');
      });
    });
    
    // Generate migration
    const migrationCreated = await generateMigration(migrationName);
    
    if (!migrationCreated) {
      console.log('Migration creation failed. Exiting...');
      return;
    }
    
    // Confirm applying migration
    const confirmApply = await confirm('Do you want to apply the migration now?');
    
    if (confirmApply) {
      const migrationApplied = await applyMigration();
      
      if (!migrationApplied) {
        console.log('Migration application failed. Exiting...');
        return;
      }
    }
    
    // Generate Prisma client
    const confirmGenerate = await confirm('Do you want to generate the Prisma client?');
    
    if (confirmGenerate) {
      await generateClient();
    }
    
    console.log('PostgreSQL migration process completed');
  } catch (error) {
    console.error('Error:', error);
  } finally {
    // Close readline interface
    rl.close();
  }
};

main();
