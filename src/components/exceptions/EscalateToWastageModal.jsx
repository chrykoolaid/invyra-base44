import { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { X, ArrowUpRight } from 'lucide-react';

const WASTAGE_REASONS = [
  'Damaged', 'Expired', 'Spoiled', 'Contaminated', 'Breakage', 'Handling Damage', 'Other',
];

export default function EscalateToWastageModal({ hold, onClose, onEscalated }) {
  const [form, setForm] = useState({
    stock_out_class: 'WASTAGE',
    reason_category: '',
    reason_notes: '',
    quantity: hold.qty_on_hold || '',
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const set = (k, v) => setForm(p => ({ ...p, [k]: v }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.reason_category) { setError('Reason is required.'); return; }
    if (!form.quantity || Number(form.quantity) <= 0) { setError('A valid quantity is required.'); return; }
    setSaving(true);
    setError('');

    // 1. Create a StockOutRecord (DRAFT) via the existing backend function
    const response = await base44.functions.invoke('createStockOutRecord', {
      sku: hold.sku,
      item_id: hold.item_id,
      item_name: hold.item_name,
      stock_out_class: form.stock_out_class,
      quantity: Number(form.quantity),
      reason_category: form.reason_category,
      reason_notes: form.reason_notes || `Escalated from ItemHold: ${hold.hold_reason}`,
      location: hold.location_name || '',
      source: 'MANUAL',
      source_reference: `HOLD-ESC-${hold.id.slice(-6).toUpperCase()}`,
      environment: hold.environment || 'LIVE',
    });

    const recordId = response?.data?.record?.id;

    // 2. Mark the hold as ESCALATED with a reference to the StockOutRecord
    const user = await base44.auth.me();
    await base44.entities.ItemHold.update(hold.id, {
      status: 'ESCALATED',
      reviewed_by: user?.email || '',
      reviewed_at: new Date().toISOString(),
      escalation_ref: recordId || '',
      release_notes: form.reason_notes || '',
    });

    setSaving(false);
    onEscalated(recordId);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-card border border-border rounded-xl shadow-xl">
        <div className="flex items-center justify-between px-5 py-4 border-b border-border">
          <div className="flex items-center gap-2">
            <ArrowUpRight size={14} className="text-purple-600" />
            <h2 className="text-sm font-semibold text-foreground">Escalate to Wastage</h2>
          </div>
          <button onClick={onClose} className="h-7 w-7 flex items-center justify-center rounded hover:bg-muted text-muted-foreground">
            <X size={15} />
          </button>
        </div>

        <div className="px-5 pt-4 pb-2">
          <div className="rounded-lg border border-purple-200 bg-purple-50 px-3 py-2 text-xs text-purple-800 mb-4">
            <span className="font-semibold">{hold.item_name}</span>
            <span className="font-mono text-purple-600 ml-2">{hold.sku}</span>
            {hold.batch_number && <span className="ml-2">· Batch: {hold.batch_number}</span>}
            <div className="mt-0.5 text-purple-700">Reason: {hold.hold_reason}</div>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="px-5 pb-5 space-y-3">
          {error && <p className="text-xs text-red-600 bg-red-50 border border-red-200 rounded px-3 py-2">{error}</p>}

          <div className="grid grid-cols-2 gap-3">
            <label className="block space-y-1">
              <span className="text-xs text-muted-foreground">Disposition Class *</span>
              <select value={form.stock_out_class} onChange={e => set('stock_out_class', e.target.value)}
                className="h-9 w-full border border-border rounded-lg px-3 text-sm bg-background focus:outline-none focus:ring-1 focus:ring-ring">
                <option value="WASTAGE">Wastage</option>
                <option value="STORE_USE">Store Use</option>
              </select>
            </label>
            <label className="block space-y-1">
              <span className="text-xs text-muted-foreground">Quantity *</span>
              <input type="number" min={1} value={form.quantity} onChange={e => set('quantity', e.target.value)}
                placeholder="Units to write off"
                className="h-9 w-full border border-border rounded-lg px-3 text-sm bg-background focus:outline-none focus:ring-1 focus:ring-ring" />
            </label>
          </div>

          <label className="block space-y-1">
            <span className="text-xs text-muted-foreground">Wastage Reason *</span>
            <select value={form.reason_category} onChange={e => set('reason_category', e.target.value)} required
              className="h-9 w-full border border-border rounded-lg px-3 text-sm bg-background focus:outline-none focus:ring-1 focus:ring-ring">
              <option value="">Select reason…</option>
              {WASTAGE_REASONS.map(r => <option key={r} value={r}>{r}</option>)}
            </select>
          </label>

          <label className="block space-y-1">
            <span className="text-xs text-muted-foreground">Notes (optional)</span>
            <textarea value={form.reason_notes} onChange={e => set('reason_notes', e.target.value)}
              rows={2} placeholder="Additional context for the wastage record…"
              className="w-full border border-border rounded-lg px-3 py-2 text-sm bg-background focus:outline-none focus:ring-1 focus:ring-ring resize-none" />
          </label>

          <div className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-800">
            This creates a <strong>Wastage Draft</strong> linked to the hold. The hold will be marked <strong>ESCALATED</strong>. The wastage record still requires supervisor approval before stock is deducted.
          </div>

          <div className="flex items-center justify-end gap-2 pt-1 border-t border-border">
            <button type="button" onClick={onClose}
              className="h-9 px-4 text-sm border border-border rounded-lg hover:bg-muted transition-colors">Cancel</button>
            <button type="submit" disabled={saving}
              className="h-9 px-5 text-sm bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50 font-medium">
              {saving ? 'Escalating…' : 'Escalate to Wastage'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}