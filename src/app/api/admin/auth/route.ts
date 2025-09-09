import { NextRequest, NextResponse } from 'next/server';
import { 
  validateAdminPassword, 
  generateAdminToken, 
  checkLoginAttempts, 
  recordFailedAttempt, 
  clearFailedAttempts 
} from '@/lib/auth';

export async function POST(request: NextRequest) {
  try {
    // Get client IP for rate limiting
    const clientIP = request.headers.get('x-forwarded-for') ?? 
                    request.headers.get('x-real-ip') ?? 
                    '127.0.0.1';
    
    // Check rate limiting
    const attemptCheck = checkLoginAttempts(clientIP);
    if (!attemptCheck.allowed) {
      return NextResponse.json(
        { 
          error: 'Too many failed attempts. Please try again later.',
          remainingTime: attemptCheck.remainingTime 
        },
        { status: 429 }
      );
    }

    const { password } = await request.json();
    
    if (!password || typeof password !== 'string') {
      return NextResponse.json(
        { error: 'Password is required' },
        { status: 400 }
      );
    }
    
    if (validateAdminPassword(password)) {
      // Clear failed attempts on successful login
      clearFailedAttempts(clientIP);
      
      const token = generateAdminToken();
      
      const response = NextResponse.json({ success: true, token });
      
      // Set secure HTTP-only cookie
      response.cookies.set('admin-token', token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
        maxAge: 24 * 60 * 60, // 24 hours
        path: '/'
      });
      
      return response;
    } else {
      // Record failed attempt
      recordFailedAttempt(clientIP);
      
      return NextResponse.json(
        { error: 'Invalid password' },
        { status: 401 }
      );
    }
  } catch (error) {
    console.error('Admin auth error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
