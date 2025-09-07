import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';

export async function GET() {
  try {
    console.log('Testing Supabase connection...');
    
    // Test basic connection
    const { data, error } = await supabaseAdmin
      .from('raffles')
      .select('count(*)')
      .limit(1);

    if (error) {
      console.error('Supabase connection error:', error);
      return NextResponse.json({
        success: false,
        error: error.message,
        details: error
      });
    }

    console.log('Supabase connection successful:', data);
    return NextResponse.json({
      success: true,
      message: 'Database connection working',
      data
    });

  } catch (error) {
    console.error('Unexpected error testing DB:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined
    });
  }
}
