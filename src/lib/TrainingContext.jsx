/**
 * TrainingContext
 * Provides a sandboxed, in-memory training environment.
 * Nothing here reads from or writes to live entities.
 * All "inventory" is seeded from TRAINING_SEED and lives only in React state.
 */
import { createContext, useContext, useState, useCallback } from 'react';

export const TRAINING_SEED = {
  items: [
    { id: 'T-001', sku: 'CHM-001', name: 'Detergent 5L',        stock: 4,  unit: 'pcs', reorder_point: 5,  reorder_qty: 20, cost_per_unit: 280,  preferred_supplier: 'ChemSupply Co' },
    { id: 'T-002', sku: 'CHM-002', name: 'Fabric Softener 20L', stock: 18, unit: 'pcs', reorder_point: 10, reorder_qty: 12, cost_per_unit: 520,  preferred_supplier: 'ProWash Ingredients' },
    { id: 'T-003', sku: 'CHM-003', name: 'Bleach 5L',           stock: 12, unit: 'pcs', reorder_point: 8,  reorder_qty: 18, cost_per_unit: 160,  preferred_supplier: 'LaundryChem Direct' },
    { id: 'T-004', sku: 'CHM-004', name: 'Stain Remover 2L',    stock: 5,  unit: 'pcs', reorder_point: 6,  reorder_qty: 12, cost_per_unit: 210,  preferred_supplier: 'ProWash Ingredients' },
    { id: 'T-005', sku: 'OPS-001', name: 'Gloves Disposable',   stock: 340,unit: 'pcs', reorder_point: 100,reorder_qty: 200,cost_per_unit: 4,    preferred_supplier: 'OperationsPlus' },
    { id: 'T-006', sku: 'PKG-001', name: 'Packaging Rolls',     stock: 0,  unit: 'pcs', reorder_point: 10, reorder_qty: 50, cost_per_unit: 90,   preferred_supplier: null },
  ],
  sites: [
    { id: 'S-MAIN',  name: 'Main Site' },
    { id: 'S-NORTH', name: 'North Branch' },
  ],
  movements: [],
  orders: [],
};

const TrainingContext = createContext(null);

export function TrainingProvider({ children }) {
  const [items, setItems]       = useState(() => TRAINING_SEED.items.map(i => ({ ...i })));
  const [movements, setMovements] = useState([]);
  const [orders, setOrders]     = useState([]);
  const [log, setLog]           = useState([]); // human-readable event log for the dashboard

  const addLog = useCallback((msg) => {
    setLog(prev => [{ id: Date.now(), ts: new Date().toLocaleTimeString(), msg }, ...prev.slice(0, 49)]);
  }, []);

  // --- Item helpers ---
  const getItem = useCallback((id) => items.find(i => i.id === id), [items]);

  const adjustStock = useCallback((itemId, delta, movementType, direction, ref, notes) => {
    setItems(prev => prev.map(i => {
      if (i.id !== itemId) return i;
      const newStock = Math.max(0, (i.stock ?? 0) + delta);
      return { ...i, stock: newStock };
    }));
    const item = items.find(i => i.id === itemId);
    const newStock = Math.max(0, (item?.stock ?? 0) + delta);
    const mv = {
      id: `MV-${Date.now()}`,
      item_id: itemId,
      sku: item?.sku,
      item_name: item?.name,
      movement_type: movementType,
      direction,
      qty: Math.abs(delta),
      balance_after: newStock,
      source_ref: ref,
      notes,
      ts: new Date().toISOString(),
    };
    setMovements(prev => [mv, ...prev]);
    addLog(`[${movementType}] ${item?.name} ${direction === 'IN' ? '+' : '-'}${Math.abs(delta)} → balance: ${newStock}`);
    return mv;
  }, [items, addLog]);

  const createDraftOrder = useCallback((supplier, lines) => {
    const po = {
      id: `PO-TRN-${Date.now()}`,
      order_number: `PO-TRN-${String(orders.length + 1).padStart(3, '0')}`,
      supplier,
      status: 'Draft',
      lines,
      created_at: new Date().toISOString(),
    };
    setOrders(prev => [po, ...prev]);
    addLog(`[DRAFT PO] ${po.order_number} created for ${supplier} · ${lines.length} line(s)`);
    return po;
  }, [orders, addLog]);

  const updateOrderStatus = useCallback((orderId, status) => {
    setOrders(prev => prev.map(o => o.id === orderId ? { ...o, status } : o));
    const o = orders.find(x => x.id === orderId);
    addLog(`[ORDER] ${o?.order_number} → ${status}`);
  }, [orders, addLog]);

  const reset = useCallback(() => {
    setItems(TRAINING_SEED.items.map(i => ({ ...i })));
    setMovements([]);
    setOrders([]);
    setLog([{ id: 0, ts: new Date().toLocaleTimeString(), msg: '🔄 Training environment reset to seed data.' }]);
  }, []);

  return (
    <TrainingContext.Provider value={{
      items, movements, orders, log,
      sites: TRAINING_SEED.sites,
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