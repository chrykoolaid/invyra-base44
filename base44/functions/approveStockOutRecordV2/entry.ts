import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

/**
 * approveStockOutRecordV2 — HARDENED APPROVAL WITH STOCK GUARDS
 * 
 * Strict rules:
 * 1. Only SUBMITTED records can be approved
 * 2. Check available stock BEFORE posting
 * 3. Block if qty > available stock (unless config allows negative)
 * 4. Do NOT silently clamp stock
 * 5. Create StockMovement on approval
 * 6. Update InventoryItem.stock
 * 7. Update AuditLog
 * 8. Link StockMovement back to record
 */

Deno.serve(async (req) => {
  const base44 = createClientFromRequest(req);
  const user = await base44.auth.me();
  if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

  const role = (user.role || '').toLowerCase();
  const isSupervisorPlus = ['supervisor', 'manager', 'admin'].includes(role);
  if (!isSupervisorPlus) {
    return Response.json({ error: 'Forbidden: Supervisor or Manager required' }, { status: 403 });
  }

  const { record_id } = await req.json();
  if (!record_id) return Response.json({ error: 'record_id required' }, { status: 400 });

  // Fetch the record
  const records = await base44.asServiceRole.entities.StockOutRecord.filter({ id: record_id });
  const record = records[0];
  if (!record) return Response.json({ error: 'Record not found' }, { status: 404 });
  if (record.status !== 'SUBMITTED') {
    return Response.json({ error: `Only SUBMITTED records can be approved. Current: ${record.status}` }, { status: 409 });
  }

  // Fetch InventoryItem for stock check
  const items = await base44.asServiceRole.entities.InventoryItem.filter({ id: record.item_id });
  const item = items[0];
  if (!item) return Response.json({ error: 'InventoryItem not found' }, { status: 404 });

  // Get global inventory settings
  const configs = await base44.asServiceRole.entities.SystemConfiguration.filter({ environment: record.environment || 'LIVE' });
  const config = configs[0];
  const allowNegative = config?.inventory_rules?.allow_negative_stock ?? false;

  const currentStock = item.stock || 0;
  const qty = record.quantity || 0;
  const projectedStock = currentStock - qty;

  // GUARD: Block if insufficient stock (unless negative is allowed)
  if (projectedStock < 0 && !allowNegative) {
    return Response.json({
      error: `Insufficient stock. Current: ${currentStock}, Requested: ${qty}, Projected: ${projectedStock}. Negative stock not allowed.`,
      current_stock: currentStock,
      requested_qty: qty,
      projected_stock: projectedStock,
    }, { status: 409 });
  }

  // GUARD: Check site-level stock if location/site is specified
  if (record.site_id) {
    const sitePerStock = item.stock_per_site || {};
    const siteStockBefore = sitePerStock[record.site_id] || 0;
    const siteStockAfter = siteStockBefore - qty;

    if (siteStockAfter < 0 && !allowNegative) {
      return Response.json({
        error: `Insufficient stock at site/location. Site: ${record.site_id}, Current: ${siteStockBefore}, Requested: ${qty}, Projected: ${siteStockAfter}. Negative stock not allowed.`,
        site_id: record.site_id,
        site_stock_before: siteStockBefore,
        requested_qty: qty,
        site_stock_after: siteStockAfter,
      }, { status: 409 });
    }
  }

  const now = new Date().toISOString();
  const costPerUnit = item.cost_per_unit || 0;
  const estimatedValue = qty * costPerUnit;

  try {
    // Get latest movement for balance_before
    const movements = await base44.asServiceRole.entities.StockMovement.filter(
      { item_id: record.item_id, status: 'POSTED', environment: record.environment || 'LIVE' },
      '-created_date', 1
    );
    const balanceBefore = movements[0]?.balance_after ?? currentStock;
    const balanceAfter = balanceBefore - qty;

    // Create stock movement
    const movement = await base44.asServiceRole.entities.StockMovement.create({
      site_id: record.site_id || '',
      item_id: record.item_id,
      sku: record.sku,
      item_name: record.item_name,
      movement_type: record.stock_out_class === 'STORE_USE' ? 'ADJUST' : 'WASTE',
      direction: 'OUT',
      qty,
      balance_before: balanceBefore,
      balance_after: balanceAfter,
      source_ref: record.id,
      source_type: 'WASTAGE',
      notes: `${record.stock_out_class} approved: ${record.reason_category}. ${record.reason_notes || ''}`,
      status: 'POSTED',
      posted_by: user.email || user.id,
      actor_role: role,
      environment: record.environment || 'LIVE',
    });

    // Update InventoryItem stock and stock_per_site
    const updatePayload = { stock: balanceAfter };
    if (record.site_id) {
      const currentPerSite = item.stock_per_site || {};
      const siteKey = record.site_id;
      const siteStockBefore = currentPerSite[siteKey] || 0;
      const siteStockAfter = siteStockBefore - qty;
      currentPerSite[siteKey] = siteStockAfter;
      updatePayload.stock_per_site = currentPerSite;
    }
    await base44.asServiceRole.entities.InventoryItem.update(record.item_id, updatePayload);

    // Update StockOutRecord to POSTED
    await base44.asServiceRole.entities.StockOutRecord.update(record_id, {
      status: 'POSTED',
      approved_by: user.id || user.email,
      approved_at: now,
      linked_movement_id: movement.id,
    });

    // Create audit entry
    await base44.asServiceRole.entities.AuditLog.create({
      item_id: record.item_id,
      sku: record.sku,
      item_name: record.item_name,
      change_type: record.stock_out_class === 'STORE_USE' ? 'STOCK_ADJUST' : 'STOCK_WASTE',
      field_name: 'status',
      old_value: 'SUBMITTED',
      new_value: 'POSTED',
      changed_by: user.email || user.id,
      actor_role: role,
      source_module: 'StockOut',
      action_type: 'APPROVED',
      linked_movement_id: movement.id,
      linked_source_record: record_id,
      source_record_id: record_id,
      notes: `Stock-out approved: ${qty} units of ${record.sku}. Balance: ${balanceBefore} → ${balanceAfter}`,
      environment: record.environment || 'LIVE',
    });

    // Create alert for high-value records (threshold: ₱10,000)
    if (estimatedValue > 10000) {
      const alertType = record.stock_out_class === 'WASTAGE' ? 'HIGH_VALUE_WASTAGE' : 'HIGH_VALUE_STORE_USE';
      await base44.asServiceRole.entities.StockOutAlert.create({
        alert_type: alertType,
        severity: estimatedValue > 50000 ? 'CRITICAL' : 'HIGH',
        status: 'OPEN',
        linked_record_id: record_id,
        trigger_reason: `High-value ${record.stock_out_class.toLowerCase()}: ₱${estimatedValue.toFixed(0)}`,
        dedupe_key: `${alertType}_${record.sku}_${record_id}`,
        metadata: {
          sku: record.sku,
          item_name: record.item_name,
          quantity: qty,
          value: estimatedValue,
          reason: record.reason_category,
          location: record.location,
        },
        environment: 'LIVE',
      });
    }

    return Response.json({
      success: true,
      record_id,
      status: 'POSTED',
      movement_id: movement.id,
      balance_before: balanceBefore,
      balance_after: balanceAfter,
      cost_impact: estimatedValue,
    });
  } catch (error) {
    console.error('Approval posting failed:', error);
    return Response.json({ error: error.message || 'Approval failed' }, { status: 500 });
  }
});