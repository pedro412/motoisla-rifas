import { NextRequest, NextResponse } from 'next/server';
import { supabaseConfig } from '@/lib/supabase-config';


export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ orderId: string }> }
) {
  try {
    const { orderId } = await params;

    if (!orderId) {
      return NextResponse.json({ error: 'Order ID is required' }, { status: 400 });
    }

    // Using supabaseConfig.url instead of hardcoded localhost
    // Using supabaseConfig.serviceRoleKey instead of hardcoded key

    // Get order details from database
    const orderResponse = await fetch(`${supabaseConfig.url}/rest/v1/orders?id=eq.${orderId}`, {
      method: 'GET',
      headers: supabaseConfig.headers
    });

    if (!orderResponse.ok) {
      const errorText = await orderResponse.text();
      console.error('Error fetching order:', errorText);
      return NextResponse.json({ error: 'Order not found' }, { status: 404 });
    }

    const orders = await orderResponse.json();
    if (!orders || orders.length === 0) {
      return NextResponse.json({ error: 'Order not found' }, { status: 404 });
    }

    const order = orders[0];

    // Check if order is already paid
    if (order.status === 'paid') {
      return NextResponse.json({
        order: {
          id: order.id,
          tickets: order.tickets,
          total: order.total_amount,
          status: order.status,
          paymentDeadline: order.payment_deadline,
          remainingSeconds: 0,
          customerInfo: {
            name: order.customer_name,
            phone: order.customer_phone,
            email: order.customer_email
          },
          createdAt: order.created_at
        },
        valid: true,
        expired: false,
        paid: true
      });
    }

    // Check if order was cancelled
    if (order.status === 'cancelled') {
      return NextResponse.json({ 
        error: 'Order has been cancelled',
        cancelled: true,
        valid: false
      }, { status: 410 });
    }

    // Check if order has expired
    const now = new Date();
    const paymentDeadline = new Date(order.payment_deadline);
    const isExpired = now > paymentDeadline;

    if (isExpired) {
      // Update order status to cancelled
      await fetch(`${supabaseConfig.url}/rest/v1/orders?id=eq.${orderId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'apikey': serviceRoleKey,
          'Authorization': `Bearer ${serviceRoleKey}`
        },
        body: JSON.stringify({ status: 'cancelled' })
      });

      // Release the reserved tickets
      if (order.tickets && Array.isArray(order.tickets)) {
        const ticketNumbers = order.tickets.join(',');
        await fetch(`${supabaseConfig.url}/rest/v1/tickets?number=in.(${ticketNumbers})&status=eq.reserved`, {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
            'apikey': serviceRoleKey,
            'Authorization': `Bearer ${serviceRoleKey}`
          },
          body: JSON.stringify({ 
            status: 'free',
            expires_at: null
          })
        });
      }

      return NextResponse.json({ 
        error: 'Order has expired',
        expired: true 
      }, { status: 410 });
    }

    // Calculate remaining time in seconds
    const remainingMs = paymentDeadline.getTime() - now.getTime();
    const remainingSeconds = Math.max(0, Math.floor(remainingMs / 1000));

    // Get customer info from dedicated fields
    const customerInfo = {
      name: order.customer_name,
      phone: order.customer_phone,
      email: order.customer_email
    };

    return NextResponse.json({
      order: {
        id: order.id,
        tickets: order.tickets,
        total: order.total_amount,
        status: order.status,
        paymentDeadline: order.payment_deadline,
        remainingSeconds,
        customerInfo,
        createdAt: order.created_at
      },
      valid: true,
      expired: false
    });

  } catch (error) {
    console.error('Error validating order:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ orderId: string }> }
) {
  try {
    const { orderId } = await params;

    if (!orderId) {
      return NextResponse.json({ error: 'Order ID is required' }, { status: 400 });
    }

    // Using supabaseConfig.url instead of hardcoded localhost
    // Using supabaseConfig.serviceRoleKey instead of hardcoded key

    // Cancel the order in database
    const orderResponse = await fetch(`${supabaseConfig.url}/rest/v1/orders?id=eq.${orderId}`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        'apikey': serviceRoleKey,
        'Authorization': `Bearer ${serviceRoleKey}`
      },
      body: JSON.stringify({ status: 'cancelled' })
    });

    if (!orderResponse.ok) {
      const errorText = await orderResponse.text();
      console.error('Error cancelling order:', errorText);
      return NextResponse.json({ error: 'Failed to cancel order' }, { status: 500 });
    }

    // Release any reserved tickets by updating all tickets that are reserved
    const ticketResponse = await fetch(`${supabaseConfig.url}/rest/v1/tickets?status=eq.reserved`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        'apikey': serviceRoleKey,
        'Authorization': `Bearer ${serviceRoleKey}`
      },
      body: JSON.stringify({ 
        status: 'free',
        expires_at: null
      })
    });

    if (!ticketResponse.ok) {
      const errorText = await ticketResponse.text();
      console.error('Error releasing tickets:', errorText);
    }

    return NextResponse.json({ success: true, message: 'Order cancelled' });

  } catch (error) {
    console.error('Error cancelling order:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
