import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
import {
  AlertTriangle,
  ArrowLeft,
  BarChart3,
  CheckCircle,
  Download,
  FileText,
  Package,
  Printer,
  RefreshCw,
  Search,
  TrendingDown,
} from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

const REPORT_PRESETS = [
  { key: 'today', label: 'Today' },
  { key: 'last7', label: 'Last 7 Days' },
  { key: 'thisWeek', label: 'This Week' },
  { key: 'thisMonth', label: 'This Month' },
  { key: 'custom', label: 'Custom Range' },
];

const GROUP_OPTIONS = [
  { key: 'daily', label: 'Daily' },
  { key: 'weekly', label: 'Weekly' },
  { key: 'monthly', label: 'Monthly' },
];

const CLOSURE_REASON_OPTIONS = [
  'Public holiday',
  'Christmas / seasonal closure',
  'Planned store closure',
  'Emergency closure',
  'Stocktake closure',
  'Renovation / maintenance',
  'Trading hours change',
  'System / POS outage',
  'Weather / safety closure',
  'Other',
];


function pad(value) {
  return String(value).padStart(2, '0');
}

function toDateInput(value) {
  const date = value ? new Date(value) : new Date();
  if (Number.isNaN(date.getTime())) return '';
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}

function addDays(date, days) {
  const next = new Date(date);
  next.setDate(next.getDate() + days);
  return next;
}

function startOfWeek(date) {
  const next = new Date(date);
  const day = next.getDay();
  const diff = day === 0 ? -6 : 1 - day;
  next.setDate(next.getDate() + diff);
  return next;
}

function presetRange(preset) {
  const today = new Date();
  const todayKey = toDateInput(today);
  if (preset === 'last7') return { start: toDateInput(addDays(today, -6)), end: todayKey };
  if (preset === 'thisWeek') return { start: toDateInput(startOfWeek(today)), end: todayKey };
  if (preset === 'thisMonth') return { start: `${today.getFullYear()}-${pad(today.getMonth() + 1)}-01`, end: todayKey };
  return { start: todayKey, end: todayKey };
}

function parseDate(value) {
  if (!value) return null;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
}

function isWithinRange(value, start, end) {
  const date = parseDate(value);
  if (!date) return false;
  const startDate = new Date(`${start}T00:00:00`);
  const endDate = new Date(`${end}T23:59:59`);
  return date >= startDate && date <= endDate;
}

function formatDate(value) {
  const date = parseDate(value);
  if (!date) return '—';
  return date.toLocaleDateString('en-PH', { year: 'numeric', month: 'short', day: 'numeric' });
}

function formatDateTime(value) {
  const date = parseDate(value);
  if (!date) return '—';
  return date.toLocaleString('en-PH', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
}

function formatMoney(value) {
  if (value === null || value === undefined || value === '' || Number.isNaN(Number(value))) return '—';
  return `₱${Number(value).toFixed(2)}`;
}

function formatQty(value) {
  return Number(value || 0).toLocaleString('en-PH');
}

function parsePayload(value) {
  if (!value) return {};
  if (typeof value === 'string') {
    try { return JSON.parse(value); } catch { return {}; }
  }
  return typeof value === 'object' ? value : {};
}

function unwrapPayload(row) {
  const payload = parsePayload(row?.payload);
  return payload.markdown_request || payload.markdownRequest || payload.request || payload.data || payload;
}

function pickField(source, names, fallback = null) {
  for (const name of names) {
    const value = source?.[name];
    if (value !== undefined && value !== null && value !== '') return value;
  }
  return fallback;
}

function numberField(value, fallback = 0) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
}

function getRecordDate(row, fallbackFields = []) {
  for (const field of fallbackFields) {
    if (row?.[field]) return row[field];
  }
  const payload = unwrapPayload(row);
  return pickField(payload, ['captured_at', 'submitted_at', 'created_at', 'event_at'], row?.created_date || row?.updated_date || null);
}

function getBatchExpiry(batch, round) {
  const metadata = batch?.settings_snapshot?.request_metadata || {};
  return batch?.overlay_expiry_date || round?.expiry_date || metadata.initial_expiry_date || metadata.expiry_date || null;
}

function getPlannedTakeoffDate(batch, round) {
  const metadata = batch?.settings_snapshot?.request_metadata || {};
  return batch?.planned_takeoff_date || metadata.planned_takeoff_date || getBatchExpiry(batch, round);
}

function getBatchDiscount(batch, round) {
  const metadata = batch?.settings_snapshot?.request_metadata || {};
  return batch?.overlay_discount_percent ?? round?.discount_percent ?? metadata.markdown_discount_percent ?? null;
}

