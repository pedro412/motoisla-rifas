import { NextRequest, NextResponse } from 'next/server';

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

    console.log('Received raffle data:', body);

    // Validate required fields
    if (!title || !description || !start_date || !end_date || !ticket_price || !total_tickets) {
      return NextResponse.json(
        { error: 'Faltan campos requeridos' },
        { status: 400 }
      );
    }

    const supabaseUrl = 'http://127.0.0.1:54321';
    const serviceRoleKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImV4cCI6MTk4MzgxMjk5Nn0.EGIM96RAZx35lJzdJsyH-qQwv8Hdp7fsn3W0YpN81IU';

    // Create the raffle using direct API call
    const raffleData = {
      title,
      description,
      image_url: image_url || null,
      start_date,
      end_date,
      ticket_price,
      total_tickets,
      draw_date: draw_date || null,
      status: 'active'
    };

    const raffleResponse = await fetch(`${supabaseUrl}/rest/v1/raffles`, {
      method: 'POST',
      headers: {
        'apikey': serviceRoleKey,
        'Authorization': `Bearer ${serviceRoleKey}`,
        'Content-Type': 'application/json',
        'Prefer': 'return=representation'
      },
      body: JSON.stringify(raffleData)
    });

    if (!raffleResponse.ok) {
      const errorText = await raffleResponse.text();
      console.error('Error creating raffle:', errorText);
      return NextResponse.json(
        { error: 'Error al crear la rifa' },
        { status: 500 }
      );
    }

    const raffles = await raffleResponse.json();
    const raffle = raffles[0];

    console.log('Created raffle:', raffle);

    // Create tickets for the raffle
    const tickets = Array.from({ length: total_tickets }, (_, index) => ({
      raffle_id: raffle.id,
      number: index + 1,
      status: 'free'
    }));

    const ticketsResponse = await fetch(`${supabaseUrl}/rest/v1/tickets`, {
      method: 'POST',
      headers: {
        'apikey': serviceRoleKey,
        'Authorization': `Bearer ${serviceRoleKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(tickets)
    });

    if (!ticketsResponse.ok) {
      const errorText = await ticketsResponse.text();
      console.error('Error creating tickets:', errorText);
      
      // If ticket creation fails, delete the raffle
      await fetch(`${supabaseUrl}/rest/v1/raffles?id=eq.${raffle.id}`, {
        method: 'DELETE',
        headers: {
          'apikey': serviceRoleKey,
          'Authorization': `Bearer ${serviceRoleKey}`
        }
      });
      
      return NextResponse.json(
        { error: 'Error al crear los boletos' },
        { status: 500 }
      );
    }

    console.log('Created tickets successfully');

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
    console.error('Error in POST /api/admin/raffles:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}

export async function GET() {
  try {
    const supabaseUrl = 'http://127.0.0.1:54321';
    const serviceRoleKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImV4cCI6MTk4MzgxMjk5Nn0.EGIM96RAZx35lJzdJsyH-qQwv8Hdp7fsn3W0YpN81IU';

    const response = await fetch(`${supabaseUrl}/rest/v1/raffles?select=id,title,description,image_url,start_date,end_date,ticket_price,total_tickets,draw_date,status,created_at,updated_at&order=created_at.desc`, {
      method: 'GET',
      headers: {
        'apikey': serviceRoleKey,
        'Authorization': `Bearer ${serviceRoleKey}`
      }
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Error fetching raffles:', errorText);
      return NextResponse.json(
        { error: 'Error al obtener las rifas' },
        { status: 500 }
      );
    }

    const raffles = await response.json();
    return NextResponse.json({ raffles });

  } catch (error) {
    console.error('Error in GET /api/admin/raffles:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}
