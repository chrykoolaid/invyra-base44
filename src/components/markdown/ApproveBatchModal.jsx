import { useMemo, useState } from 'react';
import { base44 } from '@/api/base44Client';
import { X, AlertCircle, CheckCircle } from 'lucide-react';

const DISCOUNT_OPTIONS = [
  { key: '25', label: '25% off', value: 25 },
  { key: '50', label: '50% off', value: 50 },
  { key: '75', label: '75% off', value: 75 },
  { key: 'custom', label: 'Custom override', value: null },
];

function formatMoney(value) {
  if (value === null || value === undefined || value === '' || Number.isNaN(Number(value))) return '—';
  return `₱${Number(value).toFixed(2)}`;
}

function PillButton({ active, children, onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`h-8 px-3 rounded-full border text-xs font-semibold transition-colors ${
        active
          ? 'bg-primary text-primary-foreground border-primary'
          : 'bg-background text-muted-foreground border-border hover:bg-muted hover:text-foreground'
      }`}
    >
      {children}
    </button>
  );
}

export default function ApproveBatchModal({ batch, onClose, onDone }) {
  const requestMetadata = useMemo(() => batch?.settings_snapshot?.request_metadata || {}, [batch]);
  const initialDiscount = requestMetadata.markdown_discount_percent
    ? String(Math.round(Number(requestMetadata.markdown_discount_percent)))
    : '50';
  const [form, setForm] = useState({
    approval_notes: '',
    initial_original_price: requestMetadata.initial_original_price || '',
    discount_percent: ['25', '50', '75'].includes(initialDiscount) ? initialDiscount : 'custom',
    custom_markdown_price: requestMetadata.initial_markdown_price || requestMetadata.proposed_markdown_price || '',
    initial_expiry_date: requestMetadata.initial_expiry_date || requestMetadata.requested_expiry_date || '',
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const originalPrice = Number(form.initial_original_price || 0);
  const isCustom = form.discount_percent === 'custom';
  const selectedDiscount = isCustom ? null : Number(form.discount_percent || 0);
  const calculatedMarkdownPrice = originalPrice > 0 && selectedDiscount > 0
    ? Math.round((originalPrice * (1 - selectedDiscount / 100)) * 100) / 100
    : 0;
  const markdownPrice = isCustom ? Number(form.custom_markdown_price || 0) : calculatedMarkdownPrice;
  const effectiveDiscount = originalPrice > 0 && markdownPrice > 0
    ? Math.round((1 - markdownPrice / originalPrice) * 10000) / 100
    : null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.initial_original_price || Number(form.initial_original_price) <= 0) {
      setError('Original shelf price is required to activate the scoped markdown overlay.');
      return;
    }
    if (!markdownPrice || markdownPrice <= 0 || markdownPrice > originalPrice) {
      setError('Calculated overlay price must be greater than 0 and lower than the original shelf price.');
      return;
    }
    if (!form.initial_expiry_date) {
      setError('Expiry / sell-by date is required so the overlay can auto-close.');
      return;
    }

    setSaving(true);
    setError('');
    const res = await base44.functions.invoke('approveMarkdownBatch', {
      batch_id: batch.id,
      approval_notes: form.approval_notes,
      initial_markdown_price: markdownPrice,
      initial_original_price: Number(form.initial_original_price),
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
      <div className="w-full max-w-lg bg-card border border-border rounded-xl shadow-xl">
        <div className="flex items-center justify-between px-5 py-4 border-b border-border">
          <div>
            <h2 className="text-base font-semibold text-foreground">Approve Temporary Price Overlay</h2>
            <p className="text-xs text-muted-foreground mt-0.5">{batch.batch_ref} — {batch.item_name}</p>
          </div>
          <button onClick={onClose} className="w-7 h-7 flex items-center justify-center rounded hover:bg-muted text-muted-foreground">
            <X size={15} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          <div className="p-3 rounded-lg bg-muted text-xs text-muted-foreground grid grid-cols-2 gap-2">
            <div><span className="block font-semibold text-foreground">SKU</span>{batch.sku}</div>
            <div><span className="block font-semibold text-foreground">Affected Qty</span>{batch.allocated_qty}</div>
            {requestMetadata.high_qty_threshold && <div><span className="block font-semibold text-foreground">Threshold</span>{requestMetadata.high_qty_threshold}</div>}
            {requestMetadata.initial_expiry_date && <div><span className="block font-semibold text-foreground">Captured Expiry</span>{requestMetadata.initial_expiry_date}</div>}
            {requestMetadata.markdown_reason && <div><span className="block font-semibold text-foreground">Reason</span>{String(requestMetadata.markdown_reason).replace(/_/g, ' ')}</div>}
            {requestMetadata.capture_method && <div><span className="block font-semibold text-foreground">Captured By</span>{String(requestMetadata.capture_method).replace(/_/g, ' ')}</div>}
          </div>

          <div className="p-3 rounded-lg border border-amber-200 bg-amber-50 text-xs text-amber-800">
            <strong>Real-world guardrail:</strong> This approval activates a SKU + expiry/date + quantity-scoped markdown overlay only. It does not change the Item Master price. POS automatically falls back to the normal price when the affected quantity is sold out or the expiry window closes.
          </div>

          {(requestMetadata.request_notes || requestMetadata.scanner_session_ref) && (
            <div className="p-3 rounded-lg border border-blue-100 bg-blue-50 text-xs text-blue-800">
              <strong>ScanOps evidence:</strong> {requestMetadata.request_notes || requestMetadata.scanner_session_ref}
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Original shelf price (₱) *</label>
              <input
                type="number" step="0.01" min="0.01"
                value={form.initial_original_price}
                onChange={e => setForm(f => ({ ...f, initial_original_price: e.target.value }))}
                placeholder="Full price before markdown"
                className="w-full h-9 border border-border rounded px-3 text-sm bg-background focus:outline-none focus:ring-1 focus:ring-ring"
                required
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Expiry / sell-by date *</label>
              <input
                type="date"
                value={form.initial_expiry_date}
                onChange={e => setForm(f => ({ ...f, initial_expiry_date: e.target.value }))}
                className="w-full h-9 border border-border rounded px-3 text-sm bg-background focus:outline-none focus:ring-1 focus:ring-ring"
                required
              />
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Approved markdown discount *</label>
            <div className="flex flex-wrap gap-2">
              {DISCOUNT_OPTIONS.map((option) => (
                <PillButton
                  key={option.key}
                  active={form.discount_percent === option.key}
                  onClick={() => setForm(f => ({ ...f, discount_percent: option.key }))}
                >
                  {option.label}
                </PillButton>
              ))}
            </div>
            {isCustom ? (
              <input
                type="number" step="0.01" min="0.01"
                value={form.custom_markdown_price}
                onChange={e => setForm(f => ({ ...f, custom_markdown_price: e.target.value }))}
                placeholder="Manager override overlay price"
                className="w-full h-9 border border-amber-300 rounded px-3 text-sm bg-background focus:outline-none focus:ring-1 focus:ring-amber-400"
                required
              />
            ) : (
              <div className="h-10 rounded-lg border border-border bg-muted/30 px-3 flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Calculated overlay price</span>
                <span className="font-semibold text-foreground">{markdownPrice > 0 ? formatMoney(markdownPrice) : '—'}</span>
              </div>
            )}
            {effectiveDiscount !== null && <p className="text-xs text-muted-foreground">Overlay: {effectiveDiscount.toFixed(1)}% off · {formatMoney(markdownPrice)}</p>}
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
              <CheckCircle size={14} /> {saving ? 'Approving…' : 'Approve Overlay'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
