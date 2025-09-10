import { NextResponse } from 'next/server';
import { supabaseConfig } from '@/lib/supabase-config';


export async function GET() {
  try {
    // Use direct API calls to ensure consistency with other endpoints
    // Using supabaseConfig.url instead of hardcoded localhost
    // Using supabaseConfig.serviceRoleKey instead of hardcoded key

    // Get ticket statistics using direct API calls for consistency
    const ticketsResponse = await fetch(`${supabaseConfig.url}/rest/v1/tickets?select=status`, {
      method: 'GET',
      headers: supabaseConfig.headers
    });

    if (!ticketsResponse.ok) {
      throw new Error('Failed to fetch tickets');
    }

    const tickets = await ticketsResponse.json();

    // Get order statistics using direct API calls
    const ordersResponse = await fetch(`${supabaseConfig.url}/rest/v1/orders?select=status,total_amount`, {
      method: 'GET',
      headers: supabaseConfig.headers
    });

    if (!ordersResponse.ok) {
      throw new Error('Failed to fetch orders');
    }

    const orders = await ordersResponse.json();

    // Calculate ticket stats
    const totalTickets = tickets?.length || 0;
    const soldTickets = tickets?.filter((t: { status: string }) => t.status === 'paid').length || 0;
    const reservedTickets = tickets?.filter((t: { status: string }) => t.status === 'reserved').length || 0;
    const availableTickets = tickets?.filter((t: { status: string }) => t.status === 'free').length || 0;

    // Calculate order stats
    const totalOrders = orders?.length || 0;
    const pendingOrders = orders?.filter((o: { status: string }) => o.status === 'pending').length || 0;
    const completedOrders = orders?.filter((o: { status: string }) => o.status === 'paid').length || 0;
    const totalRevenue = orders
      ?.filter((o: { status: string }) => o.status === 'paid')
      .reduce((sum: number, order: { total_amount: number }) => sum + (order.total_amount || 0), 0) || 0;

    const stats = {
      totalTickets,
      soldTickets,
      reservedTickets,
      availableTickets,
      totalOrders,
      pendingOrders,
      completedOrders,
      totalRevenue
    };

    return NextResponse.json(stats);
  } catch (error) {
    console.error('Admin stats error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch stats' },
      { status: 500 }
    );
  }
}
