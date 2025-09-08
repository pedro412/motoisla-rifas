import { NextResponse } from 'next/server';

export async function GET() {
  try {
    const supabaseUrl = 'http://127.0.0.1:54321';
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImV4cCI6MTk4MzgxMjk5Nn0.EGIM96RAZx35lJzdJsyH-qQwv8Hdp7fsn3W0YpN81IU';

    if (!serviceRoleKey) {
      return NextResponse.json(
        { error: 'Service role key not configured' },
        { status: 500 }
      );
    }

    console.log('Fetching orders from:', `${supabaseUrl}/rest/v1/orders`);
    console.log('Using service role key:', serviceRoleKey.substring(0, 20) + '...');

    // Get all orders using direct REST API call
    const response = await fetch(`${supabaseUrl}/rest/v1/orders?select=*&order=created_at.desc&limit=50`, {
      method: 'GET',
      headers: {
        'apikey': serviceRoleKey,
        'Authorization': `Bearer ${serviceRoleKey}`,
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      }
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
        total: order.total_amount || order.total, // Use total_amount from DB
        status: order.status,
        created_at: order.created_at,
        payment_deadline: order.payment_deadline,
        customer_name: order.customer_name || null, // Direct field from DB
        customer_phone: order.customer_phone || null, // Direct field from DB
        customer_email: order.customer_email || null // Direct field from DB
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
