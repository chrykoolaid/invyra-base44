import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

/**
 * submitAdjustmentDraft
 * Staff/any role creates an AdjustmentDraft (DRAFT → PENDING_APPROVAL).
 * Supervisors/Managers/Admins can self-approve by skipping the draft queue (handled client-side via approveAdjustmentDraft).
 */
Deno.serve(async (req) => {
  const base44 = createClientFromRequest(req);
  const user = await base44.auth.me();
  if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

  const { item_id, qty, reason, notes, direction, location_id, storage_area_id, environment } = await req.json();

  if (!item_id || !qty || !reason || !direction) {
    return Response.json({ error: 'item_id, qty, reason, and direction are required' }, { status: 400 });
  }

  const items = await base44.asServiceRole.entities.InventoryItem.filter({ id: item_id });
  const item = items[0];
  if (!item) return Response.json({ error: 'Item not found' }, { status: 404 });

  const adjustQty = Number(qty);
  if (direction === 'OUT' && adjustQty > (item.stock || 0)) {
    return Response.json({ error: `Over-deduction blocked: ${item.stock || 0} on hand, cannot deduct ${adjustQty}` }, { status: 409 });
  }

  const draft = await base44.asServiceRole.entities.AdjustmentDraft.create({
    item_id,
    sku: item.sku,
    item_name: item.name,
    direction,
    qty: adjustQty,
    reason,
    notes: notes || '',
    location_id: location_id || '',
    storage_area_id: storage_area_id || '',
    stock_at_draft: item.stock || 0,
    status: 'PENDING_APPROVAL',
    drafted_by: user.email || user.id,
    drafted_by_name: user.full_name || user.email || '',
    submitted_at: new Date().toISOString(),
    environment: environment || 'LIVE',
  });

  return Response.json({ success: true, draft_id: draft.id, draft });
});