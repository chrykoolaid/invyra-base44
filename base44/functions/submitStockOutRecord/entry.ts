import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

/**
 * submitStockOutRecord
 * Transitions a DRAFT StockOutRecord to SUBMITTED status.
 * Does NOT post stock movement. That happens on approval.
 */

Deno.serve(async (req) => {
  const base44 = createClientFromRequest(req);
  const user = await base44.auth.me();
  if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

  const { record_id } = await req.json();
  if (!record_id) return Response.json({ error: 'record_id required' }, { status: 400 });

  const records = await base44.asServiceRole.entities.StockOutRecord.filter({ id: record_id });
  const record = records[0];
  if (!record) return Response.json({ error: 'Record not found' }, { status: 404 });
  if (record.status !== 'DRAFT') {
    return Response.json({ error: `Only DRAFT records can be submitted. Current: ${record.status}` }, { status: 409 });
  }

  const role = (user.role || '').toLowerCase().trim();
  const actorIds = [user.id, user.email].filter(Boolean);
  const createdByMatches = actorIds.includes(record.created_by) || actorIds.includes(record.created_by_email);
  if (role === 'staff' && !createdByMatches) {
    await base44.asServiceRole.entities.AuditLog.create({
      item_id: record.item_id,
      sku: record.sku,
      item_name: record.item_name,
      change_type: 'ENVIRONMENT_BLOCKED',
      field_name: 'status',
      old_value: record.status,
      new_value: record.status,
      changed_by: user.email || user.id,
      actor_role: role,
      source_module: 'StockOut',
      action_type: 'STOCK_OUT_SUBMIT_BLOCKED_NOT_OWNER',
      linked_source_record: record_id,
      source_record_id: record_id,
      notes: 'Staff attempted to submit a draft created by another user.',
      environment: record.environment || 'LIVE',
    });
    return Response.json({ error: 'Staff can only submit stock-out drafts they created.' }, { status: 403 });
  }

  const now = new Date().toISOString();
  await base44.asServiceRole.entities.StockOutRecord.update(record_id, {
    status: 'SUBMITTED',
    submitted_by: user.id || user.email,
    submitted_at: now,
  });

  await base44.asServiceRole.entities.AuditLog.create({
    item_id: record.item_id,
    sku: record.sku,
    item_name: record.item_name,
    change_type: 'STOCK_WASTE',
    field_name: 'status',
    old_value: 'DRAFT',
    new_value: 'SUBMITTED',
    changed_by: user.email || user.id,
    actor_role: user.role || 'unknown',
    source_module: 'StockOut',
    action_type: 'SUBMITTED',
    linked_source_record: record_id,
    source_record_id: record_id,
    notes: `Record submitted for approval`,
    environment: record.environment || 'LIVE',
  });

  return Response.json({ success: true, record_id, status: 'SUBMITTED' });
});