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

    console.log('Fetching orders from:', `${supabaseConfig.url}/rest/v1/orders`);
    console.log('Using service role key:', supabaseConfig.serviceRoleKey.substring(0, 20) + '...');

    // Get all orders using direct REST API call
    const response = await fetch(`${supabaseConfig.url}/rest/v1/orders?select=*&order=created_at.desc&limit=50`, {
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
