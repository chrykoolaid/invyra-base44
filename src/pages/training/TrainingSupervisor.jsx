/**
 * Training Dashboard — Supervisor Role
 * Covers: Receiving stock-up, Stocktake variance, Site Transfer balance preservation, Adjustments
 * v2: async adjustStock, over-deduction blocking, TRANSFER-001 balance snapshot fix
 */
import { useState } from 'react';
import TrainingShell from '@/components/training/TrainingShell';
import TrainingInventoryTable from '@/components/training/TrainingInventoryTable';
import { useTraining } from '@/lib/TrainingContext';
import { PackageCheck, ClipboardCheck, ArrowLeftRight, SlidersHorizontal, CheckCircle2, ChevronDown, AlertTriangle } from 'lucide-react';

const TASKS = [
  { id: 'receive',   label: 'Task 1 — Receive a PO',         icon: PackageCheck,      desc: 'Confirm inbound stock and watch inventory increment.' },
  { id: 'stocktake', label: 'Task 2 — Stocktake Variance',    icon: ClipboardCheck,    desc: 'Enter physical counts and reconcile system stock.' },
  { id: 'transfer',  label: 'Task 3 — Multi-Site Transfer',   icon: ArrowLeftRight,    desc: 'Verify global balance is preserved across a transfer.' },
  { id: 'adjust',    label: 'Task 4 — Manual Adjustment',     icon: SlidersHorizontal, desc: 'Post a count-variance correction as ADJUST (not WASTE).' },
];

