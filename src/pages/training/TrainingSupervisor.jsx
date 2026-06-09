/**
 * Training Dashboard — Supervisor Role
 * Covers: Receiving stock-up, Stocktake variance, Site Transfer balance preservation, Adjustments
 */
import { useState } from 'react';
import TrainingShell from '@/components/training/TrainingShell';
import TrainingInventoryTable from '@/components/training/TrainingInventoryTable';
import { useTraining } from '@/lib/TrainingContext';
import { PackageCheck, ClipboardCheck, ArrowLeftRight, SlidersHorizontal, CheckCircle2, ChevronDown } from 'lucide-react';

const TASKS = [
  { id: 'receive',  label: 'Task 1 — Receive a PO',              icon: PackageCheck,     desc: 'Confirm inbound stock and watch inventory increment.' },
  { id: 'stocktake',label: 'Task 2 — Stocktake Variance',         icon: ClipboardCheck,   desc: 'Enter physical counts and reconcile system stock.' },
  { id: 'transfer', label: 'Task 3 — Multi-Site Transfer',        icon: ArrowLeftRight,   desc: 'Verify global balance is preserved across a transfer.' },
  { id: 'adjust',   label: 'Task 4 — Manual Adjustment',          icon: SlidersHorizontal,desc: 'Post a count-variance correction as ADJUST (not WASTE).' },
];

