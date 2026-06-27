import { useEffect, useMemo, useState } from 'react';
import { Download, Search } from 'lucide-react';
import { toast } from 'sonner';
import { Input } from '@/components/ui/input';
import { stockOutRepository } from '@/services/wasteEngine/stockOutRepository.js';
import { STOCK_OUT_CLASS_CONFIG, STOCK_OUT_STATUS_LABELS, getStockOutClassLabel, getStockOutClassShortLabel } from '@/lib/stockOutLossConfig';

const CLASS_ORDER = Object.keys(STOCK_OUT_CLASS_CONFIG);
const POSTED_STATUSES = ['POSTED', 'REVERSED', 'AMENDED'];
const PENDING_STATUSES = ['DRAFT', 'SUBMITTED', 'UNDER_REVIEW', 'APPROVED_FOR_ADJUSTMENT'];

function money(value) {
  return `₱${Number(value || 0).toFixed(0)}`;
}

function reportClass(record) {
  return record?.final_classification || record?.stock_out_class || 'WASTAGE';
}

function isControlledLossClass(key) {
  const label = getStockOutClassLabel(key).toLowerCase();
  return label.includes('loss') || label.includes('shrinkage');
}

function recordUser(record) {
  return record.reviewed_by || record.submitted_by || record.posted_by || record.approved_by || record.created_by_email || record.created_by || 'Unknown';
}

function recordDate(record) {
  return record.created_date || record.created_at || record.updated_at || new Date(0).toISOString();
}

function metrics(items) {
  const gross = items.filter(r => POSTED_STATUSES.includes(r.status));
  const reversed = items.filter(r => r.status === 'REVERSED');
  const pending = items.filter(r => PENDING_STATUSES.includes(r.status));
  const rejected = items.filter(r => r.status === 'REJECTED');
  const sumValue = list => list.reduce((s, r) => s + Number(r.estimated_value || 0), 0);
  const sumQty = list => list.reduce((s, r) => s + Number(r.quantity || 0), 0);
  const grossValue = sumValue(gross);
  const reversedValue = sumValue(reversed);
  const grossQty = sumQty(gross);
  const reversedQty = sumQty(reversed);

  return {
    records: items.length,
    units: sumQty(items),
    grossValue,
    grossQty,
    reversedValue,
    reversedQty,
    netValue: grossValue - reversedValue,
    netQty: grossQty - reversedQty,
    pendingValue: sumValue(pending),
    pendingQty: sumQty(pending),
    rejectedValue: sumValue(rejected),
    rejectedQty: sumQty(rejected),
    totalValue: sumValue(items),
  };
}

function valueBlock(value, units, tone = '') {
  const toneClass = tone === 'red' ? 'text-red-700' : tone === 'green' ? 'text-green-700' : tone === 'amber' ? 'text-amber-700' : 'text-foreground';
  return <div><p className={`font-semibold ${toneClass}`}>{money(value)}</p><p className="text-[11px] text-muted-foreground mt-0.5">{units || 0} units</p></div>;
}

