import { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { X, ArrowDownToLine, AlertCircle } from 'lucide-react';

export default function RemoveFromFloorModal({ batch, onClose, onDone }) {
  const [form, setForm] = useState({ actual_floor_count: '', removal_notes: '' });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (form.actual_floor_count === '') { setError('Actual floor count is required.'); return; }
    setSaving(true);
    setError('');
    const res = await base44.functions.invoke('removeMarkdownFromFloor', {
      batch_id: batch.id,
      actual_floor_count: Number(form.actual_floor_count),
      removal_notes: form.removal_notes,
    });
    setSaving(false);
    if (res.data?.success) {
      onDone();
    } else {
      setError(res.data?.error || 'Removal failed.');
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/30 flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-card border border-border rounded-xl shadow-xl">
        <div className="flex items-center justify-between px-5 py-4 border-b border-border">
          <div>
            <h2 className="text-base font-semibold text-foreground">Remove from Floor</h2>
            <p className="text-xs text-muted-foreground mt-0.5">{batch.batch_ref} — {batch.item_name}</p>
          </div>
          <button onClick={onClose} className="w-7 h-7 flex items-center justify-center rounded hover:bg-muted text-muted-foreground"><X size={15} /></button>
        </div>
        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          <div className="p-3 rounded-lg bg-muted text-xs grid grid-cols-2 gap-2">
            <div><span className="block font-semibold text-foreground">System Remaining</span>{batch.current_remaining_qty}</div>
            <div><span className="block font-semibold text-foreground">Sold Qty</span>{batch.sold_qty || 0}</div>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Actual Floor Count *</label>
            <input
              type="number" min="0"
              value={form.actual_floor_count}
              onChange={e => setForm(f => ({ ...f, actual_floor_count: e.target.value }))}
              placeholder="Physical count taken from floor"
              className="w-full h-9 border border-border rounded px-3 text-sm bg-background focus:outline-none focus:ring-1 focus:ring-ring"
              required
            />
            <p className="text-[11px] text-muted-foreground">System expects {batch.current_remaining_qty}. Enter actual count found on floor.</p>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Notes</label>
            <textarea
              value={form.removal_notes}
              onChange={e => setForm(f => ({ ...f, removal_notes: e.target.value }))}
              placeholder="Optional removal notes"
              rows={2}
              className="w-full border border-border rounded px-3 py-2 text-sm bg-background focus:outline-none focus:ring-1 focus:ring-ring resize-none"
            />
          </div>

          {error && (
            <div className="flex items-start gap-2 p-3 rounded border border-red-200 bg-red-50 text-xs text-red-700">
              <AlertCircle size={13} className="mt-0.5 flex-shrink-0" />{error}
            </div>
          )}
          <div className="flex justify-end gap-2">
            <button type="button" onClick={onClose} className="h-9 px-4 text-sm border border-border rounded hover:bg-muted">Cancel</button>
            <button type="submit" disabled={saving} className="flex items-center gap-1.5 h-9 px-4 text-sm bg-orange-600 text-white rounded hover:opacity-90 disabled:opacity-50">
              <ArrowDownToLine size={14} /> {saving ? 'Processing…' : 'Confirm Removal'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}