function getBatchOverlayPrice(batch, round) {
  const metadata = batch?.settings_snapshot?.request_metadata || {};
  return batch?.overlay_markdown_unit_price ?? round?.markdown_unit_price ?? metadata.calculated_markdown_price ?? null;
}

function getBatchOriginalPrice(batch, round) {
  const metadata = batch?.settings_snapshot?.request_metadata || {};
  return batch?.overlay_original_unit_price ?? round?.original_unit_price ?? metadata.initial_original_price ?? null;
}

function getSyncModel(row) {
  const payload = unwrapPayload(row);
  const qty = pickField(payload, ['counted_markdown_qty', 'allocated_qty', 'quantity_to_allocate', 'qty', 'quantity'], 0);
  const discount = pickField(payload, ['markdown_discount_percent', 'calculated_discount_percent', 'discount_percent'], null);
  const approvalStatus = pickField(payload, ['approval_status', 'status'], 'Pending_Approval');
  return {
    itemName: pickField(payload, ['item_name_snapshot', 'item_name', 'name', 'product_name'], 'Unknown item'),
    sku: pickField(payload, ['sku', 'item_sku'], 'No SKU'),
    barcode: pickField(payload, ['barcode', 'item_barcode'], ''),
    qty: numberField(qty),
    expiryDate: pickField(payload, ['expiry_date', 'sell_by_date', 'initial_expiry_date'], null),
    originalPrice: pickField(payload, ['original_shelf_price', 'original_unit_price', 'current_price', 'shelf_price'], null),
    overlayPrice: pickField(payload, ['calculated_markdown_price', 'proposed_markdown_price', 'markdown_unit_price', 'label_price'], null),
    discount: discount === null ? null : numberField(discount, null),
    syncStatus: row?.sync_status || pickField(payload, ['sync_status'], 'Queued'),
    approvalStatus,
    deviceId: row?.device_id || pickField(payload, ['device_id'], 'Unknown device'),
    operatorId: row?.submitted_by || pickField(payload, ['operator_id', 'captured_by'], '—'),
    capturedAt: getRecordDate(row),
    thresholdExceeded: Boolean(pickField(payload, ['threshold_exceeded', 'exception_requires_manager'], false)) || numberField(qty) > 20,
  };
}

function getPeriodKey(value, groupBy) {
  const date = parseDate(value);
  if (!date) return 'Unknown';
  if (groupBy === 'monthly') return `${date.getFullYear()}-${pad(date.getMonth() + 1)}`;
  if (groupBy === 'weekly') {
    const start = startOfWeek(date);
    return `Week of ${formatDate(toDateInput(start))}`;
  }
  return toDateInput(date);
}

async function safeFilter(entityName, query, sort, limit) {
  try {
    const entity = base44.entities?.[entityName];
    if (!entity?.filter) return [];
    const data = await entity.filter(query, sort, limit);
    return data || [];
  } catch (error) {
    console.warn(`Markdown report could not load ${entityName}:`, error);
    return [];
  }
}

