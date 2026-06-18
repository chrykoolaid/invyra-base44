import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

/**
 * rejectStockOutAmendment
 * Rejects a PENDING amendment. Does NOT modify the original StockOutRecord.
 */

Deno.serve(async (req) => {
  const base44 = createClientFromRequest(req);
  const user = await base44.auth.me();
  if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

  const role = (user.role || '').toLowerCase();
  const isManager = ['manager', 'admin', 'owner'].includes(role);
  if (!isManager) {
    return Response.json({ error: 'Forbidden: Manager required' }, { status: 403 });
  }

  const { amendment_id, rejection_reason } = await req.json();
  if (!amendment_id || !rejection_reason) {
    return Response.json({ error: 'amendment_id and rejection_reason required' }, { status: 400 });
  }

  const amendments = await base44.asServiceRole.entities.StockOutAmendment.filter({ id: amendment_id });
  const amendment = amendments[0];
  if (!amendment) return Response.json({ error: 'Amendment not found' }, { status: 404 });
  if (amendment.request_status !== 'PENDING') {
    return Response.json({ error: `Only PENDING amendments can be rejected. Current: ${amendment.request_status}` }, { status: 409 });
  }

  const now = new Date().toISOString();
  await base44.asServiceRole.entities.StockOutAmendment.update(amendment_id, {
    request_status: 'REJECTED',
    rejected_by: user.id || user.email,
    rejected_at: now,
    rejection_reason,
  });

  await base44.asServiceRole.entities.AuditLog.create({
    item_id: amendment.before_snapshot?.item_id || '',
    sku: amendment.before_snapshot?.sku || '',
    item_name: amendment.before_snapshot?.item_name || '',
    change_type: 'STOCK_WASTE',
    field_name: 'amendment_status',
    old_value: 'PENDING',
    new_value: 'REJECTED',
    changed_by: user.email || user.id,
    actor_role: role,
    source_module: 'StockOut',
    action_type: 'AMENDMENT_REJECTED',
    linked_source_record: amendment_id,
    source_record_id: amendment_id,
    notes: `Amendment rejected: ${rejection_reason}`,
    environment: amendment.environment || 'LIVE',
  });

  return Response.json({ success: true, amendment_id, status: 'REJECTED' });
});