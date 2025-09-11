import { NextRequest, NextResponse } from 'next/server';

const supabaseConfig = {
  url: process.env.NEXT_PUBLIC_SUPABASE_URL!,
  headers: {
    'apikey': process.env.SUPABASE_SERVICE_ROLE_KEY!,
    'Authorization': `Bearer ${process.env.SUPABASE_SERVICE_ROLE_KEY!}`,
    'Content-Type': 'application/json',
  }
};

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const conversationId = params.id;

    // Call the stored procedure to mark conversation as read
    const response = await fetch(
      `${supabaseConfig.url}/rest/v1/rpc/mark_conversation_as_read`,
      {
        method: 'POST',
        headers: supabaseConfig.headers,
        body: JSON.stringify({ conv_id: conversationId })
      }
    );

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Error marking conversation as read:', errorText);
      return NextResponse.json({ error: 'Failed to mark conversation as read' }, { status: 500 });
    }

    return NextResponse.json({ success: true });

  } catch (error) {
    console.error('Error in mark-read API:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