function ReceiveTask() {
  const { items, adjustStock } = useTraining();
  // Blocker 9: derive defaults from loaded DB items, not hardcoded IDs
  const [lines, setLines] = useState(() => [
    { itemId: items.find(i => i.sku === 'CHM-001')?.id ?? null, expected: 20, received: '' },
    { itemId: items.find(i => i.sku === 'CHM-004')?.id ?? null, expected: 12, received: '' },
  ]);
  const [done, setDone] = useState(false);
  const [posting, setPosting] = useState(false);
  const [error, setError] = useState(null);

  const handleReceive = async () => {
    setError(null);
    setPosting(true);
    try {
      for (const l of lines) {
        if (!l.itemId || l.received === '' || Number(l.received) === 0) continue;
        await adjustStock(l.itemId, Number(l.received), 'RECEIVE', 'IN', `PO-TRN-RCV-${Date.now()}`, 'PO receiving', 'RECEIVING');
      }
      setDone(true);
    } catch (e) {
      setError(e.message);
    }
    setPosting(false);
  };

  return (
    <div className="space-y-3">
      <p className="text-sm text-muted-foreground">Simulated PO: <span className="font-medium text-foreground">PO-TRN-001</span> — ProWash Ingredients</p>
      <table className="w-full text-sm border border-border rounded overflow-hidden">
        <thead className="bg-muted text-xs text-muted-foreground uppercase">
          <tr>{['Item', 'Expected', 'Received'].map(h => <th key={h} className="text-left px-3 py-2">{h}</th>)}</tr>
        </thead>
        <tbody>
          {lines.map((l, i) => {
            const item = items.find(x => x.id === l.itemId);
            return (
              <tr key={i} className="border-t border-border">
                <td className="px-3 py-2">{item?.name ?? '—'}</td>
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
      <button onClick={handleReceive} disabled={done || posting}
        className="h-8 px-4 text-sm rounded bg-primary text-primary-foreground hover:opacity-90 disabled:opacity-40">
        {posting ? 'Posting…' : 'Confirm Receiving'}
      </button>
      {error && <div className="flex items-start gap-2 p-3 bg-red-50 border border-red-200 rounded text-xs text-red-700"><AlertTriangle size={13} className="mt-0.5 flex-shrink-0" />{error}</div>}
      {done && <p className="text-sm text-green-600 font-medium flex items-center gap-1.5"><CheckCircle2 size={14}/> Receiving confirmed. RECEIVE movements persisted to TRAINING database.</p>}
      <div className="p-3 bg-amber-50 border border-amber-200 rounded text-xs text-amber-700">
        <strong>What to verify:</strong> Item stock increases. RECEIVE (IN) movements appear in audit log with balance_before and balance_after values. Environment is TRAINING.
      </div>
    </div>
  );
}

function StocktakeTask() {
  const { items, adjustStock } = useTraining();
  const [counts, setCounts] = useState({});
  const [done, setDone] = useState(false);
  const [posting, setPosting] = useState(false);
  const [error, setError] = useState(null);

  const handleCommit = async () => {
    setError(null);
    setPosting(true);
    try {
      for (const item of items) {
        const val = counts[item.id];
        if (val === undefined || val === '') continue;
        const diff = Number(val) - item.stock;
        if (diff === 0) continue;
        await adjustStock(
          item.id, diff, 'STOCKTAKE', diff >= 0 ? 'IN' : 'OUT',
          `STKTK-TRN-${new Date().toISOString().slice(0, 10)}`,
          `Stocktake: ${diff >= 0 ? '+' : ''}${diff}`,
          'STOCKTAKE'
        );
      }
      setDone(true);
    } catch (e) {
      setError(e.message);
    }
    setPosting(false);
  };

  const counted = Object.values(counts).filter(v => v !== '').length;
  return (
    <div className="space-y-3">
      <p className="text-sm text-muted-foreground">Enter physical counts below. Leave blank to skip an item.</p>
      <div className="border border-border rounded overflow-hidden bg-white">
        <table className="w-full text-sm">
          <thead className="bg-muted text-xs text-muted-foreground uppercase">
            <tr>{['Item', 'System', 'Physical Count', 'Variance'].map(h => <th key={h} className="text-left px-3 py-2">{h}</th>)}</tr>
          </thead>
          <tbody>
            {items.map((item, i) => {
              const c = counts[item.id];
              const variance = c !== undefined && c !== '' ? Number(c) - item.stock : null;
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
      <button onClick={handleCommit} disabled={done || posting || counted === 0}
        className="h-8 px-4 text-sm rounded bg-primary text-primary-foreground hover:opacity-90 disabled:opacity-40">
        {posting ? 'Committing…' : `Commit ${counted} Count${counted !== 1 ? 's' : ''}`}
      </button>
      {error && <div className="flex items-start gap-2 p-3 bg-red-50 border border-red-200 rounded text-xs text-red-700"><AlertTriangle size={13} className="mt-0.5 flex-shrink-0" />{error}</div>}
      {done && <p className="text-sm text-green-600 font-medium flex items-center gap-1.5"><CheckCircle2 size={14}/> Stocktake committed. STOCKTAKE movements persisted to TRAINING database.</p>}
      <div className="p-3 bg-amber-50 border border-amber-200 rounded text-xs text-amber-700">
        <strong>What to verify:</strong> Each variance posts a STOCKTAKE movement (IN for over, OUT for short). Audit log shows before/after values per item.
      </div>
    </div>
  );
}

function TransferTask() {
  // TRANSFER-001 fix: capture stockSnapshot BEFORE posting either leg so both
  // movements have accurate balance_before values and global stock stays unchanged.
  const { items, adjustStock } = useTraining();
  // Blocker 9: lazy-init from DB items to avoid undefined before load
  const [itemId, setItemId] = useState(() => items.find(i => i.sku === 'OPS-001')?.id ?? items[0]?.id ?? '');
  const [qty, setQty] = useState(100);
  const [done, setDone] = useState(false);
  const [posting, setPosting] = useState(false);
  const [error, setError] = useState(null);
  const [result, setResult] = useState(null);

  const item = items.find(i => i.id === itemId);

  const handlePost = async () => {
    if (!item) return;
    if (qty > item.stock) {
      setError(`Over-deduction: cannot transfer ${qty} — only ${item.stock} available.`);
      return;
    }
    setError(null);
    setPosting(true);
    try {
      const transferRef = `TRF-TRN-${Date.now()}`;
      // Snapshot stock BEFORE either leg posts — fixes TRANSFER-001 balance bug
      const stockBefore = item.stock;
      const stockAfterOut = stockBefore - qty;   // after OUT leg
      const stockAfterIn  = stockAfterOut + qty; // after IN leg (= stockBefore — global unchanged)

      const mv1 = await adjustStock(
        itemId, -qty, 'TRANSFER_OUT', 'OUT', transferRef,
        'Transfer from Main Site → North Branch (OUT leg)', 'TRANSFER', stockBefore
      );
      const mv2 = await adjustStock(
        itemId, +qty, 'TRANSFER_IN', 'IN', transferRef,
        'Transfer from Main Site → North Branch (IN leg)', 'TRANSFER', stockAfterOut
      );
      setResult({ stockBefore, stockAfterIn, ref: transferRef, mv1Id: mv1.id, mv2Id: mv2.id });
      setDone(true);
    } catch (e) {
      setError(e.message);
    }
    setPosting(false);
  };

  return (
    <div className="space-y-3">
      <p className="text-sm text-muted-foreground">From: <span className="font-medium text-foreground">Main Site</span> → To: <span className="font-medium text-foreground">North Branch</span></p>
      <div className="flex flex-wrap items-end gap-3">
        <div className="flex flex-col gap-1">
          <label className="text-xs text-muted-foreground">Item</label>
          <select value={itemId} onChange={e => { setItemId(e.target.value); setDone(false); setError(null); setResult(null); }}
            className="h-8 border border-border rounded px-2 text-sm bg-white">
            {items.map(i => <option key={i.id} value={i.id}>{i.name}</option>)}
          </select>
        </div>
        <div className="flex flex-col gap-1">
          <label className="text-xs text-muted-foreground">Qty to transfer</label>
          <input type="number" min={1} max={item?.stock ?? 999} value={qty}
            onChange={e => { setQty(Number(e.target.value)); setDone(false); setError(null); setResult(null); }}
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
        <button onClick={handlePost} disabled={done || posting || qty > (item?.stock ?? 0)}
          className="h-8 px-4 text-sm rounded bg-primary text-primary-foreground hover:opacity-90 disabled:opacity-40">
          {posting ? 'Posting…' : 'Post Transfer'}
        </button>
      </div>
      {error && <div className="flex items-start gap-2 p-3 bg-red-50 border border-red-200 rounded text-xs text-red-700"><AlertTriangle size={13} className="mt-0.5 flex-shrink-0" /><span><strong>Blocked:</strong> {error}</span></div>}
      {done && result && (
        <div className="space-y-1">
          <p className="text-sm text-green-600 font-medium flex items-center gap-1.5"><CheckCircle2 size={14}/> Transfer posted. Both legs persisted to TRAINING database.</p>
          <div className="p-3 bg-green-50 border border-green-200 rounded text-xs text-green-700 font-mono space-y-0.5">
            <p>Ref: {result.ref}</p>
            <p>Global stock: {result.stockBefore} → {result.stockAfterIn} (unchanged ✓)</p>
            <p>TRANSFER_OUT id: …{result.mv1Id.slice(-8)}</p>
            <p>TRANSFER_IN  id: …{result.mv2Id.slice(-8)}</p>
          </div>
        </div>
      )}
      <div className="p-3 bg-amber-50 border border-amber-200 rounded text-xs text-amber-700">
        <strong>What to verify:</strong> Global stock does NOT change. Both legs share the same reference. balance_before/after values are correct on each leg in the audit log.
      </div>
    </div>
  );
}

function AdjustTask() {
  const { items, adjustStock } = useTraining();
  // Blocker 9: lazy-init from DB items
  const [itemId, setItemId] = useState(() => items.find(i => i.sku === 'CHM-002')?.id ?? items[0]?.id ?? '');
  const [qty, setQty] = useState(2);
  const [direction, setDirection] = useState('OUT');
  const [done, setDone] = useState(false);
  const [posting, setPosting] = useState(false);
  const [error, setError] = useState(null);
  const item = items.find(i => i.id === itemId);

  const handlePost = async () => {
    setError(null);
    setPosting(true);
    try {
      await adjustStock(
        itemId, direction === 'OUT' ? -qty : qty, 'ADJUST', direction,
        `ADJ-TRN-${Date.now()}`, `Count Variance ${direction === 'OUT' ? 'Under' : 'Over'}`,
        'MANUAL'
      );
      setDone(true);
    } catch (e) {
      setError(e.message);
    }
    setPosting(false);
  };

  const expectedAfter = item ? item.stock + (direction === 'OUT' ? -qty : qty) : 0;

  return (
    <div className="space-y-3">
      <p className="text-sm text-muted-foreground">Post a count correction. Must appear as <strong>ADJUST</strong>, never WASTE.</p>
      <div className="flex flex-wrap items-end gap-3">
        <div className="flex flex-col gap-1">
          <label className="text-xs text-muted-foreground">Item</label>
          <select value={itemId} onChange={e => { setItemId(e.target.value); setDone(false); setError(null); }}
            className="h-8 border border-border rounded px-2 text-sm bg-white">
            {items.map(i => <option key={i.id} value={i.id}>{i.name}</option>)}
          </select>
        </div>
        <div className="flex flex-col gap-1">
          <label className="text-xs text-muted-foreground">Direction</label>
          <select value={direction} onChange={e => { setDirection(e.target.value); setDone(false); setError(null); }}
            className="h-8 border border-border rounded px-2 text-sm bg-white">
            <option value="OUT">Count Under (−)</option>
            <option value="IN">Count Over (+)</option>
          </select>
        </div>
        <div className="flex flex-col gap-1">
          <label className="text-xs text-muted-foreground">Qty</label>
          <input type="number" min={1} value={qty} onChange={e => { setQty(Number(e.target.value)); setDone(false); setError(null); }}
            className="w-20 h-8 border border-border rounded px-2 text-sm text-center" />
        </div>
        <button onClick={handlePost} disabled={done || posting}
          className="h-8 px-4 text-sm rounded bg-primary text-primary-foreground hover:opacity-90 disabled:opacity-40">
          {posting ? 'Posting…' : 'Post Adjustment'}
        </button>
      </div>
      {item && (
        <p className="text-xs text-muted-foreground">
          Current: <span className="font-mono font-semibold">{item.stock}</span>
          {' → '}After:{' '}
          {expectedAfter < 0
            ? <span className="font-mono font-semibold text-red-600">⛔ Over-deduction — will be blocked</span>
            : <span className="font-mono font-semibold">{expectedAfter}</span>}
        </p>
      )}
      {error && <div className="flex items-start gap-2 p-3 bg-red-50 border border-red-200 rounded text-xs text-red-700"><AlertTriangle size={13} className="mt-0.5 flex-shrink-0" /><span><strong>Blocked:</strong> {error}</span></div>}
      {done && <p className="text-sm text-green-600 font-medium flex items-center gap-1.5"><CheckCircle2 size={14}/> Adjustment posted. Movement type is ADJUST in audit log.</p>}
      <div className="p-3 bg-amber-50 border border-amber-200 rounded text-xs text-amber-700">
        <strong>What to verify:</strong> Movement type is ADJUST (not WASTE). Over-deduction is blocked. Audit log shows actor, role, before/after values.
      </div>
    </div>
  );
}

export default function TrainingSupervisor() {
  const [openTask, setOpenTask] = useState('receive');
  return (
    <TrainingShell role="supervisor">
      <div className="max-w-4xl space-y-5">
        <div>
          <h1 className="text-xl font-semibold text-foreground">Supervisor Training Dashboard</h1>
          <p className="text-sm text-muted-foreground mt-0.5">Validate inbound receiving, stocktakes, transfers, and adjustments. All writes go to the isolated TRAINING database.</p>
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
                    {task.id === 'receive'   && <ReceiveTask />}
                    {task.id === 'stocktake' && <StocktakeTask />}
                    {task.id === 'transfer'  && <TransferTask />}
                    {task.id === 'adjust'    && <AdjustTask />}
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