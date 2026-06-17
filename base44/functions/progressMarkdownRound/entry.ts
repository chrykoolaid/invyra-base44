import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

/**
 * progressMarkdownRound
 * Handles ONLY price/round lifecycle progression.
 * Reprint governance is handled separately by requestLabelReprint / approveLabelReprint.
 * 
 * Creates the next MarkdownRound record, voids the current round barcode,
 * and updates the batch's current_round_number.
 */
Deno.serve(async (req) => {
  const base44 = createClientFromRequest(req);
  const user = await base44.auth.me();
  if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

  const isPrivileged = ['supervisor', 'manager', 'admin'].includes(user.role);
  if (!isPrivileged) return Response.json({ error: 'Forbidden: Supervisor or Manager role required to progress rounds.' }, { status: 403 });

  const {
    batch_id,
    current_round_id,
    new_markdown_unit_price,
    new_expiry_date,
    new_discount_percent,
  } = await req.json();

  if (!batch_id || !current_round_id || !new_markdown_unit_price || !new_expiry_date) {
    return Response.json({ error: 'batch_id, current_round_id, new_markdown_unit_price, and new_expiry_date are required.' }, { status: 400 });
  }

  const batches = await base44.asServiceRole.entities.MarkdownBatch.filter({ id: batch_id });
  const batch = batches[0];
  if (!batch) return Response.json({ error: 'Batch not found.' }, { status: 404 });
  if (batch.status !== 'Active') return Response.json({ error: `Cannot progress round on batch in status: ${batch.status}` }, { status: 409 });

  const settings = batch.settings_snapshot || {};
  const maxRounds = settings.max_rounds || 3;
  if (batch.current_round_number >= maxRounds) {
    return Response.json({ error: `Maximum rounds (${maxRounds}) reached for this batch.` }, { status: 409 });
  }

  const rounds = await base44.asServiceRole.entities.MarkdownRound.filter({ id: current_round_id });
  const currentRound = rounds[0];
  if (!currentRound) return Response.json({ error: 'Current round not found.' }, { status: 404 });
  if (currentRound.status !== 'Active') return Response.json({ error: `Current round is not Active (status: ${currentRound.status})` }, { status: 409 });

  const now = new Date().toISOString();
  const newRoundNumber = batch.current_round_number + 1;

  // Void the current round's barcode and mark as Progressed
  await base44.asServiceRole.entities.MarkdownRound.update(current_round_id, {
    status: 'Progressed',
    barcode_status: 'Voided',
    progressed_at: now,
    progressed_by: user.id || user.email,
  });

  // Generate new barcode for next round
  const newBarcode = `MD-${batch_id.slice(-6).toUpperCase()}-R${newRoundNumber}-${Date.now().toString(36).toUpperCase()}`;

  // Create new round record
  const newRound = await base44.asServiceRole.entities.MarkdownRound.create({
    batch_id,
    round_number: newRoundNumber,
    original_unit_price: currentRound.original_unit_price,
    markdown_unit_price: new_markdown_unit_price,
    discount_percent: new_discount_percent || Math.round((1 - new_markdown_unit_price / currentRound.original_unit_price) * 100),
    expiry_date: new_expiry_date,
    markdown_barcode: newBarcode,
    barcode_status: 'Active',
    status: 'Active',
    created_by: user.id || user.email,
    approved_by: user.id || user.email,
    qty_at_round_start: batch.current_remaining_qty,
    qty_sold_in_round: 0,
    print_count: 0,
    environment: batch.environment || 'LIVE',
  });

  // Update batch round number
  await base44.asServiceRole.entities.MarkdownBatch.update(batch_id, {
    current_round_number: newRoundNumber,
  });

  // Log event
  await base44.asServiceRole.entities.MarkdownEventLog.create({
    batch_id,
    round_id: newRound.id,
    event_type: 'ROUND_PROGRESS',
    user_id: user.id || user.email,
    user_role: user.role,
    payload: {
      before: { round_number: currentRound.round_number, price: currentRound.markdown_unit_price, barcode: currentRound.markdown_barcode },
      after: { round_number: newRoundNumber, price: new_markdown_unit_price, barcode: newBarcode },
      meta: { new_expiry_date }
    },
    created_at: now,
    environment: batch.environment || 'LIVE',
  });

  await base44.asServiceRole.entities.AuditLog.create({
    item_id: batch.item_id,
    sku: batch.sku,
    item_name: batch.item_name,
    change_type: 'ITEM_UPDATE',
    field_name: 'markdown_round',
    old_value: JSON.stringify({ round: currentRound.round_number, price: currentRound.markdown_unit_price }),
    new_value: JSON.stringify({ round: newRoundNumber, price: new_markdown_unit_price }),
    changed_by: user.email || user.id,
    actor_role: user.role,
    source_module: 'Markdown',
    action_type: 'ROUND_PROGRESS',
    linked_source_record: batch_id,
    source_record_id: newRound.id,
    notes: `Round progressed from R${currentRound.round_number} to R${newRoundNumber}. New price: ${new_markdown_unit_price}. Old barcode voided.`,
    environment: batch.environment || 'LIVE',
  });

  return Response.json({ success: true, new_round: newRound, voided_round_id: current_round_id });
});