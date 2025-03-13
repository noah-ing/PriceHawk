#!/usr/bin/env node
/**
 * Pre-Deployment PostgreSQL Database Backup Script
 * 
 * This script creates a special, clearly labeled pre-deployment backup
 * before any production deployment. It maintains a separate set of
 * pre-deployment backups to ensure easy rollback capabilities.
 * 
 * Usage:
 * - Create pre-deployment backup: node scripts/pre-deployment-backup.js
 * - With versioning: node scripts/pre-deployment-backup.js v1.2.3
 */

import { exec } from 'child_process';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

// Get the directory name
const __dirname = path.dirname(fileURLToPath(import.meta.url));

// PostgreSQL connection string
const PG_CONNECTION_STRING = process.env.DATABASE_URL;

// Maximum number of pre-deployment backups to keep
const MAX_BACKUPS = 5;

// Backup directory for pre-deployment backups
const BACKUP_DIR = path.resolve(__dirname, '../backups/postgres/pre-deployment');

// Ensure backup directory exists
if (!fs.existsSync(BACKUP_DIR)) {
  fs.mkdirSync(BACKUP_DIR, { recursive: true });
}

// Parse connection string to get database details
const parseConnectionString = (connectionString) => {
  try {
    const url = new URL(connectionString);
    return {
      host: url.hostname,
      port: url.port || '5432',
      database: url.pathname.substring(1),
      user: url.username,
      password: url.password,
    };
  } catch (error) {
    console.error('Failed to parse connection string:', error);
    throw error;
  }
};

// Format file size
const formatFileSize = (bytes) => {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(2)} KB`;
  if (bytes < 1024 * 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
  return `${(bytes / (1024 * 1024 * 1024)).toFixed(2)} GB`;
};

// Rotate backups (keep only the most recent ones)
const rotateBackups = () => {
  const files = fs.readdirSync(BACKUP_DIR)
    .filter(file => file.endsWith('.dump'))
    .map(file => path.join(BACKUP_DIR, file))
    .sort((a, b) => fs.statSync(b).mtime.getTime() - fs.statSync(a).mtime.getTime());
  
  if (files.length > MAX_BACKUPS) {
    console.log(`Rotating pre-deployment backups (keeping ${MAX_BACKUPS} most recent)...`);
    
    const filesToDelete = files.slice(MAX_BACKUPS);
    
    filesToDelete.forEach(file => {
      fs.unlinkSync(file);
      console.log(`Deleted old pre-deployment backup: ${path.basename(file)}`);
    });
  }
};

// Create a pre-deployment backup
const createPreDeploymentBackup = async (version) => {
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const versionTag = version ? `-${version}` : '';
  const backupPath = path.join(BACKUP_DIR, `pricehawk-pre-deploy${versionTag}-${timestamp}.dump`);
  
  console.log(`Creating pre-deployment backup of PostgreSQL database at ${backupPath}`);
  
  const dbConfig = parseConnectionString(PG_CONNECTION_STRING);
  
  // Build pg_dump command with compression
  // -F c = custom format (compressed)
  // -Z 9 = maximum compression level
  const pgDumpCmd = `pg_dump -h ${dbConfig.host} -p ${dbConfig.port} -U ${dbConfig.user} -d ${dbConfig.database} -F c -Z 9 -f "${backupPath}"`;
  
  // Set PGPASSWORD environment variable for authentication
  const env = { ...process.env, PGPASSWORD: dbConfig.password };
  
  return new Promise((resolve, reject) => {
    // Try up to 3 times with exponential backoff
    let attempts = 0;
    const maxAttempts = 3;
    
    const attemptBackup = () => {
      attempts++;
      console.log(`Attempt ${attempts} of ${maxAttempts}`);
      
      exec(pgDumpCmd, { env }, (error, stdout, stderr) => {
        if (error) {
          console.error('Backup attempt failed:', error);
          console.error(stderr);
          
          if (attempts < maxAttempts) {
            const delay = Math.pow(2, attempts) * 1000; // Exponential backoff
            console.log(`Retrying in ${delay/1000} seconds...`);
            setTimeout(attemptBackup, delay);
            return;
          }
          
          reject(error);
          return;
        }
        
        // Check if file exists and has content
        if (!fs.existsSync(backupPath) || fs.statSync(backupPath).size === 0) {
          console.error('Backup file is empty or was not created');
          
          if (attempts < maxAttempts) {
            const delay = Math.pow(2, attempts) * 1000;
            console.log(`Retrying in ${delay/1000} seconds...`);
            setTimeout(attemptBackup, delay);
            return;
          }
          
          reject(new Error('Failed to create backup file'));
          return;
        }
        
        const stats = fs.statSync(backupPath);
        console.log(`Backup created successfully at ${backupPath} (${formatFileSize(stats.size)})`);
        
        // Rotate backups (delete old ones if we have too many)
        rotateBackups();
        
        resolve(backupPath);
      });
    };
    
    attemptBackup();
  });
};

// List available pre-deployment backups
const listBackups = () => {
  if (!fs.existsSync(BACKUP_DIR)) {
    console.log('Backup directory does not exist');
    return [];
  }
  
  const files = fs.readdirSync(BACKUP_DIR)
    .filter(file => file.endsWith('.dump'))
    .map(file => path.join(BACKUP_DIR, file))
    .sort((a, b) => fs.statSync(b).mtime.getTime() - fs.statSync(a).mtime.getTime());
  
  if (files.length === 0) {
    console.log('No pre-deployment backups found');
  } else {
    console.log('Available pre-deployment backups:');
    files.forEach((file, index) => {
      const stats = fs.statSync(file);
      console.log(`${index + 1}. ${path.basename(file)} (${formatFileSize(stats.size)}) - ${stats.mtime.toLocaleString()}`);
    });
  }
  
  return files;
};

// Main function
const main = async () => {
  // Check if version argument is provided
  const version = process.argv[2];
  
  console.log('========================================================');
  console.log('  PRICEHAWK PRE-DEPLOYMENT DATABASE BACKUP              ');
  console.log('========================================================');
  console.log('');
  
  if (!process.env.DATABASE_URL) {
    console.error('Error: DATABASE_URL environment variable is not set.');
    console.error('Please set it in your .env file or environment before running this script.');
    process.exit(1);
  }
  
  try {
    await createPreDeploymentBackup(version);
    console.log('');
    console.log('Existing pre-deployment backups:');
    listBackups();
    console.log('');
    console.log('Pre-deployment backup completed successfully.');
    console.log('This backup can be used for rollback if needed using:');
    console.log('node scripts/db-backup.js restore [backup-file]');
  } catch (error) {
    console.error('');
    console.error('Pre-deployment backup failed:', error.message);
    console.error('DO NOT PROCEED WITH DEPLOYMENT until backup issues are resolved.');
    process.exit(1);
  }
};

main();
