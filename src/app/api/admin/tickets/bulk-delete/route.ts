import { NextRequest, NextResponse } from 'next/server';

export async function DELETE(request: NextRequest) {
  try {
    const { ticketIds } = await request.json();

    if (!ticketIds || !Array.isArray(ticketIds) || ticketIds.length === 0) {
      return NextResponse.json(
        { error: 'Invalid ticket IDs provided' },
        { status: 400 }
      );
    }

    const supabaseUrl = 'http://127.0.0.1:54321';
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImV4cCI6MTk4MzgxMjk5Nn0.EGIM96RAZx35lJzdJsyH-qQwv8Hdp7fsn3W0YpN81IU';

    console.log('Bulk deleting tickets:', ticketIds);

    // Delete tickets in batches to avoid URL length limits
    const batchSize = 50;
    let totalDeleted = 0;

    for (let i = 0; i < ticketIds.length; i += batchSize) {
      const batch = ticketIds.slice(i, i + batchSize);
      const idsFilter = batch.map(id => `id.eq.${id}`).join(',');
      
      const response = await fetch(`${supabaseUrl}/rest/v1/tickets?or=(${idsFilter})`, {
        method: 'DELETE',
        headers: {
          'apikey': serviceRoleKey,
          'Authorization': `Bearer ${serviceRoleKey}`,
          'Content-Type': 'application/json',
          'Prefer': 'return=representation'
        }
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('Error deleting ticket batch:', response.status, errorText);
        return NextResponse.json(
          { error: `Failed to delete tickets: ${response.status}` },
          { status: 500 }
        );
      }

      const deletedTickets = await response.json();
      totalDeleted += deletedTickets.length;
    }

    console.log('Successfully deleted', totalDeleted, 'tickets');

    return NextResponse.json({
      success: true,
      deletedCount: totalDeleted
    });

  } catch (error) {
    console.error('Error in bulk ticket delete:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
