import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

/**
 * createStockOutRecord
 * Creates a new WASTAGE or STORE_USE stock out record in DRAFT status.
 * Does not post stock movement until approval.
 */

Deno.serve(async (req) => {
  const base44 = createClientFromRequest(req);
  const user = await base44.auth.me();
  if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

  const {
    sku,
    item_id,
    item_name,
    stock_out_class, // WASTAGE or STORE_USE
    quantity,
    reason_category,
    reason_notes,
    location,
    department,
    cost_centre,
    source = 'MANUAL',
    source_reference,
    site_id,
    environment = 'LIVE',
  } = await req.json();

  if (!sku || !item_id || !quantity || quantity <= 0 || !stock_out_class || !reason_category) {
    return Response.json({
      error: 'sku, item_id, quantity (>0), stock_out_class (WASTAGE/STORE_USE), and reason_category are required.',
    }, { status: 400 });
  }

  if (!['WASTAGE', 'STORE_USE'].includes(stock_out_class)) {
    return Response.json({ error: 'stock_out_class must be WASTAGE or STORE_USE.' }, { status: 400 });
  }

  // Calculate estimated value
  let item = null;
  let estimatedValue = 0;
  try {
    const items = await base44.asServiceRole.entities.InventoryItem.filter({ id: item_id });
    item = items[0];
    estimatedValue = quantity * (item?.cost_per_unit || 0);
  } catch (_) {
    estimatedValue = 0;
  }

  const record = await base44.asServiceRole.entities.StockOutRecord.create({
    sku,
    item_id,
    item_name,
    stock_out_class,
    quantity,
    reason_category,
    reason_notes: reason_notes || '',
    location: location || '',
    department: department || '',
    cost_centre: cost_centre || '',
    estimated_value: estimatedValue,
    source,
    source_reference: source_reference || '',
    status: 'DRAFT',
    created_by: user.id || user.email,
    created_by_email: user.email || '',
    site_id: site_id || '',
    environment,
  });

  await base44.asServiceRole.entities.AuditLog.create({
    item_id,
    sku,
    item_name,
    change_type: 'STOCK_WASTE',
    field_name: 'stock_out_record_created',
    old_value: '',
    new_value: JSON.stringify({
      record_id: record.id,
      stock_out_class,
      quantity,
      reason: reason_category,
      estimated_value: estimatedValue,
    }),
    changed_by: user.email || user.id,
    actor_role: user.role,
    source_module: 'Wastage',
    action_type: 'STOCK_OUT_CREATED',
    linked_source_record: record.id,
    source_record_id: record.id,
    notes: `${stock_out_class} record created: ${quantity} units. Source: ${source}.`,
    environment,
  });

  return Response.json({ success: true, record });
});