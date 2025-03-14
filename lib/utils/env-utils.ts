/**
 * Environment Utilities
 * 
 * Centralized utilities for detecting build environments and runtime conditions.
 * Used to properly skip database connections and other runtime-only operations
 * during build time, static generation, or CI/CD processes.
 */

/**
 * Checks if the code is running in a build environment rather than runtime
 * 
 * This includes:
 * - Next.js build phase (NEXT_PHASE=phase-production-build)
 * - CI/CD environments (CI=true)
 * - Static generation contexts
 * 
 * @returns {boolean} True if in a build environment, false otherwise
 */
export function isBuildEnvironment(): boolean {
  // Check for explicit build phase environment variable from Next.js
  if (process.env.NEXT_PHASE === 'phase-production-build') {
    return true;
  }
  
  // Check for CI/CD environment
  if (process.env.CI === 'true') {
    return true;
  }
  
  // We could add more checks here if needed in the future
  
  return false;
}

/**
 * Checks if the code is running in a browser environment
 * 
 * @returns {boolean} True if in a browser, false if in Node.js
 */
export function isBrowser(): boolean {
  return typeof window !== 'undefined';
}

/**
 * A wrapper function to safely run code that should only execute at runtime
 * 
 * @param callback The function to run only at runtime
 * @param fallback Optional fallback value to return during build
 * @returns The result of the callback or the fallback
 */
export function runtimeOnly<T>(callback: () => T, fallback?: T): T | undefined {
  if (isBuildEnvironment()) {
    console.log('[Runtime Guard] Skipping runtime operation during build phase');
    return fallback;
  }
  
  return callback();
}

/**
 * Log environment context information
 * 
 * Useful for debugging environment detection issues
 */
export function logEnvironmentInfo(context: string): void {
  console.log(`[Environment Info: ${context}]
  - Is Build Environment: ${isBuildEnvironment()}
  - NEXT_PHASE: ${process.env.NEXT_PHASE || 'not set'}
  - CI: ${process.env.CI || 'not set'}
  - NODE_ENV: ${process.env.NODE_ENV || 'not set'}
  `);
}
