import { NextRequest, NextResponse } from 'next/server';

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

    const supabaseUrl = 'http://127.0.0.1:54321';
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImV4cCI6MTk4MzgxMjk5Nn0.EGIM96RAZx35lJzdJsyH-qQwv8Hdp7fsn3W0YpN81IU';

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

      const response = await fetch(`${supabaseUrl}/rest/v1/tickets?or=(${idsFilter})`, {
        method: 'PATCH',
        headers: {
          'apikey': serviceRoleKey,
          'Authorization': `Bearer ${serviceRoleKey}`,
          'Content-Type': 'application/json',
          'Prefer': 'return=representation'
        },
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
