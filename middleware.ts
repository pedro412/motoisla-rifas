import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { ratelimit, adminRatelimit, authRatelimit } from './src/lib/ratelimit'
import { validateCSRFForRequest } from './src/lib/csrf'
import { addSecurityHeaders, handleCORSPreflight, setCORSHeaders } from './src/lib/security-headers';

export async function middleware(request: NextRequest) {
  // Handle CORS preflight requests
  const corsResponse = handleCORSPreflight(request);
  if (corsResponse) {
    return corsResponse;
  }

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
  
  // Apply CSRF protection for non-GET requests to API routes
  if (request.nextUrl.pathname.startsWith('/api/') && request.method !== 'GET') {
    if (!validateCSRFForRequest(request)) {
      return NextResponse.json(
        { error: 'CSRF validation failed' },
        { status: 403 }
      );
    }
  }

  // Check rate limit
  const result = await rateLimiter.limit(ip);
  
  if (!result.success) {
    return NextResponse.json(
      { error: 'Too many requests' },
      { 
        status: 429,
        headers: {
          'X-RateLimit-Limit': result.limit.toString(),
          'X-RateLimit-Remaining': result.remaining.toString(),
          'X-RateLimit-Reset': result.reset.toString(),
        }
      }
    );
  }
  
  // Add rate limit headers to successful requests
  const response = NextResponse.next();
  response.headers.set('X-RateLimit-Limit', result.limit.toString());
  response.headers.set('X-RateLimit-Remaining', result.remaining.toString());
  response.headers.set('X-RateLimit-Reset', result.reset.toString());
  
  // Add security headers
  addSecurityHeaders(response);
  
  // Add CORS headers for API routes
  if (request.nextUrl.pathname.startsWith('/api/')) {
    const origin = request.headers.get('origin');
    setCORSHeaders(response, origin || undefined);
  }
  
  return response;
}

export const config = {
  matcher: [
    '/api/:path*',
  ],
};
