import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

/**
 * processMarkdownDisposition
 * Human-confirmed disposition posting.
 * 
 * CORRECTIONS:
 * 1. Stock is updated via StockMovement balance_after only — no direct InventoryItem.stock mutation.
 *    The StockMovement ledger is the source of truth; UI/reports read from it.
 * 2. Batch/ReviewQueue only reach Disposition_Complete when total confirmed
 *    disposition qty >= review entry's actual_floor_count (split disposition support).
 * 3. Recover outcome is handled here: updates recovered_qty, sets batch back to
 *    Recovered state, creates RECOVERY_COMPLETED event, posts NO waste movement.
 * 4. Role enforced server-side: Supervisor/Manager/Admin only.
 */
Deno.serve(async (req) => {
  const base44 = createClientFromRequest(req);
  const user = await base44.auth.me();
  if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

  const isPrivileged = ['supervisor', 'manager', 'admin'].includes(user.role);
  if (!isPrivileged) {
    return Response.json({ error: 'Forbidden: Supervisor or Manager required to confirm dispositions.' }, { status: 403 });
  }

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
  if (!['Ready_For_Disposition', 'Manager_Auth', 'Supervisor_Ack', 'Pending_Investigation'].includes(reviewEntry.status)) {
    return Response.json({ error: `Review queue not ready for disposition. Status: ${reviewEntry.status}` }, { status: 409 });
  }

  const batches = await base44.asServiceRole.entities.MarkdownBatch.filter({ id: reviewEntry.batch_id });
  const batch = batches[0];
  if (!batch) return Response.json({ error: 'Batch not found.' }, { status: 404 });

  // Validate qty does not exceed what is available for disposition
  const totalAvailable = reviewEntry.actual_floor_count ?? reviewEntry.expected_remaining_qty ?? 0;
  const existingDispositions = await base44.asServiceRole.entities.MarkdownDisposition.filter({
    review_queue_id,
  });
  const alreadyConfirmedQty = existingDispositions
    .filter(d => d.disposition_status === 'Confirmed')
    .reduce((s, d) => s + (d.qty || 0), 0);
  const remainingToDispose = totalAvailable - alreadyConfirmedQty;

  if (qty > remainingToDispose) {
    return Response.json({
      error: `Quantity ${qty} exceeds remaining disposable qty ${remainingToDispose} (total: ${totalAvailable}, already confirmed: ${alreadyConfirmedQty}).`
    }, { status: 409 });
  }

  const now = new Date().toISOString();

  // Read item for cost only — no direct stock mutation
  const items = await base44.asServiceRole.entities.InventoryItem.filter({ id: batch.item_id });
  const item = items[0];
  const costPerUnit = item ? (item.cost_per_unit || 0) : 0;
  const costImpact = qty * costPerUnit;

  // Create disposition record
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

  let stockMovement = null;
  let eventType = 'DISPOSITION_CONFIRMED';

  if (outcome_type === 'Recover') {
    // RECOVERY: No waste movement. Update recovered_qty, restore batch to Recovered state.
    const newRecoveredQty = (batch.recovered_qty || 0) + qty;
    await base44.asServiceRole.entities.MarkdownBatch.update(reviewEntry.batch_id, {
      recovered_qty: newRecoveredQty,
      current_remaining_qty: qty, // qty re-enters live inventory
    });
    eventType = 'RECOVERY_COMPLETED';
  } else {
    // All non-recovery outcomes: post StockMovement (ledger source of truth).
    // Do NOT mutate InventoryItem.stock directly.
    const movementType = ['Return_To_Supplier', 'Transfer'].includes(outcome_type) ? 'ADJUST' : 'WASTE';

    // Read latest balance from most recent StockMovement for this item
    const recentMovements = await base44.asServiceRole.entities.StockMovement.filter(
      { item_id: batch.item_id, environment: batch.environment || 'LIVE', status: 'POSTED' },
      '-created_date',
      1
    );
    const balanceBefore = recentMovements[0] ? recentMovements[0].balance_after : (item ? (item.stock || 0) : 0);
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
      source_ref: `DISP-${batch.batch_ref || batch.id.slice(-6)}`,
      source_type: 'MANUAL',
      notes: `Markdown disposition: ${outcome_type}. ${disposition_notes || ''}`,
      status: 'POSTED',
      posted_by: user.email || user.id,
      actor_role: user.role,
      environment: batch.environment || 'LIVE',
    });

    await base44.asServiceRole.entities.MarkdownBatch.update(reviewEntry.batch_id, {
      disposed_qty: (batch.disposed_qty || 0) + qty,
    });
  }

  // Confirm the disposition record
  await base44.asServiceRole.entities.MarkdownDisposition.update(disposition.id, {
    disposition_status: 'Confirmed',
    confirmed_at: now,
    confirmed_by: user.id || user.email,
    linked_movement_id: stockMovement ? stockMovement.id : null,
  });

  // Re-check total confirmed qty to determine if all disposition is complete
  const refreshedDispositions = await base44.asServiceRole.entities.MarkdownDisposition.filter({ review_queue_id });
  const totalConfirmedQty = refreshedDispositions
    .filter(d => d.disposition_status === 'Confirmed')
    .reduce((s, d) => s + (d.qty || 0), 0);

  const isFullyDisposed = totalConfirmedQty >= totalAvailable;

  if (isFullyDisposed) {
    const finalBatchStatus = outcome_type === 'Recover' ? 'Recovered' : 'Disposition_Complete';
    await base44.asServiceRole.entities.MarkdownBatch.update(reviewEntry.batch_id, {
      status: finalBatchStatus,
    });
    await base44.asServiceRole.entities.MarkdownReviewQueue.update(review_queue_id, {
      status: outcome_type === 'Recover' ? 'Recovered' : 'Disposition_Complete',
    });
  }

  // Event log
  await base44.asServiceRole.entities.MarkdownEventLog.create({
    batch_id: reviewEntry.batch_id,
    event_type: eventType,
    user_id: user.id || user.email,
    user_role: user.role,
    payload: {
      before: { batch_status: batch.status },
      after: { outcome_type, qty, disposition_status: 'Confirmed', is_fully_disposed: isFullyDisposed },
      meta: {
        cost_impact: costImpact,
        linked_movement_id: stockMovement ? stockMovement.id : null,
        total_confirmed_qty: totalConfirmedQty,
        total_available: totalAvailable,
      }
    },
    created_at: now,
    environment: batch.environment || 'LIVE',
  });

  await base44.asServiceRole.entities.AuditLog.create({
    item_id: batch.item_id,
    sku: batch.sku,
    item_name: batch.item_name,
    change_type: outcome_type === 'Recover' ? 'STOCK_ADJUST' : 'STOCK_WASTE',
    field_name: 'markdown_disposition',
    old_value: JSON.stringify({ status: batch.status, disposed_qty: batch.disposed_qty || 0 }),
    new_value: JSON.stringify({ outcome_type, qty, cost_impact: costImpact, total_confirmed: totalConfirmedQty }),
    changed_by: user.email || user.id,
    actor_role: user.role,
    source_module: 'Markdown',
    action_type: eventType,
    linked_source_record: disposition.id,
    source_record_id: stockMovement ? stockMovement.id : disposition.id,
    notes: `${outcome_type} disposition confirmed: ${qty} units. Cost impact: ₱${costImpact.toFixed(2)}. Fully disposed: ${isFullyDisposed}.`,
    environment: batch.environment || 'LIVE',
  });

  return Response.json({
    success: true,
    disposition_id: disposition.id,
    linked_movement_id: stockMovement ? stockMovement.id : null,
    cost_impact: costImpact,
    total_confirmed_qty: totalConfirmedQty,
    is_fully_disposed: isFullyDisposed,
  });
});