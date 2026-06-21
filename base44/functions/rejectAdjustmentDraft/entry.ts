import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

/**
 * rejectAdjustmentDraft
 * Supervisor/Manager/Admin rejects a PENDING_APPROVAL AdjustmentDraft with a mandatory reason.
 */
Deno.serve(async (req) => {
  const base44 = createClientFromRequest(req);
  const user = await base44.auth.me();
  if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

  const role = (user.role || '').toLowerCase();
  if (!['supervisor', 'manager', 'admin', 'owner'].includes(role)) {
    return Response.json({ error: 'Forbidden: Supervisor or above required to reject adjustments' }, { status: 403 });
  }

  const { draft_id, rejection_reason } = await req.json();
  if (!draft_id || !rejection_reason?.trim()) {
    return Response.json({ error: 'draft_id and rejection_reason are required' }, { status: 400 });
  }

  const drafts = await base44.asServiceRole.entities.AdjustmentDraft.filter({ id: draft_id });
  const draft = drafts[0];
  if (!draft) return Response.json({ error: 'Draft not found' }, { status: 404 });
  if (draft.status !== 'PENDING_APPROVAL') {
    return Response.json({ error: `Draft is not pending approval. Current status: ${draft.status}` }, { status: 409 });
  }

  const postedBy = user.email || user.full_name || user.id;
  await base44.asServiceRole.entities.AdjustmentDraft.update(draft_id, {
    status: 'REJECTED',
    reviewed_by: postedBy,
    reviewed_at: new Date().toISOString(),
    rejection_reason: rejection_reason.trim(),
  });

  return Response.json({ success: true, draft_id, status: 'REJECTED' });
});