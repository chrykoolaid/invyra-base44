import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

/**
 * approveStockOutAmendment — FIXED
 * Correct stock movement direction for amendments:
 * - Positive delta (increase qty) = OUT (remove more stock)
 * - Negative delta (decrease qty) = IN (restore stock)
 */

function normaliseRole(role) {
  return (role || '').toLowerCase().trim();
}

Deno.serve(async (req) => {
  const base44 = createClientFromRequest(req);
  const user = await base44.auth.me();
  if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

  const role = normaliseRole(user.role);
  if (!['manager', 'admin'].includes(role)) {
    return Response.json({ error: 'Forbidden: Manager or Admin role required.' }, { status: 403 });
  }

  const { amendment_id, approval_notes } = await req.json();
  if (!amendment_id) return Response.json({ error: 'amendment_id is required.' }, { status: 400 });

  const amendments = await base44.asServiceRole.entities.StockOutAmendment.filter({ id: amendment_id });
  const amendment = amendments[0];
  if (!amendment) return Response.json({ error: 'Amendment not found.' }, { status: 404 });

  if (amendment.request_status !== 'PENDING') {
    return Response.json({
      error: `Cannot approve amendment in status: ${amendment.request_status}`,
    }, { status: 409 });
  }

  const records = await base44.asServiceRole.entities.StockOutRecord.filter({ id: amendment.record_id });
  const record = records[0];
  if (!record) return Response.json({ error: 'Original record not found.' }, { status: 404 });

  // Get item for stock guards
  const items = await base44.asServiceRole.entities.InventoryItem.filter({ id: record.item_id });
  const item = items[0];
  if (!item) return Response.json({ error: 'InventoryItem not found.' }, { status: 404 });

  const configs = await base44.asServiceRole.entities.SystemConfiguration.filter({ environment: record.environment || 'LIVE' });
  const config = configs[0];
  const allowNegative = config?.inventory_rules?.allow_negative_stock ?? false;

  const now = new Date().toISOString();
  const afterSnapshot = amendment.after_snapshot;
  let adjustmentMovement = null;

  // If quantity changed, post delta movement with CORRECT direction
  if (amendment.quantity_delta !== 0 && amendment.requires_adjustment_posting) {
    const isIncrease = amendment.quantity_delta > 0;
    const deltaQty = Math.abs(amendment.quantity_delta);

    const recentMovements = await base44.asServiceRole.entities.StockMovement.filter(
      { item_id: record.item_id, environment: record.environment || 'LIVE', status: 'POSTED' },
      '-created_date', 1
    );
    const balanceBefore = recentMovements[0] ? recentMovements[0].balance_after : (item.stock || 0);
    
    // Correct direction logic:
    // Increase (qty goes up) = OUT (remove more)
    // Decrease (qty goes down) = IN (restore)
    const balanceAfter = isIncrease ? (balanceBefore - deltaQty) : (balanceBefore + deltaQty);
    const direction = isIncrease ? 'OUT' : 'IN';

    // Guard: Block if insufficient stock for increase
    if (isIncrease && balanceAfter < 0 && !allowNegative) {
      return Response.json({
        error: `Insufficient stock for amendment increase. Current: ${balanceBefore}, Additional remove: ${deltaQty}, Projected: ${balanceAfter}`,
        current_stock: balanceBefore,
        additional_removal: deltaQty,
        projected_stock: balanceAfter,
      }, { status: 409 });
    }

    adjustmentMovement = await base44.asServiceRole.entities.StockMovement.create({
      site_id: record.site_id || '',
      item_id: record.item_id,
      sku: record.sku,
      item_name: record.item_name,
      movement_type: 'ADJUST',
      direction,
      qty: deltaQty,
      balance_before: balanceBefore,
      balance_after: balanceAfter,
      source_ref: `AMEND-${record.id.slice(-6)}`,
      source_type: 'MANUAL',
      notes: `Amendment approved: ${amendment.amendment_reason}. Delta: ${amendment.quantity_delta > 0 ? '+' : ''}${amendment.quantity_delta} units.`,
      status: 'POSTED',
      posted_by: user.email || user.id,
      actor_role: role,
      environment: record.environment || 'LIVE',
    });

    // Update InventoryItem stock
    await base44.asServiceRole.entities.InventoryItem.update(record.item_id, {
      stock: balanceAfter,
    });
  }

  // Approve amendment
  const updatedAmendment = await base44.asServiceRole.entities.StockOutAmendment.update(amendment_id, {
    request_status: 'APPROVED',
    approved_by: user.id || user.email,
    approved_at: now,
    adjustment_movement_id: adjustmentMovement?.id || null,
  });

  // Update original record with new data and status
  const newEstimatedValue = (afterSnapshot.quantity || record.quantity) * (record.estimated_value / record.quantity || 0);
  const updatedRecord = await base44.asServiceRole.entities.StockOutRecord.update(amendment.record_id, {
    status: 'AMENDED',
    sku: afterSnapshot.sku || record.sku,
    quantity: afterSnapshot.quantity || record.quantity,
    reason_category: afterSnapshot.reason_category || record.reason_category,
    stock_out_class: afterSnapshot.stock_out_class || record.stock_out_class,
    location: afterSnapshot.location || record.location,
    department: afterSnapshot.department || record.department,
    estimated_value: newEstimatedValue,
  });

  await base44.asServiceRole.entities.AuditLog.create({
    item_id: record.item_id,
    sku: record.sku,
    item_name: record.item_name,
    change_type: 'STOCK_ADJUST',
    field_name: 'stock_out_amendment_approved',
    old_value: JSON.stringify(amendment.before_snapshot),
    new_value: JSON.stringify(afterSnapshot),
    changed_by: user.email || user.id,
    actor_role: role,
    source_module: 'Wastage',
    action_type: 'AMENDMENT_APPROVED',
    linked_movement_id: adjustmentMovement?.id || null,
    linked_source_record: amendment.record_id,
    source_record_id: amendment_id,
    notes: `Amendment approved. ${amendment.amendment_reason}. Delta: ${amendment.quantity_delta > 0 ? '+' : ''}${amendment.quantity_delta} units. Stock updated. ${approval_notes || ''}`,
    environment: record.environment || 'LIVE',
  });

  return Response.json({
    success: true,
    amendment: updatedAmendment,
    record: updatedRecord,
    adjustment_movement: adjustmentMovement,
  });
});