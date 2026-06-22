import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

Deno.serve(async (req) => {
  const base44 = createClientFromRequest(req);
  const user = await base44.auth.me();
  if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

  const { from_site_id, to_site_id, from_location_id, to_location_id,
          from_storage_area_id, to_storage_area_id, lines, reason, notes, environment } = await req.json();

  if (!from_site_id || !to_site_id || from_site_id === to_site_id) {
    return Response.json({ error: 'from_site_id and to_site_id are required and must differ' }, { status: 400 });
  }
  if (!lines || lines.length === 0) return Response.json({ error: 'At least one line is required' }, { status: 400 });
  if (!reason) return Response.json({ error: 'reason is required' }, { status: 400 });

  const role = (user.role || '').toLowerCase();
  const canSelfApprove = ['supervisor', 'manager', 'admin', 'owner'].includes(role);

  // Resolve site names
  const [fromSites, toSites] = await Promise.all([
    base44.asServiceRole.entities.Site.filter({ id: from_site_id }),
    base44.asServiceRole.entities.Site.filter({ id: to_site_id }),
  ]);
  const fromSiteName = fromSites[0]?.name || from_site_id;
  const toSiteName = toSites[0]?.name || to_site_id;

  // Enrich lines with item data + validate stock
  const enrichedLines = [];
  for (const line of lines) {
    const itemArr = await base44.asServiceRole.entities.InventoryItem.filter({ id: line.item_id });
    const item = itemArr[0];
    if (!item) return Response.json({ error: `Item not found: ${line.item_id}` }, { status: 404 });
    const qty = Number(line.qty);
    if (qty <= 0) return Response.json({ error: `Invalid qty for ${item.name}` }, { status: 400 });
    const stockOnHand = Number(item.stock || 0);
    if (qty > stockOnHand) {
      return Response.json({ error: `Over-transfer blocked: ${item.name} has ${stockOnHand} on hand, cannot transfer ${qty}` }, { status: 409 });
    }
    // Phase 2: Active Hold block
    try {
      const activeHolds = await base44.asServiceRole.entities.ItemHold.filter({ item_id: item.id, status: 'ACTIVE', environment: environment || 'LIVE' });
      if (activeHolds && activeHolds.length > 0) {
        const hold = activeHolds[0];
        return Response.json({
          error: `Transfer blocked: ${item.name} (${item.sku}) has an active hold — "${hold.hold_reason}". Release the hold in Exceptions → Holds/Quarantine before transferring.`,
          hold_id: hold.id,
          hold_reason: hold.hold_reason,
        }, { status: 409 });
      }
    } catch (_) {
      // If hold check fails, allow transfer to proceed (fail-open for availability)
    }
    enrichedLines.push({ item_id: item.id, sku: item.sku, item_name: item.name, qty, stock_at_draft: stockOnHand });
  }

  const ref = `TRF-${Date.now().toString(36).toUpperCase()}`;
  const now = new Date().toISOString();
  const postedBy = user.email || user.full_name || user.id;

  const draft = await base44.asServiceRole.entities.TransferDraft.create({
    transfer_ref: ref,
    from_site_id,
    from_site_name: fromSiteName,
    to_site_id,
    to_site_name: toSiteName,
    from_location_id: from_location_id || '',
    to_location_id: to_location_id || '',
    from_storage_area_id: from_storage_area_id || '',
    to_storage_area_id: to_storage_area_id || '',
    reason,
    notes: notes || '',
    lines: enrichedLines,
    status: 'PENDING_APPROVAL',
    drafted_by: postedBy,
    drafted_by_name: user.full_name || postedBy,
    submitted_at: now,
    environment: environment || 'LIVE',
  });

  // Managers self-approve immediately
  if (canSelfApprove) {
    await base44.asServiceRole.entities.TransferDraft.update(draft.id, {
      status: 'IN_TRANSIT',
      approved_by: postedBy,
      approved_at: now,
      dispatched_at: now,
    });

    // Deduct stock from source immediately (OUT leg)
    const outIds = [];
    for (const line of enrichedLines) {
      const itemArr = await base44.asServiceRole.entities.InventoryItem.filter({ id: line.item_id });
      const item = itemArr[0];
      if (!item) continue;
      const balBefore = Number(item.stock || 0);
      const balAfter = balBefore - line.qty;
      const mov = await base44.asServiceRole.entities.StockMovement.create({
        site_id: from_site_id,
        item_id: item.id,
        sku: item.sku,
        item_name: item.name,
        movement_type: 'TRANSFER_OUT',
        direction: 'OUT',
        qty: line.qty,
        balance_before: balBefore,
        balance_after: balAfter,
        location_id: from_location_id || '',
        storage_area_id: from_storage_area_id || '',
        source_ref: ref,
        source_type: 'TRANSFER',
        notes: `Transfer to ${toSiteName}. ${reason}`,
        status: 'POSTED',
        posted_by: postedBy,
        actor_role: role,
        environment: environment || 'LIVE',
      });
      outIds.push(mov.id);
      await base44.asServiceRole.entities.InventoryItem.update(item.id, { stock: balAfter });
      await base44.asServiceRole.entities.AuditLog.create({
        item_id: item.id, sku: item.sku, item_name: item.name,
        change_type: 'STOCK_TRANSFER', action_type: 'TRANSFER_OUT',
        field_name: 'stock', old_value: String(balBefore), new_value: String(balAfter),
        changed_by: postedBy, actor_role: role, source_module: 'Transfers',
        linked_movement_id: mov.id, linked_source_record: draft.id,
        notes: `In-transit OUT. Ref: ${ref}`, environment: environment || 'LIVE',
      });
    }
    await base44.asServiceRole.entities.TransferDraft.update(draft.id, { out_movement_ids: outIds });

    return Response.json({ success: true, draft_id: draft.id, status: 'IN_TRANSIT', ref, self_approved: true });
  }

  return Response.json({ success: true, draft_id: draft.id, status: 'PENDING_APPROVAL', ref, self_approved: false });
});