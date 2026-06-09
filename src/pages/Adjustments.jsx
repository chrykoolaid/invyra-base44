import { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { envFilter, ENV_LIVE } from '@/lib/envFilter';
import { postInventoryMovement } from '@/lib/inventoryMovement';
import { Plus, RefreshCw, ArrowUpCircle, ArrowDownCircle } from 'lucide-react';

const REASONS = [
  { label: 'Stock Found', direction: 'IN' },
  { label: 'Stock Correction', direction: 'IN' },
  { label: 'Count Variance (Over)', direction: 'IN' },
  { label: 'Count Variance (Under)', direction: 'OUT' },
  { label: 'Opening Balance', direction: 'IN' },
  { label: 'Supplier Short Shipment Correction', direction: 'IN' },
  { label: 'System Correction', direction: 'IN' },
  { label: 'Damaged – Not Wastage', direction: 'OUT' },
  { label: 'Write-Off', direction: 'OUT' },
];

export default function Adjustments() {
  const [items, setItems] = useState([]);
  const [adjustments, setAdjustments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);

  // Form state
  const [selectedItem, setSelectedItem] = useState('');
  const [reason, setReason] = useState('');
  const [qty, setQty] = useState('');
  const [notes, setNotes] = useState('');

  const loadData = async () => {
    setLoading(true);
    // Filter to LIVE environment only — exclude TRAINING/TEST records
    const [itemData, movements] = await Promise.all([
      base44.entities.InventoryItem.filter({ ...envFilter(), is_active: true }, 'name', 500),
      base44.entities.StockMovement.filter({ ...envFilter(), movement_type: 'ADJUST' }, '-created_date', 200),
    ]);
    setItems(itemData || []);
    setAdjustments((movements || []).sort((a, b) => new Date(b.created_date) - new Date(a.created_date)));
    setLoading(false);
  };

  useEffect(() => { loadData(); }, []);

  const selectedReason = REASONS.find(r => r.label === reason);
  const direction = selectedReason?.direction || 'IN';

  const handleSubmit = async () => {
    if (!selectedItem || !reason || !qty || Number(qty) <= 0) return;
    setSaving(true);

    const item = items.find(i => i.id === selectedItem);
    if (!item) { setSaving(false); return; }

    const user = await base44.auth.me();
    const ref = `ADJ-${Date.now().toString(36).toUpperCase()}`;
    const adjustQty = Number(qty);

    const currentStock = item.stock || 0;

    // Blocker 6 fix: block over-deduction — do not silently clamp to zero
    if (direction === 'OUT' && adjustQty > currentStock) {
      setSaving(false);
      return;
    }

    try {
      await postInventoryMovement({
        item,
        movementType: 'ADJUST',
        direction,
        qty: adjustQty,
        sourceType: 'MANUAL',
        sourceRef: ref,
        sourceModule: 'Adjustments',
        notes: `${reason}${notes ? ` — ${notes}` : ''}`,
        siteId: item.site_id || '',
        environment: ENV_LIVE,
        user,
      });
    } catch (error) {
      console.error('Adjustment post failed', error);
      setSaving(false);
      return;
    }

    setSaving(false);
    setShowForm(false);
    setSelectedItem(''); setReason(''); setQty(''); setNotes('');
    loadData();
  };

  return (
    <div className="p-5 lg:p-6 max-w-[1000px] space-y-5">
      <div className="flex items-start justify-between gap-4">
        <div className="space-y-1">
          <h1 className="text-xl font-semibold text-foreground">Inventory Adjustments</h1>
          <p className="text-sm text-muted-foreground">Correct stock levels for non-wastage reasons — count variances, found stock, opening balances, system corrections.</p>
        </div>
        <button
          onClick={() => setShowForm(v => !v)}
          className="flex items-center gap-2 h-9 px-4 text-sm rounded-xl bg-primary text-primary-foreground hover:opacity-90 font-medium flex-shrink-0"
        >
          <Plus size={14} /> New Adjustment
        </button>
      </div>

      {/* Form */}
      {showForm && (
        <div className="rounded-2xl border border-border bg-card p-5 space-y-4">
          <h2 className="text-sm font-semibold text-foreground">Create Adjustment</h2>

          <div>
            <label className="block text-[11px] font-semibold uppercase tracking-widest text-muted-foreground mb-1.5">Item</label>
            <select value={selectedItem} onChange={e => setSelectedItem(e.target.value)}
              className="w-full h-9 border border-border rounded-lg px-3 text-sm bg-background focus:outline-none focus:ring-1 focus:ring-ring">
              <option value="">Select item…</option>
              {items.map(it => (
                <option key={it.id} value={it.id}>{it.name} ({it.sku}) — On hand: {it.stock ?? 0}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-[11px] font-semibold uppercase tracking-widest text-muted-foreground mb-1.5">Reason</label>
            <select value={reason} onChange={e => setReason(e.target.value)}
              className="w-full h-9 border border-border rounded-lg px-3 text-sm bg-background focus:outline-none focus:ring-1 focus:ring-ring">
              <option value="">Select reason…</option>
              {REASONS.map(r => <option key={r.label} value={r.label}>{r.label} ({r.direction === 'IN' ? '+' : '−'})</option>)}
            </select>
          </div>

          {reason && (
            <div className={`rounded-lg border px-3 py-2 text-xs font-medium ${
              direction === 'IN' ? 'border-green-200 bg-green-50 text-green-700' : 'border-red-200 bg-red-50 text-red-700'
            }`}>
              This adjustment will <strong>{direction === 'IN' ? 'increase (+)' : 'decrease (−)'}</strong> stock
            </div>
          )}

          {/* Over-deduction warning */}
          {direction === 'OUT' && selectedItem && qty && Number(qty) > (items.find(i => i.id === selectedItem)?.stock || 0) && (
            <div className="rounded-lg border border-red-300 bg-red-50 px-3 py-2 text-xs font-medium text-red-700">
              ⛔ Over-deduction blocked: qty {qty} exceeds on-hand stock of {items.find(i => i.id === selectedItem)?.stock ?? 0}. Reduce quantity.
            </div>
          )}

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-[11px] font-semibold uppercase tracking-widest text-muted-foreground mb-1.5">Quantity</label>
              <input type="number" min={1} value={qty} onChange={e => setQty(e.target.value)} placeholder="e.g. 5"
                className="w-full h-9 border border-border rounded-lg px-3 text-sm bg-background focus:outline-none focus:ring-1 focus:ring-ring" />
            </div>
            <div>
              <label className="block text-[11px] font-semibold uppercase tracking-widest text-muted-foreground mb-1.5">Notes (optional)</label>
              <input value={notes} onChange={e => setNotes(e.target.value)} placeholder="Additional context…"
                className="w-full h-9 border border-border rounded-lg px-3 text-sm bg-background focus:outline-none focus:ring-1 focus:ring-ring" />
            </div>
          </div>

          <div className="flex gap-2 justify-end pt-2 border-t border-border">
            <button onClick={() => setShowForm(false)} className="h-9 px-4 text-sm border border-border rounded-xl hover:bg-muted">Cancel</button>
            <button
              onClick={handleSubmit}
              disabled={saving || !selectedItem || !reason || !qty || Number(qty) <= 0 || (direction === 'OUT' && Number(qty) > (items.find(i => i.id === selectedItem)?.stock || 0))}
              className="h-9 px-5 text-sm bg-primary text-primary-foreground rounded-xl hover:opacity-90 disabled:opacity-40 font-medium"
            >
              {saving ? 'Posting…' : 'Post Adjustment'}
            </button>
          </div>
        </div>
      )}

      {/* Adjustment Log */}
      <div className="rounded-2xl border border-border bg-card overflow-hidden">
        <div className="px-5 py-3.5 border-b border-border bg-muted/25 flex items-center justify-between">
          <h2 className="text-sm font-semibold text-foreground">Adjustment History</h2>
          <button onClick={loadData} disabled={loading} className="flex items-center gap-1.5 h-8 px-3 text-xs rounded border border-border hover:bg-muted disabled:opacity-50">
            <RefreshCw size={12} className={loading ? 'animate-spin' : ''} /> Refresh
          </button>
        </div>

        {loading ? (
          <div className="py-12 text-center text-sm text-muted-foreground">Loading adjustments…</div>
        ) : adjustments.length === 0 ? (
          <div className="py-12 text-center text-sm text-muted-foreground">No adjustments posted yet.</div>
        ) : (
          <div className="divide-y divide-border">
            {adjustments.map(adj => (
              <div key={adj.id} className="px-5 py-4 hover:bg-muted/20 transition-colors">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-start gap-3 min-w-0">
                    {adj.direction === 'IN'
                      ? <ArrowUpCircle size={18} className="text-green-600 flex-shrink-0 mt-0.5" />
                      : <ArrowDownCircle size={18} className="text-red-500 flex-shrink-0 mt-0.5" />}
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-foreground">{adj.item_name}</p>
                      <p className="text-xs font-mono text-muted-foreground">{adj.sku}</p>
                      <p className="text-xs text-muted-foreground mt-1">{adj.notes}</p>
                    </div>
                  </div>
                  <div className="text-right flex-shrink-0">
                    <p className={`text-lg font-bold ${adj.direction === 'IN' ? 'text-green-600' : 'text-red-600'}`}>
                      {adj.direction === 'IN' ? '+' : '−'}{adj.qty}
                    </p>
                    <p className="text-xs text-muted-foreground">→ {adj.balance_after} on hand</p>
                  </div>
                </div>
                <div className="flex items-center gap-3 mt-2 text-xs text-muted-foreground ml-9">
                  <span className="font-mono">{adj.source_ref}</span>
                  <span>•</span>
                  <span>{adj.posted_by}</span>
                  <span>•</span>
                  <span>{new Date(adj.created_date).toLocaleString()}</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}