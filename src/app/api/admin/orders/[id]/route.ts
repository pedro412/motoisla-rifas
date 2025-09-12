import { NextRequest, NextResponse } from 'next/server';
import { supabaseConfig } from '@/lib/supabase-config';
import { validateTicketAvailability } from '@/lib/ticket-validation';


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

    if (!supabaseConfig.serviceRoleKey) {
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

    // Parse the response safely
    let updatedOrderData;
    try {
      const responseText = await updateOrderResponse.text();
      updatedOrderData = responseText ? JSON.parse(responseText) : null;
    } catch (parseError) {
      console.error('Error parsing order update response:', parseError);
      updatedOrderData = null;
    }

    // If marking as paid, validate tickets first then update ticket statuses
    if (status === 'paid') {
      const ticketNumbers = order.tickets;
      const raffleId = order.raffle_id;

      // Validate that all tickets are available (not already paid in another order)
      console.log(`Validating ticket availability for tickets ${ticketNumbers.join(',')} in raffle ${raffleId}`);
      const validation = await validateTicketAvailability(ticketNumbers, raffleId, orderId);
      
      if (!validation.isValid) {
        console.error('Ticket validation failed:', validation.message);
        return NextResponse.json(
          { 
            error: 'Cannot mark order as paid: ' + validation.message,
            conflictingTickets: validation.conflictingTickets,
            conflictingOrders: validation.conflictingOrders
          },
          { status: 409 } // Conflict status code
        );
      }

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
        return NextResponse.json(
          { error: 'Failed to update ticket status after validation passed' },
          { status: 500 }
        );
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

    return NextResponse.json({
      success: true,
      order: updatedOrderData ? (Array.isArray(updatedOrderData) ? updatedOrderData[0] : updatedOrderData) : { id: orderId, status }
    });

  } catch (error) {
    console.error('Error in PATCH /api/admin/orders/[id]:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
