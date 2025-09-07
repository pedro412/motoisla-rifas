import { NextResponse } from 'next/server';

export async function GET() {
  try {
    const supabaseUrl = 'http://127.0.0.1:54321';
    const serviceRoleKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImV4cCI6MTk4MzgxMjk5Nn0.EGIM96RAZx35lJzdJsyH-qQwv8Hdp7fsn3W0YpN81IU';

    // Fetch active raffles ordered by created_at desc to get the latest first
    const response = await fetch(`${supabaseUrl}/rest/v1/raffles?status=eq.active&order=created_at.desc`, {
      method: 'GET',
      headers: {
        'apikey': serviceRoleKey,
        'Authorization': `Bearer ${serviceRoleKey}`
      }
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
