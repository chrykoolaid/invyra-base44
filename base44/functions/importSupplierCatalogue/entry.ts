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

    const { rows } = await req.json();
    if (!Array.isArray(rows) || rows.length === 0) {
      return Response.json({ error: 'No valid rows to import' }, { status: 400 });
    }

    const results = { success: 0, failed: 0, errors: [] };
    const changedBy = user?.email || user?.full_name || 'unknown';

    for (const row of rows) {
      const { sku, name, supplier, unit_cost } = row;
      if (!sku || !name) {
        results.failed++;
        results.errors.push(`Row missing SKU or name`);
        continue;
      }

      try {
        // Find existing item by SKU
        const existing = await base44.entities.InventoryItem.filter({ sku });
        const item = existing && existing.length > 0 ? existing[0] : null;

        if (item) {
          // Update existing item
          const updates = {};
          if (supplier) updates.preferred_supplier = supplier;
          if (unit_cost) {
            updates.cost_per_unit = parseFloat(unit_cost);
            // Log price change
            await base44.entities.AuditLog.create({
              item_id: item.id,
              sku: item.sku,
              item_name: item.name,
              change_type: 'PRICE_UPDATE',
              field_name: 'cost_per_unit',
              old_value: String(item.cost_per_unit || ''),
              new_value: String(unit_cost),
              changed_by: changedBy,
              notes: `Imported from supplier catalogue`,
            });
          }
          if (supplier && !item.preferred_supplier) {
            // Log supplier update
            await base44.entities.AuditLog.create({
              item_id: item.id,
              sku: item.sku,
              item_name: item.name,
              change_type: 'SUPPLIER_UPDATE',
              field_name: 'preferred_supplier',
              old_value: item.preferred_supplier || '',
              new_value: supplier,
              changed_by: changedBy,
              notes: `Imported from supplier catalogue`,
            });
          }

          if (Object.keys(updates).length > 0) {
            await base44.entities.InventoryItem.update(item.id, updates);
          }
        } else {
          // Create new item
          const newItem = await base44.entities.InventoryItem.create({
            sku,
            name,
            unit: row.unit || 'units',
            preferred_supplier: supplier || null,
            cost_per_unit: unit_cost ? parseFloat(unit_cost) : null,
            is_active: true,
          });

          if (unit_cost) {
            await base44.entities.AuditLog.create({
              item_id: newItem.id,
              sku,
              item_name: name,
              change_type: 'PRICE_UPDATE',
              field_name: 'cost_per_unit',
              old_value: '',
              new_value: String(unit_cost),
              changed_by: changedBy,
              notes: `Created from supplier catalogue import`,
            });
          }
        }
        results.success++;
      } catch (err) {
        results.failed++;
        results.errors.push(`SKU ${sku}: ${err.message}`);
      }
    }

    return Response.json({ success: true, results });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});