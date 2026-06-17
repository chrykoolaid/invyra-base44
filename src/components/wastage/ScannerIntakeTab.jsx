import { useEffect, useState, useMemo } from 'react';
import { base44 } from '@/api/base44Client';
import { Search, CheckCircle2, AlertTriangle } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';

export default function ScannerIntakeTab({ refreshTick }) {
  const [entries, setEntries] = useState([]);
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [selectedItem, setSelectedItem] = useState(null);
  const [showModal, setShowModal] = useState(false);

  useEffect(() => {
    setLoading(true);
    base44.entities.ScannerIntakeQueue.filter({
      sync_status: 'QUEUED',
      environment: 'LIVE',
    }, '-created_date', 50).then(data => {
      setEntries(data || []);
      setLoading(false);
    });
  }, [refreshTick]);

  const filteredEntries = useMemo(() => {
    const q = query.toLowerCase();
    return entries.filter(e =>
      e.raw_barcode.toLowerCase().includes(q) ||
      (e.resolved_sku && e.resolved_sku.toLowerCase().includes(q)) ||
      (e.unresolved_reason && e.unresolved_reason.toLowerCase().includes(q))
    );
  }, [entries, query]);

  const handleAccept = async (entry) => {
    try {
      const response = await base44.functions.invoke('processScannerIntake', {
        intake_id: entry.id,
        accept: true,
        resolved_sku: entry.resolved_sku,
        resolved_item_id: entry.resolved_item_id,
        proposed_reason_category: entry.proposed_stock_out_class || 'WASTAGE',
      });
      if (response.data.success) {
        toast.success(`Draft created: ${response.data.generated_record_id}`);
        window.location.reload();
      }
    } catch (error) {
      toast.error(`Accept failed: ${error.message}`);
    }
  };

  const handleReject = async (itemId) => {
    try {
      const response = await base44.functions.invoke('processScannerIntake', {
        intake_id: itemId,
        accept: false,
        rejection_reason: 'Operator rejected',
      });
      if (response.data.success) {
        toast.success('Scan rejected');
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
          <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-[0.22em] mb-1.5">Pending Scans</p>
          <p className="text-2xl font-bold text-foreground">{entries.length}</p>
          <p className="text-xs text-muted-foreground mt-2">Queued for resolution</p>
        </div>
        <div className="border border-border rounded-2xl bg-card px-4 py-3 min-h-[104px]">
          <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-[0.22em] mb-1.5">Resolved Today</p>
          <p className="text-2xl font-bold text-green-700">0</p>
          <p className="text-xs text-muted-foreground mt-2">Converted to records</p>
        </div>
        <div className="border border-border rounded-2xl bg-card px-4 py-3 min-h-[104px]">
          <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-[0.22em] mb-1.5">Conflicts</p>
          <p className="text-2xl font-bold text-amber-700">0</p>
          <p className="text-xs text-muted-foreground mt-2">Needs review</p>
        </div>
        <div className="border border-border rounded-2xl bg-card px-4 py-3 min-h-[104px]">
          <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-[0.22em] mb-1.5">Rejected</p>
          <p className="text-2xl font-bold text-red-700">0</p>
          <p className="text-xs text-muted-foreground mt-2">Discarded</p>
        </div>
      </div>

      <div className="border border-border rounded-2xl bg-card">
        <div className="px-4 py-3 border-b border-border bg-muted/20">
          <div className="flex items-center gap-3">
            <div className="flex-1">
              <p className="text-sm font-medium text-foreground">Pending Barcode Scans</p>
              <p className="text-xs text-muted-foreground mt-1">Awaiting manual resolution or validation</p>
            </div>
            <span className="text-xs text-muted-foreground">{filteredEntries.length} visible</span>
          </div>
        </div>

        <div className="p-4">
          <div className="relative w-full mb-4">
            <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search by barcode or SKU..."
              className="pl-9"
            />
          </div>

          {loading ? (
            <div className="text-center py-12">
              <div className="w-6 h-6 border-3 border-muted border-t-foreground rounded-full animate-spin mx-auto"></div>
            </div>
          ) : filteredEntries.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-sm font-medium text-foreground mb-1">No pending scans</p>
              <p className="text-xs text-muted-foreground">All scans have been resolved or rejected</p>
            </div>
          ) : (
            <div className="space-y-3">
              {filteredEntries.map(entry => (
                <div key={entry.id} className="p-4 rounded-xl border border-border bg-background/40 hover:bg-muted/25 transition-colors">
                  <div className="flex items-start justify-between gap-3 mb-2">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className="font-mono text-sm text-foreground font-medium">{entry.raw_barcode}</p>
                        {entry.sync_status === 'CONFLICT' && (
                          <span className="text-[11px] px-2 py-0.5 rounded-full bg-amber-50 text-amber-700 border border-amber-200 font-medium flex items-center gap-1">
                            <AlertTriangle size={11} /> Conflict
                          </span>
                        )}
                      </div>
                      {entry.resolved_sku && <p className="text-xs text-muted-foreground mt-1">Resolved: {entry.resolved_sku}</p>}
                      {entry.unresolved_reason && <p className="text-xs text-red-600 mt-1">⚠ {entry.unresolved_reason}</p>}
                    </div>
                  </div>
                  <div className="flex items-center justify-between gap-2 mt-3 pt-3 border-t border-border">
                    <span className="text-xs text-muted-foreground">{new Date(entry.scanned_at).toLocaleString()}</span>
                    <div className="flex gap-2">
                      {entry.resolved_sku && (
                        <button
                          onClick={() => handleAccept(entry)}
                          className="px-2 py-1 text-[11px] rounded bg-green-600 text-white hover:opacity-90 flex items-center gap-1"
                        >
                          <CheckCircle2 size={12} /> Accept & Create Draft
                        </button>
                      )}
                      <button
                        onClick={() => handleReject(entry.id)}
                        className="px-2 py-1 text-[11px] rounded bg-red-600 text-white hover:opacity-90"
                      >
                        Reject
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