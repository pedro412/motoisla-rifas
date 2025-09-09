import jwt from 'jsonwebtoken';
import { NextRequest } from 'next/server';
import crypto from 'crypto';
import { ENV } from './env';

const JWT_SECRET = ENV.JWT_SECRET;
const ADMIN_PASSWORD = ENV.ADMIN_PASSWORD;

// In-memory store for failed login attempts (in production, use Redis)
const failedAttempts = new Map<string, { count: number; lastAttempt: number }>();
const MAX_FAILED_ATTEMPTS = 5;
const LOCKOUT_DURATION = 15 * 60 * 1000; // 15 minutes

export interface AdminSession {
  isAdmin: true;
  iat: number;
  exp: number;
}

export function generateAdminToken(): string {
  return jwt.sign(
    { isAdmin: true },
    JWT_SECRET,
    { expiresIn: '24h' }
  );
}

export function verifyAdminToken(token: string): AdminSession | null {
  try {
    const decoded = jwt.verify(token, JWT_SECRET) as AdminSession;
    return decoded;
  } catch {
    return null;
  }
}

export function getAdminTokenFromRequest(request: NextRequest): string | null {
  // Check Authorization header
  const authHeader = request.headers.get('authorization');
  if (authHeader && authHeader.startsWith('Bearer ')) {
    return authHeader.substring(7);
  }
  
  // Check cookie
  const token = request.cookies.get('admin-token')?.value;
  return token || null;
}

export function verifyAdminRequest(request: NextRequest): boolean {
  const token = getAdminTokenFromRequest(request);
  if (!token) return false;
  
  const session = verifyAdminToken(token);
  return session !== null;
}

// Rate limiting for login attempts
export function checkLoginAttempts(clientIP: string): { allowed: boolean; remainingTime?: number } {
  const now = Date.now();
  const attempts = failedAttempts.get(clientIP);
  
  if (!attempts) {
    return { allowed: true };
  }
  
  // Reset if lockout period has passed
  if (now - attempts.lastAttempt > LOCKOUT_DURATION) {
    failedAttempts.delete(clientIP);
    return { allowed: true };
  }
  
  // Check if locked out
  if (attempts.count >= MAX_FAILED_ATTEMPTS) {
    const remainingTime = LOCKOUT_DURATION - (now - attempts.lastAttempt);
    return { allowed: false, remainingTime };
  }
  
  return { allowed: true };
}

export function recordFailedAttempt(clientIP: string): void {
  const now = Date.now();
  const attempts = failedAttempts.get(clientIP);
  
  if (attempts) {
    attempts.count++;
    attempts.lastAttempt = now;
  } else {
    failedAttempts.set(clientIP, { count: 1, lastAttempt: now });
  }
}

export function clearFailedAttempts(clientIP: string): void {
  failedAttempts.delete(clientIP);
}

// Enhanced password validation with timing attack protection
export function validateAdminPassword(password: string): boolean {
  if (!ADMIN_PASSWORD || !password) {
    // Always perform a hash operation to prevent timing attacks
    crypto.timingSafeEqual(Buffer.from('dummy'), Buffer.from('dummy'));
    return false;
  }
  
  // Use timing-safe comparison
  const providedBuffer = Buffer.from(password, 'utf8');
  const expectedBuffer = Buffer.from(ADMIN_PASSWORD, 'utf8');
  
  // Ensure buffers are same length to prevent timing attacks
  if (providedBuffer.length !== expectedBuffer.length) {
    return false;
  }
  
  return crypto.timingSafeEqual(providedBuffer, expectedBuffer);
}
