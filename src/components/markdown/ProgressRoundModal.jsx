import { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { X, SkipForward, AlertCircle } from 'lucide-react';

export default function ProgressRoundModal({ batch, currentRound, onClose, onDone }) {
  const [form, setForm] = useState({
    new_markdown_unit_price: '',
    new_expiry_date: '',
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const maxRounds = batch.settings_snapshot?.max_rounds || 3;
  const nextRound = (batch.current_round_number || 1) + 1;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.new_markdown_unit_price || !form.new_expiry_date) {
      setError('New markdown price and expiry date are required.');
      return;
    }
    setSaving(true);
    setError('');
    const res = await base44.functions.invoke('progressMarkdownRound', {
      batch_id: batch.id,
      current_round_id: currentRound.id,
      new_markdown_unit_price: Number(form.new_markdown_unit_price),
      new_expiry_date: form.new_expiry_date,
    });
    setSaving(false);
    if (res.data?.success) {
      onDone();
    } else {
      setError(res.data?.error || 'Round progression failed.');
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/30 flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-card border border-border rounded-xl shadow-xl">
        <div className="flex items-center justify-between px-5 py-4 border-b border-border">
          <div>
            <h2 className="text-base font-semibold text-foreground">Progress to Round {nextRound}</h2>
            <p className="text-xs text-muted-foreground mt-0.5">{batch.batch_ref} — Max {maxRounds} rounds</p>
          </div>
          <button onClick={onClose} className="w-7 h-7 flex items-center justify-center rounded hover:bg-muted text-muted-foreground"><X size={15} /></button>
        </div>
        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          <div className="p-3 rounded-lg bg-muted text-xs grid grid-cols-2 gap-2">
            <div><span className="block font-semibold text-foreground">Current Round</span>R{currentRound.round_number}</div>
            <div><span className="block font-semibold text-foreground">Current Price</span>₱{currentRound.markdown_unit_price?.toFixed(2)}</div>
            <div><span className="block font-semibold text-foreground">Current Barcode</span><span className="font-mono">{currentRound.markdown_barcode}</span></div>
            <div><span className="block font-semibold text-foreground">Remaining Qty</span>{batch.current_remaining_qty}</div>
          </div>

          <div className="p-2 rounded border border-amber-200 bg-amber-50 text-xs text-amber-700">
            Current round barcode will be voided. A new barcode will be generated for Round {nextRound}.
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">New Markdown Price (₱) *</label>
            <input
              type="number" step="0.01" min="0"
              value={form.new_markdown_unit_price}
              onChange={e => setForm(f => ({ ...f, new_markdown_unit_price: e.target.value }))}
              placeholder="e.g. 59.00"
              className="w-full h-9 border border-border rounded px-3 text-sm bg-background focus:outline-none focus:ring-1 focus:ring-ring"
              required
            />
          </div>
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">New Expiry Date *</label>
            <input
              type="date"
              value={form.new_expiry_date}
              onChange={e => setForm(f => ({ ...f, new_expiry_date: e.target.value }))}
              className="w-full h-9 border border-border rounded px-3 text-sm bg-background focus:outline-none focus:ring-1 focus:ring-ring"
              required
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
              <SkipForward size={14} /> {saving ? 'Progressing…' : `Progress to Round ${nextRound}`}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}