import { NextRequest, NextResponse } from 'next/server';
import { supabaseConfig } from '@/lib/supabase-config';


export async function DELETE(request: NextRequest) {
  try {
    const { ticketIds } = await request.json();

    if (!ticketIds || !Array.isArray(ticketIds) || ticketIds.length === 0) {
      return NextResponse.json(
        { error: 'Invalid ticket IDs provided' },
        { status: 400 }
      );
    }

    // Using supabaseConfig.url instead of hardcoded localhost
    // Using supabaseConfig.serviceRoleKey instead of hardcoded key

    console.log('Bulk deleting tickets:', ticketIds);

    // Delete tickets in batches to avoid URL length limits
    const batchSize = 50;
    let totalDeleted = 0;

    for (let i = 0; i < ticketIds.length; i += batchSize) {
      const batch = ticketIds.slice(i, i + batchSize);
      const idsFilter = batch.map(id => `id.eq.${id}`).join(',');
      
      const response = await fetch(`${supabaseConfig.url}/rest/v1/tickets?or=(${idsFilter})`, {
        method: 'DELETE',
        headers: supabaseConfig.headers
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
