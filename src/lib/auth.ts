import jwt from 'jsonwebtoken';
import { NextRequest } from 'next/server';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD;

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

export function validateAdminPassword(password: string): boolean {
  return Boolean(ADMIN_PASSWORD && password === ADMIN_PASSWORD);
}
