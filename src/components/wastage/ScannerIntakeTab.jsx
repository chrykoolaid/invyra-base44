import { useEffect, useState, useMemo } from 'react';
import { base44 } from '@/api/base44Client';
import { Search, CheckCircle2, AlertTriangle, HelpCircle, Copy, X } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';
import RejectReasonModal from './RejectReasonModal';

// Unknown Barcode Resolution Modal
function ResolveUnknownBarcodeModal({ entry, onClose, onResolve }) {
  const [searchQuery, setSearchQuery] = useState('');
  const [items, setItems] = useState([]);
  const [selectedItem, setSelectedItem] = useState(null);
  const [stockOutClass, setStockOutClass] = useState('WASTAGE');
  const [reasonCategory, setReasonCategory] = useState('DAMAGED');
  const [loading, setLoading] = useState(false);

  const handleSearch = async (q) => {
    setSearchQuery(q);
    if (q.length < 2) {
      setItems([]);
      return;
    }
    setLoading(true);
    base44.entities.InventoryItem.filter({
      environment: 'LIVE',
    }, '-created_date', 20).then(allItems => {
      const filtered = allItems.filter(i =>
        i.sku.toLowerCase().includes(q.toLowerCase()) ||
        i.name.toLowerCase().includes(q.toLowerCase())
      );
      setItems(filtered);
      setLoading(false);
    });
  };

  const handleResolve = async () => {
    if (!selectedItem) {
      toast.error('Please select an item');
      return;
    }
    if (!reasonCategory) {
      toast.error('Please select a reason category');
      return;
    }
    
    try {
      const response = await base44.functions.invoke('processScannerIntake', {
        intake_id: entry.id,
        accept: true,
        resolved_sku: selectedItem.sku,
        resolved_item_id: selectedItem.id,
        proposed_stock_out_class: stockOutClass,
        proposed_reason_category: reasonCategory,
      });
      if (response.data.success) {
        toast.success(`Draft created: ${response.data.generated_record_id}`);
        onResolve();
      }
    } catch (error) {
      toast.error(`Resolution failed: ${error.message}`);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-card rounded-2xl border border-border max-w-md w-full p-6 space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="font-semibold text-foreground">Resolve Unknown Barcode</h2>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground">
            <X size={18} />
          </button>
        </div>

        <div className="space-y-2">
          <p className="text-xs text-muted-foreground">Barcode: <span className="font-mono">{entry.raw_barcode}</span></p>
          <p className="text-xs text-muted-foreground">Quantity: {entry.quantity}</p>
        </div>

        <div className="space-y-2">
          <label className="text-xs font-medium text-foreground">Search Item</label>
          <Input
            value={searchQuery}
            onChange={(e) => handleSearch(e.target.value)}
            placeholder="Search by SKU or item name..."
            className="text-sm"
          />
        </div>

        {loading && <p className="text-xs text-muted-foreground">Loading...</p>}

        {items.length > 0 && (
          <div className="space-y-2">
            <p className="text-xs font-medium text-foreground">{items.length} matches</p>
            <div className="max-h-[200px] overflow-y-auto space-y-1">
              {items.map(item => (
                <button
                  key={item.id}
                  onClick={() => setSelectedItem(item)}
                  className={`w-full text-left p-2 rounded text-xs border ${
                    selectedItem?.id === item.id
                      ? 'bg-primary/10 border-primary text-primary-foreground'
                      : 'bg-muted border-border text-foreground hover:bg-muted/80'
                  }`}
                >
                  <p className="font-medium">{item.sku} — {item.name}</p>
                  <p className="text-[10px] text-muted-foreground">Stock: {item.stock} {item.unit}</p>
                </button>
              ))}
            </div>
          </div>
        )}

        {selectedItem && (
          <div className="space-y-3 bg-muted/30 p-3 rounded-lg">
            <div>
              <label className="text-xs font-medium text-foreground">Stock-Out Class</label>
              <select
                value={stockOutClass}
                onChange={(e) => setStockOutClass(e.target.value)}
                className="w-full mt-1 h-9 px-2 rounded border border-input bg-background text-sm"
              >
                <option value="WASTAGE">Wastage</option>
                <option value="STORE_USE">Store Use</option>
              </select>
            </div>

            <div>
              <label className="text-xs font-medium text-foreground">Reason Category</label>
              <select
                value={reasonCategory}
                onChange={(e) => setReasonCategory(e.target.value)}
                className="w-full mt-1 h-9 px-2 rounded border border-input bg-background text-sm"
              >
                {stockOutClass === 'WASTAGE' ? (
                  <>
                    <option value="DAMAGED">Damaged</option>
                    <option value="EXPIRED">Expired</option>
                    <option value="SPOILED">Spoiled</option>
                    <option value="CONTAMINATED">Contaminated</option>
                    <option value="BREAKAGE">Breakage</option>
                    <option value="HANDLING_DAMAGE">Handling Damage</option>
                  </>
                ) : (
                  <>
                    <option value="STAFF_REFRESHMENT">Staff Refreshments</option>
                    <option value="CLEANING_USE">Cleaning Use</option>
                    <option value="BREAKROOM">Breakroom Supplies</option>
                    <option value="TOILETRIES">Toiletries / Amenities</option>
                    <option value="OFFICE_USE">Office Use</option>
                    <option value="INTERNAL_OPS">Internal Operations</option>
                  </>
                )}
              </select>
            </div>
          </div>
        )}

        <div className="flex gap-2 pt-2">
          <button
            onClick={onClose}
            className="flex-1 px-3 py-2 rounded border border-border text-foreground text-sm hover:bg-muted"
          >
            Cancel
          </button>
          <button
            onClick={handleResolve}
            disabled={!selectedItem || !reasonCategory}
            className="flex-1 px-3 py-2 rounded bg-green-600 text-white text-sm hover:opacity-90 disabled:opacity-50"
          >
            Create Draft
          </button>
        </div>
      </div>
    </div>
  );
}

export default function ScannerIntakeTab({ refreshTick }) {
  const [entries, setEntries] = useState([]);
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [resolveModal, setResolveModal] = useState(null);
  const [rejectModal, setRejectModal] = useState(null);

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
      (e.operator_id && e.operator_id.toLowerCase().includes(q)) ||
      (e.device_id && e.device_id.toLowerCase().includes(q))
    );
  }, [entries, query]);

  const handleAccept = async (entry) => {
    if (!entry.resolved_sku || !entry.proposed_reason_category) {
      toast.error('Must resolve SKU and select reason category');
      return;
    }

    try {
      const response = await base44.functions.invoke('processScannerIntake', {
        intake_id: entry.id,
        accept: true,
        resolved_sku: entry.resolved_sku,
        resolved_item_id: entry.resolved_item_id,
        proposed_stock_out_class: entry.proposed_stock_out_class || 'WASTAGE',
        proposed_reason_category: entry.proposed_reason_category,
      });
      if (response.data.success) {
        toast.success(`Draft created: ${response.data.generated_record_id}`);
        setEntries(entries.filter(e => e.id !== entry.id));
      }
    } catch (error) {
      toast.error(`Accept failed: ${error.message}`);
    }
  };

  const handleReject = async (reason) => {
    if (!rejectModal) return;
    try {
      const response = await base44.functions.invoke('processScannerIntake', {
        intake_id: rejectModal,
        accept: false,
        rejection_reason: reason,
      });
      if (response.data.success) {
        toast.success('Scan rejected');
        setRejectModal(null);
        setEntries(entries.filter(e => e.id !== rejectModal));
      }
    } catch (error) {
      toast.error(`Rejection failed: ${error.message}`);
    }
  };

  const handleMarkDuplicate = async (entryId) => {
    try {
      await base44.asServiceRole.entities.ScannerIntakeQueue.update(entryId, {
        sync_status: 'DUPLICATE',
        is_duplicate: true,
      });

      await base44.asServiceRole.entities.AuditLog.create({
        item_id: '',
        sku: entries.find(e => e.id === entryId)?.resolved_sku || '',
        item_name: '',
        change_type: 'STOCK_WASTE',
        field_name: 'sync_status',
        old_value: 'QUEUED',
        new_value: 'DUPLICATE',
        changed_by: 'current_user',
        actor_role: 'supervisor',
        source_module: 'Scanner',
        action_type: 'SCANNER_MARKED_DUPLICATE',
        linked_source_record: entryId,
        source_record_id: entryId,
        notes: `Scanner intake marked as duplicate`,
        environment: 'LIVE',
      });

      toast.success('Marked as duplicate');
      setEntries(entries.filter(e => e.id !== entryId));
    } catch (error) {
      toast.error(`Mark duplicate failed: ${error.message}`);
    }
  };

  const statusCount = {
    QUEUED: entries.filter(e => e.sync_status === 'QUEUED' && !e.is_duplicate).length,
    DUPLICATE: entries.filter(e => e.is_duplicate).length,
    UNRESOLVED: entries.filter(e => !e.resolved_sku).length,
  };

  return (
    <div className="space-y-4">
      {rejectModal && (
        <RejectReasonModal
          title="Reject Scanner Intake"
          onConfirm={handleReject}
          onCancel={() => setRejectModal(null)}
        />
      )}
      {resolveModal && (
        <ResolveUnknownBarcodeModal
          entry={resolveModal}
          onClose={() => setResolveModal(null)}
          onResolve={() => {
            setResolveModal(null);
            setEntries(entries.filter(e => e.id !== resolveModal.id));
          }}
        />
      )}

      <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
        <div className="border border-border rounded-2xl bg-card px-4 py-3 min-h-[104px]">
          <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-[0.22em] mb-1.5">Pending Scans</p>
          <p className="text-2xl font-bold text-foreground">{statusCount.QUEUED}</p>
          <p className="text-xs text-muted-foreground mt-2">Queued for resolution</p>
        </div>
        <div className="border border-border rounded-2xl bg-card px-4 py-3 min-h-[104px]">
          <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-[0.22em] mb-1.5">Unknown Barcodes</p>
          <p className="text-2xl font-bold text-amber-700">{statusCount.UNRESOLVED}</p>
          <p className="text-xs text-muted-foreground mt-2">Awaiting manual match</p>
        </div>
        <div className="border border-border rounded-2xl bg-card px-4 py-3 min-h-[104px]">
          <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-[0.22em] mb-1.5">Duplicates</p>
          <p className="text-2xl font-bold text-slate-700">{statusCount.DUPLICATE}</p>
          <p className="text-xs text-muted-foreground mt-2">Marked merged</p>
        </div>
        <div className="border border-border rounded-2xl bg-card px-4 py-3 min-h-[104px]">
          <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-[0.22em] mb-1.5">Session</p>
          <p className="text-sm font-mono text-foreground">{entries[0]?.session_id?.slice(-6) || '—'}</p>
          <p className="text-xs text-muted-foreground mt-2">Current batch</p>
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

        <div className="p-4 space-y-4">
          <div className="relative w-full">
            <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search by barcode, SKU, device, or operator..."
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
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-3 text-xs">
                    <div>
                      <p className="text-muted-foreground">Session</p>
                      <p className="font-mono text-foreground text-[11px]">{entry.session_id?.slice(-8) || '—'}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Device</p>
                      <p className="font-mono text-foreground text-[11px]">{entry.device_id?.slice(-6) || '—'}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Operator</p>
                      <p className="text-foreground text-[11px]">{entry.operator_id?.slice(-8) || '—'}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Quantity</p>
                      <p className="text-foreground font-medium">{entry.quantity}</p>
                    </div>
                  </div>

                  <div className="border-t border-border pt-3 mb-3">
                    <div className="flex items-center gap-2 mb-2">
                      <p className="font-mono text-sm font-medium text-foreground">{entry.raw_barcode}</p>
                      {!entry.resolved_sku && (
                        <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-50 text-amber-700 border border-amber-200 font-medium flex items-center gap-1">
                          <HelpCircle size={10} /> Unknown
                        </span>
                      )}
                    </div>
                    {entry.resolved_sku && (
                      <div className="flex items-center gap-2 text-xs">
                        <span className="text-muted-foreground">SKU: <span className="font-mono text-foreground">{entry.resolved_sku}</span></span>
                        <span className="text-muted-foreground">Item: <span className="text-foreground">{entry.resolved_item_id?.slice(-6)}</span></span>
                      </div>
                    )}
                    {entry.proposed_stock_out_class && entry.proposed_reason_category && (
                      <div className="flex items-center gap-2 text-xs mt-1">
                        <span className="px-1.5 py-0.5 rounded bg-primary/10 text-primary font-medium">{entry.proposed_stock_out_class}</span>
                        <span className="text-muted-foreground">{entry.proposed_reason_category}</span>
                      </div>
                    )}
                  </div>

                  <div className="flex items-center justify-between text-xs text-muted-foreground">
                    <span>{new Date(entry.scanned_at).toLocaleString()}</span>
                    <div className="flex gap-2">
                      {!entry.resolved_sku ? (
                        <button
                          onClick={() => setResolveModal(entry)}
                          className="px-2 py-1 rounded bg-amber-600 text-white text-[11px] hover:opacity-90 flex items-center gap-1"
                        >
                          <HelpCircle size={12} /> Resolve
                        </button>
                      ) : (
                        <button
                          onClick={() => handleAccept(entry)}
                          className="px-2 py-1 rounded bg-green-600 text-white text-[11px] hover:opacity-90 flex items-center gap-1"
                        >
                          <CheckCircle2 size={12} /> Accept
                        </button>
                      )}
                      <button
                        onClick={() => handleMarkDuplicate(entry.id)}
                        className="px-2 py-1 rounded bg-slate-600 text-white text-[11px] hover:opacity-90 flex items-center gap-1"
                      >
                        <Copy size={12} /> Duplicate
                      </button>
                      <button
                        onClick={() => setRejectModal(entry.id)}
                        className="px-2 py-1 rounded bg-red-600 text-white text-[11px] hover:opacity-90"
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