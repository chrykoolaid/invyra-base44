import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  AlertTriangle,
  ArrowRight,
  BarChart3,
  CheckCircle2,
  ClipboardList,
  Clock,
  Plus,
  Printer,
  RefreshCw,
  Tag,
} from 'lucide-react';
import { base44 } from '@/api/base44Client';
import CreateMarkdownBatchModal from '@/components/markdown/CreateMarkdownBatchModal';
import ScannerExceptionReviewModal from '@/components/markdown/ScannerExceptionReviewModal';

const SECONDARY_LINKS = [
  { id: 'batches', label: 'Active Batches', icon: Tag, path: '/Markdown/Batches' },
  { id: 'review', label: 'Review Queue', icon: ClipboardList, path: '/Markdown/ReviewQueue' },
  { id: 'reports', label: 'Reports', icon: BarChart3, path: '/Markdown/Reports' },
];

const OPEN_REVIEW_STATUSES = [
  'Pending_Investigation',
  'Supervisor_Ack',
  'Manager_Auth',
  'Ready_For_Disposition',
];

const OPEN_SYNC_STATUSES = ['Queued', 'Failed', 'Conflict'];
const OPEN_APPROVAL_STATUSES = ['Submitted', 'Pending', 'Pending_Approval', 'Awaiting_Approval', 'Review_Required', 'Queued'];

const batchStatusStyle = {
  Draft: 'bg-slate-100 text-slate-600 border-slate-200',
  Pending_Approval: 'bg-amber-50 text-amber-700 border-amber-200',
  Active: 'bg-green-50 text-green-700 border-green-200',
  Review_Queue: 'bg-orange-50 text-orange-700 border-orange-200',
  Disposition_Complete: 'bg-blue-50 text-blue-700 border-blue-200',
  Recovered: 'bg-purple-50 text-purple-700 border-purple-200',
  Completed: 'bg-green-50 text-green-700 border-green-200',
  Expired: 'bg-slate-100 text-slate-600 border-slate-200',
  Voided: 'bg-red-50 text-red-700 border-red-200',
};

const formatQty = (value) => Number(value || 0).toLocaleString('en-PH');
const formatMoney = (value) => {
  if (value === null || value === undefined || Number.isNaN(Number(value))) return '—';
  return `₱${Number(value).toFixed(2)}`;
};
const formatDate = (value) => {
  if (!value) return '—';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '—';
  return date.toLocaleDateString('en-PH', { month: 'short', day: 'numeric' });
};

function todayKey() {
  return new Date().toISOString().slice(0, 10);
}

function getSlaStatus(entry) {
  const now = new Date();
  if (!entry?.deadline_warning_at) return 'ok';
  if (entry.deadline_critical_at && now >= new Date(entry.deadline_critical_at)) return 'critical';
  if (entry.deadline_escalation_at && now >= new Date(entry.deadline_escalation_at)) return 'escalation';
  if (now >= new Date(entry.deadline_warning_at)) return 'warning';
  return 'ok';
}

