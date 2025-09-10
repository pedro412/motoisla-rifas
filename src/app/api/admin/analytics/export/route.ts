import { NextRequest, NextResponse } from 'next/server';
import { supabaseConfig } from '@/lib/supabase-config';


export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const range = searchParams.get('range') || '7d';

    // Using supabaseConfig.url instead of hardcoded localhost
    // Using supabaseConfig.serviceRoleKey instead of hardcoded key

    // Calculate date range
    const now = new Date();
    const daysBack = range === '1d' ? 1 : range === '7d' ? 7 : range === '30d' ? 30 : 90;
    const startDate = new Date(now.getTime() - (daysBack * 24 * 60 * 60 * 1000));

    // Fetch orders data
    const ordersResponse = await fetch(`${supabaseConfig.url}/rest/v1/orders?created_at=gte.${startDate.toISOString()}&select=*`, {
      headers: supabaseConfig.headers
    });

    if (!ordersResponse.ok) {
      throw new Error('Failed to fetch orders');
    }

    const orders = await ordersResponse.json();

    // Generate CSV content
    const csvHeaders = [
      'Fecha',
      'ID Orden',
      'Cliente',
      'Teléfono',
      'Email',
      'Boletos',
      'Total',
      'Estado',
      'Fecha Límite Pago'
    ];

    const csvRows = orders.map((order: any) => [
      new Date(order.created_at).toLocaleDateString('es-ES'),
      order.id,
      order.customer_name || '',
      order.customer_phone || '',
      order.customer_email || '',
      Array.isArray(order.tickets) ? order.tickets.join(';') : JSON.parse(order.tickets || '[]').join(';'),
      order.total_amount || 0,
      order.status,
      order.payment_deadline ? new Date(order.payment_deadline).toLocaleDateString('es-ES') : ''
    ]);

    // Create CSV content
    const csvContent = [
      csvHeaders.join(','),
      ...csvRows.map((row: (string | number)[]) => row.map(field => `"${field}"`).join(','))
    ].join('\n');

    // Return CSV file
    return new NextResponse(csvContent, {
      headers: {
        'Content-Type': 'text/csv',
        'Content-Disposition': `attachment; filename="analytics-${range}-${new Date().toISOString().split('T')[0]}.csv"`
      }
    });

  } catch (error) {
    console.error('Error exporting analytics:', error);
    return NextResponse.json(
      { error: 'Failed to export analytics' },
      { status: 500 }
    );
  }
}
