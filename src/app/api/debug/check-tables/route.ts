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

    // Check if conversations table exists
    try {
      const conversationsResponse = await fetch(
        `${supabaseConfig.url}/rest/v1/conversations?limit=1`,
        {
          method: 'GET',
          headers: supabaseConfig.headers
        }
      );
      results.conversations_table = {
        exists: conversationsResponse.ok,
        status: conversationsResponse.status,
        error: conversationsResponse.ok ? null : await conversationsResponse.text()
      };
    } catch (error) {
      results.conversations_table = {
        exists: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }

    // Check if messages table exists
    try {
      const messagesResponse = await fetch(
        `${supabaseConfig.url}/rest/v1/messages?limit=1`,
        {
          method: 'GET',
          headers: supabaseConfig.headers
        }
      );
      results.messages_table = {
        exists: messagesResponse.ok,
        status: messagesResponse.status,
        error: messagesResponse.ok ? null : await messagesResponse.text()
      };
    } catch (error) {
      results.messages_table = {
        exists: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }

    // Check if conversation_summaries view exists
    try {
      const viewResponse = await fetch(
        `${supabaseConfig.url}/rest/v1/conversation_summaries?limit=1`,
        {
          method: 'GET',
          headers: supabaseConfig.headers
        }
      );
      results.conversation_summaries_view = {
        exists: viewResponse.ok,
        status: viewResponse.status,
        error: viewResponse.ok ? null : await viewResponse.text()
      };
    } catch (error) {
      results.conversation_summaries_view = {
        exists: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }

    // Check existing tables in database
    try {
      const tablesResponse = await fetch(
        `${supabaseConfig.url}/rest/v1/information_schema.tables?table_schema=eq.public&select=table_name`,
        {
          method: 'GET',
          headers: supabaseConfig.headers
        }
      );
      if (tablesResponse.ok) {
        const tables = await tablesResponse.json();
        results.existing_tables = tables.map((t: any) => t.table_name);
      } else {
        results.existing_tables = { error: await tablesResponse.text() };
      }
    } catch (error) {
      results.existing_tables = { 
        error: error instanceof Error ? error.message : 'Unknown error' 
      };
    }

    return NextResponse.json({
      database_check: results,
      recommendation: !results.conversations_table?.exists 
        ? "Run database migration: supabase db push or apply migration 005_messaging_system.sql"
        : "Tables exist, check webhook logs for message storage issues"
    });

  } catch (error) {
    return NextResponse.json({ 
      error: 'Failed to check database',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}
