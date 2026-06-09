/**
 * Training Dashboard — Manager Role
 * Covers: Reorder alert review, Draft PO creation, Reorder deduplication check, KPI Overview
 * v2: async createDraftOrder/updateOrderStatus, persisted to TRAINING database
 */
import { useState, useMemo } from 'react';
import TrainingShell from '@/components/training/TrainingShell';
import TrainingInventoryTable from '@/components/training/TrainingInventoryTable';
import { useTraining } from '@/lib/TrainingContext';
import { BellRing, ClipboardList, ShoppingCart, BarChart2, CheckCircle2, ChevronDown, AlertTriangle } from 'lucide-react';

const TASKS = [
  { id: 'alerts',  label: 'Task 1 — Reorder Alert Review', icon: BellRing,     desc: 'Identify which items are below reorder threshold.' },
  { id: 'draftpo', label: 'Task 2 — Create Draft PO',       icon: ClipboardList,desc: 'Generate a draft purchase order for low-stock items.' },
  { id: 'dedup',   label: 'Task 3 — Deduplication Check',   icon: ShoppingCart, desc: 'Verify a second draft for the same supplier is blocked.' },
  { id: 'kpi',     label: 'Task 4 — Manager KPI Overview',  icon: BarChart2,    desc: 'Review overall stock health and value-at-risk metrics.' },
];

function AlertsTask() {
  const { items } = useTraining();
  const lowStock   = items.filter(i => i.reorder_point != null && i.stock <= i.reorder_point && i.stock > 0);
  const outOfStock = items.filter(i => i.stock === 0);
  return (
    <div className="space-y-3">
      <div className="grid grid-cols-2 gap-3">
        <div className="rounded border border-red-200 bg-red-50 px-4 py-3">
          <p className="text-xs font-semibold text-red-600 uppercase mb-1">Out of Stock</p>
          <p className="text-3xl font-bold text-red-700">{outOfStock.length}</p>
          <ul className="mt-1 space-y-0.5">{outOfStock.map(i => <li key={i.id} className="text-xs text-red-500">· {i.name}</li>)}</ul>
        </div>
        <div className="rounded border border-amber-200 bg-amber-50 px-4 py-3">
          <p className="text-xs font-semibold text-amber-600 uppercase mb-1">Below Reorder Point</p>
          <p className="text-3xl font-bold text-amber-700">{lowStock.length}</p>
          <ul className="mt-1 space-y-0.5">{lowStock.map(i => <li key={i.id} className="text-xs text-amber-500">· {i.name} (stock: {i.stock}, threshold: {i.reorder_point})</li>)}</ul>
        </div>
      </div>
      <div className="p-3 bg-amber-50 border border-amber-200 rounded text-xs text-amber-700">
        <strong>What to verify:</strong> Alert count matches items at or below reorder point. Values reflect the persisted TRAINING database — not in-memory state.
      </div>
    </div>
  );
}

