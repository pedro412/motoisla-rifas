import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';

export async function GET() {
  try {
    // Get all orders with customer info from proof_url
    const { data: orders, error } = await supabaseAdmin
      .from('orders')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(50); // Limit to recent 50 orders

    if (error) {
      throw error;
    }

    // Parse customer info from proof_url JSON
    const ordersWithCustomerInfo = orders.map(order => {
      let customerInfo = {};
      
      try {
        if (order.proof_url && order.proof_url.startsWith('{')) {
          customerInfo = JSON.parse(order.proof_url);
        }
      } catch (e) {
        console.warn('Failed to parse customer info for order:', order.id);
      }

      return {
        id: order.id,
        tickets: Array.isArray(order.tickets) ? order.tickets : JSON.parse(order.tickets || '[]'),
        total: order.total,
        status: order.status,
        created_at: order.created_at,
        payment_deadline: order.payment_deadline,
        customer_name: customerInfo.name || null,
        customer_phone: customerInfo.phone || null,
        customer_email: customerInfo.email || null
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
