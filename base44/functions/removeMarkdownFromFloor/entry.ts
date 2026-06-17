import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

/**
 * removeMarkdownFromFloor
 * Transitions an Active batch to Review_Queue.
 * Captures the physical floor count, computes variance, sets SLA deadlines.
 * Does NOT post any StockMovement — disposition is human-confirmed separately.
 */
Deno.serve(async (req) => {
  const base44 = createClientFromRequest(req);
  const user = await base44.auth.me();
  if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

  const {
    batch_id,
    actual_floor_count,
    removal_notes,
    device_id,
  } = await req.json();

  if (!batch_id || actual_floor_count === undefined || actual_floor_count === null) {
    return Response.json({ error: 'batch_id and actual_floor_count are required.' }, { status: 400 });
  }

  const batches = await base44.asServiceRole.entities.MarkdownBatch.filter({ id: batch_id });
  const batch = batches[0];
  if (!batch) return Response.json({ error: 'Batch not found.' }, { status: 404 });
  if (batch.status !== 'Active') return Response.json({ error: `Cannot remove batch from floor — status is ${batch.status}` }, { status: 409 });

  const settings = batch.settings_snapshot || {};
  const warningHours = settings.review_warning_hours || 24;
  const escalationHours = settings.review_escalation_hours || 72;
  const criticalHours = settings.review_critical_hours || 96;

  const now = new Date();
  const variance_qty = batch.current_remaining_qty - actual_floor_count;
  const variance_percent = batch.current_remaining_qty > 0
    ? Math.abs(variance_qty) / batch.current_remaining_qty
    : 0;

  const deadline_warning_at = new Date(now.getTime() + warningHours * 3600000).toISOString();
  const deadline_escalation_at = new Date(now.getTime() + escalationHours * 3600000).toISOString();
  const deadline_critical_at = new Date(now.getTime() + criticalHours * 3600000).toISOString();

  // Determine initial review status based on variance thresholds
  const supThreshold = settings.variance_threshold_supervisor || 0.05;
  const mgrThreshold = settings.variance_threshold_manager || 0.10;
  let initialReviewStatus = 'Pending_Investigation';
  if (variance_percent <= supThreshold) initialReviewStatus = 'Supervisor_Ack';

  // Update batch status
  await base44.asServiceRole.entities.MarkdownBatch.update(batch_id, {
    status: 'Review_Queue',
    removed_from_floor_qty: actual_floor_count,
    current_remaining_qty: actual_floor_count,
  });

  // Create Review Queue entry
  const reviewEntry = await base44.asServiceRole.entities.MarkdownReviewQueue.create({
    batch_id,
    status: initialReviewStatus,
    entered_review_at: now.toISOString(),
    expected_remaining_qty: batch.current_remaining_qty,
    actual_floor_count,
    variance_qty,
    variance_percent: Math.round(variance_percent * 10000) / 100,
    last_floor_count_at: now.toISOString(),
    deadline_warning_at,
    deadline_escalation_at,
    deadline_critical_at,
    investigation_notes: removal_notes || '',
    environment: batch.environment || 'LIVE',
  });

  await base44.asServiceRole.entities.MarkdownEventLog.create({
    batch_id,
    event_type: 'REMOVED_FROM_DISPLAY',
    user_id: user.id || user.email,
    user_role: user.role,
    device_id: device_id || '',
    payload: {
      before: { status: 'Active', remaining_qty: batch.current_remaining_qty },
      after: { status: 'Review_Queue', actual_floor_count, variance_qty, variance_percent },
      meta: { review_queue_id: reviewEntry.id, initial_review_status: initialReviewStatus }
    },
    created_at: now.toISOString(),
    environment: batch.environment || 'LIVE',
  });

  await base44.asServiceRole.entities.MarkdownEventLog.create({
    batch_id,
    event_type: 'VARIANCE_RECORDED',
    user_id: user.id || user.email,
    user_role: user.role,
    device_id: device_id || '',
    payload: {
      expected: batch.current_remaining_qty,
      actual: actual_floor_count,
      variance_qty,
      variance_percent: Math.round(variance_percent * 10000) / 100,
      requires_manager: variance_percent >= mgrThreshold,
    },
    created_at: now.toISOString(),
    environment: batch.environment || 'LIVE',
  });

  await base44.asServiceRole.entities.AuditLog.create({
    item_id: batch.item_id,
    sku: batch.sku,
    item_name: batch.item_name,
    change_type: 'STOCK_ADJUST',
    field_name: 'markdown_batch_status',
    old_value: 'Active',
    new_value: 'Review_Queue',
    changed_by: user.email || user.id,
    actor_role: user.role,
    source_module: 'Markdown',
    action_type: 'REMOVED_FROM_DISPLAY',
    linked_source_record: batch_id,
    source_record_id: reviewEntry.id,
    notes: `Floor count: ${actual_floor_count}. Expected: ${batch.current_remaining_qty}. Variance: ${variance_qty} (${Math.round(variance_percent * 10000) / 100}%).`,
    environment: batch.environment || 'LIVE',
  });

  return Response.json({
    success: true,
    review_queue_entry: reviewEntry,
    variance_qty,
    variance_percent: Math.round(variance_percent * 10000) / 100,
    requires_manager_auth: variance_percent >= mgrThreshold,
  });
});