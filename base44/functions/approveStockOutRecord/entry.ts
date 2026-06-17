import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

/**
 * approveStockOutRecord
 * Supervisor/Manager approves a SUBMITTED record and posts the stock movement.
 * Creates StockMovement and transitions record to APPROVED → POSTED.
 */

function normaliseRole(role) {
  return (role || '').toLowerCase().trim();
}

Deno.serve(async (req) => {
  const base44 = createClientFromRequest(req);
  const user = await base44.auth.me();
  if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

  const role = normaliseRole(user.role);
  if (!['supervisor', 'manager', 'admin'].includes(role)) {
    return Response.json({ error: 'Forbidden: Supervisor or Manager role required.' }, { status: 403 });
  }

  const { record_id } = await req.json();
  if (!record_id) return Response.json({ error: 'record_id is required.' }, { status: 400 });

  const records = await base44.asServiceRole.entities.StockOutRecord.filter({ id: record_id });
  const record = records[0];
  if (!record) return Response.json({ error: 'Record not found.' }, { status: 404 });

  if (record.status !== 'SUBMITTED') {
    return Response.json({ error: `Cannot approve record in status: ${record.status}` }, { status: 409 });
  }

  const now = new Date().toISOString();

  // Fetch last movement for balance
  const recentMovements = await base44.asServiceRole.entities.StockMovement.filter(
    { item_id: record.item_id, environment: record.environment || 'LIVE', status: 'POSTED' },
    '-created_date', 1
  );
  const balanceBefore = recentMovements[0] ? recentMovements[0].balance_after : 0;
  const balanceAfter = Math.max(0, balanceBefore - record.quantity);

  // Post stock movement
  const movement = await base44.asServiceRole.entities.StockMovement.create({
    site_id: record.site_id || '',
    item_id: record.item_id,
    sku: record.sku,
    item_name: record.item_name,
    movement_type: record.stock_out_class === 'STORE_USE' ? 'ADJUST' : 'WASTE',
    direction: 'OUT',
    qty: record.quantity,
    balance_before: balanceBefore,
    balance_after: balanceAfter,
    source_ref: `STOCK-OUT-${record.id.slice(-6)}`,
    source_type: 'MANUAL',
    notes: `${record.stock_out_class}: ${record.reason_category}. ${record.reason_notes || ''}`,
    status: 'POSTED',
    posted_by: user.email || user.id,
    actor_role: role,
    environment: record.environment || 'LIVE',
  });

  // Approve record and link movement
  const updated = await base44.asServiceRole.entities.StockOutRecord.update(record_id, {
    status: 'POSTED',
    approved_by: user.id || user.email,
    approved_at: now,
    posted_by: user.id || user.email,
    posted_at: now,
    linked_movement_id: movement.id,
  });

  await base44.asServiceRole.entities.AuditLog.create({
    item_id: record.item_id,
    sku: record.sku,
    item_name: record.item_name,
    change_type: record.stock_out_class === 'STORE_USE' ? 'STOCK_ADJUST' : 'STOCK_WASTE',
    field_name: 'stock_out_approval',
    old_value: 'SUBMITTED',
    new_value: 'POSTED',
    changed_by: user.email || user.id,
    actor_role: role,
    source_module: 'Wastage',
    action_type: 'STOCK_OUT_APPROVED',
    linked_movement_id: movement.id,
    linked_source_record: record_id,
    notes: `${record.stock_out_class} approved and posted. Qty: ${record.quantity}. Cost: ₱${record.estimated_value.toFixed(2)}.`,
    environment: record.environment || 'LIVE',
  });

  return Response.json({ success: true, record: updated, movement });
});