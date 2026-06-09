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

    const movements = await base44.entities.StockMovement.filter({ environment: 'LIVE', movement_type: 'WASTE' }, '-created_date', 500);

    const rows = [['Date', 'SKU', 'Item Name', 'Quantity', 'Site', 'Source Ref', 'Notes', 'Posted By', 'Status']];

    if (movements && movements.length > 0) {
      movements.forEach(m => {
        rows.push([
          m.created_date ? new Date(m.created_date).toLocaleDateString() : '',
          m.sku || '',
          m.item_name || '',
          String(m.qty || 0),
          m.site_id || '',
          m.source_ref || '',
          m.notes || '',
          m.posted_by || '',
          m.status || 'POSTED',
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
        'Content-Disposition': 'attachment; filename=wastage.csv',
      },
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});