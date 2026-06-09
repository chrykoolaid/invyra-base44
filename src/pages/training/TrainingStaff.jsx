/**
 * Training Dashboard — Staff Role
 * Covers: POS auto-deduction, Wastage entry, Gap Scan awareness
 * v2: async adjustStock, over-deduction error display, loading states
 */
import { useState } from 'react';
import TrainingShell from '@/components/training/TrainingShell';
import TrainingInventoryTable from '@/components/training/TrainingInventoryTable';
import { useTraining } from '@/lib/TrainingContext';
import { Monitor, Trash2, ScanSearch, CheckCircle2, ChevronDown, AlertTriangle } from 'lucide-react';

const TASKS = [
  { id: 'pos',     label: 'Task 1 — POS Sale Deduction',  icon: Monitor,    desc: 'Simulate selling a service and watch stock auto-deduct.' },
  { id: 'waste',   label: 'Task 2 — Record Wastage',       icon: Trash2,     desc: 'Log a wastage event for an expired item.' },
  { id: 'gapscan', label: 'Task 3 — Gap Scan Awareness',   icon: ScanSearch, desc: 'Identify critical and watch-level stock items.' },
];

function POSTask() {
  const { items, adjustStock } = useTraining();
  const [serviceQty, setServiceQty] = useState(1);
  const [done, setDone] = useState(false);
  const [posting, setPosting] = useState(false);
  const [error, setError] = useState(null);
  const softener = items.find(i => i.sku === 'CHM-002');

  const handleSell = async () => {
    setError(null);
    setPosting(true);
    try {
      await adjustStock(softener.id, -serviceQty, 'SALE', 'OUT', `POS-TRN-${Date.now()}`, 'POS auto-deduction', 'POS');
      setDone(true);
    } catch (e) {
      setError(e.message);
    }
    setPosting(false);
  };

  return (
    <div className="space-y-3">
      <p className="text-sm text-muted-foreground">Service: <span className="font-medium text-foreground">Standard Wash & Dry 8kg</span> · Recipe: 1 × Fabric Softener per run</p>
      <div className="flex items-center gap-3 flex-wrap">
        <div className="flex flex-col gap-1">
          <label className="text-xs text-muted-foreground">Qty to sell</label>
          <input type="number" min={1} max={softener?.stock ?? 10} value={serviceQty}
            onChange={e => { setServiceQty(Number(e.target.value)); setDone(false); setError(null); }}
            className="w-20 h-8 border border-border rounded px-2 text-sm text-center" />
        </div>
        <div className="flex flex-col gap-1">
          <label className="text-xs text-muted-foreground">Softener before</label>
          <p className="h-8 flex items-center font-mono font-bold text-foreground">{softener?.stock} pcs</p>
        </div>
        <div className="flex flex-col gap-1">
          <label className="text-xs text-muted-foreground">Expected after</label>
          <p className="h-8 flex items-center font-mono font-bold text-amber-600">
            {(softener?.stock ?? 0) - serviceQty < 0
              ? <span className="text-red-600">⛔ Blocked</span>
              : `${(softener?.stock ?? 0) - serviceQty} pcs`}
          </p>
        </div>
        <button onClick={handleSell} disabled={done || posting || serviceQty > (softener?.stock ?? 0)}
          className="mt-5 h-8 px-4 text-sm rounded bg-primary text-primary-foreground hover:opacity-90 disabled:opacity-40">
          {posting ? 'Posting…' : 'Complete Sale'}
        </button>
      </div>
      {error && (
        <div className="flex items-start gap-2 p-3 bg-red-50 border border-red-200 rounded text-xs text-red-700">
          <AlertTriangle size={13} className="mt-0.5 flex-shrink-0" />
          <span><strong>Blocked:</strong> {error}</span>
        </div>
      )}
      {done && <p className="text-sm text-green-600 font-medium flex items-center gap-1.5"><CheckCircle2 size={14}/> Sale posted to TRAINING database. Check the audit log →</p>}
      <div className="p-3 bg-amber-50 border border-amber-200 rounded text-xs text-amber-700">
        <strong>What to verify:</strong> Fabric Softener stock decreases. A SALE movement is written to the TRAINING database (not LIVE). Actor, role, before/after values appear in the audit log.
      </div>
    </div>
  );
}

