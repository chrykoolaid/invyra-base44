/**
 * TrainingContext — v2
 *
 * TRUE environment-separated training system.
 * All records are persisted to the real Base44 database, tagged with environment:"TRAINING".
 * LIVE records are never touched — all queries filter by environment:"TRAINING".
 *
 * Improvements over v1:
 *  - Real DB persistence (environment:"TRAINING" scoped)
 *  - Full audit fields: actor, actor_role, source_module, balance_before, balance_after, environment
 *  - Over-deduction is BLOCKED (not silently clamped)
 *  - Transfer balance fixed: snapshot stock before both legs post
 *  - Reset clears all TRAINING records from DB and re-seeds fresh ones
 */
import { createContext, useContext, useState, useCallback, useEffect } from 'react';
import { base44 } from '@/api/base44Client';

const ENV = 'TRAINING';
const TRAINING_SITE_ID = 'TRAINING-SITE-MAIN';

export const TRAINING_SEED_DATA = [
  { sku: 'CHM-001', name: 'Detergent 5L',        stock: 4,   unit: 'pcs', reorder_point: 5,   reorder_qty: 20,  cost_per_unit: 280, preferred_supplier: 'ChemSupply Co',        is_active: true, environment: ENV, site_id: TRAINING_SITE_ID },
  { sku: 'CHM-002', name: 'Fabric Softener 20L', stock: 18,  unit: 'pcs', reorder_point: 10,  reorder_qty: 12,  cost_per_unit: 520, preferred_supplier: 'ProWash Ingredients',  is_active: true, environment: ENV, site_id: TRAINING_SITE_ID },
  { sku: 'CHM-003', name: 'Bleach 5L',           stock: 12,  unit: 'pcs', reorder_point: 8,   reorder_qty: 18,  cost_per_unit: 160, preferred_supplier: 'LaundryChem Direct',   is_active: true, environment: ENV, site_id: TRAINING_SITE_ID },
  { sku: 'CHM-004', name: 'Stain Remover 2L',    stock: 5,   unit: 'pcs', reorder_point: 6,   reorder_qty: 12,  cost_per_unit: 210, preferred_supplier: 'ProWash Ingredients',  is_active: true, environment: ENV, site_id: TRAINING_SITE_ID },
  { sku: 'OPS-001', name: 'Gloves Disposable',   stock: 340, unit: 'pcs', reorder_point: 100, reorder_qty: 200, cost_per_unit: 4,   preferred_supplier: 'OperationsPlus',       is_active: true, environment: ENV, site_id: TRAINING_SITE_ID },
  { sku: 'PKG-001', name: 'Packaging Rolls',     stock: 0,   unit: 'pcs', reorder_point: 10,  reorder_qty: 50,  cost_per_unit: 90,  preferred_supplier: null,                   is_active: true, environment: ENV, site_id: TRAINING_SITE_ID },
];

export const TRAINING_SITES = [
  { id: 'TRAINING-SITE-MAIN',  name: 'Main Site (Training)' },
  { id: 'TRAINING-SITE-NORTH', name: 'North Branch (Training)' },
];

const TrainingContext = createContext(null);

