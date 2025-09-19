import { NextResponse } from 'next/server';
import { supabaseConfig } from '@/lib/supabase-config';


export async function GET() {
  try {
    // Using supabaseConfig.url instead of hardcoded localhost
    // Using supabaseConfig.serviceRoleKey instead of hardcoded key

    if (!supabaseConfig.serviceRoleKey) {
      return NextResponse.json(
        { error: 'Service role key not configured' },
        { status: 500 }
      );
    }

    // First, get the current active raffle
    const raffleResponse = await fetch(`${supabaseConfig.url}/rest/v1/raffles?status=eq.active&order=created_at.desc&limit=1`, {
      method: 'GET',
      headers: supabaseConfig.headers
    });

    if (!raffleResponse.ok) {
      return NextResponse.json({ error: 'Failed to fetch current raffle' }, { status: 500 });
    }

    const raffles = await raffleResponse.json();
    if (!raffles || raffles.length === 0) {
      // No active raffle, return empty orders
      return NextResponse.json([]);
    }

    const currentRaffle = raffles[0];
    console.log('Current active raffle:', currentRaffle.id, currentRaffle.title);

    // Get orders for current active raffle only
    const response = await fetch(`${supabaseConfig.url}/rest/v1/orders?raffle_id=eq.${currentRaffle.id}&select=*,raffles(title)&order=created_at.desc&limit=50`, {
      method: 'GET',
      headers: supabaseConfig.headers
    });

    console.log('Response status:', response.status);

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Error fetching orders:', response.status, errorText);
      return NextResponse.json(
        { error: `Failed to fetch orders: ${response.status}` },
        { status: 500 }
      );
    }

    const orders = await response.json();
    console.log('Fetched orders count:', orders.length);
    console.log('Sample order:', orders[0]);

    // Map orders to expected format
    const ordersWithCustomerInfo = orders.map((order: any) => {
      return {
        id: order.id,
        tickets: Array.isArray(order.tickets) ? order.tickets : JSON.parse(order.tickets || '[]'),
        total_amount: order.total_amount || order.total, // Use total_amount from DB
        status: order.status,
        created_at: order.created_at,
        payment_deadline: order.payment_deadline,
        customer_name: order.customer_name || 'N/A', // Direct field from DB
        customer_phone: order.customer_phone || '', // Direct field from DB
        customer_email: order.customer_email || null, // Direct field from DB
        raffle: order.raffles ? { title: order.raffles.title } : null
      };
    });

    return NextResponse.json(ordersWithCustomerInfo);
  } catch (error) {
    console.error('Admin orders error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch orders' },
      { status: 500 }
    );
  }
}
