import { base44 } from '@/api/base44Client';
import { ENV_LIVE } from '@/lib/envFilter';

function actorName(user) {
  return user?.email || user?.full_name || 'Unknown';
}

function actorRole(user) {
  return user?.role || user?.app_role || 'unknown';
}

function auditChangeType(movementType) {
  switch (movementType) {
    case 'RECEIVE': return 'STOCK_RECEIVE';
    case 'WASTE': return 'STOCK_WASTE';
    case 'ADJUST': return 'STOCK_ADJUST';
    case 'SALE': return 'STOCK_SALE';
    case 'TRANSFER_IN':
    case 'TRANSFER_OUT': return 'STOCK_TRANSFER';
    case 'STOCKTAKE': return 'STOCKTAKE_COMMIT';
    case 'REVERSAL': return 'REVERSAL';
    default: return 'QUANTITY_UPDATE';
  }
}

function getSiteBalance(item, siteId) {
  if (siteId && item?.stock_per_site && Object.prototype.hasOwnProperty.call(item.stock_per_site, siteId)) {
    return Number(item.stock_per_site[siteId] || 0);
  }
  return Number(item?.stock || 0);
}

function buildStockUpdate(item, siteId, newSiteBalance, fallbackTotal) {
  const hasSiteCache = siteId && item?.stock_per_site && typeof item.stock_per_site === 'object';
  if (!hasSiteCache) {
    return { stock: fallbackTotal };
  }

  const nextStockPerSite = { ...item.stock_per_site, [siteId]: newSiteBalance };
  const nextTotal = Object.values(nextStockPerSite).reduce((sum, value) => sum + Number(value || 0), 0);
  return { stock_per_site: nextStockPerSite, stock: nextTotal };
}

async function safeDelete(entity, record) {
  if (!record?.id || !entity?.delete) return;
  try {
    await entity.delete(record.id);
  } catch (error) {
    console.error('Inventory rollback cleanup failed', error);
  }
}

export async function postInventoryMovement({
  item,
  movementType,
  direction,
  qty,
  sourceType,
  sourceRef,
  sourceModule,
  notes = '',
  siteId,
  environment = ENV_LIVE,
  user = null,
  sourceRecordId = '',
  allowNegative = false,
  reversalOf = '',
}) {
  if (!item?.id) throw new Error('Inventory movement blocked: item is required.');
  const movementQty = Number(qty || 0);
  if (!movementQty || movementQty <= 0) throw new Error('Inventory movement blocked: quantity must be greater than zero.');

  const activeUser = user || await base44.auth.me();
  const postedBy = actorName(activeUser);
  const role = actorRole(activeUser);
  const resolvedSiteId = siteId || item.site_id || '';
  const balanceBefore = getSiteBalance(item, resolvedSiteId);
  const delta = direction === 'IN' ? movementQty : -movementQty;
  const balanceAfter = balanceBefore + delta;

  if (!allowNegative && balanceAfter < 0) {
    throw new Error(`Inventory movement blocked: ${item.name || item.sku} has ${balanceBefore} on hand, cannot deduct ${movementQty}.`);
  }

  const currentTotal = Number(item.stock || 0);
  const nextTotalFallback = currentTotal + delta;
  if (!allowNegative && nextTotalFallback < 0 && !item.stock_per_site) {
    throw new Error(`Inventory movement blocked: ${item.name || item.sku} has ${currentTotal} total stock, cannot deduct ${movementQty}.`);
  }

  const stockUpdate = buildStockUpdate(item, resolvedSiteId, balanceAfter, nextTotalFallback);
  let movement = null;
  let audit = null;

  try {
    movement = await base44.entities.StockMovement.create({
      site_id: resolvedSiteId,
      item_id: item.id,
      sku: item.sku || '',
      item_name: item.name || '',
      movement_type: movementType,
      direction,
      qty: movementQty,
      balance_before: balanceBefore,
      balance_after: balanceAfter,
      source_ref: sourceRef,
      source_type: sourceType,
      reversal_of: reversalOf,
      notes,
      status: 'POSTED',
      posted_by: postedBy,
      actor_role: role,
      environment,
    });

    audit = await base44.entities.AuditLog.create({
      item_id: item.id,
      sku: item.sku || '',
      item_name: item.name || '',
      change_type: auditChangeType(movementType),
      action_type: movementType,
      field_name: 'stock',
      old_value: String(balanceBefore),
      new_value: String(balanceAfter),
      changed_by: postedBy,
      actor_role: role,
      source_module: sourceModule || sourceType,
      linked_movement_id: movement.id,
      linked_source_record: sourceRecordId || sourceRef || '',
      notes,
      environment,
    });

    await base44.entities.InventoryItem.update(item.id, { ...stockUpdate, environment });
    return { movement, audit, balance_before: balanceBefore, balance_after: balanceAfter, stock_update: stockUpdate };
  } catch (error) {
    await safeDelete(base44.entities.AuditLog, audit);
    await safeDelete(base44.entities.StockMovement, movement);
    throw error;
  }
}

