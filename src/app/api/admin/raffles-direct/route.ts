import { NextRequest, NextResponse } from 'next/server';
import { supabaseConfig } from '@/lib/supabase-config';


// Direct API approach without Supabase client
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      title,
      description,
      image_url,
      start_date,
      end_date,
      ticket_price,
      total_tickets,
      draw_date
    } = body;

    // Validate required fields
    if (!title || !description || !start_date || !end_date || !ticket_price || !total_tickets) {
      return NextResponse.json(
        { error: 'Faltan campos requeridos' },
        { status: 400 }
      );
    }

    // Use direct fetch to Supabase REST API
    // Using supabaseConfig.url instead of hardcoded localhost
    // Using supabaseConfig.serviceRoleKey instead of hardcoded key

    // Create the raffle
    const raffleData = {
      title,
      description,
      image_url: image_url || null,
      start_date,
      end_date,
      ticket_price: parseFloat(ticket_price),
      total_tickets: parseInt(total_tickets),
      draw_date: draw_date || null,
      status: 'active'
    };

    const raffleResponse = await fetch(`${supabaseConfig.url}/rest/v1/raffles`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'apikey': supabaseConfig.serviceRoleKey,
        'Authorization': `Bearer ${supabaseConfig.serviceRoleKey}`,
        'Prefer': 'return=representation'
      },
      body: JSON.stringify(raffleData)
    });

    if (!raffleResponse.ok) {
      const errorText = await raffleResponse.text();
      console.error('Error creating raffle:', errorText);
      return NextResponse.json(
        { error: 'Error al crear la rifa', details: errorText },
        { status: 500 }
      );
    }

    const [raffle] = await raffleResponse.json();

    // Create tickets for the raffle
    const tickets = Array.from({ length: parseInt(total_tickets) }, (_, index) => ({
      raffle_id: raffle.id,
      number: index + 1,
      status: 'free'
    }));

    const ticketsResponse = await fetch(`${supabaseConfig.url}/rest/v1/tickets`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'apikey': supabaseConfig.serviceRoleKey,
        'Authorization': `Bearer ${supabaseConfig.serviceRoleKey}`
      },
      body: JSON.stringify(tickets)
    });

    if (!ticketsResponse.ok) {
      const errorText = await ticketsResponse.text();
      console.error('Error creating tickets:', errorText);
      
      // Delete the raffle if ticket creation fails
      await fetch(`${supabaseConfig.url}/rest/v1/raffles?id=eq.${raffle.id}`, {
        method: 'DELETE',
        headers: supabaseConfig.headers
      });

      return NextResponse.json(
        { error: 'Error al crear los boletos', details: errorText },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      raffle: {
        id: raffle.id,
        title: raffle.title,
        total_tickets: raffle.total_tickets,
        ticket_price: raffle.ticket_price
      }
    });

  } catch (error) {
    console.error('Error in POST /api/admin/raffles-direct:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}

export async function GET() {
  try {
    // Using supabaseConfig.url instead of hardcoded localhost
    // Using supabaseConfig.serviceRoleKey instead of hardcoded key

    const response = await fetch(`${supabaseConfig.url}/rest/v1/raffles?order=created_at.desc`, {
      method: 'GET',
      headers: supabaseConfig.headers
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Error fetching raffles:', errorText);
      return NextResponse.json(
        { error: 'Error al obtener las rifas', details: errorText },
        { status: 500 }
      );
    }

    const raffles = await response.json();
    return NextResponse.json({ raffles });

  } catch (error) {
    console.error('Error in GET /api/admin/raffles-direct:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}
