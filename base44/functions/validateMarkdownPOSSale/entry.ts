import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

/**
 * validateMarkdownPOSSale
 * 8-point POS validation for markdown sales.
 * Returns Sale_Allowed or Sale_Blocked with detailed check breakdown.
 * Guards against SDK ObjectNotFoundError for invalid/missing IDs.
 *
 * Checks:
 * 1. markdown_batch_id present
 * 2. markdown_round_id present
 * 3. barcode_status = Active or Reprinted
 * 4. batch status = Active
 * 5. round status = Active
 * 6. markdown price matches round's markdown_unit_price
 * 7. expiry_date not passed
 * 8. remaining_qty >= qty_requested
 * Also auto-closes the temporary overlay when sold out or expired, so POS
 * falls back to the normal Item Master price without mutating the base price.
 */
Deno.serve(async (req) => {
  const base44 = createClientFromRequest(req);
  const user = await base44.auth.me();
  if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

  const {
    markdown_batch_id,
    markdown_round_id,
    markdown_barcode_scanned,
    markdown_price_offered,
    qty_requested,
    environment = 'LIVE',
  } = await req.json();

  const checks = [];
  let sale_allowed = true;

  const fail = (check_name, reason) => {
    checks.push({ check: check_name, passed: false, reason });
    sale_allowed = false;
  };
  const pass = (check_name, detail) => {
    checks.push({ check: check_name, passed: true, detail: detail || '' });
  };

  // Check 1
  if (!markdown_batch_id) fail('batch_id_present', 'markdown_batch_id is missing.');
  else pass('batch_id_present');

  // Check 2
  if (!markdown_round_id) fail('round_id_present', 'markdown_round_id is missing.');
  else pass('round_id_present');

  let batch = null;
  let round = null;

  // Safe fetch — SDK throws ObjectNotFoundError for invalid ObjectId format
  if (markdown_batch_id) {
    try {
      const rows = await base44.asServiceRole.entities.MarkdownBatch.filter({ id: markdown_batch_id });
      batch = rows[0] || null;
    } catch (_) {
      batch = null;
    }
  }

  if (markdown_round_id) {
    try {
      const rows = await base44.asServiceRole.entities.MarkdownRound.filter({ id: markdown_round_id });
      round = rows[0] || null;
    } catch (_) {
      round = null;
    }
  }

  // Auto-close scoped overlays before validation. This prevents the Coles-style
  // failure mode where a temporary markdown price remains active after the
  // affected expiry/date quantity has sold out or expired. Item Master price is
  // never changed; closed overlays simply stop validating.
  if (batch && round && batch.status === 'Active') {
    const today = new Date().toISOString().slice(0, 10);
    const now = new Date().toISOString();
    const remainingQty = Number(batch.current_remaining_qty || 0);
    const closeReason = round.expiry_date < today
      ? 'EXPIRED'
      : remainingQty <= 0
        ? 'SOLD_OUT'
        : '';

    if (closeReason) {
      const nextBatchStatus = closeReason === 'EXPIRED' ? 'Expired' : 'Completed';
      await Promise.all([
        base44.asServiceRole.entities.MarkdownBatch.update(batch.id, {
          status: nextBatchStatus,
          overlay_auto_close_reason: closeReason,
          overlay_closed_at: now,
          item_master_price_mutated: false,
        }),
        base44.asServiceRole.entities.MarkdownRound.update(round.id, {
          status: 'Completed',
          barcode_status: 'Expired',
        }),
        base44.asServiceRole.entities.MarkdownEventLog.create({
          batch_id: batch.id,
          round_id: round.id,
          event_type: 'OVERLAY_AUTO_CLOSED',
          user_id: user.id || user.email,
          user_role: user.role,
          payload: {
            before: { batch_status: batch.status, round_status: round.status, remaining_qty: batch.current_remaining_qty },
            after: { batch_status: nextBatchStatus, round_status: 'Completed', barcode_status: 'Expired' },
            meta: { close_reason: closeReason, item_master_price_mutated: false },
          },
          created_at: now,
          environment,
        }),
      ]);
      batch = { ...batch, status: nextBatchStatus, overlay_auto_close_reason: closeReason, overlay_closed_at: now };
      round = { ...round, status: 'Completed', barcode_status: 'Expired' };
    }
  }

  // Check 3: barcode_status
  if (!round) fail('barcode_status', 'Round not found.');
  else if (!['Active', 'Reprinted'].includes(round.barcode_status))
    fail('barcode_status', `Barcode status is ${round.barcode_status} — sale not allowed.`);
  else pass('barcode_status', round.barcode_status);

  // Check 4: batch status
  if (!batch) fail('batch_status', 'Batch not found.');
  else if (batch.status !== 'Active') fail('batch_status', `Scoped markdown overlay is ${batch.status}; use normal current price.`);
  else pass('batch_status', 'Active');

  // Check 5: round active
  if (!round) fail('round_active_status', 'Round not found.');
  else if (round.status !== 'Active') fail('round_active_status', `Round status is ${round.status} — sale not allowed.`);
  else pass('round_active_status', 'Active');

  // Check 6: price match
  if (!round) fail('markdown_price', 'Round not found — cannot validate price.');
  else if (markdown_price_offered !== undefined && Math.abs(round.markdown_unit_price - markdown_price_offered) > 0.001)
    fail('markdown_price', `Price mismatch: offered ${markdown_price_offered}, expected ${round.markdown_unit_price}.`);
  else pass('markdown_price', `₱${round ? round.markdown_unit_price : 'N/A'}`);

  // Check 7: expiry
  if (!round) fail('expiry_date', 'Round not found.');
  else {
    const today = new Date().toISOString().slice(0, 10);
    if (round.expiry_date < today) fail('expiry_date', `Expired on ${round.expiry_date}. Today is ${today}.`);
    else pass('expiry_date', `Expires ${round.expiry_date}`);
  }

  // Check 8: qty eligibility
  if (!batch) fail('sale_eligibility', 'Batch not found — cannot validate remaining quantity.');
  else if (qty_requested && batch.current_remaining_qty < qty_requested)
    fail('sale_eligibility', `Markdown overlay has ${batch.current_remaining_qty} units remaining; use normal current price for any excess.`);
  else pass('sale_eligibility', `${batch ? batch.current_remaining_qty : 'N/A'} units remaining`);

  return Response.json({
    validation_status: sale_allowed ? 'Sale_Allowed' : 'Sale_Blocked',
    sale_allowed,
    checks,
    batch_ref: batch ? batch.batch_ref : null,
    markdown_unit_price: round ? round.markdown_unit_price : null,
    expiry_date: round ? round.expiry_date : null,
    remaining_qty: batch ? batch.current_remaining_qty : null,
    round_number: round ? round.round_number : null,
  });
});