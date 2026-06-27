import { useEffect, useMemo, useState } from 'react';
import { base44 } from '@/api/base44Client';
import { Input } from '@/components/ui/input';
import { AlertTriangle, CheckCircle2, Search, X } from 'lucide-react';
import { toast } from 'sonner';
import {
  STOCK_OUT_CLASS_CONFIG,
  STOCK_OUT_STATUS_COLORS,
  STOCK_OUT_STATUS_LABELS,
  getStockOutClassConfig,
  getStockOutClassLabel,
} from '@/lib/stockOutLossConfig';
import {
  canClassifyConfirmedTheft,
  canPostReviewedStockOut,
  canReclassifyStockOutLoss,
  canReviewControlledLoss,
  canStartStockOutReview,
} from '@/lib/rolePermissions';

const CONTROLLED_LOSS_CLASSES = ['THEFT_SUSPECTED', 'THEFT_CONFIRMED', 'UNKNOWN_SHRINKAGE'];

const REVIEW_FILTERS = [
  { key: 'ALL', label: 'All' },
  { key: 'NEEDS_REVIEW', label: 'Needs Review' },
  { key: 'UNDER_REVIEW', label: 'Under Review' },
  { key: 'POSTED', label: 'Posted' },
  { key: 'REJECTED', label: 'Rejected' },
];

function toActor(user) {
  return user?.email || user?.id || 'unknown';
}

function requireSuccess(response, fallbackMessage) {
  const data = response?.data || response || {};
  if (!data.success) {
    throw new Error(data.error || data.message || fallbackMessage);
  }
  return data;
}

function ReviewBadge({ status }) {
  const color = STOCK_OUT_STATUS_COLORS[status] || 'bg-slate-50 text-slate-700 border-slate-200';
  return (
    <span className={`text-[11px] px-2 py-0.5 rounded-full border font-medium ${color}`}>
      {STOCK_OUT_STATUS_LABELS[status] || status || 'Unknown'}
    </span>
  );
}

function ClassBadge({ stockOutClass }) {
  const config = getStockOutClassConfig(stockOutClass);
  return (
    <span className={`text-[11px] px-2 py-0.5 rounded-full border font-medium ${config.badgeClass}`}>
      {config.shortLabel}
    </span>
  );
}

function FilterButton({ active, onClick, label }) {
  return (
    <button
      onClick={onClick}
      className={`h-8 px-3 rounded-lg border text-xs font-medium transition-colors ${
        active ? 'border-primary bg-primary/5 text-primary' : 'border-border bg-background text-muted-foreground hover:bg-muted'
      }`}
    >
      {label}
    </button>
  );
}

