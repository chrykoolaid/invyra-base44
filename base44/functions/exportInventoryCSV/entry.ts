import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

Deno.serve(async (req) => {
  if (req.method !== 'POST') {
    return Response.json({ error: 'POST only' }, { status: 405 });
  }

  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    
    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Fetch all active inventory items
    const items = await base44.entities.InventoryItem.filter({ is_active: true }, '-updated_date', 500);

    // Build CSV header
    const headers = ['SKU', 'Item Name', 'Unit', 'On Hand Stock', 'Reorder Point', 'Reorder Qty', 'Cost per Unit', 'Preferred Supplier', 'Stock Value'];
    
    // Build CSV rows
    const rows = (items || []).map(item => [
      item.sku || '',
      item.name || '',
      item.unit || '',
      item.stock || 0,
      item.reorder_point || '',
      item.reorder_qty || '',
      item.cost_per_unit || '',
      item.preferred_supplier || '',
      ((item.stock || 0) * (item.cost_per_unit || 0)).toFixed(2),
    ]);

    // Convert to CSV string
    const csv = [
      headers.join(','),
      ...rows.map(row => row.map(cell => {
        const cellStr = String(cell);
        if (cellStr.includes(',') || cellStr.includes('"') || cellStr.includes('\n')) {
          return `"${cellStr.replace(/"/g, '""')}"`;
        }
        return cellStr;
      }).join(',')),
    ].join('\n');

    // Return CSV file
    return new Response(csv, {
      status: 200,
      headers: {
        'Content-Type': 'text/csv; charset=utf-8',
        'Content-Disposition': `attachment; filename="inventory-export-${new Date().toISOString().split('T')[0]}.csv"`,
      },
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});