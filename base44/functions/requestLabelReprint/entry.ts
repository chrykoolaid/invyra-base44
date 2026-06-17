import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

/**
 * requestLabelReprint
 * Creates a reprint request (MarkdownPrintEvent) and determines if escalation is required.
 * Separated from round progression per Phase 1 governance rules.
 */
Deno.serve(async (req) => {
  const base44 = createClientFromRequest(req);
  const user = await base44.auth.me();
  if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

  const { batch_id, round_id, reason_code, printer_id, device_id, label_template_id } = await req.json();

  if (!batch_id || !round_id || !reason_code) {
    return Response.json({ error: 'batch_id, round_id, and reason_code are required for a reprint request.' }, { status: 400 });
  }

  const batches = await base44.asServiceRole.entities.MarkdownBatch.filter({ id: batch_id });
  const batch = batches[0];
  if (!batch) return Response.json({ error: 'Batch not found.' }, { status: 404 });
  if (!['Active'].includes(batch.status)) return Response.json({ error: 'Batch is not Active — reprints not allowed.' }, { status: 409 });

  const rounds = await base44.asServiceRole.entities.MarkdownRound.filter({ id: round_id });
  const round = rounds[0];
  if (!round || round.barcode_status !== 'Active') {
    return Response.json({ error: 'Round barcode is not Active.' }, { status: 409 });
  }

  // Check existing print count for this round
  const settings = batch.settings_snapshot || {};
  const maxReprints = settings.max_reprints || 2;
  const existingPrints = await base44.asServiceRole.entities.MarkdownPrintEvent.filter({ round_id });
  const successfulPrints = existingPrints.filter(p => p.print_status === 'Success');
  const reprintCount = successfulPrints.filter(p => p.print_type === 'Reprint').length;

  const requiresEscalation = reprintCount >= maxReprints;
  const isPrivileged = ['supervisor', 'manager', 'admin'].includes(user.role);

  // If escalation needed and user is not privileged, block with 403
  if (requiresEscalation && !isPrivileged) {
    return Response.json({
      error: `Maximum reprints (${maxReprints}) reached. Manager approval is required.`,
      requires_escalation: true
    }, { status: 403 });
  }

  const printEvent = await base44.asServiceRole.entities.MarkdownPrintEvent.create({
    batch_id,
    round_id,
    round_number: round.round_number,
    printer_id: printer_id || '',
    device_id: device_id || '',
    label_template_id: label_template_id || settings.default_label_template_id || '',
    print_type: 'Reprint',
    print_status: requiresEscalation ? 'Pending' : 'Pending',
    reason_code,
    is_escalated: requiresEscalation,
    reprint_approved_by: requiresEscalation ? null : (isPrivileged ? (user.id || user.email) : null),
    reprint_approved_at: requiresEscalation ? null : (isPrivileged ? new Date().toISOString() : null),
    requested_by: user.id || user.email,
    environment: batch.environment || 'LIVE',
  });

  await base44.asServiceRole.entities.MarkdownEventLog.create({
    batch_id,
    round_id,
    event_type: 'LABEL_REPRINTED',
    user_id: user.id || user.email,
    user_role: user.role,
    payload: {
      before: { print_count: round.print_count },
      after: { print_event_id: printEvent.id, reason_code, is_escalated: requiresEscalation },
      meta: { reprint_count: reprintCount + 1, max_reprints: maxReprints }
    },
    created_at: new Date().toISOString(),
    environment: batch.environment || 'LIVE',
  });

  return Response.json({
    success: true,
    print_event: printEvent,
    requires_escalation: requiresEscalation,
    message: requiresEscalation
      ? 'Reprint logged and escalated — awaiting Manager approval.'
      : 'Reprint request created. Proceed to print.'
  });
});