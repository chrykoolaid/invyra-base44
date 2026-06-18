import { useEffect, useState, useMemo } from 'react';
import { base44 } from '@/api/base44Client';
import { Search, CheckCircle2, X, Undo2, Pencil, Trash2 } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';
import RejectReasonModal from './RejectReasonModal';
import RecordStockOutModal from './RecordStockOutModal';
import DeleteDraftConfirmModal from './DeleteDraftConfirmModal';
import {
  canApproveStockOut,
  canDeleteStockOutDraft,
  canEditStockOutDraft,
  canRejectStockOut,
  canReverseStockOut,
  canSubmitStockOut,
} from '@/lib/rolePermissions';

export default function StoreUseTab({ refreshTick }) {
  const [user, setUser] = useState(null);
  const [records, setRecords] = useState([]);
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [rejectModal, setRejectModal] = useState(null);
  const [reverseModal, setReverseModal] = useState(null);
  const [editDraftRecord, setEditDraftRecord] = useState(null);
  const [deleteDraftRecord, setDeleteDraftRecord] = useState(null);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [localRefreshTick, setLocalRefreshTick] = useState(0);

  useEffect(() => {
    base44.auth.me().then(u => setUser(u)).catch(() => {});
  }, []);

  useEffect(() => {
    setLoading(true);
    base44.entities.StockOutRecord.filter({
      stock_out_class: 'STORE_USE',
      environment: 'LIVE',
    }, '-created_date', 50).then(data => {
      setRecords(data || []);
      setLoading(false);
    }).catch(() => setLoading(false));
  }, [refreshTick, localRefreshTick]);

  const statusColors = {
    DRAFT: 'bg-slate-50 text-slate-700 border-slate-200',
    SUBMITTED: 'bg-amber-50 text-amber-700 border-amber-200',
    APPROVED: 'bg-blue-50 text-blue-700 border-blue-200',
    POSTED: 'bg-green-50 text-green-700 border-green-200',
    AMENDED: 'bg-purple-50 text-purple-700 border-purple-200',
    REVERSED: 'bg-slate-50 text-slate-700 border-slate-200',
    REJECTED: 'bg-red-50 text-red-700 border-red-200',
  };

  const filteredRecords = useMemo(() => {
    const q = query.toLowerCase();
    return records.filter(r =>
      (r.sku || '').toLowerCase().includes(q) ||
      (r.item_name || '').toLowerCase().includes(q) ||
      (r.reason_category || '').toLowerCase().includes(q) ||
      (r.department || '').toLowerCase().includes(q)
    );
  }, [records, query]);

  const role = (user?.role || '').toLowerCase();
  const isStaff = role === 'staff';

  const submitRecord = async (recordId) => {
    try {
      const response = await base44.functions.invoke('submitStockOutRecord', { record_id: recordId });
      if (response.data.success) {
        toast.success('Draft submitted for approval');
        setLocalRefreshTick(t => t + 1);
      }
    } catch (e) {
      toast.error(e.message || 'Submit failed');
    }
  };

  const handleApprove = async (recordId) => {
    try {
      const response = await base44.functions.invoke('approveStockOutRecordV2', { record_id: recordId });
      if (response.data.success) {
        toast.success(`Store use approved. Balance: ${response.data.balance_before} → ${response.data.balance_after}`);
        setLocalRefreshTick(t => t + 1);
      }
    } catch (error) {
      toast.error(`Approval failed: ${error.message}`);
    }
  };

  const handleReject = async (reason) => {
    if (!rejectModal) return;
    try {
      const response = await base44.functions.invoke('rejectStockOutRecord', { record_id: rejectModal, reason });
      if (response.data.success) {
        toast.success('Record rejected');
        setRejectModal(null);
        setLocalRefreshTick(t => t + 1);
      }
    } catch (error) {
      toast.error(`Rejection failed: ${error.message}`);
    }
  };

  const handleReverse = async (reason) => {
    if (!reverseModal) return;
    try {
      const response = await base44.functions.invoke('reverseStockOutRecord', { record_id: reverseModal, reason });
      if (response.data.success) {
        toast.success(`Reversed. Balance: ${response.data.balance_before} → ${response.data.balance_after}`);
        setReverseModal(null);
        setLocalRefreshTick(t => t + 1);
      }
    } catch (error) {
      toast.error(`Reversal failed: ${error.message}`);
    }
  };

  const handleDeleteDraft = async () => {
    if (!deleteDraftRecord || deleteDraftRecord.status !== 'DRAFT') return;
    setDeleteLoading(true);
    try {
      await base44.entities.StockOutRecord.delete(deleteDraftRecord.id);
      await base44.entities.AuditLog.create({
        item_id: deleteDraftRecord.item_id,
        sku: deleteDraftRecord.sku,
        item_name: deleteDraftRecord.item_name,
        change_type: 'STOCK_WASTE',
        field_name: 'stock_out_draft',
        old_value: JSON.stringify({
          record_id: deleteDraftRecord.id,
          quantity: deleteDraftRecord.quantity,
          reason: deleteDraftRecord.reason_category,
          estimated_value: deleteDraftRecord.estimated_value || 0,
        }),
        new_value: 'DELETED',
        changed_by: user?.email || user?.id || 'unknown',
        actor_role: user?.role || 'unknown',
        source_module: 'StockOut',
        action_type: 'STOCK_OUT_DRAFT_DELETED',
        linked_source_record: deleteDraftRecord.id,
        source_record_id: deleteDraftRecord.id,
        notes: 'Draft store use stock-out deleted before submission. No StockMovement was created.',
        environment: deleteDraftRecord.environment || 'LIVE',
      });
      toast.success('Draft deleted. No stock movement was posted.');
      setDeleteDraftRecord(null);
      setLocalRefreshTick(t => t + 1);
    } catch (error) {
      toast.error(`Delete failed: ${error.message}`);
    } finally {
      setDeleteLoading(false);
    }
  };

  return (
    <div className="space-y-4">
      {rejectModal && (
        <RejectReasonModal
          title="Reject Stock-Out Record"
          onConfirm={handleReject}
          onCancel={() => setRejectModal(null)}
        />
      )}
      {reverseModal && (
        <RejectReasonModal
          title="Reverse Stock-Out Record"
          onConfirm={handleReverse}
          onCancel={() => setReverseModal(null)}
        />
      )}
      {editDraftRecord && (
        <RecordStockOutModal
          initialRecord={editDraftRecord}
          onClose={() => setEditDraftRecord(null)}
          onSuccess={() => {
            toast.success('Draft updated. No stock movement was posted.');
            setEditDraftRecord(null);
            setLocalRefreshTick(t => t + 1);
          }}
        />
      )}
      {deleteDraftRecord && (
        <DeleteDraftConfirmModal
          record={deleteDraftRecord}
          loading={deleteLoading}
          onCancel={() => setDeleteDraftRecord(null)}
          onConfirm={handleDeleteDraft}
        />
      )}

      <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
        <div className="border border-border rounded-2xl bg-card px-4 py-3 min-h-[104px]">
          <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-[0.22em] mb-1.5">Total Store Use</p>
          <p className="text-2xl font-bold text-foreground">{records.length}</p>
          <p className="text-xs text-muted-foreground mt-2">Internal consumption records</p>
        </div>
        <div className="border border-border rounded-2xl bg-card px-4 py-3 min-h-[104px]">
          <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-[0.22em] mb-1.5">Pending Approval</p>
          <p className="text-2xl font-bold text-amber-700">{records.filter(r => r.status === 'SUBMITTED').length}</p>
          <p className="text-xs text-muted-foreground mt-2">Awaiting decision</p>
        </div>
        <div className="border border-border rounded-2xl bg-card px-4 py-3 min-h-[104px]">
          <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-[0.22em] mb-1.5">Posted</p>
          <p className="text-2xl font-bold text-green-700">{records.filter(r => r.status === 'POSTED').length}</p>
          <p className="text-xs text-muted-foreground mt-2">Stock impact recorded</p>
        </div>
        <div className="border border-border rounded-2xl bg-card px-4 py-3 min-h-[104px]">
          <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-[0.22em] mb-1.5">Total Value</p>
          <p className="text-2xl font-bold text-foreground">{isStaff ? 'Restricted' : `₱${records.reduce((s, r) => s + (r.estimated_value || 0), 0).toFixed(0)}`}</p>
          <p className="text-xs text-muted-foreground mt-2">{isStaff ? 'Manager-only value' : 'Estimated cost'}</p>
        </div>
      </div>

      <div className="border border-border rounded-2xl bg-card">
        <div className="px-4 py-3 border-b border-border bg-muted/20">
          <div className="flex items-center gap-3">
            <div className="flex-1">
              <p className="text-sm font-medium text-foreground">Store Use Ledger</p>
              <p className="text-xs text-muted-foreground mt-1">All legitimate internal consumption across all stages</p>
            </div>
            <span className="text-xs text-muted-foreground">{filteredRecords.length} visible</span>
          </div>
        </div>

        <div className="p-4">
          <div className="relative w-full mb-4">
            <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search by SKU, item, department, or reason..."
              className="pl-9"
            />
          </div>

          {loading ? (
            <div className="text-center py-12">
              <div className="w-6 h-6 border-3 border-muted border-t-foreground rounded-full animate-spin mx-auto"></div>
            </div>
          ) : filteredRecords.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-sm font-medium text-foreground mb-1">No store use records</p>
              <p className="text-xs text-muted-foreground">Start by creating a new store use record</p>
            </div>
          ) : (
            <div className="space-y-3">
              {filteredRecords.map(record => (
                <div key={record.id} className="p-4 rounded-xl border border-border bg-background/40 hover:bg-muted/25 transition-colors">
                  <div className="flex items-start justify-between gap-3 mb-2">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className="font-medium text-foreground text-sm">{record.item_name}</p>
                        <span className="text-[11px] px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 border border-blue-200 font-medium">STORE USE</span>
                        <span className={`text-[11px] px-2 py-0.5 rounded-full border font-medium ${statusColors[record.status] || 'bg-slate-50 text-slate-700 border-slate-200'}`}>
                          {record.status}
                        </span>
                      </div>
                      <p className="text-xs text-muted-foreground mt-1.5">{record.sku} · {record.reason_category}</p>
                      {record.department && <p className="text-xs text-muted-foreground">Dept: {record.department}{record.cost_centre ? ` · CC: ${record.cost_centre}` : ''}</p>}
                    </div>
                    <div className="text-right whitespace-nowrap">
                      <p className="font-semibold text-foreground">{record.quantity} units</p>
                      {!isStaff && <p className="text-xs text-muted-foreground">₱{record.estimated_value?.toFixed(2)}</p>}
                    </div>
                  </div>
                  <div className="flex items-center justify-between gap-3 text-xs text-muted-foreground mt-3 pt-3 border-t border-border">
                    <div className="flex items-center gap-4 flex-wrap">
                      <span>{new Date(record.created_date).toLocaleDateString()}</span>
                      {record.reason_notes && <span>{record.reason_notes}</span>}
                    </div>
                    <div className="flex items-center gap-2 flex-wrap justify-end">
                      {record.status === 'DRAFT' && canEditStockOutDraft(user?.role, user, record) && (
                        <button
                          onClick={() => setEditDraftRecord(record)}
                          className="px-2 py-1 text-[11px] rounded border border-border bg-background text-foreground hover:bg-muted flex items-center gap-1"
                        >
                          <Pencil size={12} /> Edit Draft
                        </button>
                      )}
                      {record.status === 'DRAFT' && canSubmitStockOut(user?.role, user, record) && (
                        <button
                          onClick={() => submitRecord(record.id)}
                          className="px-2 py-1 text-[11px] rounded bg-primary text-primary-foreground hover:opacity-90"
                        >
                          Submit
                        </button>
                      )}
                      {record.status === 'DRAFT' && canDeleteStockOutDraft(user?.role, user, record) && (
                        <button
                          onClick={() => setDeleteDraftRecord(record)}
                          className="px-2 py-1 text-[11px] rounded bg-red-50 text-red-700 border border-red-200 hover:bg-red-100 flex items-center gap-1"
                        >
                          <Trash2 size={12} /> Delete Draft
                        </button>
                      )}
                      {record.status === 'SUBMITTED' && (
                        <>
                          {canApproveStockOut(user?.role) && (
                            <button
                              onClick={() => handleApprove(record.id)}
                              className="px-2 py-1 text-[11px] rounded bg-green-600 text-white hover:opacity-90 flex items-center gap-1"
                            >
                              <CheckCircle2 size={12} /> Approve
                            </button>
                          )}
                          {canRejectStockOut(user?.role) && (
                            <button
                              onClick={() => setRejectModal(record.id)}
                              className="px-2 py-1 text-[11px] rounded bg-red-600 text-white hover:opacity-90 flex items-center gap-1"
                            >
                              <X size={12} /> Reject
                            </button>
                          )}
                        </>
                      )}
                      {record.status === 'POSTED' && canReverseStockOut(user?.role) && (
                        <button
                          onClick={() => setReverseModal(record.id)}
                          className="px-2 py-1 text-[11px] rounded bg-slate-600 text-white hover:opacity-90 flex items-center gap-1"
                        >
                          <Undo2 size={12} /> Reverse
                        </button>
                      )}
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
