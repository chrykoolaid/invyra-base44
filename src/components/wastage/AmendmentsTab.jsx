import { useEffect, useState, useMemo } from 'react';
import { base44 } from '@/api/base44Client';
import { Search, Check, X } from 'lucide-react';
import { Input } from '@/components/ui/input';

export default function AmendmentsTab({ refreshTick }) {
  const [amendments, setAmendments] = useState([]);
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    setLoading(true);
    base44.entities.StockOutAmendment.filter({
      environment: 'LIVE',
    }, '-created_date', 50).then(data => {
      setAmendments(data || []);
      setLoading(false);
    });
  }, [refreshTick]);

  const statusColors = {
    PENDING: 'bg-amber-50 text-amber-700 border-amber-200',
    APPROVED: 'bg-green-50 text-green-700 border-green-200',
    REJECTED: 'bg-red-50 text-red-700 border-red-200',
  };

  const filteredAmendments = useMemo(() => {
    const q = query.toLowerCase();
    return amendments.filter(a =>
      a.amendment_reason.toLowerCase().includes(q) ||
      (a.before_snapshot?.sku && a.before_snapshot.sku.toLowerCase().includes(q))
    );
  }, [amendments, query]);

  const handleApprove = async (amendmentId) => {
    try {
      await base44.functions.invoke('approveStockOutAmendment', {
        amendment_id: amendmentId,
        approval_notes: 'Approved from amendment queue',
      });
      // Trigger refresh
      window.location.reload();
    } catch (error) {
      console.error('Error approving amendment:', error);
      alert('Failed to approve amendment');
    }
  };

  const pendingCount = amendments.filter(a => a.request_status === 'PENDING').length;

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
        <div className="border border-border rounded-2xl bg-card px-4 py-3 min-h-[104px]">
          <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-[0.22em] mb-1.5">Total Amendments</p>
          <p className="text-2xl font-bold text-foreground">{amendments.length}</p>
          <p className="text-xs text-muted-foreground mt-2">All requests</p>
        </div>
        <div className="border border-border rounded-2xl bg-card px-4 py-3 min-h-[104px]">
          <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-[0.22em] mb-1.5">Pending</p>
          <p className="text-2xl font-bold text-amber-700">{pendingCount}</p>
          <p className="text-xs text-muted-foreground mt-2">Awaiting manager decision</p>
        </div>
        <div className="border border-border rounded-2xl bg-card px-4 py-3 min-h-[104px]">
          <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-[0.22em] mb-1.5">Approved</p>
          <p className="text-2xl font-bold text-green-700">{amendments.filter(a => a.request_status === 'APPROVED').length}</p>
          <p className="text-xs text-muted-foreground mt-2">Changes committed</p>
        </div>
        <div className="border border-border rounded-2xl bg-card px-4 py-3 min-h-[104px]">
          <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-[0.22em] mb-1.5">Total Delta Value</p>
          <p className="text-2xl font-bold text-foreground">₱{amendments.filter(a => a.request_status === 'APPROVED').reduce((s, a) => s + (Math.abs(a.quantity_delta || 0) * 10), 0).toFixed(0)}</p>
          <p className="text-xs text-muted-foreground mt-2">Adjustment posted</p>
        </div>
      </div>

      <div className="border border-border rounded-2xl bg-card">
        <div className="px-4 py-3 border-b border-border bg-muted/20">
          <div className="flex items-center gap-3">
            <div className="flex-1">
              <p className="text-sm font-medium text-foreground">Amendment Queue</p>
              <p className="text-xs text-muted-foreground mt-1">Correction requests on approved records — immutable amendment workflow</p>
            </div>
            <span className="text-xs text-muted-foreground">{filteredAmendments.length} visible</span>
          </div>
        </div>

        <div className="p-4">
          <div className="relative w-full mb-4">
            <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search by reason or SKU..."
              className="pl-9"
            />
          </div>

          {loading ? (
            <div className="text-center py-12">
              <div className="w-6 h-6 border-3 border-muted border-t-foreground rounded-full animate-spin mx-auto"></div>
            </div>
          ) : filteredAmendments.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-sm font-medium text-foreground mb-1">No amendments</p>
              <p className="text-xs text-muted-foreground">Correction requests on approved records will appear here</p>
            </div>
          ) : (
            <div className="space-y-3">
              {filteredAmendments.map(amendment => (
                <div key={amendment.id} className="p-4 rounded-xl border border-border bg-background/40">
                  <div className="flex items-start justify-between gap-3 mb-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap mb-2">
                        <span className={`text-[11px] px-2 py-0.5 rounded-full border font-medium ${statusColors[amendment.request_status] || 'bg-slate-50 text-slate-700 border-slate-200'}`}>
                          {amendment.request_status}
                        </span>
                        {amendment.quantity_delta !== 0 && (
                          <span className="text-[11px] px-2 py-0.5 rounded-full bg-purple-50 text-purple-700 border border-purple-200 font-medium">
                            {amendment.quantity_delta > 0 ? '+' : ''}{amendment.quantity_delta} qty
                          </span>
                        )}
                      </div>
                      <p className="text-sm font-medium text-foreground mb-1">{amendment.amendment_reason}</p>
                      {amendment.before_snapshot?.sku && (
                        <p className="text-xs text-muted-foreground">{amendment.before_snapshot.sku} · {amendment.before_snapshot.item_name}</p>
                      )}
                      <p className="text-xs text-muted-foreground mt-1.5">{amendment.amendment_notes || '—'}</p>
                    </div>
                    {amendment.request_status === 'PENDING' && (
                      <div className="flex gap-2 whitespace-nowrap">
                        <button
                          onClick={() => handleApprove(amendment.id)}
                          className="inline-flex items-center gap-1 px-3 h-8 rounded-lg bg-green-50 text-green-700 border border-green-200 text-xs font-medium hover:bg-green-100 transition-colors"
                        >
                          <Check size={13} /> Approve
                        </button>
                      </div>
                    )}
                  </div>

                  <div className="grid grid-cols-2 gap-2 text-[11px] pt-3 border-t border-border">
                    <div>
                      <p className="text-muted-foreground">Requested by</p>
                      <p className="text-foreground font-medium">{amendment.requested_by?.slice(-20)}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Requested at</p>
                      <p className="text-foreground font-medium">{new Date(amendment.requested_at).toLocaleDateString()}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}