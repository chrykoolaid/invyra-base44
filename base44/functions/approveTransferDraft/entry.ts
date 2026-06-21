import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

Deno.serve(async (req) => {
  const base44 = createClientFromRequest(req);
  const user = await base44.auth.me();
  if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

  const role = (user.role || '').toLowerCase();
  if (!['supervisor', 'manager', 'admin', 'owner'].includes(role)) {
    return Response.json({ error: 'Forbidden: Supervisor or above required' }, { status: 403 });
  }

  const { draft_id } = await req.json();
  if (!draft_id) return Response.json({ error: 'draft_id required' }, { status: 400 });

  const draftArr = await base44.asServiceRole.entities.TransferDraft.filter({ id: draft_id });
  const draft = draftArr[0];
  if (!draft) return Response.json({ error: 'Transfer draft not found' }, { status: 404 });
  if (draft.status !== 'PENDING_APPROVAL') {
    return Response.json({ error: `Draft is not pending approval. Status: ${draft.status}` }, { status: 409 });
  }

  const now = new Date().toISOString();
  const postedBy = user.email || user.full_name || user.id;
  const outIds = [];

  for (const line of draft.lines) {
    const itemArr = await base44.asServiceRole.entities.InventoryItem.filter({ id: line.item_id });
    const item = itemArr[0];
    if (!item) continue;
    const balBefore = Number(item.stock || 0);
    const balAfter = balBefore - line.qty;
    if (balAfter < 0) {
      return Response.json({ error: `Over-transfer: ${item.name} now has ${balBefore}, cannot transfer ${line.qty}` }, { status: 409 });
    }
    const mov = await base44.asServiceRole.entities.StockMovement.create({
      site_id: draft.from_site_id,
      item_id: item.id, sku: item.sku, item_name: item.name,
      movement_type: 'TRANSFER_OUT', direction: 'OUT',
      qty: line.qty, balance_before: balBefore, balance_after: balAfter,
      location_id: draft.from_location_id || '',
      storage_area_id: draft.from_storage_area_id || '',
      source_ref: draft.transfer_ref, source_type: 'TRANSFER',
      notes: `Transfer to ${draft.to_site_name}. ${draft.reason}`,
      status: 'POSTED', posted_by: postedBy, actor_role: role,
      environment: draft.environment || 'LIVE',
    });
    outIds.push(mov.id);
    await base44.asServiceRole.entities.InventoryItem.update(item.id, { stock: balAfter });
    await base44.asServiceRole.entities.AuditLog.create({
      item_id: item.id, sku: item.sku, item_name: item.name,
      change_type: 'STOCK_TRANSFER', action_type: 'TRANSFER_OUT',
      field_name: 'stock', old_value: String(balBefore), new_value: String(balAfter),
      changed_by: postedBy, actor_role: role, source_module: 'Transfers',
      linked_movement_id: mov.id, linked_source_record: draft_id,
      notes: `Approved + In-transit OUT. Ref: ${draft.transfer_ref}`, environment: draft.environment || 'LIVE',
    });
  }

  await base44.asServiceRole.entities.TransferDraft.update(draft_id, {
    status: 'IN_TRANSIT',
    approved_by: postedBy,
    approved_at: now,
    dispatched_at: now,
    out_movement_ids: outIds,
  });

  return Response.json({ success: true, draft_id, status: 'IN_TRANSIT', out_movement_ids: outIds });
});