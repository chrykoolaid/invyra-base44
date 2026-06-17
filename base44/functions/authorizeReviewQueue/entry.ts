import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

/**
 * authorizeReviewQueue
 * Manager authorization step for Review Queue entries in Supervisor_Ack.
 * Required when variance_percent >= variance_threshold_manager (default 10%).
 * Transitions ReviewQueue: Supervisor_Ack → Manager_Auth
 * Role: Manager or Admin only
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
    return Response.json({ error: 'Forbidden: Manager or Admin required to authorize Review Queue.' }, { status: 403 });
  }

  const { review_queue_id, authorization_notes } = await req.json();
  if (!review_queue_id) return Response.json({ error: 'review_queue_id is required.' }, { status: 400 });

  const queues = await base44.asServiceRole.entities.MarkdownReviewQueue.filter({ id: review_queue_id });
  const entry = queues[0];
  if (!entry) return Response.json({ error: 'Review queue entry not found.' }, { status: 404 });

  if (entry.status !== 'Supervisor_Ack') {
    return Response.json({ error: `Cannot authorize — current status is ${entry.status}. Expected: Supervisor_Ack.` }, { status: 409 });
  }

  const now = new Date().toISOString();
  const updated = await base44.asServiceRole.entities.MarkdownReviewQueue.update(review_queue_id, {
    status: 'Manager_Auth',
    manager_auth_by: user.id || user.email,
    manager_auth_at: now,
    investigation_notes: authorization_notes
      ? (entry.investigation_notes ? `${entry.investigation_notes}\n[MANAGER AUTH] ${authorization_notes}` : authorization_notes)
      : entry.investigation_notes,
  });

  const batches = await base44.asServiceRole.entities.MarkdownBatch.filter({ id: entry.batch_id });
  const batch = batches[0];

  await base44.asServiceRole.entities.MarkdownEventLog.create({
    batch_id: entry.batch_id,
    event_type: 'VARIANCE_RECORDED',
    user_id: user.id || user.email,
    user_role: role,
    payload: {
      before: { review_status: 'Supervisor_Ack' },
      after: { review_status: 'Manager_Auth' },
      meta: { authorization_notes: authorization_notes || '' }
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
      old_value: 'Supervisor_Ack',
      new_value: 'Manager_Auth',
      changed_by: user.email || user.id,
      actor_role: role,
      source_module: 'Markdown',
      action_type: 'MANAGER_AUTH',
      linked_source_record: review_queue_id,
      source_record_id: review_queue_id,
      notes: authorization_notes || 'Manager authorized Review Queue for disposition.',
      environment: entry.environment || 'LIVE',
    });
  }

  return Response.json({ success: true, review_queue: updated });
});