import { NextRequest, NextResponse } from 'next/server';

const supabaseUrl = 'http://127.0.0.1:54321';
const serviceRoleKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImV4cCI6MTk4MzgxMjk5Nn0.EGIM96RAZx35lJzdJsyH-qQwv8Hdp7fsn3W0YpN81IU';

export async function GET() {
  try {
    const response = await fetch(`${supabaseUrl}/rest/v1/settings?order=category.asc,key.asc`, {
      method: 'GET',
      headers: {
        'apikey': serviceRoleKey,
        'Authorization': `Bearer ${serviceRoleKey}`
      }
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Error fetching settings:', errorText);
      return NextResponse.json({ error: 'Failed to fetch settings' }, { status: 500 });
    }

    const settings = await response.json();
    
    // Transform settings array into a more usable object format
    const settingsMap = settings.reduce((acc: Record<string, unknown>, setting: {
      key: string;
      value: string;
      description: string;
      category: string;
    }) => {
      acc[setting.key] = {
        value: setting.value,
        description: setting.description,
        category: setting.category
      };
      return acc;
    }, {});

    return NextResponse.json({ settings: settingsMap });
  } catch (error) {
    console.error('Error in settings GET:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { key, value } = body;

    if (!key || value === undefined) {
      return NextResponse.json({ error: 'Key and value are required' }, { status: 400 });
    }

    const response = await fetch(`${supabaseUrl}/rest/v1/settings?key=eq.${key}`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        'apikey': serviceRoleKey,
        'Authorization': `Bearer ${serviceRoleKey}`,
        'Prefer': 'return=representation'
      },
      body: JSON.stringify({ value: value.toString() })
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Error updating setting:', errorText);
      return NextResponse.json({ error: 'Failed to update setting' }, { status: 500 });
    }

    const updatedSetting = await response.json();
    return NextResponse.json({ setting: updatedSetting[0] });
  } catch (error) {
    console.error('Error in settings PUT:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
