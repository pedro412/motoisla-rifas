import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const raffleId = searchParams.get('raffle_id');

    if (!raffleId) {
      return NextResponse.json({ error: 'Raffle ID is required' }, { status: 400 });
    }

    // Return mock tickets if Supabase is not properly configured
    if (!process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL.includes('placeholder')) {
      const mockTickets = Array.from({ length: 500 }, (_, i) => ({
        id: `ticket-${i + 1}`,
        raffle_id: raffleId,
        number: i + 1,
        status: 'free',
        expires_at: null,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }));
      return NextResponse.json(mockTickets);
    }

    const { data: tickets, error } = await supabaseAdmin
      .from('tickets')
      .select('*')
      .eq('raffle_id', raffleId)
      .order('number', { ascending: true });

    if (error) {
      console.error('Error fetching tickets:', error);
      return NextResponse.json({ error: 'Failed to fetch tickets' }, { status: 500 });
    }

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

    // Return mock order if Supabase is not properly configured
    if (!process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL.includes('placeholder')) {
      const mockOrder = {
        id: `order-${Date.now()}`,
        tickets: ticket_numbers.map(String),
        total: ticket_numbers.length * 50, // Mock price of 50 per ticket
        status: 'pending',
        payment_deadline: new Date(Date.now() + 15 * 60 * 1000).toISOString(),
        proof_url: JSON.stringify({
          name: customer_name,
          phone: customer_phone,
          email: customer_email || null
        }),
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };

      const mockTickets = ticket_numbers.map((num: number) => ({
        id: `ticket-${num}`,
        raffle_id: raffle_id,
        number: num,
        status: 'reserved',
        expires_at: new Date(Date.now() + 15 * 60 * 1000).toISOString(),
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }));

      return NextResponse.json({ 
        order: mockOrder, 
        tickets: mockTickets 
      }, { status: 201 });
    }

    // Get raffle info to calculate total
    const { data: raffle, error: raffleError } = await supabaseAdmin
      .from('raffles')
      .select('ticket_price')
      .eq('id', raffle_id)
      .single();

    if (raffleError || !raffle) {
      return NextResponse.json({ error: 'Raffle not found' }, { status: 404 });
    }

    // Create order with payment deadline (15 minutes from now to match frontend timer)
    const paymentDeadline = new Date(Date.now() + 15 * 60 * 1000).toISOString();
    
    // Store customer info in proof_url field temporarily (we'll use it as a JSON string)
    const customerInfo = JSON.stringify({
      name: customer_name,
      phone: customer_phone,
      email: customer_email || null
    });
    
    const { data: order, error: orderError } = await supabaseAdmin
      .from('orders')
      .insert({
        tickets: ticket_numbers.map(String), // Convert to string array
        total: ticket_numbers.length * (raffle as any).ticket_price,
        status: 'pending',
        payment_deadline: paymentDeadline,
        proof_url: customerInfo // Store customer info here temporarily
      })
      .select()
      .single();

    if (orderError) {
      console.error('Error creating order:', orderError);
      return NextResponse.json({ error: 'Failed to create order' }, { status: 500 });
    }

    // Reserve the tickets by updating their status
    const reservedUntil = new Date(Date.now() + 15 * 60 * 1000).toISOString(); // 15 minutes from now
    
    const { data: updatedTickets, error: ticketError } = await supabaseAdmin
      .from('tickets')
      .update({
        status: 'reserved',
        expires_at: reservedUntil
      })
      .eq('raffle_id', raffle_id)
      .in('number', ticket_numbers)
      .eq('status', 'free') // Only update if still free
      .select();

    if (ticketError) {
      console.error('Error reserving tickets:', ticketError);
      // Rollback order if ticket reservation fails
      await supabaseAdmin.from('orders').delete().eq('id', (order as any).id);
      return NextResponse.json({ error: 'Failed to reserve tickets' }, { status: 500 });
    }

    if (!updatedTickets || updatedTickets.length !== ticket_numbers.length) {
      // Some tickets were already taken
      await supabaseAdmin.from('orders').delete().eq('id', (order as any).id);
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