export default function LossReportsTab({ refreshTick }) {
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(false);
  const [query, setQuery] = useState('');
  const [window, setWindow] = useState('ALL');
  const [type, setType] = useState('ALL');
  const [status, setStatus] = useState('ALL');
  const [groupBy, setGroupBy] = useState('type');

  useEffect(() => {
    setLoading(true);
    stockOutRepository.loadAllRecordsForReports('LIVE')
      .then(data => setRecords(data || []))
      .catch(() => setRecords([]))
      .finally(() => setLoading(false));
  }, [refreshTick]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    const now = new Date();
    const cutoff = window === '7D' ? new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000) : window === '30D' ? new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000) : new Date(0);
    return records.filter(record => {
      const klass = reportClass(record);
      const text = [record.sku, record.item_name, record.reason_category, record.reason_code, record.reason_notes, record.notes, record.location, record.location_name, record.department, record.cost_centre, record.incident_reference, record.evidence_reference, record.review_decision, record.review_notes, klass, getStockOutClassLabel(klass)].filter(Boolean).join(' ').toLowerCase();
      return new Date(recordDate(record)) >= cutoff && (type === 'ALL' || klass === type || record.stock_out_class === type) && (status === 'ALL' || record.status === status) && text.includes(q);
    });
  }, [records, query, window, type, status]);

  const total = useMemo(() => metrics(filtered), [filtered]);
  const reviewPending = useMemo(() => metrics(filtered.filter(r => isControlledLossClass(reportClass(r)) && PENDING_STATUSES.includes(r.status))), [filtered]);
  const confirmed = useMemo(() => metrics(filtered.filter(r => getStockOutClassLabel(reportClass(r)).toLowerCase().includes('confirmed'))), [filtered]);
  const unknown = useMemo(() => metrics(filtered.filter(r => getStockOutClassLabel(reportClass(r)).toLowerCase().includes('unknown'))), [filtered]);

  const byClass = useMemo(() => CLASS_ORDER.map(key => ({
    key,
    label: getStockOutClassLabel(key),
    lane: isControlledLossClass(key) ? 'Shrinkage / controlled loss lane' : 'Operational stock-out lane',
    ...metrics(filtered.filter(record => reportClass(record) === key)),
  })), [filtered]);

  const grouped = useMemo(() => {
    const groups = {};
    filtered.forEach(record => {
      const klass = reportClass(record);
      let key = getStockOutClassLabel(klass);
      if (groupBy === 'reason') key = record.reason_category || record.reason_code || 'No reason';
      if (groupBy === 'status') key = STOCK_OUT_STATUS_LABELS[record.status] || record.status || 'Unknown';
      if (groupBy === 'sku') key = record.sku || 'No SKU';
      if (groupBy === 'item') key = record.item_name || 'No item';
      if (groupBy === 'user') key = recordUser(record);
      if (groupBy === 'review') key = record.review_decision || (record.review_required ? 'Review required' : 'No review required');
      if (!groups[key]) groups[key] = [];
      groups[key].push(record);
    });
    return groups;
  }, [filtered, groupBy]);

  const exportCsv = () => {
    try {
      const headers = ['Record ID', 'Type', 'Original Type', 'Final Classification', 'Status', 'Review Required', 'Review Decision', 'SKU', 'Item Name', 'Quantity', 'Total Value', 'Reason', 'User', 'Location', 'Incident Reference', 'Evidence Reference', 'Created Date', 'Reviewed Date', 'Posted Date'];
      const rows = filtered.map(record => [record.id, getStockOutClassLabel(reportClass(record)), record.stock_out_class || '', record.final_classification || '', record.status || '', record.review_required ? 'Yes' : 'No', record.review_decision || '', record.sku || '', record.item_name || '', record.quantity || 0, Number(record.estimated_value || 0).toFixed(2), record.reason_category || record.reason_code || '', recordUser(record), record.location || record.location_name || '', record.incident_reference || '', record.evidence_reference || '', record.created_date ? new Date(record.created_date).toLocaleDateString() : '', record.reviewed_at ? new Date(record.reviewed_at).toLocaleDateString() : '', (record.posted_at || record.approved_at) ? new Date(record.posted_at || record.approved_at).toLocaleDateString() : '']);
      const csv = [headers.join(','), ...rows.map(row => row.map(cell => `"${String(cell).replaceAll('"', '""')}"`).join(','))].join('\n');
      const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      link.href = URL.createObjectURL(blob);
      link.download = `stock-out-loss-report-${new Date().toISOString().split('T')[0]}.csv`;
      link.click();
      toast.success('CSV exported successfully');
    } catch (error) {
      toast.error(`Export failed: ${error.message}`);
    }
  };

  const groupedRows = Object.entries(grouped).map(([key, items]) => ({ key, metrics: metrics(items) })).sort((a, b) => b.metrics.totalValue - a.metrics.totalValue);

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
        <div className="border border-border rounded-2xl bg-card px-4 py-3 min-h-[116px]"><p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-[0.22em] mb-1.5">Posted Gross</p><p className="text-2xl font-bold text-foreground">{money(total.grossValue)}</p><p className="text-xs text-muted-foreground mt-2">Posted value before reversals</p></div>
        <div className="border border-border rounded-2xl bg-card px-4 py-3 min-h-[116px]"><p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-[0.22em] mb-1.5">Net Posted Loss</p><p className="text-2xl font-bold text-green-700">{money(total.netValue)}</p><p className="text-xs text-muted-foreground mt-2">Gross minus reversed</p></div>
        <div className="border border-border rounded-2xl bg-card px-4 py-3 min-h-[116px]"><p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-[0.22em] mb-1.5">Review Pending</p><p className="text-2xl font-bold text-amber-700">{money(reviewPending.pendingValue)}</p><p className="text-xs text-muted-foreground mt-2">Controlled loss awaiting review</p></div>
        <div className="border border-border rounded-2xl bg-card px-4 py-3 min-h-[116px]"><p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-[0.22em] mb-1.5">Confirmed Loss</p><p className="text-2xl font-bold text-purple-700">{money(confirmed.netValue)}</p><p className="text-xs text-muted-foreground mt-2">Reviewed and posted loss</p></div>
        <div className="border border-border rounded-2xl bg-card px-4 py-3 min-h-[116px]"><p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-[0.22em] mb-1.5">Unknown Shrinkage</p><p className="text-2xl font-bold text-slate-700">{money(unknown.pendingValue + unknown.netValue)}</p><p className="text-xs text-muted-foreground mt-2">Pending plus posted shrinkage</p></div>
      </div>

      <div className="border border-border rounded-2xl bg-card overflow-hidden">
        <div className="px-4 py-3 border-b border-border bg-muted/20"><p className="text-sm font-medium text-foreground">Breakdown by Loss Type</p><p className="text-xs text-muted-foreground mt-1">All stock-out and controlled loss classes are reported separately.</p></div>
        <div className="overflow-x-auto"><table className="w-full min-w-[860px] text-sm"><thead className="bg-muted/30 border-b border-border"><tr className="text-left text-[11px] uppercase tracking-[0.18em] text-muted-foreground"><th className="px-4 py-3 font-semibold">Type</th><th className="px-4 py-3 font-semibold">Gross</th><th className="px-4 py-3 font-semibold">Reversed</th><th className="px-4 py-3 font-semibold">Net</th><th className="px-4 py-3 font-semibold">Pending / Review</th><th className="px-4 py-3 font-semibold">Rejected</th><th className="px-4 py-3 font-semibold">Units</th></tr></thead><tbody className="divide-y divide-border">
          {[...byClass, { key: 'COMBINED', label: 'Combined', lane: 'All stock-out and loss types', ...total }].map(row => <tr key={row.key} className={row.key === 'COMBINED' ? 'bg-muted/20' : 'bg-card'}><td className="px-4 py-3 align-top"><p className="font-medium text-foreground">{row.label}</p><p className="text-[11px] text-muted-foreground mt-0.5">{row.lane}</p></td><td className="px-4 py-3 align-top">{valueBlock(row.grossValue, row.grossQty)}</td><td className="px-4 py-3 align-top">{valueBlock(row.reversedValue, row.reversedQty, 'red')}</td><td className="px-4 py-3 align-top">{valueBlock(row.netValue, row.netQty, 'green')}</td><td className="px-4 py-3 align-top">{valueBlock(row.pendingValue, row.pendingQty, 'amber')}</td><td className="px-4 py-3 align-top">{valueBlock(row.rejectedValue, row.rejectedQty)}</td><td className="px-4 py-3 align-top"><p className="font-semibold text-foreground">{row.netQty || 0}</p><p className="text-[11px] text-muted-foreground mt-0.5">net units</p></td></tr>)}
        </tbody></table></div>
      </div>

      <div className="border border-border rounded-2xl bg-card"><div className="px-4 py-3 border-b border-border bg-muted/20"><div className="flex items-center justify-between gap-3 flex-wrap"><div><p className="text-sm font-medium text-foreground">Stock-Out / Loss Analysis</p><p className="text-xs text-muted-foreground mt-1">Grouped and filterable reports including controlled loss and shrinkage</p></div><button onClick={exportCsv} className="px-3 py-1.5 text-xs rounded bg-primary text-primary-foreground hover:opacity-90 flex items-center gap-1 font-medium"><Download size={13} /> Export CSV</button></div></div>
        <div className="p-4 space-y-4"><div className="relative w-full"><Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" /><Input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search by SKU, item, reason, location, incident ref, or evidence ref..." className="pl-9" /></div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-2"><select value={window} onChange={(e) => setWindow(e.target.value)} className="h-9 px-2 rounded border border-input bg-background text-xs"><option value="7D">Last 7 days</option><option value="30D">Last 30 days</option><option value="ALL">All time</option></select><select value={type} onChange={(e) => setType(e.target.value)} className="h-9 px-2 rounded border border-input bg-background text-xs"><option value="ALL">Type: All</option>{CLASS_ORDER.map(key => <option key={key} value={key}>{getStockOutClassShortLabel(key)}</option>)}</select><select value={status} onChange={(e) => setStatus(e.target.value)} className="h-9 px-2 rounded border border-input bg-background text-xs"><option value="ALL">Status: All</option><option value="DRAFT">Draft</option><option value="SUBMITTED">Submitted</option><option value="UNDER_REVIEW">Under Review</option><option value="APPROVED_FOR_ADJUSTMENT">Approved for Adjustment</option><option value="POSTED">Posted</option><option value="REVERSED">Reversed</option><option value="AMENDED">Amended</option><option value="REJECTED">Rejected</option><option value="VOIDED">Voided</option></select><select value={groupBy} onChange={(e) => setGroupBy(e.target.value)} className="h-9 px-2 rounded border border-input bg-background text-xs"><option value="type">Group by Type</option><option value="review">Group by Review Decision</option><option value="reason">Group by Reason</option><option value="status">Group by Status</option><option value="sku">Group by SKU</option><option value="item">Group by Item</option><option value="user">Group by User</option></select></div>
          {loading ? <div className="text-center py-12"><div className="w-6 h-6 border-3 border-muted border-t-foreground rounded-full animate-spin mx-auto"></div></div> : groupedRows.length === 0 ? <div className="text-center py-12"><p className="text-sm font-medium text-foreground mb-1">No stock-out records found</p><p className="text-xs text-muted-foreground">Try adjusting your filters or date range.</p></div> : <div className="overflow-x-auto border border-border rounded-xl"><table className="w-full min-w-[860px] text-sm"><thead className="bg-muted/30 border-b border-border"><tr className="text-left text-[11px] uppercase tracking-[0.18em] text-muted-foreground"><th className="px-4 py-3 font-semibold">Group</th><th className="px-4 py-3 font-semibold text-right">Records</th><th className="px-4 py-3 font-semibold text-right">Units</th><th className="px-4 py-3 font-semibold text-right">Gross</th><th className="px-4 py-3 font-semibold text-right">Reversed</th><th className="px-4 py-3 font-semibold text-right">Net</th><th className="px-4 py-3 font-semibold text-right">Pending / Review</th><th className="px-4 py-3 font-semibold text-right">Rejected</th></tr></thead><tbody className="divide-y divide-border">{groupedRows.map(({ key, metrics: row }) => <tr key={key} className="bg-card hover:bg-muted/20"><td className="px-4 py-3 align-top"><p className="font-medium text-foreground">{key}</p></td><td className="px-4 py-3 align-top text-right font-medium text-foreground">{row.records}</td><td className="px-4 py-3 align-top text-right text-foreground">{row.units}</td><td className="px-4 py-3 align-top text-right font-semibold text-foreground">{money(row.grossValue)}</td><td className="px-4 py-3 align-top text-right font-semibold text-red-700">{money(row.reversedValue)}</td><td className="px-4 py-3 align-top text-right font-semibold text-green-700">{money(row.netValue)}</td><td className="px-4 py-3 align-top text-right font-semibold text-amber-700">{money(row.pendingValue)}</td><td className="px-4 py-3 align-top text-right font-semibold text-muted-foreground">{money(row.rejectedValue)}</td></tr>)}</tbody></table></div>}
        </div>
      </div>
    </div>
  );
}
