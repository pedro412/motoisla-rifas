import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function GET() {
  try {
    // Test database connection
    const { data: raffles, error } = await supabase
      .from('raffles')
      .select('id, title, status')
      .limit(1);

    if (error) {
      return NextResponse.json({ 
        success: false, 
        error: error.message,
        message: 'Database connection failed'
      }, { status: 500 });
    }

    return NextResponse.json({ 
      success: true, 
      message: 'Database connected successfully!',
      data: raffles 
    });
  } catch (error) {
    return NextResponse.json({ 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error',
      message: 'Connection test failed'
    }, { status: 500 });
  }
}
