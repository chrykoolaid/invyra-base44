import { useEffect, useState, useMemo } from 'react';
import { base44 } from '@/api/base44Client';
import { Search, CheckCircle2, X } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';

export default function AmendmentsTab({ refreshTick }) {
  const [amendments, setAmendments] = useState([]);
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    setLoading(true);
    base44.entities.StockOutAmendment.filter({
      request_status: 'PENDING',
      environment: 'LIVE',
    }, '-created_date', 50).then(data => {
      setAmendments(data || []);
      setLoading(false);
    });
  }, [refreshTick]);

  const filteredAmendments = useMemo(() => {
    const q = query.toLowerCase();
    return amendments.filter(a =>
      a.record_id.toLowerCase().includes(q) ||
      a.amendment_reason.toLowerCase().includes(q) ||
      (a.amendment_notes && a.amendment_notes.toLowerCase().includes(q))
    );
  }, [amendments, query]);

  const summary = useMemo(() => {
    const pending = amendments.filter(a => a.request_status === 'PENDING').length;
    const approved = amendments.filter(a => a.request_status === 'APPROVED').length;
    const rejected = amendments.filter(a => a.request_status === 'REJECTED').length;
    const totalDelta = amendments
      .filter(a => a.request_status === 'PENDING')
      .reduce((s, a) => s + (a.quantity_delta || 0), 0);
    return { pending, approved, rejected, totalDelta };
  }, [amendments]);

  const handleApprove = async (amendmentId, recordId) => {
    try {
      const response = await base44.functions.invoke('approveStockOutAmendment', {
        amendment_id: amendmentId,
        record_id: recordId,
      });
      if (response.data.success) {
        toast.success('Amendment approved');
        window.location.reload();
      }
    } catch (error) {
      toast.error(`Approval failed: ${error.message}`);
    }
  };

  const handleReject = async (amendmentId) => {
    try {
      const response = await base44.functions.invoke('rejectStockOutAmendment', {
        amendment_id: amendmentId,
        rejection_reason: 'Manager rejected',
      });
      if (response.data.success) {
        toast.success('Amendment rejected');
        window.location.reload();
      }
    } catch (error) {
      toast.error(`Rejection failed: ${error.message}`);
    }
  };

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
        <div className="border border-border rounded-2xl bg-card px-4 py-3 min-h-[104px]">
          <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-[0.22em] mb-1.5">Pending</p>
          <p className="text-2xl font-bold text-amber-700">{summary.pending}</p>
          <p className="text-xs text-muted-foreground mt-2">Awaiting approval</p>
        </div>
        <div className="border border-border rounded-2xl bg-card px-4 py-3 min-h-[104px]">
          <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-[0.22em] mb-1.5">Approved</p>
          <p className="text-2xl font-bold text-green-700">{summary.approved}</p>
          <p className="text-xs text-muted-foreground mt-2">Processed</p>
        </div>
        <div className="border border-border rounded-2xl bg-card px-4 py-3 min-h-[104px]">
          <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-[0.22em] mb-1.5">Rejected</p>
          <p className="text-2xl font-bold text-red-700">{summary.rejected}</p>
          <p className="text-xs text-muted-foreground mt-2">Declined</p>
        </div>
        <div className="border border-border rounded-2xl bg-card px-4 py-3 min-h-[104px]">
          <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-[0.22em] mb-1.5">Total Delta</p>
          <p className="text-2xl font-bold text-foreground">{summary.totalDelta > 0 ? '+' : ''}{summary.totalDelta}</p>
          <p className="text-xs text-muted-foreground mt-2">Net quantity change</p>
        </div>
      </div>

      <div className="border border-border rounded-2xl bg-card">
        <div className="px-4 py-3 border-b border-border bg-muted/20">
          <div className="flex items-center gap-3">
            <div className="flex-1">
              <p className="text-sm font-medium text-foreground">Amendment Requests</p>
              <p className="text-xs text-muted-foreground mt-1">Corrections and quantity adjustments pending approval</p>
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
              placeholder="Search by record ID or reason..."
              className="pl-9"
            />
          </div>

          {loading ? (
            <div className="text-center py-12">
              <div className="w-6 h-6 border-3 border-muted border-t-foreground rounded-full animate-spin mx-auto"></div>
            </div>
          ) : filteredAmendments.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-sm font-medium text-foreground mb-1">No pending amendments</p>
              <p className="text-xs text-muted-foreground">All amendments have been processed</p>
            </div>
          ) : (
            <div className="space-y-3">
              {filteredAmendments.map(amendment => (
                <div key={amendment.id} className="p-4 rounded-xl border border-border bg-background/40 hover:bg-muted/25 transition-colors">
                  <div className="flex items-start justify-between gap-3 mb-2">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className="font-mono text-sm text-foreground font-medium">{amendment.record_id}</p>
                        <span className="text-[11px] px-2 py-0.5 rounded-full bg-amber-50 text-amber-700 border border-amber-200 font-medium">
                          {amendment.request_status}
                        </span>
                      </div>
                      <p className="text-xs text-muted-foreground mt-1.5">{amendment.amendment_reason}</p>
                      {amendment.amendment_notes && (
                        <p className="text-xs text-muted-foreground mt-1">{amendment.amendment_notes}</p>
                      )}
                    </div>
                    <div className="text-right whitespace-nowrap">
                      <p className="font-semibold text-foreground text-sm">{amendment.quantity_delta > 0 ? '+' : ''}{amendment.quantity_delta}</p>
                      <p className="text-xs text-muted-foreground">Quantity delta</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-3 text-xs text-muted-foreground mt-3 pt-3 border-t border-border">
                    <div>
                      <p className="font-medium text-foreground">Before</p>
                      <p>{amendment.before_snapshot?.quantity || 0} units</p>
                    </div>
                    <div>
                      <p className="font-medium text-foreground">After</p>
                      <p>{amendment.after_snapshot?.quantity || 0} units</p>
                    </div>
                    <div className="flex gap-2 justify-end">
                      <button
                        onClick={() => handleApprove(amendment.id, amendment.record_id)}
                        className="px-2 py-1 text-[11px] rounded bg-green-600 text-white hover:opacity-90 flex items-center gap-1"
                      >
                        <CheckCircle2 size={12} /> Approve
                      </button>
                      <button
                        onClick={() => handleReject(amendment.id)}
                        className="px-2 py-1 text-[11px] rounded bg-red-600 text-white hover:opacity-90 flex items-center gap-1"
                      >
                        <X size={12} /> Reject
                      </button>
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