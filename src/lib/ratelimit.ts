// Simple in-memory rate limiting (for development/small scale)
// For production, consider using Redis or a distributed solution

interface RateLimitEntry {
  count: number;
  resetTime: number;
}

class SimpleRateLimit {
  private store = new Map<string, RateLimitEntry>();
  private maxRequests: number;
  private windowMs: number;

  constructor(limit: number, windowMs: number) {
    this.maxRequests = limit;
    this.windowMs = windowMs;
    
    // Clean up expired entries every 5 minutes
    setInterval(() => this.cleanup(), 5 * 60 * 1000);
  }

  async limit(identifier: string) {
    const now = Date.now();
    const key = identifier;
    const entry = this.store.get(key);

    if (!entry || now > entry.resetTime) {
      // Create new entry or reset expired entry
      const newEntry: RateLimitEntry = {
        count: 1,
        resetTime: now + this.windowMs
      };
      this.store.set(key, newEntry);
      
      return {
        success: true,
        limit: this.maxRequests,
        remaining: this.maxRequests - 1,
        reset: newEntry.resetTime
      };
    }

    if (entry.count >= this.maxRequests) {
      return {
        success: false,
        limit: this.maxRequests,
        remaining: 0,
        reset: entry.resetTime
      };
    }

    entry.count++;
    this.store.set(key, entry);

    return {
      success: true,
      limit: this.maxRequests,
      remaining: this.maxRequests - entry.count,
      reset: entry.resetTime
    };
  }

  private cleanup() {
    const now = Date.now();
    for (const [key, entry] of this.store.entries()) {
      if (now > entry.resetTime) {
        this.store.delete(key);
      }
    }
  }
}

// Rate limiters for different endpoint types
export const ratelimit = new SimpleRateLimit(30, 60 * 1000); // 30 requests per minute
export const adminRatelimit = new SimpleRateLimit(10, 60 * 1000); // 10 requests per minute for admin
export const authRatelimit = new SimpleRateLimit(5, 5 * 60 * 1000); // 5 attempts per 5 minutes for auth
