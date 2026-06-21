import { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { CheckCircle2, XCircle, Clock, ArrowRight } from 'lucide-react';

export default function TransferPendingPanel({ drafts, canApprove, onUpdated }) {
  const [actionId, setActionId] = useState(null);
  const [rejectingId, setRejectingId] = useState(null);
  const [rejectReason, setRejectReason] = useState('');
  const [error, setError] = useState('');

  if (drafts.length === 0) return null;

  const handleApprove = async (id) => {
    setActionId(id); setError('');
    const res = await base44.functions.invoke('approveTransferDraft', { draft_id: id });
    setActionId(null);
    if (res.data?.error) { setError(res.data.error); return; }
    onUpdated();
  };

  const handleReject = async (id) => {
    if (!rejectReason.trim()) return;
    setActionId(id); setError('');
    const res = await base44.functions.invoke('rejectTransferDraft', { draft_id: id, rejection_reason: rejectReason });
    setActionId(null); setRejectingId(null); setRejectReason('');
    if (res.data?.error) { setError(res.data.error); return; }
    onUpdated();
  };

  return (
    <div className="rounded-2xl border border-amber-200 bg-amber-50/40 overflow-hidden">
      <div className="px-5 py-3.5 border-b border-amber-200 bg-amber-50 flex items-center gap-2">
        <Clock size={14} className="text-amber-600" />
        <h2 className="text-sm font-semibold text-amber-900">Pending Approval ({drafts.length})</h2>
      </div>

      {error && <div className="mx-5 mt-3 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">{error}</div>}

      <div className="divide-y divide-amber-100">
        {drafts.map(draft => (
          <div key={draft.id} className="px-5 py-4">
            <div className="flex items-start justify-between gap-4">
              <div className="space-y-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="font-mono text-sm font-semibold text-foreground">{draft.transfer_ref}</span>
                  <span className="text-xs px-2 py-0.5 rounded-full border border-amber-200 bg-amber-100 text-amber-700 font-semibold">PENDING</span>
                </div>
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <span className="font-medium text-foreground">{draft.from_site_name}</span>
                  <ArrowRight size={12} />
                  <span className="font-medium text-foreground">{draft.to_site_name}</span>
                  <span>·</span>
                  <span className="italic">{draft.reason}</span>
                </div>
                <div className="space-y-0.5">
                  {(draft.lines || []).map((line, i) => (
                    <p key={i} className="text-xs text-muted-foreground">
                      <span className="font-mono">{line.sku}</span> {line.item_name} — <span className="font-medium text-foreground">{line.qty} units</span>
                      <span className="ml-1 text-muted-foreground/60">(on hand at draft: {line.stock_at_draft})</span>
                    </p>
                  ))}
                </div>
                <p className="text-[11px] text-muted-foreground">By {draft.drafted_by_name || draft.drafted_by} · {draft.submitted_at ? new Date(draft.submitted_at).toLocaleString() : '—'}</p>
              </div>
            </div>

            {canApprove && (
              <div className="mt-3 space-y-2">
                {rejectingId === draft.id ? (
                  <div className="flex items-center gap-2">
                    <input value={rejectReason} onChange={e => setRejectReason(e.target.value)}
                      placeholder="Rejection reason (required)…"
                      className="flex-1 h-8 border border-border rounded-lg px-3 text-xs bg-background focus:outline-none focus:ring-1 focus:ring-ring" />
                    <button onClick={() => handleReject(draft.id)} disabled={!rejectReason.trim() || actionId === draft.id}
                      className="h-8 px-3 text-xs bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50">Confirm</button>
                    <button onClick={() => { setRejectingId(null); setRejectReason(''); }} className="h-8 px-3 text-xs border border-border rounded-lg hover:bg-muted">Cancel</button>
                  </div>
                ) : (
                  <div className="flex gap-2">
                    <button onClick={() => handleApprove(draft.id)} disabled={actionId === draft.id}
                      className="flex items-center gap-1.5 h-8 px-3 text-xs bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 disabled:opacity-50">
                      <CheckCircle2 size={12} /> {actionId === draft.id ? 'Approving…' : 'Approve & Dispatch'}
                    </button>
                    <button onClick={() => setRejectingId(draft.id)}
                      className="flex items-center gap-1.5 h-8 px-3 text-xs border border-red-200 text-red-700 bg-red-50 rounded-lg hover:bg-red-100">
                      <XCircle size={12} /> Reject
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}