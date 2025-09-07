import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const raffleId = searchParams.get('raffle_id');

    if (!raffleId) {
      return NextResponse.json({ error: 'Raffle ID is required' }, { status: 400 });
    }

    const supabaseUrl = 'http://127.0.0.1:54321';
    const serviceRoleKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImV4cCI6MTk4MzgxMjk5Nn0.EGIM96RAZx35lJzdJsyH-qQwv8Hdp7fsn3W0YpN81IU';

    // First, clean up any expired tickets before fetching
    try {
      const now = new Date().toISOString();
      
      // Release expired tickets back to 'free' status
      await fetch(`${supabaseUrl}/rest/v1/tickets?status=eq.reserved&expires_at=lt.${now}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'apikey': serviceRoleKey,
          'Authorization': `Bearer ${serviceRoleKey}`
        },
        body: JSON.stringify({
          status: 'free',
          expires_at: null
        })
      });

      // Cancel expired orders
      await fetch(`${supabaseUrl}/rest/v1/orders?status=eq.pending&payment_deadline=lt.${now}`, {
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
    } catch (cleanupError) {
      console.warn('Cleanup failed, continuing with ticket fetch:', cleanupError);
    }

    // Fetch tickets for the specific raffle ordered by number
    const response = await fetch(`${supabaseUrl}/rest/v1/tickets?raffle_id=eq.${raffleId}&order=number.asc`, {
      method: 'GET',
      headers: {
        'apikey': serviceRoleKey,
        'Authorization': `Bearer ${serviceRoleKey}`
      }
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
    const { raffle_id, ticket_numbers, customer_name, customer_phone, customer_email } = body;

    if (!raffle_id || !ticket_numbers || !Array.isArray(ticket_numbers) || ticket_numbers.length === 0) {
      return NextResponse.json({ error: 'Invalid request data' }, { status: 400 });
    }

    if (!customer_name || !customer_phone) {
      return NextResponse.json({ error: 'Customer name and phone are required' }, { status: 400 });
    }


    const supabaseUrl = 'http://127.0.0.1:54321';
    const serviceRoleKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImV4cCI6MTk4MzgxMjk5Nn0.EGIM96RAZx35lJzdJsyH-qQwv8Hdp7fsn3W0YpN81IU';

    // Get raffle info to calculate total
    const raffleResponse = await fetch(`${supabaseUrl}/rest/v1/raffles?id=eq.${raffle_id}&select=ticket_price`, {
      method: 'GET',
      headers: {
        'apikey': serviceRoleKey,
        'Authorization': `Bearer ${serviceRoleKey}`
      }
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

    // Create order with payment deadline (15 minutes from now to match frontend timer)
    const paymentDeadline = new Date(Date.now() + 15 * 60 * 1000).toISOString();

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
    
    const orderResponse = await fetch(`${supabaseUrl}/rest/v1/orders`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'apikey': serviceRoleKey,
        'Authorization': `Bearer ${serviceRoleKey}`,
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
    const ticketUpdateResponse = await fetch(`${supabaseUrl}/rest/v1/tickets?raffle_id=eq.${raffle_id}&number=in.(${ticketNumbers})&status=eq.free`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        'apikey': serviceRoleKey,
        'Authorization': `Bearer ${serviceRoleKey}`,
        'Prefer': 'return=representation'
      },
      body: JSON.stringify(ticketUpdateData)
    });

    if (!ticketUpdateResponse.ok) {
      const errorText = await ticketUpdateResponse.text();
      console.error('Error reserving tickets:', errorText);
      
      // Rollback order if ticket reservation fails
      await fetch(`${supabaseUrl}/rest/v1/orders?id=eq.${order.id}`, {
        method: 'DELETE',
        headers: {
          'apikey': serviceRoleKey,
          'Authorization': `Bearer ${serviceRoleKey}`
        }
      });
      
      return NextResponse.json({ error: 'Failed to reserve tickets', details: errorText }, { status: 500 });
    }

    const updatedTickets = await ticketUpdateResponse.json();

    if (!updatedTickets || updatedTickets.length !== ticket_numbers.length) {
      // Some tickets were already taken
      await fetch(`${supabaseUrl}/rest/v1/orders?id=eq.${order.id}`, {
        method: 'DELETE',
        headers: {
          'apikey': serviceRoleKey,
          'Authorization': `Bearer ${serviceRoleKey}`
        }
      });
      
      return NextResponse.json({ error: 'Some tickets are no longer available' }, { status: 409 });
    }

    return NextResponse.json({ 
      order, 
      tickets: updatedTickets 
    }, { status: 201 });
  } catch (error) {
    console.error('Unexpected error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
