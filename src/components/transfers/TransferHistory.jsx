import { ArrowRight, CheckCircle2, AlertTriangle, XCircle, RefreshCw } from 'lucide-react';

const STATUS_CONFIG = {
  RECEIVED:  { label: 'Received', cls: 'bg-emerald-100 text-emerald-700 border-emerald-200', icon: CheckCircle2 },
  REJECTED:  { label: 'Rejected', cls: 'bg-red-100 text-red-700 border-red-200', icon: XCircle },
  CANCELLED: { label: 'Cancelled', cls: 'bg-slate-100 text-slate-600 border-slate-200', icon: XCircle },
};

export default function TransferHistory({ drafts, loading, onRefresh }) {
  const resolved = drafts.filter(d => ['RECEIVED', 'REJECTED', 'CANCELLED'].includes(d.status))
    .sort((a, b) => new Date(b.submitted_at) - new Date(a.submitted_at));

  return (
    <div className="rounded-2xl border border-border bg-card overflow-hidden">
      <div className="px-5 py-3.5 border-b border-border bg-muted/25 flex items-center justify-between">
        <h2 className="text-sm font-semibold text-foreground">Transfer History</h2>
        <button onClick={onRefresh} disabled={loading} className="flex items-center gap-1.5 h-8 px-3 text-xs rounded border border-border hover:bg-muted disabled:opacity-50">
          <RefreshCw size={12} className={loading ? 'animate-spin' : ''} /> Refresh
        </button>
      </div>

      {loading ? (
        <div className="py-12 text-center text-sm text-muted-foreground">Loading transfers…</div>
      ) : resolved.length === 0 ? (
        <div className="py-12 text-center text-sm text-muted-foreground">No completed transfers yet.</div>
      ) : (
        <div className="divide-y divide-border">
          {resolved.map(draft => {
            const cfg = STATUS_CONFIG[draft.status] || STATUS_CONFIG.RECEIVED;
            const Icon = cfg.icon;
            return (
              <div key={draft.id} className="px-5 py-4 hover:bg-muted/20 transition-colors">
                <div className="flex items-start justify-between gap-4">
                  <div className="space-y-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-mono text-sm font-semibold text-foreground">{draft.transfer_ref}</span>
                      <span className={`inline-flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-full border font-semibold ${cfg.cls}`}>
                        <Icon size={10} /> {cfg.label}
                      </span>
                      {draft.has_discrepancy && (
                        <span className="inline-flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-full border border-amber-200 bg-amber-100 text-amber-700 font-semibold">
                          <AlertTriangle size={10} /> Discrepancy
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <span className="font-medium text-foreground">{draft.from_site_name}</span>
                      <ArrowRight size={12} />
                      <span className="font-medium text-foreground">{draft.to_site_name}</span>
                      <span>·</span><span className="italic">{draft.reason}</span>
                    </div>
                    <div className="space-y-0.5">
                      {(draft.lines || []).map((line, i) => {
                        const recLine = draft.received_lines?.find(r => r.item_id === line.item_id);
                        const hasLineDiscrep = recLine && recLine.discrepancy_qty !== 0;
                        return (
                          <p key={i} className="text-xs text-muted-foreground">
                            <span className="font-mono">{line.sku}</span> {line.item_name} — expected <span className="font-medium">{line.qty}</span>
                            {recLine && (
                              <span className={hasLineDiscrep ? 'text-amber-600 font-medium' : 'text-emerald-600'}>
                                {' '}→ received {recLine.qty_received}
                                {hasLineDiscrep && ` (Δ${recLine.discrepancy_qty > 0 ? '+' : ''}${recLine.discrepancy_qty})`}
                              </span>
                            )}
                          </p>
                        );
                      })}
                    </div>
                    <div className="flex flex-wrap gap-3 text-[11px] text-muted-foreground mt-0.5">
                      <span>By {draft.drafted_by_name || draft.drafted_by}</span>
                      {draft.approved_by && <><span>·</span><span>Approved by {draft.approved_by}</span></>}
                      {draft.received_by && <><span>·</span><span>Received by {draft.received_by}</span></>}
                      {draft.received_at && <><span>·</span><span>{new Date(draft.received_at).toLocaleString()}</span></>}
                      {draft.rejection_reason && <><span>·</span><span className="text-red-600">Rejected: {draft.rejection_reason}</span></>}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}