export async function postInventoryTransfer({
  item,
  fromSite,
  toSite,
  qty,
  sourceRef,
  notes = '',
  environment = ENV_LIVE,
  user = null,
}) {
  if (!item?.id) throw new Error('Transfer blocked: item is required.');
  if (!fromSite || !toSite || fromSite === toSite) throw new Error('Transfer blocked: source and destination sites must be different.');
  const transferQty = Number(qty || 0);
  if (!transferQty || transferQty <= 0) throw new Error('Transfer blocked: quantity must be greater than zero.');

  const stockPerSite = item.stock_per_site || {};
  const fromBalance = Number(stockPerSite[fromSite] ?? item.stock ?? 0);
  const toBalance = Number(stockPerSite[toSite] ?? 0);
  if (transferQty > fromBalance) {
    throw new Error(`Transfer blocked: source site has ${fromBalance} on hand, cannot transfer ${transferQty}.`);
  }

  const activeUser = user || await base44.auth.me();
  const postedBy = actorName(activeUser);
  const role = actorRole(activeUser);
  const newFromBalance = fromBalance - transferQty;
  const newToBalance = toBalance + transferQty;
  const newStockPerSite = { ...stockPerSite, [fromSite]: newFromBalance, [toSite]: newToBalance };
  const newTotalStock = Object.values(newStockPerSite).reduce((sum, value) => sum + Number(value || 0), 0);
  const created = [];

  try {
    const outMovement = await base44.entities.StockMovement.create({
      site_id: fromSite,
      item_id: item.id,
      sku: item.sku || '',
      item_name: item.name || '',
      movement_type: 'TRANSFER_OUT',
      direction: 'OUT',
      qty: transferQty,
      balance_before: fromBalance,
      balance_after: newFromBalance,
      source_ref: sourceRef,
      source_type: 'TRANSFER',
      notes: notes || `Transfer to site ${toSite}`,
      status: 'POSTED',
      posted_by: postedBy,
      actor_role: role,
      environment,
    });
    created.push(['movement', outMovement]);

    const outAudit = await base44.entities.AuditLog.create({
      item_id: item.id,
      sku: item.sku || '',
      item_name: item.name || '',
      change_type: 'STOCK_TRANSFER',
      action_type: 'TRANSFER_OUT',
      field_name: 'stock_per_site',
      old_value: String(fromBalance),
      new_value: String(newFromBalance),
      changed_by: postedBy,
      actor_role: role,
      source_module: 'Transfers',
      linked_movement_id: outMovement.id,
      linked_source_record: sourceRef,
      notes: notes || `Transfer to site ${toSite}`,
      environment,
    });
    created.push(['audit', outAudit]);

    const inMovement = await base44.entities.StockMovement.create({
      site_id: toSite,
      item_id: item.id,
      sku: item.sku || '',
      item_name: item.name || '',
      movement_type: 'TRANSFER_IN',
      direction: 'IN',
      qty: transferQty,
      balance_before: toBalance,
      balance_after: newToBalance,
      source_ref: sourceRef,
      source_type: 'TRANSFER',
      notes: notes || `Transfer from site ${fromSite}`,
      status: 'POSTED',
      posted_by: postedBy,
      actor_role: role,
      environment,
    });
    created.push(['movement', inMovement]);

    const inAudit = await base44.entities.AuditLog.create({
      item_id: item.id,
      sku: item.sku || '',
      item_name: item.name || '',
      change_type: 'STOCK_TRANSFER',
      action_type: 'TRANSFER_IN',
      field_name: 'stock_per_site',
      old_value: String(toBalance),
      new_value: String(newToBalance),
      changed_by: postedBy,
      actor_role: role,
      source_module: 'Transfers',
      linked_movement_id: inMovement.id,
      linked_source_record: sourceRef,
      notes: notes || `Transfer from site ${fromSite}`,
      environment,
    });
    created.push(['audit', inAudit]);

    await base44.entities.InventoryItem.update(item.id, {
      stock_per_site: newStockPerSite,
      stock: newTotalStock,
      environment,
    });

    return { outMovement, inMovement, outAudit, inAudit, balance_before: { from: fromBalance, to: toBalance }, balance_after: { from: newFromBalance, to: newToBalance } };
  } catch (error) {
    for (const [type, record] of [...created].reverse()) {
      await safeDelete(type === 'audit' ? base44.entities.AuditLog : base44.entities.StockMovement, record);
    }
    throw error;
  }
}