function ReviewModal({ record, user, onClose, onChanged }) {
  const [loadingAction, setLoadingAction] = useState('');
  const [reviewNotes, setReviewNotes] = useState(record.review_notes || '');
  const [finalClassification, setFinalClassification] = useState(record.final_classification || record.stock_out_class || 'UNKNOWN_SHRINKAGE');

  const role = user?.role;
  const canConfirmTheft = canClassifyConfirmedTheft(role);
  const classificationOptions = Object.keys(STOCK_OUT_CLASS_CONFIG).filter((key) => key !== 'THEFT_CONFIRMED' || canConfirmTheft);
  const actor = toActor(user);

  const createAudit = async ({ actionType, oldStatus, newStatus, oldClass, newClass, reviewDecision, notes }) => {
    await base44.entities.AuditLog.create({
      item_id: record.item_id,
      sku: record.sku,
      item_name: record.item_name,
      change_type: 'STOCK_WASTE',
      field_name: 'controlled_loss_review',
      old_value: JSON.stringify({
        stock_out_record_id: record.id,
        status: oldStatus,
        stock_out_class: oldClass,
      }),
      new_value: JSON.stringify({
        stock_out_record_id: record.id,
        status: newStatus,
        stock_out_class: newClass,
        review_decision: reviewDecision,
        review_notes: notes || '',
      }),
      changed_by: actor,
      actor_role: role || 'unknown',
      source_module: 'StockOut',
      action_type: actionType,
      linked_source_record: record.id,
      source_record_id: record.id,
      notes: notes || 'Controlled loss review action recorded.',
      environment: record.environment || 'LIVE',
    });
  };

  const startReview = async () => {
    if (!canStartStockOutReview(role)) {
      toast.error('You do not have permission to start this review.');
      return;
    }
    setLoadingAction('START_REVIEW');
    try {
      const now = new Date().toISOString();
      await base44.entities.StockOutRecord.update(record.id, {
        status: 'UNDER_REVIEW',
        reviewed_by: actor,
        reviewed_at: now,
        updated_at: now,
      });
      await createAudit({
        actionType: 'CONTROLLED_LOSS_REVIEW_STARTED',
        oldStatus: record.status,
        newStatus: 'UNDER_REVIEW',
        oldClass: record.stock_out_class,
        newClass: record.stock_out_class,
        reviewDecision: 'UNDER_REVIEW',
        notes: 'Controlled loss review started. No StockMovement was created.',
      });
      toast.success('Review started');
      onChanged();
    } catch (error) {
      toast.error(`Could not start review: ${error.message}`);
    } finally {
      setLoadingAction('');
    }
  };

  const rejectNoStockChange = async () => {
    if (!canReviewControlledLoss(role)) {
      toast.error('You do not have permission to reject this review.');
      return;
    }
    if (!reviewNotes.trim()) {
      toast.error('Review notes are required to reject a loss event.');
      return;
    }
    setLoadingAction('REJECT');
    try {
      const now = new Date().toISOString();
      await base44.entities.StockOutRecord.update(record.id, {
        status: 'REJECTED',
        review_required: true,
        review_decision: 'REJECT_NO_STOCK_CHANGE',
        review_notes: reviewNotes,
        final_classification: finalClassification,
        reviewed_by: actor,
        reviewed_at: now,
        updated_at: now,
        posted_movement_id: record.posted_movement_id || null,
      });
      await createAudit({
        actionType: 'CONTROLLED_LOSS_REJECTED_NO_STOCK_CHANGE',
        oldStatus: record.status,
        newStatus: 'REJECTED',
        oldClass: record.stock_out_class,
        newClass: finalClassification,
        reviewDecision: 'REJECT_NO_STOCK_CHANGE',
        notes: reviewNotes,
      });
      toast.success('Loss event rejected. No stock movement was posted.');
      onChanged();
    } catch (error) {
      toast.error(`Reject failed: ${error.message}`);
    } finally {
      setLoadingAction('');
    }
  };

  const approveAndPost = async ({ reclassify = false } = {}) => {
    if (!canPostReviewedStockOut(role)) {
      toast.error('You do not have permission to post this adjustment.');
      return;
    }
    if (record.status === 'POSTED' || record.posted_movement_id) {
      toast.error('This loss event has already been posted to inventory.');
      return;
    }
    if (finalClassification === 'THEFT_CONFIRMED' && !canConfirmTheft) {
      toast.error('Only manager/admin/owner users can classify confirmed theft loss.');
      return;
    }
    setLoadingAction(reclassify ? 'RECLASSIFY_APPROVE' : 'APPROVE');
    try {
      const now = new Date().toISOString();
      const reviewDecision = reclassify ? 'RECLASSIFY_AND_APPROVE' : 'APPROVE_ADJUSTMENT';

      await base44.entities.StockOutRecord.update(record.id, {
        status: 'SUBMITTED',
        stock_out_class: finalClassification,
        review_required: true,
        review_decision: reviewDecision,
        review_notes: reviewNotes,
        final_classification: finalClassification,
        reviewed_by: actor,
        reviewed_at: now,
        updated_at: now,
      });

      await createAudit({
        actionType: reclassify ? 'CONTROLLED_LOSS_RECLASSIFIED_AND_APPROVED' : 'CONTROLLED_LOSS_APPROVED_FOR_ADJUSTMENT',
        oldStatus: record.status,
        newStatus: 'APPROVED_FOR_ADJUSTMENT',
        oldClass: record.stock_out_class,
        newClass: finalClassification,
        reviewDecision,
        notes: reviewNotes || 'Approved controlled loss adjustment. Posting through StockMovement ledger.',
      });

      const response = await base44.functions.invoke('approveStockOutRecordV2', { record_id: record.id });
      const data = requireSuccess(response, 'Posting failed');
      toast.success(`Loss adjustment posted. Balance: ${data.balance_before} → ${data.balance_after}`);
      onChanged();
    } catch (error) {
      toast.error(`Approve/post failed: ${error.message}`);
    } finally {
      setLoadingAction('');
    }
  };

  const reclassifyNoStockChange = async () => {
    if (!canReclassifyStockOutLoss(role)) {
      toast.error('You do not have permission to reclassify this review.');
      return;
    }
    if (!reviewNotes.trim()) {
      toast.error('Review notes are required to reclassify without stock change.');
      return;
    }
    if (finalClassification === 'THEFT_CONFIRMED' && !canConfirmTheft) {
      toast.error('Only manager/admin/owner users can classify confirmed theft loss.');
      return;
    }
    setLoadingAction('RECLASSIFY_NO_STOCK');
    try {
      const now = new Date().toISOString();
      await base44.entities.StockOutRecord.update(record.id, {
        status: 'REJECTED',
        stock_out_class: finalClassification,
        review_required: true,
        review_decision: 'RECLASSIFY_NO_STOCK_CHANGE',
        review_notes: reviewNotes,
        final_classification: finalClassification,
        reviewed_by: actor,
        reviewed_at: now,
        updated_at: now,
        posted_movement_id: record.posted_movement_id || null,
      });
      await createAudit({
        actionType: 'CONTROLLED_LOSS_RECLASSIFIED_NO_STOCK_CHANGE',
        oldStatus: record.status,
        newStatus: 'REJECTED',
        oldClass: record.stock_out_class,
        newClass: finalClassification,
        reviewDecision: 'RECLASSIFY_NO_STOCK_CHANGE',
        notes: reviewNotes,
      });
      toast.success('Loss event reclassified with no stock movement.');
      onChanged();
    } catch (error) {
      toast.error(`Reclassify failed: ${error.message}`);
    } finally {
      setLoadingAction('');
    }
  };

  const isPosted = record.status === 'POSTED' || Boolean(record.posted_movement_id);

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
      <div className="bg-card rounded-2xl border border-border max-w-3xl w-full max-h-[90vh] overflow-y-auto shadow-lg">
        <div className="sticky top-0 flex items-start justify-between p-4 border-b border-border bg-card z-10">
          <div>
            <h2 className="text-base font-semibold text-foreground">Controlled Loss Review</h2>
            <p className="text-xs text-muted-foreground mt-1">Review without accusatory wording. Stock changes only post through the ledger.</p>
          </div>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground">
            <X size={18} />
          </button>
        </div>

        <div className="p-4 space-y-4">
          <div className="rounded-xl border border-border bg-muted/20 p-4">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-sm font-semibold text-foreground">{record.item_name}</p>
                <p className="text-xs text-muted-foreground mt-1">{record.sku || 'No SKU'} · {record.quantity} units · {record.location || 'No location'}</p>
              </div>
              <div className="flex items-center gap-2 flex-wrap justify-end">
                <ClassBadge stockOutClass={record.stock_out_class} />
                <ReviewBadge status={record.status} />
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-4 text-xs">
              <div>
                <p className="text-muted-foreground">Reason</p>
                <p className="font-medium text-foreground mt-0.5">{record.reason_category || 'Not provided'}</p>
              </div>
              <div>
                <p className="text-muted-foreground">Created By</p>
                <p className="font-medium text-foreground mt-0.5">{record.created_by_email || record.created_by || 'Unknown'}</p>
              </div>
              <div>
                <p className="text-muted-foreground">Incident Reference</p>
                <p className="font-medium text-foreground mt-0.5">{record.incident_reference || 'None'}</p>
              </div>
              <div>
                <p className="text-muted-foreground">Evidence Reference</p>
                <p className="font-medium text-foreground mt-0.5">{record.evidence_reference || 'None'}</p>
              </div>
            </div>
            {record.reason_notes && (
              <div className="mt-4 text-xs">
                <p className="text-muted-foreground">Staff Notes</p>
                <p className="font-medium text-foreground mt-0.5 whitespace-pre-wrap">{record.reason_notes}</p>
              </div>
            )}
          </div>

          {!isPosted && (
            <div className="rounded-xl border border-amber-200 bg-amber-50 p-3 flex gap-3">
              <AlertTriangle size={18} className="text-amber-700 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-semibold text-amber-900">StockMovement guardrail</p>
                <p className="text-xs text-amber-900 mt-1">Approving this event will post through the existing stock-out approval function. Rejecting or reclassifying with no stock change will not affect stock.</p>
              </div>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-medium text-muted-foreground block mb-1.5">Final Classification</label>
              <select
                value={finalClassification}
                onChange={(e) => setFinalClassification(e.target.value)}
                disabled={isPosted}
                className="w-full h-10 rounded-xl border border-input bg-background px-3 text-sm disabled:opacity-60"
              >
                {classificationOptions.map(key => (
                  <option key={key} value={key}>{getStockOutClassLabel(key)}</option>
                ))}
              </select>
              {!canConfirmTheft && (
                <p className="text-[11px] text-muted-foreground mt-1">Confirmed theft loss is manager/admin/owner only.</p>
              )}
            </div>
            <div>
              <label className="text-xs font-medium text-muted-foreground block mb-1.5">Review Decision</label>
              <div className="h-10 rounded-xl border border-border bg-muted/20 px-3 flex items-center text-sm text-muted-foreground">
                Select an action below
              </div>
            </div>
          </div>

          <div>
            <label className="text-xs font-medium text-muted-foreground block mb-1.5">Review Notes</label>
            <textarea
              value={reviewNotes}
              onChange={(e) => setReviewNotes(e.target.value)}
              placeholder="Add neutral review notes. Do not name or accuse people."
              rows="4"
              disabled={isPosted}
              className="w-full p-3 rounded-xl border border-input bg-background text-sm resize-none disabled:opacity-60"
            />
          </div>
        </div>

        <div className="sticky bottom-0 p-4 border-t border-border bg-card">
          <div className="flex items-center justify-between gap-3 flex-wrap">
            <p className="text-xs text-muted-foreground">Posted records cannot be posted again.</p>
            <div className="flex items-center gap-2 flex-wrap justify-end">
              <button
                onClick={onClose}
                className="px-3 h-9 rounded-xl border border-border text-sm font-medium hover:bg-muted"
              >
                Close
              </button>
              {record.status === 'SUBMITTED' && !isPosted && (
                <button
                  onClick={startReview}
                  disabled={Boolean(loadingAction)}
                  className="px-3 h-9 rounded-xl border border-blue-200 bg-blue-50 text-blue-700 text-sm font-medium hover:bg-blue-100 disabled:opacity-50"
                >
                  {loadingAction === 'START_REVIEW' ? 'Starting...' : 'Start Review'}
                </button>
              )}
              {!isPosted && (
                <>
                  <button
                    onClick={rejectNoStockChange}
                    disabled={Boolean(loadingAction)}
                    className="px-3 h-9 rounded-xl border border-red-200 bg-red-50 text-red-700 text-sm font-medium hover:bg-red-100 disabled:opacity-50"
                  >
                    {loadingAction === 'REJECT' ? 'Rejecting...' : 'Reject — No Stock Change'}
                  </button>
                  <button
                    onClick={reclassifyNoStockChange}
                    disabled={Boolean(loadingAction)}
                    className="px-3 h-9 rounded-xl border border-slate-200 bg-slate-50 text-slate-700 text-sm font-medium hover:bg-slate-100 disabled:opacity-50"
                  >
                    {loadingAction === 'RECLASSIFY_NO_STOCK' ? 'Saving...' : 'Reclassify — No Stock Change'}
                  </button>
                  <button
                    onClick={() => approveAndPost({ reclassify: finalClassification !== record.stock_out_class })}
                    disabled={Boolean(loadingAction)}
                    className="px-3 h-9 rounded-xl bg-green-600 text-white text-sm font-medium hover:opacity-90 disabled:opacity-50"
                  >
                    {loadingAction === 'APPROVE' || loadingAction === 'RECLASSIFY_APPROVE' ? 'Posting...' : finalClassification !== record.stock_out_class ? 'Reclassify and Post' : 'Approve Adjustment'}
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function LossReviewTab({ refreshTick }) {
  const [user, setUser] = useState(null);
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(false);
  const [query, setQuery] = useState('');
  const [filter, setFilter] = useState('NEEDS_REVIEW');
  const [selectedRecord, setSelectedRecord] = useState(null);
  const [localRefreshTick, setLocalRefreshTick] = useState(0);

  useEffect(() => {
    base44.auth.me().then(u => setUser(u)).catch(() => {});
  }, []);

  useEffect(() => {
    setLoading(true);
    base44.entities.StockOutRecord.filter({ environment: 'LIVE' }, '-created_date', 100)
      .then(data => {
        const controlled = (data || []).filter(record => (
          record.review_required === true || CONTROLLED_LOSS_CLASSES.includes(record.stock_out_class)
        ));
        setRecords(controlled);
      })
      .catch(() => setRecords([]))
      .finally(() => setLoading(false));
  }, [refreshTick, localRefreshTick]);

  const filteredRecords = useMemo(() => {
    const q = query.trim().toLowerCase();
    return records.filter(record => {
      const matchesFilter = (() => {
        if (filter === 'ALL') return true;
        if (filter === 'NEEDS_REVIEW') return ['SUBMITTED', 'UNDER_REVIEW', 'APPROVED_FOR_ADJUSTMENT'].includes(record.status) && !record.posted_movement_id;
        if (filter === 'UNDER_REVIEW') return record.status === 'UNDER_REVIEW';
        if (filter === 'POSTED') return record.status === 'POSTED' || Boolean(record.posted_movement_id);
        if (filter === 'REJECTED') return record.status === 'REJECTED';
        return true;
      })();

      if (!matchesFilter) return false;
      if (!q) return true;

      const text = [
        record.sku,
        record.item_name,
        record.reason_category,
        record.reason_notes,
        record.location,
        record.stock_out_class,
        record.incident_reference,
        record.evidence_reference,
      ].filter(Boolean).join(' ').toLowerCase();

      return text.includes(q);
    });
  }, [records, query, filter]);

  const needsReviewCount = records.filter(r => ['SUBMITTED', 'UNDER_REVIEW', 'APPROVED_FOR_ADJUSTMENT'].includes(r.status) && !r.posted_movement_id).length;
  const postedCount = records.filter(r => r.status === 'POSTED' || r.posted_movement_id).length;
  const rejectedCount = records.filter(r => r.status === 'REJECTED').length;
  const totalValue = records.reduce((sum, r) => sum + Number(r.estimated_value || 0), 0);

  return (
    <div className="space-y-4">
      {selectedRecord && (
        <ReviewModal
          record={selectedRecord}
          user={user}
          onClose={() => setSelectedRecord(null)}
          onChanged={() => {
            setSelectedRecord(null);
            setLocalRefreshTick(t => t + 1);
          }}
        />
      )}

      <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
        <div className="border border-border rounded-2xl bg-card px-4 py-3 min-h-[104px]">
          <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-[0.22em] mb-1.5">Needs Review</p>
          <p className="text-2xl font-bold text-amber-700">{needsReviewCount}</p>
          <p className="text-xs text-muted-foreground mt-2">Pending manager decision</p>
        </div>
        <div className="border border-border rounded-2xl bg-card px-4 py-3 min-h-[104px]">
          <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-[0.22em] mb-1.5">Posted</p>
          <p className="text-2xl font-bold text-green-700">{postedCount}</p>
          <p className="text-xs text-muted-foreground mt-2">Adjusted through ledger</p>
        </div>
        <div className="border border-border rounded-2xl bg-card px-4 py-3 min-h-[104px]">
          <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-[0.22em] mb-1.5">Rejected</p>
          <p className="text-2xl font-bold text-red-700">{rejectedCount}</p>
          <p className="text-xs text-muted-foreground mt-2">No stock movement</p>
        </div>
        <div className="border border-border rounded-2xl bg-card px-4 py-3 min-h-[104px]">
          <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-[0.22em] mb-1.5">Review Value</p>
          <p className="text-2xl font-bold text-foreground">₱{totalValue.toFixed(0)}</p>
          <p className="text-xs text-muted-foreground mt-2">Estimated loss value</p>
        </div>
      </div>

      <div className="rounded-2xl border border-border bg-card">
        <div className="px-4 py-3 border-b border-border bg-muted/20">
          <div className="flex items-start justify-between gap-3 flex-wrap">
            <div>
              <p className="text-sm font-medium text-foreground">Loss Events Requiring Review</p>
              <p className="text-xs text-muted-foreground mt-1">Suspected loss and unknown shrinkage remain review-only until approved.</p>
            </div>
            <div className="flex items-center gap-2 flex-wrap">
              {REVIEW_FILTERS.map(item => (
                <FilterButton
                  key={item.key}
                  label={item.label}
                  active={filter === item.key}
                  onClick={() => setFilter(item.key)}
                />
              ))}
            </div>
          </div>
        </div>

        <div className="p-4">
          <div className="relative w-full mb-4">
            <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search by SKU, item, reason, location, or reference..."
              className="pl-9"
            />
          </div>

          {loading ? (
            <div className="text-center py-12">
              <div className="w-6 h-6 border-3 border-muted border-t-foreground rounded-full animate-spin mx-auto"></div>
            </div>
          ) : filteredRecords.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-sm font-medium text-foreground mb-1">No controlled loss events found</p>
              <p className="text-xs text-muted-foreground">Suspected loss and unknown shrinkage submissions will appear here.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {filteredRecords.map(record => (
                <div key={record.id} className="p-4 rounded-xl border border-border bg-background/40 hover:bg-muted/25 transition-colors">
                  <div className="flex items-start justify-between gap-3 mb-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className="font-medium text-foreground text-sm">{record.item_name}</p>
                        <ClassBadge stockOutClass={record.stock_out_class} />
                        <ReviewBadge status={record.status} />
                        {record.review_required && (
                          <span className="text-[11px] px-2 py-0.5 rounded-full bg-amber-50 text-amber-700 border border-amber-200 font-medium">Review Required</span>
                        )}
                      </div>
                      <p className="text-xs text-muted-foreground mt-1.5">{record.sku || 'No SKU'} · {record.location || 'No location'} · {record.reason_category || 'No reason'}</p>
                      {record.incident_reference && <p className="text-xs text-muted-foreground mt-0.5">Incident ref: {record.incident_reference}</p>}
                    </div>
                    <div className="text-right whitespace-nowrap">
                      <p className="font-semibold text-foreground">{record.quantity} units</p>
                      <p className="text-xs text-muted-foreground">₱{Number(record.estimated_value || 0).toFixed(2)}</p>
                    </div>
                  </div>
                  <div className="flex items-center justify-between gap-3 text-xs text-muted-foreground pt-3 border-t border-border">
                    <div className="flex items-center gap-4 flex-wrap">
                      <span>{record.created_date ? new Date(record.created_date).toLocaleDateString() : 'No date'}</span>
                      <span>{record.created_by_email || record.created_by || 'Unknown creator'}</span>
                    </div>
                    <button
                      onClick={() => setSelectedRecord(record)}
                      className="px-3 h-8 rounded-lg bg-primary text-primary-foreground text-xs font-medium hover:opacity-90 inline-flex items-center gap-1"
                    >
                      <CheckCircle2 size={13} /> Review
                    </button>
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
