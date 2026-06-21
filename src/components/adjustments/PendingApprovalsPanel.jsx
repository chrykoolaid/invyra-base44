import { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { ArrowUpCircle, ArrowDownCircle, CheckCircle2, XCircle, Clock } from 'lucide-react';
import { format } from 'date-fns';

export default function PendingApprovalsPanel({ drafts, locations, canApprove, onUpdated }) {
  const [actionId, setActionId] = useState(null);
  const [rejectReason, setRejectReason] = useState('');
  const [rejectingId, setRejectingId] = useState(null);
  const [error, setError] = useState('');

  const handleApprove = async (draftId) => {
    setActionId(draftId);
    setError('');
    const res = await base44.functions.invoke('approveAdjustmentDraft', { draft_id: draftId });
    setActionId(null);
    if (res.data?.error) { setError(res.data.error); return; }
    onUpdated();
  };

  const handleReject = async (draftId) => {
    if (!rejectReason.trim()) return;
    setActionId(draftId);
    setError('');
    const res = await base44.functions.invoke('rejectAdjustmentDraft', { draft_id: draftId, rejection_reason: rejectReason });
    setActionId(null);
    setRejectingId(null);
    setRejectReason('');
    if (res.data?.error) { setError(res.data.error); return; }
    onUpdated();
  };

  if (drafts.length === 0) return null;

  return (
    <div className="rounded-2xl border border-amber-200 bg-amber-50/40 overflow-hidden">
      <div className="px-5 py-3.5 border-b border-amber-200 bg-amber-50 flex items-center gap-2">
        <Clock size={14} className="text-amber-600" />
        <h2 className="text-sm font-semibold text-amber-900">Pending Approval ({drafts.length})</h2>
      </div>

      {error && (
        <div className="mx-5 mt-3 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">{error}</div>
      )}

      <div className="divide-y divide-amber-100">
        {drafts.map(draft => (
          <div key={draft.id} className="px-5 py-4">
            <div className="flex items-start justify-between gap-4">
              <div className="flex items-start gap-3 min-w-0">
                {draft.direction === 'IN'
                  ? <ArrowUpCircle size={16} className="text-green-600 flex-shrink-0 mt-0.5" />
                  : <ArrowDownCircle size={16} className="text-red-500 flex-shrink-0 mt-0.5" />}
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-foreground">{draft.item_name}</p>
                  <p className="text-xs font-mono text-muted-foreground">{draft.sku}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">{draft.reason}{draft.notes ? ` — ${draft.notes}` : ''}</p>
                  <p className="text-[11px] text-muted-foreground mt-0.5">
                    By <span className="font-medium">{draft.drafted_by_name || draft.drafted_by}</span>
                    {draft.submitted_at && ` · ${format(new Date(draft.submitted_at), 'dd MMM, HH:mm')}`}
                    {' · '}On hand at draft: {draft.stock_at_draft ?? '—'}
                  </p>
                </div>
              </div>
              <div className="flex-shrink-0 text-right">
                <p className={`text-lg font-bold ${draft.direction === 'IN' ? 'text-green-600' : 'text-red-600'}`}>
                  {draft.direction === 'IN' ? '+' : '−'}{draft.qty}
                </p>
              </div>
            </div>

            {canApprove && (
              <div className="ml-7 mt-3 space-y-2">
                {rejectingId === draft.id ? (
                  <div className="flex items-center gap-2">
                    <input
                      value={rejectReason}
                      onChange={e => setRejectReason(e.target.value)}
                      placeholder="Rejection reason (required)…"
                      className="flex-1 h-8 border border-border rounded-lg px-3 text-xs bg-background focus:outline-none focus:ring-1 focus:ring-ring"
                    />
                    <button
                      onClick={() => handleReject(draft.id)}
                      disabled={!rejectReason.trim() || actionId === draft.id}
                      className="h-8 px-3 text-xs bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50"
                    >
                      Confirm
                    </button>
                    <button onClick={() => { setRejectingId(null); setRejectReason(''); }} className="h-8 px-3 text-xs border border-border rounded-lg hover:bg-muted">
                      Cancel
                    </button>
                  </div>
                ) : (
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleApprove(draft.id)}
                      disabled={actionId === draft.id}
                      className="flex items-center gap-1.5 h-8 px-3 text-xs bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 disabled:opacity-50"
                    >
                      <CheckCircle2 size={12} /> {actionId === draft.id ? 'Approving…' : 'Approve & Post'}
                    </button>
                    <button
                      onClick={() => setRejectingId(draft.id)}
                      className="flex items-center gap-1.5 h-8 px-3 text-xs border border-red-200 text-red-700 bg-red-50 rounded-lg hover:bg-red-100"
                    >
                      <XCircle size={12} /> Reject
                    </button>
                  </div>
                )}
              </div>
            )}

            {!canApprove && (
              <div className="ml-7 mt-2">
                <span className="inline-flex items-center gap-1.5 text-[11px] px-2.5 py-1 rounded-full border border-amber-200 bg-amber-100 text-amber-700 font-semibold">
                  <Clock size={10} /> Awaiting approval
                </span>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}