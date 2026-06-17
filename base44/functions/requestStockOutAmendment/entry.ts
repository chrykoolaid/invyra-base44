import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

/**
 * requestStockOutAmendment
 * Creates an amendment request on an approved/posted StockOutRecord.
 * Approved records are immutable; amendments require approval.
 */

Deno.serve(async (req) => {
  const base44 = createClientFromRequest(req);
  const user = await base44.auth.me();
  if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

  const {
    record_id,
    amendment_reason,
    amendment_notes,
    after_snapshot, // { sku, quantity, reason_category, stock_out_class, ... }
    environment = 'LIVE',
  } = await req.json();

  if (!record_id || !amendment_reason || !after_snapshot) {
    return Response.json({
      error: 'record_id, amendment_reason, and after_snapshot are required.',
    }, { status: 400 });
  }

  const records = await base44.asServiceRole.entities.StockOutRecord.filter({ id: record_id });
  const record = records[0];
  if (!record) return Response.json({ error: 'Record not found.' }, { status: 404 });

  if (!['POSTED', 'AMENDED'].includes(record.status)) {
    return Response.json({
      error: `Only POSTED or AMENDED records can be amended. Current status: ${record.status}`,
    }, { status: 409 });
  }

  // Capture before snapshot
  const beforeSnapshot = {
    sku: record.sku,
    item_id: record.item_id,
    item_name: record.item_name,
    quantity: record.quantity,
    reason_category: record.reason_category,
    stock_out_class: record.stock_out_class,
    location: record.location,
    department: record.department,
  };

  // Detect changes
  const quantityDelta = (after_snapshot.quantity || record.quantity) - record.quantity;
  const skuChanged = after_snapshot.sku && after_snapshot.sku !== record.sku;
  const reasonChanged = after_snapshot.reason_category && after_snapshot.reason_category !== record.reason_category;
  const classChanged = after_snapshot.stock_out_class && after_snapshot.stock_out_class !== record.stock_out_class;
  const locationChanged = after_snapshot.location && after_snapshot.location !== record.location;

  const amendment = await base44.asServiceRole.entities.StockOutAmendment.create({
    record_id,
    request_status: 'PENDING',
    amendment_reason,
    amendment_notes: amendment_notes || '',
    before_snapshot: beforeSnapshot,
    after_snapshot,
    quantity_delta: quantityDelta,
    sku_changed: skuChanged,
    reason_category_changed: reasonChanged,
    stock_out_class_changed: classChanged,
    location_changed: locationChanged,
    requires_adjustment_posting: quantityDelta !== 0,
    requested_by: user.id || user.email,
    requested_at: new Date().toISOString(),
    environment,
  });

  await base44.asServiceRole.entities.AuditLog.create({
    item_id: record.item_id,
    sku: record.sku,
    item_name: record.item_name,
    change_type: 'STOCK_ADJUST',
    field_name: 'stock_out_amendment_requested',
    old_value: JSON.stringify(beforeSnapshot),
    new_value: JSON.stringify(after_snapshot),
    changed_by: user.email || user.id,
    actor_role: user.role,
    source_module: 'Wastage',
    action_type: 'AMENDMENT_REQUESTED',
    linked_source_record: record_id,
    source_record_id: amendment.id,
    notes: `Amendment requested: ${amendment_reason}. Delta: ${quantityDelta > 0 ? '+' : ''}${quantityDelta} units.`,
    environment,
  });

  return Response.json({ success: true, amendment });
});