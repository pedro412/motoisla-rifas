import { NextRequest, NextResponse } from 'next/server';
import { supabaseConfig } from '@/lib/supabase-config';


// Using supabaseConfig.url instead of hardcoded localhost
// Using supabaseConfig.serviceRoleKey instead of hardcoded key

export async function GET() {
  try {
    const response = await fetch(`${supabaseConfig.url}/rest/v1/settings?order=category.asc,key.asc`, {
      method: 'GET',
      headers: supabaseConfig.headers
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

    const response = await fetch(`${supabaseConfig.url}/rest/v1/settings?key=eq.${key}`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        'apikey': supabaseConfig.serviceRoleKey,
        'Authorization': `Bearer ${supabaseConfig.serviceRoleKey}`,
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

export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json();
    
    // Handle single setting update (legacy format)
    if (body.key && body.value !== undefined) {
      const response = await fetch(`${supabaseConfig.url}/rest/v1/settings?key=eq.${body.key}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'apikey': supabaseConfig.serviceRoleKey,
          'Authorization': `Bearer ${supabaseConfig.serviceRoleKey}`,
          'Prefer': 'return=representation'
        },
        body: JSON.stringify({ value: body.value.toString() })
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('Error updating setting:', errorText);
        return NextResponse.json({ error: 'Failed to update setting' }, { status: 500 });
      }

      const updatedSetting = await response.json();
      return NextResponse.json({ setting: updatedSetting[0] });
    }
    
    // Handle bulk settings update (AdminSettings format)
    const settingsToUpdate = Object.entries(body).filter(([, value]) => value !== undefined);
    
    if (settingsToUpdate.length === 0) {
      return NextResponse.json({ error: 'No settings to update' }, { status: 400 });
    }

    const updatePromises = settingsToUpdate.map(async ([key, value]) => {
      const response = await fetch(`${supabaseConfig.url}/rest/v1/settings?key=eq.${key}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'apikey': supabaseConfig.serviceRoleKey,
          'Authorization': `Bearer ${supabaseConfig.serviceRoleKey}`,
          'Prefer': 'return=representation'
        },
        body: JSON.stringify({ value: String(value) })
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error(`Error updating setting ${key}:`, errorText);
        throw new Error(`Failed to update setting: ${key}`);
      }

      return response.json();
    });

    const results = await Promise.all(updatePromises);
    return NextResponse.json({ 
      message: 'Settings updated successfully',
      updatedSettings: results.flat()
    });
  } catch (error) {
    console.error('Error in settings PATCH:', error);
    return NextResponse.json({ 
      error: error instanceof Error ? error.message : 'Internal server error' 
    }, { status: 500 });
  }
}
