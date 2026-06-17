import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

/**
 * processMarkdownDisposition
 * Human-confirmed disposition posting.
 * ONLY posts StockMovement when disposition_status is explicitly Confirmed by authorized user.
 * No automatic waste/disposal — guardrail enforced here.
 *
 * Supports split disposition: multiple MarkdownDisposition records per Review Queue entry.
 */
Deno.serve(async (req) => {
  const base44 = createClientFromRequest(req);
  const user = await base44.auth.me();
  if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

  const isPrivileged = ['supervisor', 'manager', 'admin'].includes(user.role);
  if (!isPrivileged) return Response.json({ error: 'Forbidden: Supervisor or Manager required to confirm dispositions.' }, { status: 403 });

  const {
    review_queue_id,
    outcome_type,
    qty,
    disposition_reason_code,
    disposition_notes,
    destination_ref,
    site_id,
  } = await req.json();

  if (!review_queue_id || !outcome_type || !qty || qty <= 0) {
    return Response.json({ error: 'review_queue_id, outcome_type, and qty are required.' }, { status: 400 });
  }

  const validOutcomes = ['Waste', 'Store_Use', 'Donate', 'Return_To_Supplier', 'Transfer', 'Recover'];
  if (!validOutcomes.includes(outcome_type)) {
    return Response.json({ error: `Invalid outcome_type. Must be one of: ${validOutcomes.join(', ')}` }, { status: 400 });
  }

  const queues = await base44.asServiceRole.entities.MarkdownReviewQueue.filter({ id: review_queue_id });
  const reviewEntry = queues[0];
  if (!reviewEntry) return Response.json({ error: 'Review queue entry not found.' }, { status: 404 });
  if (!['Ready_For_Disposition', 'Manager_Auth', 'Supervisor_Ack'].includes(reviewEntry.status)) {
    return Response.json({ error: `Review queue not ready for disposition. Status: ${reviewEntry.status}` }, { status: 409 });
  }

  const batches = await base44.asServiceRole.entities.MarkdownBatch.filter({ id: reviewEntry.batch_id });
  const batch = batches[0];
  if (!batch) return Response.json({ error: 'Batch not found.' }, { status: 404 });

  const now = new Date().toISOString();

  // Calculate cost impact
  const items = await base44.asServiceRole.entities.InventoryItem.filter({ id: batch.item_id });
  const item = items[0];
  const costPerUnit = item ? (item.cost_per_unit || 0) : 0;
  const costImpact = qty * costPerUnit;

  // Create disposition record (Pending first)
  const disposition = await base44.asServiceRole.entities.MarkdownDisposition.create({
    review_queue_id,
    batch_id: reviewEntry.batch_id,
    disposition_status: 'Pending',
    outcome_type,
    disposition_reason_code: disposition_reason_code || '',
    disposition_notes: disposition_notes || '',
    qty,
    cost_impact_value: costImpact,
    destination_ref: destination_ref || '',
    authorized_by: user.id || user.email,
    authorization_role: user.role,
    environment: batch.environment || 'LIVE',
  });

  // GUARDRAIL: Only post StockMovement for non-Recovery outcomes
  // Recovery is handled by recoverMarkdownBatch function
  let stockMovement = null;
  if (outcome_type !== 'Recover') {
    const movementType = outcome_type === 'Return_To_Supplier' ? 'ADJUST' : 'WASTE';
    const balanceBefore = item ? (item.stock || 0) : 0;
    const balanceAfter = Math.max(0, balanceBefore - qty);

    stockMovement = await base44.asServiceRole.entities.StockMovement.create({
      site_id: site_id || batch.site_id || '',
      item_id: batch.item_id,
      sku: batch.sku,
      item_name: batch.item_name,
      movement_type: movementType,
      direction: 'OUT',
      qty,
      balance_before: balanceBefore,
      balance_after: balanceAfter,
      source_ref: `DISP-${batch.batch_ref}`,
      source_type: 'MANUAL',
      notes: `Markdown disposition: ${outcome_type}. ${disposition_notes || ''}`,
      status: 'POSTED',
      posted_by: user.email || user.id,
      actor_role: user.role,
      environment: batch.environment || 'LIVE',
    });

    // Update InventoryItem stock
    if (item) {
      await base44.asServiceRole.entities.InventoryItem.update(batch.item_id, {
        stock: balanceAfter,
      });
    }
  }

  // Confirm the disposition
  await base44.asServiceRole.entities.MarkdownDisposition.update(disposition.id, {
    disposition_status: 'Confirmed',
    confirmed_at: now,
    confirmed_by: user.id || user.email,
    linked_movement_id: stockMovement ? stockMovement.id : null,
  });

  // Update batch disposed_qty
  await base44.asServiceRole.entities.MarkdownBatch.update(reviewEntry.batch_id, {
    disposed_qty: (batch.disposed_qty || 0) + qty,
    status: 'Disposition_Complete',
  });

  // Update review queue to Disposition_Complete
  await base44.asServiceRole.entities.MarkdownReviewQueue.update(review_queue_id, {
    status: 'Disposition_Complete',
  });

  await base44.asServiceRole.entities.MarkdownEventLog.create({
    batch_id: reviewEntry.batch_id,
    event_type: 'DISPOSITION_CONFIRMED',
    user_id: user.id || user.email,
    user_role: user.role,
    payload: {
      before: { batch_status: 'Review_Queue' },
      after: { outcome_type, qty, disposition_status: 'Confirmed' },
      meta: { cost_impact: costImpact, linked_movement_id: stockMovement ? stockMovement.id : null }
    },
    created_at: now,
    environment: batch.environment || 'LIVE',
  });

  await base44.asServiceRole.entities.AuditLog.create({
    item_id: batch.item_id,
    sku: batch.sku,
    item_name: batch.item_name,
    change_type: 'STOCK_WASTE',
    field_name: 'markdown_disposition',
    old_value: JSON.stringify({ status: 'Review_Queue', remaining: batch.current_remaining_qty }),
    new_value: JSON.stringify({ outcome_type, qty, cost_impact: costImpact }),
    changed_by: user.email || user.id,
    actor_role: user.role,
    source_module: 'Markdown',
    action_type: 'DISPOSITION_CONFIRMED',
    linked_source_record: disposition.id,
    source_record_id: stockMovement ? stockMovement.id : '',
    notes: `${outcome_type} disposition confirmed: ${qty} units. Cost impact: ₱${costImpact.toFixed(2)}.`,
    environment: batch.environment || 'LIVE',
  });

  return Response.json({
    success: true,
    disposition_id: disposition.id,
    linked_movement_id: stockMovement ? stockMovement.id : null,
    cost_impact: costImpact,
  });
});