function DraftPOTask() {
  const { items, orders, createDraftOrder } = useTraining();
  const needsOrder = items.filter(i => i.stock <= (i.reorder_point ?? 0) || i.stock === 0);
  const [selected, setSelected] = useState(() => new Set(needsOrder.map(i => i.id)));
  const [done, setDone] = useState(false);
  const [posting, setPosting] = useState(false);
  const [error, setError] = useState(null);
  const [createdPOs, setCreatedPOs] = useState([]);

  const handleCreate = async () => {
    setError(null);
    setPosting(true);
    try {
      const bySupplier = {};
      items.filter(i => selected.has(i.id)).forEach(i => {
        const sup = i.preferred_supplier || 'Unknown Supplier';
        if (!bySupplier[sup]) bySupplier[sup] = [];
        bySupplier[sup].push({ sku: i.sku, name: i.name, qty: i.reorder_qty ?? 10, unit_cost: i.cost_per_unit ?? 0 });
      });

      // Deduplication guard — same logic as DedupTask (INV-VP1-MGR-001)
      const existingDraftSuppliers = new Set(
        orders.filter(o => o.status === 'Draft').map(o => o.supplier)
      );
      const duplicates = Object.keys(bySupplier).filter(sup => existingDraftSuppliers.has(sup));
      if (duplicates.length > 0) {
        throw new Error(`Duplicate draft PO blocked: open draft(s) already exist for: ${duplicates.join(', ')}. Reset training or submit/cancel existing drafts first.`);
      }

      const newPOs = [];
      for (const [sup, lines] of Object.entries(bySupplier)) {
        const po = await createDraftOrder(sup, lines);
        newPOs.push(po);
      }
      setCreatedPOs(newPOs);
      setDone(true);
    } catch (e) {
      setError(e.message);
    }
    setPosting(false);
  };

  return (
    <div className="space-y-3">
      <p className="text-sm text-muted-foreground">Items flagged for reorder. Select which to include and generate draft POs grouped by supplier.</p>
      {needsOrder.length === 0
        ? <p className="text-sm text-green-600">All items are adequately stocked. Use Staff training tasks to reduce stock first.</p>
        : (
          <div className="border border-border rounded overflow-hidden bg-white">
            <table className="w-full text-sm">
              <thead className="bg-muted text-xs text-muted-foreground uppercase">
                <tr>{['', 'Item', 'Stock', 'Reorder Qty', 'Supplier'].map(h => <th key={h} className="text-left px-3 py-2">{h}</th>)}</tr>
              </thead>
              <tbody>
                {needsOrder.map((item, i) => (
                  <tr key={item.id} className={`border-t border-border ${i % 2 === 0 ? 'bg-white' : 'bg-slate-50/50'}`}>
                    <td className="px-3 py-2">
                      <input type="checkbox" checked={selected.has(item.id)} disabled={done}
                        onChange={() => setSelected(p => { const n = new Set(p); n.has(item.id) ? n.delete(item.id) : n.add(item.id); return n; })} />
                    </td>
                    <td className="px-3 py-2 font-medium">{item.name}</td>
                    <td className="px-3 py-2 font-mono text-red-600">{item.stock}</td>
                    <td className="px-3 py-2 font-mono">{item.reorder_qty ?? 10}</td>
                    <td className="px-3 py-2 text-muted-foreground">{item.preferred_supplier ?? <span className="text-red-500">Missing</span>}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )
      }
      {!done && needsOrder.length > 0 && (
        <button onClick={handleCreate} disabled={selected.size === 0 || posting}
          className="h-8 px-4 text-sm rounded bg-primary text-primary-foreground hover:opacity-90 disabled:opacity-40">
          {posting ? 'Creating…' : `Generate ${selected.size} Draft PO${selected.size !== 1 ? 's' : ''}`}
        </button>
      )}
      {error && <div className="flex items-start gap-2 p-3 bg-red-50 border border-red-200 rounded text-xs text-red-700"><AlertTriangle size={13} />{error}</div>}
      {done && (
        <div className="space-y-2">
          <p className="text-sm text-green-600 font-medium flex items-center gap-1.5"><CheckCircle2 size={14}/> {createdPOs.length} draft PO{createdPOs.length !== 1 ? 's' : ''} persisted to TRAINING database.</p>
          {createdPOs.map(po => (
            <div key={po.id} className="border border-border rounded px-3 py-2 bg-white text-sm font-mono">
              {po.order_number} · {po.supplier} · {po.lines?.length} line{po.lines?.length !== 1 ? 's' : ''}
              <span className="ml-2 text-xs px-1.5 py-0.5 rounded bg-amber-100 text-amber-700 border border-amber-200">env=TRAINING</span>
            </div>
          ))}
        </div>
      )}
      <div className="p-3 bg-amber-50 border border-amber-200 rounded text-xs text-amber-700">
        <strong>What to verify:</strong> Each supplier gets its own PO. POs are tagged environment=TRAINING and visible in audit log. Items missing a supplier are flagged.
      </div>
    </div>
  );
}

function DedupTask() {
  const { orders, createDraftOrder } = useTraining();
  const [tried, setTried] = useState(false);
  const [blocked, setBlocked] = useState(false);
  const [posting, setPosting] = useState(false);

  const existingSuppliers = [...new Set(orders.map(o => o.supplier))];

  const handleTryDuplicate = async () => {
    setPosting(true);
    const targetSupplier = existingSuppliers[0] || 'ChemSupply Co';
    const existing = orders.filter(o => o.supplier === targetSupplier && o.status === 'Draft');
    if (existing.length > 0) {
      setBlocked(true);
    } else {
      await createDraftOrder(targetSupplier, [{ sku: 'TEST', name: 'Test Item', qty: 1, unit_cost: 0 }]);
      setBlocked(false);
    }
    setTried(true);
    setPosting(false);
  };

  return (
    <div className="space-y-3">
      <p className="text-sm text-muted-foreground">
        Simulate attempting to create a second draft PO for a supplier that already has one open.
        Production prevents duplicate open POs per supplier.
      </p>
      {existingSuppliers.length === 0 && (
        <div className="flex items-start gap-2 p-3 bg-amber-50 border border-amber-200 rounded text-xs text-amber-700">
          <AlertTriangle size={13} className="mt-0.5 flex-shrink-0" />
          Complete Task 2 first to create at least one draft PO.
        </div>
      )}
      {existingSuppliers.length > 0 && (
        <div className="flex items-center gap-3">
          <div className="flex flex-col gap-1">
            <label className="text-xs text-muted-foreground">Existing draft supplier</label>
            <p className="h-8 flex items-center text-sm font-medium">{existingSuppliers[0]}</p>
          </div>
          <button onClick={handleTryDuplicate} disabled={tried || posting}
            className="h-8 px-4 text-sm rounded bg-amber-500 text-white hover:opacity-90 disabled:opacity-40 mt-4">
            {posting ? 'Trying…' : 'Try to Create Duplicate PO'}
          </button>
        </div>
      )}
      {tried && blocked && (
        <div className="flex items-start gap-2 p-3 bg-green-50 border border-green-200 rounded text-sm text-green-700">
          <CheckCircle2 size={14} className="mt-0.5 flex-shrink-0" />
          <span><strong>Blocked correctly.</strong> A draft PO already exists for <strong>{existingSuppliers[0]}</strong>. Deduplication guard prevented a second draft.</span>
        </div>
      )}
      {tried && !blocked && (
        <div className="flex items-start gap-2 p-3 bg-red-50 border border-red-200 rounded text-sm text-red-700">
          <AlertTriangle size={14} className="mt-0.5 flex-shrink-0" />
          <span><strong>Duplicate was created.</strong> Risk scenario — supplier grouping logic needs tightening in production.</span>
        </div>
      )}
      <div className="p-3 bg-amber-50 border border-amber-200 rounded text-xs text-amber-700">
        <strong>What to verify:</strong> "Blocked" = deduplication working. Duplicate = needs fix in production reorder engine.
      </div>
    </div>
  );
}

function KPITask() {
  const { items, movements, orders } = useTraining();
  const totalValue = useMemo(() => items.reduce((s, i) => s + (i.stock * (i.cost_per_unit ?? 0)), 0), [items]);
  const reorderExp = useMemo(() => items.filter(i => i.stock <= (i.reorder_point ?? 0)).reduce((s, i) => s + ((i.reorder_qty ?? 0) * (i.cost_per_unit ?? 0)), 0), [items]);
  const wasteQty   = useMemo(() => movements.filter(m => m.movement_type === 'WASTE').reduce((s, m) => s + (m.qty ?? 0), 0), [movements]);
  const draftPOs   = orders.filter(o => o.status === 'Draft').length;
  const fmt = (n) => n >= 1000 ? `₱${(n / 1000).toFixed(1)}k` : `₱${n.toFixed(0)}`;

  return (
    <div className="space-y-3">
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: 'Stock Value',      value: fmt(totalValue), sub: 'training data only',       color: 'text-foreground' },
          { label: 'Reorder Exposure', value: fmt(reorderExp), sub: 'items at/below threshold', color: 'text-amber-600' },
          { label: 'Total Waste',      value: `${wasteQty} units`, sub: 'this session',          color: 'text-red-600' },
          { label: 'Draft POs Open',   value: draftPOs,        sub: 'pending submission',        color: 'text-sky-600' },
        ].map(card => (
          <div key={card.label} className="border border-border rounded bg-white px-3 py-3">
            <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-widest mb-1">{card.label}</p>
            <p className={`text-2xl font-bold ${card.color}`}>{card.value}</p>
            <p className="text-xs text-muted-foreground mt-0.5">{card.sub}</p>
          </div>
        ))}
      </div>
      <p className="text-xs text-muted-foreground">KPIs reflect the persisted TRAINING database. Stock value decreases after wastage tasks. Reorder exposure drops when stock is restocked via receiving.</p>
      <div className="p-3 bg-amber-50 border border-amber-200 rounded text-xs text-amber-700">
        <strong>What to verify:</strong> These metrics are driven by real persisted TRAINING records, not in-memory state. They will survive a page reload.
      </div>
    </div>
  );
}

