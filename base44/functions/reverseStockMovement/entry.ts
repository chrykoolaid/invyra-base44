import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

/**
 * reverseStockMovement
 * Governed reversal of a StockMovement ledger entry.
 * Requires Manager/Admin. Creates a counter-movement and updates InventoryItem stock.
 * Only POSTED movements can be reversed. REVERSAL movements cannot be reversed again.
 */
Deno.serve(async (req) => {
  const base44 = createClientFromRequest(req);
  const user = await base44.auth.me();
  if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

  const role = (user.role || '').toLowerCase();
  if (!['manager', 'admin', 'owner'].includes(role)) {
    return Response.json({ error: 'Forbidden: Manager or Admin required to reverse a movement' }, { status: 403 });
  }

  const { movement_id, reason } = await req.json();
  if (!movement_id || !reason?.trim()) {
    return Response.json({ error: 'movement_id and reason are required' }, { status: 400 });
  }

  const movements = await base44.asServiceRole.entities.StockMovement.filter({ id: movement_id });
  const original = movements[0];
  if (!original) return Response.json({ error: 'Movement not found' }, { status: 404 });
  if (original.status === 'VOIDED') return Response.json({ error: 'Movement is already voided' }, { status: 409 });
  if (original.movement_type === 'REVERSAL') return Response.json({ error: 'Cannot reverse a REVERSAL movement' }, { status: 409 });

  const now = new Date().toISOString();

  // Determine counter-direction
  const counterDirection = original.direction === 'IN' ? 'OUT' : 'IN';

  // Get latest movement balance for this item to compute new balance
  const latestMov = await base44.asServiceRole.entities.StockMovement.filter(
    { item_id: original.item_id, status: 'POSTED', environment: original.environment || 'LIVE' },
    '-created_date', 1
  );
  const balanceBefore = latestMov[0]?.balance_after ?? 0;
  const balanceAfter = counterDirection === 'IN'
    ? balanceBefore + original.qty
    : Math.max(0, balanceBefore - original.qty);

  // Create the counter-movement
  const reversal = await base44.asServiceRole.entities.StockMovement.create({
    site_id: original.site_id || '',
    item_id: original.item_id,
    sku: original.sku,
    item_name: original.item_name,
    movement_type: 'REVERSAL',
    direction: counterDirection,
    qty: original.qty,
    balance_before: balanceBefore,
    balance_after: balanceAfter,
    location_id: original.location_id || '',
    storage_area_id: original.storage_area_id || '',
    source_ref: movement_id,
    source_type: original.source_type || 'MANUAL',
    reversal_of: movement_id,
    notes: `Governed reversal of movement ${movement_id}. Reason: ${reason.trim()}`,
    status: 'POSTED',
    posted_by: user.email || user.full_name || user.id,
    actor_role: role,
    environment: original.environment || 'LIVE',
  });

  // Update InventoryItem stock
  const items = await base44.asServiceRole.entities.InventoryItem.filter({ id: original.item_id });
  const item = items[0];
  if (item) {
    await base44.asServiceRole.entities.InventoryItem.update(original.item_id, {
      stock: balanceAfter,
    });
  }

  // Mark original as VOIDED
  await base44.asServiceRole.entities.StockMovement.update(movement_id, { status: 'VOIDED' });

  // Audit log
  await base44.asServiceRole.entities.AuditLog.create({
    item_id: original.item_id,
    sku: original.sku,
    item_name: original.item_name,
    change_type: 'REVERSAL',
    field_name: 'movement_status',
    old_value: 'POSTED',
    new_value: 'VOIDED',
    changed_by: user.email || user.full_name || user.id,
    actor_role: role,
    source_module: 'Movements',
    action_type: 'MOVEMENT_REVERSED',
    linked_movement_id: reversal.id,
    linked_source_record: movement_id,
    source_record_id: movement_id,
    notes: `Movement reversed. Balance: ${balanceBefore} → ${balanceAfter}. Reason: ${reason.trim()}`,
    environment: original.environment || 'LIVE',
  });

  return Response.json({
    success: true,
    original_movement_id: movement_id,
    reversal_movement_id: reversal.id,
    balance_before: balanceBefore,
    balance_after: balanceAfter,
    status: 'VOIDED',
  });
});