import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

/**
 * markReadyForDisposition
 * Final pre-disposition gate.
 * Transitions ReviewQueue: Supervisor_Ack or Manager_Auth → Ready_For_Disposition
 *
 * Rules:
 * - If variance_percent < threshold_manager: Supervisor_Ack → Ready_For_Disposition (Supervisor OK)
 * - If variance_percent >= threshold_manager: Manager_Auth required first, then → Ready_For_Disposition
 * - Role: Supervisor, Manager, or Admin
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

  const { review_queue_id, ready_notes } = await req.json();
  if (!review_queue_id) return Response.json({ error: 'review_queue_id is required.' }, { status: 400 });

  const queues = await base44.asServiceRole.entities.MarkdownReviewQueue.filter({ id: review_queue_id });
  const entry = queues[0];
  if (!entry) return Response.json({ error: 'Review queue entry not found.' }, { status: 404 });

  const allowedFromStatuses = ['Supervisor_Ack', 'Manager_Auth'];
  if (!allowedFromStatuses.includes(entry.status)) {
    return Response.json({
      error: `Cannot mark ready — current status is ${entry.status}. Allowed from: ${allowedFromStatuses.join(', ')}.`
    }, { status: 409 });
  }

  // Fetch batch settings to check if Manager_Auth is still required
  const batches = await base44.asServiceRole.entities.MarkdownBatch.filter({ id: entry.batch_id });
  const batch = batches[0];
  const settings = batch?.settings_snapshot || {};
  const mgrThreshold = settings.variance_threshold_manager || 0.10;
  const varianceFraction = (entry.variance_percent || 0) / 100;

  // If variance requires manager and entry hasn't been manager-authorized yet, block Supervisor
  if (varianceFraction >= mgrThreshold && entry.status === 'Supervisor_Ack' && !['manager', 'admin'].includes(role)) {
    return Response.json({
      error: `Variance ${entry.variance_percent?.toFixed(1)}% meets Manager threshold (${(mgrThreshold * 100).toFixed(0)}%). Manager authorization required before marking Ready.`
    }, { status: 403 });
  }

  const now = new Date().toISOString();
  const updated = await base44.asServiceRole.entities.MarkdownReviewQueue.update(review_queue_id, {
    status: 'Ready_For_Disposition',
    investigation_notes: ready_notes
      ? (entry.investigation_notes ? `${entry.investigation_notes}\n[READY] ${ready_notes}` : ready_notes)
      : entry.investigation_notes,
  });

  await base44.asServiceRole.entities.MarkdownEventLog.create({
    batch_id: entry.batch_id,
    event_type: 'VARIANCE_RECORDED',
    user_id: user.id || user.email,
    user_role: role,
    payload: {
      before: { review_status: entry.status },
      after: { review_status: 'Ready_For_Disposition' },
      meta: { ready_notes: ready_notes || '', variance_percent: entry.variance_percent }
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
      old_value: entry.status,
      new_value: 'Ready_For_Disposition',
      changed_by: user.email || user.id,
      actor_role: role,
      source_module: 'Markdown',
      action_type: 'READY_FOR_DISPOSITION',
      linked_source_record: review_queue_id,
      source_record_id: review_queue_id,
      notes: ready_notes || 'Marked ready for disposition.',
      environment: entry.environment || 'LIVE',
    });
  }

  return Response.json({ success: true, review_queue: updated });
});