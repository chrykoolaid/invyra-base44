import { useEffect, useState, useMemo } from 'react';
import { base44 } from '@/api/base44Client';
import { Search, CheckCircle, XCircle } from 'lucide-react';
import { Input } from '@/components/ui/input';

export default function ScannerIntakeTab({ refreshTick }) {
  const [intakes, setIntakes] = useState([]);
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [activeIntake, setActiveIntake] = useState(null);
  const [resolveForm, setResolveForm] = useState({
    stock_out_class: 'WASTAGE',
    reason_category: '',
  });

  useEffect(() => {
    setLoading(true);
    base44.entities.ScannerIntakeQueue.filter({
      environment: 'LIVE',
    }, '-created_date', 50).then(data => {
      setIntakes(data || []);
      setLoading(false);
    });
  }, [refreshTick]);

  const statusColors = {
    QUEUED: 'bg-amber-50 text-amber-700 border-amber-200',
    RESOLVED: 'bg-green-50 text-green-700 border-green-200',
    REJECTED: 'bg-red-50 text-red-700 border-red-200',
    DUPLICATE: 'bg-slate-50 text-slate-700 border-slate-200',
    CONFLICT: 'bg-orange-50 text-orange-700 border-orange-200',
  };

  const filteredIntakes = useMemo(() => {
    const q = query.toLowerCase();
    return intakes.filter(i =>
      i.raw_barcode.toLowerCase().includes(q) ||
      (i.resolved_sku && i.resolved_sku.toLowerCase().includes(q))
    );
  }, [intakes, query]);

  const handleResolve = async (intakeId, items) => {
    if (!activeIntake || !resolveForm.reason_category) {
      alert('Please select a reason category');
      return;
    }

    const item = items.find(it => it.id === activeIntake.resolved_item_id);
    if (!item) {
      alert('Item not found');
      return;
    }

    try {
      await base44.functions.invoke('processScannerIntake', {
        intake_id: intakeId,
        accept: true,
        resolved_sku: activeIntake.resolved_sku,
        resolved_item_id: activeIntake.resolved_item_id,
        proposed_stock_out_class: resolveForm.stock_out_class,
        proposed_reason_category: resolveForm.reason_category,
        environment: 'LIVE',
      });
      setActiveIntake(null);
      setResolveForm({ stock_out_class: 'WASTAGE', reason_category: '' });
      // Trigger refresh
      window.location.reload();
    } catch (error) {
      console.error('Error resolving intake:', error);
      alert('Failed to resolve intake');
    }
  };

  const queuedCount = intakes.filter(i => i.sync_status === 'QUEUED').length;

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
        <div className="border border-border rounded-2xl bg-card px-4 py-3 min-h-[104px]">
          <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-[0.22em] mb-1.5">Total Scans</p>
          <p className="text-2xl font-bold text-foreground">{intakes.length}</p>
          <p className="text-xs text-muted-foreground mt-2">All scanner entries</p>
        </div>
        <div className="border border-border rounded-2xl bg-card px-4 py-3 min-h-[104px]">
          <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-[0.22em] mb-1.5">Queued</p>
          <p className="text-2xl font-bold text-amber-700">{queuedCount}</p>
          <p className="text-xs text-muted-foreground mt-2">Awaiting resolution</p>
        </div>
        <div className="border border-border rounded-2xl bg-card px-4 py-3 min-h-[104px]">
          <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-[0.22em] mb-1.5">Resolved</p>
          <p className="text-2xl font-bold text-green-700">{intakes.filter(i => i.sync_status === 'RESOLVED').length}</p>
          <p className="text-xs text-muted-foreground mt-2">Generated records</p>
        </div>
        <div className="border border-border rounded-2xl bg-card px-4 py-3 min-h-[104px]">
          <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-[0.22em] mb-1.5">Rejected</p>
          <p className="text-2xl font-bold text-red-700">{intakes.filter(i => i.sync_status === 'REJECTED').length}</p>
          <p className="text-xs text-muted-foreground mt-2">Discarded entries</p>
        </div>
      </div>

      <div className="border border-border rounded-2xl bg-card">
        <div className="px-4 py-3 border-b border-border bg-muted/20">
          <div className="flex items-center gap-3">
            <div className="flex-1">
              <p className="text-sm font-medium text-foreground">Scanner Intake Queue</p>
              <p className="text-xs text-muted-foreground mt-1">Handheld scans pending review and record generation</p>
            </div>
            <span className="text-xs text-muted-foreground">{filteredIntakes.length} visible</span>
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
          ) : filteredIntakes.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-sm font-medium text-foreground mb-1">No scanner entries</p>
              <p className="text-xs text-muted-foreground">Scans from Inventory Settings / Sync & Devices will appear here</p>
            </div>
          ) : (
            <div className="space-y-3">
              {filteredIntakes.map(intake => (
                <div key={intake.id} className="p-4 rounded-xl border border-border bg-background/40">
                  <div className="flex items-start justify-between gap-3 mb-2">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className="font-mono text-sm text-foreground">{intake.raw_barcode}</p>
                        <span className={`text-[11px] px-2 py-0.5 rounded-full border font-medium ${statusColors[intake.sync_status] || 'bg-slate-50 text-slate-700 border-slate-200'}`}>
                          {intake.sync_status}
                        </span>
                      </div>
                      {intake.resolved_sku && (
                        <p className="text-xs text-muted-foreground mt-1.5">Resolved: {intake.resolved_sku}</p>
                      )}
                      <p className="text-xs text-muted-foreground">Device: {intake.device_id} · Qty: {intake.quantity}</p>
                    </div>
                    {intake.sync_status === 'QUEUED' && (
                      <button
                        onClick={() => setActiveIntake(intake)}
                        className="inline-flex items-center gap-1 px-3 h-8 rounded-lg bg-primary text-primary-foreground text-xs font-medium hover:opacity-90 transition-opacity whitespace-nowrap"
                      >
                        <CheckCircle size={13} /> Resolve
                      </button>
                    )}
                    {intake.sync_status === 'REJECTED' && (
                      <span className="text-xs text-muted-foreground">{intake.unresolved_reason}</span>
                    )}
                  </div>
                  <p className="text-[11px] text-muted-foreground mt-3 pt-3 border-t border-border">
                    {new Date(intake.scanned_at).toLocaleString()}
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Resolve Modal */}
      {activeIntake && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-card rounded-2xl border border-border max-w-md w-full shadow-lg">
            <div className="p-4 border-b border-border">
              <h3 className="text-base font-semibold text-foreground">Resolve Scan</h3>
              <p className="text-xs text-muted-foreground mt-1">{activeIntake.raw_barcode}</p>
            </div>

            <div className="p-4 space-y-4">
              <div>
                <label className="text-xs font-medium text-muted-foreground block mb-2">Classification</label>
                <select
                  value={resolveForm.stock_out_class}
                  onChange={(e) => setResolveForm(prev => ({ ...prev, stock_out_class: e.target.value }))}
                  className="w-full h-10 rounded-xl border border-input bg-background px-3 text-sm"
                >
                  <option value="WASTAGE">Wastage</option>
                  <option value="STORE_USE">Store Use</option>
                </select>
              </div>

              <div>
                <label className="text-xs font-medium text-muted-foreground block mb-2">Reason</label>
                <select
                  value={resolveForm.reason_category}
                  onChange={(e) => setResolveForm(prev => ({ ...prev, reason_category: e.target.value }))}
                  className="w-full h-10 rounded-xl border border-input bg-background px-3 text-sm"
                >
                  <option value="">Select...</option>
                  {resolveForm.stock_out_class === 'WASTAGE' ? (
                    <>
                      <option value="DAMAGED">Damaged</option>
                      <option value="EXPIRED">Expired</option>
                      <option value="SPOILED">Spoiled</option>
                    </>
                  ) : (
                    <>
                      <option value="STAFF_REFRESHMENT">Staff Refreshments</option>
                      <option value="CLEANING_USE">Cleaning Use</option>
                      <option value="BREAKROOM">Breakroom Supplies</option>
                    </>
                  )}
                </select>
              </div>
            </div>

            <div className="flex gap-3 p-4 border-t border-border">
              <button
                onClick={() => setActiveIntake(null)}
                className="flex-1 px-4 h-9 rounded-xl border border-border text-sm font-medium text-foreground hover:bg-muted transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={() => handleResolve(activeIntake.id, [])}
                disabled={!resolveForm.reason_category}
                className="flex-1 px-4 h-9 rounded-xl bg-primary text-primary-foreground text-sm font-medium hover:opacity-90 disabled:opacity-50 transition-opacity"
              >
                Resolve
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}