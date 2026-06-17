import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

/**
 * acknowledgeReviewVariance
 * Supervisor acknowledgement step for Review Queue entries in Pending_Investigation.
 * Transitions ReviewQueue: Pending_Investigation → Supervisor_Ack
 * Role: Supervisor, Manager, or Admin
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
    return Response.json({ error: 'Forbidden: Supervisor or above required.' }, { status: 403 });
  }

  const { review_queue_id, investigation_notes } = await req.json();
  if (!review_queue_id) return Response.json({ error: 'review_queue_id is required.' }, { status: 400 });

  const queues = await base44.asServiceRole.entities.MarkdownReviewQueue.filter({ id: review_queue_id });
  const entry = queues[0];
  if (!entry) return Response.json({ error: 'Review queue entry not found.' }, { status: 404 });

  if (!['Pending_Investigation'].includes(entry.status)) {
    return Response.json({ error: `Cannot acknowledge — current status is ${entry.status}. Expected: Pending_Investigation.` }, { status: 409 });
  }

  const now = new Date().toISOString();
  const updated = await base44.asServiceRole.entities.MarkdownReviewQueue.update(review_queue_id, {
    status: 'Supervisor_Ack',
    supervisor_ack_by: user.id || user.email,
    supervisor_ack_at: now,
    investigation_notes: investigation_notes || entry.investigation_notes || '',
  });

  const batches = await base44.asServiceRole.entities.MarkdownBatch.filter({ id: entry.batch_id });
  const batch = batches[0];

  await base44.asServiceRole.entities.MarkdownEventLog.create({
    batch_id: entry.batch_id,
    event_type: 'VARIANCE_RECORDED',
    user_id: user.id || user.email,
    user_role: role,
    payload: {
      before: { review_status: 'Pending_Investigation' },
      after: { review_status: 'Supervisor_Ack' },
      meta: { investigation_notes: investigation_notes || '' }
    },
    created_at: now,
    environment: entry.environment || 'LIVE',
  });

  if (batch) {
    await base44.asServiceRole.entities.AuditLog.create({
      item_id: batch.item_id,
      sku: batch.sku,
      item_name: batch.item_name,
      change_type: 'ITEM_UPDATE',
      field_name: 'review_queue_status',
      old_value: 'Pending_Investigation',
      new_value: 'Supervisor_Ack',
      changed_by: user.email || user.id,
      actor_role: role,
      source_module: 'Markdown',
      action_type: 'SUPERVISOR_ACK',
      linked_source_record: review_queue_id,
      source_record_id: review_queue_id,
      notes: investigation_notes || 'Supervisor acknowledged variance.',
      environment: entry.environment || 'LIVE',
    });
  }

  return Response.json({ success: true, review_queue: updated });
});