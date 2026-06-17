import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

/**
 * reverseStockOutRecord
 * Reverses an APPROVED/POSTED stock-out record.
 * Creates a counter movement and restores stock.
 */

Deno.serve(async (req) => {
  const base44 = createClientFromRequest(req);
  const user = await base44.auth.me();
  if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

  const role = (user.role || '').toLowerCase();
  const isManager = ['manager', 'admin'].includes(role);
  if (!isManager) {
    return Response.json({ error: 'Forbidden: Manager or Admin required to reverse' }, { status: 403 });
  }

  const { record_id, reason } = await req.json();
  if (!record_id || !reason) return Response.json({ error: 'record_id and reason required' }, { status: 400 });

  // Fetch record
  const records = await base44.asServiceRole.entities.StockOutRecord.filter({ id: record_id });
  const record = records[0];
  if (!record) return Response.json({ error: 'Record not found' }, { status: 404 });
  if (record.status !== 'POSTED') {
    return Response.json({ error: `Only POSTED records can be reversed. Current: ${record.status}` }, { status: 409 });
  }

  const now = new Date().toISOString();

  try {
    // Fetch item for current stock
    const items = await base44.asServiceRole.entities.InventoryItem.filter({ id: record.item_id });
    const item = items[0];
    if (!item) return Response.json({ error: 'InventoryItem not found' }, { status: 404 });

    // Get latest movement to calculate balance
    const movements = await base44.asServiceRole.entities.StockMovement.filter(
      { item_id: record.item_id, status: 'POSTED', environment: record.environment || 'LIVE' },
      '-created_date', 1
    );
    const balanceBefore = movements[0]?.balance_after ?? item.stock;
    const balanceAfter = balanceBefore + record.quantity; // Restore

    // Create reversal movement
    const reversalMovement = await base44.asServiceRole.entities.StockMovement.create({
      site_id: record.site_id || '',
      item_id: record.item_id,
      sku: record.sku,
      item_name: record.item_name,
      movement_type: 'REVERSAL',
      direction: 'IN',
      qty: record.quantity,
      balance_before: balanceBefore,
      balance_after: balanceAfter,
      source_ref: record_id,
      source_type: 'WASTAGE',
      reversal_of: record.linked_movement_id || '',
      notes: `Reversal of stock-out ${record_id}. Reason: ${reason}`,
      status: 'POSTED',
      posted_by: user.email || user.id,
      actor_role: role,
      environment: record.environment || 'LIVE',
    });

    // Update InventoryItem stock back
    await base44.asServiceRole.entities.InventoryItem.update(record.item_id, {
      stock: balanceAfter,
    });

    // Update record to REVERSED
    await base44.asServiceRole.entities.StockOutRecord.update(record_id, {
      status: 'REVERSED',
    });

    // Audit
    await base44.asServiceRole.entities.AuditLog.create({
      item_id: record.item_id,
      sku: record.sku,
      item_name: record.item_name,
      change_type: 'REVERSAL',
      field_name: 'status',
      old_value: 'POSTED',
      new_value: 'REVERSED',
      changed_by: user.email || user.id,
      actor_role: role,
      source_module: 'StockOut',
      action_type: 'REVERSED',
      linked_movement_id: reversalMovement.id,
      linked_source_record: record_id,
      source_record_id: record_id,
      notes: `Stock restored: ${record.quantity} units. Balance: ${balanceBefore} → ${balanceAfter}. Reason: ${reason}`,
      environment: record.environment || 'LIVE',
    });

    // Create alert for reversal
    await base44.asServiceRole.entities.StockOutAlert.create({
      alert_type: 'REVERSAL_AFTER_POST',
      severity: 'MEDIUM',
      status: 'OPEN',
      linked_record_id: record_id,
      trigger_reason: `Stock-out reversal posted. Reason: ${reason}`,
      dedupe_key: `REVERSAL_${record_id}`,
      metadata: {
        sku: record.sku,
        item_name: record.item_name,
        quantity: record.quantity,
        value: record.estimated_value,
      },
      environment: 'LIVE',
    });

    return Response.json({
      success: true,
      record_id,
      status: 'REVERSED',
      reversal_movement_id: reversalMovement.id,
      balance_before: balanceBefore,
      balance_after: balanceAfter,
    });
  } catch (error) {
    console.error('Reversal failed:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});