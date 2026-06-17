import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

/**
 * approveMarkdownBatch
 * Supervisor/Manager approves a Pending_Approval batch, transitioning it to Active.
 * Staff are blocked from calling this endpoint.
 */
Deno.serve(async (req) => {
  const base44 = createClientFromRequest(req);
  const user = await base44.auth.me();
  if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

  const isPrivileged = ['supervisor', 'manager', 'admin'].includes(user.role);
  if (!isPrivileged) return Response.json({ error: 'Forbidden: Supervisor or Manager role required.' }, { status: 403 });

  const { batch_id, approval_notes } = await req.json();
  if (!batch_id) return Response.json({ error: 'batch_id is required.' }, { status: 400 });

  const batches = await base44.asServiceRole.entities.MarkdownBatch.filter({ id: batch_id });
  const batch = batches[0];
  if (!batch) return Response.json({ error: 'Markdown batch not found.' }, { status: 404 });
  if (batch.status !== 'Pending_Approval') {
    return Response.json({ error: `Cannot approve batch in status: ${batch.status}` }, { status: 409 });
  }

  const updated = await base44.asServiceRole.entities.MarkdownBatch.update(batch_id, {
    status: 'Active',
    approved_by: user.id || user.email,
    approved_at: new Date().toISOString(),
  });

  await base44.asServiceRole.entities.MarkdownEventLog.create({
    batch_id,
    event_type: 'MARKDOWN_APPROVED',
    user_id: user.id || user.email,
    user_role: user.role,
    payload: {
      before: { status: 'Pending_Approval' },
      after: { status: 'Active' },
      meta: { approval_notes: approval_notes || '' }
    },
    created_at: new Date().toISOString(),
    environment: batch.environment || 'LIVE',
  });

  await base44.asServiceRole.entities.AuditLog.create({
    item_id: batch.item_id,
    sku: batch.sku,
    item_name: batch.item_name,
    change_type: 'ITEM_UPDATE',
    field_name: 'markdown_batch_status',
    old_value: 'Pending_Approval',
    new_value: 'Active',
    changed_by: user.email || user.id,
    actor_role: user.role,
    source_module: 'Markdown',
    action_type: 'MARKDOWN_APPROVED',
    linked_source_record: batch_id,
    source_record_id: batch_id,
    notes: approval_notes || 'Batch approved and activated.',
    environment: batch.environment || 'LIVE',
  });

  return Response.json({ success: true, batch: updated });
});