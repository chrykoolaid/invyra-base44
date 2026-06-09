import { useState, useEffect } from 'react';
import { X, ArrowLeftRight, Plus, Trash2 } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { ENV_LIVE } from '@/lib/envFilter';
import { postInventoryTransfer } from '@/lib/inventoryMovement';

export default function TransferModal({ allItems, onClose, onDone }) {
  const [sites, setSites] = useState([]);
  const [fromSite, setFromSite] = useState('');
  const [toSite, setToSite] = useState('');
  const [lines, setLines] = useState([{ item_id: '', qty: '' }]);
  const [notes, setNotes] = useState('');
  const [saving, setSaving] = useState(false);
  const [done, setDone] = useState(false);

  useEffect(() => {
    base44.entities.Site.filter({ is_active: true }).then(rows => setSites(rows || []));
  }, []);

  const addLine = () => setLines(prev => [...prev, { item_id: '', qty: '' }]);
  const removeLine = (i) => setLines(prev => prev.filter((_, idx) => idx !== i));
  const updateLine = (i, field, value) => setLines(prev => prev.map((l, idx) => idx === i ? { ...l, [field]: value } : l));

  const validLines = lines.filter(l => l.item_id && Number(l.qty) > 0);

  const handleSubmit = async () => {
    if (!fromSite || !toSite || fromSite === toSite || validLines.length === 0) return;
    setSaving(true);

    const ref = `TRF-${Date.now().toString(36).toUpperCase()}`;
    const user = await base44.auth.me();
    const workingItems = new Map((allItems || []).map(item => [item.id, { ...item, stock_per_site: { ...(item.stock_per_site || {}) } }]));

    try {
      for (const line of validLines) {
        const item = workingItems.get(line.item_id);
        if (!item) continue;
        const result = await postInventoryTransfer({
          item,
          fromSite,
          toSite,
          qty: Number(line.qty),
          sourceRef: ref,
          notes,
          environment: ENV_LIVE,
          user,
        });
        const nextStockPerSite = {
          ...(item.stock_per_site || {}),
          [fromSite]: result.balance_after.from,
          [toSite]: result.balance_after.to,
        };
        const nextTotal = Object.values(nextStockPerSite).reduce((sum, value) => sum + Number(value || 0), 0);
        workingItems.set(item.id, { ...item, stock_per_site: nextStockPerSite, stock: nextTotal });
      }
    } catch (error) {
      console.error('Transfer post failed', error);
      setSaving(false);
      return;
    }

    setSaving(false);
    setDone(true);
    onDone && onDone();
  };

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
      <div className="bg-card border border-border rounded-xl w-full max-w-lg shadow-xl">

        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-border">
          <div className="flex items-center gap-2">
            <ArrowLeftRight size={16} className="text-primary" />
            <h2 className="text-sm font-semibold text-foreground">Stock Transfer</h2>
          </div>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground transition-colors">
            <X size={16} />
          </button>
        </div>

        {done ? (
          <div className="px-5 py-10 text-center space-y-2">
            <div className="text-2xl">✓</div>
            <p className="font-semibold text-foreground">Transfer posted</p>
            <p className="text-sm text-muted-foreground">Stock levels and ledger have been updated.</p>
            <button onClick={onClose} className="mt-4 h-9 px-6 text-sm bg-primary text-primary-foreground rounded hover:opacity-90 transition-opacity">
              Close
            </button>
          </div>
        ) : (
          <div className="px-5 py-4 space-y-4">

            {/* From / To sites */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-[11px] font-semibold text-muted-foreground uppercase tracking-widest mb-1">From Site</label>
                <select value={fromSite} onChange={e => setFromSite(e.target.value)}
                  className="w-full h-8 border border-border rounded px-2 text-sm bg-background focus:outline-none focus:ring-1 focus:ring-ring">
                  <option value="">Select…</option>
                  {sites.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-[11px] font-semibold text-muted-foreground uppercase tracking-widest mb-1">To Site</label>
                <select value={toSite} onChange={e => setToSite(e.target.value)}
                  className="w-full h-8 border border-border rounded px-2 text-sm bg-background focus:outline-none focus:ring-1 focus:ring-ring">
                  <option value="">Select…</option>
                  {sites.filter(s => s.id !== fromSite).map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                </select>
              </div>
            </div>

            {fromSite === toSite && fromSite && (
              <p className="text-xs text-destructive">Source and destination cannot be the same site.</p>
            )}

            {/* Line items */}
            <div>
              <label className="block text-[11px] font-semibold text-muted-foreground uppercase tracking-widest mb-2">Items to Transfer</label>
              <div className="space-y-2">
                {lines.map((line, i) => (
                  <div key={i} className="flex items-center gap-2">
                    <select value={line.item_id} onChange={e => updateLine(i, 'item_id', e.target.value)}
                      className="flex-1 h-8 border border-border rounded px-2 text-sm bg-background focus:outline-none focus:ring-1 focus:ring-ring">
                      <option value="">Select item…</option>
                      {allItems.map(item => (
                        <option key={item.id} value={item.id}>{item.name} ({item.sku})</option>
                      ))}
                    </select>
                    <input
                      type="number" min={1} placeholder="Qty"
                      value={line.qty}
                      onChange={e => updateLine(i, 'qty', e.target.value)}
                      className="w-20 h-8 border border-border rounded px-2 text-sm text-center bg-background focus:outline-none focus:ring-1 focus:ring-ring"
                    />
                    {lines.length > 1 && (
                      <button onClick={() => removeLine(i)} className="text-muted-foreground hover:text-destructive transition-colors">
                        <Trash2 size={13} />
                      </button>
                    )}
                  </div>
                ))}
              </div>
              <button onClick={addLine} className="mt-2 flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors">
                <Plus size={12} /> Add item
              </button>
            </div>

            {/* Notes */}
            <div>
              <label className="block text-[11px] font-semibold text-muted-foreground uppercase tracking-widest mb-1">Notes (optional)</label>
              <input value={notes} onChange={e => setNotes(e.target.value)} placeholder="e.g. Driver name, reason…"
                className="w-full h-8 border border-border rounded px-3 text-sm bg-background focus:outline-none focus:ring-1 focus:ring-ring" />
            </div>

            {/* Footer */}
            <div className="flex justify-end gap-2 pt-2 border-t border-border">
              <button onClick={onClose} className="h-8 px-4 text-sm border border-border rounded hover:bg-muted transition-colors text-foreground">
                Cancel
              </button>
              <button
                onClick={handleSubmit}
                disabled={saving || !fromSite || !toSite || fromSite === toSite || validLines.length === 0}
                className="h-8 px-5 text-sm bg-primary text-primary-foreground rounded hover:opacity-90 transition-opacity disabled:opacity-40 disabled:cursor-not-allowed font-medium"
              >
                {saving ? 'Posting…' : 'Post Transfer'}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}