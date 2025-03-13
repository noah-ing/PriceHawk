/**
 * Next.js Configuration (ES module version for production)
 * This file is an ES module version for compatibility with "type": "module" in package.json
 */

/** @type {import('next').NextConfig} */
const nextConfig = {
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    unoptimized: true,
  },
  experimental: {
    webpackBuildWorker: true,
    parallelServerBuildTraces: true,
    parallelServerCompiles: true,
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
