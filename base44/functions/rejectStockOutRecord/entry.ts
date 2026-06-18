import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

/**
 * rejectStockOutRecord
 * Rejects a SUBMITTED record. No stock movement posted.
 */

Deno.serve(async (req) => {
  const base44 = createClientFromRequest(req);
  const user = await base44.auth.me();
  if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

  const role = (user.role || '').toLowerCase();
  const isSupervisorPlus = ['supervisor', 'manager', 'admin', 'owner'].includes(role);
  if (!isSupervisorPlus) {
    return Response.json({ error: 'Forbidden' }, { status: 403 });
  }

  const { record_id, reason } = await req.json();
  if (!record_id || !reason) return Response.json({ error: 'record_id and reason required' }, { status: 400 });

  const records = await base44.asServiceRole.entities.StockOutRecord.filter({ id: record_id });
  const record = records[0];
  if (!record) return Response.json({ error: 'Record not found' }, { status: 404 });
  if (record.status !== 'SUBMITTED') {
    return Response.json({ error: `Only SUBMITTED records can be rejected. Current: ${record.status}` }, { status: 409 });
  }

  const now = new Date().toISOString();
  await base44.asServiceRole.entities.StockOutRecord.update(record_id, {
    status: 'REJECTED',
    rejected_by: user.id || user.email,
    rejected_at: now,
    rejected_reason: reason,
  });

  await base44.asServiceRole.entities.AuditLog.create({
    item_id: record.item_id,
    sku: record.sku,
    item_name: record.item_name,
    change_type: 'STOCK_WASTE',
    field_name: 'status',
    old_value: 'SUBMITTED',
    new_value: 'REJECTED',
    changed_by: user.email || user.id,
    actor_role: role,
    source_module: 'StockOut',
    action_type: 'REJECTED',
    linked_source_record: record_id,
    source_record_id: record_id,
    notes: `Rejected: ${reason}`,
    environment: record.environment || 'LIVE',
  });

  return Response.json({ success: true, record_id, status: 'REJECTED' });
});