import { useMemo, useState } from 'react';
import { base44 } from '@/api/base44Client';
import { X, AlertCircle, CheckCircle } from 'lucide-react';

export default function ApproveBatchModal({ batch, onClose, onDone }) {
  const requestMetadata = useMemo(() => batch?.settings_snapshot?.request_metadata || {}, [batch]);
  const [form, setForm] = useState({
    approval_notes: '',
    initial_markdown_price: requestMetadata.initial_markdown_price || requestMetadata.proposed_markdown_price || '',
    initial_original_price: requestMetadata.initial_original_price || '',
    initial_expiry_date: requestMetadata.initial_expiry_date || requestMetadata.requested_expiry_date || '',
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.initial_markdown_price || !form.initial_expiry_date) {
      setError('Markdown price and expiry date are required to create Round 1.');
      return;
    }
    setSaving(true);
    setError('');
    const res = await base44.functions.invoke('approveMarkdownBatch', {
      batch_id: batch.id,
      approval_notes: form.approval_notes,
      initial_markdown_price: Number(form.initial_markdown_price),
      initial_original_price: form.initial_original_price ? Number(form.initial_original_price) : undefined,
      initial_expiry_date: form.initial_expiry_date,
    });
    setSaving(false);
    if (res.data?.success) {
      onDone();
    } else {
      setError(res.data?.error || 'Approval failed.');
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/30 flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-card border border-border rounded-xl shadow-xl">
        <div className="flex items-center justify-between px-5 py-4 border-b border-border">
          <div>
            <h2 className="text-base font-semibold text-foreground">Approve Batch & Create Round 1</h2>
            <p className="text-xs text-muted-foreground mt-0.5">{batch.batch_ref} — {batch.item_name}</p>
          </div>
          <button onClick={onClose} className="w-7 h-7 flex items-center justify-center rounded hover:bg-muted text-muted-foreground">
            <X size={15} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          <div className="p-3 rounded-lg bg-muted text-xs text-muted-foreground grid grid-cols-2 gap-2">
            <div><span className="block font-semibold text-foreground">SKU</span>{batch.sku}</div>
            <div><span className="block font-semibold text-foreground">Qty Allocated</span>{batch.allocated_qty}</div>
            {requestMetadata.markdown_reason && <div><span className="block font-semibold text-foreground">Reason</span>{String(requestMetadata.markdown_reason).replace(/_/g, ' ')}</div>}
            {requestMetadata.capture_method && <div><span className="block font-semibold text-foreground">Captured By</span>{String(requestMetadata.capture_method).replace(/_/g, ' ')}</div>}
          </div>

          {(requestMetadata.request_notes || requestMetadata.scanner_session_ref) && (
            <div className="p-3 rounded-lg border border-blue-100 bg-blue-50 text-xs text-blue-800">
              <strong>Operator request evidence:</strong> {requestMetadata.request_notes || requestMetadata.scanner_session_ref}
            </div>
          )}

          <div className="space-y-1.5">
            <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Original Price (₱) *</label>
            <input
              type="number" step="0.01" min="0"
              value={form.initial_original_price}
              onChange={e => setForm(f => ({ ...f, initial_original_price: e.target.value }))}
              placeholder="Full price before markdown"
              className="w-full h-9 border border-border rounded px-3 text-sm bg-background focus:outline-none focus:ring-1 focus:ring-ring"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Markdown Price (₱) *</label>
            <input
              type="number" step="0.01" min="0"
              value={form.initial_markdown_price}
              onChange={e => setForm(f => ({ ...f, initial_markdown_price: e.target.value }))}
              placeholder="e.g. 89.00"
              className="w-full h-9 border border-border rounded px-3 text-sm bg-background focus:outline-none focus:ring-1 focus:ring-ring"
              required
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Expiry / Sell-By Date *</label>
            <input
              type="date"
              value={form.initial_expiry_date}
              onChange={e => setForm(f => ({ ...f, initial_expiry_date: e.target.value }))}
              className="w-full h-9 border border-border rounded px-3 text-sm bg-background focus:outline-none focus:ring-1 focus:ring-ring"
              required
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Approval Notes</label>
            <textarea
              value={form.approval_notes}
              onChange={e => setForm(f => ({ ...f, approval_notes: e.target.value }))}
              placeholder="Optional notes"
              rows={2}
              className="w-full border border-border rounded px-3 py-2 text-sm bg-background focus:outline-none focus:ring-1 focus:ring-ring resize-none"
            />
          </div>

          {error && (
            <div className="flex items-start gap-2 p-3 rounded border border-red-200 bg-red-50 text-xs text-red-700">
              <AlertCircle size={13} className="mt-0.5 flex-shrink-0" />{error}
            </div>
          )}

          <div className="flex justify-end gap-2 pt-1">
            <button type="button" onClick={onClose} className="h-9 px-4 text-sm border border-border rounded hover:bg-muted">Cancel</button>
            <button type="submit" disabled={saving} className="flex items-center gap-1.5 h-9 px-4 text-sm bg-green-600 text-white rounded hover:opacity-90 disabled:opacity-50">
              <CheckCircle size={14} /> {saving ? 'Approving…' : 'Approve & Activate'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}