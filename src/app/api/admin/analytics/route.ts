import { NextRequest, NextResponse } from 'next/server'

interface Order {
  id: string;
  status: string;
  total_amount: number;
  created_at: string;
}

interface Ticket {
  id: string;
  status: 'free' | 'reserved' | 'sold';
  created_at: string;
};

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
    const totalRevenue = (orders as Order[])
      .filter((order) => order.status === 'paid')
      .reduce((sum: number, order) => sum + (order.total_amount || 0), 0);

    const totalOrders = orders.length;
    const paidOrders = (orders as Order[]).filter((order) => order.status === 'paid').length;
    const conversionRate = totalOrders > 0 ? (paidOrders / totalOrders) * 100 : 0;
    const averageOrderValue = paidOrders > 0 ? totalRevenue / paidOrders : 0;

    // Ticket statistics
    const ticketsSold = (tickets as Ticket[]).filter((ticket) => ticket.status === 'sold').length;
    const ticketsReserved = (tickets as Ticket[]).filter((ticket) => ticket.status === 'reserved').length;
    const ticketsAvailable = (tickets as Ticket[]).filter((ticket) => ticket.status === 'free').length;

    // Daily stats
    const dailyStats = [];
    for (let i = 0; i < daysBack; i++) {
      const date = new Date(startDate.getTime() + (i * 24 * 60 * 60 * 1000));
      const dayStart = new Date(date.setHours(0, 0, 0, 0));
      const dayEnd = new Date(date.setHours(23, 59, 59, 999));
      
      const dayOrders = (orders as Order[]).filter((order) => {
        const orderDate = new Date(order.created_at);
        return orderDate >= dayStart && orderDate <= dayEnd;
      });

      // Filter tickets for this day (currently unused but kept for future analytics)
      // const dayTickets = (tickets as Ticket[]).filter((ticket) => {
      //   const ticketDate = new Date(ticket.created_at);
      //   return ticketDate >= dayStart && ticketDate <= dayEnd;
      // });

      const dayRevenue = dayOrders
        .filter((order) => order.status === 'paid')
        .reduce((sum: number, order) => sum + (order.total_amount || 0), 0);

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const dayTicketsSold = dayOrders
        .filter((order) => order.status === 'paid')
        .reduce((sum: number, order) => sum + (Array.isArray((order as any).tickets) ? (order as any).tickets.length : JSON.parse((order as any).tickets || '[]').length), 0);

      dailyStats.push({
        date: dayStart.toISOString().split('T')[0],
        orders: dayOrders.length,
        revenue: dayRevenue,
        ticketsSold: dayTicketsSold
      });
    }

    // Customer stats
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const customerStats = (orders as any[]).reduce((acc: any, order: any) => {
      const customerOrderCounts = new Map();

      orders.forEach((order: any) => {
        if (order.customer_phone) {
          acc.uniqueCustomers.add(order.customer_phone);
          const count = customerOrderCounts.get(order.customer_phone) || 0;
          customerOrderCounts.set(order.customer_phone, count + 1);
        }
      });

      const repeatCustomers = Array.from(customerOrderCounts.values()).filter(count => count > 1).length;
      // Top raffles
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const topRaffles = (orders as any[])
        .filter((order: any) => order.status === 'paid')
        .reduce((acc: any, order: any) => {
          if (!acc[order.rafle_id]) {
            acc[order.rafle_id] = 0;
          }
          acc[order.rafle_id] += Array.isArray(order.tickets) ? order.tickets.length : JSON.parse(order.tickets || '[]').length;
          return acc;
        }, {});

      const totalTicketsPurchased = orders
        .filter((order: any) => order.status === 'paid')
        .reduce((sum: number, order: any) => sum + (Array.isArray(order.tickets) ? order.tickets.length : JSON.parse(order.tickets || '[]').length), 0);
      const averageTicketsPerCustomer = acc.uniqueCustomers.size > 0 ? totalTicketsPurchased / acc.uniqueCustomers.size : 0;

      acc.repeatCustomers = repeatCustomers;
      acc.topRaffles = topRaffles;
      acc.averageTicketsPerCustomer = averageTicketsPerCustomer;
      return acc;
    }, { uniqueCustomers: new Set(), repeatCustomers: 0, topRaffles: {}, averageTicketsPerCustomer: 0 });

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