function CsvButton({ rows }) {
  const exportCsv = () => {
    const headers = ['Batch Ref', 'Item', 'SKU', 'Status', 'Expiry/Sell-by', 'Planned Take-off', 'Discount %', 'Overlay Price', 'Allocated', 'Sold', 'Remaining', 'Take-off Status'];
    const body = rows.map((row) => [
      row.ref,
      row.itemName,
      row.sku,
      row.status,
      row.expiryDate || '',
      row.plannedTakeoffDate || '',
      row.discount ?? '',
      row.overlayPrice ?? '',
      row.allocated,
      row.sold,
      row.remaining,
      row.takeoffStatus,
    ]);
    const csv = [headers, ...body]
      .map((line) => line.map((value) => `"${String(value ?? '').replace(/"/g, '""')}"`).join(','))
      .join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `markdown-report-${toDateInput(new Date())}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  return (
    <button onClick={exportCsv} className="flex items-center gap-1.5 h-8 px-3 text-sm border border-border rounded bg-card hover:bg-muted text-foreground">
      <Download size={13} /> Export CSV
    </button>
  );
}

export default function MarkdownReports() {
  const initialRange = presetRange('today');
  const [batches, setBatches] = useState([]);
  const [rounds, setRounds] = useState([]);
  const [dispositions, setDispositions] = useState([]);
  const [events, setEvents] = useState([]);
  const [syncRows, setSyncRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [preset, setPreset] = useState('today');
  const [groupBy, setGroupBy] = useState('daily');
  const [startDate, setStartDate] = useState(initialRange.start);
  const [endDate, setEndDate] = useState(initialRange.end);
  const [searchTerm, setSearchTerm] = useState('');
  const [takeoffDate, setTakeoffDate] = useState(toDateInput(addDays(new Date(), 1)));
  const [closureDate, setClosureDate] = useState(toDateInput(addDays(new Date(), 1)));
  const [nextTradingDay, setNextTradingDay] = useState(toDateInput(addDays(new Date(), 2)));
  const [closureReason, setClosureReason] = useState('Public holiday');
  const [closureNote, setClosureNote] = useState('');
  const [includeClosurePlanning, setIncludeClosurePlanning] = useState(true);
  const [printMode, setPrintMode] = useState('takeoff');

  const load = async () => {
    setLoading(true);
    const [batchData, roundData, dispData, eventData, syncData] = await Promise.all([
      safeFilter('MarkdownBatch', { environment: 'LIVE' }, '-created_date', 1000),
      safeFilter('MarkdownRound', { environment: 'LIVE' }, '-created_date', 1000),
      safeFilter('MarkdownDisposition', { environment: 'LIVE', disposition_status: 'Confirmed' }, '-created_date', 1000),
      safeFilter('MarkdownEventLog', { environment: 'LIVE' }, '-created_at', 1000),
      safeFilter('MarkdownSyncQueue', { environment: 'LIVE' }, '-created_date', 1000),
    ]);
    setBatches(batchData);
    setRounds(roundData);
    setDispositions(dispData);
    setEvents(eventData);
    setSyncRows(syncData);
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  useEffect(() => {
    if (preset === 'custom') return;
    const range = presetRange(preset);
    setStartDate(range.start);
    setEndDate(range.end);
  }, [preset]);

  const roundByBatchId = useMemo(() => {
    const map = new Map();
    rounds.forEach((round) => {
      const existing = map.get(round.batch_id);
      if (!existing || Number(round.round_number || 0) > Number(existing.round_number || 0)) map.set(round.batch_id, round);
    });
    return map;
  }, [rounds]);

  const filteredBatches = useMemo(() => batches.filter((batch) => {
    const recordDate = getRecordDate(batch, ['approved_at', 'created_date', 'updated_date']);
    return isWithinRange(recordDate, startDate, endDate);
  }), [batches, startDate, endDate]);

  const filteredEvents = useMemo(() => events.filter((event) => isWithinRange(event.created_at || event.created_date, startDate, endDate)), [events, startDate, endDate]);

  const filteredDispositions = useMemo(() => dispositions.filter((disposition) => isWithinRange(disposition.confirmed_at || disposition.created_date, startDate, endDate)), [dispositions, startDate, endDate]);

  const filteredSyncRows = useMemo(() => syncRows.filter((row) => isWithinRange(getRecordDate(row), startDate, endDate)), [syncRows, startDate, endDate]);

  const batchRows = useMemo(() => filteredBatches.map((batch) => {
    const round = roundByBatchId.get(batch.id);
    const allocated = numberField(batch.allocated_qty || batch.total_original_qty);
    const sold = numberField(batch.sold_qty);
    const remaining = numberField(batch.current_remaining_qty, Math.max(allocated - sold, 0));
    const disposed = numberField(batch.disposed_qty);
    const recovered = numberField(batch.recovered_qty);
    const sellThrough = allocated > 0 ? (sold / allocated) * 100 : numberField(batch.sell_through_pct);
    const expiryDate = getBatchExpiry(batch, round);
    const plannedTakeoffDate = getPlannedTakeoffDate(batch, round);
    const discount = getBatchDiscount(batch, round);
    const overlayPrice = getBatchOverlayPrice(batch, round);
    const originalPrice = getBatchOriginalPrice(batch, round);
    const takeoffStatus = batch.takeoff_status || (remaining <= 0 ? 'Sold_Out' : batch.status === 'Expired' ? 'Auto_Closed' : 'Pending_Check');
    return {
      id: batch.id,
      ref: batch.batch_ref || batch.id?.slice(-8) || '—',
      itemName: batch.item_name || 'Unnamed item',
      sku: batch.sku || 'No SKU',
      status: batch.status || 'Unknown',
      allocated,
      sold,
      remaining,
      disposed,
      recovered,
      sellThrough,
      expiryDate,
      plannedTakeoffDate,
      discount,
      overlayPrice,
      originalPrice,
      takeoffStatus,
      overlayClosedAt: batch.overlay_closed_at,
      autoCloseReason: batch.overlay_auto_close_reason,
      holidayFlag: Boolean(batch.holiday_flag || batch.settings_snapshot?.request_metadata?.holiday_flag),
      closureReason: batch.closure_reason || batch.settings_snapshot?.request_metadata?.closure_reason || '',
    };
  }).filter((row) => {
    const term = searchTerm.trim().toLowerCase();
    if (!term) return true;
    return [row.ref, row.itemName, row.sku, row.status, row.expiryDate, row.plannedTakeoffDate]
      .some((value) => String(value || '').toLowerCase().includes(term));
  }), [filteredBatches, roundByBatchId, searchTerm]);

  const syncModels = useMemo(() => filteredSyncRows.map(getSyncModel), [filteredSyncRows]);

  const takeoffRows = useMemo(() => batchRows.filter((row) => {
    if (row.remaining <= 0 && !row.overlayClosedAt) return false;
    const planned = row.plannedTakeoffDate || row.expiryDate;
    const dueByTakeoffDate = planned ? planned <= takeoffDate : false;
    const expiryDue = row.expiryDate ? row.expiryDate <= takeoffDate : false;
    const closureWindowDue = includeClosurePlanning && row.expiryDate && row.expiryDate >= closureDate && row.expiryDate <= nextTradingDay;
    return dueByTakeoffDate || expiryDue || closureWindowDue;
  }), [batchRows, takeoffDate, closureDate, nextTradingDay, includeClosurePlanning]);

  const totalBatches = batchRows.length;
  const activeBatches = batchRows.filter((b) => b.status === 'Active').length;
  const totalAllocated = batchRows.reduce((s, b) => s + b.allocated, 0);
  const totalSold = batchRows.reduce((s, b) => s + b.sold, 0);
  const totalRemaining = batchRows.reduce((s, b) => s + b.remaining, 0);
  const totalDisposed = batchRows.reduce((s, b) => s + b.disposed, 0);
  const avgSellThrough = totalBatches > 0 ? batchRows.reduce((s, b) => s + b.sellThrough, 0) / totalBatches : 0;
  const scannerRequests = syncModels.length;
  const exceptionRequests = syncModels.filter((r) => r.thresholdExceeded).length + batchRows.filter((b) => b.allocated > 20).length;
  const approvedOverlays = batchRows.filter((b) => ['Active', 'Completed', 'Disposition_Complete'].includes(b.status)).length;
  const rejectedOrManual = syncModels.filter((r) => ['Rejected', 'Manually_Handled', 'Manual_Handled'].includes(String(r.approvalStatus))).length;
  const autoClosed = batchRows.filter((b) => b.overlayClosedAt || ['Expired', 'Completed'].includes(b.status)).length;
  const totalValueImpact = batchRows.reduce((sum, batch) => {
    if (!batch.originalPrice || !batch.overlayPrice) return sum;
    return sum + Math.max(0, Number(batch.originalPrice) - Number(batch.overlayPrice)) * batch.sold;
  }, 0) + filteredDispositions.reduce((sum, disposition) => sum + numberField(disposition.cost_impact_value), 0);

  const periodData = useMemo(() => {
    const periods = new Map();
    const ensure = (key) => {
      if (!periods.has(key)) periods.set(key, { period: key, requests: 0, batches: 0, sold: 0, remaining: 0 });
      return periods.get(key);
    };
    filteredSyncRows.forEach((row) => { ensure(getPeriodKey(getRecordDate(row), groupBy)).requests += 1; });
    batchRows.forEach((batch) => {
      const sourceBatch = filteredBatches.find((b) => b.id === batch.id);
      const bucket = ensure(getPeriodKey(getRecordDate(sourceBatch, ['approved_at', 'created_date', 'updated_date']), groupBy));
      bucket.batches += 1;
      bucket.sold += batch.sold;
      bucket.remaining += batch.remaining;
    });
    return Array.from(periods.values()).sort((a, b) => String(a.period).localeCompare(String(b.period)));
  }, [filteredSyncRows, batchRows, filteredBatches, groupBy]);

  const sellThroughBins = [
    { label: '0–25%', count: batchRows.filter((b) => b.sellThrough < 25).length },
    { label: '25–50%', count: batchRows.filter((b) => b.sellThrough >= 25 && b.sellThrough < 50).length },
    { label: '50–75%', count: batchRows.filter((b) => b.sellThrough >= 50 && b.sellThrough < 75).length },
    { label: '75–100%', count: batchRows.filter((b) => b.sellThrough >= 75).length },
  ];

  const eventBreakdown = useMemo(() => {
    const counts = {};
    filteredEvents.forEach((event) => { counts[event.event_type || 'Unknown'] = (counts[event.event_type || 'Unknown'] || 0) + 1; });
    return Object.entries(counts).map(([type, count]) => ({ type: type.replace(/_/g, ' '), count }));
  }, [filteredEvents]);

  const closureReasonDisplay = closureReason === 'Other' && closureNote.trim()
    ? `Other — ${closureNote.trim()}`
    : closureReason;

  const handlePrint = (mode) => {
    setPrintMode(mode);
    window.setTimeout(() => window.print(), 75);
  };

  const kpis = [
    { label: 'Markdown Requests', value: formatQty(scannerRequests + totalBatches), icon: FileText },
    { label: 'Exception Requests', value: formatQty(exceptionRequests), icon: AlertTriangle },
    { label: 'Approved Overlays', value: formatQty(approvedOverlays), icon: CheckCircle },
    { label: 'Active Batches', value: formatQty(activeBatches), icon: Package },
    { label: 'Units Sold', value: formatQty(totalSold), icon: TrendingDown },
    { label: 'Remaining Units', value: formatQty(totalRemaining), icon: Package },
    { label: 'Auto-Closed', value: formatQty(autoClosed), icon: RefreshCw },
    { label: 'Value Impact', value: formatMoney(totalValueImpact), icon: BarChart3 },
  ];

  return (
    <div className="p-6">
      <style>{`
        @media screen { .print-only { display: none !important; } }
        @media print {
          .screen-only { display: none !important; }
          .print-only { display: block !important; }
          body { background: white !important; }
          table { border-collapse: collapse; width: 100%; }
          th, td { border: 1px solid #d1d5db; padding: 6px; font-size: 11px; text-align: left; }
          th { background: #f3f4f6; }
        }
      `}</style>

      <div className="screen-only">
        <div className="flex items-center justify-between mb-5 gap-4">
          <div>
            <h1 className="text-xl font-semibold text-foreground">Markdown Reports</h1>
            <p className="text-sm text-muted-foreground mt-0.5">Date-filtered markdown performance, ScanOps intake, overlays, and take-off planning</p>
          </div>
          <div className="flex gap-2 flex-wrap justify-end">
            <Link to="/Markdown" className="flex items-center gap-1.5 h-8 px-3 text-sm border border-border rounded bg-card hover:bg-muted text-foreground">
              <ArrowLeft size={13} /> Back to Markdown
            </Link>
            <button onClick={load} className="flex items-center gap-1.5 h-8 px-3 text-sm border border-border rounded bg-card hover:bg-muted text-foreground">
              <RefreshCw size={13} className={loading ? 'animate-spin' : ''} /> Refresh
            </button>
          </div>
        </div>

        <div className="border border-border rounded-lg bg-card p-4 mb-5">
          <div className="grid grid-cols-1 xl:grid-cols-12 gap-3 items-end">
            <div className="xl:col-span-3">
              <label className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">Date Range</label>
              <div className="flex gap-1.5 flex-wrap mt-1.5">
                {REPORT_PRESETS.map((option) => (
                  <button key={option.key} onClick={() => setPreset(option.key)} className={`h-8 px-3 text-xs rounded-full border ${preset === option.key ? 'bg-primary text-primary-foreground border-primary' : 'bg-background text-muted-foreground border-border hover:bg-muted'}`}>
                    {option.label}
                  </button>
                ))}
              </div>
            </div>
            <div className="xl:col-span-2">
              <label className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">Start</label>
              <input type="date" value={startDate} onChange={(event) => { setPreset('custom'); setStartDate(event.target.value); }} className="mt-1 h-9 w-full rounded border border-border bg-background px-3 text-sm" />
            </div>
            <div className="xl:col-span-2">
              <label className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">End</label>
              <input type="date" value={endDate} onChange={(event) => { setPreset('custom'); setEndDate(event.target.value); }} className="mt-1 h-9 w-full rounded border border-border bg-background px-3 text-sm" />
            </div>
            <div className="xl:col-span-2">
              <label className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">Group By</label>
              <select value={groupBy} onChange={(event) => setGroupBy(event.target.value)} className="mt-1 h-9 w-full rounded border border-border bg-background px-3 text-sm">
                {GROUP_OPTIONS.map((option) => <option key={option.key} value={option.key}>{option.label}</option>)}
              </select>
            </div>
            <div className="xl:col-span-3 flex gap-2 flex-wrap xl:justify-end">
              <button onClick={() => handlePrint('report')} className="flex items-center gap-1.5 h-8 px-3 text-sm border border-border rounded bg-card hover:bg-muted text-foreground">
                <Printer size={13} /> Print Report
              </button>
              <CsvButton rows={batchRows} />
            </div>
          </div>
        </div>

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-5">
          {kpis.map(({ label, value, icon: Icon }) => (
            <div key={label} className="border border-border rounded-lg bg-card p-4">
              <div className="flex items-center gap-2 mb-2">
                <Icon size={15} className="text-muted-foreground" />
                <p className="text-xs text-muted-foreground">{label}</p>
              </div>
              <p className="text-2xl font-bold text-foreground">{value}</p>
            </div>
          ))}
        </div>

        <div className="border border-border rounded-lg bg-card p-4 mb-5">
          <div className="flex items-start justify-between gap-3 mb-3">
            <div>
              <h3 className="text-sm font-semibold text-foreground">Markdown Take-Off Sheet Planning</h3>
              <p className="text-xs text-muted-foreground mt-0.5">Print a shelf-check list for tomorrow, next trading day, or a holiday closure date.</p>
            </div>
            <button onClick={() => handlePrint('takeoff')} className="flex items-center gap-1.5 h-8 px-3 text-sm rounded bg-primary text-primary-foreground hover:bg-primary/90">
              <Printer size={13} /> Print Take-Off Sheet
            </button>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-5 gap-3 items-end">
            <div>
              <label className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">Take-off / shelf-check date</label>
              <input type="date" value={takeoffDate} onChange={(event) => setTakeoffDate(event.target.value)} className="mt-1 h-9 w-full rounded border border-border bg-background px-3 text-sm" />
            </div>
            <div>
              <label className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">Closed-store date</label>
              <input type="date" value={closureDate} onChange={(event) => setClosureDate(event.target.value)} className="mt-1 h-9 w-full rounded border border-border bg-background px-3 text-sm" />
            </div>
            <div>
              <label className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">Next trading day</label>
              <input type="date" value={nextTradingDay} onChange={(event) => setNextTradingDay(event.target.value)} className="mt-1 h-9 w-full rounded border border-border bg-background px-3 text-sm" />
            </div>
            <div>
              <label className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">Closure reason</label>
              <select
                value={closureReason}
                onChange={(event) => setClosureReason(event.target.value)}
                className="mt-1 h-9 w-full rounded border border-border bg-background px-3 text-sm"
              >
                {CLOSURE_REASON_OPTIONS.map((reason) => (
                  <option key={reason} value={reason}>{reason}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
                Closure note {closureReason === 'Other' ? '*' : ''}
              </label>
              <input
                value={closureNote}
                onChange={(event) => setClosureNote(event.target.value)}
                className="mt-1 h-9 w-full rounded border border-border bg-background px-3 text-sm"
                placeholder={closureReason === 'Other' ? 'Required details' : 'Optional details, e.g. Christmas Day'}
              />
            </div>
            <label className="flex items-center gap-2 text-sm text-muted-foreground pb-2">
              <input type="checkbox" checked={includeClosurePlanning} onChange={(event) => setIncludeClosurePlanning(event.target.checked)} />
              Include closure-window items
            </label>
          </div>
          <p className="text-xs text-muted-foreground mt-3">
            {takeoffRows.length} item line{takeoffRows.length === 1 ? '' : 's'} due for shelf check / removal on this take-off sheet.
          </p>
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-2 gap-5 mb-5">
          <div className="border border-border rounded-lg bg-card p-4">
            <h3 className="text-sm font-semibold text-foreground mb-4">Period Activity ({GROUP_OPTIONS.find((option) => option.key === groupBy)?.label})</h3>
            {loading ? <div className="h-44 flex items-center justify-center text-muted-foreground text-sm">Loading…</div> : periodData.length === 0 ? (
              <div className="h-44 flex items-center justify-center text-muted-foreground text-sm">No activity in selected range</div>
            ) : (
              <ResponsiveContainer width="100%" height={220}>
                <BarChart data={periodData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                  <XAxis dataKey="period" tick={{ fontSize: 11 }} />
                  <YAxis tick={{ fontSize: 11 }} allowDecimals={false} />
                  <Tooltip />
                  <Bar dataKey="requests" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="batches" fill="hsl(var(--chart-2))" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>

          <div className="border border-border rounded-lg bg-card p-4">
            <h3 className="text-sm font-semibold text-foreground mb-4">Sell-Through Distribution</h3>
            {loading ? <div className="h-44 flex items-center justify-center text-muted-foreground text-sm">Loading…</div> : (
              <ResponsiveContainer width="100%" height={220}>
                <BarChart data={sellThroughBins}>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                  <XAxis dataKey="label" tick={{ fontSize: 11 }} />
                  <YAxis tick={{ fontSize: 11 }} allowDecimals={false} />
                  <Tooltip />
                  <Bar dataKey="count" fill="hsl(var(--chart-3))" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

        <div className="border border-border rounded-lg bg-card p-4 mb-5">
          <div className="flex items-center justify-between gap-3 mb-4">
            <h3 className="text-sm font-semibold text-foreground">Event Activity</h3>
            <span className="text-xs text-muted-foreground">MarkdownEventLog for selected date range</span>
          </div>
          {loading ? <div className="h-40 flex items-center justify-center text-muted-foreground text-sm">Loading…</div> : eventBreakdown.length === 0 ? (
            <div className="h-40 flex items-center justify-center text-muted-foreground text-sm">No events recorded</div>
          ) : (
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={eventBreakdown} layout="vertical" margin={{ left: 90 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                <XAxis type="number" tick={{ fontSize: 11 }} allowDecimals={false} />
                <YAxis dataKey="type" type="category" tick={{ fontSize: 10 }} width={90} />
                <Tooltip />
                <Bar dataKey="count" fill="hsl(var(--chart-2))" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>

        <div className="border border-border rounded-lg overflow-hidden mb-5">
          <div className="px-4 py-3 border-b border-border bg-muted/50 flex items-center justify-between gap-3">
            <div>
              <h3 className="text-sm font-semibold text-foreground">Batch Detail</h3>
              <p className="text-xs text-muted-foreground mt-0.5">Overall markdown data for the selected range</p>
            </div>
            <div className="relative w-64 max-w-full">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
              <input value={searchTerm} onChange={(event) => setSearchTerm(event.target.value)} placeholder="Search item, SKU, status…" className="h-8 w-full rounded border border-border bg-background pl-8 pr-3 text-sm" />
            </div>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-muted text-xs text-muted-foreground uppercase tracking-wide">
                <tr>
                  {['Batch Ref', 'Item', 'Status', 'Expiry/Sell-by', 'Take-off', 'Discount', 'Overlay Price', 'Allocated', 'Sold', 'Remaining', 'Sell-Through'].map((h) => (
                    <th key={h} className="text-left px-4 py-2.5 font-medium whitespace-nowrap">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr><td colSpan={11} className="px-4 py-8 text-center text-muted-foreground">Loading…</td></tr>
                ) : batchRows.length === 0 ? (
                  <tr><td colSpan={11} className="px-4 py-8 text-center text-muted-foreground">No batches found for this date range</td></tr>
                ) : batchRows.map((b, i) => (
                  <tr key={b.id} className={`border-t border-border ${i % 2 === 0 ? 'bg-card' : 'bg-background'}`}>
                    <td className="px-4 py-2.5 font-mono text-xs font-semibold whitespace-nowrap">{b.ref}</td>
                    <td className="px-4 py-2.5 min-w-[180px]"><p className="font-medium text-foreground">{b.itemName}</p><p className="text-xs text-muted-foreground font-mono">{b.sku}</p></td>
                    <td className="px-4 py-2.5 text-xs text-muted-foreground whitespace-nowrap">{b.status.replace(/_/g, ' ')}</td>
                    <td className="px-4 py-2.5 whitespace-nowrap">{formatDate(b.expiryDate)}</td>
                    <td className="px-4 py-2.5 whitespace-nowrap">{formatDate(b.plannedTakeoffDate)}</td>
                    <td className="px-4 py-2.5 text-right whitespace-nowrap">{b.discount === null || b.discount === undefined ? '—' : `${Number(b.discount).toFixed(0)}%`}</td>
                    <td className="px-4 py-2.5 text-right whitespace-nowrap">{formatMoney(b.overlayPrice)}</td>
                    <td className="px-4 py-2.5 text-right">{formatQty(b.allocated)}</td>
                    <td className="px-4 py-2.5 text-right">{formatQty(b.sold)}</td>
                    <td className="px-4 py-2.5 text-right">{formatQty(b.remaining)}</td>
                    <td className="px-4 py-2.5 text-right font-bold">{b.sellThrough.toFixed(1)}%</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div className="border border-border rounded-lg overflow-hidden">
          <div className="px-4 py-3 border-b border-border bg-muted/50">
            <h3 className="text-sm font-semibold text-foreground">Printable Take-Off Preview</h3>
            <p className="text-xs text-muted-foreground mt-0.5">Rows that will print for the selected take-off / closure date.</p>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-muted text-xs text-muted-foreground uppercase tracking-wide">
                <tr>
                  {['Item', 'SKU', 'Expiry/Sell-by', 'Markdown', 'Qty Marked', 'Sold', 'Remaining', 'Action'].map((h) => (
                    <th key={h} className="text-left px-4 py-2.5 font-medium whitespace-nowrap">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {takeoffRows.length === 0 ? (
                  <tr><td colSpan={8} className="px-4 py-8 text-center text-muted-foreground">No take-off rows for selected date</td></tr>
                ) : takeoffRows.map((row) => (
                  <tr key={row.id} className="border-t border-border bg-card">
                    <td className="px-4 py-2.5 font-medium">{row.itemName}</td>
                    <td className="px-4 py-2.5 font-mono text-xs">{row.sku}</td>
                    <td className="px-4 py-2.5">{formatDate(row.expiryDate)}</td>
                    <td className="px-4 py-2.5">{row.discount ? `${Number(row.discount).toFixed(0)}% · ${formatMoney(row.overlayPrice)}` : formatMoney(row.overlayPrice)}</td>
                    <td className="px-4 py-2.5 text-right">{formatQty(row.allocated)}</td>
                    <td className="px-4 py-2.5 text-right">{formatQty(row.sold)}</td>
                    <td className="px-4 py-2.5 text-right font-semibold">{formatQty(row.remaining)}</td>
                    <td className="px-4 py-2.5 text-xs text-muted-foreground">{row.remaining <= 0 ? 'Verify sold out / close overlay' : row.expiryDate && row.expiryDate <= takeoffDate ? 'Remove from shelf / verify remaining qty' : 'Holiday closure shelf check'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <div className="print-only">
        {printMode === 'report' ? (
          <div>
            <h1>Markdown Report</h1>
            <p>Range: {formatDate(startDate)} to {formatDate(endDate)} · Grouped: {GROUP_OPTIONS.find((option) => option.key === groupBy)?.label}</p>
            <p>Generated: {formatDateTime(new Date().toISOString())}</p>
            <h2>Summary</h2>
            <table>
              <tbody>
                {kpis.map((kpi) => <tr key={kpi.label}><th>{kpi.label}</th><td>{kpi.value}</td></tr>)}
              </tbody>
            </table>
            <h2>Batch Detail</h2>
            <table>
              <thead><tr><th>Batch Ref</th><th>Item</th><th>SKU</th><th>Status</th><th>Expiry</th><th>Take-off</th><th>Discount</th><th>Overlay Price</th><th>Allocated</th><th>Sold</th><th>Remaining</th><th>Sell-through</th></tr></thead>
              <tbody>
                {batchRows.map((row) => (
                  <tr key={row.id}><td>{row.ref}</td><td>{row.itemName}</td><td>{row.sku}</td><td>{row.status}</td><td>{formatDate(row.expiryDate)}</td><td>{formatDate(row.plannedTakeoffDate)}</td><td>{row.discount ? `${Number(row.discount).toFixed(0)}%` : '—'}</td><td>{formatMoney(row.overlayPrice)}</td><td>{row.allocated}</td><td>{row.sold}</td><td>{row.remaining}</td><td>{row.sellThrough.toFixed(1)}%</td></tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div>
            <h1>Markdown Take-Off Sheet</h1>
            <p>Take-off / shelf-check date: {formatDate(takeoffDate)}</p>
            <p>Closed-store date: {formatDate(closureDate)} · Next trading day: {formatDate(nextTradingDay)} · Reason: {closureReasonDisplay || '—'}</p>
            <p>Generated: {formatDateTime(new Date().toISOString())}</p>
            <table>
              <thead><tr><th>Item</th><th>SKU</th><th>Expiry/Sell-by</th><th>Markdown</th><th>Qty Marked</th><th>Sold</th><th>Remaining</th><th>Action</th><th>Staff Initials</th></tr></thead>
              <tbody>
                {takeoffRows.length === 0 ? (
                  <tr><td colSpan="9">No rows due for this take-off date.</td></tr>
                ) : takeoffRows.map((row) => (
                  <tr key={row.id}>
                    <td>{row.itemName}</td>
                    <td>{row.sku}</td>
                    <td>{formatDate(row.expiryDate)}</td>
                    <td>{row.discount ? `${Number(row.discount).toFixed(0)}% · ${formatMoney(row.overlayPrice)}` : formatMoney(row.overlayPrice)}</td>
                    <td>{row.allocated}</td>
                    <td>{row.sold}</td>
                    <td>{row.remaining}</td>
                    <td>{row.remaining <= 0 ? 'Verify sold out / close overlay' : row.expiryDate && row.expiryDate <= takeoffDate ? 'Remove from shelf / verify remaining qty' : 'Holiday closure shelf check'}</td>
                    <td></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
