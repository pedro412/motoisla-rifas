import { NextRequest, NextResponse } from 'next/server';
import { supabaseConfig } from '@/lib/supabase-config';
import { ticketOrderSchema } from '@/lib/validation';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const raffleId = searchParams.get('raffle_id');

    if (!raffleId) {
      return NextResponse.json({ error: 'Raffle ID is required' }, { status: 400 });
    }

    // First, clean up any expired tickets before fetching
    try {
      const now = new Date().toISOString();
      
      // Release expired tickets back to 'free' status
      await fetch(`${supabaseConfig.url}/rest/v1/tickets?status=eq.reserved&expires_at=lt.${now}`, {
        method: 'PATCH',
        headers: {
          ...supabaseConfig.headers,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          status: 'free',
          expires_at: null
        })
      });

      // Cancel expired orders
      await fetch(`${supabaseConfig.url}/rest/v1/orders?status=eq.pending&payment_deadline=lt.${now}`, {
        method: 'PATCH',
        headers: {
          ...supabaseConfig.headers,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          status: 'expired'
        })
      });
    } catch (cleanupError) {
      console.warn('Cleanup failed, continuing with ticket fetch:', cleanupError);
    }

    // Fetch tickets for the specific raffle ordered by number
    const response = await fetch(`${supabaseConfig.url}/rest/v1/tickets?raffle_id=eq.${raffleId}&order=number.asc`, {
      method: 'GET',
      headers: supabaseConfig.headers
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Error fetching tickets:', errorText);
      return NextResponse.json({ error: 'Failed to fetch tickets', details: errorText }, { status: 500 });
    }

    const tickets = await response.json();
    return NextResponse.json(tickets);
  } catch (error) {
    console.error('Unexpected error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    // Validate and sanitize input
    const validatedData = ticketOrderSchema.parse(body);
    const { raffle_id, ticket_numbers, customer_name, customer_phone, customer_email } = validatedData;

    // Get raffle info to calculate total
    const raffleResponse = await fetch(`${supabaseConfig.url}/rest/v1/raffles?id=eq.${raffle_id}&select=ticket_price,title`, {
      method: 'GET',
      headers: supabaseConfig.headers
    });

    if (!raffleResponse.ok) {
      const errorText = await raffleResponse.text();
      console.error('Error fetching raffle:', errorText);
      return NextResponse.json({ error: 'Raffle not found' }, { status: 404 });
    }

    const raffles = await raffleResponse.json();
    if (!raffles || raffles.length === 0) {
      return NextResponse.json({ error: 'Raffle not found' }, { status: 404 });
    }

    const raffle = raffles[0];

    // Get reservation timeout from settings
    const settingsResponse = await fetch(`${supabaseConfig.url}/rest/v1/settings?key=eq.reservation_timeout_minutes&select=value`, {
      method: 'GET',
      headers: supabaseConfig.headers
    });

    let reservationTimeoutMinutes = 15; // Default fallback
    if (settingsResponse.ok) {
      const settings = await settingsResponse.json();
      if (settings && settings.length > 0) {
        reservationTimeoutMinutes = parseInt(settings[0].value) || 15;
      }
    }

    // Create order with payment deadline using configurable timeout
    const paymentDeadline = new Date(Date.now() + reservationTimeoutMinutes * 60 * 1000).toISOString();

    const orderData = {
      raffle_id: raffle_id,
      tickets: ticket_numbers.map(String), // Convert to string array
      total_amount: ticket_numbers.length * raffle.ticket_price,
      status: 'pending',
      payment_deadline: paymentDeadline,
      customer_name: customer_name,
      customer_phone: customer_phone,
      customer_email: customer_email || null,
      proof_url: null // Will be set when payment proof is uploaded
    };
    
    const orderResponse = await fetch(`${supabaseConfig.url}/rest/v1/orders`, {
      method: 'POST',
      headers: {
        ...supabaseConfig.headers,
        'Prefer': 'return=representation'
      },
      body: JSON.stringify(orderData)
    });

    if (!orderResponse.ok) {
      const errorText = await orderResponse.text();
      console.error('Error creating order:', errorText);
      return NextResponse.json({ error: 'Failed to create order', details: errorText }, { status: 500 });
    }

    const [order] = await orderResponse.json();

    // Reserve the tickets by updating their status
    const reservedUntil = new Date(Date.now() + 15 * 60 * 1000).toISOString(); // 15 minutes from now
    
    const ticketUpdateData = {
      status: 'reserved',
      expires_at: reservedUntil
    };

    // Build the query to update only free tickets with the specified numbers for this raffle
    const ticketNumbers = ticket_numbers.join(',');
    const ticketUpdateResponse = await fetch(`${supabaseConfig.url}/rest/v1/tickets?raffle_id=eq.${raffle_id}&number=in.(${ticketNumbers})&status=eq.free`, {
      method: 'PATCH',
      headers: {
        ...supabaseConfig.headers,
        'Prefer': 'return=representation'
      },
      body: JSON.stringify(ticketUpdateData)
    });

    if (!ticketUpdateResponse.ok) {
      const errorText = await ticketUpdateResponse.text();
      console.error('Error reserving tickets:', errorText);
      
      // Rollback order if ticket reservation fails
      await fetch(`${supabaseConfig.url}/rest/v1/orders?id=eq.${order.id}`, {
        method: 'DELETE',
        headers: supabaseConfig.headers
      });
      
      return NextResponse.json({ error: 'Failed to reserve tickets', details: errorText }, { status: 500 });
    }

    const updatedTickets = await ticketUpdateResponse.json();

    if (!updatedTickets || updatedTickets.length !== ticket_numbers.length) {
      // Some tickets were already taken
      await fetch(`${supabaseConfig.url}/rest/v1/orders?id=eq.${order.id}`, {
        method: 'DELETE',
        headers: supabaseConfig.headers
      });
      
      return NextResponse.json({ error: 'Some tickets are no longer available' }, { status: 409 });
    }

    // Return order data
    return NextResponse.json({ 
      order, 
      tickets: updatedTickets,
      success: true
    }, { status: 201 });
  } catch (error) {
    console.error('Unexpected error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