function ReceiveTask() {
  const { items, adjustStock, movements } = useTraining();
  const [lines, setLines] = useState([
    { itemId: 'T-001', expected: 20, received: '' },
    { itemId: 'T-004', expected: 12, received: '' },
  ]);
  const [done, setDone] = useState(false);

  const handleReceive = () => {
    lines.forEach(l => {
      if (l.received === '' || Number(l.received) === 0) return;
      adjustStock(l.itemId, Number(l.received), 'RECEIVE', 'IN', `PO-TRN-RCV-${Date.now()}`, 'Training: PO receiving');
    });
    setDone(true);
  };

  return (
    <div className="space-y-3">
      <p className="text-sm text-muted-foreground">Simulated PO: <span className="font-medium text-foreground">PO-TRN-001</span> — ProWash Ingredients</p>
      <table className="w-full text-sm border border-border rounded overflow-hidden">
        <thead className="bg-muted text-xs text-muted-foreground uppercase">
          <tr>
            {['Item','Expected','Received'].map(h => <th key={h} className="text-left px-3 py-2">{h}</th>)}
          </tr>
        </thead>
        <tbody>
          {lines.map((l, i) => {
            const item = items.find(x => x.id === l.itemId);
            return (
              <tr key={l.itemId} className="border-t border-border">
                <td className="px-3 py-2">{item?.name}</td>
                <td className="px-3 py-2 font-mono">{l.expected}</td>
                <td className="px-3 py-2">
                  <input type="number" min={0} value={l.received} disabled={done}
                    onChange={e => setLines(prev => prev.map((x, j) => j === i ? { ...x, received: e.target.value } : x))}
                    placeholder="Enter qty"
                    className="w-24 h-7 border border-border rounded px-2 text-sm text-center" />
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
      <button onClick={handleReceive} disabled={done}
        className="h-8 px-4 text-sm rounded bg-primary text-primary-foreground hover:opacity-90 disabled:opacity-40">
        Confirm Receiving
      </button>
      {done && <p className="text-sm text-green-600 font-medium flex items-center gap-1.5"><CheckCircle2 size={14}/> Receiving confirmed. RECEIVE movements posted in event log.</p>}
      <div className="p-3 bg-amber-50 border border-amber-200 rounded text-xs text-amber-700">
        <strong>What to verify:</strong> Item stock increases in the inventory table. Two RECEIVE (IN) movements appear in the event log. PO would transition to Received/Partial on live.
      </div>
    </div>
  );
}

function StocktakeTask() {
  const { items, adjustStock } = useTraining();
  const [counts, setCounts] = useState({});
  const [done, setDone] = useState(false);

  const handleCommit = () => {
    items.forEach(item => {
      const val = counts[item.id];
      if (val === undefined || val === '') return;
      const diff = Number(val) - item.stock;
      if (diff === 0) return;
      adjustStock(item.id, diff, 'STOCKTAKE', diff >= 0 ? 'IN' : 'OUT',
        `STKTK-TRN-${new Date().toISOString().slice(0,10)}`,
        `Training stocktake: ${diff >= 0 ? '+' : ''}${diff}`);
    });
    setDone(true);
  };

  const counted = Object.values(counts).filter(v => v !== '').length;
  return (
    <div className="space-y-3">
      <p className="text-sm text-muted-foreground">Enter physical counts below. Leave blank to skip an item.</p>
      <div className="border border-border rounded overflow-hidden bg-white">
        <table className="w-full text-sm">
          <thead className="bg-muted text-xs text-muted-foreground uppercase">
            <tr>{['Item','System','Physical Count','Variance'].map(h => <th key={h} className="text-left px-3 py-2">{h}</th>)}</tr>
          </thead>
          <tbody>
            {items.map((item, i) => {
              const counted = counts[item.id];
              const variance = counted !== undefined && counted !== '' ? Number(counted) - item.stock : null;
              return (
                <tr key={item.id} className={`border-t border-border ${i % 2 === 0 ? 'bg-white' : 'bg-slate-50/50'}`}>
                  <td className="px-3 py-2 font-medium">{item.name}</td>
                  <td className="px-3 py-2 font-mono">{item.stock}</td>
                  <td className="px-3 py-2">
                    <input type="number" min={0} value={counts[item.id] ?? ''} disabled={done}
                      onChange={e => setCounts(p => ({ ...p, [item.id]: e.target.value }))}
                      placeholder="—"
                      className="w-24 h-7 border border-border rounded px-2 text-sm text-center" />
                  </td>
                  <td className="px-3 py-2 font-mono font-semibold">
                    {variance !== null
                      ? <span className={variance > 0 ? 'text-blue-600' : variance < 0 ? 'text-amber-600' : 'text-green-600'}>{variance > 0 ? '+' : ''}{variance}</span>
                      : <span className="text-muted-foreground">—</span>}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      <button onClick={handleCommit} disabled={done || counted === 0}
        className="h-8 px-4 text-sm rounded bg-primary text-primary-foreground hover:opacity-90 disabled:opacity-40">
        Commit {counted} Count{counted !== 1 ? 's' : ''}
      </button>
      {done && <p className="text-sm text-green-600 font-medium flex items-center gap-1.5"><CheckCircle2 size={14}/> Stocktake committed. STOCKTAKE movements posted in event log.</p>}
      <div className="p-3 bg-amber-50 border border-amber-200 rounded text-xs text-amber-700">
        <strong>What to verify:</strong> System stock reflects your physical counts. Each variance posts a STOCKTAKE movement (IN for over, OUT for short).
      </div>
    </div>
  );
}

function TransferTask() {
  const { items, adjustStock, movements } = useTraining();
  const [itemId, setItemId] = useState(items[4]?.id); // Gloves
  const [qty, setQty] = useState(100);
  const [done, setDone] = useState(false);

  const item = items.find(i => i.id === itemId);
  const ref = `TRF-TRN-${Date.now()}`;

  const handlePost = () => {
    const transferRef = `TRF-TRN-${Date.now()}`;
    adjustStock(itemId, -qty, 'TRANSFER_OUT', 'OUT', transferRef, 'Training: Transfer from Main Site');
    adjustStock(itemId, +qty, 'TRANSFER_IN',  'IN',  transferRef, 'Training: Transfer to North Branch');
    setDone(true);
  };

  // Count total movements of this item
  const itemMvs = movements.filter(m => m.item_id === itemId);
  const totalStock = item ? item.stock : 0;

  return (
    <div className="space-y-3">
      <p className="text-sm text-muted-foreground">From: <span className="font-medium text-foreground">Main Site</span> → To: <span className="font-medium text-foreground">North Branch</span></p>
      <div className="flex flex-wrap items-end gap-3">
        <div className="flex flex-col gap-1">
          <label className="text-xs text-muted-foreground">Item</label>
          <select value={itemId} onChange={e => { setItemId(e.target.value); setDone(false); }}
            className="h-8 border border-border rounded px-2 text-sm bg-white">
            {items.map(i => <option key={i.id} value={i.id}>{i.name}</option>)}
          </select>
        </div>
        <div className="flex flex-col gap-1">
          <label className="text-xs text-muted-foreground">Qty to transfer</label>
          <input type="number" min={1} max={item?.stock ?? 999} value={qty}
            onChange={e => { setQty(Number(e.target.value)); setDone(false); }}
            className="w-24 h-8 border border-border rounded px-2 text-sm text-center" />
        </div>
        <div className="flex flex-col gap-1">
          <label className="text-xs text-muted-foreground">Global stock before</label>
          <p className="h-8 flex items-center font-mono font-bold text-foreground">{item?.stock}</p>
        </div>
        <div className="flex flex-col gap-1">
          <label className="text-xs text-muted-foreground">Global stock after</label>
          <p className="h-8 flex items-center font-mono font-bold text-green-600">{item?.stock} <span className="text-xs text-muted-foreground ml-1">(unchanged)</span></p>
        </div>
        <button onClick={handlePost} disabled={done || qty > (item?.stock ?? 0)}
          className="h-8 px-4 text-sm rounded bg-primary text-primary-foreground hover:opacity-90 disabled:opacity-40">
          Post Transfer
        </button>
      </div>
      {done && <p className="text-sm text-green-600 font-medium flex items-center gap-1.5"><CheckCircle2 size={14}/> Transfer posted. TRANSFER_OUT + TRANSFER_IN in event log.</p>}
      <div className="p-3 bg-amber-50 border border-amber-200 rounded text-xs text-amber-700">
        <strong>What to verify:</strong> Global item stock does NOT change. Two matching movements (TRANSFER_OUT + TRANSFER_IN) share the same reference. This confirms atomicity.
      </div>
    </div>
  );
}

function AdjustTask() {
  const { items, adjustStock } = useTraining();
  const [itemId, setItemId] = useState(items[1]?.id);
  const [qty, setQty] = useState(2);
  const [direction, setDirection] = useState('OUT');
  const [done, setDone] = useState(false);
  const item = items.find(i => i.id === itemId);

  const handlePost = () => {
    adjustStock(itemId, direction === 'OUT' ? -qty : qty, 'ADJUST', direction,
      `ADJ-TRN-${Date.now()}`, `Training: Count Variance ${direction === 'OUT' ? 'Under' : 'Over'}`);
    setDone(true);
  };

  return (
    <div className="space-y-3">
      <p className="text-sm text-muted-foreground">Post a count correction. Must appear as <strong>ADJUST</strong>, never WASTE.</p>
      <div className="flex flex-wrap items-end gap-3">
        <div className="flex flex-col gap-1">
          <label className="text-xs text-muted-foreground">Item</label>
          <select value={itemId} onChange={e => { setItemId(e.target.value); setDone(false); }}
            className="h-8 border border-border rounded px-2 text-sm bg-white">
            {items.map(i => <option key={i.id} value={i.id}>{i.name}</option>)}
          </select>
        </div>
        <div className="flex flex-col gap-1">
          <label className="text-xs text-muted-foreground">Direction</label>
          <select value={direction} onChange={e => { setDirection(e.target.value); setDone(false); }}
            className="h-8 border border-border rounded px-2 text-sm bg-white">
            <option value="OUT">Count Under (−)</option>
            <option value="IN">Count Over (+)</option>
          </select>
        </div>
        <div className="flex flex-col gap-1">
          <label className="text-xs text-muted-foreground">Qty</label>
          <input type="number" min={1} value={qty} onChange={e => { setQty(Number(e.target.value)); setDone(false); }}
            className="w-20 h-8 border border-border rounded px-2 text-sm text-center" />
        </div>
        <button onClick={handlePost} disabled={done}
          className="h-8 px-4 text-sm rounded bg-primary text-primary-foreground hover:opacity-90 disabled:opacity-40">
          Post Adjustment
        </button>
      </div>
      {item && <p className="text-xs text-muted-foreground">Current: <span className="font-mono font-semibold">{item.stock}</span> → After: <span className="font-mono font-semibold">{Math.max(0, item.stock + (direction === 'OUT' ? -qty : qty))}</span></p>}
      {done && <p className="text-sm text-green-600 font-medium flex items-center gap-1.5"><CheckCircle2 size={14}/> Adjustment posted. Confirm type is ADJUST in event log (not WASTE).</p>}
      <div className="p-3 bg-amber-50 border border-amber-200 rounded text-xs text-amber-700">
        <strong>What to verify:</strong> Movement type is ADJUST. This must NOT appear in the Wastage module or affect waste KPIs.
      </div>
    </div>
  );
}

const TASK_CONTENT = { receive: <ReceiveTask />, stocktake: <StocktakeTask />, transfer: <TransferTask />, adjust: <AdjustTask /> };

export default function TrainingSupervisor() {
  const [openTask, setOpenTask] = useState('receive');
  return (
    <TrainingShell role="supervisor">
      <div className="max-w-4xl space-y-5">
        <div>
          <h1 className="text-xl font-semibold text-foreground">Supervisor Training Dashboard</h1>
          <p className="text-sm text-muted-foreground mt-0.5">Validate inbound receiving, stocktakes, transfers, and adjustments. All sandboxed.</p>
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
                {isOpen && <div className="px-4 pb-4 border-t border-border pt-4">{TASK_CONTENT[task.id]}</div>}
              </div>
            );
          })}
        </div>
      </div>
    </TrainingShell>
  );
}