function trainingAuditChangeType(movementType) {
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

export function TrainingProvider({ children }) {
  const [items, setItems]       = useState([]);
  const [movements, setMovements] = useState([]);
  const [orders, setOrders]     = useState([]);
  const [log, setLog]           = useState([]);
  const [loading, setLoading]   = useState(true);
  const [actor, setActor]       = useState(null);        // authenticated user
  const [actorRole, setActorRole] = useState('staff');   // their role

  // Load actor once
  useEffect(() => {
    base44.auth.me().then(u => {
      if (u) { setActor(u); setActorRole(u.role ?? 'staff'); }
    }).catch(() => {});
  }, []);

  const addLog = useCallback((msg, details = null) => {
    setLog(prev => [{
      id: Date.now(),
      ts: new Date().toLocaleTimeString(),
      msg,
      details, // { actor, role, before, after, type, environment }
    }, ...prev.slice(0, 99)]);
  }, []);

  // Load training data from DB
  const loadTrainingData = useCallback(async () => {
    setLoading(true);
    const [dbItems, dbMovements, dbOrders] = await Promise.all([
      base44.entities.InventoryItem.filter({ environment: ENV, is_active: true }, 'name', 200),
      base44.entities.StockMovement.filter({ environment: ENV }, '-created_date', 200),
      base44.entities.PurchaseOrder.filter({ environment: ENV }, '-created_date', 100),
    ]);
    setItems(dbItems || []);
    setMovements(dbMovements || []);
    setOrders(dbOrders || []);
    setLoading(false);
  }, []);

  useEffect(() => { loadTrainingData(); }, [loadTrainingData]);

  // ─── adjustStock ──────────────────────────────────────────────────────────
  // STOCK-001 fix: throws if over-deduction attempted — no silent clamping.
  // LEDGER-001 fix: persists full audit fields to real DB with environment tag.
  // TRANSFER-001 fix: caller must pass explicit `balanceBefore` for transfer legs.
  const adjustStock = useCallback(async (itemId, delta, movementType, direction, ref, notes, sourceType = 'MANUAL', balanceBeforeOverride = null) => {
    const item = items.find(i => i.id === itemId);
    if (!item) throw new Error(`Training item ${itemId} not found`);

    const balanceBefore = balanceBeforeOverride !== null ? balanceBeforeOverride : (item.stock ?? 0);
    const balanceAfter  = balanceBefore + delta;

    // STOCK-001: Block over-deduction
    if (balanceAfter < 0) {
      const errMsg = `Over-deduction blocked: ${item.name} has ${balanceBefore} units but deduction of ${Math.abs(delta)} was attempted. Adjust quantity to ≤ ${balanceBefore}.`;
      addLog(`❌ BLOCKED: ${errMsg}`, { type: 'ERROR', environment: ENV });
      throw new Error(errMsg);
    }

    // Persist movement to real DB with full audit fields (Blocker 2: formal AuditLog record)
    const movement = await base44.entities.StockMovement.create({
      site_id: item.site_id || TRAINING_SITE_ID,
      item_id: itemId,
      sku: item.sku,
      item_name: item.name,
      movement_type: movementType,
      direction,
      qty: Math.abs(delta),
      balance_before: balanceBefore,
      balance_after: balanceAfter,
      source_ref: ref,
      source_type: sourceType,
      notes: `[TRAINING] ${notes}`,
      status: 'POSTED',
      posted_by: actor?.email ?? 'training-user',
      actor_role: actorRole,
      environment: ENV,
    });

    // Persist formal AuditLog entry — Blocker 2
    await base44.entities.AuditLog.create({
      item_id: itemId,
      sku: item.sku,
      item_name: item.name,
      change_type: trainingAuditChangeType(movementType),
      action_type: movementType,
      field_name: 'stock',
      old_value: String(balanceBefore),
      new_value: String(balanceAfter),
      changed_by: actor?.email ?? 'training-user',
      actor_role: actorRole,
      source_module: `Training/${movementType}`,
      linked_movement_id: movement.id,
      linked_source_record: ref,
      notes: `[TRAINING] ${notes}`,
      environment: ENV,
    });

    // Update TRAINING inventory item stock in DB
    await base44.entities.InventoryItem.update(itemId, { stock: balanceAfter, environment: ENV });

    // Update local state
    setItems(prev => prev.map(i => i.id === itemId ? { ...i, stock: balanceAfter } : i));
    setMovements(prev => [movement, ...prev]);

    addLog(`[${movementType}] ${item.name} ${direction === 'IN' ? '+' : '-'}${Math.abs(delta)} → balance: ${balanceAfter}`, {
      actor: actor?.email ?? 'training-user',
      role: actorRole,
      before: balanceBefore,
      after: balanceAfter,
      type: movementType,
      environment: ENV,
      movement_id: movement.id,
    });

    return movement;
  }, [items, actor, actorRole, addLog]);

  // ─── createDraftOrder ─────────────────────────────────────────────────────
  const createDraftOrder = useCallback(async (supplier, lines) => {
    const orderNum = `PO-TRN-${String(Date.now()).slice(-6)}`;
    const po = await base44.entities.PurchaseOrder.create({
      order_number: orderNum,
      supplier,
      status: 'Draft',
      lines,
      source: 'Training',
      environment: ENV,
    });
    setOrders(prev => [po, ...prev]);
    addLog(`[DRAFT PO] ${orderNum} created for ${supplier} · ${lines.length} line(s)`, {
      actor: actor?.email ?? 'training-user',
      role: actorRole,
      type: 'DRAFT_PO',
      environment: ENV,
    });
    return po;
  }, [actor, actorRole, addLog]);

  const updateOrderStatus = useCallback(async (orderId, status) => {
    await base44.entities.PurchaseOrder.update(orderId, { status, environment: ENV });
    setOrders(prev => prev.map(o => o.id === orderId ? { ...o, status } : o));
    const o = orders.find(x => x.id === orderId);
    addLog(`[ORDER] ${o?.order_number} → ${status}`, {
      actor: actor?.email ?? 'training-user',
      role: actorRole,
      type: 'ORDER_STATUS',
      environment: ENV,
    });
  }, [orders, actor, actorRole, addLog]);

  // ─── reset ────────────────────────────────────────────────────────────────
  // Deletes ALL TRAINING-scoped records from DB (all entity types) and re-seeds.
  // Blocker 8: includes AuditLog and ReceivingRecord clearing.
  const reset = useCallback(async () => {
    setLoading(true);
    async function deleteAllTraining(entity) {
      let batch = await entity.filter({ environment: ENV }, '', 500);
      while (batch && batch.length > 0) {
        await Promise.all(batch.map(record => entity.delete(record.id)));
        if (batch.length < 500) break;
        batch = await entity.filter({ environment: ENV }, '', 500);
      }
    }

    await Promise.all([
      deleteAllTraining(base44.entities.InventoryItem),
      deleteAllTraining(base44.entities.StockMovement),
      deleteAllTraining(base44.entities.PurchaseOrder),
      deleteAllTraining(base44.entities.AuditLog),
      deleteAllTraining(base44.entities.ReceivingRecord),
    ]);
    // Re-seed fresh items
    const seeded = await base44.entities.InventoryItem.bulkCreate(TRAINING_SEED_DATA);
    setItems(seeded || []);
    setMovements([]);
    setOrders([]);
    setLog([{ id: 0, ts: new Date().toLocaleTimeString(), msg: '🔄 Training environment reset. All TRAINING records cleared and re-seeded.', details: { type: 'RESET', environment: ENV } }]);
    setLoading(false);
  }, []);

  const getItem = useCallback((id) => items.find(i => i.id === id), [items]);

  return (
    <TrainingContext.Provider value={{
      items, movements, orders, log, loading,
      sites: TRAINING_SITES,
      actor, actorRole,
      getItem, adjustStock, createDraftOrder, updateOrderStatus, reset, addLog,
    }}>
      {children}
    </TrainingContext.Provider>
  );
}

export function useTraining() {
  const ctx = useContext(TrainingContext);
  if (!ctx) throw new Error('useTraining must be used within TrainingProvider');
  return ctx;
}