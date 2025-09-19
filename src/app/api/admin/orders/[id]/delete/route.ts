import { NextRequest, NextResponse } from 'next/server';
import { supabaseConfig } from '@/lib/supabase-config';

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: orderId } = await params;

    if (!orderId) {
      return NextResponse.json({ error: 'Order ID is required' }, { status: 400 });
    }

    console.log('🗑️ Deleting order:', orderId);

    // Step 1: Get order details first to know which tickets to release
    const orderResponse = await fetch(`${supabaseConfig.url}/rest/v1/orders?id=eq.${orderId}&select=*`, {
      method: 'GET',
      headers: supabaseConfig.headers
    });

    if (!orderResponse.ok) {
      return NextResponse.json({ error: 'Order not found' }, { status: 404 });
    }

    const orders = await orderResponse.json();
    if (!orders || orders.length === 0) {
      return NextResponse.json({ error: 'Order not found' }, { status: 404 });
    }

    const order = orders[0];
    console.log('📋 Order to delete:', {
      id: order.id,
      tickets: order.tickets,
      total_amount: order.total_amount,
      status: order.status,
      customer_name: order.customer_name
    });

    // Step 2: Release the tickets (change status back to 'free')
    if (order.tickets && Array.isArray(order.tickets) && order.tickets.length > 0) {
      const ticketNumbers = order.tickets.join(',');
      console.log('🎫 Releasing tickets:', ticketNumbers);

      const releaseTicketsResponse = await fetch(
        `${supabaseConfig.url}/rest/v1/tickets?number=in.(${ticketNumbers})&raffle_id=eq.${order.raffle_id}`, 
        {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
            'apikey': supabaseConfig.serviceRoleKey,
            'Authorization': `Bearer ${supabaseConfig.serviceRoleKey}`,
            'Prefer': 'return=minimal'
          },
          body: JSON.stringify({ 
            status: 'free',
            user_id: null,
            reserved_at: null,
            paid_at: null,
            expires_at: null
          })
        }
      );

      if (!releaseTicketsResponse.ok) {
        const errorText = await releaseTicketsResponse.text();
        console.error('❌ Error releasing tickets:', errorText);
        return NextResponse.json({ 
          error: 'Failed to release tickets',
          details: errorText 
        }, { status: 500 });
      }

      console.log('✅ Tickets released successfully');
    }

    // Step 3: Delete the order
    const deleteOrderResponse = await fetch(`${supabaseConfig.url}/rest/v1/orders?id=eq.${orderId}`, {
      method: 'DELETE',
      headers: {
        'apikey': supabaseConfig.serviceRoleKey,
        'Authorization': `Bearer ${supabaseConfig.serviceRoleKey}`,
        'Prefer': 'return=minimal'
      }
    });

    if (!deleteOrderResponse.ok) {
      const errorText = await deleteOrderResponse.text();
      console.error('❌ Error deleting order:', errorText);
      return NextResponse.json({ 
        error: 'Failed to delete order',
        details: errorText 
      }, { status: 500 });
    }

    console.log('✅ Order deleted successfully');

    // Return success response with details
    return NextResponse.json({
      success: true,
      message: 'Order deleted successfully',
      deletedOrder: {
        id: order.id,
        customerName: order.customer_name,
        tickets: order.tickets,
        totalAmount: order.total_amount,
        ticketsReleased: order.tickets?.length || 0
      }
    });

  } catch (error) {
    console.error('💥 Error in delete order API:', error);
    return NextResponse.json({ 
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}
