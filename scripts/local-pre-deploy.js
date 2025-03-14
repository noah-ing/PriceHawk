#!/usr/bin/env node
/**
 * Local Pre-Deployment Script for PriceHawk
 * 
 * This script handles pre-deployment tasks locally:
 * 1. Creates a pre-deployment backup of the database
 * 2. Commits and pushes changes to GitHub
 * 
 * Usage:
 * - node scripts/local-pre-deploy.js [version]
 */

import { exec } from 'child_process';
import fs from 'fs';
import util from 'util';
import readline from 'readline';

// Promisify exec
const execAsync = util.promisify(exec);

// Create readline interface for user input
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

// Promisify readline question
const question = (query) => new Promise(resolve => rl.question(query, resolve));

/**
 * Main function
 */
const main = async () => {
  console.log('========================================================');
  console.log('  PRICEHAWK LOCAL PRE-DEPLOYMENT SCRIPT                 ');
  console.log('========================================================');
  console.log('');
  
  try {
    // Step 1: Check if we have a clean git working directory
    console.log('Checking git status...');
    const { stdout: gitStatus } = await execAsync('git status --porcelain');
    
    if (gitStatus.trim()) {
      console.log('You have uncommitted changes:');
      console.log(gitStatus);
      const proceed = await question('Do you want to continue anyway? (y/n): ');
      if (proceed.toLowerCase() !== 'y') {
        console.log('Aborted.');
        process.exit(0);
      }
    } else {
      console.log('Git working directory is clean.');
    }
    
    // Step 2: Create a database backup
    console.log('\nCreating database backup...');
    const backupCommand = 'ssh -o BatchMode=no -o StrictHostKeyChecking=accept-new ${SSH_USER}@${SSH_HOST} "pg_dump -h localhost -U ${DB_USER} -d ${DB_NAME} -F c -f ~/backups/pre-deploy-$(date +%Y%m%d-%H%M%S).dump"';
    
    console.log(`\nYou'll need to run the following command with your SSH credentials:`);
    console.log(`\n${backupCommand}\n`);
    console.log('Replace ${SSH_USER}, ${SSH_HOST}, ${DB_USER}, and ${DB_NAME} with your actual credentials.\n');
    
    const backupConfirm = await question('Have you successfully created the backup? (y/n): ');
    
    if (backupConfirm.toLowerCase() !== 'y') {
      console.log('Please create a backup before deploying!');
      process.exit(1);
    }
    
    // Step 3: Commit changes
    console.log('\nReady to commit and push your changes');
    const commitMessage = await question('Enter commit message: ');
    
    console.log('\nThe following git command will be executed:');
    console.log(`git add . && git commit -m "${commitMessage}" && git push origin master`);
    
    const confirmDeploy = await question('\nProceed with deployment? (y/n): ');
    
    if (confirmDeploy.toLowerCase() === 'y') {
      console.log('\nCommitting and pushing changes...');
      await execAsync(`git add . && git commit -m "${commitMessage}" && git push origin master`);
      console.log('\nDeployment initiated! Check GitHub Actions for progress.');
    } else {
      console.log('\nDeployment aborted.');
    }
    
  } catch (error) {
    console.error('\nError:', error.message);
    process.exit(1);
  } finally {
    rl.close();
  }
};

// Run the main function
main();
