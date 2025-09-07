import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';

export async function GET(
  request: NextRequest,
  { params }: { params: { orderId: string } }
) {
  try {
    const { orderId } = params;

    if (!orderId) {
      return NextResponse.json({ error: 'Order ID is required' }, { status: 400 });
    }

    // Return mock order validation if Supabase is not properly configured
    if (!process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL.includes('placeholder')) {
      // Try to get order creation time from localStorage or extract from orderId
      let createdAt = new Date();
      let paymentDeadline = new Date(Date.now() + 15 * 60 * 1000);
      
      // Extract timestamp from orderId if it follows the pattern "order-{timestamp}"
      const timestampMatch = orderId.match(/order-(\d+)/);
      if (timestampMatch) {
        const timestamp = parseInt(timestampMatch[1]);
        createdAt = new Date(timestamp);
        paymentDeadline = new Date(timestamp + 15 * 60 * 1000); // 15 minutes from creation
      }

      const mockOrder = {
        id: orderId,
        tickets: ['1', '2'], // Mock ticket numbers
        total: 100,
        status: 'pending',
        payment_deadline: paymentDeadline.toISOString(),
        created_at: createdAt.toISOString()
      };

      // Calculate remaining time in seconds
      const now = new Date();
      const remainingMs = paymentDeadline.getTime() - now.getTime();
      const remainingSeconds = Math.max(0, Math.floor(remainingMs / 1000));

      return NextResponse.json({
        order: {
          id: mockOrder.id,
          tickets: mockOrder.tickets,
          total: mockOrder.total,
          status: mockOrder.status,
          paymentDeadline: mockOrder.payment_deadline,
          remainingSeconds,
          customerInfo: {
            name: 'Mock Customer',
            phone: '123123123',
            email: null
          },
          createdAt: mockOrder.created_at
        },
        valid: true,
        expired: false
      });
    }

    // Get order details from database
    const { data: order, error: orderError } = await supabaseAdmin
      .from('orders')
      .select('*')
      .eq('id', orderId)
      .single();

    if (orderError || !order) {
      return NextResponse.json({ error: 'Order not found' }, { status: 404 });
    }

    // Check if order has expired
    const now = new Date();
    const paymentDeadline = new Date(order.payment_deadline);
    const isExpired = now > paymentDeadline;

    if (isExpired) {
      // Update order status to cancelled and release tickets
      await supabaseAdmin
        .from('orders')
        .update({ status: 'cancelled' })
        .eq('id', orderId);

      // Release the reserved tickets
      if (order.tickets && Array.isArray(order.tickets)) {
        await supabaseAdmin
          .from('tickets')
          .update({ 
            status: 'free',
            expires_at: null
          })
          .in('number', order.tickets.map(Number))
          .eq('status', 'reserved');
      }

      return NextResponse.json({ 
        error: 'Order has expired',
        expired: true 
      }, { status: 410 });
    }

    // Calculate remaining time in seconds
    const remainingMs = paymentDeadline.getTime() - now.getTime();
    const remainingSeconds = Math.max(0, Math.floor(remainingMs / 1000));

    // Parse customer info from proof_url (temporary storage)
    let customerInfo = null;
    try {
      if (order.proof_url) {
        customerInfo = JSON.parse(order.proof_url);
      }
    } catch (e) {
      // If parsing fails, proof_url might contain actual proof URL
    }

    return NextResponse.json({
      order: {
        id: order.id,
        tickets: order.tickets,
        total: order.total,
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
  { params }: { params: { orderId: string } }
) {
  try {
    const { orderId } = params;

    if (!orderId) {
      return NextResponse.json({ error: 'Order ID is required' }, { status: 400 });
    }

    // Return success for mock data (no actual deletion needed)
    if (!process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL.includes('placeholder')) {
      return NextResponse.json({ success: true, message: 'Order cancelled' });
    }

    // Cancel the order in database
    const { error: orderError } = await supabaseAdmin
      .from('orders')
      .update({ status: 'cancelled' })
      .eq('id', orderId);

    if (orderError) {
      console.error('Error cancelling order:', orderError);
      return NextResponse.json({ error: 'Failed to cancel order' }, { status: 500 });
    }

    // Release any reserved tickets
    const { error: ticketError } = await supabaseAdmin
      .from('tickets')
      .update({ 
        status: 'free',
        expires_at: null
      })
      .eq('order_id', orderId);

    if (ticketError) {
      console.error('Error releasing tickets:', ticketError);
    }

    return NextResponse.json({ success: true, message: 'Order cancelled' });

  } catch (error) {
    console.error('Error cancelling order:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
