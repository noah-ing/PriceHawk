#!/usr/bin/env node
/**
 * Remote Backup Execution Script for PriceHawk
 * 
 * This script uploads the remote-backup.sh script to the SiteGround server and executes
 * it with the proper environment variables. It then verifies the result to determine if
 * the backup was successful.
 * 
 * Usage:
 * - node scripts/execute-remote-backup.js [version]
 */

import { exec } from 'child_process';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import util from 'util';

// Load environment variables
dotenv.config();

// Promisify exec
const execAsync = util.promisify(exec);

// Get the directory name
const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Configuration
const sshHost = process.env.SITEGROUND_SSH_HOST;
const sshUser = process.env.SITEGROUND_SSH_USERNAME;
const remoteScriptPath = "~/remote-backup.sh";
const localScriptPath = path.resolve(__dirname, 'remote-backup.sh');
const version = process.argv[2] || 'unversioned';

// Check if required environment variables are set
if (!sshHost || !sshUser) {
  console.error('Error: SITEGROUND_SSH_HOST and SITEGROUND_SSH_USERNAME environment variables must be set.');
  process.exit(1);
}

// Parse database connection string to get credentials
const parseDBCredentials = (connectionString) => {
  try {
    if (!connectionString) {
      throw new Error('No connection string provided');
    }
    
    const url = new URL(connectionString);
    return {
      dbUser: url.username,
      dbName: url.pathname.substring(1),
    };
  } catch (error) {
    console.error('Failed to parse database connection string:', error.message);
    throw error;
  }
};

/**
 * Main function
 */
const main = async () => {
  console.log('========================================================');
  console.log('  PRICEHAWK REMOTE BACKUP EXECUTION                     ');
  console.log('========================================================');
  console.log('');
  
  try {
    // Check if remote-backup.sh exists
    if (!fs.existsSync(localScriptPath)) {
      console.error(`Error: ${localScriptPath} does not exist.`);
      process.exit(1);
    }
    
    // Parse database credentials from environment
    const { dbUser, dbName } = parseDBCredentials(process.env.DATABASE_URL);
    
    console.log(`Uploading backup script to ${sshUser}@${sshHost}:${remoteScriptPath}`);
    
    // Upload remote-backup.sh to the server using non-interactive SSH
    console.log(`Uploading backup script to ${sshUser}@${sshHost}:${remoteScriptPath}`);
    await execAsync(`scp -o BatchMode=yes -o StrictHostKeyChecking=accept-new ${localScriptPath} ${sshUser}@${sshHost}:${remoteScriptPath}`);
    
    // Make the script executable
    console.log('Making script executable...');
    await execAsync(`ssh -o BatchMode=yes -o StrictHostKeyChecking=accept-new ${sshUser}@${sshHost} "chmod +x ${remoteScriptPath}"`);
    
    console.log(`Executing remote backup with version: ${version}`);
    
    // Execute the backup script on the server with environment variables
    const { stdout, stderr } = await execAsync(
      `ssh -o BatchMode=yes -o StrictHostKeyChecking=accept-new ${sshUser}@${sshHost} "DB_USER='${dbUser}' DB_NAME='${dbName}' ${remoteScriptPath} ${version}"`
    );
    
    // Display output from remote execution
    console.log(stdout);
    
    if (stderr) {
      console.error('Warning: Script produced error output:');
      console.error(stderr);
    }
    
    // Verify backup success from the output
    if (stdout.includes('Backup process completed successfully!') && !stdout.includes('ERROR: Backup failed!')) {
      console.log('');
      console.log('Remote backup completed successfully!');
      console.log('');
      process.exit(0);
    } else {
      console.error('');
      console.error('Remote backup failed! See output above for details.');
      console.error('');
      process.exit(1);
    }
  } catch (error) {
    console.error('');
    console.error('Remote backup execution failed:', error.message);
    console.error('DO NOT PROCEED WITH DEPLOYMENT until backup issues are resolved.');
    process.exit(1);
  }
};

// Run the main function
main();
