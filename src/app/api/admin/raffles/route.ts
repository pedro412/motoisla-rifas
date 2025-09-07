import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';

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

    // Create the raffle
    const { data: raffle, error: raffleError } = await supabaseAdmin
      .from('raffles')
      .insert({
        title,
        description,
        image_url: image_url || null,
        start_date,
        end_date,
        ticket_price,
        total_tickets,
        draw_date: draw_date || null,
        status: 'active'
      } as any)
      .select()
      .single();

    if (raffleError) {
      console.error('Error creating raffle:', raffleError);
      return NextResponse.json(
        { error: 'Error al crear la rifa' },
        { status: 500 }
      );
    }

    // Create tickets for the raffle
    const tickets = Array.from({ length: total_tickets }, (_, index) => ({
      raffle_id: (raffle as any).id,
      number: index + 1,
      status: 'free'
    }));

    const { error: ticketsError } = await supabaseAdmin
      .from('tickets')
      .insert(tickets as any);

    if (ticketsError) {
      console.error('Error creating tickets:', ticketsError);
      // If ticket creation fails, delete the raffle
      await supabaseAdmin.from('raffles').delete().eq('id', (raffle as any).id);
      return NextResponse.json(
        { error: 'Error al crear los boletos' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      raffle: {
        id: (raffle as any).id,
        title: (raffle as any).title,
        total_tickets: (raffle as any).total_tickets,
        ticket_price: (raffle as any).ticket_price
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
    const { data: raffles, error } = await supabaseAdmin
      .from('raffles')
      .select(`
        id,
        title,
        description,
        image_url,
        start_date,
        end_date,
        ticket_price,
        total_tickets,
        draw_date,
        status,
        created_at,
        updated_at
      `)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching raffles:', error);
      return NextResponse.json(
        { error: 'Error al obtener las rifas' },
        { status: 500 }
      );
    }

    return NextResponse.json({ raffles });

  } catch (error) {
    console.error('Error in GET /api/admin/raffles:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}
