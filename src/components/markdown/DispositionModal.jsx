import { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { X, AlertCircle, CheckCircle } from 'lucide-react';

const OUTCOME_TYPES = ['Waste', 'Store_Use', 'Donate', 'Return_To_Supplier', 'Transfer', 'Recover'];

const OUTCOME_LABELS = {
  Waste:              'Waste — Write off to waste',
  Store_Use:          'Store Use — Internal consumption',
  Donate:             'Donate — Charity/donation',
  Return_To_Supplier: 'Return to Supplier',
  Transfer:           'Transfer — Move to another site',
  Recover:            'Recover — Return to full-price inventory',
};

const OUTCOME_WARNING = {
  Waste:              'This will create a WASTE StockMovement and reduce system stock. This action cannot be undone without a manual reversal.',
  Return_To_Supplier: 'This will create an ADJUST StockMovement (OUT) and reduce system stock.',
  Recover:            'Recovery will be processed separately and will restore the item to full-price inventory.',
};

export default function DispositionModal({ reviewEntry, batch, onClose, onConfirmed }) {
  const [form, setForm] = useState({
    outcome_type: '',
    qty: reviewEntry.actual_floor_count || '',
    disposition_reason_code: '',
    disposition_notes: '',
    destination_ref: '',
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.outcome_type || !form.qty || Number(form.qty) <= 0) {
      setError('Select an outcome type and enter a valid quantity.');
      return;
    }
    setSaving(true);
    setError('');
    const res = await base44.functions.invoke('processMarkdownDisposition', {
      review_queue_id: reviewEntry.id,
      outcome_type: form.outcome_type,
      qty: Number(form.qty),
      disposition_reason_code: form.disposition_reason_code,
      disposition_notes: form.disposition_notes,
      destination_ref: form.destination_ref,
    });
    setSaving(false);
    if (res.data?.success) {
      onConfirmed();
    } else {
      setError(res.data?.error || 'Failed to confirm disposition.');
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4">
      <div className="w-full max-w-lg bg-card border border-border rounded-xl shadow-xl">
        <div className="flex items-center justify-between px-5 py-4 border-b border-border">
          <div>
            <h2 className="text-base font-semibold text-foreground">Confirm Disposition</h2>
            <p className="text-xs text-muted-foreground mt-0.5">
              {batch?.item_name} — {batch?.batch_ref || reviewEntry.batch_id?.slice(-8)}
            </p>
          </div>
          <button onClick={onClose} className="w-7 h-7 flex items-center justify-center rounded hover:bg-muted text-muted-foreground">
            <X size={15} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          <div className="grid grid-cols-3 gap-3 p-3 rounded-lg bg-muted text-xs">
            <div><p className="text-muted-foreground">Expected Qty</p><p className="font-bold text-foreground">{reviewEntry.expected_remaining_qty}</p></div>
            <div><p className="text-muted-foreground">Floor Count</p><p className="font-bold text-foreground">{reviewEntry.actual_floor_count ?? '—'}</p></div>
            <div><p className="text-muted-foreground">Variance</p><p className={`font-bold ${(reviewEntry.variance_percent || 0) > 10 ? 'text-red-700' : 'text-foreground'}`}>{reviewEntry.variance_percent?.toFixed(1) ?? '0'}%</p></div>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Outcome Type *</label>
            <select
              value={form.outcome_type}
              onChange={e => setForm(f => ({ ...f, outcome_type: e.target.value }))}
              className="w-full h-9 border border-border rounded px-3 text-sm bg-background focus:outline-none focus:ring-1 focus:ring-ring"
              required
            >
              <option value="">Select outcome…</option>
              {OUTCOME_TYPES.map(o => (
                <option key={o} value={o}>{OUTCOME_LABELS[o]}</option>
              ))}
            </select>
          </div>

          {OUTCOME_WARNING[form.outcome_type] && (
            <div className="p-3 rounded-lg border border-amber-200 bg-amber-50 text-xs text-amber-800">
              <strong>Note:</strong> {OUTCOME_WARNING[form.outcome_type]}
            </div>
          )}

          <div className="space-y-1.5">
            <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Quantity *</label>
            <input
              type="number"
              min="1"
              value={form.qty}
              onChange={e => setForm(f => ({ ...f, qty: e.target.value }))}
              className="w-full h-9 border border-border rounded px-3 text-sm bg-background focus:outline-none focus:ring-1 focus:ring-ring"
              required
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Reason Code</label>
            <input
              type="text"
              value={form.disposition_reason_code}
              onChange={e => setForm(f => ({ ...f, disposition_reason_code: e.target.value }))}
              placeholder="e.g. EXPIRED, DAMAGED, EXCESS"
              className="w-full h-9 border border-border rounded px-3 text-sm bg-background focus:outline-none focus:ring-1 focus:ring-ring"
            />
          </div>

          {['Transfer', 'Donate', 'Return_To_Supplier'].includes(form.outcome_type) && (
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Destination / Reference</label>
              <input
                type="text"
                value={form.destination_ref}
                onChange={e => setForm(f => ({ ...f, destination_ref: e.target.value }))}
                placeholder="Charity name, site, supplier ref…"
                className="w-full h-9 border border-border rounded px-3 text-sm bg-background focus:outline-none focus:ring-1 focus:ring-ring"
              />
            </div>
          )}

          <div className="space-y-1.5">
            <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Notes</label>
            <textarea
              value={form.disposition_notes}
              onChange={e => setForm(f => ({ ...f, disposition_notes: e.target.value }))}
              rows={2}
              placeholder="Optional investigation notes…"
              className="w-full border border-border rounded px-3 py-2 text-sm bg-background focus:outline-none focus:ring-1 focus:ring-ring resize-none"
            />
          </div>

          <div className="p-3 rounded-lg border border-red-200 bg-red-50 text-xs text-red-800">
            <strong>Guardrail:</strong> No StockMovement will be posted until you click Confirm. This action requires your authorization as {' '}
            Supervisor or Manager.
          </div>

          {error && (
            <div className="flex items-start gap-2 p-3 rounded border border-red-200 bg-red-50 text-xs text-red-700">
              <AlertCircle size={13} className="mt-0.5 flex-shrink-0" /> {error}
            </div>
          )}

          <div className="flex justify-end gap-2 pt-1">
            <button type="button" onClick={onClose} className="h-9 px-4 text-sm border border-border rounded hover:bg-muted">Cancel</button>
            <button type="submit" disabled={saving} className="flex items-center gap-1.5 h-9 px-4 text-sm bg-primary text-primary-foreground rounded hover:opacity-90 disabled:opacity-50">
              <CheckCircle size={13} /> {saving ? 'Confirming…' : 'Confirm Disposition'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}