function daysUntil(dateString) {
  if (!dateString) return null;
  const start = new Date(todayKey());
  const end = new Date(dateString);
  if (Number.isNaN(end.getTime())) return null;
  return Math.ceil((end - start) / 86400000);
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

function pickField(source, names, fallback = '—') {
  for (const name of names) {
    const value = source?.[name];
    if (value !== undefined && value !== null && value !== '') return value;
  }
  return fallback;
}

function parseBool(value) {
  if (value === true || value === false) return value;
  if (typeof value === 'string') return ['true', 'yes', '1'].includes(value.toLowerCase());
  return Boolean(value);
}

function getScanRequestModel(row) {
  const payload = unwrapPayload(row);
  const originalPrice = pickField(payload, ['original_shelf_price', 'original_unit_price', 'current_price', 'shelf_price'], null);
  const proposedPrice = pickField(payload, ['calculated_markdown_price', 'proposed_markdown_price', 'initial_markdown_price', 'markdown_unit_price', 'markdown_price', 'label_price'], null);
  const suppliedDiscount = pickField(payload, ['markdown_discount_percent', 'calculated_discount_percent', 'discount_percent'], null);
  const calculatedDiscount = suppliedDiscount !== null
    ? Number(suppliedDiscount)
    : (originalPrice && proposedPrice ? ((Number(originalPrice) - Number(proposedPrice)) / Number(originalPrice)) * 100 : null);

  return {
    id: row?.id || row?.local_event_id || pickField(payload, ['request_id', 'local_event_id'], '—'),
    itemId: pickField(payload, ['item_id', 'inventory_item_id', 'itemId'], ''),
    siteId: pickField(payload, ['site_id', 'location_id', 'store_id'], ''),
    itemName: pickField(payload, ['item_name_snapshot', 'item_name', 'name', 'product_name'], 'Unknown item'),
    sku: pickField(payload, ['sku', 'item_sku'], 'No SKU'),
    barcode: pickField(payload, ['barcode', 'item_barcode'], ''),
    qty: pickField(payload, ['counted_markdown_qty', 'allocated_qty', 'quantity_to_allocate', 'qty', 'quantity'], 0),
    onHand: pickField(payload, ['on_hand_snapshot', 'on_hand_qty', 'current_on_hand', 'on_hand'], null),
    expiryDate: pickField(payload, ['expiry_date', 'sell_by_date', 'initial_expiry_date'], null),
    originalPrice,
    proposedPrice,
    discount: Number.isFinite(calculatedDiscount) ? calculatedDiscount : null,
    reason: pickField(payload, ['reason_code', 'reason', 'markdown_reason'], 'Near expiry'),
    captureMethod: pickField(payload, ['capture_method', 'method'], 'ScanOps'),
    deviceId: row?.device_id || pickField(payload, ['device_id'], 'Unknown device'),
    sessionId: pickField(payload, ['scan_session_id', 'session_id'], ''),
    notes: pickField(payload, ['operator_notes', 'request_notes', 'notes'], ''),
    operatorId: row?.submitted_by || pickField(payload, ['operator_id', 'captured_by'], '—'),
    capturedAt: pickField(payload, ['captured_at', 'submitted_at'], row?.created_date || null),
    syncStatus: row?.sync_status || pickField(payload, ['sync_status'], 'Queued'),
    approvalStatus: pickField(payload, ['approval_status', 'status'], 'Pending_Approval'),
    overlayScope: pickField(payload, ['price_overlay_scope', 'overlay_scope'], 'EXPIRY_DATE_QTY'),
    autoCloseRule: pickField(payload, ['auto_close_rule'], 'CLOSE_ON_SOLD_OUT_OR_EXPIRY'),
    priceEntryMode: pickField(payload, ['price_entry_mode'], 'discount_percent'),
    manualPriceOverride: parseBool(pickField(payload, ['manual_price_override'], false)),
    thresholdExceeded: parseBool(pickField(payload, ['threshold_exceeded', 'exception_requires_manager'], false)),
    eventType: row?.event_type || pickField(payload, ['event_type'], 'MARKDOWN_REQUEST'),
  };
}

function isOpenScanRequest(row) {
  const model = getScanRequestModel(row);
  if (OPEN_SYNC_STATUSES.includes(model.syncStatus)) return true;
  if (OPEN_APPROVAL_STATUSES.includes(model.approvalStatus)) return true;
  return model.syncStatus !== 'Processed' && model.approvalStatus !== 'Approved';
}

function scrollToScannerIntake() {
  document.getElementById('markdown-scanner-intake')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

async function safeFilter(entityName, query, sort, limit) {
  try {
    const entity = base44.entities?.[entityName];
    if (!entity?.filter) return { data: [], ok: false };
    const data = await entity.filter(query, sort, limit);
    return { data: data || [], ok: true };
  } catch (error) {
    console.warn(`Markdown control board could not load ${entityName}:`, error);
    return { data: [], ok: false };
  }
}

function SummaryCard({ icon: Icon, label, value, tone = 'default' }) {
  const toneStyles = {
    default: 'border-border bg-card',
    amber: 'border-amber-200 bg-amber-50/40',
    orange: 'border-orange-200 bg-orange-50/40',
    blue: 'border-blue-200 bg-blue-50/40',
    green: 'border-green-200 bg-green-50/40',
  };
  const iconStyles = {
    default: 'text-muted-foreground',
    amber: 'text-amber-600',
    orange: 'text-orange-600',
    blue: 'text-blue-600',
    green: 'text-green-600',
  };

  return (
    <div className={`border rounded-2xl px-4 py-3.5 cursor-default select-none ${toneStyles[tone]}`}>
      <div className="flex items-center justify-between gap-3">
        <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-muted-foreground truncate">{label}</p>
        <Icon size={16} className={`${iconStyles[tone]} flex-shrink-0`} />
      </div>
      <p className="text-2xl font-bold text-foreground mt-2">{value ?? '—'}</p>
    </div>
  );
}

function EmptyState({ icon: Icon, title, description }) {
  return (
    <div className="border border-dashed border-border rounded-xl bg-muted/20 px-4 py-8 text-center">
      <Icon size={28} className="mx-auto mb-3 text-muted-foreground/40" />
      <p className="text-sm font-medium text-foreground">{title}</p>
      {description && <p className="text-xs text-muted-foreground mt-1">{description}</p>}
    </div>
  );
}

function StatusBadge({ status }) {
  return (
    <span className={`text-[10px] px-2 py-0.5 rounded-full border font-semibold whitespace-nowrap ${batchStatusStyle[status] || 'bg-muted text-muted-foreground border-border'}`}>
      {(status || 'Unknown').replace(/_/g, ' ')}
    </span>
  );
}

function ActiveBatchRow({ batch, round }) {
  const sellPct = Number(batch.sell_through_pct || 0);
  const expiryDays = daysUntil(round?.expiry_date);
  const expiryTone = expiryDays === null
    ? 'text-muted-foreground'
    : expiryDays < 0
      ? 'text-red-700 font-semibold'
      : expiryDays <= 1
        ? 'text-red-600 font-semibold'
        : expiryDays <= 3
          ? 'text-amber-700 font-medium'
          : 'text-muted-foreground';

  return (
    <div className="grid grid-cols-12 gap-3 px-4 py-3 items-center hover:bg-muted/30 transition-colors">
      <div className="col-span-12 md:col-span-4 min-w-0">
        <div className="flex items-center gap-2 min-w-0">
          <span className="font-mono text-xs font-semibold text-foreground truncate">{batch.batch_ref || batch.id?.slice(-8) || '—'}</span>
          <StatusBadge status={batch.status} />
        </div>
        <p className="text-sm font-medium text-foreground truncate mt-1">{batch.item_name || 'Unnamed item'}</p>
        <p className="text-xs font-mono text-muted-foreground truncate">{batch.sku || 'No SKU'}</p>
      </div>

      <div className="col-span-4 md:col-span-2 text-xs">
        <p className="text-muted-foreground">Remaining</p>
        <p className="font-semibold text-foreground mt-0.5">{formatQty(batch.current_remaining_qty)}</p>
      </div>

      <div className="col-span-4 md:col-span-2 text-xs">
        <p className="text-muted-foreground">Round / Price</p>
        <p className="font-semibold text-foreground mt-0.5">R{batch.current_round_number || round?.round_number || 1} · {formatMoney(round?.markdown_unit_price)}</p>
      </div>

      <div className="col-span-4 md:col-span-2 text-xs">
        <p className="text-muted-foreground">Expiry</p>
        <p className={`mt-0.5 ${expiryTone}`}>{round?.expiry_date ? formatDate(round.expiry_date) : '—'}</p>
      </div>

      <div className="col-span-12 md:col-span-2 flex items-center justify-between md:justify-end gap-3">
        <div className="text-xs md:text-right">
          <p className="text-muted-foreground">Sell-through</p>
          <p className={`font-bold mt-0.5 ${sellPct >= 80 ? 'text-green-700' : sellPct >= 50 ? 'text-amber-700' : 'text-slate-700'}`}>{sellPct.toFixed(1)}%</p>
        </div>
        <Link to="/Markdown/Batches" className="text-xs font-semibold text-primary hover:underline whitespace-nowrap">
          Open <ArrowRight size={12} className="inline ml-0.5" />
        </Link>
      </div>
    </div>
  );
}


function SyncStatusBadge({ syncStatus, approvalStatus }) {
  const status = syncStatus || 'Queued';
  const statusStyles = {
    Queued: 'bg-amber-50 text-amber-700 border-amber-200',
    Failed: 'bg-red-50 text-red-700 border-red-200',
    Conflict: 'bg-orange-50 text-orange-700 border-orange-200',
    Processed: 'bg-green-50 text-green-700 border-green-200',
  };

  return (
    <div className="flex flex-wrap gap-1.5">
      <span className={`text-[10px] px-2 py-0.5 rounded-full border font-semibold whitespace-nowrap ${statusStyles[status] || 'bg-muted text-muted-foreground border-border'}`}>
        Sync {status}
      </span>
      {approvalStatus && (
        <span className="text-[10px] px-2 py-0.5 rounded-full border font-semibold whitespace-nowrap bg-blue-50 text-blue-700 border-blue-200">
          {String(approvalStatus).replace(/_/g, ' ')}
        </span>
      )}
    </div>
  );
}

function ScanOpsRequestRow({ request, onReview }) {
  const model = getScanRequestModel(request);
  const expiryDays = daysUntil(model.expiryDate);
  const expiryTone = expiryDays === null
    ? 'text-muted-foreground'
    : expiryDays < 0
      ? 'text-red-700 font-semibold'
      : expiryDays <= 1
        ? 'text-red-600 font-semibold'
        : expiryDays <= 3
          ? 'text-amber-700 font-medium'
          : 'text-muted-foreground';

  return (
    <div className="grid grid-cols-12 gap-3 px-4 py-3 items-center hover:bg-muted/30 transition-colors">
      <div className="col-span-12 md:col-span-4 min-w-0">
        <div className="flex items-center gap-2 min-w-0">
          <span className="text-[10px] px-2 py-0.5 rounded-full border font-semibold whitespace-nowrap bg-indigo-50 text-indigo-700 border-indigo-200">ScanOps</span>
          {(model.thresholdExceeded || model.manualPriceOverride) && (
            <span className="text-[10px] px-2 py-0.5 rounded-full border font-semibold whitespace-nowrap bg-amber-50 text-amber-700 border-amber-200">Manager overlay approval</span>
          )}
          <span className="font-mono text-xs text-muted-foreground truncate">{model.id}</span>
        </div>
        <p className="text-sm font-medium text-foreground truncate mt-1">{model.itemName}</p>
        <p className="text-xs font-mono text-muted-foreground truncate">{model.sku}{model.barcode ? ` · ${model.barcode}` : ''}</p>
      </div>

      <div className="col-span-6 md:col-span-2 text-xs">
        <p className="text-muted-foreground">Count / On hand</p>
        <p className="font-semibold text-foreground mt-0.5">{formatQty(model.qty)}{model.onHand !== null ? ` / ${formatQty(model.onHand)}` : ''}</p>
      </div>

      <div className="col-span-6 md:col-span-2 text-xs">
        <p className="text-muted-foreground">Discount / Overlay price</p>
        <p className="font-semibold text-foreground mt-0.5">{formatMoney(model.originalPrice)} → {formatMoney(model.proposedPrice)}</p>
        {model.discount !== null && <p className="text-[11px] text-muted-foreground mt-0.5">{model.discount.toFixed(1)}% off{model.manualPriceOverride ? ' · custom price' : ''}</p>}
      </div>

      <div className="col-span-6 md:col-span-2 text-xs">
        <p className="text-muted-foreground">Expiry / Captured</p>
        <p className={`mt-0.5 ${expiryTone}`}>{model.expiryDate ? formatDate(model.expiryDate) : '—'}</p>
        <p className="text-[11px] text-muted-foreground mt-0.5">{model.capturedAt ? formatDate(model.capturedAt) : '—'} · {model.deviceId}</p>
      </div>

      <div className="col-span-12 md:col-span-2 text-xs space-y-2">
        <SyncStatusBadge syncStatus={model.syncStatus} approvalStatus={model.approvalStatus} />
        <p className="text-[11px] text-muted-foreground truncate">{model.captureMethod} · {model.reason}</p>
        <button
          type="button"
          onClick={() => onReview?.(request)}
          className="h-8 px-3 rounded-lg bg-primary text-primary-foreground text-xs font-semibold hover:opacity-90"
        >
          Review
        </button>
      </div>
    </div>
  );
}

function AttentionItem({ tone, count, title, description, to }) {
  const toneStyles = {
    red: 'border-red-100 bg-red-50/60 text-red-700',
    amber: 'border-amber-100 bg-amber-50/60 text-amber-700',
    orange: 'border-orange-100 bg-orange-50/60 text-orange-700',
    blue: 'border-blue-100 bg-blue-50/60 text-blue-700',
    slate: 'border-slate-100 bg-slate-50/60 text-slate-700',
  };

  return (
    <Link to={to} className={`block border rounded-xl px-3.5 py-3 hover:shadow-sm transition-all ${toneStyles[tone] || toneStyles.slate}`}>
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-sm font-semibold text-foreground">{title}</p>
          <p className="text-xs mt-0.5 opacity-80">{description}</p>
        </div>
        <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-white/80 border border-current/10 flex-shrink-0">{count}</span>
      </div>
    </Link>
  );
}

export default function Markdown() {
  const [showCreate, setShowCreate] = useState(false);
  const [selectedScanRequest, setSelectedScanRequest] = useState(null);
  const [loading, setLoading] = useState(true);
  const [lastRefresh, setLastRefresh] = useState(null);
  const [batches, setBatches] = useState([]);
  const [reviewEntries, setReviewEntries] = useState([]);
  const [roundsByBatch, setRoundsByBatch] = useState({});
  const [printEvents, setPrintEvents] = useState([]);
  const [scanRequests, setScanRequests] = useState([]);
  const [printEventsAvailable, setPrintEventsAvailable] = useState(true);
  const [scanRequestsAvailable, setScanRequestsAvailable] = useState(true);

  const load = async () => {
    setLoading(true);

    const [batchResult, reviewResult, roundResult, printResult, syncResult] = await Promise.all([
      safeFilter('MarkdownBatch', { environment: 'LIVE' }, '-created_date', 200),
      safeFilter('MarkdownReviewQueue', { environment: 'LIVE' }, '-entered_review_at', 100),
      safeFilter('MarkdownRound', { environment: 'LIVE' }, '-created_date', 500),
      safeFilter('MarkdownPrintEvent', { environment: 'LIVE' }, '-printed_at', 200),
      safeFilter('MarkdownSyncQueue', { environment: 'LIVE' }, '-created_date', 100),
    ]);

    const roundMap = {};
    (roundResult.data || []).forEach((round) => {
      if (!round.batch_id) return;
      if (!roundMap[round.batch_id]) roundMap[round.batch_id] = [];
      roundMap[round.batch_id].push(round);
    });

    Object.keys(roundMap).forEach((batchId) => {
      roundMap[batchId].sort((a, b) => Number(b.round_number || 0) - Number(a.round_number || 0));
    });

    setBatches(batchResult.data || []);
    setReviewEntries(reviewResult.data || []);
    setRoundsByBatch(roundMap);
    setPrintEvents(printResult.data || []);
    setScanRequests(syncResult.data || []);
    setPrintEventsAvailable(printResult.ok);
    setScanRequestsAvailable(syncResult.ok);
    setLastRefresh(new Date());
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const computed = useMemo(() => {
    const active = batches.filter((batch) => ['Active', 'Pending_Approval', 'Review_Queue'].includes(batch.status));
    const openScannerRequests = scanRequests.filter(isOpenScanRequest);
    const failedScannerRequests = openScannerRequests.filter((request) => getScanRequestModel(request).syncStatus === 'Failed');
    const conflictScannerRequests = openScannerRequests.filter((request) => getScanRequestModel(request).syncStatus === 'Conflict');
    const openReview = reviewEntries.filter((entry) => OPEN_REVIEW_STATUSES.includes(entry.status));
    const criticalReview = openReview.filter((entry) => getSlaStatus(entry) === 'critical');
    const warningReview = openReview.filter((entry) => ['warning', 'escalation'].includes(getSlaStatus(entry)));
    const readyForDisposition = openReview.filter((entry) => entry.status === 'Ready_For_Disposition');
    const pendingApproval = batches.filter((batch) => batch.status === 'Pending_Approval');
    const failedPrints = printEvents.filter((event) => event.print_status === 'Failed');
    const printedToday = printEvents.filter((event) => {
      if (event.print_status !== 'Success' || !event.printed_at) return false;
      return String(event.printed_at).slice(0, 10) === todayKey();
    });

    const expiringSoon = active.filter((batch) => {
      const round = (roundsByBatch[batch.id] || []).find((r) => r.status === 'Active') || roundsByBatch[batch.id]?.[0];
      const days = daysUntil(round?.expiry_date);
      return days !== null && days <= 1;
    });

    const activeSorted = [...active].sort((a, b) => {
      const priority = { Pending_Approval: 0, Review_Queue: 1, Active: 2 };
      return (priority[a.status] ?? 9) - (priority[b.status] ?? 9);
    });

    return {
      active,
      activeSorted,
      openScannerRequests,
      failedScannerRequests,
      conflictScannerRequests,
      openReview,
      criticalReview,
      warningReview,
      readyForDisposition,
      pendingApproval,
      failedPrints,
      printedToday,
      expiringSoon,
      inReviewCount: Math.max(openReview.length, batches.filter((batch) => batch.status === 'Review_Queue').length),
    };
  }, [batches, reviewEntries, roundsByBatch, printEvents, scanRequests]);

  const attentionItems = [
    computed.failedScannerRequests.length > 0 && {
      tone: 'red',
      count: computed.failedScannerRequests.length,
      title: 'ScanOps sync failures',
      description: 'Scanner markdown requests need sync recovery before approval.',
      to: '/Markdown',
    },
    computed.conflictScannerRequests.length > 0 && {
      tone: 'orange',
      count: computed.conflictScannerRequests.length,
      title: 'Scanner request conflicts',
      description: 'Review item, quantity, or price snapshot mismatches.',
      to: '/Markdown',
    },
    computed.openScannerRequests.length > 0 && {
      tone: 'blue',
      count: computed.openScannerRequests.length,
      title: 'ScanOps requests awaiting intake',
      description: 'Review high-quantity or exception floor captures before price overlay activation.',
      to: '/Markdown',
    },
    computed.criticalReview.length > 0 && {
      tone: 'red',
      count: computed.criticalReview.length,
      title: 'Critical review entries overdue',
      description: 'Manager confirmation required before disposition.',
      to: '/Markdown/ReviewQueue',
    },
    computed.readyForDisposition.length > 0 && {
      tone: 'orange',
      count: computed.readyForDisposition.length,
      title: 'Ready for disposition',
      description: 'Awaiting final waste, recovery, or store-use outcome.',
      to: '/Markdown/ReviewQueue',
    },
    computed.pendingApproval.length > 0 && {
      tone: 'amber',
      count: computed.pendingApproval.length,
      title: 'Batches pending approval',
      description: 'Supervisor or manager approval needed to activate scoped price overlays.',
      to: '/Markdown/Batches',
    },
    computed.failedPrints.length > 0 && {
      tone: 'red',
      count: computed.failedPrints.length,
      title: 'Fallback label failures',
      description: 'Check printer/device issues from Reports and Take-Off Sheet outputs.',
      to: '/Markdown/Reports',
    },
    computed.warningReview.length > 0 && {
      tone: 'amber',
      count: computed.warningReview.length,
      title: 'Review entries nearing SLA',
      description: 'Investigate before escalation becomes critical.',
      to: '/Markdown/ReviewQueue',
    },
    computed.expiringSoon.length > 0 && {
      tone: 'blue',
      count: computed.expiringSoon.length,
      title: 'Overlays expiring soon',
      description: 'Check active scoped overlays in Reports and printable Take-Off Sheets.',
      to: '/Markdown/Reports',
    },
  ].filter(Boolean);

  return (
    <div className="p-6 space-y-5">

      {selectedScanRequest && (
        <ScannerExceptionReviewModal
          request={selectedScanRequest}
          model={getScanRequestModel(selectedScanRequest)}
          onClose={() => setSelectedScanRequest(null)}
          onProcessed={() => {
            setSelectedScanRequest(null);
            load();
          }}
        />
      )}

      {showCreate && (
        <CreateMarkdownBatchModal
          onClose={() => setShowCreate(false)}
          onCreated={() => {
            setShowCreate(false);
            load();
          }}
        />
      )}

      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-foreground tracking-tight">Markdown Control</h1>
          <p className="text-sm text-muted-foreground mt-1">Near-expiry price overlays, ScanOps intake, and recovery workflow</p>
          <p className="text-xs text-muted-foreground mt-1">
            {lastRefresh ? `Last refreshed ${lastRefresh.toLocaleTimeString('en-PH', { hour: '2-digit', minute: '2-digit' })}` : 'Loading live markdown queues'}
          </p>
        </div>

        <button onClick={load} className="flex items-center gap-1.5 h-9 px-3 text-sm border border-border rounded-lg bg-card hover:bg-muted text-foreground w-fit">
          <RefreshCw size={14} className={loading ? 'animate-spin' : ''} /> Refresh
        </button>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-5 gap-3">
        <SummaryCard icon={ClipboardList} label="Scanner Intake" value={scanRequestsAvailable ? computed.openScannerRequests.length : '—'} tone="blue" />
        <SummaryCard icon={Clock} label="Overlay Approval" value={computed.pendingApproval.length} tone="amber" />
        <SummaryCard icon={Tag} label="Active Batches" value={batches.filter((batch) => batch.status === 'Active').length} tone="green" />
        <SummaryCard icon={AlertTriangle} label="In Review" value={computed.inReviewCount} tone="orange" />
        <SummaryCard icon={Printer} label="Report Prints Today" value={printEventsAvailable ? computed.printedToday.length : '—'} tone="default" />
      </div>

      <section className="border border-border rounded-2xl bg-card p-3">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-muted-foreground">Workflow Tabs</p>
            <p className="text-xs text-muted-foreground mt-0.5">ScanOps requests sync into intake. Printable monitoring, take-off sheets, and holiday planning now live in Reports.</p>
          </div>
          <div className="flex flex-wrap gap-2">
            <button
              onClick={scrollToScannerIntake}
              className="flex items-center gap-1.5 h-9 px-3 text-sm bg-primary text-primary-foreground rounded-lg hover:opacity-90"
            >
              <ClipboardList size={14} /> Scanner Intake
            </button>
            <button
              onClick={() => setShowCreate(true)}
              className="flex items-center gap-1.5 h-9 px-3 text-sm border border-border rounded-lg bg-background hover:bg-muted text-foreground"
            >
              <Plus size={14} /> Manual Exception
            </button>
            {SECONDARY_LINKS.map((link) => {
              const Icon = link.icon;
              return (
                <Link
                  key={link.id}
                  to={link.path}
                  className="flex items-center gap-1.5 h-9 px-3 text-sm border border-border rounded-lg bg-background hover:bg-muted text-foreground"
                >
                  <Icon size={14} /> {link.label}
                </Link>
              );
            })}
          </div>
        </div>
      </section>

      {loading ? (
        <div className="flex items-center justify-center py-20 border border-border rounded-2xl bg-card">
          <div className="w-6 h-6 border-2 border-muted border-t-foreground rounded-full animate-spin" />
        </div>
      ) : (
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">
          <section id="markdown-scanner-intake" className="xl:col-span-2 border border-border rounded-2xl bg-card overflow-hidden scroll-mt-6">
            <div className="flex items-center justify-between gap-3 px-4 py-3 border-b border-border bg-muted/20">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.16em] text-muted-foreground">Scanner Intake & Active Markdown Work</p>
                <p className="text-sm text-muted-foreground mt-0.5">Synced ScanOps requests, manager overlay approvals, and active scoped markdown batches.</p>
              </div>
              <Link to="/Markdown/Batches" className="hidden sm:flex items-center gap-1 text-xs font-semibold text-primary hover:underline">
                View batches <ArrowRight size={12} />
              </Link>
            </div>

            {computed.openScannerRequests.length === 0 && computed.activeSorted.length === 0 ? (
              <div className="p-4">
                <EmptyState
                  icon={ClipboardList}
                  title="No synced ScanOps markdown requests"
                  description="Floor-captured markdown requests will appear here after handheld ScanOps sync."
                />
              </div>
            ) : (
              <div className="divide-y divide-border">
                {computed.openScannerRequests.length > 0 && (
                  <div className="bg-indigo-50/40 border-b border-border">
                    <div className="px-4 py-2 text-[11px] font-semibold uppercase tracking-[0.14em] text-indigo-700">ScanOps markdown sync / exception intake</div>
                    <div className="divide-y divide-border bg-card">
                      {computed.openScannerRequests.slice(0, 8).map((request, index) => (
                        <ScanOpsRequestRow key={request.id || request.local_event_id || index} request={request} onReview={setSelectedScanRequest} />
                      ))}
                    </div>
                  </div>
                )}

                {computed.activeSorted.length > 0 && (
                  <div>
                    <div className="px-4 py-2 text-[11px] font-semibold uppercase tracking-[0.14em] text-muted-foreground bg-muted/20">Active scoped overlays / in-progress batches</div>
                    <div className="divide-y divide-border">
                      {computed.activeSorted.slice(0, 8).map((batch) => {
                        const activeRound = (roundsByBatch[batch.id] || []).find((round) => round.status === 'Active') || roundsByBatch[batch.id]?.[0];
                        return <ActiveBatchRow key={batch.id} batch={batch} round={activeRound} />;
                      })}
                    </div>
                  </div>
                )}
              </div>
            )}
          </section>

          <aside className="space-y-4">
            <section className="border border-border rounded-2xl bg-card p-4">
              <div className="flex items-start justify-between gap-3 mb-3">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.16em] text-muted-foreground">Needs Attention</p>
                  <p className="text-sm text-muted-foreground mt-0.5">Scanner sync, overlay approval, review, and report/take-off follow-up issues.</p>
                </div>
                <AlertTriangle size={16} className={attentionItems.length ? 'text-amber-600' : 'text-green-600'} />
              </div>

              {attentionItems.length === 0 ? (
                <div className="flex items-start gap-2 rounded-xl border border-green-100 bg-green-50/70 px-3 py-3 text-sm text-green-700">
                  <CheckCircle2 size={15} className="mt-0.5 flex-shrink-0" />
                  <span>No immediate markdown actions required. Queues are clear.</span>
                </div>
              ) : (
                <div className="space-y-2">
                  {attentionItems.map((item) => <AttentionItem key={item.title} {...item} />)}
                </div>
              )}
            </section>

            <section className="border border-border rounded-2xl bg-card p-4">
              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-muted-foreground mb-3">Workflow Shortcuts</p>
              <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-1 gap-2">
                {SECONDARY_LINKS.map((link) => {
                  const Icon = link.icon;
                  return (
                    <Link
                      key={link.id}
                      to={link.path}
                      className="flex items-center justify-between gap-3 rounded-xl border border-border bg-background px-3 py-2.5 text-sm hover:bg-muted/60 transition-colors"
                    >
                      <span className="flex items-center gap-2 min-w-0">
                        <Icon size={15} className="text-primary flex-shrink-0" />
                        <span className="font-medium text-foreground truncate">{link.label}</span>
                      </span>
                      <ArrowRight size={13} className="text-muted-foreground flex-shrink-0" />
                    </Link>
                  );
                })}
              </div>
            </section>

            <section className="border border-dashed border-border rounded-2xl bg-muted/20 p-4">
              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-muted-foreground">Guardrail</p>
              <p className="text-sm text-foreground mt-2">Markdown price overlays never mutate Item Master price. They are limited to the affected SKU, expiry/date, and quantity, then auto-close when sold out, expired, or manually closed. Wastage remains separate.</p>
            </section>
          </aside>
        </div>
      )}
    </div>
  );
}
