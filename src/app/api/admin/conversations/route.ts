import { NextRequest, NextResponse } from 'next/server';

const supabaseConfig = {
  url: process.env.NEXT_PUBLIC_SUPABASE_URL!,
  headers: {
    'apikey': process.env.SUPABASE_SERVICE_ROLE_KEY!,
    'Authorization': `Bearer ${process.env.SUPABASE_SERVICE_ROLE_KEY!}`,
    'Content-Type': 'application/json',
  }
};

export async function GET(request: NextRequest) {
  try {
    // Fetch conversations with summary data
    const response = await fetch(
      `${supabaseConfig.url}/rest/v1/conversation_summaries?order=last_message_at.desc`,
      {
        method: 'GET',
        headers: supabaseConfig.headers
      }
    );

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Error fetching conversations:', errorText);
      return NextResponse.json({ error: 'Failed to fetch conversations' }, { status: 500 });
    }

    const conversations = await response.json();
    return NextResponse.json(conversations);

  } catch (error) {
    console.error('Error in conversations API:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
