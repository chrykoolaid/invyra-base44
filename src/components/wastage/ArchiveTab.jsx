import { useEffect, useMemo, useState } from 'react';
import { base44 } from '@/api/base44Client';
import { Search, Undo2, FileText, Activity, ClipboardList, PencilLine, Download } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';
import RejectReasonModal from './RejectReasonModal';
import { canReverseStockOut } from '@/lib/rolePermissions';

const FINAL_STATUSES = ['POSTED', 'REVERSED', 'AMENDED'];

const statusColors = {
  POSTED: 'bg-green-50 text-green-700 border-green-200',
  AMENDED: 'bg-purple-50 text-purple-700 border-purple-200',
  REVERSED: 'bg-slate-50 text-slate-700 border-slate-200',
};

function formatCurrency(value) {
  return `₱${Number(value || 0).toFixed(0)}`;
}

function formatDate(value) {
  if (!value) return '—';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '—';
  return date.toLocaleDateString();
}

function recordDate(record) {
  return record.reversed_at || record.posted_at || record.updated_date || record.created_date;
}

function SegmentedButton({ active, children, onClick }) {
  return (
    <button
      onClick={onClick}
      className={`h-9 px-3.5 rounded-xl border text-sm font-medium transition-colors ${
        active ? 'border-primary bg-primary/5 text-primary' : 'border-border bg-card text-muted-foreground hover:bg-muted hover:text-foreground'
      }`}
    >
      {children}
    </button>
  );
}

function SimpleModal({ title, subtitle, children, onClose }) {
  return (
    <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4">
      <div className="w-full max-w-2xl bg-card border border-border rounded-2xl shadow-xl overflow-hidden">
        <div className="px-5 py-4 border-b border-border flex items-start justify-between gap-4">
          <div>
            <h2 className="text-base font-semibold text-foreground">{title}</h2>
            {subtitle && <p className="text-sm text-muted-foreground mt-1">{subtitle}</p>}
          </div>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground text-xl leading-none">×</button>
        </div>
        <div className="p-5 max-h-[70vh] overflow-y-auto">{children}</div>
      </div>
    </div>
  );
}

function KeyValue({ label, value }) {
  return (
    <div className="rounded-xl border border-border bg-background/40 px-3 py-2">
      <p className="text-[10px] uppercase tracking-[0.18em] text-muted-foreground font-semibold">{label}</p>
      <p className="text-sm text-foreground mt-1 break-words">{value || '—'}</p>
    </div>
  );
}

