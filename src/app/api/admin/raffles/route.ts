import { NextRequest, NextResponse } from 'next/server';
import { verifyAdminRequest } from '@/lib/auth';
import { supabaseConfig } from '@/lib/supabase-config';
import { sanitizedRaffleSchema } from '@/lib/validation';

export async function POST(request: NextRequest) {
  try {
    // Verify admin authentication
    if (!verifyAdminRequest(request)) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const body = await request.json();
    
    // Validate and sanitize input
    const validatedData = sanitizedRaffleSchema.parse(body);
    const {
      title,
      description,
      image_url,
      start_date,
      end_date,
      ticket_price,
      total_tickets,
      max_tickets_per_user,
      draw_date
    } = validatedData;

    console.log('Received raffle data:', validatedData);

    // Create the raffle using direct API call with secure config
    const raffleData = {
      title,
      description,
      image_url: image_url || null,
      start_date,
      end_date,
      ticket_price,
      total_tickets,
      max_tickets_per_user,
      draw_date: draw_date || null,
      status: 'active'
    };

    const raffleResponse = await fetch(`${supabaseConfig.url}/rest/v1/raffles`, {
      method: 'POST',
      headers: {
        ...supabaseConfig.headers,
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

    // Create tickets for the raffle (starting from 0 to total_tickets - 1)
    const tickets = Array.from({ length: total_tickets }, (_, index) => ({
      raffle_id: raffle.id,
      number: index, // Start from 0 (000) to total_tickets - 1 (999 for 1000 tickets)
      status: 'free'
    }));

    const ticketsResponse = await fetch(`${supabaseConfig.url}/rest/v1/tickets`, {
      method: 'POST',
      headers: supabaseConfig.headers,
      body: JSON.stringify(tickets)
    });

    if (!ticketsResponse.ok) {
      const errorText = await ticketsResponse.text();
      console.error('Error creating tickets:', errorText);
      
      // If ticket creation fails, delete the raffle
      await fetch(`${supabaseConfig.url}/rest/v1/raffles?id=eq.${raffle.id}`, {
        method: 'DELETE',
        headers: supabaseConfig.headers
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

export async function GET(request: NextRequest) {
  try {
    // Verify admin authentication
    if (!verifyAdminRequest(request)) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const response = await fetch(`${supabaseConfig.url}/rest/v1/raffles?select=id,title,description,image_url,start_date,end_date,ticket_price,total_tickets,max_tickets_per_user,draw_date,status,created_at,updated_at&order=created_at.desc`, {
      method: 'GET',
      headers: supabaseConfig.headers
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
