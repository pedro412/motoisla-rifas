import { NextRequest, NextResponse } from 'next/server';
import { validateAdminPassword, generateAdminToken } from '@/lib/auth';

export async function POST(request: NextRequest) {
  try {
    const { password } = await request.json();
    
    if (!password || typeof password !== 'string') {
      return NextResponse.json(
        { error: 'Password is required' },
        { status: 400 }
      );
    }
    
    if (validateAdminPassword(password)) {
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
