import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";

// Create a new ratelimiter, that allows 10 requests per 10 seconds
export const ratelimit = new Ratelimit({
  redis: Redis.fromEnv(),
  limiter: Ratelimit.slidingWindow(10, "10 s"),
  analytics: true,
});

// More restrictive rate limit for admin endpoints
export const adminRatelimit = new Ratelimit({
  redis: Redis.fromEnv(),
  limiter: Ratelimit.slidingWindow(5, "60 s"),
  analytics: true,
});

// Very restrictive for auth attempts
export const authRatelimit = new Ratelimit({
  redis: Redis.fromEnv(),
  limiter: Ratelimit.slidingWindow(3, "300 s"), // 3 attempts per 5 minutes
  analytics: true,
});
