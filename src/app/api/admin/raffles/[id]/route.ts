import { NextRequest, NextResponse } from 'next/server';
import { supabaseConfig } from '@/lib/supabase-config';


export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: raffleId } = await params;
    const body = await request.json();
    const {
      title,
      description,
      image_url,
      start_date,
      end_date,
      ticket_price,
      total_tickets,
      max_tickets_per_user,
      draw_date,
      status
    } = body;

    console.log('Updating raffle:', raffleId, body);

    // Validate required fields
    if (!title || !description || !start_date || !end_date || !ticket_price || !total_tickets || !max_tickets_per_user) {
      return NextResponse.json(
        { error: 'Faltan campos requeridos' },
        { status: 400 }
      );
    }

    // Using supabaseConfig.url instead of hardcoded localhost
    // Using supabaseConfig.serviceRoleKey instead of hardcoded key

    // Get current raffle to check if total_tickets changed
    const currentRaffleResponse = await fetch(`${supabaseConfig.url}/rest/v1/raffles?id=eq.${raffleId}&select=total_tickets`, {
      method: 'GET',
      headers: supabaseConfig.headers
    });

    if (!currentRaffleResponse.ok) {
      return NextResponse.json(
        { error: 'Rifa no encontrada' },
        { status: 404 }
      );
    }

    const currentRaffles = await currentRaffleResponse.json();
    const currentRaffle = currentRaffles[0];

    // Update the raffle
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
      status: status || 'active'
    };

    const raffleResponse = await fetch(`${supabaseConfig.url}/rest/v1/raffles?id=eq.${raffleId}`, {
      method: 'PATCH',
      headers: supabaseConfig.headers,
      body: JSON.stringify(raffleData)
    });

    if (!raffleResponse.ok) {
      const errorText = await raffleResponse.text();
      console.error('Error updating raffle:', errorText);
      return NextResponse.json(
        { error: 'Error al actualizar la rifa' },
        { status: 500 }
      );
    }

    const updatedRaffles = await raffleResponse.json();
    const updatedRaffle = updatedRaffles[0];

    // Handle ticket count changes
    if (currentRaffle.total_tickets !== total_tickets) {
      if (total_tickets > currentRaffle.total_tickets) {
        // Add new tickets
        const newTickets = Array.from(
          { length: total_tickets - currentRaffle.total_tickets }, 
          (_, index) => ({
            raffle_id: raffleId,
            number: currentRaffle.total_tickets + index + 1,
            status: 'free'
          })
        );

        const ticketsResponse = await fetch(`${supabaseConfig.url}/rest/v1/tickets`, {
          method: 'POST',
          headers: supabaseConfig.headers,
          body: JSON.stringify(newTickets)
        });

        if (!ticketsResponse.ok) {
          console.error('Error creating new tickets');
        }
      } else if (total_tickets < currentRaffle.total_tickets) {
        // Remove excess tickets (only free ones)
        const deleteResponse = await fetch(
          `${supabaseConfig.url}/rest/v1/tickets?raffle_id=eq.${raffleId}&number=gt.${total_tickets}&status=eq.free`,
          {
            method: 'DELETE',
            headers: supabaseConfig.headers
          }
        );

        if (!deleteResponse.ok) {
          console.error('Error deleting excess tickets');
        }
      }
    }

    return NextResponse.json({
      success: true,
      raffle: updatedRaffle
    });

  } catch (error) {
    console.error('Error in PUT /api/admin/raffles/[id]:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: raffleId } = await params;
    // Using supabaseConfig.url instead of hardcoded localhost
    // Using supabaseConfig.serviceRoleKey instead of hardcoded key

    const response = await fetch(`${supabaseConfig.url}/rest/v1/raffles?id=eq.${raffleId}&select=*`, {
      method: 'GET',
      headers: supabaseConfig.headers
    });

    if (!response.ok) {
      return NextResponse.json(
        { error: 'Error al obtener la rifa' },
        { status: 500 }
      );
    }

    const raffles = await response.json();
    const raffle = raffles[0];

    if (!raffle) {
      return NextResponse.json(
        { error: 'Rifa no encontrada' },
        { status: 404 }
      );
    }

    return NextResponse.json({ raffle });

  } catch (error) {
    console.error('Error in GET /api/admin/raffles/[id]:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: raffleId } = await params;
    // Using supabaseConfig.url instead of hardcoded localhost
    // Using supabaseConfig.serviceRoleKey instead of hardcoded key

    // Instead of deleting, we'll set status to 'cancelled'
    const response = await fetch(`${supabaseConfig.url}/rest/v1/raffles?id=eq.${raffleId}`, {
      method: 'PATCH',
      headers: supabaseConfig.headers,
      body: JSON.stringify({ status: 'cancelled' })
    });

    if (!response.ok) {
      return NextResponse.json(
        { error: 'Error al cancelar la rifa' },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true });

  } catch (error) {
    console.error('Error in DELETE /api/admin/raffles/[id]:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}
