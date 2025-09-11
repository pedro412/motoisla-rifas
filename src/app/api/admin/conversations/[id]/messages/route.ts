import { NextRequest, NextResponse } from 'next/server';

const supabaseConfig = {
  url: process.env.NEXT_PUBLIC_SUPABASE_URL!,
  headers: {
    'apikey': process.env.SUPABASE_SERVICE_ROLE_KEY!,
    'Authorization': `Bearer ${process.env.SUPABASE_SERVICE_ROLE_KEY!}`,
    'Content-Type': 'application/json',
  }
};

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const conversationId = params.id;

    // Fetch messages for the conversation
    const response = await fetch(
      `${supabaseConfig.url}/rest/v1/messages?conversation_id=eq.${conversationId}&order=timestamp.asc`,
      {
        method: 'GET',
        headers: supabaseConfig.headers
      }
    );

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Error fetching messages:', errorText);
      return NextResponse.json({ error: 'Failed to fetch messages' }, { status: 500 });
    }

    const messages = await response.json();
    return NextResponse.json(messages);

  } catch (error) {
    console.error('Error in messages API:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