function WasteTask() {
  const { items, adjustStock } = useTraining();
  // Blocker 9: derive default from loaded DB items by SKU, not array index
  const [selectedId, setSelectedId] = useState(() => items.find(i => i.sku === 'CHM-003')?.id ?? items[0]?.id ?? '');
  const [qty, setQty] = useState(1);
  const [reason, setReason] = useState('Expired');
  const [done, setDone] = useState(false);
  const [posting, setPosting] = useState(false);
  const [error, setError] = useState(null);
  const item = items.find(i => i.id === selectedId);

  const handlePost = async () => {
    setError(null);
    setPosting(true);
    try {
      await adjustStock(selectedId, -qty, 'WASTE', 'OUT', `W-TRN-${Date.now()}`, `Wastage: ${reason}`, 'WASTAGE');
      setDone(true);
    } catch (e) {
      setError(e.message);
    }
    setPosting(false);
  };

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-end gap-3">
        <div className="flex flex-col gap-1">
          <label className="text-xs text-muted-foreground">Item</label>
          <select value={selectedId} onChange={e => { setSelectedId(e.target.value); setDone(false); setError(null); }}
            className="h-8 border border-border rounded px-2 text-sm bg-white">
            {items.map(i => <option key={i.id} value={i.id}>{i.name}</option>)}
          </select>
        </div>
        <div className="flex flex-col gap-1">
          <label className="text-xs text-muted-foreground">Qty wasted</label>
          <input type="number" min={1} value={qty} onChange={e => { setQty(Number(e.target.value)); setDone(false); setError(null); }}
            className="w-20 h-8 border border-border rounded px-2 text-sm text-center" />
        </div>
        <div className="flex flex-col gap-1">
          <label className="text-xs text-muted-foreground">Reason</label>
          <select value={reason} onChange={e => setReason(e.target.value)}
            className="h-8 border border-border rounded px-2 text-sm bg-white">
            {['Expired', 'Damaged', 'Spill / Contamination', 'Over-dispensed'].map(r => <option key={r}>{r}</option>)}
          </select>
        </div>
        <button onClick={handlePost} disabled={done || posting}
          className="h-8 px-4 text-sm rounded bg-red-600 text-white hover:opacity-90 disabled:opacity-40">
          {posting ? 'Posting…' : 'Post Wastage'}
        </button>
      </div>
      {item && (
        <p className="text-xs text-muted-foreground">
          Current stock: <span className="font-mono font-semibold">{item.stock}</span>
          {' → '}Expected after:{' '}
          {item.stock - qty < 0
            ? <span className="font-mono font-semibold text-red-600">⛔ Over-deduction — will be blocked</span>
            : <span className="font-mono font-semibold text-red-600">{item.stock - qty}</span>}
        </p>
      )}
      {error && (
        <div className="flex items-start gap-2 p-3 bg-red-50 border border-red-200 rounded text-xs text-red-700">
          <AlertTriangle size={13} className="mt-0.5 flex-shrink-0" />
          <span><strong>Blocked:</strong> {error}</span>
        </div>
      )}
      {done && <p className="text-sm text-green-600 font-medium flex items-center gap-1.5"><CheckCircle2 size={14}/> Wastage persisted to TRAINING database. Check audit log →</p>}
      <div className="p-3 bg-amber-50 border border-amber-200 rounded text-xs text-amber-700">
        <strong>What to verify:</strong> Stock reduces. Movement type is WASTE (not ADJUST). Over-deduction is blocked with an error — stock never silently clamps to zero.
      </div>
    </div>
  );
}

function GapScanTask() {
  const { items } = useTraining();
  const critical = items.filter(i => i.stock === 0);
  const watch     = items.filter(i => i.reorder_point != null && i.stock > 0 && i.stock <= i.reorder_point);
  return (
    <div className="space-y-3">
      <div className="grid grid-cols-2 gap-3">
        <div className="rounded border border-red-200 bg-red-50 px-4 py-3">
          <p className="text-xs font-semibold text-red-600 uppercase mb-1">Out of Stock</p>
          <p className="text-3xl font-bold text-red-700">{critical.length}</p>
          <p className="text-xs text-red-500 mt-1">{critical.map(i => i.name).join(', ') || 'None'}</p>
        </div>
        <div className="rounded border border-amber-200 bg-amber-50 px-4 py-3">
          <p className="text-xs font-semibold text-amber-600 uppercase mb-1">Below Reorder Point</p>
          <p className="text-3xl font-bold text-amber-700">{watch.length}</p>
          <p className="text-xs text-amber-500 mt-1">{watch.map(i => i.name).join(', ') || 'None'}</p>
        </div>
      </div>
      <p className="text-xs text-muted-foreground">Run Tasks 1 & 2 to change stock levels, then re-examine this panel to see alerts update.</p>
      <div className="p-3 bg-amber-50 border border-amber-200 rounded text-xs text-amber-700">
        <strong>What to verify:</strong> Stock levels from Tasks 1 & 2 flow through here. Items that drop to zero move from Watch → Out of Stock. All state is persisted in the TRAINING database partition.
      </div>
    </div>
  );
}

export default function TrainingStaff() {
  const [openTask, setOpenTask] = useState('pos');

  return (
    <TrainingShell role="staff">
      <div className="max-w-4xl space-y-5">
        <div>
          <h1 className="text-xl font-semibold text-foreground">Staff Training Dashboard</h1>
          <p className="text-sm text-muted-foreground mt-0.5">Complete each task in order. All actions write to the isolated TRAINING database — no live data is affected.</p>
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
                  <div className="px-4 pb-4 border-t border-border pt-4">
                    {task.id === 'pos'     && <POSTask />}
                    {task.id === 'waste'   && <WasteTask />}
                    {task.id === 'gapscan' && <GapScanTask />}
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