import { NextRequest } from 'next/server';
import crypto from 'crypto';

const CSRF_SECRET = process.env.CSRF_SECRET || 'csrf-secret-key';

export function generateCSRFToken(): string {
  return crypto.randomBytes(32).toString('hex');
}

export function verifyCSRFToken(token: string, sessionToken: string): boolean {
  // Simple HMAC-based verification
  const expected = crypto
    .createHmac('sha256', CSRF_SECRET)
    .update(sessionToken)
    .digest('hex');
  
  return crypto.timingSafeEqual(
    Buffer.from(token, 'hex'),
    Buffer.from(expected, 'hex')
  );
}

export function getCSRFTokenFromRequest(request: NextRequest): string | null {
  // Check X-CSRF-Token header
  const headerToken = request.headers.get('x-csrf-token');
  if (headerToken) return headerToken;
  
  // Check form data for POST requests
  const contentType = request.headers.get('content-type');
  if (contentType?.includes('application/x-www-form-urlencoded')) {
    // Would need to parse form data - simplified for now
    return null;
  }
  
  return null;
}

export function validateCSRFForRequest(request: NextRequest): boolean {
  // Skip CSRF for GET requests
  if (request.method === 'GET') return true;
  
  // Skip CSRF for same-origin requests (basic check)
  const origin = request.headers.get('origin');
  const host = request.headers.get('host');
  
  if (origin && host && origin.includes(host)) {
    return true;
  }
  
  // For now, we'll implement a basic same-origin policy
  // In production, you'd want proper CSRF tokens
  return false;
}
