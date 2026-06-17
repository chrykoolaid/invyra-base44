import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

/**
 * reverseMarkdownSale
 * Reverses a confirmed markdown POS sale.
 * 
 * Actions:
 * 1. Validates the original POSLineItem exists and is a markdown sale
 * 2. Creates a reversal POSLineItem (reversal_of = original line item id)
 * 3. Posts a REVERSAL StockMovement (IN — stock returns to ledger)
 * 4. Updates MarkdownBatch counters (sold_qty--, current_remaining_qty++)
 * 5. Updates MarkdownRound qty_sold_in_round
 * 6. Recalculates sell_through_pct
 * 7. Creates SALE_REVERSED MarkdownEventLog event
 * 8. Moves quantity into Review Queue for inspection (creates/updates ReviewQueue entry)
 * 
 * Role: Supervisor/Manager/Admin only (reversals require authorization).
 */
Deno.serve(async (req) => {
  const base44 = createClientFromRequest(req);
  const user = await base44.auth.me();
  if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

  const isPrivileged = ['supervisor', 'manager', 'admin'].includes(user.role);
  if (!isPrivileged) {
    return Response.json({ error: 'Forbidden: Supervisor or Manager required to reverse a markdown sale.' }, { status: 403 });
  }

  const { line_item_id, reversal_reason, site_id } = await req.json();
  if (!line_item_id || !reversal_reason) {
    return Response.json({ error: 'line_item_id and reversal_reason are required.' }, { status: 400 });
  }

  const lineItems = await base44.asServiceRole.entities.POSLineItem.filter({ id: line_item_id });
  const original = lineItems[0];
  if (!original) return Response.json({ error: 'POSLineItem not found.' }, { status: 404 });
  if (!original.is_markdown_sale) return Response.json({ error: 'This line item is not a markdown sale.' }, { status: 400 });
  if (original.is_reversed) return Response.json({ error: 'This line item has already been reversed.' }, { status: 409 });
  if (!original.markdown_batch_id || !original.markdown_round_id) {
    return Response.json({ error: 'Line item missing markdown_batch_id or markdown_round_id.' }, { status: 400 });
  }

  const batches = await base44.asServiceRole.entities.MarkdownBatch.filter({ id: original.markdown_batch_id });
  const batch = batches[0];
  if (!batch) return Response.json({ error: 'Markdown batch not found.' }, { status: 404 });

  const rounds = await base44.asServiceRole.entities.MarkdownRound.filter({ id: original.markdown_round_id });
  const round = rounds[0];
  if (!round) return Response.json({ error: 'Markdown round not found.' }, { status: 404 });

  const now = new Date().toISOString();
  const qty = original.qty;

  // 1. Mark original line item as reversed
  await base44.asServiceRole.entities.POSLineItem.update(line_item_id, {
    is_reversed: true,
    reversed_at: now,
  });

  // 2. Create reversal line item
  const reversalLine = await base44.asServiceRole.entities.POSLineItem.create({
    pos_transaction_id: original.pos_transaction_id,
    sku: original.sku,
    item_id: original.item_id,
    item_name: original.item_name,
    qty: -qty,
    unit_price: original.unit_price,
    original_unit_price: original.original_unit_price,
    line_total: -(qty * original.unit_price),
    is_markdown_sale: true,
    markdown_batch_id: original.markdown_batch_id,
    markdown_round_id: original.markdown_round_id,
    markdown_barcode_scanned: original.markdown_barcode_scanned || '',
    pos_validation_status: 'Validated',
    reversal_of: line_item_id,
    is_reversed: false,
    site_id: site_id || original.site_id || '',
    served_by: user.id || user.email,
    environment: original.environment || 'LIVE',
  });

  // 3. Post REVERSAL StockMovement (IN — stock returns to ledger)
  const recentMovements = await base44.asServiceRole.entities.StockMovement.filter(
    { item_id: batch.item_id, environment: batch.environment || 'LIVE', status: 'POSTED' },
    '-created_date',
    1
  );
  let item = null;
  try {
    const items = await base44.asServiceRole.entities.InventoryItem.filter({ id: batch.item_id });
    item = items[0] || null;
  } catch (_) { item = null; }
  const balanceBefore = recentMovements[0] ? recentMovements[0].balance_after : (item ? (item.stock || 0) : 0);
  const balanceAfter = balanceBefore + qty;

  const reversalMovement = await base44.asServiceRole.entities.StockMovement.create({
    site_id: site_id || batch.site_id || '',
    item_id: batch.item_id,
    sku: batch.sku,
    item_name: batch.item_name,
    movement_type: 'REVERSAL',
    direction: 'IN',
    qty,
    balance_before: balanceBefore,
    balance_after: balanceAfter,
    source_ref: `REV-${line_item_id.slice(-8)}`,
    source_type: 'POS',
    reversal_of: line_item_id,
    notes: `Markdown sale reversal. Reason: ${reversal_reason}. Batch: ${batch.batch_ref || batch.id.slice(-6)}.`,
    status: 'POSTED',
    posted_by: user.email || user.id,
    actor_role: user.role,
    environment: batch.environment || 'LIVE',
  });

  // 4. Update MarkdownBatch counters
  const newSoldQty = Math.max(0, (batch.sold_qty || 0) - qty);
  const newRemainingQty = (batch.current_remaining_qty || 0) + qty;
  const sellThroughPct = batch.allocated_qty > 0
    ? Math.round((newSoldQty / batch.allocated_qty) * 10000) / 100
    : 0;

  await base44.asServiceRole.entities.MarkdownBatch.update(original.markdown_batch_id, {
    sold_qty: newSoldQty,
    current_remaining_qty: newRemainingQty,
    sell_through_pct: sellThroughPct,
  });

  // 5. Update MarkdownRound qty_sold_in_round
  await base44.asServiceRole.entities.MarkdownRound.update(original.markdown_round_id, {
    qty_sold_in_round: Math.max(0, (round.qty_sold_in_round || 0) - qty),
  });

  // 6. Move reversed quantity into Review Queue for inspection
  // Check if there's already an open review queue entry for this batch
  const existingQueue = await base44.asServiceRole.entities.MarkdownReviewQueue.filter({ batch_id: original.markdown_batch_id });
  const openQueue = existingQueue.find(q => !['Disposition_Complete', 'Recovered'].includes(q.status));

  const settings = batch.settings_snapshot || {};
  const warningHours = settings.review_warning_hours || 24;
  const escalationHours = settings.review_escalation_hours || 72;
  const criticalHours = settings.review_critical_hours || 96;
  const nowDate = new Date();

  let reviewEntry;
  if (openQueue) {
    // Add reversed qty to existing open queue
    const newExpected = (openQueue.expected_remaining_qty || 0) + qty;
    reviewEntry = await base44.asServiceRole.entities.MarkdownReviewQueue.update(openQueue.id, {
      expected_remaining_qty: newExpected,
      investigation_notes: (openQueue.investigation_notes || '') + `\n[REVERSAL ${now}] ${qty} units returned from sale reversal. Reason: ${reversal_reason}`,
      status: 'Pending_Investigation',
    });
  } else {
    reviewEntry = await base44.asServiceRole.entities.MarkdownReviewQueue.create({
      batch_id: original.markdown_batch_id,
      status: 'Pending_Investigation',
      entered_review_at: now,
      expected_remaining_qty: qty,
      actual_floor_count: qty,
      variance_qty: 0,
      variance_percent: 0,
      deadline_warning_at: new Date(nowDate.getTime() + warningHours * 3600000).toISOString(),
      deadline_escalation_at: new Date(nowDate.getTime() + escalationHours * 3600000).toISOString(),
      deadline_critical_at: new Date(nowDate.getTime() + criticalHours * 3600000).toISOString(),
      investigation_notes: `Reversed sale: ${qty} units returned for inspection. Reason: ${reversal_reason}`,
      environment: batch.environment || 'LIVE',
    });

    // Transition batch back to Review_Queue if it was Active
    if (batch.status === 'Active') {
      await base44.asServiceRole.entities.MarkdownBatch.update(original.markdown_batch_id, {
        status: 'Review_Queue',
      });
    }
  }

  // 7. MarkdownEventLog SALE_REVERSED
  await base44.asServiceRole.entities.MarkdownEventLog.create({
    batch_id: original.markdown_batch_id,
    round_id: original.markdown_round_id,
    event_type: 'SALE_REVERSED',
    user_id: user.id || user.email,
    user_role: user.role,
    payload: {
      before: { sold_qty: batch.sold_qty, remaining_qty: batch.current_remaining_qty },
      after: { sold_qty: newSoldQty, remaining_qty: newRemainingQty, sell_through_pct: sellThroughPct },
      meta: {
        original_line_item_id: line_item_id,
        reversal_line_item_id: reversalLine.id,
        reversal_movement_id: reversalMovement.id,
        reversal_reason,
        review_queue_id: reviewEntry.id || openQueue?.id,
        qty,
      }
    },
    created_at: now,
    environment: batch.environment || 'LIVE',
  });

  await base44.asServiceRole.entities.AuditLog.create({
    item_id: batch.item_id,
    sku: batch.sku,
    item_name: batch.item_name,
    change_type: 'REVERSAL',
    field_name: 'markdown_sale',
    old_value: JSON.stringify({ line_item_id, sold_qty: batch.sold_qty }),
    new_value: JSON.stringify({ reversal_line_id: reversalLine.id, sold_qty: newSoldQty }),
    changed_by: user.email || user.id,
    actor_role: user.role,
    source_module: 'Markdown',
    action_type: 'SALE_REVERSED',
    linked_source_record: reversalLine.id,
    source_record_id: reversalMovement.id,
    notes: `Sale reversal: ${qty} units. Reason: ${reversal_reason}. Returned to Review Queue.`,
    environment: batch.environment || 'LIVE',
  });

  return Response.json({
    success: true,
    reversal_line_item_id: reversalLine.id,
    reversal_movement_id: reversalMovement.id,
    review_queue_id: reviewEntry.id || openQueue?.id,
    new_remaining_qty: newRemainingQty,
    sell_through_pct: sellThroughPct,
  });
});