export default function ArchiveTab({ refreshTick }) {
  const [user, setUser] = useState(null);
  const [records, setRecords] = useState([]);
  const [query, setQuery] = useState('');
  const [activeClass, setActiveClass] = useState('WASTAGE');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [dateRange, setDateRange] = useState('ALL');
  const [locationFilter, setLocationFilter] = useState('ALL');
  const [costCentreFilter, setCostCentreFilter] = useState('ALL');
  const [userFilter, setUserFilter] = useState('ALL');
  const [loading, setLoading] = useState(false);
  const [localRefreshTick, setLocalRefreshTick] = useState(0);
  const [reverseRecord, setReverseRecord] = useState(null);
  const [detailRecord, setDetailRecord] = useState(null);
  const [relatedView, setRelatedView] = useState(null);
  const [relatedRows, setRelatedRows] = useState([]);
  const [relatedLoading, setRelatedLoading] = useState(false);
  const [amendRecord, setAmendRecord] = useState(null);
  const [amendQty, setAmendQty] = useState('');
  const [amendReason, setAmendReason] = useState('');
  const [amendNotes, setAmendNotes] = useState('');

  useEffect(() => {
    base44.auth.me().then(u => setUser(u)).catch(() => {});
  }, []);

  useEffect(() => {
    setLoading(true);
    Promise.all(
      FINAL_STATUSES.map(status =>
        base44.entities.StockOutRecord.filter({ status, environment: 'LIVE' }, '-created_date', 200)
      )
    ).then(results => {
      const byId = new Map();
      results.flat().filter(Boolean).forEach(record => byId.set(record.id, record));
      setRecords(Array.from(byId.values()));
      setLoading(false);
    }).catch(error => {
      toast.error(`Archive load failed: ${error.message}`);
      setLoading(false);
    });
  }, [refreshTick, localRefreshTick]);

  const role = (user?.role || '').toLowerCase();
  const canManageArchive = ['manager', 'admin', 'owner'].includes(role);

  const classRecords = useMemo(() => (
    records.filter(record => record.stock_out_class === activeClass)
  ), [records, activeClass]);

  const locations = useMemo(() => Array.from(new Set(classRecords.map(r => r.location || r.site_id).filter(Boolean))).sort(), [classRecords]);
  const costCentres = useMemo(() => Array.from(new Set(classRecords.map(r => r.cost_centre || r.cost_center).filter(Boolean))).sort(), [classRecords]);
  const users = useMemo(() => Array.from(new Set(classRecords.map(r => r.posted_by || r.reversed_by || r.created_by_email || r.created_by).filter(Boolean))).sort(), [classRecords]);

  const filteredRecords = useMemo(() => {
    const q = query.trim().toLowerCase();
    const now = Date.now();
    const maxAgeDays = dateRange === '7D' ? 7 : dateRange === '30D' ? 30 : dateRange === '90D' ? 90 : null;

    return classRecords.filter(record => {
      if (statusFilter !== 'ALL' && record.status !== statusFilter) return false;
      if (locationFilter !== 'ALL' && (record.location || record.site_id) !== locationFilter) return false;
      if (costCentreFilter !== 'ALL' && (record.cost_centre || record.cost_center) !== costCentreFilter) return false;
      if (userFilter !== 'ALL' && ![record.posted_by, record.reversed_by, record.created_by_email, record.created_by].includes(userFilter)) return false;

      if (maxAgeDays) {
        const when = new Date(recordDate(record)).getTime();
        if (Number.isNaN(when) || (now - when) > maxAgeDays * 24 * 60 * 60 * 1000) return false;
      }

      if (!q) return true;
      return [
        record.sku,
        record.item_name,
        record.reason_category,
        record.reason_notes,
        record.location,
        record.department,
        record.cost_centre,
        record.cost_center,
        record.posted_by,
        record.reversed_by,
      ].some(value => (value || '').toString().toLowerCase().includes(q));
    });
  }, [classRecords, query, statusFilter, dateRange, locationFilter, costCentreFilter, userFilter]);

  const summary = useMemo(() => {
    const posted = classRecords.filter(r => r.status === 'POSTED').length;
    const reversed = classRecords.filter(r => r.status === 'REVERSED').length;
    const amended = classRecords.filter(r => r.status === 'AMENDED').length;
    const value = classRecords.reduce((sum, record) => sum + Number(record.estimated_value || 0), 0);
    return { posted, reversed, amended, value };
  }, [classRecords]);

  const requireSuccess = (response, fallbackMessage) => {
    const data = response?.data || response || {};
    if (!data.success) throw new Error(data.error || data.message || fallbackMessage);
    return data;
  };

  const handleReverse = async (reason) => {
    if (!reverseRecord) return;
    try {
      const response = await base44.functions.invoke('reverseStockOutRecord', { record_id: reverseRecord.id, reason });
      const data = requireSuccess(response, 'Reversal failed');
      toast.success(`Reversed. Balance: ${data.balance_before} → ${data.balance_after}`);
      setReverseRecord(null);
      setLocalRefreshTick(t => t + 1);
    } catch (error) {
      toast.error(`Reversal failed: ${error.message}`);
    }
  };

  const openRelated = async (record, type) => {
    setRelatedView({ record, type });
    setRelatedRows([]);
    setRelatedLoading(true);
    try {
      if (type === 'movements') {
        const queryResults = await Promise.all([
          record.linked_movement_id ? base44.entities.StockMovement.filter({ id: record.linked_movement_id }) : Promise.resolve([]),
          record.reversal_movement_id ? base44.entities.StockMovement.filter({ id: record.reversal_movement_id }) : Promise.resolve([]),
          base44.entities.StockMovement.filter({ item_id: record.item_id, environment: record.environment || 'LIVE' }, '-created_date', 100),
        ]);
        const byId = new Map();
        queryResults.flat().filter(Boolean).forEach(row => {
          const linked = [record.linked_movement_id, record.reversal_movement_id].includes(row.id)
            || row.source_ref === record.id
            || row.reversal_of === record.linked_movement_id
            || (row.notes || '').includes(record.id);
          if (linked) byId.set(row.id, row);
        });
        setRelatedRows(Array.from(byId.values()));
      } else {
        const queryResults = await Promise.all([
          base44.entities.AuditLog.filter({ linked_source_record: record.id, environment: record.environment || 'LIVE' }, '-created_date', 100),
          base44.entities.AuditLog.filter({ source_record_id: record.id, environment: record.environment || 'LIVE' }, '-created_date', 100),
          base44.entities.AuditLog.filter({ item_id: record.item_id, environment: record.environment || 'LIVE' }, '-created_date', 200),
        ]);
        const byId = new Map();
        queryResults.flat().filter(Boolean).forEach(row => {
          const linked = row.linked_source_record === record.id
            || row.source_record_id === record.id
            || row.linked_movement_id === record.linked_movement_id
            || row.linked_movement_id === record.reversal_movement_id
            || (row.notes || '').includes(record.id);
          if (linked) byId.set(row.id, row);
        });
        setRelatedRows(Array.from(byId.values()));
      }
    } catch (error) {
      toast.error(`Unable to load ${type}: ${error.message}`);
    } finally {
      setRelatedLoading(false);
    }
  };

  const startAmendment = (record) => {
    setAmendRecord(record);
    setAmendQty(String(record.quantity || 0));
    setAmendReason('');
    setAmendNotes('');
  };

  const submitAmendment = async () => {
    if (!amendRecord) return;
    const qty = Number(amendQty);
    if (!qty || qty <= 0) {
      toast.error('Correct quantity must be greater than 0');
      return;
    }
    if (!amendReason.trim()) {
      toast.error('Amendment reason is required');
      return;
    }
    try {
      const afterSnapshot = {
        sku: amendRecord.sku,
        item_id: amendRecord.item_id,
        item_name: amendRecord.item_name,
        quantity: qty,
        reason_category: amendRecord.reason_category,
        stock_out_class: amendRecord.stock_out_class,
        location: amendRecord.location,
        department: amendRecord.department,
        cost_centre: amendRecord.cost_centre,
      };
      const response = await base44.functions.invoke('requestStockOutAmendment', {
        record_id: amendRecord.id,
        amendment_reason: amendReason.trim(),
        amendment_notes: amendNotes.trim(),
        after_snapshot: afterSnapshot,
        environment: amendRecord.environment || 'LIVE',
      });
      requireSuccess(response, 'Amendment request failed');
      toast.success('Amendment request submitted for review');
      setAmendRecord(null);
      setLocalRefreshTick(t => t + 1);
    } catch (error) {
      toast.error(`Amendment request failed: ${error.message}`);
    }
  };

  const exportCsv = async () => {
    const headers = ['Record ID', 'Type', 'Status', 'SKU', 'Item name', 'Quantity', 'Value', 'Reason', 'Location', 'Department', 'Cost centre', 'Posted by', 'Posted date', 'Reversed by', 'Reversed date', 'Reversal reason'];
    const rows = filteredRecords.map(record => [
      record.id,
      record.stock_out_class,
      record.status,
      record.sku,
      record.item_name,
      record.quantity,
      record.estimated_value || 0,
      record.reason_category,
      record.location || record.site_id || '',
      record.department || '',
      record.cost_centre || record.cost_center || '',
      record.posted_by || '',
      record.posted_at || '',
      record.reversed_by || '',
      record.reversed_at || '',
      record.reversal_reason || '',
    ]);
    const escapeCell = value => `"${String(value ?? '').replace(/"/g, '""')}"`;
    const csv = [headers, ...rows].map(row => row.map(escapeCell).join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `stock-out-${activeClass.toLowerCase()}-archive.csv`;
    link.click();
    URL.revokeObjectURL(url);

    try {
      await base44.entities.AuditLog.create({
        change_type: 'EXPORT',
        field_name: 'stock_out_archive_csv',
        old_value: '',
        new_value: `${filteredRecords.length} rows`,
        changed_by: user?.email || user?.id || 'unknown',
        actor_role: user?.role || 'unknown',
        source_module: 'StockOutArchive',
        action_type: 'STOCK_OUT_ARCHIVE_EXPORTED',
        notes: `${activeClass} archive exported. Status filter: ${statusFilter}. Date range: ${dateRange}.`,
        environment: 'LIVE',
      });
    } catch {
      // Export should not fail if audit logging is unavailable in preview mode.
    }
  };

  return (
    <div className="space-y-4">
      {reverseRecord && (
        <RejectReasonModal
          title="Reverse Archived Stock-Out"
          onConfirm={handleReverse}
          onCancel={() => setReverseRecord(null)}
        />
      )}

      {detailRecord && (
        <SimpleModal
          title="Archived Stock-Out Details"
          subtitle="Read-only posted/reversed stock-out record."
          onClose={() => setDetailRecord(null)}
        >
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <KeyValue label="Item" value={detailRecord.item_name} />
            <KeyValue label="SKU" value={detailRecord.sku} />
            <KeyValue label="Type" value={detailRecord.stock_out_class} />
            <KeyValue label="Status" value={detailRecord.status} />
            <KeyValue label="Quantity" value={`${detailRecord.quantity || 0} units`} />
            <KeyValue label="Value" value={formatCurrency(detailRecord.estimated_value)} />
            <KeyValue label="Reason" value={detailRecord.reason_category} />
            <KeyValue label="Location" value={detailRecord.location || detailRecord.site_id} />
            <KeyValue label="Posted by" value={detailRecord.posted_by} />
            <KeyValue label="Posted date" value={formatDate(detailRecord.posted_at)} />
            <KeyValue label="Reversed by" value={detailRecord.reversed_by} />
            <KeyValue label="Reversed date" value={formatDate(detailRecord.reversed_at)} />
          </div>
          {detailRecord.reversal_reason && (
            <div className="mt-3 rounded-xl border border-border bg-muted/30 px-3 py-2">
              <p className="text-[10px] uppercase tracking-[0.18em] text-muted-foreground font-semibold">Reversal reason</p>
              <p className="text-sm text-foreground mt-1">{detailRecord.reversal_reason}</p>
            </div>
          )}
        </SimpleModal>
      )}

      {relatedView && (
        <SimpleModal
          title={relatedView.type === 'movements' ? 'Stock Movement Trace' : 'Audit Trail'}
          subtitle={`${relatedView.record.item_name} · ${relatedView.record.sku}`}
          onClose={() => setRelatedView(null)}
        >
          {relatedLoading ? (
            <div className="text-center py-10 text-sm text-muted-foreground">Loading...</div>
          ) : relatedRows.length === 0 ? (
            <div className="text-center py-10 text-sm text-muted-foreground">No linked records found.</div>
          ) : (
            <div className="space-y-2">
              {relatedRows.map(row => (
                <div key={row.id} className="rounded-xl border border-border bg-background/40 p-3">
                  {relatedView.type === 'movements' ? (
                    <>
                      <div className="flex items-center justify-between gap-3">
                        <p className="text-sm font-medium text-foreground">{row.movement_type} · {row.direction}</p>
                        <span className="text-xs text-muted-foreground">{formatDate(row.created_date)}</span>
                      </div>
                      <p className="text-xs text-muted-foreground mt-1">Qty {row.qty} · Balance {row.balance_before} → {row.balance_after}</p>
                      {row.notes && <p className="text-xs text-muted-foreground mt-1">{row.notes}</p>}
                    </>
                  ) : (
                    <>
                      <div className="flex items-center justify-between gap-3">
                        <p className="text-sm font-medium text-foreground">{row.action_type || row.field_name || 'Audit event'}</p>
                        <span className="text-xs text-muted-foreground">{formatDate(row.created_date)}</span>
                      </div>
                      <p className="text-xs text-muted-foreground mt-1">{row.old_value || '—'} → {row.new_value || '—'}</p>
                      {row.notes && <p className="text-xs text-muted-foreground mt-1">{row.notes}</p>}
                    </>
                  )}
                </div>
              ))}
            </div>
          )}
        </SimpleModal>
      )}

      {amendRecord && (
        <SimpleModal
          title="Request Amendment"
          subtitle="Create a controlled correction request. No stock movement posts until approval."
          onClose={() => setAmendRecord(null)}
        >
          <div className="space-y-4">
            <div className="rounded-xl border border-border bg-muted/20 p-3">
              <p className="text-sm font-medium text-foreground">{amendRecord.item_name}</p>
              <p className="text-xs text-muted-foreground mt-1">{amendRecord.sku} · Current quantity: {amendRecord.quantity} · {formatCurrency(amendRecord.estimated_value)}</p>
            </div>
            <div>
              <label className="text-xs font-medium text-muted-foreground">Correct quantity</label>
              <Input type="number" min="1" value={amendQty} onChange={(e) => setAmendQty(e.target.value)} className="mt-1" />
              {Number(amendQty) !== Number(amendRecord.quantity || 0) && (
                <p className="text-xs text-muted-foreground mt-1">Quantity: {amendRecord.quantity || 0} → {amendQty || 0}</p>
              )}
            </div>
            <div>
              <label className="text-xs font-medium text-muted-foreground">Amendment reason</label>
              <Input value={amendReason} onChange={(e) => setAmendReason(e.target.value)} placeholder="Example: Wrong posted quantity" className="mt-1" />
            </div>
            <div>
              <label className="text-xs font-medium text-muted-foreground">Notes</label>
              <textarea
                value={amendNotes}
                onChange={(e) => setAmendNotes(e.target.value)}
                placeholder="Optional supporting details..."
                className="mt-1 w-full min-h-[88px] rounded-xl border border-border bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary/20"
              />
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <button onClick={() => setAmendRecord(null)} className="h-9 px-4 text-sm rounded-xl border border-border bg-card text-foreground hover:bg-muted">Cancel</button>
              <button onClick={submitAmendment} className="h-9 px-4 text-sm rounded-xl bg-primary text-primary-foreground hover:opacity-90">Submit Request</button>
            </div>
          </div>
        </SimpleModal>
      )}

      <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
        <div className="border border-border rounded-2xl bg-card px-4 py-3 min-h-[104px]">
          <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-[0.22em] mb-1.5">Posted</p>
          <p className="text-2xl font-bold text-green-700">{summary.posted}</p>
          <p className="text-xs text-muted-foreground mt-2">Finalized records</p>
        </div>
        <div className="border border-border rounded-2xl bg-card px-4 py-3 min-h-[104px]">
          <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-[0.22em] mb-1.5">Reversed</p>
          <p className="text-2xl font-bold text-slate-700">{summary.reversed}</p>
          <p className="text-xs text-muted-foreground mt-2">Restored records</p>
        </div>
        <div className="border border-border rounded-2xl bg-card px-4 py-3 min-h-[104px]">
          <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-[0.22em] mb-1.5">Amended</p>
          <p className="text-2xl font-bold text-purple-700">{summary.amended}</p>
          <p className="text-xs text-muted-foreground mt-2">Corrected records</p>
        </div>
        <div className="border border-border rounded-2xl bg-card px-4 py-3 min-h-[104px]">
          <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-[0.22em] mb-1.5">Archive Value</p>
          <p className="text-2xl font-bold text-foreground">{formatCurrency(summary.value)}</p>
          <p className="text-xs text-muted-foreground mt-2">Historical value</p>
        </div>
      </div>

      <div className="border border-border rounded-2xl bg-card overflow-hidden">
        <div className="px-4 py-3 border-b border-border bg-muted/20">
          <div className="flex flex-col lg:flex-row lg:items-center gap-3">
            <div className="flex-1">
              <p className="text-sm font-medium text-foreground">Stock-Out Archive</p>
              <p className="text-xs text-muted-foreground mt-1">Posted, reversed, and amended records kept separate from active workflow.</p>
            </div>
            <button
              onClick={exportCsv}
              className="inline-flex items-center gap-1.5 h-9 px-3 text-sm rounded-xl bg-primary text-primary-foreground hover:opacity-90 font-medium"
            >
              <Download size={14} /> Export CSV
            </button>
          </div>
        </div>

        <div className="p-4 space-y-4">
          <div className="flex flex-wrap gap-2">
            <SegmentedButton active={activeClass === 'WASTAGE'} onClick={() => setActiveClass('WASTAGE')}>Wastage Archive</SegmentedButton>
            <SegmentedButton active={activeClass === 'STORE_USE'} onClick={() => setActiveClass('STORE_USE')}>Store Use Archive</SegmentedButton>
          </div>

          <div className="relative w-full">
            <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search by SKU, item, reason, user, or location..."
              className="pl-9"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-2">
            <select value={dateRange} onChange={(e) => setDateRange(e.target.value)} className="h-10 px-3 rounded-xl border border-border bg-background text-sm">
              <option value="ALL">All time</option>
              <option value="7D">Last 7 days</option>
              <option value="30D">Last 30 days</option>
              <option value="90D">Last 90 days</option>
            </select>
            <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="h-10 px-3 rounded-xl border border-border bg-background text-sm">
              <option value="ALL">Status: All</option>
              <option value="POSTED">Posted</option>
              <option value="REVERSED">Reversed</option>
              <option value="AMENDED">Amended</option>
            </select>
            <select value={locationFilter} onChange={(e) => setLocationFilter(e.target.value)} className="h-10 px-3 rounded-xl border border-border bg-background text-sm">
              <option value="ALL">Location: All</option>
              {locations.map(value => <option key={value} value={value}>{value}</option>)}
            </select>
            <select value={costCentreFilter} onChange={(e) => setCostCentreFilter(e.target.value)} className="h-10 px-3 rounded-xl border border-border bg-background text-sm">
              <option value="ALL">Cost Centre: All</option>
              {costCentres.map(value => <option key={value} value={value}>{value}</option>)}
            </select>
            <select value={userFilter} onChange={(e) => setUserFilter(e.target.value)} className="h-10 px-3 rounded-xl border border-border bg-background text-sm">
              <option value="ALL">User: All</option>
              {users.map(value => <option key={value} value={value}>{value}</option>)}
            </select>
          </div>

          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <span>{filteredRecords.length} archived records visible</span>
            <span>{activeClass === 'WASTAGE' ? 'Wastage' : 'Store Use'} remains separated in this view</span>
          </div>

          {loading ? (
            <div className="text-center py-12">
              <div className="w-6 h-6 border-3 border-muted border-t-foreground rounded-full animate-spin mx-auto"></div>
            </div>
          ) : filteredRecords.length === 0 ? (
            <div className="text-center py-12 border border-dashed border-border rounded-2xl">
              <p className="text-sm font-medium text-foreground mb-1">No archived records found</p>
              <p className="text-xs text-muted-foreground">Posted and reversed records will appear here after approval or reversal.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {filteredRecords.map(record => (
                <div key={record.id} className="p-4 rounded-xl border border-border bg-background/40 hover:bg-muted/25 transition-colors">
                  <div className="flex items-start justify-between gap-3 mb-2">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className="font-medium text-foreground text-sm">{record.item_name}</p>
                        <span className={`text-[11px] px-2 py-0.5 rounded-full border font-medium ${activeClass === 'WASTAGE' ? 'bg-red-50 text-red-700 border-red-200' : 'bg-blue-50 text-blue-700 border-blue-200'}`}>
                          {activeClass === 'WASTAGE' ? 'WASTAGE' : 'STORE USE'}
                        </span>
                        <span className={`text-[11px] px-2 py-0.5 rounded-full border font-medium ${statusColors[record.status] || 'bg-slate-50 text-slate-700 border-slate-200'}`}>
                          {record.status}
                        </span>
                      </div>
                      <p className="text-xs text-muted-foreground mt-1.5">{record.sku} · {record.location || record.site_id || 'No location'} · {record.reason_category}</p>
                      {record.reversal_reason && <p className="text-xs text-muted-foreground mt-1">Reversal: {record.reversal_reason}</p>}
                    </div>
                    <div className="text-right whitespace-nowrap">
                      <p className="font-semibold text-foreground">{record.quantity} units</p>
                      <p className="text-xs text-muted-foreground">{formatCurrency(record.estimated_value)}</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-2 text-xs text-muted-foreground mt-3 pt-3 border-t border-border">
                    <div>
                      <p className="font-medium text-foreground">Posted</p>
                      <p>{record.posted_by || '—'} · {formatDate(record.posted_at)}</p>
                    </div>
                    <div>
                      <p className="font-medium text-foreground">Reversed</p>
                      <p>{record.reversed_by || '—'} · {formatDate(record.reversed_at)}</p>
                    </div>
                    <div className="flex flex-wrap gap-2 justify-start md:justify-end items-start">
                      <button onClick={() => setDetailRecord(record)} className="px-2 py-1 text-[11px] rounded border border-border bg-background text-foreground hover:bg-muted flex items-center gap-1">
                        <FileText size={12} /> Details
                      </button>
                      <button onClick={() => openRelated(record, 'movements')} className="px-2 py-1 text-[11px] rounded border border-border bg-background text-foreground hover:bg-muted flex items-center gap-1">
                        <Activity size={12} /> Movements
                      </button>
                      <button onClick={() => openRelated(record, 'audit')} className="px-2 py-1 text-[11px] rounded border border-border bg-background text-foreground hover:bg-muted flex items-center gap-1">
                        <ClipboardList size={12} /> Audit
                      </button>
                      {canManageArchive && ['POSTED', 'AMENDED'].includes(record.status) && (
                        <button onClick={() => startAmendment(record)} className="px-2 py-1 text-[11px] rounded border border-purple-200 bg-purple-50 text-purple-700 hover:bg-purple-100 flex items-center gap-1">
                          <PencilLine size={12} /> Request Amendment
                        </button>
                      )}
                      {canReverseStockOut(user?.role) && record.status === 'POSTED' && (
                        <button onClick={() => setReverseRecord(record)} className="px-2 py-1 text-[11px] rounded bg-slate-600 text-white hover:opacity-90 flex items-center gap-1">
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
