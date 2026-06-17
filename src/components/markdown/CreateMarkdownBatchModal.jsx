import { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { X, AlertCircle } from 'lucide-react';

export default function CreateMarkdownBatchModal({ onClose, onCreated }) {
  const [items, setItems] = useState([]);
  const [form, setForm] = useState({ item_id: '', allocated_qty: '', site_id: '' });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [result, setResult] = useState(null);

  useEffect(() => {
    base44.entities.InventoryItem.filter({ environment: 'LIVE', is_active: true }, 'name', 200)
      .then(data => setItems(data || []));
  }, []);

  const selectedItem = items.find(i => i.id === form.item_id);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.item_id || !form.allocated_qty || Number(form.allocated_qty) <= 0) {
      setError('Select an item and enter a valid quantity.');
      return;
    }
    if (selectedItem && Number(form.allocated_qty) > (selectedItem.stock || 0)) {
      setError(`Allocated qty (${form.allocated_qty}) exceeds available stock (${selectedItem.stock || 0}).`);
      return;
    }
    setSaving(true);
    setError('');
    const res = await base44.functions.invoke('createMarkdownBatch', {
      sku: selectedItem.sku,
      item_id: form.item_id,
      item_name: selectedItem.name,
      allocated_qty: Number(form.allocated_qty),
      site_id: form.site_id,
      environment: 'LIVE',
    });
    setSaving(false);
    if (res.data?.success) {
      setResult(res.data);
      onCreated();
    } else {
      setError(res.data?.error || 'Failed to create batch.');
    }
  };

  if (result) {
    return (
      <div className="fixed inset-0 z-50 bg-black/30 flex items-center justify-center p-4">
        <div className="w-full max-w-md bg-card border border-border rounded-xl shadow-xl p-6 text-center">
          <div className="w-12 h-12 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-4">
            <span className="text-green-600 text-xl font-bold">✓</span>
          </div>
          <h2 className="text-lg font-semibold text-foreground mb-1">Batch Created</h2>
          <p className="text-sm text-muted-foreground mb-2">
            {result.batch?.batch_ref || 'Batch'} — {result.batch?.status}
          </p>
          {result.requires_approval && (
            <div className="mb-4 p-3 rounded-lg border border-amber-200 bg-amber-50 text-xs text-amber-700">
              This batch requires Supervisor/Manager approval before printing labels.
            </div>
          )}
          <button onClick={onClose} className="h-9 px-6 bg-primary text-primary-foreground rounded hover:opacity-90 text-sm">
            Done
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-50 bg-black/30 flex items-center justify-center p-4">
      <div className="w-full max-w-lg bg-card border border-border rounded-xl shadow-xl">
        <div className="flex items-center justify-between px-5 py-4 border-b border-border">
          <div>
            <h2 className="text-base font-semibold text-foreground">New Markdown Batch</h2>
            <p className="text-xs text-muted-foreground mt-0.5">Item Master is read-only — only sku/qty are referenced</p>
          </div>
          <button onClick={onClose} className="w-7 h-7 flex items-center justify-center rounded hover:bg-muted text-muted-foreground">
            <X size={15} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Item *</label>
            <select
              value={form.item_id}
              onChange={e => { setForm(f => ({ ...f, item_id: e.target.value })); setError(''); }}
              className="w-full h-9 border border-border rounded px-3 text-sm bg-background focus:outline-none focus:ring-1 focus:ring-ring"
              required
            >
              <option value="">Select item…</option>
              {items.map(item => (
                <option key={item.id} value={item.id}>
                  {item.name} ({item.sku}) — {item.stock || 0} in stock
                </option>
              ))}
            </select>
          </div>

          {selectedItem && (
            <div className="p-3 rounded-lg bg-muted text-xs text-muted-foreground grid grid-cols-3 gap-2">
              <div><span className="block font-semibold text-foreground">On Hand</span>{selectedItem.stock || 0} {selectedItem.unit}</div>
              <div><span className="block font-semibold text-foreground">Unit Price</span>{selectedItem.cost_per_unit ? `₱${selectedItem.cost_per_unit.toFixed(2)}` : '—'}</div>
              <div><span className="block font-semibold text-foreground">Reorder Pt.</span>{selectedItem.reorder_point || '—'}</div>
            </div>
          )}

          <div className="space-y-1.5">
            <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Quantity to Allocate *</label>
            <input
              type="number"
              min="1"
              max={selectedItem?.stock || undefined}
              value={form.allocated_qty}
              onChange={e => { setForm(f => ({ ...f, allocated_qty: e.target.value })); setError(''); }}
              placeholder="e.g. 24"
              className="w-full h-9 border border-border rounded px-3 text-sm bg-background focus:outline-none focus:ring-1 focus:ring-ring"
              required
            />
          </div>

          <div className="p-3 rounded-lg border border-amber-200 bg-amber-50 text-xs text-amber-800">
            <strong>Governance:</strong> Staff-initiated batches will require Supervisor or Manager approval before labels can be printed. No stock is deducted until disposition is confirmed.
          </div>

          {error && (
            <div className="flex items-start gap-2 p-3 rounded border border-red-200 bg-red-50 text-xs text-red-700">
              <AlertCircle size={13} className="mt-0.5 flex-shrink-0" />
              {error}
            </div>
          )}

          <div className="flex justify-end gap-2 pt-1">
            <button type="button" onClick={onClose} className="h-9 px-4 text-sm border border-border rounded hover:bg-muted">Cancel</button>
            <button type="submit" disabled={saving} className="h-9 px-4 text-sm bg-primary text-primary-foreground rounded hover:opacity-90 disabled:opacity-50">
              {saving ? 'Creating…' : 'Create Batch'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}