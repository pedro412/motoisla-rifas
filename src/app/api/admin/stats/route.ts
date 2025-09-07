import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';

export async function GET() {
  try {
    // Return mock stats if Supabase is not properly configured
    if (!process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL.includes('placeholder')) {
      const mockStats = {
        totalTickets: 500,
        soldTickets: 0,
        reservedTickets: 4, // From our test orders
        availableTickets: 496,
        totalOrders: 2,
        pendingOrders: 2,
        completedOrders: 0,
        totalRevenue: 0
      };
      return NextResponse.json(mockStats);
    }

    // Get ticket statistics
    const { data: tickets, error: ticketsError } = await supabaseAdmin
      .from('tickets')
      .select('status');

    if (ticketsError) {
      throw ticketsError;
    }

    // Get order statistics
    const { data: orders, error: ordersError } = await supabaseAdmin
      .from('orders')
      .select('status, total');

    if (ordersError) {
      throw ordersError;
    }

    // Calculate ticket stats
    const totalTickets = tickets?.length || 0;
    const soldTickets = tickets?.filter((t: any) => t.status === 'sold').length || 0;
    const reservedTickets = tickets?.filter((t: any) => t.status === 'reserved').length || 0;
    const availableTickets = tickets?.filter((t: any) => t.status === 'free').length || 0;

    // Calculate order stats
    const totalOrders = orders?.length || 0;
    const pendingOrders = orders?.filter((o: any) => o.status === 'pending').length || 0;
    const completedOrders = orders?.filter((o: any) => o.status === 'completed').length || 0;
    const totalRevenue = orders
      ?.filter((o: any) => o.status === 'completed')
      .reduce((sum: number, order: any) => sum + (order.total || 0), 0) || 0;

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
