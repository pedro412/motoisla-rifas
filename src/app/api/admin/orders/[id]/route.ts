import { NextRequest, NextResponse } from 'next/server';
import { supabaseConfig } from '@/lib/supabase-config';


export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { status } = await request.json();
    const { id: orderId } = await params;

    if (!orderId || !status) {
      return NextResponse.json(
        { error: 'Order ID and status are required' },
        { status: 400 }
      );
    }

    // Using supabaseConfig.url instead of hardcoded localhost
    // Using supabaseConfig.serviceRoleKey instead of hardcoded key

    if (!serviceRoleKey) {
      return NextResponse.json(
        { error: 'Service role key not configured' },
        { status: 500 }
      );
    }

    // First, get the order details to know which tickets to update
    const orderResponse = await fetch(`${supabaseConfig.url}/rest/v1/orders?id=eq.${orderId}&select=*`, {
      headers: supabaseConfig.headers
    });

    if (!orderResponse.ok) {
      return NextResponse.json(
        { error: 'Order not found' },
        { status: 404 }
      );
    }

    const orders = await orderResponse.json();
    const order = orders[0];

    if (!order) {
      return NextResponse.json(
        { error: 'Order not found' },
        { status: 404 }
      );
    }

    // Update the order status
    const updateOrderResponse = await fetch(`${supabaseConfig.url}/rest/v1/orders?id=eq.${orderId}`, {
      method: 'PATCH',
      headers: supabaseConfig.headers,
      body: JSON.stringify({ 
        status,
        updated_at: new Date().toISOString()
      })
    });

    if (!updateOrderResponse.ok) {
      const errorText = await updateOrderResponse.text();
      console.error('Error updating order:', errorText);
      return NextResponse.json(
        { error: 'Failed to update order' },
        { status: 500 }
      );
    }

    // If marking as paid, update ticket statuses to 'sold'
    if (status === 'paid') {
      const ticketNumbers = order.tickets;
      const raffleId = order.raffle_id;

      // Update all tickets in this order to 'paid' status
      console.log(`Updating tickets ${ticketNumbers.join(',')} to paid status for raffle ${raffleId}`);
      const updateTicketsResponse = await fetch(`${supabaseConfig.url}/rest/v1/tickets?raffle_id=eq.${raffleId}&number=in.(${ticketNumbers.join(',')})`, {
        method: 'PATCH',
        headers: supabaseConfig.headers,
        body: JSON.stringify({ 
          status: 'paid',
          paid_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
      });

      if (!updateTicketsResponse.ok) {
        const errorText = await updateTicketsResponse.text();
        console.error('Error updating tickets:', errorText);
        // Don't fail the whole operation, but log the error
      }
    }

    // If marking as cancelled, release the tickets back to 'free'
    if (status === 'cancelled') {
      const ticketNumbers = order.tickets;
      const raffleId = order.raffle_id;

      const updateTicketsResponse = await fetch(`${supabaseConfig.url}/rest/v1/tickets?raffle_id=eq.${raffleId}&number=in.(${ticketNumbers.join(',')})`, {
        method: 'PATCH',
        headers: supabaseConfig.headers,
        body: JSON.stringify({ 
          status: 'free',
          updated_at: new Date().toISOString()
        })
      });

      if (!updateTicketsResponse.ok) {
        const errorText = await updateTicketsResponse.text();
        console.error('Error releasing tickets:', errorText);
      }
    }

    const updatedOrders = await updateOrderResponse.json();
    
    return NextResponse.json({
      success: true,
      order: updatedOrders[0]
    });

  } catch (error) {
    console.error('Error in PATCH /api/admin/orders/[id]:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
