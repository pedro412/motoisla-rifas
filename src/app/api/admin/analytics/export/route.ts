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
      ...csvRows.map(row => row.map(field => `"${field}"`).join(','))
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
