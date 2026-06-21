import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

Deno.serve(async (req) => {
  const base44 = createClientFromRequest(req);
  const user = await base44.auth.me();
  if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

  const role = (user.role || '').toLowerCase();
  if (!['supervisor', 'manager', 'admin', 'owner'].includes(role)) {
    return Response.json({ error: 'Forbidden: Supervisor or above required' }, { status: 403 });
  }

  const { draft_id, rejection_reason } = await req.json();
  if (!draft_id || !rejection_reason?.trim()) {
    return Response.json({ error: 'draft_id and rejection_reason are required' }, { status: 400 });
  }

  const draftArr = await base44.asServiceRole.entities.TransferDraft.filter({ id: draft_id });
  const draft = draftArr[0];
  if (!draft) return Response.json({ error: 'Transfer draft not found' }, { status: 404 });
  if (draft.status !== 'PENDING_APPROVAL') {
    return Response.json({ error: `Draft is not pending approval. Status: ${draft.status}` }, { status: 409 });
  }

  const postedBy = user.email || user.full_name || user.id;
  await base44.asServiceRole.entities.TransferDraft.update(draft_id, {
    status: 'REJECTED',
    rejected_by: postedBy,
    rejected_at: new Date().toISOString(),
    rejection_reason: rejection_reason.trim(),
  });

  return Response.json({ success: true, draft_id, status: 'REJECTED' });
});