#!/usr/bin/env node
/**
 * PostgreSQL Database Backup Script
 * 
 * This script creates backups of the PostgreSQL database and provides
 * functionality to restore from backups if needed.
 * 
 * Features:
 * - Scheduled automatic backups
 * - Manual backup creation
 * - Backup restoration
 * - Backup rotation (keeping only the most recent backups)
 * 
 * Usage:
 * - Create backup: node scripts/db-backup.js backup
 * - Restore from backup: node scripts/db-backup.js restore [backup-file]
 * - List backups: node scripts/db-backup.js list
 * - Schedule backups: node scripts/db-backup.js schedule [cron-expression]
 */

import { exec } from 'child_process';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import cron from 'node-cron';
import readline from 'readline';

// Load environment variables
dotenv.config();

// Get the directory name
const __dirname = path.dirname(fileURLToPath(import.meta.url));

// PostgreSQL connection string
const PG_CONNECTION_STRING = process.env.DATABASE_URL;

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

// Backup directory
const BACKUP_DIR = path.resolve(__dirname, '../backups/postgres');

// Maximum number of backups to keep
const MAX_BACKUPS = 10;

// Ensure backup directory exists
if (!fs.existsSync(BACKUP_DIR)) {
  fs.mkdirSync(BACKUP_DIR, { recursive: true });
}

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

// Create a backup of the PostgreSQL database
const createBackup = async () => {
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const backupPath = path.join(BACKUP_DIR, `pricehawk-${timestamp}.sql`);
  
  console.log(`Creating backup of PostgreSQL database at ${backupPath}`);
  
  const dbConfig = parseConnectionString(PG_CONNECTION_STRING);
  
  // Build pg_dump command
  const pgDumpCmd = `pg_dump -h ${dbConfig.host} -p ${dbConfig.port} -U ${dbConfig.user} -d ${dbConfig.database} -F c -f "${backupPath}"`;
  
  // Set PGPASSWORD environment variable for authentication
  const env = { ...process.env, PGPASSWORD: dbConfig.password };
  
  return new Promise((resolve, reject) => {
    exec(pgDumpCmd, { env }, (error, stdout, stderr) => {
      if (error) {
        console.error('Backup failed:', error);
        console.error(stderr);
        reject(error);
        return;
      }
      
      console.log(`Backup created successfully at ${backupPath}`);
      
      // Rotate backups (delete old ones if we have too many)
      rotateBackups();
      
      resolve(backupPath);
    });
  });
};

// Restore from a backup
const restoreBackup = async (backupFile) => {
  if (!backupFile) {
    // If no backup file is specified, list available backups and prompt user to select one
    const backups = listBackups();
    
    if (backups.length === 0) {
      console.error('No backups found');
      return;
    }
    
    console.log('Available backups:');
    backups.forEach((backup, index) => {
      console.log(`${index + 1}. ${path.basename(backup)}`);
    });
    
    const answer = await new Promise((resolve) => {
      rl.question('Select a backup to restore (number): ', resolve);
    });
    
    const selectedIndex = parseInt(answer, 10) - 1;
    
    if (isNaN(selectedIndex) || selectedIndex < 0 || selectedIndex >= backups.length) {
      console.error('Invalid selection');
      return;
    }
    
    backupFile = backups[selectedIndex];
  }
  
  // Confirm restoration
  const confirmed = await confirm(`Are you sure you want to restore from ${path.basename(backupFile)}? This will OVERWRITE the current database.`);
  
  if (!confirmed) {
    console.log('Restoration cancelled');
    return;
  }
  
  console.log(`Restoring from backup: ${backupFile}`);
  
  const dbConfig = parseConnectionString(PG_CONNECTION_STRING);
  
  // Build pg_restore command
  const pgRestoreCmd = `pg_restore -h ${dbConfig.host} -p ${dbConfig.port} -U ${dbConfig.user} -d ${dbConfig.database} -c "${backupFile}"`;
  
  // Set PGPASSWORD environment variable for authentication
  const env = { ...process.env, PGPASSWORD: dbConfig.password };
  
  return new Promise((resolve, reject) => {
    exec(pgRestoreCmd, { env }, (error, stdout, stderr) => {
      if (error) {
        console.error('Restoration failed:', error);
        console.error(stderr);
        reject(error);
        return;
      }
      
      console.log('Database restored successfully');
      resolve();
    });
  });
};

// List available backups
const listBackups = () => {
  const files = fs.readdirSync(BACKUP_DIR)
    .filter(file => file.endsWith('.sql'))
    .map(file => path.join(BACKUP_DIR, file))
    .sort((a, b) => fs.statSync(b).mtime.getTime() - fs.statSync(a).mtime.getTime());
  
  if (files.length === 0) {
    console.log('No backups found');
  } else {
    console.log('Available backups:');
    files.forEach((file, index) => {
      const stats = fs.statSync(file);
      console.log(`${index + 1}. ${path.basename(file)} (${formatFileSize(stats.size)}) - ${stats.mtime.toLocaleString()}`);
    });
  }
  
  return files;
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
    .filter(file => file.endsWith('.sql'))
    .map(file => path.join(BACKUP_DIR, file))
    .sort((a, b) => fs.statSync(b).mtime.getTime() - fs.statSync(a).mtime.getTime());
  
  if (files.length > MAX_BACKUPS) {
    console.log(`Rotating backups (keeping ${MAX_BACKUPS} most recent)...`);
    
    const filesToDelete = files.slice(MAX_BACKUPS);
    
    filesToDelete.forEach(file => {
      fs.unlinkSync(file);
      console.log(`Deleted old backup: ${path.basename(file)}`);
    });
  }
};

// Schedule backups
const scheduleBackups = (cronExpression) => {
  // Default to daily at 3 AM
  const expression = cronExpression || '0 3 * * *';
  
  if (!cron.validate(expression)) {
    console.error('Invalid cron expression');
    return;
  }
  
  console.log(`Scheduling backups with cron expression: ${expression}`);
  console.log('Press Ctrl+C to stop');
  
  cron.schedule(expression, () => {
    console.log(`Running scheduled backup at ${new Date().toLocaleString()}`);
    createBackup().catch(console.error);
  });
};

// Main function
const main = async () => {
  const command = process.argv[2]?.toLowerCase();
  const arg = process.argv[3];
  
  try {
    switch (command) {
      case 'backup':
        await createBackup();
        break;
        
      case 'restore':
        await restoreBackup(arg);
        break;
        
      case 'list':
        listBackups();
        break;
        
      case 'schedule':
        scheduleBackups(arg);
        // Keep the process running for scheduled backups
        return;
        
      default:
        console.log('Usage:');
        console.log('  node scripts/db-backup.js backup - Create a new backup');
        console.log('  node scripts/db-backup.js restore [backup-file] - Restore from a backup');
        console.log('  node scripts/db-backup.js list - List available backups');
        console.log('  node scripts/db-backup.js schedule [cron-expression] - Schedule automatic backups');
    }
  } catch (error) {
    console.error('Error:', error);
  } finally {
    // Close readline interface
    rl.close();
  }
};

main();
