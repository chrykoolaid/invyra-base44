import { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { X, Printer, AlertCircle } from 'lucide-react';

export default function PrintLabelModal({ batch, round, onClose, onDone }) {
  const [form, setForm] = useState({ printer_id: '', device_id: '' });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [result, setResult] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError('');
    const res = await base44.functions.invoke('printMarkdownLabel', {
      batch_id: batch.id,
      round_id: round.id,
      printer_id: form.printer_id,
      device_id: form.device_id,
    });
    setSaving(false);
    if (res.data?.success) {
      setResult(res.data);
    } else {
      setError(res.data?.error || 'Print failed.');
    }
  };

  if (result) {
    return (
      <div className="fixed inset-0 z-50 bg-black/30 flex items-center justify-center p-4">
        <div className="w-full max-w-sm bg-card border border-border rounded-xl shadow-xl p-6 text-center">
          <Printer size={32} className="mx-auto mb-3 text-primary" />
          <h2 className="text-base font-semibold text-foreground mb-1">Label Printed</h2>
          <p className="text-xs text-muted-foreground mb-3">Round {result.round_number} — ₱{result.markdown_unit_price?.toFixed(2)}</p>
          <div className="p-3 rounded bg-muted text-xs font-mono text-foreground mb-4">{result.barcode}</div>
          <p className="text-xs text-muted-foreground mb-4">Expiry: {result.expiry_date}</p>
          <button onClick={onDone} className="h-9 px-6 bg-primary text-primary-foreground rounded hover:opacity-90 text-sm">Done</button>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-50 bg-black/30 flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-card border border-border rounded-xl shadow-xl">
        <div className="flex items-center justify-between px-5 py-4 border-b border-border">
          <div>
            <h2 className="text-base font-semibold text-foreground">Print Initial Label</h2>
            <p className="text-xs text-muted-foreground mt-0.5">Round {round.round_number} — {batch.batch_ref}</p>
          </div>
          <button onClick={onClose} className="w-7 h-7 flex items-center justify-center rounded hover:bg-muted text-muted-foreground"><X size={15} /></button>
        </div>
        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          <div className="p-3 rounded-lg bg-green-50 border border-green-200 text-xs text-green-800 grid grid-cols-2 gap-2">
            <div><span className="block font-semibold">Markdown Price</span>₱{round.markdown_unit_price?.toFixed(2)}</div>
            <div><span className="block font-semibold">Discount</span>{round.discount_percent?.toFixed(0)}%</div>
            <div><span className="block font-semibold">Expiry</span>{round.expiry_date}</div>
            <div><span className="block font-semibold">Barcode</span><span className="font-mono">{round.markdown_barcode}</span></div>
          </div>
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Printer ID</label>
            <input
              value={form.printer_id}
              onChange={e => setForm(f => ({ ...f, printer_id: e.target.value }))}
              placeholder="Optional printer identifier"
              className="w-full h-9 border border-border rounded px-3 text-sm bg-background focus:outline-none focus:ring-1 focus:ring-ring"
            />
          </div>
          {error && (
            <div className="flex items-start gap-2 p-3 rounded border border-red-200 bg-red-50 text-xs text-red-700">
              <AlertCircle size={13} className="mt-0.5 flex-shrink-0" />{error}
            </div>
          )}
          <div className="flex justify-end gap-2">
            <button type="button" onClick={onClose} className="h-9 px-4 text-sm border border-border rounded hover:bg-muted">Cancel</button>
            <button type="submit" disabled={saving} className="flex items-center gap-1.5 h-9 px-4 text-sm bg-primary text-primary-foreground rounded hover:opacity-90 disabled:opacity-50">
              <Printer size={14} /> {saving ? 'Printing…' : 'Print Label'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}