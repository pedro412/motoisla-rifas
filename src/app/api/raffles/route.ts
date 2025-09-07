import { NextRequest, NextResponse } from 'next/server';
import { supabase, supabaseAdmin } from '@/lib/supabase';
import type { Database } from '@/lib/types';

type RaffleInsert = Omit<Database['public']['Tables']['raffles']['Insert'], 'id' | 'created_at' | 'updated_at'>;

// Use the default client for read operations

export async function GET() {
  try {
    const { data: raffles, error } = await supabase
      .from('raffles')
      .select('*')
      .eq('status', 'active')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching raffles:', error);
      return NextResponse.json(
        { error: 'Failed to fetch raffles', details: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json(raffles || []);
  } catch (error) {
    console.error('Unexpected error:', error);
    const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
    return NextResponse.json(
      { error: 'Internal server error', details: errorMessage },
      { status: 500 }
    );
  }
}

type CreateRaffleRequest = {
  title: string;
  description: string;
  image_url?: string;
  ticket_price: number | string;
  total_tickets: number | string;
  end_date: string;
};

export async function POST(request: NextRequest) {
  try {
    const body: CreateRaffleRequest = await request.json();
    const { title, description, image_url, ticket_price, total_tickets, end_date } = body;
    
    // Validate required fields
    if (!title || !description || ticket_price === undefined || total_tickets === undefined || !end_date) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Create a new raffle using the admin client to avoid RLS issues
    const raffleData: RaffleInsert = {
      title,
      description,
      image_url: image_url || null,
      ticket_price: Number(ticket_price),
      total_tickets: Number(total_tickets),
      start_date: new Date().toISOString(),
      end_date: new Date(end_date).toISOString(),
      status: 'active',
      winner_ticket_id: null,
      draw_date: null,
    };

    const { data: raffle, error } = await (supabaseAdmin
      .from('raffles')
      .insert(raffleData as any) // Type assertion to bypass the type checking
      .select()
      .single());

    if (error) {
      console.error('Error creating raffle:', error);
      return NextResponse.json(
        { error: 'Failed to create raffle', details: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json(raffle, { status: 201 });
  } catch (error) {
    console.error('Unexpected error:', error);
    const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
    return NextResponse.json(
      { error: 'Internal server error', details: errorMessage },
      { status: 500 }
    );
  }
}
