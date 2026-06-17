import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

/**
 * submitStockOutRecord
 * Transitions DRAFT record to SUBMITTED for supervisor/manager approval.
 * Still does not post stock until approval.
 */

Deno.serve(async (req) => {
  const base44 = createClientFromRequest(req);
  const user = await base44.auth.me();
  if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

  const { record_id } = await req.json();
  if (!record_id) return Response.json({ error: 'record_id is required.' }, { status: 400 });

  const records = await base44.asServiceRole.entities.StockOutRecord.filter({ id: record_id });
  const record = records[0];
  if (!record) return Response.json({ error: 'Record not found.' }, { status: 404 });

  if (record.status !== 'DRAFT') {
    return Response.json({ error: `Cannot submit record in status: ${record.status}` }, { status: 409 });
  }

  const now = new Date().toISOString();
  const updated = await base44.asServiceRole.entities.StockOutRecord.update(record_id, {
    status: 'SUBMITTED',
    submitted_by: user.id || user.email,
    submitted_at: now,
  });

  await base44.asServiceRole.entities.AuditLog.create({
    item_id: record.item_id,
    sku: record.sku,
    item_name: record.item_name,
    change_type: 'STOCK_WASTE',
    field_name: 'stock_out_status',
    old_value: 'DRAFT',
    new_value: 'SUBMITTED',
    changed_by: user.email || user.id,
    actor_role: user.role,
    source_module: 'Wastage',
    action_type: 'STOCK_OUT_SUBMITTED',
    linked_source_record: record_id,
    notes: `${record.stock_out_class} record submitted for approval.`,
    environment: record.environment || 'LIVE',
  });

  return Response.json({ success: true, record: updated });
});