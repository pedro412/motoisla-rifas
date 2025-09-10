import { NextRequest, NextResponse } from 'next/server';
import { supabaseConfig } from '@/lib/supabase-config';


export async function PATCH(request: NextRequest) {
  try {
    const { ticketIds, status } = await request.json();

    if (!ticketIds || !Array.isArray(ticketIds) || ticketIds.length === 0) {
      return NextResponse.json(
        { error: 'Invalid ticket IDs provided' },
        { status: 400 }
      );
    }

    if (!['free', 'reserved', 'sold'].includes(status)) {
      return NextResponse.json(
        { error: 'Invalid status provided' },
        { status: 400 }
      );
    }

    // Using supabaseConfig.url instead of hardcoded localhost
    // Using supabaseConfig.serviceRoleKey instead of hardcoded key

    console.log('Bulk updating tickets:', ticketIds, 'to status:', status);

    // Update tickets in batches to avoid URL length limits
    const batchSize = 50;
    const results = [];

    for (let i = 0; i < ticketIds.length; i += batchSize) {
      const batch = ticketIds.slice(i, i + batchSize);
      const idsFilter = batch.map(id => `id.eq.${id}`).join(',');
      
      const updateData: any = {
        status,
        updated_at: new Date().toISOString()
      };

      // If setting to free, clear order_id
      if (status === 'free') {
        updateData.order_id = null;
      }

      const response = await fetch(`${supabaseConfig.url}/rest/v1/tickets?or=(${idsFilter})`, {
        method: 'PATCH',
        headers: supabaseConfig.headers,
        body: JSON.stringify(updateData)
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('Error updating ticket batch:', response.status, errorText);
        return NextResponse.json(
          { error: `Failed to update tickets: ${response.status}` },
          { status: 500 }
        );
      }

      const updatedTickets = await response.json();
      results.push(...updatedTickets);
    }

    console.log('Successfully updated', results.length, 'tickets');

    return NextResponse.json({
      success: true,
      updatedCount: results.length,
      tickets: results
    });

  } catch (error) {
    console.error('Error in bulk ticket update:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
