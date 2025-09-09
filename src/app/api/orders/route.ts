import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const orderId = searchParams.get('order_id');

    if (orderId) {
      // Get specific order with tickets
      const { data: order, error } = await supabase
        .from('orders')
        .select(`
          *,
          tickets (*)
        `)
        .eq('id', orderId)
        .single();

      if (error) {
        console.error('Error fetching order:', error);
        return NextResponse.json({ error: 'Failed to fetch order' }, { status: 500 });
      }

      return NextResponse.json(order);
    } else {
      // Get all orders (admin view)
      const { data: orders, error } = await supabase
        .from('orders')
        .select(`
          *,
          raffles (title),
          tickets (number)
        `)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching orders:', error);
        return NextResponse.json({ error: 'Failed to fetch orders' }, { status: 500 });
      }

      return NextResponse.json(orders);
    }
  } catch (error) {
    console.error('Unexpected error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json();
    const { order_id, status, payment_proof_url } = body;

    if (!order_id || !status) {
      return NextResponse.json({ error: 'Order ID and status are required' }, { status: 400 });
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const updateData: any = { status };
    if (payment_proof_url) {
      updateData.payment_proof_url = payment_proof_url;
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: order, error } = await (supabase as any)
      .from('orders')
      .update(updateData)
      .eq('id', order_id)
      .select()
      .single();

    if (error) {
      console.error('Error updating order:', error);
      return NextResponse.json({ error: 'Failed to update order' }, { status: 500 });
    }

    // If order is confirmed, update ticket status to paid
    if (status === 'confirmed') {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { error: ticketError } = await (supabase as any)
        .from('tickets')
        .update({ status: 'paid' })
        .eq('order_id', order_id);

      if (ticketError) {
        console.error('Error updating ticket status:', ticketError);
        return NextResponse.json({ error: 'Failed to update ticket status' }, { status: 500 });
      }
    }

    return NextResponse.json(order);
  } catch (error) {
    console.error('Unexpected error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
