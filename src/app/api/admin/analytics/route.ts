import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const range = searchParams.get('range') || '7d';

    const supabaseUrl = 'http://127.0.0.1:54321';
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImV4cCI6MTk4MzgxMjk5Nn0.EGIM96RAZx35lJzdJsyH-qQwv8Hdp7fsn3W0YpN81IU';

    // Calculate date range
    const now = new Date();
    const daysBack = range === '1d' ? 1 : range === '7d' ? 7 : range === '30d' ? 30 : 90;
    const startDate = new Date(now.getTime() - (daysBack * 24 * 60 * 60 * 1000));

    console.log('Fetching analytics for range:', range, 'from:', startDate.toISOString());

    // Fetch orders data
    const ordersResponse = await fetch(`${supabaseUrl}/rest/v1/orders?created_at=gte.${startDate.toISOString()}&select=*`, {
      headers: {
        'apikey': serviceRoleKey,
        'Authorization': `Bearer ${serviceRoleKey}`,
        'Content-Type': 'application/json'
      }
    });

    if (!ordersResponse.ok) {
      throw new Error('Failed to fetch orders');
    }

    const orders = await ordersResponse.json();

    // Fetch tickets data
    const ticketsResponse = await fetch(`${supabaseUrl}/rest/v1/tickets?select=*`, {
      headers: {
        'apikey': serviceRoleKey,
        'Authorization': `Bearer ${serviceRoleKey}`,
        'Content-Type': 'application/json'
      }
    });

    if (!ticketsResponse.ok) {
      throw new Error('Failed to fetch tickets');
    }

    const tickets = await ticketsResponse.json();

    // Calculate analytics
    const totalRevenue = orders
      .filter((order: any) => order.status === 'paid')
      .reduce((sum: number, order: any) => sum + (order.total_amount || 0), 0);

    const totalOrders = orders.length;
    const paidOrders = orders.filter((order: any) => order.status === 'paid').length;
    const conversionRate = totalOrders > 0 ? (paidOrders / totalOrders) * 100 : 0;
    const averageOrderValue = paidOrders > 0 ? totalRevenue / paidOrders : 0;

    // Ticket statistics
    const ticketsSold = tickets.filter((ticket: any) => ticket.status === 'sold').length;
    const ticketsReserved = tickets.filter((ticket: any) => ticket.status === 'reserved').length;
    const ticketsAvailable = tickets.filter((ticket: any) => ticket.status === 'free').length;

    // Daily stats
    const dailyStats = [];
    for (let i = 0; i < daysBack; i++) {
      const date = new Date(startDate.getTime() + (i * 24 * 60 * 60 * 1000));
      const dayStart = new Date(date.setHours(0, 0, 0, 0));
      const dayEnd = new Date(date.setHours(23, 59, 59, 999));
      
      const dayOrders = orders.filter((order: any) => {
        const orderDate = new Date(order.created_at);
        return orderDate >= dayStart && orderDate <= dayEnd;
      });

      const dayRevenue = dayOrders
        .filter((order: any) => order.status === 'paid')
        .reduce((sum: number, order: any) => sum + (order.total_amount || 0), 0);

      const dayTicketsSold = dayOrders
        .filter((order: any) => order.status === 'paid')
        .reduce((sum: number, order: any) => sum + (Array.isArray(order.tickets) ? order.tickets.length : JSON.parse(order.tickets || '[]').length), 0);

      dailyStats.push({
        date: dayStart.toISOString().split('T')[0],
        orders: dayOrders.length,
        revenue: dayRevenue,
        ticketsSold: dayTicketsSold
      });
    }

    // Customer stats
    const uniqueCustomers = new Set();
    const customerOrderCounts = new Map();

    orders.forEach((order: any) => {
      if (order.customer_phone) {
        uniqueCustomers.add(order.customer_phone);
        const count = customerOrderCounts.get(order.customer_phone) || 0;
        customerOrderCounts.set(order.customer_phone, count + 1);
      }
    });

    const repeatCustomers = Array.from(customerOrderCounts.values()).filter(count => count > 1).length;
    const totalTicketsPurchased = orders
      .filter((order: any) => order.status === 'paid')
      .reduce((sum: number, order: any) => sum + (Array.isArray(order.tickets) ? order.tickets.length : JSON.parse(order.tickets || '[]').length), 0);
    const averageTicketsPerCustomer = uniqueCustomers.size > 0 ? totalTicketsPurchased / uniqueCustomers.size : 0;

    // Payment stats
    const paymentStats = {
      pending: orders.filter((order: any) => order.status === 'pending').length,
      paid: orders.filter((order: any) => order.status === 'paid').length,
      cancelled: orders.filter((order: any) => order.status === 'cancelled').length
    };

    const analytics = {
      totalRevenue,
      totalOrders,
      conversionRate,
      averageOrderValue,
      ticketsSold,
      ticketsReserved,
      ticketsAvailable,
      dailyStats,
      hourlyStats: [], // Could be implemented later
      customerStats: {
        totalCustomers: uniqueCustomers.size,
        repeatCustomers,
        averageTicketsPerCustomer
      },
      paymentStats
    };

    console.log('Analytics calculated:', {
      totalRevenue,
      totalOrders,
      conversionRate: conversionRate.toFixed(1) + '%',
      ticketsSold,
      uniqueCustomers: uniqueCustomers.size
    });

    return NextResponse.json(analytics);

  } catch (error) {
    console.error('Error fetching analytics:', error);
    return NextResponse.json(
      { error: 'Failed to fetch analytics' },
      { status: 500 }
    );
  }
}
