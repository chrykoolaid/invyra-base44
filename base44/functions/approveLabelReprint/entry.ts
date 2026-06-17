import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

/**
 * approveLabelReprint
 * Manager/Supervisor approves an escalated reprint request.
 * Updates the MarkdownPrintEvent and increments the round print_count.
 */
Deno.serve(async (req) => {
  const base44 = createClientFromRequest(req);
  const user = await base44.auth.me();
  if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

  const isPrivileged = ['supervisor', 'manager', 'admin'].includes(user.role);
  if (!isPrivileged) return Response.json({ error: 'Forbidden: Supervisor or Manager role required to approve reprints.' }, { status: 403 });

  const { print_event_id, approval_notes } = await req.json();
  if (!print_event_id) return Response.json({ error: 'print_event_id is required.' }, { status: 400 });

  const events = await base44.asServiceRole.entities.MarkdownPrintEvent.filter({ id: print_event_id });
  const printEvent = events[0];
  if (!printEvent) return Response.json({ error: 'Print event not found.' }, { status: 404 });
  if (!printEvent.is_escalated) return Response.json({ error: 'This print event does not require approval.' }, { status: 409 });
  if (printEvent.print_status === 'Success') return Response.json({ error: 'Print event already completed.' }, { status: 409 });

  const now = new Date().toISOString();

  const updated = await base44.asServiceRole.entities.MarkdownPrintEvent.update(print_event_id, {
    reprint_approved_by: user.id || user.email,
    reprint_approved_at: now,
    print_status: 'Success',
    printed_at: now,
  });

  // Increment print count on the round
  const rounds = await base44.asServiceRole.entities.MarkdownRound.filter({ id: printEvent.round_id });
  const round = rounds[0];
  if (round) {
    await base44.asServiceRole.entities.MarkdownRound.update(printEvent.round_id, {
      print_count: (round.print_count || 0) + 1,
      barcode_status: 'Reprinted',
    });
  }

  await base44.asServiceRole.entities.MarkdownEventLog.create({
    batch_id: printEvent.batch_id,
    round_id: printEvent.round_id,
    event_type: 'LABEL_REPRINTED',
    user_id: user.id || user.email,
    user_role: user.role,
    payload: {
      before: { print_status: 'Pending', is_escalated: true },
      after: { print_status: 'Success', approved_by: user.id || user.email },
      meta: { approval_notes: approval_notes || '' }
    },
    created_at: now,
    environment: printEvent.environment || 'LIVE',
  });

  return Response.json({ success: true, print_event: updated });
});