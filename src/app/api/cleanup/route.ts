import { NextResponse } from 'next/server';
import { supabaseConfig } from '@/lib/supabase-config';


export async function POST() {
  try {
    // Using supabaseConfig.url instead of hardcoded localhost
    // Using supabaseConfig.serviceRoleKey instead of hardcoded key

    // Check if auto cleanup is enabled
    const autoCleanupResponse = await fetch(`${supabaseConfig.url}/rest/v1/settings?key=eq.auto_cleanup_enabled&select=value`, {
      method: 'GET',
      headers: supabaseConfig.headers
    });

    let autoCleanupEnabled = true; // Default to enabled
    if (autoCleanupResponse.ok) {
      const settings = await autoCleanupResponse.json();
      if (settings && settings.length > 0) {
        autoCleanupEnabled = settings[0].value === 'true';
      }
    }

    if (!autoCleanupEnabled) {
      return NextResponse.json({
        message: 'Auto cleanup is disabled',
        releasedTickets: 0,
        cancelledOrders: 0
      });
    }

    const now = new Date().toISOString();
    
    // Find all expired tickets (reserved tickets where expires_at < now)
    const expiredTicketsResponse = await fetch(`${supabaseConfig.url}/rest/v1/tickets?status=eq.reserved&expires_at=lt.${now}`, {
      method: 'GET',
      headers: supabaseConfig.headers
    });

    if (!expiredTicketsResponse.ok) {
      const errorText = await expiredTicketsResponse.text();
      console.error('Error fetching expired tickets:', errorText);
      return NextResponse.json({ error: 'Failed to fetch expired tickets' }, { status: 500 });
    }

    const expiredTickets = await expiredTicketsResponse.json();
    
    if (expiredTickets.length === 0) {
      return NextResponse.json({ 
        message: 'No expired tickets found',
        releasedTickets: 0 
      });
    }

    // Release expired tickets back to 'free' status
    const releaseResponse = await fetch(`${supabaseConfig.url}/rest/v1/tickets?status=eq.reserved&expires_at=lt.${now}`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        'apikey': serviceRoleKey,
        'Authorization': `Bearer ${serviceRoleKey}`,
        'Prefer': 'return=representation'
      },
      body: JSON.stringify({
        status: 'free',
        expires_at: null
      })
    });

    if (!releaseResponse.ok) {
      const errorText = await releaseResponse.text();
      console.error('Error releasing expired tickets:', errorText);
      return NextResponse.json({ error: 'Failed to release expired tickets' }, { status: 500 });
    }

    const releasedTickets = await releaseResponse.json();

    // Find and cancel expired orders
    const expiredOrdersResponse = await fetch(`${supabaseConfig.url}/rest/v1/orders?status=eq.pending&payment_deadline=lt.${now}`, {
      method: 'GET',
      headers: supabaseConfig.headers
    });

    let cancelledOrders = 0;
    if (expiredOrdersResponse.ok) {
      const expiredOrders = await expiredOrdersResponse.json();
      
      if (expiredOrders.length > 0) {
        // Cancel expired orders
        const cancelResponse = await fetch(`${supabaseConfig.url}/rest/v1/orders?status=eq.pending&payment_deadline=lt.${now}`, {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
            'apikey': serviceRoleKey,
            'Authorization': `Bearer ${serviceRoleKey}`
          },
          body: JSON.stringify({
            status: 'expired'
          })
        });

        if (cancelResponse.ok) {
          cancelledOrders = expiredOrders.length;
        }
      }
    }

    console.log(`Cleanup completed: Released ${releasedTickets.length} tickets, cancelled ${cancelledOrders} orders`);

    return NextResponse.json({
      message: 'Cleanup completed successfully',
      releasedTickets: releasedTickets.length,
      cancelledOrders,
      tickets: releasedTickets.map((ticket: { id: string; number: number; raffle_id: string }) => ({
        id: ticket.id,
        number: ticket.number,
        raffle_id: ticket.raffle_id
      }))
    });

  } catch (error) {
    console.error('Cleanup error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// Allow GET requests for manual cleanup
export async function GET() {
  return POST();
}
