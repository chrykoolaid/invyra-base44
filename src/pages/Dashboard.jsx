import { Link } from 'react-router-dom';
import {
  AlertTriangle,
  ArrowRight,
  Boxes,
  CalendarClock,
  CircleAlert,
  DollarSign,
  PackageCheck,
  PackageX,
  Settings2,
  ShoppingCart,
  Trash2,
  TriangleAlert,
} from 'lucide-react';

const dashboardMeta = {
  title: 'Operations Overview',
  date: '27 Mar 2026',
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
};

const urgencyDot = {
  high: 'bg-red-400',
  medium: 'bg-amber-400',
  low: 'bg-emerald-400',
};

function Panel({ title, actionLabel, actionTo, children, className = '' }) {
  return (
    <div className={`bg-slate-900 rounded-xl border border-slate-700/60 overflow-hidden ${className}`}>
      <div className="flex items-center justify-between px-5 py-3 border-b border-slate-700/60">
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
  return (
    <div className="p-5 lg:p-6 space-y-5 max-w-[1380px]">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <h1 className="text-lg font-semibold text-foreground">{dashboardMeta.title}</h1>
          <p className="text-sm text-muted-foreground mt-1">
            {dashboardMeta.date} · {dashboardMeta.location}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2 text-xs">
          <span className="inline-flex items-center gap-1 rounded-full border border-slate-300 bg-white px-3 py-1 text-slate-700">
            <Boxes size={12} /> Main Location
          </span>
          <span className="inline-flex items-center gap-1 rounded-full border border-slate-300 bg-white px-3 py-1 text-slate-700">
            <CalendarClock size={12} /> {dashboardMeta.sync}
          </span>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-5 gap-3">
        {kpiCards.map(({ label, value, sub, helper, icon: Icon, iconColor }) => (
          <div
            key={label}
            className="bg-slate-900 rounded-xl border border-slate-700/60 px-5 pt-4 pb-4 flex flex-col gap-2 min-h-[148px]"
          >
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-semibold tracking-[0.22em] text-slate-400">{label}</span>
              <Icon className={`w-4 h-4 ${iconColor}`} strokeWidth={1.8} />
            </div>
            <p className="text-4xl font-bold text-white leading-none tracking-tight">{value}</p>
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
                className="block px-5 py-3 hover:bg-slate-800/40 transition-colors"
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
          <div className="p-4 space-y-3">
            {receivingWatch.map((row) => (
              <div
                key={row.title}
                className={`rounded-lg border border-slate-800 bg-slate-950/40 p-3 border-l-4 ${row.tone}`}
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
          <div className="p-4 space-y-3">
            {setupHealth.map((row) => (
              <div key={row.label} className="rounded-lg border border-slate-800 bg-slate-950/40 px-3 py-3">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">{row.label}</p>
                    <p className={`text-sm mt-2 ${row.tone}`}>{row.value}</p>
                  </div>
                  <CircleAlert className="w-4 h-4 text-slate-500 mt-0.5 flex-shrink-0" />
                </div>
                <p className="text-xs text-slate-500 mt-2 leading-relaxed">{row.sub}</p>
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
                    className="text-left px-5 py-2 text-[10px] font-semibold text-slate-500 uppercase tracking-[0.22em]"
                  >
                    {heading}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {priorityIssues.map((row, index) => (
                <tr
                  key={row.sku}
                  className={`border-b border-slate-800/80 last:border-0 ${index % 2 === 0 ? '' : 'bg-slate-800/20'}`}
                >
                  <td className="px-5 py-3 font-mono text-xs text-slate-500">{row.sku}</td>
                  <td className="px-5 py-3 text-sm text-slate-200">{row.item}</td>
                  <td className="px-5 py-3 text-sm text-slate-300 font-mono">{row.onHand}</td>
                  <td className="px-5 py-3">
                    <span className={`text-xs font-semibold ${statusStyle[row.status]}`}>{row.status}</span>
                  </td>
                  <td className="px-5 py-3 text-xs text-slate-500">{row.note}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Panel>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-3">
        <Panel title="Recent Exceptions & Activity">
          <div className="divide-y divide-slate-800/80">
            {recentActivity.map((row, index) => (
              <div key={`${row.time}-${index}`} className="px-5 py-3 flex gap-3 items-start">
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
            {draftOrders.map((order) => (
              <div key={order.po} className="px-5 py-3 flex items-center gap-3">
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
                className="flex items-center justify-between px-3 py-3 rounded-lg hover:bg-slate-800 transition-colors text-sm text-slate-300 hover:text-white group"
              >
                <span>{label}</span>
                <ArrowRight size={12} className="text-slate-600 group-hover:text-slate-400 transition-colors" />
              </Link>
            ))}
          </div>
        </Panel>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        <div className="rounded-xl border border-slate-200 bg-white px-4 py-3">
          <div className="flex items-center gap-2 text-sm text-slate-700">
            <PackageCheck size={16} className="text-emerald-500" />
            <span className="font-medium">Receiving health</span>
          </div>
          <p className="text-xs text-slate-500 mt-2">1 delivery overdue · 1 due today · 1 partially received order needs review.</p>
        </div>
        <div className="rounded-xl border border-slate-200 bg-white px-4 py-3">
          <div className="flex items-center gap-2 text-sm text-slate-700">
            <Trash2 size={16} className="text-red-500" />
            <span className="font-medium">Waste watch</span>
          </div>
          <p className="text-xs text-slate-500 mt-2">Three waste exceptions this week, led by softener and stain remover lines.</p>
        </div>
        <div className="rounded-xl border border-slate-200 bg-white px-4 py-3">
          <div className="flex items-center gap-2 text-sm text-slate-700">
            <DollarSign size={16} className="text-sky-500" />
            <span className="font-medium">Value at risk</span>
          </div>
          <p className="text-xs text-slate-500 mt-2">₱12.4k of stock exposure is tied to items already below preferred cover.</p>
        </div>
      </div>
    </div>
  );
}
