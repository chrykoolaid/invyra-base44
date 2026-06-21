import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

/**
 * approveAdjustmentDraft
 * Supervisor/Manager/Admin approves a PENDING_APPROVAL AdjustmentDraft.
 * Posts the movement to the ledger and updates inventory stock.
 */
Deno.serve(async (req) => {
  const base44 = createClientFromRequest(req);
  const user = await base44.auth.me();
  if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

  const role = (user.role || '').toLowerCase();
  if (!['supervisor', 'manager', 'admin', 'owner'].includes(role)) {
    return Response.json({ error: 'Forbidden: Supervisor or above required to approve adjustments' }, { status: 403 });
  }

  const { draft_id } = await req.json();
  if (!draft_id) return Response.json({ error: 'draft_id is required' }, { status: 400 });

  const drafts = await base44.asServiceRole.entities.AdjustmentDraft.filter({ id: draft_id });
  const draft = drafts[0];
  if (!draft) return Response.json({ error: 'Draft not found' }, { status: 404 });
  if (draft.status !== 'PENDING_APPROVAL') {
    return Response.json({ error: `Draft is not pending approval. Current status: ${draft.status}` }, { status: 409 });
  }

  const items = await base44.asServiceRole.entities.InventoryItem.filter({ id: draft.item_id });
  const item = items[0];
  if (!item) return Response.json({ error: 'Item not found' }, { status: 404 });

  const adjustQty = Number(draft.qty);
  const balanceBefore = Number(item.stock || 0);
  const delta = draft.direction === 'IN' ? adjustQty : -adjustQty;
  const balanceAfter = balanceBefore + delta;

  if (balanceAfter < 0) {
    return Response.json({ error: `Over-deduction blocked: ${balanceBefore} on hand, cannot deduct ${adjustQty}` }, { status: 409 });
  }

  const now = new Date().toISOString();
  const ref = `ADJ-${Date.now().toString(36).toUpperCase()}`;
  const postedBy = user.email || user.full_name || user.id;

  // Post movement to ledger
  const movement = await base44.asServiceRole.entities.StockMovement.create({
    site_id: item.site_id || '',
    item_id: item.id,
    sku: item.sku || '',
    item_name: item.name || '',
    movement_type: 'ADJUST',
    direction: draft.direction,
    qty: adjustQty,
    balance_before: balanceBefore,
    balance_after: balanceAfter,
    location_id: draft.location_id || '',
    storage_area_id: draft.storage_area_id || '',
    source_ref: ref,
    source_type: 'MANUAL',
    notes: `${draft.reason}${draft.notes ? ` — ${draft.notes}` : ''} [Approved by ${postedBy}]`,
    status: 'POSTED',
    posted_by: postedBy,
    actor_role: role,
    environment: draft.environment || 'LIVE',
  });

  // Update item stock
  await base44.asServiceRole.entities.InventoryItem.update(item.id, { stock: balanceAfter });

  // Audit log
  await base44.asServiceRole.entities.AuditLog.create({
    item_id: item.id,
    sku: item.sku || '',
    item_name: item.name || '',
    change_type: 'STOCK_ADJUST',
    action_type: 'ADJUST',
    field_name: 'stock',
    old_value: String(balanceBefore),
    new_value: String(balanceAfter),
    changed_by: postedBy,
    actor_role: role,
    source_module: 'Adjustments',
    linked_movement_id: movement.id,
    linked_source_record: draft_id,
    source_record_id: draft_id,
    notes: `Draft approved. ${draft.reason}. Drafted by: ${draft.drafted_by}. Balance: ${balanceBefore} → ${balanceAfter}`,
    environment: draft.environment || 'LIVE',
  });

  // Mark draft as POSTED
  await base44.asServiceRole.entities.AdjustmentDraft.update(draft_id, {
    status: 'POSTED',
    reviewed_by: postedBy,
    reviewed_at: now,
    linked_movement_id: movement.id,
  });

  return Response.json({
    success: true,
    draft_id,
    movement_id: movement.id,
    balance_before: balanceBefore,
    balance_after: balanceAfter,
  });
});