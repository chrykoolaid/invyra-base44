import { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { AlertTriangle, X, RotateCcw } from 'lucide-react';

export default function ReversalModal({ movement, onClose, onReversed }) {
  const [reason, setReason] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!reason.trim()) { setError('A reason is required for audit purposes.'); return; }
    setLoading(true);
    setError('');
    const res = await base44.functions.invoke('reverseStockMovement', {
      movement_id: movement.id,
      reason: reason.trim(),
    });
    setLoading(false);
    if (res.data?.error) {
      setError(res.data.error);
    } else {
      onReversed(res.data);
    }
  };

  const isReversible = movement.status !== 'VOIDED' && movement.movement_type !== 'REVERSAL';

  return (
    <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4">
      <div className="w-full max-w-lg bg-card border border-border rounded-2xl shadow-xl">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-border">
          <div className="flex items-center gap-2.5">
            <RotateCcw size={16} className="text-amber-600" />
            <h2 className="text-base font-semibold text-foreground">Reverse Movement</h2>
          </div>
          <button onClick={onClose} className="h-8 w-8 flex items-center justify-center rounded hover:bg-muted text-muted-foreground">
            <X size={15} />
          </button>
        </div>

        <div className="px-5 py-4 space-y-4">
          {/* Movement summary */}
          <div className="rounded-xl border border-border bg-muted/20 px-4 py-3 space-y-1.5 text-sm">
            <div className="flex justify-between"><span className="text-muted-foreground">Item</span><span className="font-medium">{movement.item_name}</span></div>
            <div className="flex justify-between"><span className="text-muted-foreground">SKU</span><span className="font-mono text-xs">{movement.sku}</span></div>
            <div className="flex justify-between"><span className="text-muted-foreground">Type</span><span>{movement.movement_type}</span></div>
            <div className="flex justify-between"><span className="text-muted-foreground">Direction</span><span className={movement.direction === 'IN' ? 'text-green-700 font-semibold' : 'text-red-600 font-semibold'}>{movement.direction}</span></div>
            <div className="flex justify-between"><span className="text-muted-foreground">Qty</span><span className="font-semibold">{movement.qty}</span></div>
            <div className="flex justify-between"><span className="text-muted-foreground">Balance after</span><span>{movement.balance_after ?? '—'}</span></div>
          </div>

          {!isReversible ? (
            <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
              This movement cannot be reversed — it is already {movement.status === 'VOIDED' ? 'voided' : 'a reversal movement'}.
            </div>
          ) : (
            <>
              <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 flex items-start gap-2.5">
                <AlertTriangle size={15} className="text-amber-600 flex-shrink-0 mt-0.5" />
                <p className="text-xs text-amber-800 leading-relaxed">
                  This will create a counter-movement (REVERSAL) and adjust the running stock balance. The original movement will be marked <strong>VOIDED</strong>. This action is audited and requires Manager or Admin privileges.
                </p>
              </div>

              <form onSubmit={handleSubmit} className="space-y-3">
                <label className="block space-y-1.5">
                  <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Reason for reversal *</span>
                  <textarea
                    value={reason}
                    onChange={e => { setReason(e.target.value); setError(''); }}
                    placeholder="e.g. Incorrect quantity entered on receiving. Correct value was 50, not 100."
                    rows={3}
                    className="w-full border border-border rounded-lg px-3 py-2 text-sm bg-background focus:outline-none focus:ring-1 focus:ring-ring resize-none"
                    disabled={loading}
                  />
                </label>

                {error && (
                  <div className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">{error}</div>
                )}

                <div className="flex justify-end gap-2 pt-1">
                  <button type="button" onClick={onClose} disabled={loading} className="h-9 px-4 text-sm border border-border rounded-lg hover:bg-muted transition-colors">
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={loading || !reason.trim()}
                    className="h-9 px-4 text-sm bg-amber-600 text-white rounded-lg hover:bg-amber-700 disabled:opacity-50 transition-colors flex items-center gap-2"
                  >
                    <RotateCcw size={13} className={loading ? 'animate-spin' : ''} />
                    {loading ? 'Reversing…' : 'Confirm Reversal'}
                  </button>
                </div>
              </form>
            </>
          )}
        </div>
      </div>
    </div>
  );
}