import { NextRequest, NextResponse } from 'next/server';
import { ErrorService, ErrorDefinitions } from '@/lib/services/error-service';

// Simple in-memory store for rate limiting
// In a production environment with multiple instances, this should be replaced with Redis
class RateLimitStore {
  private ipRequests: Map<string, number[]> = new Map();
  private authRequests: Map<string, number[]> = new Map();
  
  cleanupOldEntries(map: Map<string, number[]>, windowStart: number) {
    for (const [key, timestamps] of map.entries()) {
      const filteredTimestamps = timestamps.filter(time => time > windowStart);
      if (filteredTimestamps.length === 0) {
        map.delete(key);
      } else {
        map.set(key, filteredTimestamps);
      }
    }
  }
  
  ipLimitExceeded(ip: string, limit: number, window: number): boolean {
    const now = Date.now();
    const windowStart = now - window;
    
    this.cleanupOldEntries(this.ipRequests, windowStart);
    
    if (!this.ipRequests.has(ip)) {
      this.ipRequests.set(ip, [now]);
      return false;
    }
    
    const requests = this.ipRequests.get(ip)!;
    const recentRequests = requests.filter(time => time > windowStart);
    
    if (recentRequests.length >= limit) {
      return true;
    }
    
    this.ipRequests.set(ip, [...recentRequests, now]);
    return false;
  }
  
  authLimitExceeded(identifier: string, limit: number, window: number): boolean {
    const now = Date.now();
    const windowStart = now - window;
    
    this.cleanupOldEntries(this.authRequests, windowStart);
    
    if (!this.authRequests.has(identifier)) {
      this.authRequests.set(identifier, [now]);
      return false;
    }
    
    const requests = this.authRequests.get(identifier)!;
    const recentRequests = requests.filter(time => time > windowStart);
    
    if (recentRequests.length >= limit) {
      return true;
    }
    
    this.authRequests.set(identifier, [...recentRequests, now]);
    return false;
  }
}

// Singleton instance of rate limit store
const rateLimitStore = new RateLimitStore();

// Rate limits based on subscription tier (requests per hour)
export const RATE_LIMITS = {
  auth: 100, // 100 attempts per hour
  api: {
    anonymous: 300,      // 300 requests per hour
    free: 500,           // 500 requests per hour
    basic: 1000,         // 1000 requests per hour
    premium: 2000,       // 2000 requests per hour
    professional: 5000   // 5000 requests per hour
  },
  scraping: {
    anonymous: 5,        // 5 scrapes per hour
    free: 10,            // 10 scrapes per hour
    basic: 30,           // 30 scrapes per hour
    premium: 60,         // 60 scrapes per hour
    professional: 120    // 120 scrapes per hour
  }
};

// Rate limiting for API routes based on IP address
export function withApiRateLimit(handler: Function, options = { limit: RATE_LIMITS.api.anonymous, window: 60 * 60 * 1000 }) {
  return async function(req: NextRequest, ...args: any[]) {
    const ip = req.headers.get('x-forwarded-for') || 'unknown';
    
    if (rateLimitStore.ipLimitExceeded(ip, options.limit, options.window)) {
      const error = ErrorService.createError(
        ErrorDefinitions.RATE_LIMIT_EXCEEDED, 
        { source: 'API', ip }
      );
      return NextResponse.json(error.toResponse(), { status: 429 });
    }
    
    return handler(req, ...args);
  };
}

// Rate limiting for authentication routes
export function withAuthRateLimit(handler: Function, options = { limit: RATE_LIMITS.auth, window: 60 * 60 * 1000 }) {
  return async function(req: NextRequest, ...args: any[]) {
    const body = await req.json();
    const identifier = body.email || body.username || 'unknown';
    const ip = req.headers.get('x-forwarded-for') || 'unknown';
    
    // Use both IP and identifier to prevent abuse
    const rateLimitKey = `${ip}:${identifier}`;
    
    if (rateLimitStore.authLimitExceeded(rateLimitKey, options.limit, options.window)) {
      return NextResponse.json(
        {
          error: 'Too many authentication attempts, please try again later',
          code: 'AUTH_RATE_LIMIT_EXCEEDED'
        },
        { status: 429 }
      );
    }
    
    return handler(req, ...args);
  };
}

// Rate limiting for scraping operations
export function withScrapingRateLimit(
  handler: Function, 
  getSubscriptionTier: (req: NextRequest) => Promise<string>, 
  options = { window: 60 * 60 * 1000 }
) {
  return async function(req: NextRequest, ...args: any[]) {
    const ip = req.headers.get('x-forwarded-for') || 'unknown';
    
    try {
      // Get user's subscription tier
      const tier = await getSubscriptionTier(req);
      const limit = RATE_LIMITS.scraping[tier as keyof typeof RATE_LIMITS.scraping] || RATE_LIMITS.scraping.anonymous;
      
      if (rateLimitStore.ipLimitExceeded(ip, limit, options.window)) {
        const error = ErrorService.createError(
          ErrorDefinitions.RATE_LIMIT_EXCEEDED, 
          { source: 'Scraping', tier, ip }
        );
        return NextResponse.json(error.toResponse(), { status: 429 });
      }
      
      return handler(req, ...args);
    } catch (error) {
      // Default to anonymous tier if there's an error determining subscription
      if (rateLimitStore.ipLimitExceeded(ip, RATE_LIMITS.scraping.anonymous, options.window)) {
        const error = ErrorService.createError(
          ErrorDefinitions.RATE_LIMIT_EXCEEDED, 
          { source: 'Scraping', tier: 'anonymous', ip }
        );
        return NextResponse.json(error.toResponse(), { status: 429 });
      }
      
      return handler(req, ...args);
    }
  };
}
