import { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { Truck, CheckCircle2, AlertTriangle, ArrowRight } from 'lucide-react';

export default function TransferInTransitPanel({ drafts, onUpdated }) {
  const [receivingId, setReceivingId] = useState(null);
  const [receivedQtys, setReceivedQtys] = useState({});
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  if (drafts.length === 0) return null;

  const startReceiving = (draft) => {
    const initial = {};
    draft.lines.forEach(l => { initial[l.item_id] = String(l.qty); });
    setReceivedQtys(initial);
    setReceivingId(draft.id);
  };

  const handleConfirm = async (draft) => {
    setSaving(true); setError('');
    const receivedLines = draft.lines.map(l => ({
      item_id: l.item_id,
      qty_received: Number(receivedQtys[l.item_id] || 0),
    }));
    const res = await base44.functions.invoke('confirmTransferReceived', { draft_id: draft.id, received_lines: receivedLines });
    setSaving(false);
    if (res.data?.error) { setError(res.data.error); return; }
    setReceivingId(null);
    onUpdated(res.data?.has_discrepancy);
  };

  return (
    <div className="rounded-2xl border border-blue-200 bg-blue-50/30 overflow-hidden">
      <div className="px-5 py-3.5 border-b border-blue-200 bg-blue-50 flex items-center gap-2">
        <Truck size={14} className="text-blue-600" />
        <h2 className="text-sm font-semibold text-blue-900">In Transit ({drafts.length})</h2>
        <span className="text-xs text-blue-700">— awaiting receiving confirmation at destination</span>
      </div>

      {error && <div className="mx-5 mt-3 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">{error}</div>}

      <div className="divide-y divide-blue-100">
        {drafts.map(draft => (
          <div key={draft.id} className="px-5 py-4">
            <div className="flex items-start justify-between gap-4">
              <div className="space-y-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="font-mono text-sm font-semibold text-foreground">{draft.transfer_ref}</span>
                  <span className="text-xs px-2 py-0.5 rounded-full border border-blue-200 bg-blue-100 text-blue-700 font-semibold">IN TRANSIT</span>
                </div>
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <span className="font-medium text-foreground">{draft.from_site_name}</span>
                  <ArrowRight size={12} />
                  <span className="font-medium text-foreground">{draft.to_site_name}</span>
                  <span>·</span><span className="italic">{draft.reason}</span>
                </div>
                {draft.dispatched_at && (
                  <p className="text-[11px] text-muted-foreground">Dispatched {new Date(draft.dispatched_at).toLocaleString()} by {draft.approved_by}</p>
                )}
              </div>
              {receivingId !== draft.id && (
                <button onClick={() => startReceiving(draft)}
                  className="flex items-center gap-1.5 h-8 px-3 text-xs bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex-shrink-0">
                  <CheckCircle2 size={12} /> Confirm Receipt
                </button>
              )}
            </div>

            {receivingId === draft.id ? (
              <div className="mt-3 space-y-2 rounded-xl border border-blue-200 bg-white p-4">
                <p className="text-xs font-semibold text-foreground mb-2">Enter actual quantities received:</p>
                {draft.lines.map(line => (
                  <div key={line.item_id} className="flex items-center gap-3">
                    <div className="flex-1 text-xs">
                      <span className="font-medium text-foreground">{line.item_name}</span>
                      <span className="text-muted-foreground ml-1">({line.sku})</span>
                      <span className="ml-2 text-muted-foreground">Expected: <span className="font-semibold text-foreground">{line.qty}</span></span>
                    </div>
                    <div className="flex items-center gap-2">
                      <label className="text-xs text-muted-foreground">Received:</label>
                      <input type="number" min={0} max={line.qty}
                        value={receivedQtys[line.item_id] ?? line.qty}
                        onChange={e => setReceivedQtys(prev => ({ ...prev, [line.item_id]: e.target.value }))}
                        className={`w-20 h-8 border rounded-lg px-2 text-sm text-center bg-background focus:outline-none focus:ring-1 focus:ring-ring ${
                          Number(receivedQtys[line.item_id]) !== line.qty ? 'border-amber-400 bg-amber-50' : 'border-border'
                        }`} />
                    </div>
                    {Number(receivedQtys[line.item_id]) !== line.qty && (
                      <AlertTriangle size={14} className="text-amber-500 flex-shrink-0" />
                    )}
                  </div>
                ))}
                {draft.lines.some(l => Number(receivedQtys[l.item_id]) !== l.qty) && (
                  <div className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-800 mt-2">
                    Quantity discrepancies detected. A HIGH severity alert will be raised automatically.
                  </div>
                )}
                <div className="flex gap-2 pt-2 justify-end">
                  <button onClick={() => setReceivingId(null)} className="h-8 px-3 text-xs border border-border rounded-lg hover:bg-muted">Cancel</button>
                  <button onClick={() => handleConfirm(draft)} disabled={saving}
                    className="h-8 px-4 text-xs bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 disabled:opacity-50 font-medium">
                    {saving ? 'Confirming…' : 'Confirm Receipt'}
                  </button>
                </div>
              </div>
            ) : (
              <div className="mt-2 space-y-0.5">
                {draft.lines.map((l, i) => (
                  <p key={i} className="text-xs text-muted-foreground ml-4">
                    <span className="font-mono">{l.sku}</span> {l.item_name} — <span className="font-medium">{l.qty} units</span>
                  </p>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}