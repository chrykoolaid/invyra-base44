import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

/**
 * approveStockOutRecordV2 — HARDENED APPROVAL WITH STOCK GUARDS
 * 
 * Strict rules:
 * 1. Only SUBMITTED records can be approved
 * 2. Check available stock BEFORE posting
 * 3. Block if qty > available stock (unless config allows negative)
 * 4. Check site-level stock if site_id exists
 * 5. Do NOT silently clamp stock
 * 6. Create StockMovement on approval
 * 7. Update InventoryItem.stock and stock_per_site
 * 8. Update AuditLog
 * 9. Link StockMovement back to record
 */

Deno.serve(async (req) => {
  const base44 = createClientFromRequest(req);
  const user = await base44.auth.me();
  if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

  const role = (user.role || '').toLowerCase();
  const isSupervisorPlus = ['supervisor', 'manager', 'admin', 'owner'].includes(role);
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

  // GUARD: Check site-level stock if location/site is specified.
  // Prototype seed data can have item.stock populated before stock_per_site is initialized.
  // In that single-site fallback case, use total stock as the site stock baseline instead
  // of treating a missing site key as zero. If stock_per_site already has other site
  // keys, a missing selected site remains zero and is blocked normally.
  const getSiteStockContext = () => {
    if (!record.site_id) {
      return null;
    }

    const sitePerStock = item.stock_per_site || {};
    const siteKeys = Object.keys(sitePerStock);
    const hasExplicitSiteStock = Object.prototype.hasOwnProperty.call(sitePerStock, record.site_id);
    const siteStockBefore = hasExplicitSiteStock
      ? Number(sitePerStock[record.site_id] || 0)
      : (siteKeys.length === 0 ? currentStock : 0);

    return {
      sitePerStock,
      siteStockBefore,
      siteStockAfter: siteStockBefore - qty,
      stockSource: hasExplicitSiteStock
        ? 'stock_per_site'
        : (siteKeys.length === 0 ? 'global_stock_single_site_fallback' : 'missing_site_stock'),
    };
  };

  const siteStockContext = getSiteStockContext();
  if (siteStockContext && siteStockContext.siteStockAfter < 0 && !allowNegative) {
    return Response.json({
      error: `Insufficient stock at site/location. Site: ${record.site_id}, Current: ${siteStockContext.siteStockBefore}, Requested: ${qty}, Projected: ${siteStockContext.siteStockAfter}. Negative stock not allowed.`,
      site_id: record.site_id,
      site_stock_before: siteStockContext.siteStockBefore,
      requested_qty: qty,
      site_stock_after: siteStockContext.siteStockAfter,
      stock_source: siteStockContext.stockSource,
    }, { status: 409 });
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
      const siteKey = record.site_id;
      const currentPerSite = { ...(item.stock_per_site || {}) };
      const siteStockBefore = siteStockContext?.siteStockBefore ?? Number(currentPerSite[siteKey] || 0);
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
      posted_by: user.email || user.id,
      posted_at: now,
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

    // Create alerts for high-value records and repeated SKU patterns (default threshold: ₱5,000)
    const createAlertWithAudit = async (payload) => {
      const existing = await base44.asServiceRole.entities.StockOutAlert.filter({ dedupe_key: payload.dedupe_key, environment: record.environment || 'LIVE' }, '-created_date', 1);
      if (existing?.[0] && ['OPEN', 'ACKNOWLEDGED'].includes(existing[0].status)) return existing[0];
      const alert = await base44.asServiceRole.entities.StockOutAlert.create({ ...payload, status: 'OPEN', environment: record.environment || 'LIVE' });
      await base44.asServiceRole.entities.AuditLog.create({
        item_id: record.item_id, sku: record.sku, item_name: record.item_name,
        change_type: 'STOCK_WASTE', field_name: 'stock_out_alert', old_value: '', new_value: alert.alert_type,
        changed_by: user.email || user.id, actor_role: role, source_module: 'StockOutAlerts',
        action_type: 'STOCK_OUT_ALERT_CREATED', linked_source_record: record_id, source_record_id: alert.id,
        notes: `Alert created: ${alert.alert_type}. ${payload.trigger_reason}`, environment: record.environment || 'LIVE',
      });
      return alert;
    };

    if (estimatedValue > 5000) {
      const alertType = record.stock_out_class === 'WASTAGE' ? 'HIGH_VALUE_WASTAGE' : 'HIGH_VALUE_STORE_USE';
      await createAlertWithAudit({
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
              });
    }

    const since = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    const recentSameSku = await base44.asServiceRole.entities.StockOutRecord.filter({
      sku: record.sku,
      stock_out_class: record.stock_out_class,
      environment: record.environment || 'LIVE',
    }, '-created_date', 25);
    const repeatedCount = (recentSameSku || []).filter((r) =>
      ['POSTED', 'REVERSED', 'AMENDED'].includes(r.status) && new Date(r.created_date || r.posted_at || now) >= since
    ).length;
    if (repeatedCount >= 3) {
      const repeatedType = record.stock_out_class === 'WASTAGE' ? 'REPEATED_SKU_WASTAGE' : 'REPEATED_SKU_STORE_USE';
      const windowKey = since.toISOString().slice(0, 10);
      await createAlertWithAudit({
        alert_type: repeatedType,
        severity: 'MEDIUM',
        linked_record_id: record_id,
        trigger_reason: `${repeatedCount} ${record.stock_out_class.toLowerCase()} records for SKU ${record.sku} within 7 days`,
        dedupe_key: `${repeatedType}_${record.sku}_${windowKey}`,
        metadata: { item_id: record.item_id, sku: record.sku, item_name: record.item_name, quantity: qty, count_7d: repeatedCount, value: estimatedValue },
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