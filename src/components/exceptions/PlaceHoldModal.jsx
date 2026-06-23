import { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { envFilter } from '@/lib/envFilter';
import { X, Lock } from 'lucide-react';

const HOLD_REASONS = [
  'Supplier Recall',
  'Contamination Concern',
  'Damaged — Awaiting Decision',
  'Expired — Blocked from Sale',
  'Batch Under Investigation',
  'Do-Not-Sell Manager Hold',
  'Other',
];

export default function PlaceHoldModal({ onClose, onSaved }) {
  const [items, setItems] = useState([]);
  const [locations, setLocations] = useState([]);
  const [batches, setBatches] = useState([]);
  const [form, setForm] = useState({
    item_id: '',
    batch_id: '',
    location_id: '',
    hold_reason: '',
    hold_notes: '',
    qty_on_hold: '',
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    Promise.all([
      base44.entities.InventoryItem.filter({ ...envFilter(), is_active: true }, 'name', 300),
      base44.entities.Location.filter({ ...envFilter(), is_active: true }, 'name', 100),
    ]).then(([itemRows, locRows]) => {
      setItems(itemRows || []);
      setLocations(locRows || []);
    });
  }, []);

  useEffect(() => {
    if (!form.item_id) { setBatches([]); return; }
    base44.entities.ItemBatch.filter({ ...envFilter(), item_id: form.item_id }, '-created_date', 50)
      .then(rows => setBatches(rows || []));
  }, [form.item_id]);

  const set = (k, v) => setForm(p => ({ ...p, [k]: v }));

  const selectedItem = items.find(i => i.id === form.item_id);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.item_id || !form.hold_reason) { setError('Item and reason are required.'); return; }
    if (!selectedItem?.id) { setError('Selected item could not be resolved.'); return; }
    setSaving(true);
    setError('');

    try {
      const user = await base44.auth.me();
      const actor = user?.email || user?.full_name || '';
      const selectedBatch = batches.find(b => b.id === form.batch_id);
      const selectedLocation = locations.find(l => l.id === form.location_id);

      const hold = await base44.entities.ItemHold.create({
        ...envFilter(),
        item_id: form.item_id,
        sku: selectedItem?.sku || '',
        item_name: selectedItem?.name || '',
        batch_id: form.batch_id || undefined,
        batch_number: selectedBatch?.batch_number || undefined,
        location_id: form.location_id || undefined,
        location_name: selectedLocation?.name || undefined,
        hold_reason: form.hold_reason,
        hold_notes: form.hold_notes || undefined,
        qty_on_hold: form.qty_on_hold ? Number(form.qty_on_hold) : undefined,
        status: 'ACTIVE',
        placed_by: actor,
        placed_by_name: user?.full_name || '',
        placed_at: new Date().toISOString(),
      });

      await base44.entities.AuditLog.create({
        ...envFilter(),
        item_id: selectedItem.id,
        sku: selectedItem.sku || '',
        item_name: selectedItem.name || '',
        change_type: 'ITEM_UPDATE',
        action_type: 'ITEM_HOLD_PLACED',
        field_name: 'ItemHold.status',
        old_value: '',
        new_value: 'ACTIVE',
        changed_by: actor,
        actor_role: user?.role || '',
        source_module: 'ExceptionsHolds',
        source_record_id: hold?.id || '',
        linked_source_record: hold?.id || '',
        notes: form.hold_notes || form.hold_reason,
      });

      onSaved();
    } catch (err) {
      console.error('Failed to place hold:', err);
      setError('Failed to place hold. No stock movement was posted.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4">
      <div className="w-full max-w-lg bg-card border border-border rounded-xl shadow-xl">
        <div className="flex items-center justify-between px-5 py-4 border-b border-border">
          <div className="flex items-center gap-2">
            <Lock size={14} className="text-red-500" />
            <h2 className="text-sm font-semibold text-foreground">Place Item Hold</h2>
          </div>
          <button onClick={onClose} className="h-7 w-7 flex items-center justify-center rounded hover:bg-muted text-muted-foreground">
            <X size={15} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="px-5 py-4 space-y-4">
          {error && <p className="text-xs text-red-600 bg-red-50 border border-red-200 rounded px-3 py-2">{error}</p>}

          <label className="block space-y-1">
            <span className="text-xs text-muted-foreground">Item *</span>
            <select value={form.item_id} onChange={e => set('item_id', e.target.value)} required
              className="h-9 w-full border border-border rounded-lg px-3 text-sm bg-background focus:outline-none focus:ring-1 focus:ring-ring">
              <option value="">Select item…</option>
              {items.map(i => <option key={i.id} value={i.id}>{i.name} ({i.sku})</option>)}
            </select>
          </label>

          <div className="grid grid-cols-2 gap-3">
            <label className="block space-y-1">
              <span className="text-xs text-muted-foreground">Batch (optional)</span>
              <select value={form.batch_id} onChange={e => set('batch_id', e.target.value)}
                disabled={!form.item_id}
                className="h-9 w-full border border-border rounded-lg px-3 text-sm bg-background focus:outline-none focus:ring-1 focus:ring-ring disabled:opacity-50">
                <option value="">All batches</option>
                {batches.map(b => <option key={b.id} value={b.id}>{b.batch_number}{b.expiry_date ? ` · exp ${b.expiry_date}` : ''}</option>)}
              </select>
            </label>
            <label className="block space-y-1">
              <span className="text-xs text-muted-foreground">Location (optional)</span>
              <select value={form.location_id} onChange={e => set('location_id', e.target.value)}
                className="h-9 w-full border border-border rounded-lg px-3 text-sm bg-background focus:outline-none focus:ring-1 focus:ring-ring">
                <option value="">All locations</option>
                {locations.map(l => <option key={l.id} value={l.id}>{l.name}</option>)}
              </select>
            </label>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <label className="block space-y-1">
              <span className="text-xs text-muted-foreground">Hold Reason *</span>
              <select value={form.hold_reason} onChange={e => set('hold_reason', e.target.value)} required
                className="h-9 w-full border border-border rounded-lg px-3 text-sm bg-background focus:outline-none focus:ring-1 focus:ring-ring">
                <option value="">Select reason…</option>
                {HOLD_REASONS.map(r => <option key={r} value={r}>{r}</option>)}
              </select>
            </label>
            <label className="block space-y-1">
              <span className="text-xs text-muted-foreground">Qty on Hold (optional)</span>
              <input type="number" min={0} value={form.qty_on_hold} onChange={e => set('qty_on_hold', e.target.value)}
                placeholder="e.g. 24"
                className="h-9 w-full border border-border rounded-lg px-3 text-sm bg-background focus:outline-none focus:ring-1 focus:ring-ring" />
            </label>
          </div>

          <label className="block space-y-1">
            <span className="text-xs text-muted-foreground">Notes (optional)</span>
            <textarea value={form.hold_notes} onChange={e => set('hold_notes', e.target.value)}
              rows={2} placeholder="Reason details, reference numbers, source of concern…"
              className="w-full border border-border rounded-lg px-3 py-2 text-sm bg-background focus:outline-none focus:ring-1 focus:ring-ring resize-none" />
          </label>

          <div className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-800">
            <strong>Holds V1:</strong> Placing this hold blocks markdown POS validation and transfer submission where hold verification succeeds. Broader item-use blocking and batch/location-specific enforcement are planned hardening.
          </div>

          <div className="flex items-center justify-end gap-2 pt-1 border-t border-border">
            <button type="button" onClick={onClose}
              className="h-9 px-4 text-sm border border-border rounded-lg hover:bg-muted transition-colors">Cancel</button>
            <button type="submit" disabled={saving}
              className="h-9 px-5 text-sm bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 font-medium">
              {saving ? 'Placing Hold…' : 'Place Hold'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}