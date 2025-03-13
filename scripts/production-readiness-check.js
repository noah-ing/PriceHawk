#!/usr/bin/env node
/**
 * PriceHawk Production Readiness Check
 * 
 * This script performs a comprehensive check of the application's readiness
 * for production deployment, verifying all required components are in place.
 * 
 * Usage:
 * node scripts/production-readiness-check.js
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { execSync } from 'child_process';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

// Get the directory name
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const rootDir = path.resolve(__dirname, '..');

// Color codes for console output
const colors = {
  reset: '\x1b[0m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m',
  white: '\x1b[37m'
};

// Required files for production
const requiredFiles = [
  '.env',
  'next.config.js',
  'package.json',
  'package-lock.json',
  'prisma/schema.prisma',
  'app/api/health/route.ts',
  'lib/middleware/rate-limit.ts',
  '.github/workflows/deploy.yml',
  'docs/deployment-guide.md'
];

// Required environment variables
const requiredEnvVars = [
  'DATABASE_URL',
  'NEXTAUTH_SECRET',
  'NEXTAUTH_URL'
];

// Production-recommended environment variables
const recommendedEnvVars = [
  'STRIPE_SECRET_KEY',
  'STRIPE_PUBLISHABLE_KEY',
  'NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY',
  'STRIPE_WEBHOOK_SECRET',
  'SENDGRID_API_KEY',
  'SENDGRID_FROM_EMAIL',
  'ENABLE_REAL_TIME_SCRAPING',
  'ENABLE_SCHEDULED_CHECKS',
  'ENABLE_SUBSCRIPTIONS',
  'ENABLE_EMAIL_NOTIFICATIONS'
];

// Check if a file exists
function fileExists(filePath) {
  return fs.existsSync(path.join(rootDir, filePath));
}

// Check if an environment variable is set
function envVarExists(varName) {
  return process.env[varName] !== undefined && process.env[varName] !== '';
}

// Run a checkup and return results
function runCheck(name, check, details = '') {
  const result = {
    name,
    pass: false,
    message: '',
    details
  };

  try {
    result.pass = check();
    result.message = result.pass ? 'Pass' : 'Fail';
  } catch (error) {
    result.pass = false;
    result.message = 'Error';
    result.details = error.message;
  }

  return result;
}

// Run a command and capture output
function runCommand(command) {
  try {
    return execSync(command, { encoding: 'utf8' });
  } catch (error) {
    console.error(`Command error: ${error.message}`);
    return error.message;
  }
}

// Print check result
function printCheckResult(result) {
  const icon = result.pass ? '✅' : '❌';
  const color = result.pass ? colors.green : colors.red;
  console.log(`${icon} ${color}${result.name}${colors.reset}: ${result.message}`);
  if (result.details && !result.pass) {
    console.log(`   ${colors.yellow}${result.details}${colors.reset}`);
  }
}

// Main function
async function main() {
  console.log(`\n${colors.cyan}PriceHawk Production Readiness Check${colors.reset}`);
  console.log(`${colors.cyan}=====================================\n${colors.reset}`);

  const checks = [];
  let totalPassed = 0;

  // Check for required files
  console.log(`\n${colors.magenta}Required Files${colors.reset}`);
  console.log(`${colors.magenta}==============\n${colors.reset}`);
  
  for (const file of requiredFiles) {
    const result = runCheck(`File: ${file}`, () => fileExists(file));
    checks.push(result);
    printCheckResult(result);
    if (result.pass) totalPassed++;
  }

  // Check for required environment variables
  console.log(`\n${colors.magenta}Required Environment Variables${colors.reset}`);
  console.log(`${colors.magenta}=============================\n${colors.reset}`);
  
  for (const envVar of requiredEnvVars) {
    const result = runCheck(`Environment Variable: ${envVar}`, () => envVarExists(envVar));
    checks.push(result);
    printCheckResult(result);
    if (result.pass) totalPassed++;
  }

  // Check for recommended environment variables
  console.log(`\n${colors.magenta}Recommended Environment Variables${colors.reset}`);
  console.log(`${colors.magenta}===============================\n${colors.reset}`);
  
  for (const envVar of recommendedEnvVars) {
    const result = runCheck(`Environment Variable: ${envVar}`, () => envVarExists(envVar), 'Recommended for production');
    result.recommended = true;
    checks.push(result);
    printCheckResult(result);
    if (result.pass) totalPassed++;
  }

  // Check database connection
  console.log(`\n${colors.magenta}Database Checks${colors.reset}`);
  console.log(`${colors.magenta}==============\n${colors.reset}`);
  
  const dbCheck = runCheck('Database Connection', () => {
    if (!envVarExists('DATABASE_URL')) {
      throw new Error('DATABASE_URL is not set');
    }
    const output = runCommand('npx prisma validate');
    return !output.includes('Error');
  });
  
  checks.push(dbCheck);
  printCheckResult(dbCheck);
  if (dbCheck.pass) totalPassed++;

  // Check for build
  console.log(`\n${colors.magenta}Build Checks${colors.reset}`);
  console.log(`${colors.magenta}============\n${colors.reset}`);
  
  const buildCheck = runCheck('Next.js Build Directory', () => {
    return fs.existsSync(path.join(rootDir, '.next'));
  }, 'Run npm run build before deploying');
  
  checks.push(buildCheck);
  printCheckResult(buildCheck);
  if (buildCheck.pass) totalPassed++;

  // Summary
  const requiredChecks = checks.filter(check => !check.recommended);
  const requiredPassed = requiredChecks.filter(check => check.pass).length;
  const recommendedChecks = checks.filter(check => check.recommended);
  const recommendedPassed = recommendedChecks.filter(check => check.pass).length;
  
  console.log(`\n${colors.cyan}Summary${colors.reset}`);
  console.log(`${colors.cyan}=======\n${colors.reset}`);
  
  console.log(`Required Checks: ${colors.green}${requiredPassed}/${requiredChecks.length} passed${colors.reset}`);
  console.log(`Recommended Checks: ${colors.green}${recommendedPassed}/${recommendedChecks.length} passed${colors.reset}`);
  console.log(`Total: ${colors.green}${totalPassed}/${checks.length} passed${colors.reset}`);

  // Final assessment
  console.log(`\n${colors.cyan}Readiness Assessment${colors.reset}`);
  console.log(`${colors.cyan}====================\n${colors.reset}`);
  
  if (requiredPassed === requiredChecks.length) {
    if (recommendedPassed === recommendedChecks.length) {
      console.log(`${colors.green}✅ READY FOR PRODUCTION!${colors.reset} All checks passed.`);
    } else {
      console.log(`${colors.yellow}⚠️ READY WITH WARNINGS${colors.reset} All required checks passed, but some recommended checks failed.`);
      console.log(`   Consider addressing the warnings before deployment.`);
    }
  } else {
    console.log(`${colors.red}❌ NOT READY FOR PRODUCTION${colors.reset} Some required checks failed.`);
    console.log(`   Please address the failed checks before deploying.`);
  }

  console.log(`\n${colors.cyan}Next Steps${colors.reset}`);
  console.log(`${colors.cyan}==========\n${colors.reset}`);
  
  if (requiredPassed === requiredChecks.length) {
    console.log(`1. Run a pre-deployment database backup:`);
    console.log(`   ${colors.white}node scripts/pre-deployment-backup.js${colors.reset}`);
    console.log(`2. Verify database indexes:`);
    console.log(`   ${colors.white}node scripts/verify-indexes.js${colors.reset}`);
    console.log(`3. Deploy using GitHub Actions or follow the manual deployment steps in the deployment guide.`);
  } else {
    console.log(`1. Address the failed checks.`);
    console.log(`2. Run this script again to verify all checks pass.`);
    console.log(`3. Refer to docs/deployment-guide.md for detailed deployment instructions.`);
  }
  
  console.log();
}

main().catch(error => {
  console.error('Error:', error);
  process.exit(1);
});
