import { NextRequest, NextResponse } from 'next/server';
import { verifyAdminRequest } from '@/lib/auth';
import { supabaseConfig } from '@/lib/supabase-config';

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Verify admin authentication
    if (!verifyAdminRequest(request)) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const raffleId = params.id;
    const body = await request.json();
    const { lotteryNumber } = body;

    // Validate lottery number (should be a number with at least 3 digits)
    if (!lotteryNumber || typeof lotteryNumber !== 'string') {
      return NextResponse.json(
        { error: 'Número de lotería requerido' },
        { status: 400 }
      );
    }

    // Extract last 3 digits from lottery number
    const last3Digits = lotteryNumber.slice(-3);
    const winningTicketNumber = parseInt(last3Digits, 10);

    console.log('Lottery number:', lotteryNumber);
    console.log('Last 3 digits:', last3Digits);
    console.log('Winning ticket number:', winningTicketNumber);

    // Find the winning ticket
    const ticketResponse = await fetch(
      `${supabaseConfig.url}/rest/v1/tickets?raffle_id=eq.${raffleId}&number=eq.${winningTicketNumber}&select=id,number,status,user_id`,
      {
        method: 'GET',
        headers: supabaseConfig.headers
      }
    );

    if (!ticketResponse.ok) {
      const errorText = await ticketResponse.text();
      console.error('Error fetching winning ticket:', errorText);
      return NextResponse.json(
        { error: 'Error al buscar el boleto ganador' },
        { status: 500 }
      );
    }

    const tickets = await ticketResponse.json();
    
    if (!tickets || tickets.length === 0) {
      return NextResponse.json(
        { error: `No existe el boleto número ${winningTicketNumber.toString().padStart(3, '0')}` },
        { status: 404 }
      );
    }

    const winningTicket = tickets[0];

    // Check if ticket is sold (has a user_id and is paid)
    if (winningTicket.status !== 'paid') {
      return NextResponse.json({
        success: true,
        message: `El boleto ganador ${winningTicketNumber.toString().padStart(3, '0')} no fue vendido`,
        winningTicket: {
          number: winningTicket.number,
          status: winningTicket.status,
          sold: false
        },
        lotteryNumber,
        last3Digits
      });
    }

    // Update raffle with winner information
    const raffleUpdateResponse = await fetch(
      `${supabaseConfig.url}/rest/v1/raffles?id=eq.${raffleId}`,
      {
        method: 'PATCH',
        headers: {
          ...supabaseConfig.headers,
          'Prefer': 'return=representation'
        },
        body: JSON.stringify({
          winner_ticket_id: winningTicket.id,
          status: 'completed',
          updated_at: new Date().toISOString()
        })
      }
    );

    if (!raffleUpdateResponse.ok) {
      const errorText = await raffleUpdateResponse.text();
      console.error('Error updating raffle:', errorText);
      return NextResponse.json(
        { error: 'Error al actualizar la rifa' },
        { status: 500 }
      );
    }

    // Get winner information from orders
    const orderResponse = await fetch(
      `${supabaseConfig.url}/rest/v1/orders?tickets=cs.{${winningTicket.number}}&status=eq.paid&select=customer_name,customer_phone,customer_email`,
      {
        method: 'GET',
        headers: supabaseConfig.headers
      }
    );

    let winnerInfo = null;
    if (orderResponse.ok) {
      const orders = await orderResponse.json();
      if (orders && orders.length > 0) {
        winnerInfo = orders[0];
      }
    }

    return NextResponse.json({
      success: true,
      message: `¡Ganador encontrado! Boleto ${winningTicketNumber.toString().padStart(3, '0')}`,
      winningTicket: {
        number: winningTicket.number,
        status: winningTicket.status,
        sold: true
      },
      winnerInfo,
      lotteryNumber,
      last3Digits
    });

  } catch (error) {
    console.error('Error in draw winner:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}
