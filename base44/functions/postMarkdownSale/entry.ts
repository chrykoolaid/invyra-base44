import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

/**
 * postMarkdownSale
 * Called after POS validation passes (validateMarkdownPOSSale returns Sale_Allowed).
 * 
 * Actions:
 * 1. Creates POSLineItem with markdown_batch_id and markdown_round_id
 * 2. Decrements MarkdownBatch.current_remaining_qty
 * 3. Increments MarkdownBatch.sold_qty
 * 4. Increments MarkdownRound.qty_sold_in_round
 * 5. Recalculates sell_through_pct
 * 6. Creates SALE_POSTED MarkdownEventLog entry
 * 7. Posts StockMovement (SALE / OUT) — no direct InventoryItem.stock mutation
 * 
 * Role: Staff and above (any authenticated user who can operate POS).
 */
Deno.serve(async (req) => {
  const base44 = createClientFromRequest(req);
  const user = await base44.auth.me();
  if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

  const {
    markdown_batch_id,
    markdown_round_id,
    markdown_barcode_scanned,
    qty,
    unit_price,
    pos_transaction_id,
    site_id,
    environment = 'LIVE',
  } = await req.json();

  if (!markdown_batch_id || !markdown_round_id || !qty || qty <= 0 || !unit_price || !pos_transaction_id) {
    return Response.json({ error: 'markdown_batch_id, markdown_round_id, qty, unit_price, and pos_transaction_id are required.' }, { status: 400 });
  }

  // Re-validate before posting (fail-closed)
  const validationRes = await base44.functions.invoke('validateMarkdownPOSSale', {
    markdown_batch_id,
    markdown_round_id,
    markdown_barcode_scanned,
    markdown_price_offered: unit_price,
    qty_requested: qty,
    environment,
  });

  if (!validationRes?.data?.sale_allowed) {
    return Response.json({
      error: 'POS sale blocked by validation.',
      validation_detail: validationRes?.data,
    }, { status: 409 });
  }

  const batches = await base44.asServiceRole.entities.MarkdownBatch.filter({ id: markdown_batch_id });
  const batch = batches[0];
  if (!batch) return Response.json({ error: 'Batch not found.' }, { status: 404 });

  const rounds = await base44.asServiceRole.entities.MarkdownRound.filter({ id: markdown_round_id });
  const round = rounds[0];
  if (!round) return Response.json({ error: 'Round not found.' }, { status: 404 });

  const now = new Date().toISOString();
  const newSoldQty = (batch.sold_qty || 0) + qty;
  const newRemainingQty = Math.max(0, (batch.current_remaining_qty || 0) - qty);
  const sellThroughPct = batch.allocated_qty > 0
    ? Math.round((newSoldQty / batch.allocated_qty) * 10000) / 100
    : 0;

  // 1. Create POSLineItem
  const lineItem = await base44.asServiceRole.entities.POSLineItem.create({
    pos_transaction_id,
    sku: batch.sku,
    item_id: batch.item_id,
    item_name: batch.item_name,
    qty,
    unit_price,
    original_unit_price: round.original_unit_price,
    line_total: qty * unit_price,
    is_markdown_sale: true,
    markdown_batch_id,
    markdown_round_id,
    markdown_barcode_scanned: markdown_barcode_scanned || '',
    pos_validation_status: 'Validated',
    pos_validation_detail: validationRes?.data || {},
    is_reversed: false,
    site_id: site_id || batch.site_id || '',
    served_by: user.id || user.email,
    environment,
  });

  // 2. Update MarkdownBatch counters
  await base44.asServiceRole.entities.MarkdownBatch.update(markdown_batch_id, {
    sold_qty: newSoldQty,
    current_remaining_qty: newRemainingQty,
    sell_through_pct: sellThroughPct,
  });

  // 3. Update MarkdownRound qty_sold_in_round
  await base44.asServiceRole.entities.MarkdownRound.update(markdown_round_id, {
    qty_sold_in_round: (round.qty_sold_in_round || 0) + qty,
  });

  // 4. Post StockMovement (SALE / OUT) — ledger source of truth, no direct stock mutation
  const recentMovements = await base44.asServiceRole.entities.StockMovement.filter(
    { item_id: batch.item_id, environment, status: 'POSTED' },
    '-created_date',
    1
  );
  const items = await base44.asServiceRole.entities.InventoryItem.filter({ id: batch.item_id });
  const item = items[0];
  const balanceBefore = recentMovements[0] ? recentMovements[0].balance_after : (item ? (item.stock || 0) : 0);
  const balanceAfter = Math.max(0, balanceBefore - qty);

  const stockMovement = await base44.asServiceRole.entities.StockMovement.create({
    site_id: site_id || batch.site_id || '',
    item_id: batch.item_id,
    sku: batch.sku,
    item_name: batch.item_name,
    movement_type: 'SALE',
    direction: 'OUT',
    qty,
    balance_before: balanceBefore,
    balance_after: balanceAfter,
    source_ref: `POS-${pos_transaction_id.slice(-8)}`,
    source_type: 'POS',
    notes: `Markdown sale: R${round.round_number} @ ₱${unit_price}. Batch: ${batch.batch_ref || markdown_batch_id.slice(-6)}.`,
    status: 'POSTED',
    posted_by: user.email || user.id,
    actor_role: user.role,
    environment,
  });

  // 5. MarkdownEventLog
  await base44.asServiceRole.entities.MarkdownEventLog.create({
    batch_id: markdown_batch_id,
    round_id: markdown_round_id,
    event_type: 'SALE_POSTED',
    user_id: user.id || user.email,
    user_role: user.role,
    payload: {
      before: { sold_qty: batch.sold_qty || 0, remaining_qty: batch.current_remaining_qty },
      after: { sold_qty: newSoldQty, remaining_qty: newRemainingQty, sell_through_pct: sellThroughPct },
      meta: {
        pos_transaction_id,
        line_item_id: lineItem.id,
        unit_price,
        qty,
        round_number: round.round_number,
        movement_id: stockMovement.id,
      }
    },
    created_at: now,
    environment,
  });

  return Response.json({
    success: true,
    line_item_id: lineItem.id,
    movement_id: stockMovement.id,
    new_remaining_qty: newRemainingQty,
    sell_through_pct: sellThroughPct,
  });
});