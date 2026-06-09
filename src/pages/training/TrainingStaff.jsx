/**
 * Training Dashboard — Staff Role
 * Covers: POS auto-deduction, Wastage entry, Gap Scan awareness
 */
import { useState } from 'react';
import TrainingShell from '@/components/training/TrainingShell';
import TrainingInventoryTable from '@/components/training/TrainingInventoryTable';
import { useTraining } from '@/lib/TrainingContext';
import { Monitor, Trash2, ScanSearch, CheckCircle2, ChevronDown } from 'lucide-react';

const TASKS = [
  { id: 'pos',    label: 'Task 1 — POS Sale Deduction',   icon: Monitor,   desc: 'Simulate selling a service and watch stock auto-deduct.' },
  { id: 'waste',  label: 'Task 2 — Record Wastage',        icon: Trash2,    desc: 'Log a wastage event for an expired item.' },
  { id: 'gapscan',label: 'Task 3 — Gap Scan Awareness',    icon: ScanSearch,desc: 'Identify critical and watch-level stock items.' },
];

function POSTask() {
  const { items, adjustStock } = useTraining();
  const [serviceQty, setServiceQty] = useState(1);
  const [done, setDone] = useState(false);
  // Simulate: Standard Wash consumes 1 × Softener per run
  const softener = items.find(i => i.sku === 'CHM-002');

  const handleSell = () => {
    adjustStock(softener.id, -serviceQty, 'SALE', 'OUT', `POS-TRN-${Date.now()}`, 'Training: POS auto-deduction');
    setDone(true);
  };

  return (
    <div className="space-y-3">
      <p className="text-sm text-muted-foreground">Service: <span className="font-medium text-foreground">Standard Wash & Dry 8kg</span> · Recipe: 1 × Fabric Softener per run</p>
      <div className="flex items-center gap-3">
        <div className="flex flex-col gap-1">
          <label className="text-xs text-muted-foreground">Qty to sell</label>
          <input type="number" min={1} max={10} value={serviceQty} onChange={e => { setServiceQty(Number(e.target.value)); setDone(false); }}
            className="w-20 h-8 border border-border rounded px-2 text-sm text-center" />
        </div>
        <div className="flex flex-col gap-1">
          <label className="text-xs text-muted-foreground">Softener before</label>
          <p className="h-8 flex items-center font-mono font-bold text-foreground">{softener?.stock} pcs</p>
        </div>
        <div className="flex flex-col gap-1">
          <label className="text-xs text-muted-foreground">Expected after</label>
          <p className="h-8 flex items-center font-mono font-bold text-amber-600">{Math.max(0, (softener?.stock ?? 0) - serviceQty)} pcs</p>
        </div>
        <button onClick={handleSell} disabled={done}
          className="mt-5 h-8 px-4 text-sm rounded bg-primary text-primary-foreground hover:opacity-90 disabled:opacity-40">
          Complete Sale
        </button>
      </div>
      {done && <p className="text-sm text-green-600 font-medium flex items-center gap-1.5"><CheckCircle2 size={14}/> Sale posted. Check the event log and inventory table above.</p>}
      <div className="p-3 bg-amber-50 border border-amber-200 rounded text-xs text-amber-700">
        <strong>What to verify:</strong> After posting, the Fabric Softener row in the inventory table above should decrease by {serviceQty}. A SALE movement appears in the Training Event Log.
      </div>
    </div>
  );
}

function WasteTask() {
  const { items, adjustStock } = useTraining();
  const [selectedId, setSelectedId] = useState(items[2]?.id);
  const [qty, setQty] = useState(1);
  const [reason, setReason] = useState('Expired');
  const [done, setDone] = useState(false);
  const item = items.find(i => i.id === selectedId);

  const handlePost = () => {
    adjustStock(selectedId, -qty, 'WASTE', 'OUT', `W-TRN-${Date.now()}`, `Training wastage: ${reason}`);
    setDone(true);
  };

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-end gap-3">
        <div className="flex flex-col gap-1">
          <label className="text-xs text-muted-foreground">Item</label>
          <select value={selectedId} onChange={e => { setSelectedId(e.target.value); setDone(false); }}
            className="h-8 border border-border rounded px-2 text-sm bg-white">
            {items.map(i => <option key={i.id} value={i.id}>{i.name}</option>)}
          </select>
        </div>
        <div className="flex flex-col gap-1">
          <label className="text-xs text-muted-foreground">Qty wasted</label>
          <input type="number" min={1} value={qty} onChange={e => { setQty(Number(e.target.value)); setDone(false); }}
            className="w-20 h-8 border border-border rounded px-2 text-sm text-center" />
        </div>
        <div className="flex flex-col gap-1">
          <label className="text-xs text-muted-foreground">Reason</label>
          <select value={reason} onChange={e => setReason(e.target.value)}
            className="h-8 border border-border rounded px-2 text-sm bg-white">
            {['Expired', 'Damaged', 'Spill / Contamination', 'Over-dispensed'].map(r => <option key={r}>{r}</option>)}
          </select>
        </div>
        <button onClick={handlePost} disabled={done}
          className="h-8 px-4 text-sm rounded bg-red-600 text-white hover:opacity-90 disabled:opacity-40">
          Post Wastage
        </button>
      </div>
      {item && <p className="text-xs text-muted-foreground">Current stock: <span className="font-mono font-semibold">{item.stock}</span> → Expected after: <span className="font-mono font-semibold text-red-600">{Math.max(0, item.stock - qty)}</span></p>}
      {done && <p className="text-sm text-green-600 font-medium flex items-center gap-1.5"><CheckCircle2 size={14}/> Wastage posted. WASTE movement recorded in event log.</p>}
      <div className="p-3 bg-amber-50 border border-amber-200 rounded text-xs text-amber-700">
        <strong>What to verify:</strong> Stock reduces in the inventory table. Movement type is WASTE (not ADJUST). Check the event log.
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
      <p className="text-xs text-muted-foreground">Run Tasks 1 & 2 to change stock levels, then re-examine this panel to see alerts update in real-time.</p>
      <div className="p-3 bg-amber-50 border border-amber-200 rounded text-xs text-amber-700">
        <strong>What to verify:</strong> Stock levels from Tasks 1 & 2 flow through here. Items that drop to zero move from Watch → Out of Stock.
      </div>
    </div>
  );
}

const TASK_CONTENT = { pos: <POSTask />, waste: <WasteTask />, gapscan: <GapScanTask /> };

export default function TrainingStaff() {
  const [openTask, setOpenTask] = useState('pos');

  return (
    <TrainingShell role="staff">
      <div className="max-w-4xl space-y-5">
        <div>
          <h1 className="text-xl font-semibold text-foreground">Staff Training Dashboard</h1>
          <p className="text-sm text-muted-foreground mt-0.5">Complete each task in order. All actions here are sandboxed — no live data is affected.</p>
        </div>

        {/* Live inventory snapshot */}
        <div>
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-widest mb-2">Live Training Inventory</p>
          <TrainingInventoryTable highlightLow />
        </div>

        {/* Task accordions */}
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
                    <span className="text-xs text-muted-foreground">{task.desc}</span>
                  </div>
                  <ChevronDown size={14} className={`text-muted-foreground transition-transform ${isOpen ? 'rotate-180' : ''}`} />
                </button>
                {isOpen && <div className="px-4 pb-4 border-t border-border pt-4">{TASK_CONTENT[task.id]}</div>}
              </div>
            );
          })}
        </div>
      </div>
    </TrainingShell>
  );
}