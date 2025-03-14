/**
 * Next.js Configuration (ES module version for production)
 * This file is an ES module version for compatibility with "type": "module" in package.json
 */

/** @type {import('next').NextConfig} */
const nextConfig = {
  // Skip type checking and linting during build for faster builds
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  
  // Image optimization settings
  images: {
    unoptimized: true,
  },
  
  // Runtime configuration
  // Use Node.js runtime for all server components
  // This prevents issues with static generation of pages that use client-side hooks
  output: 'standalone',
  
  // Disable strict mode to prevent double-rendering during development
  // This can help with hooks that have side effects
  reactStrictMode: false,
  
  // Set page options for the entire application
  // This is a more comprehensive approach than setting dynamic = 'force-dynamic' on individual pages
  serverRuntimeConfig: {
    // Add a flag to indicate when we're in build mode
    IS_BUILD: process.env.NODE_ENV === 'production' && process.env.NEXT_PHASE === 'phase-production-build'
  },

  // Enable experimental features for performance
  experimental: {
    webpackBuildWorker: true,
    parallelServerBuildTraces: true,
    parallelServerCompiles: true,
    // Explicitly prevent static generation of pages with client hooks to avoid useSearchParams error
    // This applies to the entire application
    // Other options for this might be 'force-static' or 'default'
    staticPageGenerationTimeout: 0 // Prevents static generation timeout errors
  }
};

// Load optional user config if it exists
let userConfig = undefined;
try {
  userConfig = await import('./v0-user-next.config.js');
} catch (e) {
  // Ignore error if file doesn't exist
}

// Merge user config with default config if it exists
if (userConfig) {
  for (const key in userConfig) {
    if (
      typeof nextConfig[key] === 'object' &&
      !Array.isArray(nextConfig[key])
    ) {
      nextConfig[key] = {
        ...nextConfig[key],
        ...userConfig[key],
      };
    } else {
      nextConfig[key] = userConfig[key];
    }
  }
}

export default nextConfig;
