import { NextResponse } from 'next/server';

export async function GET() {
  try {
    // Use direct API calls to ensure consistency with other endpoints
    const supabaseUrl = 'http://127.0.0.1:54321';
    const serviceRoleKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImV4cCI6MTk4MzgxMjk5Nn0.EGIM96RAZx35lJzdJsyH-qQwv8Hdp7fsn3W0YpN81IU';

    // Get ticket statistics using direct API calls for consistency
    const ticketsResponse = await fetch(`${supabaseUrl}/rest/v1/tickets?select=status`, {
      method: 'GET',
      headers: {
        'apikey': serviceRoleKey,
        'Authorization': `Bearer ${serviceRoleKey}`
      }
    });

    if (!ticketsResponse.ok) {
      throw new Error('Failed to fetch tickets');
    }

    const tickets = await ticketsResponse.json();

    // Get order statistics using direct API calls
    const ordersResponse = await fetch(`${supabaseUrl}/rest/v1/orders?select=status,total_amount`, {
      method: 'GET',
      headers: {
        'apikey': serviceRoleKey,
        'Authorization': `Bearer ${serviceRoleKey}`
      }
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
