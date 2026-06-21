import { ArrowUpCircle, ArrowDownCircle, MapPin, RefreshCw } from 'lucide-react';

const STATUS_STYLES = {
  POSTED:   'bg-emerald-100 text-emerald-700 border-emerald-200',
  REJECTED: 'bg-red-100 text-red-700 border-red-200',
  DRAFT:    'bg-slate-100 text-slate-600 border-slate-200',
};

export default function AdjustmentHistory({ adjustments, drafts, locations, loading, onRefresh }) {
  // Merge posted movements + resolved drafts for a complete picture
  const rejectedDrafts = drafts.filter(d => d.status === 'REJECTED');

  return (
    <div className="rounded-2xl border border-border bg-card overflow-hidden">
      <div className="px-5 py-3.5 border-b border-border bg-muted/25 flex items-center justify-between">
        <h2 className="text-sm font-semibold text-foreground">Adjustment History</h2>
        <button onClick={onRefresh} disabled={loading} className="flex items-center gap-1.5 h-8 px-3 text-xs rounded border border-border hover:bg-muted disabled:opacity-50">
          <RefreshCw size={12} className={loading ? 'animate-spin' : ''} /> Refresh
        </button>
      </div>

      {loading ? (
        <div className="py-12 text-center text-sm text-muted-foreground">Loading adjustments…</div>
      ) : adjustments.length === 0 && rejectedDrafts.length === 0 ? (
        <div className="py-12 text-center text-sm text-muted-foreground">No adjustments posted yet.</div>
      ) : (
        <div className="divide-y divide-border">
          {/* Posted movements */}
          {adjustments.map(adj => (
            <div key={adj.id} className="px-5 py-4 hover:bg-muted/20 transition-colors">
              <div className="flex items-start justify-between gap-4">
                <div className="flex items-start gap-3 min-w-0">
                  {adj.direction === 'IN'
                    ? <ArrowUpCircle size={18} className="text-green-600 flex-shrink-0 mt-0.5" />
                    : <ArrowDownCircle size={18} className="text-red-500 flex-shrink-0 mt-0.5" />}
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-semibold text-foreground">{adj.item_name}</p>
                      <span className="text-[10px] px-2 py-0.5 rounded-full border font-semibold bg-emerald-100 text-emerald-700 border-emerald-200">POSTED</span>
                    </div>
                    <p className="text-xs font-mono text-muted-foreground">{adj.sku}</p>
                    <p className="text-xs text-muted-foreground mt-1">{adj.notes}</p>
                  </div>
                </div>
                <div className="text-right flex-shrink-0">
                  <p className={`text-lg font-bold ${adj.direction === 'IN' ? 'text-green-600' : 'text-red-600'}`}>
                    {adj.direction === 'IN' ? '+' : '−'}{adj.qty}
                  </p>
                  <p className="text-xs text-muted-foreground">→ {adj.balance_after} on hand</p>
                </div>
              </div>
              <div className="flex items-center gap-3 mt-2 text-xs text-muted-foreground ml-9">
                <span className="font-mono">{adj.source_ref}</span>
                <span>•</span>
                <span>{adj.posted_by}</span>
                <span>•</span>
                <span>{new Date(adj.created_date).toLocaleString()}</span>
                {adj.location_id && (
                  <>
                    <span>•</span>
                    <span className="flex items-center gap-1"><MapPin size={11} />{locations.find(l => l.id === adj.location_id)?.name || 'Location'}</span>
                  </>
                )}
              </div>
            </div>
          ))}

          {/* Rejected drafts */}
          {rejectedDrafts.map(draft => (
            <div key={draft.id} className="px-5 py-4 bg-red-50/30 hover:bg-red-50/50 transition-colors">
              <div className="flex items-start justify-between gap-4">
                <div className="flex items-start gap-3 min-w-0">
                  {draft.direction === 'IN'
                    ? <ArrowUpCircle size={18} className="text-red-300 flex-shrink-0 mt-0.5" />
                    : <ArrowDownCircle size={18} className="text-red-300 flex-shrink-0 mt-0.5" />}
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-semibold text-foreground opacity-60">{draft.item_name}</p>
                      <span className="text-[10px] px-2 py-0.5 rounded-full border font-semibold bg-red-100 text-red-700 border-red-200">REJECTED</span>
                    </div>
                    <p className="text-xs font-mono text-muted-foreground">{draft.sku}</p>
                    <p className="text-xs text-muted-foreground mt-1">{draft.reason}{draft.notes ? ` — ${draft.notes}` : ''}</p>
                    {draft.rejection_reason && (
                      <p className="text-xs text-red-600 mt-1">Rejected: {draft.rejection_reason}</p>
                    )}
                  </div>
                </div>
                <div className="text-right flex-shrink-0 opacity-60">
                  <p className="text-lg font-bold text-muted-foreground">
                    {draft.direction === 'IN' ? '+' : '−'}{draft.qty}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-3 mt-2 text-xs text-muted-foreground ml-9">
                <span>By {draft.drafted_by_name || draft.drafted_by}</span>
                <span>•</span>
                <span>Reviewed by {draft.reviewed_by}</span>
                <span>•</span>
                <span>{draft.reviewed_at ? new Date(draft.reviewed_at).toLocaleString() : '—'}</span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}