import { NextResponse } from 'next/server';
import { supabaseConfig } from '@/lib/supabase-config';

export async function GET() {
  try {
    // Fetch active raffles ordered by created_at desc to get the latest first
    const response = await fetch(`${supabaseConfig.url}/rest/v1/raffles?status=eq.active&order=created_at.desc`, {
      method: 'GET',
      headers: supabaseConfig.headers
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Error fetching raffles:', errorText);
      return NextResponse.json(
        { error: 'Failed to fetch raffles', details: errorText },
        { status: 500 }
      );
    }

    const raffles = await response.json();
    return NextResponse.json(raffles || []);
  } catch (error) {
    console.error('Unexpected error in GET /api/raffles:', error);
    const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
    return NextResponse.json(
      { error: 'Internal server error', details: errorMessage },
      { status: 500 }
    );
  }
}
