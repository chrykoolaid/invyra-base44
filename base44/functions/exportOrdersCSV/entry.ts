import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

Deno.serve(async (req) => {
  if (req.method !== 'POST') {
    return Response.json({ error: 'Method not allowed' }, { status: 405 });
  }

  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const orders = await base44.entities.PurchaseOrder.filter({ environment: 'LIVE' }, '-created_date', 500);

    const rows = [['Order Number', 'Supplier', 'Status', 'Urgency', 'Expected Date', 'Submitted', 'Total Items', 'Notes']];

    if (orders && orders.length > 0) {
      orders.forEach(order => {
        const itemCount = order.lines ? order.lines.length : 0;
        rows.push([
          order.order_number || '',
          order.supplier || '',
          order.status || '',
          order.urgency || '',
          order.expected_date || '',
          order.submitted_at ? new Date(order.submitted_at).toLocaleDateString() : '',
          String(itemCount),
          order.notes || '',
        ]);
      });
    }

    const csv = rows.map(row => row.map(cell => {
      const str = String(cell || '');
      return str.includes(',') || str.includes('"') || str.includes('\n')
        ? `"${str.replace(/"/g, '""')}"`
        : str;
    }).join(',')).join('\n');

    return new Response(csv, {
      status: 200,
      headers: {
        'Content-Type': 'text/csv; charset=utf-8',
        'Content-Disposition': 'attachment; filename=orders.csv',
      },
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});