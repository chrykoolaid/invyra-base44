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
import {
  OPERATIONAL_LOSS_CLASSES,
  STOCK_OUT_STATUS_COLORS,
  getStockOutClassConfig,
} from '@/lib/stockOutLossConfig';

function ClassBadge({ stockOutClass }) {
  const config = getStockOutClassConfig(stockOutClass);
  return (
    <span className={`text-[11px] px-2 py-0.5 rounded-full border font-medium ${config.badgeClass}`}>
      {config.shortLabel}
    </span>
  );
}

export default function WastageTab({ refreshTick }) {
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
    base44.entities.StockOutRecord.filter({ environment: 'LIVE' }, '-created_date', 100).then(data => {
      setRecords((data || []).filter(record => OPERATIONAL_LOSS_CLASSES.includes(record.stock_out_class || 'WASTAGE')));
      setLoading(false);
    }).catch(() => setLoading(false));
  }, [refreshTick, localRefreshTick]);

  const statusColors = STOCK_OUT_STATUS_COLORS;

  const ACTIVE_WORKFLOW_STATUSES = ['DRAFT', 'SUBMITTED', 'UNDER_REVIEW', 'APPROVED_FOR_ADJUSTMENT', 'REJECTED'];

  const filteredRecords = useMemo(() => {
    const q = query.toLowerCase();
    return records.filter(r =>
      ACTIVE_WORKFLOW_STATUSES.includes(r.status) &&
      ((r.sku || '').toLowerCase().includes(q) ||
      (r.item_name || '').toLowerCase().includes(q) ||
      (r.stock_out_class || '').toLowerCase().includes(q) ||
      (r.reason_category || '').toLowerCase().includes(q) ||
      (r.location || '').toLowerCase().includes(q))
    );
  }, [records, query]);

  const activeRecords = useMemo(() => records.filter(r => ACTIVE_WORKFLOW_STATUSES.includes(r.status)), [records]);
  const archivedRecords = useMemo(() => records.filter(r => ['POSTED', 'REVERSED', 'AMENDED'].includes(r.status)), [records]);

  const role = (user?.role || '').toLowerCase();
  const isStaff = role === 'staff';

  const requireSuccess = (response, fallbackMessage) => {
    const data = response?.data || response || {};
    if (!data.success) {
      throw new Error(data.error || data.message || fallbackMessage);
    }
    return data;
  };

  const submitRecord = async (recordId) => {
    try {
      const response = await base44.functions.invoke('submitStockOutRecord', { record_id: recordId });
      requireSuccess(response, 'Submit failed');
      toast.success('Draft submitted for approval');
      setLocalRefreshTick(t => t + 1);
    } catch (e) {
      toast.error(e.message || 'Submit failed');
    }
  };

  const handleApprove = async (recordId) => {
    try {
      const response = await base44.functions.invoke('approveStockOutRecordV2', { record_id: recordId });
      const data = requireSuccess(response, 'Approval failed');
      toast.success(`Stock-out approved. Balance: ${data.balance_before} → ${data.balance_after}`);
      setLocalRefreshTick(t => t + 1);
    } catch (error) {
      toast.error(`Approval failed: ${error.message}`);
    }
  };

  const handleReject = async (reason) => {
    if (!rejectModal) return;
    try {
      const response = await base44.functions.invoke('rejectStockOutRecord', { record_id: rejectModal, reason });
      requireSuccess(response, 'Rejection failed');
      toast.success('Record rejected');
      setRejectModal(null);
      setLocalRefreshTick(t => t + 1);
    } catch (error) {
      toast.error(`Rejection failed: ${error.message}`);
    }
  };

  const handleReverse = async (reason) => {
    if (!reverseModal) return;
    try {
      const response = await base44.functions.invoke('reverseStockOutRecord', { record_id: reverseModal, reason });
      const data = requireSuccess(response, 'Reversal failed');
      toast.success(`Reversed. Balance: ${data.balance_before} → ${data.balance_after}`);
      setReverseModal(null);
      setLocalRefreshTick(t => t + 1);
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
        notes: 'Draft stock-out deleted before submission. No StockMovement was created.',
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
          <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-[0.22em] mb-1.5">Active Loss Events</p>
          <p className="text-2xl font-bold text-foreground">{activeRecords.length}</p>
          <p className="text-xs text-muted-foreground mt-2">Wastage, damage, and expiry</p>
        </div>
        <div className="border border-border rounded-2xl bg-card px-4 py-3 min-h-[104px]">
          <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-[0.22em] mb-1.5">Pending Approval</p>
          <p className="text-2xl font-bold text-amber-700">{activeRecords.filter(r => r.status === 'SUBMITTED').length}</p>
          <p className="text-xs text-muted-foreground mt-2">Awaiting decision</p>
        </div>
        <div className="border border-border rounded-2xl bg-card px-4 py-3 min-h-[104px]">
          <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-[0.22em] mb-1.5">Archived</p>
          <p className="text-2xl font-bold text-green-700">{archivedRecords.length}</p>
          <p className="text-xs text-muted-foreground mt-2">Posted/reversed history</p>
        </div>
        <div className="border border-border rounded-2xl bg-card px-4 py-3 min-h-[104px]">
          <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-[0.22em] mb-1.5">Total Value</p>
          <p className="text-2xl font-bold text-foreground">{isStaff ? 'Restricted' : `₱${activeRecords.reduce((s, r) => s + (r.estimated_value || 0), 0).toFixed(0)}`}</p>
          <p className="text-xs text-muted-foreground mt-2">{isStaff ? 'Manager-only value' : 'Active estimated cost'}</p>
        </div>
      </div>

      <div className="border border-border rounded-2xl bg-card">
        <div className="px-4 py-3 border-b border-border bg-muted/20">
          <div className="flex items-center gap-3">
            <div className="flex-1">
              <p className="text-sm font-medium text-foreground">Active Wastage / Damage / Expiry</p>
              <p className="text-xs text-muted-foreground mt-1">Draft, submitted, and rejected operational loss records requiring action</p>
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
              placeholder="Search by SKU, item, class, reason, or location..."
              className="pl-9"
            />
          </div>

          {loading ? (
            <div className="text-center py-12">
              <div className="w-6 h-6 border-3 border-muted border-t-foreground rounded-full animate-spin mx-auto"></div>
            </div>
          ) : filteredRecords.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-sm font-medium text-foreground mb-1">No active operational loss records</p>
              <p className="text-xs text-muted-foreground">Posted and reversed records are held in Archive</p>
            </div>
          ) : (
            <div className="space-y-3">
              {filteredRecords.map(record => (
                <div key={record.id} className="p-4 rounded-xl border border-border bg-background/40 hover:bg-muted/25 transition-colors">
                  <div className="flex items-start justify-between gap-3 mb-2">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className="font-medium text-foreground text-sm">{record.item_name}</p>
                        <ClassBadge stockOutClass={record.stock_out_class || 'WASTAGE'} />
                        <span className={`text-[11px] px-2 py-0.5 rounded-full border font-medium ${statusColors[record.status] || 'bg-slate-50 text-slate-700 border-slate-200'}`}>
                          {record.status}
                        </span>
                      </div>
                      <p className="text-xs text-muted-foreground mt-1.5">{record.sku} · {record.location || record.reason_category}</p>
                    </div>
                    <div className="text-right whitespace-nowrap">
                      <p className="font-semibold text-foreground">{record.quantity} units</p>
                      {!isStaff && <p className="text-xs text-muted-foreground">₱{Number(record.estimated_value || 0).toFixed(2)}</p>}
                    </div>
                  </div>
                  <div className="flex items-center justify-between gap-3 text-xs text-muted-foreground mt-3 pt-3 border-t border-border">
                    <div className="flex items-center gap-4 flex-wrap">
                      <span>{record.reason_category}</span>
                      <span>{record.created_date ? new Date(record.created_date).toLocaleDateString() : 'No date'}</span>
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
                      {record.status === 'SUBMITTED' && !record.review_required && (
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
                      {record.review_required && (
                        <span className="px-2 py-1 text-[11px] rounded bg-amber-50 text-amber-700 border border-amber-200">
                          Use Loss Review tab
                        </span>
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