export default function TrainingManager() {
  const [openTask, setOpenTask] = useState('alerts');
  return (
    <TrainingShell role="manager">
      <div className="max-w-4xl space-y-5">
        <div>
          <h1 className="text-xl font-semibold text-foreground">Manager Training Dashboard</h1>
          <p className="text-sm text-muted-foreground mt-0.5">Validate reorder alerts, PO creation, deduplication, and KPI accuracy. All writes go to the isolated TRAINING database.</p>
        </div>
        <div>
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-widest mb-2">Live Training Inventory</p>
          <TrainingInventoryTable highlightLow />
        </div>
        <div className="space-y-2">
          {TASKS.map(task => {
            const Icon = task.icon;
            const isOpen = openTask === task.id;
            return (
              <div key={task.id} className="border border-border rounded-lg bg-white overflow-hidden">
                <button onClick={() => setOpenTask(isOpen ? null : task.id)}
                  className="w-full flex items-center justify-between px-4 py-3 hover:bg-muted/40 transition-colors">
                  <div className="flex items-center gap-2.5">
                    <Icon size={15} className="text-primary" />
                    <span className="text-sm font-medium">{task.label}</span>
                    <span className="text-xs text-muted-foreground hidden sm:block">{task.desc}</span>
                  </div>
                  <ChevronDown size={14} className={`text-muted-foreground transition-transform ${isOpen ? 'rotate-180' : ''}`} />
                </button>
                {isOpen && (
                  <div className="px-4 pb4 border-t border-border pt-4 pb-4">
                    {task.id === 'alerts'  && <AlertsTask />}
                    {task.id === 'draftpo' && <DraftPOTask />}
                    {task.id === 'dedup'   && <DedupTask />}
                    {task.id === 'kpi'     && <KPITask />}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </TrainingShell>
  );
}