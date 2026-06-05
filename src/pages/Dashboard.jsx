import { useEffect, useMemo, useState, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
import {
  AlertTriangle,
  ArrowRight,
  Boxes,
  CalendarClock,
  CircleAlert,
  Clock3,
  DollarSign,
  PackageCheck,
  PackageX,
  Settings2,
  ShoppingCart,
  Trash2,
  TriangleAlert,
  BellRing,
  X,
} from 'lucide-react';

const dashboardMeta = {
  title: 'Operations Overview',
  location: 'Invyra Laundry · Main Location',
  sync: 'Updated 8 mins ago',
};

const kpiCards = [
  {
    label: 'LOW STOCK',
    value: '6',
    sub: 'items below threshold',
    helper: '2 hard stockouts',
    icon: AlertTriangle,
    iconColor: 'text-amber-400',
  },
  {
    label: 'OUT OF STOCK',
    value: '2',
    sub: 'items at zero on hand',
    helper: 'detergent packaging affected',
    icon: PackageX,
    iconColor: 'text-red-400',
  },
  {
    label: 'ORDERS PENDING',
    value: '4',
    sub: 'draft, submitted & inbound',
    helper: '1 overdue delivery',
    icon: ShoppingCart,
    iconColor: 'text-sky-400',
  },
  {
    label: 'STOCK VALUE',
    value: '₱84.6k',
    sub: 'current inventory value',
    helper: '₱12.4k reorder exposure',
    icon: DollarSign,
    iconColor: 'text-emerald-400',
  },
  {
    label: 'SETUP GAPS',
    value: '5',
    sub: 'items need master-data cleanup',
    helper: 'thresholds & suppliers missing',
    icon: Settings2,
    iconColor: 'text-violet-400',
  },
  {
    label: 'WASTE FLAGS',
    value: '3',
    sub: 'exceptions this week',
    helper: 'softener & stain remover led',
    icon: Trash2,
    iconColor: 'text-rose-400',
  },
];

const priorityIssues = [
  { sku: 'CHM-001', item: 'Detergent 5L', onHand: 2, status: 'Reorder', note: '2 days cover left' },
  { sku: 'CHM-002', item: 'Softener 2L', onHand: 0, status: 'Out', note: 'Active stockout now' },
  { sku: 'OPS-002', item: 'Hangers (Standard)', onHand: 45, status: 'OK', note: 'Healthy cover' },
  { sku: 'CHM-004', item: 'Stain Remover 2L', onHand: 5, status: 'Reorder', note: 'Usage spike this week' },
  { sku: 'PKG-001', item: 'Packaging Rolls', onHand: 0, status: 'Out', note: 'Packing bench blocked' },
  { sku: 'CHM-003', item: 'Bleach 5L', onHand: 12, status: 'Reorder', note: 'Below preferred buffer' },
];

const setupHealth = [
  {
    label: 'Thresholds missing',
    value: '3 SKUs',
    sub: 'Bleach Additive 1L, Plastic Covers, Lint Bags',
    tone: 'text-amber-300',
  },
  {
    label: 'Preferred supplier missing',
    value: '1 SKU',
    sub: 'Packaging Rolls needs supplier mapping before auto-reorder',
    tone: 'text-red-300',
  },
  {
    label: 'Cost / unit data incomplete',
    value: '1 SKU',
    sub: 'Premium Softener has no validated landed cost yet',
    tone: 'text-violet-300',
  },
];

const receivingWatch = [
  {
    title: 'Delivery overdue',
    meta: 'PO-2026-002 · CleanTex Distributors',
    sub: 'Expected yesterday · Awaiting delivery confirmation',
    tone: 'border-l-amber-400',
    badge: 'Follow up',
    badgeStyle: 'bg-amber-900/40 text-amber-300',
  },
  {
    title: 'Receiving due today',
    meta: 'PO-2026-024 · ProWash Ingredients',
    sub: 'Detergent 5L, Softener 2L, Stain Remover 2L',
    tone: 'border-l-sky-400',
    badge: 'Due today',
    badgeStyle: 'bg-sky-900/50 text-sky-300',
  },
  {
    title: 'Partially received',
    meta: 'PO-2026-021 · LaundryChem Direct',
    sub: '2 of 5 lines received · 3 lines still open',
    tone: 'border-l-violet-400',
    badge: 'Review',
    badgeStyle: 'bg-violet-900/40 text-violet-300',
  },
];

const actionQueue = [
  {
    title: 'Submit replacement order for Softener 2L',
    reason: 'Item is at zero on hand and affects active laundry services.',
    to: '/ReorderReview',
  },
  {
    title: 'Confirm overdue delivery for Packaging Rolls',
    reason: 'Packing flow is blocked until inbound stock is confirmed.',
    to: '/Receiving',
  },
  {
    title: 'Complete missing threshold setup',
    reason: 'Three SKUs cannot participate cleanly in dashboard reorder logic yet.',
    to: '/InventoryAdmin',
  },
  {
    title: 'Review wastage exception trend',
    reason: 'Three waste flags were recorded this week.',
    to: '/GapScan',
  },
];

const recentActivity = [
  { time: '08:14', type: 'Stockout', event: 'Softener 2L adjusted → 0 units (wastage)', tone: 'text-red-300' },
  { time: '07:52', type: 'Draft order', event: 'Draft PO-2026-023 created from Gap Scan', tone: 'text-sky-300' },
  { time: 'Yesterday', type: 'Submission', event: 'PO-2026-022 submitted — HangerCo Wholesale', tone: 'text-amber-300' },
  { time: 'Yesterday', type: 'Receiving', event: 'Receiving confirmed — LaundryChem Direct', tone: 'text-emerald-300' },
  { time: '2d ago', type: 'Waste', event: 'Waste exception — Stain Remover batch expiry', tone: 'text-violet-300' },
];

const draftOrders = [
  { po: 'PO-2026-023', supplier: 'ProWash Ingredients', status: 'Draft', urgency: 'high' },
  { po: 'PO-2026-022', supplier: 'HangerCo Wholesale', status: 'Draft', urgency: 'medium' },
  { po: 'PO-2026-001', supplier: 'ChemSupply Co', status: 'Submitted', urgency: 'low' },
  { po: 'PO-2026-002', supplier: 'CleanTex Distributors', status: 'Awaiting Delivery', urgency: 'medium' },
];

const quickActions = [
  { label: 'Open Inventory', to: '/Inventory' },
  { label: 'Review Orders', to: '/Orders' },
  { label: 'Run Gap Scan', to: '/GapScan' },
  { label: 'Open Receiving', to: '/Receiving' },
  { label: 'Reorder Review', to: '/ReorderReview' },
  { label: 'Inventory Admin', to: '/InventoryAdmin' },
];

const statusStyle = {
  Reorder: 'text-amber-400',
  Out: 'text-red-400',
  OK: 'text-emerald-400',
};

const orderStatusStyle = {
  Draft: 'bg-slate-700 text-slate-300',
  Submitted: 'bg-sky-900/60 text-sky-300',
  'Awaiting Delivery': 'bg-amber-900/40 text-amber-300',
  Received: 'bg-emerald-900/40 text-emerald-300',
  Complete: 'bg-emerald-900/40 text-emerald-300',
  Partial: 'bg-amber-900/40 text-amber-300',
  Discrepancy: 'bg-red-900/40 text-red-300',
};

const urgencyDot = {
  high: 'bg-red-400',
  medium: 'bg-amber-400',
  low: 'bg-emerald-400',
};

function Panel({ title, actionLabel, actionTo, children, className = '' }) {
  return (
    <div className={`bg-slate-900 rounded-2xl border border-slate-700/60 overflow-hidden ${className}`}>
      <div className="flex items-center justify-between px-4 py-2.5 border-b border-slate-700/60">
        <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-[0.22em]">{title}</span>
        {actionLabel && actionTo && (
          <Link
            to={actionTo}
            className="text-xs text-sky-400 hover:text-sky-300 flex items-center gap-1 transition-colors"
          >
            {actionLabel} <ArrowRight size={11} />
          </Link>
        )}
      </div>
      {children}
    </div>
  );
}

export default function Dashboard() {
  const [now, setNow] = useState(() => new Date());
  const [inventoryItems, setInventoryItems] = useState([]);
  const [receivingRecords, setReceivingRecords] = useState([]);
  const [stockMovements, setStockMovements] = useState([]);
  const [alertDismissed, setAlertDismissed] = useState(false);

  const loadData = useCallback(async () => {
    const [invRows, recRows, movRows] = await Promise.all([
      base44.entities.InventoryItem.filter({ is_active: true }, '-updated_date', 500),
      base44.entities.ReceivingRecord.list('-created_date', 20),
      base44.entities.StockMovement.list('-created_date', 30),
    ]);
    setInventoryItems(invRows || []);
    setReceivingRecords(recRows || []);
    setStockMovements(movRows || []);
    setAlertDismissed(false);
  }, []);

  useEffect(() => { loadData(); }, [loadData]);

  // Derive live low-stock & out-of-stock items
  const lowStockItems = useMemo(() =>
    inventoryItems.filter(i => i.reorder_point != null && (i.stock || 0) <= i.reorder_point && (i.stock || 0) > 0),
    [inventoryItems]
  );
  const outOfStockItems = useMemo(() =>
    inventoryItems.filter(i => (i.stock || 0) === 0),
    [inventoryItems]
  );
  const noThresholdItems = useMemo(() =>
    inventoryItems.filter(i => i.reorder_point == null),
    [inventoryItems]
  );

  // --- Live: Stock Value KPI ---
  const totalStockValue = useMemo(() =>
    inventoryItems.reduce((sum, i) => sum + ((i.stock || 0) * (i.cost_per_unit || 0)), 0),
    [inventoryItems]
  );
  const reorderExposureValue = useMemo(() =>
    [...outOfStockItems, ...lowStockItems].reduce((sum, i) => sum + ((i.reorder_qty || 0) * (i.cost_per_unit || 0)), 0),
    [outOfStockItems, lowStockItems]
  );

  // --- Live: Setup Health ---
  const missingThresholdItems = useMemo(() => inventoryItems.filter(i => i.reorder_point == null), [inventoryItems]);
  const missingSupplierItems = useMemo(() => inventoryItems.filter(i => !i.preferred_supplier), [inventoryItems]);
  const missingCostItems = useMemo(() => inventoryItems.filter(i => i.cost_per_unit == null || i.cost_per_unit === 0), [inventoryItems]);

  const liveSetupHealth = useMemo(() => {
    return [
      {
        label: 'Thresholds missing',
        value: `${missingThresholdItems.length} SKU${missingThresholdItems.length !== 1 ? 's' : ''}`,
        sub: missingThresholdItems.length > 0 ? missingThresholdItems.slice(0, 3).map(i => i.name).join(', ') + (missingThresholdItems.length > 3 ? ` +${missingThresholdItems.length - 3} more` : '') : 'All items have thresholds set',
        tone: missingThresholdItems.length > 0 ? 'text-amber-300' : 'text-emerald-300',
      },
      {
        label: 'Preferred supplier missing',
        value: `${missingSupplierItems.length} SKU${missingSupplierItems.length !== 1 ? 's' : ''}`,
        sub: missingSupplierItems.length > 0 ? missingSupplierItems.slice(0, 2).map(i => i.name).join(', ') + ' need supplier mapping' : 'All items have a supplier',
        tone: missingSupplierItems.length > 0 ? 'text-red-300' : 'text-emerald-300',
      },
      {
        label: 'Cost / unit data incomplete',
        value: `${missingCostItems.length} SKU${missingCostItems.length !== 1 ? 's' : ''}`,
        sub: missingCostItems.length > 0 ? missingCostItems.slice(0, 2).map(i => i.name).join(', ') + ' have no landed cost' : 'All items have cost data',
        tone: missingCostItems.length > 0 ? 'text-violet-300' : 'text-emerald-300',
      },
    ];
  }, [inventoryItems, missingThresholdItems, missingSupplierItems, missingCostItems]);

  // --- Live: Receiving & Delivery Watch ---
  const liveReceivingWatch = useMemo(() => {
    return receivingRecords.slice(0, 4).map(r => {
      const isPartial = r.status === 'Partial';
      const isDiscrepancy = r.status === 'Discrepancy';
      const tone = isPartial ? 'border-l-violet-400' : isDiscrepancy ? 'border-l-amber-400' : 'border-l-sky-400';
      const badge = isPartial ? 'Review' : isDiscrepancy ? 'Discrepancy' : 'Received';
      const badgeStyle = isPartial ? 'bg-violet-900/40 text-violet-300' : isDiscrepancy ? 'bg-amber-900/40 text-amber-300' : 'bg-sky-900/50 text-sky-300';
      const itemNames = (r.items || []).map(i => i.item).slice(0, 3).join(', ');
      return {
        title: `${r.status} · ${r.po_number}`,
        meta: `${r.po_number} · ${r.supplier}`,
        sub: itemNames || `Confirmed by ${r.confirmed_by || 'unknown'}`,
        tone,
        badge,
        badgeStyle,
      };
    });
  }, [receivingRecords]);

  // --- Live: Recent Exceptions & Activity (from StockMovement ledger) ---
  const liveRecentActivity = useMemo(() => {
    const toneMap = { WASTE: 'text-red-300', RECEIVE: 'text-emerald-300', ADJUST: 'text-amber-300', TRANSFER_IN: 'text-sky-300', TRANSFER_OUT: 'text-violet-300', STOCKTAKE: 'text-blue-300', REVERSAL: 'text-slate-400', SALE: 'text-sky-300' };
    const labelMap = { WASTE: 'Waste', RECEIVE: 'Receiving', ADJUST: 'Adjustment', TRANSFER_IN: 'Transfer In', TRANSFER_OUT: 'Transfer Out', STOCKTAKE: 'Stocktake', REVERSAL: 'Reversal', SALE: 'Sale' };
    return stockMovements.slice(0, 6).map(m => {
      const date = m.created_date ? new Date(m.created_date) : null;
      const now = new Date();
      const diffMs = date ? now - date : 0;
      const diffDays = Math.floor(diffMs / 86400000);
      const timeStr = diffDays === 0
        ? (date ? date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'Today')
        : diffDays === 1 ? 'Yesterday' : `${diffDays}d ago`;
      return {
        time: timeStr,
        type: labelMap[m.movement_type] || m.movement_type,
        event: `${m.item_name || m.sku} · ${m.direction === 'IN' ? '+' : '-'}${m.qty} ${m.notes ? '· ' + m.notes : ''}`.trim(),
        tone: toneMap[m.movement_type] || 'text-slate-400',
      };
    });
  }, [stockMovements]);

  // --- Live: Pending Orders (from ReceivingRecord) ---
  const livePendingOrders = useMemo(() => {
    return receivingRecords.slice(0, 5).map(r => ({
      po: r.po_number,
      supplier: r.supplier,
      status: r.status === 'Complete' ? 'Received' : r.status === 'Partial' ? 'Partial' : r.status || 'Complete',
      urgency: r.status === 'Discrepancy' ? 'high' : r.status === 'Partial' ? 'medium' : 'low',
    }));
  }, [receivingRecords]);

  // Build live priority issues (low stock + out of stock, up to 8)
  const livePriorityIssues = useMemo(() => {
    const out = outOfStockItems.map(i => ({ sku: i.sku, item: i.name, onHand: i.stock || 0, status: 'Out', note: 'Active stockout' }));
    const low = lowStockItems.map(i => ({ sku: i.sku, item: i.name, onHand: i.stock || 0, status: 'Reorder', note: `Below reorder point of ${i.reorder_point}` }));
    return [...out, ...low].slice(0, 8);
  }, [outOfStockItems, lowStockItems]);

  // Live KPI overrides
  const liveKpiCards = useMemo(() => kpiCards.map(card => {
    if (card.label === 'LOW STOCK' && inventoryItems.length > 0) {
      return { ...card, value: String(lowStockItems.length), sub: 'items below reorder point', helper: `${outOfStockItems.length} hard stockout${outOfStockItems.length !== 1 ? 's' : ''}` };
    }
    if (card.label === 'OUT OF STOCK' && inventoryItems.length > 0) {
      return { ...card, value: String(outOfStockItems.length), sub: 'items at zero on hand' };
    }
    if (card.label === 'SETUP GAPS' && inventoryItems.length > 0) {
      const totalGaps = missingThresholdItems.length + missingSupplierItems.length + missingCostItems.length;
      return { ...card, value: String(totalGaps), sub: 'items need master-data cleanup', helper: 'thresholds, suppliers & cost missing' };
    }
    if (card.label === 'STOCK VALUE' && inventoryItems.length > 0 && totalStockValue > 0) {
      const formatted = totalStockValue >= 1000 ? `₱${(totalStockValue / 1000).toFixed(1)}k` : `₱${totalStockValue.toFixed(0)}`;
      const exposure = reorderExposureValue >= 1000 ? `₱${(reorderExposureValue / 1000).toFixed(1)}k` : `₱${reorderExposureValue.toFixed(0)}`;
      return { ...card, value: formatted, sub: 'current inventory value', helper: `${exposure} reorder exposure` };
    }
    return card;
  }), [inventoryItems, lowStockItems, outOfStockItems, noThresholdItems, missingThresholdItems, missingSupplierItems, missingCostItems, totalStockValue, reorderExposureValue]);

  useEffect(() => {
    const timer = window.setInterval(() => setNow(new Date()), 60000);
    return () => window.clearInterval(timer);
  }, []);

  const headerClock = useMemo(
    () =>
      new Intl.DateTimeFormat(undefined, {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
        hour: 'numeric',
        minute: '2-digit',
      }).format(now),
    [now]
  );

  return (
    <div className="p-4 lg:p-5 space-y-4 max-w-[1380px]">

      {/* Live low-stock alert banner */}
      {!alertDismissed && (lowStockItems.length > 0 || outOfStockItems.length > 0) && (
        <div className="flex items-start gap-3 rounded-2xl border border-amber-500/40 bg-amber-950/30 px-4 py-3">
          <BellRing size={16} className="text-amber-400 mt-0.5 flex-shrink-0 animate-pulse" />
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-amber-300">
              Stock Alert — {outOfStockItems.length > 0 ? `${outOfStockItems.length} item${outOfStockItems.length !== 1 ? 's' : ''} out of stock` : ''}{outOfStockItems.length > 0 && lowStockItems.length > 0 ? ' · ' : ''}{lowStockItems.length > 0 ? `${lowStockItems.length} item${lowStockItems.length !== 1 ? 's' : ''} below reorder point` : ''}
            </p>
            <p className="text-xs text-amber-400/70 mt-1">
              {[...outOfStockItems, ...lowStockItems].slice(0, 5).map(i => i.name).join(', ')}{[...outOfStockItems, ...lowStockItems].length > 5 ? ` +${[...outOfStockItems, ...lowStockItems].length - 5} more` : ''}
            </p>
          </div>
          <div className="flex items-center gap-2 flex-shrink-0">
            <Link to="/Inventory" className="text-xs text-amber-300 hover:text-amber-200 transition-colors underline underline-offset-2">View inventory</Link>
            <button onClick={() => setAlertDismissed(true)} className="text-amber-500 hover:text-amber-300 transition-colors">
              <X size={14} />
            </button>
          </div>
        </div>
      )}

      <div className="flex flex-col gap-2.5 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <h1 className="text-lg font-semibold text-foreground">{dashboardMeta.title}</h1>
          <p className="text-sm text-muted-foreground mt-0.5">{dashboardMeta.location}</p>
        </div>

        <div className="flex flex-wrap items-center gap-2 text-xs">
          <span className="inline-flex items-center gap-1.5 rounded-full border border-slate-300 bg-white px-3 py-1.5 text-slate-700">
            <Boxes size={12} /> Main Location
          </span>
          <span className="inline-flex items-center gap-1.5 rounded-full border border-slate-300 bg-white px-3 py-1.5 text-slate-700">
            <Clock3 size={12} /> {headerClock}
          </span>
          <span className="inline-flex items-center gap-1.5 rounded-full border border-slate-300 bg-white px-3 py-1.5 text-slate-700">
            <CalendarClock size={12} /> {dashboardMeta.sync}
          </span>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-3">
        {liveKpiCards.map(({ label, value, sub, helper, icon: Icon, iconColor }) => (
          <div
            key={label}
            className="bg-slate-900 rounded-2xl border border-slate-700/60 px-4 pt-3.5 pb-3.5 flex flex-col gap-1.5 min-h-[128px]"
          >
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-semibold tracking-[0.22em] text-slate-400">{label}</span>
              <Icon className={`w-4 h-4 ${iconColor}`} strokeWidth={1.8} />
            </div>
            <p className="text-[2.25rem] font-bold text-white leading-none tracking-tight">{value}</p>
            <p className="text-xs text-slate-400">{sub}</p>
            <p className="text-[11px] text-slate-500 mt-auto">{helper}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-3">
        <Panel title="Needs Action Now" actionLabel="Open work queue" actionTo="/ReorderReview">
          <div className="divide-y divide-slate-800/80">
            {actionQueue.map((item) => (
              <Link
                key={item.title}
                to={item.to}
                className="block px-4 py-2.5 hover:bg-slate-800/40 transition-colors"
              >
                <div className="flex items-start gap-3">
                  <TriangleAlert className="w-4 h-4 text-amber-400 mt-0.5 flex-shrink-0" />
                  <div className="min-w-0">
                    <p className="text-sm text-slate-100">{item.title}</p>
                    <p className="text-xs text-slate-500 mt-1 leading-relaxed">{item.reason}</p>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </Panel>

        <Panel title="Receiving & Delivery Watch" actionLabel="Open receiving" actionTo="/Receiving">
          <div className="p-3 space-y-2.5">
            {liveReceivingWatch.map((row) => (
              <div
                key={row.title}
                className={`rounded-xl border border-slate-800 bg-slate-950/40 p-3 border-l-4 ${row.tone}`}
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-sm text-slate-100">{row.title}</p>
                    <p className="text-xs text-slate-400 mt-1">{row.meta}</p>
                  </div>
                  <span className={`text-[10px] px-2 py-1 rounded-full font-medium whitespace-nowrap ${row.badgeStyle}`}>
                    {row.badge}
                  </span>
                </div>
                <p className="text-xs text-slate-500 mt-2 leading-relaxed">{row.sub}</p>
              </div>
            ))}
          </div>
        </Panel>

        <Panel title="Setup Health" actionLabel="Open admin" actionTo="/InventoryAdmin">
          <div className="p-3 space-y-2.5">
            {liveSetupHealth.map((row) => (
              <div key={row.label} className="rounded-xl border border-slate-800 bg-slate-950/40 px-3 py-3">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500">{row.label}</p>
                    <p className={`text-sm mt-1.5 ${row.tone}`}>{row.value}</p>
                  </div>
                  <CircleAlert className="w-4 h-4 text-slate-500 mt-0.5 flex-shrink-0" />
                </div>
                <p className="text-xs text-slate-500 mt-1.5 leading-relaxed">{row.sub}</p>
              </div>
            ))}
          </div>
        </Panel>
      </div>

      <Panel title="Priority Inventory Issues" actionLabel="View inventory" actionTo="/Inventory">
        <div className="overflow-x-auto">
          <table className="w-full text-sm min-w-[760px]">
            <thead>
              <tr className="border-b border-slate-700/40">
                {['SKU', 'Item', 'On Hand', 'Status', 'Notes'].map((heading) => (
                  <th
                    key={heading}
                    className="text-left px-4 py-2 text-[10px] font-semibold text-slate-500 uppercase tracking-[0.22em]"
                  >
                    {heading}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {livePriorityIssues.length === 0 ? (
                <tr><td colSpan={5} className="px-4 py-6 text-center text-xs text-slate-500">No priority issues detected — all items above reorder points.</td></tr>
              ) : livePriorityIssues.map((row, index) => (
                <tr
                  key={row.sku}
                  className={`border-b border-slate-800/80 last:border-0 ${index % 2 === 0 ? '' : 'bg-slate-800/20'}`}
                >
                  <td className="px-4 py-2.5 font-mono text-xs text-slate-500">{row.sku}</td>
                  <td className="px-4 py-2.5 text-sm text-slate-200">{row.item}</td>
                  <td className="px-4 py-2.5 text-sm text-slate-300 font-mono">{row.onHand}</td>
                  <td className="px-4 py-2.5">
                    <span className={`text-xs font-semibold ${statusStyle[row.status]}`}>{row.status}</span>
                  </td>
                  <td className="px-4 py-2.5 text-xs text-slate-500">{row.note}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Panel>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-3">
        <Panel title="Recent Exceptions & Activity">
          <div className="divide-y divide-slate-800/80">
            {liveRecentActivity.map((row, index) => (
              <div key={`${row.time}-${index}`} className="px-4 py-2.5 flex gap-3 items-start">
                <span className="text-[10px] text-slate-600 mt-0.5 whitespace-nowrap w-16 flex-shrink-0">{row.time}</span>
                <div className="min-w-0">
                  <p className={`text-[11px] uppercase tracking-[0.18em] ${row.tone}`}>{row.type}</p>
                  <p className="text-xs text-slate-400 leading-relaxed mt-1">{row.event}</p>
                </div>
              </div>
            ))}
          </div>
        </Panel>

        <Panel title="Pending Orders" actionLabel="View orders" actionTo="/Orders">
          <div className="divide-y divide-slate-800/80">
            {livePendingOrders.map((order) => (
              <div key={order.po} className="px-4 py-2.5 flex items-center gap-3">
                <span className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${urgencyDot[order.urgency]}`} />
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-mono text-slate-300">{order.po}</p>
                  <p className="text-[11px] text-slate-500 truncate mt-1">{order.supplier}</p>
                </div>
                <span className={`text-[10px] px-2 py-1 rounded-full font-medium flex-shrink-0 ${orderStatusStyle[order.status]}`}>
                  {order.status}
                </span>
              </div>
            ))}
          </div>
        </Panel>

        <Panel title="Quick Actions">
          <div className="p-2">
            {quickActions.map(({ label, to }) => (
              <Link
                key={label}
                to={to}
                className="flex items-center justify-between px-3 py-2.5 rounded-xl hover:bg-slate-800 transition-colors text-sm text-slate-300 hover:text-white group"
              >
                <span>{label}</span>
                <ArrowRight size={12} className="text-slate-600 group-hover:text-slate-400 transition-colors" />
              </Link>
            ))}
          </div>
        </Panel>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        <div className="rounded-2xl border border-slate-200 bg-white px-4 py-3">
          <div className="flex items-center gap-2 text-sm text-slate-700">
            <PackageCheck size={16} className="text-emerald-500" />
            <span className="font-medium">Receiving health</span>
          </div>
          <p className="text-xs text-slate-500 mt-1.5">1 delivery overdue · 1 due today · 1 partially received order needs review.</p>
        </div>
        <div className="rounded-2xl border border-slate-200 bg-white px-4 py-3">
          <div className="flex items-center gap-2 text-sm text-slate-700">
            <Trash2 size={16} className="text-red-500" />
            <span className="font-medium">Waste watch</span>
          </div>
          <p className="text-xs text-slate-500 mt-1.5">Three waste exceptions this week, led by softener and stain remover lines.</p>
        </div>
        <div className="rounded-2xl border border-slate-200 bg-white px-4 py-3">
          <div className="flex items-center gap-2 text-sm text-slate-700">
            <DollarSign size={16} className="text-sky-500" />
            <span className="font-medium">Value at risk</span>
          </div>
          <p className="text-xs text-slate-500 mt-1.5">₱12.4k of stock exposure is tied to items already below preferred cover.</p>
        </div>
      </div>
    </div>
  );
}