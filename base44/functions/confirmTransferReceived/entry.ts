import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

/**
 * confirmTransferReceived
 * Destination branch confirms receipt. Posts IN movements, detects discrepancies.
 * received_lines: [{ item_id, qty_received }]
 */
Deno.serve(async (req) => {
  const base44 = createClientFromRequest(req);
  const user = await base44.auth.me();
  if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

  const { draft_id, received_lines } = await req.json();
  if (!draft_id || !received_lines) return Response.json({ error: 'draft_id and received_lines required' }, { status: 400 });

  const draftArr = await base44.asServiceRole.entities.TransferDraft.filter({ id: draft_id });
  const draft = draftArr[0];
  if (!draft) return Response.json({ error: 'Transfer not found' }, { status: 404 });
  if (draft.status !== 'IN_TRANSIT') {
    return Response.json({ error: `Transfer is not IN_TRANSIT. Status: ${draft.status}` }, { status: 409 });
  }

  const now = new Date().toISOString();
  const postedBy = user.email || user.full_name || user.id;
  const role = (user.role || '').toLowerCase();
  const inIds = [];
  let hasDiscrepancy = false;

  const enrichedReceived = [];
  for (const recLine of received_lines) {
    const draftLine = draft.lines.find(l => l.item_id === recLine.item_id);
    if (!draftLine) continue;

    const qtyReceived = Number(recLine.qty_received || 0);
    const discrepancyQty = draftLine.qty - qtyReceived;
    if (discrepancyQty !== 0) hasDiscrepancy = true;

    enrichedReceived.push({ item_id: recLine.item_id, qty_received: qtyReceived, discrepancy_qty: discrepancyQty });

    // Only post IN movement for qty actually received
    if (qtyReceived > 0) {
      const itemArr = await base44.asServiceRole.entities.InventoryItem.filter({ id: recLine.item_id });
      const item = itemArr[0];
      if (!item) continue;
      const balBefore = Number(item.stock || 0);
      const balAfter = balBefore + qtyReceived;

      const mov = await base44.asServiceRole.entities.StockMovement.create({
        site_id: draft.to_site_id,
        item_id: item.id, sku: item.sku, item_name: item.name,
        movement_type: 'TRANSFER_IN', direction: 'IN',
        qty: qtyReceived, balance_before: balBefore, balance_after: balAfter,
        location_id: draft.to_location_id || '',
        storage_area_id: draft.to_storage_area_id || '',
        source_ref: draft.transfer_ref, source_type: 'TRANSFER',
        notes: `Transfer received from ${draft.from_site_name}. ${draft.reason}${discrepancyQty !== 0 ? ` [DISCREPANCY: expected ${draftLine.qty}, received ${qtyReceived}]` : ''}`,
        status: 'POSTED', posted_by: postedBy, actor_role: role,
        environment: draft.environment || 'LIVE',
      });
      inIds.push(mov.id);
      await base44.asServiceRole.entities.InventoryItem.update(item.id, { stock: balAfter });
      await base44.asServiceRole.entities.AuditLog.create({
        item_id: item.id, sku: item.sku, item_name: item.name,
        change_type: 'STOCK_TRANSFER', action_type: 'TRANSFER_IN',
        field_name: 'stock', old_value: String(balBefore), new_value: String(balAfter),
        changed_by: postedBy, actor_role: role, source_module: 'Transfers',
        linked_movement_id: mov.id, linked_source_record: draft_id,
        notes: `Received at ${draft.to_site_name}. Ref: ${draft.transfer_ref}${discrepancyQty !== 0 ? `. Discrepancy: ${discrepancyQty}` : ''}`,
        environment: draft.environment || 'LIVE',
      });
    }
  }

  // Raise discrepancy alert if needed
  if (hasDiscrepancy) {
    const dedupeKey = `TRANSFER_DISCREPANCY_${draft_id}`;
    const existing = await base44.asServiceRole.entities.StockOutAlert.filter({ dedupe_key: dedupeKey });
    if (existing.length === 0) {
      await base44.asServiceRole.entities.StockOutAlert.create({
        alert_type: 'AMENDMENT_AFTER_POST',
        severity: 'HIGH',
        status: 'OPEN',
        linked_record_id: draft_id,
        trigger_reason: `Transfer ${draft.transfer_ref} received with quantity discrepancy at ${draft.to_site_name}`,
        dedupe_key: dedupeKey,
        metadata: { transfer_ref: draft.transfer_ref, from: draft.from_site_name, to: draft.to_site_name, received_lines: enrichedReceived },
        environment: draft.environment || 'LIVE',
      });
    }
  }

  await base44.asServiceRole.entities.TransferDraft.update(draft_id, {
    status: 'RECEIVED',
    received_by: postedBy,
    received_at: now,
    received_lines: enrichedReceived,
    in_movement_ids: inIds,
    has_discrepancy: hasDiscrepancy,
  });

  return Response.json({ success: true, draft_id, status: 'RECEIVED', has_discrepancy: hasDiscrepancy, in_movement_ids: inIds });
});