import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

/**
 * printMarkdownLabel
 * Official initial label print flow.
 * Creates MarkdownPrintEvent (print_type=Initial), increments round print_count,
 * sets printed_at on the round, and writes LABEL_PRINTED MarkdownEventLog entry.
 *
 * Reprint flow (subsequent prints) is handled by requestLabelReprint / approveLabelReprint.
 * Role: Staff and above (any authenticated POS operator).
 */

function normaliseRole(role) {
  return (role || '').toLowerCase().trim();
}

Deno.serve(async (req) => {
  const base44 = createClientFromRequest(req);
  const user = await base44.auth.me();
  if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

  // All authenticated roles can trigger initial print — governance is upstream (batch must be Active)
  const role = normaliseRole(user.role);

  const { batch_id, round_id, printer_id, device_id, label_template_id } = await req.json();
  if (!batch_id || !round_id) {
    return Response.json({ error: 'batch_id and round_id are required.' }, { status: 400 });
  }

  const batches = await base44.asServiceRole.entities.MarkdownBatch.filter({ id: batch_id });
  const batch = batches[0];
  if (!batch) return Response.json({ error: 'Batch not found.' }, { status: 404 });
  if (batch.status !== 'Active') {
    return Response.json({ error: `Batch must be Active before printing labels. Current status: ${batch.status}.` }, { status: 409 });
  }

  const rounds = await base44.asServiceRole.entities.MarkdownRound.filter({ id: round_id });
  const round = rounds[0];
  if (!round) return Response.json({ error: 'Round not found.' }, { status: 404 });
  if (round.batch_id !== batch_id) {
    return Response.json({ error: 'Round does not belong to this batch.' }, { status: 400 });
  }
  if (!['Active'].includes(round.status)) {
    return Response.json({ error: `Round status must be Active for initial print. Current: ${round.status}.` }, { status: 409 });
  }

  // Guard: initial print already done — redirect to reprint workflow
  if (round.print_count > 0) {
    return Response.json({
      error: 'Initial print already completed for this round. Use requestLabelReprint for subsequent prints.',
      print_count: round.print_count,
    }, { status: 409 });
  }

  const settings = batch.settings_snapshot || {};
  const now = new Date().toISOString();

  // Create MarkdownPrintEvent
  const printEvent = await base44.asServiceRole.entities.MarkdownPrintEvent.create({
    batch_id,
    round_id,
    round_number: round.round_number,
    printer_id: printer_id || '',
    device_id: device_id || '',
    label_template_id: label_template_id || settings.default_label_template_id || '',
    print_type: 'Initial',
    print_status: 'Success',
    printed_at: now,
    is_escalated: false,
    requested_by: user.id || user.email,
    environment: batch.environment || 'LIVE',
  });

  // Increment round print_count and set printed_at
  await base44.asServiceRole.entities.MarkdownRound.update(round_id, {
    print_count: 1,
    printed_at: now,
  });

  await base44.asServiceRole.entities.MarkdownEventLog.create({
    batch_id,
    round_id,
    event_type: 'LABEL_PRINTED',
    user_id: user.id || user.email,
    user_role: role,
    payload: {
      before: { print_count: 0 },
      after: { print_count: 1, printed_at: now },
      meta: {
        print_event_id: printEvent.id,
        print_type: 'Initial',
        printer_id: printer_id || '',
        device_id: device_id || '',
        barcode: round.markdown_barcode,
        round_number: round.round_number,
      }
    },
    created_at: now,
    environment: batch.environment || 'LIVE',
  });

  await base44.asServiceRole.entities.AuditLog.create({
    item_id: batch.item_id,
    sku: batch.sku,
    item_name: batch.item_name,
    change_type: 'ITEM_UPDATE',
    field_name: 'markdown_label_print',
    old_value: JSON.stringify({ print_count: 0 }),
    new_value: JSON.stringify({ print_count: 1, printed_at: now, barcode: round.markdown_barcode }),
    changed_by: user.email || user.id,
    actor_role: role,
    source_module: 'Markdown',
    action_type: 'LABEL_PRINTED',
    linked_source_record: batch_id,
    source_record_id: printEvent.id,
    notes: `Initial label print for Round ${round.round_number}. Barcode: ${round.markdown_barcode}.`,
    environment: batch.environment || 'LIVE',
  });

  return Response.json({
    success: true,
    print_event_id: printEvent.id,
    barcode: round.markdown_barcode,
    markdown_unit_price: round.markdown_unit_price,
    expiry_date: round.expiry_date,
    round_number: round.round_number,
  });
});