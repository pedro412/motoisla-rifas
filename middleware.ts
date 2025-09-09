import { NextRequest, NextResponse } from 'next/server';
import { ratelimit, adminRatelimit, authRatelimit } from './src/lib/ratelimit';

export async function middleware(request: NextRequest) {
  // Get client IP
  const ip = request.headers.get('x-forwarded-for') ?? 
            request.headers.get('x-real-ip') ?? 
            '127.0.0.1';
  
  // Apply different rate limits based on path
  let rateLimiter = ratelimit;
  
  if (request.nextUrl.pathname.startsWith('/api/admin/auth')) {
    rateLimiter = authRatelimit;
  } else if (request.nextUrl.pathname.startsWith('/api/admin')) {
    rateLimiter = adminRatelimit;
  }
  
  // Check rate limit
  const { success, limit, reset, remaining } = await rateLimiter.limit(ip);
  
  if (!success) {
    return new NextResponse('Rate limit exceeded', {
      status: 429,
      headers: {
        'X-RateLimit-Limit': limit.toString(),
        'X-RateLimit-Remaining': remaining.toString(),
        'X-RateLimit-Reset': new Date(reset).toISOString(),
      },
    });
  }
  
  // Add rate limit headers to successful requests
  const response = NextResponse.next();
  response.headers.set('X-RateLimit-Limit', limit.toString());
  response.headers.set('X-RateLimit-Remaining', remaining.toString());
  response.headers.set('X-RateLimit-Reset', new Date(reset).toISOString());
  
  return response;
}

export const config = {
  matcher: [
    '/api/:path*',
  ],
};
