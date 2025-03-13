/**
 * Redis Cache Implementation
 * 
 * This module provides Redis-based caching functionality for API responses
 * and other frequently accessed data. It uses Upstash Redis for serverless Redis.
 */

// Check if Redis is enabled via environment variables
const REDIS_ENABLED = process.env.REDIS_URL && process.env.REDIS_TOKEN && process.env.BYPASS_CACHE !== 'true';

/**
 * Generate a standardized cache key for consistent cache access
 */
export function generateCacheKey(prefix: string, id: string, suffix?: string): string {
  const parts = [prefix, id];
  if (suffix) parts.push(suffix);
  return parts.join(':');
}

/**
 * Get data from cache if available, otherwise fetch and cache it
 * @param key - Cache key
 * @param fetchFn - Function to call if cache miss
 * @param ttl - Time to live in seconds
 */
export async function getCachedData<T>(
  key: string,
  fetchFn: () => Promise<T>,
  ttl: number = 60 * 60 // Default: 1 hour
): Promise<T> {
  // Skip caching if Redis is not configured
  if (!REDIS_ENABLED) {
    console.log(`[Cache] Redis not configured or bypassed, fetching directly: ${key}`);
    return fetchFn();
  }

  try {
    // Try to make a serverless connection to Upstash Redis
    const { Redis } = await import('@upstash/redis');
    
    const redis = new Redis({
      url: process.env.REDIS_URL!,
      token: process.env.REDIS_TOKEN!,
    });

    // Try to get from cache first
    const cachedData = await redis.get(key);
    
    if (cachedData) {
      console.log(`[Cache] Hit: ${key}`);
      try {
        // Make sure we handle the case where the cached data might not be a string
        const parsedData = typeof cachedData === 'string' 
          ? JSON.parse(cachedData) 
          : cachedData;
        return parsedData as T;
      } catch (parseError) {
        console.error(`[Cache] Error parsing cached data for ${key}:`, parseError);
        // If we can't parse it, just fetch fresh data
        console.log(`[Cache] Falling back to fresh data for ${key}`);
        const fallbackData = await fetchFn();
        return fallbackData;
      }
    }
    
    // Cache miss - fetch fresh data
    console.log(`[Cache] Miss: ${key}`);
    const freshData = await fetchFn();
    
    try {
      // Always stringify objects before storing in cache
      const dataToCache = typeof freshData === 'object' 
        ? JSON.stringify(freshData) 
        : freshData;
      
      // Cache the result (don't await to avoid blocking)
      redis.setex(key, ttl, dataToCache)
        .catch(err => console.error(`[Cache] Error caching data for ${key}:`, err));
    } catch (stringifyError) {
      console.error(`[Cache] Error stringifying data for ${key}:`, stringifyError);
    }
    
    return freshData;
  } catch (error) {
    // If Redis fails for any reason, fall back to direct fetch
    console.error(`[Cache] Redis error:`, error);
    return fetchFn();
  }
}

/**
 * Manually set a cache value
 */
export async function setCacheValue(
  key: string,
  data: any,
  ttl: number = 60 * 60 // Default: 1 hour
): Promise<boolean> {
  // Skip caching if Redis is not configured
  if (!REDIS_ENABLED) {
    console.log(`[Cache] Redis not configured or bypassed, skipping cache set: ${key}`);
    return false;
  }

  try {
    const { Redis } = await import('@upstash/redis');
    
    const redis = new Redis({
      url: process.env.REDIS_URL!,
      token: process.env.REDIS_TOKEN!,
    });

    await redis.setex(key, ttl, JSON.stringify(data));
    return true;
  } catch (error) {
    console.error(`[Cache] Error setting cache for ${key}:`, error);
    return false;
  }
}

/**
 * Invalidate a cache entry
 */
export async function invalidateCache(key: string): Promise<boolean> {
  // Skip if Redis is not configured
  if (!REDIS_ENABLED) {
    console.log(`[Cache] Redis not configured or bypassed, skipping cache invalidation: ${key}`);
    return false;
  }

  try {
    const { Redis } = await import('@upstash/redis');
    
    const redis = new Redis({
      url: process.env.REDIS_URL!,
      token: process.env.REDIS_TOKEN!,
    });

    await redis.del(key);
    console.log(`[Cache] Invalidated: ${key}`);
    return true;
  } catch (error) {
    console.error(`[Cache] Error invalidating cache for ${key}:`, error);
    return false;
  }
}

/**
 * Invalidate multiple cache entries by pattern
 * Note: This uses SCAN which is relatively expensive, use sparingly
 */
export async function invalidateCacheByPattern(pattern: string): Promise<boolean> {
  // Skip if Redis is not configured
  if (!REDIS_ENABLED) {
    console.log(`[Cache] Redis not configured or bypassed, skipping pattern invalidation: ${pattern}`);
    return false;
  }

  try {
    const { Redis } = await import('@upstash/redis');
    
    const redis = new Redis({
      url: process.env.REDIS_URL!,
      token: process.env.REDIS_TOKEN!,
    });

    // Use SCAN to find keys matching the pattern
    const keys = await redis.keys(pattern);
    
    if (keys.length === 0) {
      console.log(`[Cache] No keys found matching pattern: ${pattern}`);
      return true;
    }

    // Delete all matching keys
    await redis.del(...keys);
    console.log(`[Cache] Invalidated ${keys.length} keys matching: ${pattern}`);
    return true;
  } catch (error) {
    console.error(`[Cache] Error invalidating cache by pattern ${pattern}:`, error);
    return false;
  }
}
