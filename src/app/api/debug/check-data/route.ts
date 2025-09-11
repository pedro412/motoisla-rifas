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
    const results: any = {};

    // Check conversations count
    try {
      const conversationsResponse = await fetch(
        `${supabaseConfig.url}/rest/v1/conversations?select=count`,
        {
          method: 'GET',
          headers: { ...supabaseConfig.headers, 'Prefer': 'count=exact' }
        }
      );
      if (conversationsResponse.ok) {
        const count = conversationsResponse.headers.get('content-range');
        results.conversations_count = count ? parseInt(count.split('/')[1]) : 0;
      } else {
        results.conversations_count = { error: await conversationsResponse.text() };
      }
    } catch (error) {
      results.conversations_count = { error: error instanceof Error ? error.message : 'Unknown error' };
    }

    // Check messages count
    try {
      const messagesResponse = await fetch(
        `${supabaseConfig.url}/rest/v1/messages?select=count`,
        {
          method: 'GET',
          headers: { ...supabaseConfig.headers, 'Prefer': 'count=exact' }
        }
      );
      if (messagesResponse.ok) {
        const count = messagesResponse.headers.get('content-range');
        results.messages_count = count ? parseInt(count.split('/')[1]) : 0;
      } else {
        results.messages_count = { error: await messagesResponse.text() };
      }
    } catch (error) {
      results.messages_count = { error: error instanceof Error ? error.message : 'Unknown error' };
    }

    // Get sample conversations
    try {
      const sampleConversationsResponse = await fetch(
        `${supabaseConfig.url}/rest/v1/conversations?limit=5&select=*`,
        {
          method: 'GET',
          headers: supabaseConfig.headers
        }
      );
      if (sampleConversationsResponse.ok) {
        results.sample_conversations = await sampleConversationsResponse.json();
      } else {
        results.sample_conversations = { error: await sampleConversationsResponse.text() };
      }
    } catch (error) {
      results.sample_conversations = { error: error instanceof Error ? error.message : 'Unknown error' };
    }

    // Get sample messages
    try {
      const sampleMessagesResponse = await fetch(
        `${supabaseConfig.url}/rest/v1/messages?limit=5&select=*&order=timestamp.desc`,
        {
          method: 'GET',
          headers: supabaseConfig.headers
        }
      );
      if (sampleMessagesResponse.ok) {
        results.sample_messages = await sampleMessagesResponse.json();
      } else {
        results.sample_messages = { error: await sampleMessagesResponse.text() };
      }
    } catch (error) {
      results.sample_messages = { error: error instanceof Error ? error.message : 'Unknown error' };
    }

    // Check conversation summaries
    try {
      const summariesResponse = await fetch(
        `${supabaseConfig.url}/rest/v1/conversation_summaries?limit=5`,
        {
          method: 'GET',
          headers: supabaseConfig.headers
        }
      );
      if (summariesResponse.ok) {
        results.conversation_summaries = await summariesResponse.json();
      } else {
        results.conversation_summaries = { error: await summariesResponse.text() };
      }
    } catch (error) {
      results.conversation_summaries = { error: error instanceof Error ? error.message : 'Unknown error' };
    }

    return NextResponse.json({
      data_check: results,
      diagnosis: getDiagnosis(results)
    });

  } catch (error) {
    return NextResponse.json({ 
      error: 'Failed to check data',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

function getDiagnosis(results: any): string {
  const conversationsCount = typeof results.conversations_count === 'number' ? results.conversations_count : 0;
  const messagesCount = typeof results.messages_count === 'number' ? results.messages_count : 0;

  if (conversationsCount === 0 && messagesCount === 0) {
    return "No data found. Webhook is not storing messages. Check: 1) WhatsApp webhook configured, 2) Webhook receiving events, 3) Database permissions";
  } else if (messagesCount > 0 && conversationsCount === 0) {
    return "Messages exist but no conversations. Issue with conversation creation in webhook";
  } else if (conversationsCount > 0 && messagesCount === 0) {
    return "Conversations exist but no messages. Issue with message storage in webhook";
  } else if (conversationsCount > 0 && messagesCount > 0) {
    return "Data exists but conversation_summaries view might have issues. Check view query";
  } else {
    return "Unable to determine issue from data counts";
  }
}
