import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

/**
 * approveMarkdownBatch
 * Supervisor/Manager approves a Pending_Approval batch by activating a
 * temporary, quantity-limited price overlay. This never changes Item Master
 * price and therefore cannot leave the normal SKU price stuck at markdown.
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
    return Response.json({ error: 'Forbidden: Supervisor or Manager role required.' }, { status: 403 });
  }

  const {
    batch_id,
    approval_notes,
    initial_markdown_price,
    initial_original_price,
    initial_expiry_date,
  } = await req.json();

  if (!batch_id) return Response.json({ error: 'batch_id is required.' }, { status: 400 });
  if (!initial_markdown_price || !initial_expiry_date) {
    return Response.json({ error: 'initial_markdown_price and initial_expiry_date are required to activate Round 1.' }, { status: 400 });
  }

  const batches = await base44.asServiceRole.entities.MarkdownBatch.filter({ id: batch_id });
  const batch = batches[0];
  if (!batch) return Response.json({ error: 'Markdown batch not found.' }, { status: 404 });
  if (batch.status !== 'Pending_Approval') {
    return Response.json({ error: `Cannot approve batch in status: ${batch.status}` }, { status: 409 });
  }

  const now = new Date().toISOString();

  const origPrice = initial_original_price ? Number(initial_original_price) : Number(initial_markdown_price);
  const mdPrice = Number(initial_markdown_price);
  const discountPct = origPrice > 0
    ? Math.round((1 - mdPrice / origPrice) * 10000) / 100
    : 0;
  const priceOverlayScope = batch?.settings_snapshot?.request_metadata?.price_overlay_scope || 'EXPIRY_DATE_QTY';

  // Activate the quantity/date scoped overlay. Item Master price remains untouched.
  const updated = await base44.asServiceRole.entities.MarkdownBatch.update(batch_id, {
    status: 'Active',
    approved_by: user.id || user.email,
    approved_at: now,
    price_overlay_scope: priceOverlayScope,
    overlay_original_unit_price: origPrice,
    overlay_markdown_unit_price: mdPrice,
    overlay_discount_percent: discountPct,
    overlay_expiry_date: initial_expiry_date,
    item_master_price_mutated: false,
  });

  // Create Round 1 overlay (always — approval requires price/expiry)
  const barcode = `MD-${batch_id.slice(-6).toUpperCase()}-R1-${Date.now().toString(36).toUpperCase()}`;

  const round1 = await base44.asServiceRole.entities.MarkdownRound.create({
    batch_id,
    round_number: 1,
    original_unit_price: origPrice,
    markdown_unit_price: mdPrice,
    discount_percent: discountPct,
    expiry_date: initial_expiry_date,
    markdown_barcode: barcode,
    barcode_status: 'Active',
    status: 'Active',
    created_by: user.id || user.email,
    approved_by: user.id || user.email,
    qty_at_round_start: batch.allocated_qty,
    qty_sold_in_round: 0,
    print_count: 0,
    price_overlay_scope: priceOverlayScope,
    auto_close_rule: 'CLOSE_ON_SOLD_OUT_OR_EXPIRY',
    environment: batch.environment || 'LIVE',
  });

  await Promise.all([
    base44.asServiceRole.entities.MarkdownEventLog.create({
      batch_id,
      round_id: round1.id,
      event_type: 'MARKDOWN_APPROVED',
      user_id: user.id || user.email,
      user_role: role,
      payload: {
        before: { status: 'Pending_Approval' },
        after: { status: 'Active', round1_id: round1.id, barcode, overlay_price: mdPrice, overlay_expiry_date: initial_expiry_date },
        meta: {
          approval_notes: approval_notes || '',
          manager_action_type: 'APPROVE_TEMPORARY_PRICE_OVERLAY',
          item_master_price_mutated: false,
          auto_close_rule: 'CLOSE_ON_SOLD_OUT_OR_EXPIRY',
        }
      },
      created_at: now,
      environment: batch.environment || 'LIVE',
    }),
    base44.asServiceRole.entities.AuditLog.create({
      item_id: batch.item_id,
      sku: batch.sku,
      item_name: batch.item_name,
      change_type: 'ITEM_UPDATE',
      field_name: 'markdown_batch_status',
      old_value: 'Pending_Approval',
      new_value: 'Active',
      changed_by: user.email || user.id,
      actor_role: role,
      source_module: 'Markdown',
      action_type: 'MARKDOWN_APPROVED',
      linked_source_record: batch_id,
      source_record_id: round1.id,
      notes: approval_notes || `Temporary price overlay approved @ ₱${mdPrice}. Item Master price unchanged. Barcode/session: ${barcode}.`,
      environment: batch.environment || 'LIVE',
    }),
  ]);

  return Response.json({ success: true, batch: updated, round1 });
});