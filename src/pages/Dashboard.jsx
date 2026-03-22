import { Link } from 'react-router-dom';
import { AlertTriangle, Trash2, ShoppingCart, ArrowRight } from 'lucide-react';

const kpiCards = [
  {
    label: 'LOW STOCK',
    value: '6',
    sub: 'items below threshold',
    icon: AlertTriangle,
    iconColor: 'text-amber-400',
  },
  {
    label: 'WASTE FLAGGED',
    value: '3',
    sub: 'exceptions this week',
    icon: Trash2,
    iconColor: 'text-red-400',
  },
  {
    label: 'ORDERS PENDING',
    value: '4',
    sub: 'draft & submitted',
    icon: ShoppingCart,
    iconColor: 'text-sky-400',
  },
];

const priorityIssues = [
  { sku: 'CHM-001', item: 'Detergent 5L',      onHand: 2,   status: 'Reorder' },
  { sku: 'CHM-002', item: 'Softener 2L',        onHand: 0,   status: 'Out'     },
  { sku: 'OPS-002', item: 'Hangers (Standard)', onHand: 45,  status: 'OK'      },
  { sku: 'CHM-004', item: 'Stain Remover 2L',   onHand: 5,   status: 'Reorder' },
  { sku: 'PKG-001', item: 'Packaging Rolls',    onHand: 0,   status: 'Out'     },
  { sku: 'CHM-003', item: 'Bleach 5L',          onHand: 12,  status: 'Reorder' },
];

const recentActivity = [
  { time: '08:14',     event: 'Softener 2L adjusted → 0 units (wastage)' },
  { time: '07:52',     event: 'Draft PO-2026-023 created from Gap Scan' },
  { time: 'Yesterday', event: 'PO-2026-022 submitted — HangerCo Wholesale' },
  { time: 'Yesterday', event: 'Receiving confirmed — LaundryChem Direct' },
  { time: '2d ago',    event: 'Waste exception — Stain Remover batch expiry' },
];

const draftOrders = [
  { po: 'PO-2026-023', supplier: 'ProWash Ingredients',   status: 'Draft',            urgency: 'high'   },
  { po: 'PO-2026-022', supplier: 'HangerCo Wholesale',    status: 'Draft',            urgency: 'medium' },
  { po: 'PO-2026-001', supplier: 'ChemSupply Co',         status: 'Submitted',        urgency: 'low'    },
  { po: 'PO-2026-002', supplier: 'CleanTex Distributors', status: 'Awaiting Delivery',urgency: 'low'    },
];

const statusStyle = {
  Reorder: 'text-amber-400',
  Out:     'text-red-400',
  OK:      'text-emerald-400',
};

const orderStatusStyle = {
  'Draft':             'bg-slate-700 text-slate-300',
  'Submitted':         'bg-sky-900/60 text-sky-300',
  'Awaiting Delivery': 'bg-amber-900/40 text-amber-300',
};

const urgencyDot = {
  high:   'bg-red-400',
  medium: 'bg-amber-400',
  low:    'bg-emerald-400',
};

const quickActions = [
  { label: 'Open Inventory',  to: '/Inventory'     },
  { label: 'Review Orders',   to: '/Orders'        },
  { label: 'View Low Stock',  to: '/GapScan'       },
  { label: 'Run Gap Scan',    to: '/GapScan'       },
  { label: 'Reorder Review',  to: '/ReorderReview' },
];

export default function Dashboard() {
  return (
    <div className="p-5 space-y-5 max-w-[1200px]">

      {/* Page header — compact */}
      <div className="flex items-baseline justify-between">
        <div>
          <h1 className="text-sm font-semibold text-foreground">Operations Overview</h1>
          <p className="text-xs text-muted-foreground mt-0.5">22 Mar 2026 · Invyra Laundry</p>
        </div>
      </div>

      {/* ── KPI Cards ── */}
      <div className="grid grid-cols-3 gap-3">
        {kpiCards.map(({ label, value, sub, icon: Icon, iconColor }) => (
          <div
            key={label}
            className="bg-slate-900 rounded-lg border border-slate-700/60 px-5 pt-4 pb-4 flex flex-col gap-2"
          >
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-semibold tracking-widest text-slate-400">{label}</span>
              <Icon className={`w-4 h-4 ${iconColor}`} strokeWidth={1.8} />
            </div>
            <p className="text-4xl font-bold text-white leading-none tracking-tight">{value}</p>
            <p className="text-xs text-slate-500">{sub}</p>
          </div>
        ))}
      </div>

      {/* ── Priority Issues table — dark panel ── */}
      <div className="bg-slate-900 rounded-lg border border-slate-700/60 overflow-hidden">
        <div className="flex items-center justify-between px-5 py-3 border-b border-slate-700/60">
          <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-widest">Priority Inventory Issues</span>
          <Link to="/Inventory" className="text-xs text-sky-400 hover:text-sky-300 flex items-center gap-1 transition-colors">
            View all <ArrowRight size={11} />
          </Link>
        </div>
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-slate-700/40">
              {['SKU', 'Item', 'On Hand', 'Status'].map(h => (
                <th key={h} className="text-left px-5 py-2 text-[10px] font-semibold text-slate-500 uppercase tracking-widest">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {priorityIssues.map((row, i) => (
              <tr
                key={row.sku}
                className={`border-b border-slate-800/80 last:border-0 ${i % 2 === 0 ? '' : 'bg-slate-800/20'}`}
              >
                <td className="px-5 py-2.5 font-mono text-xs text-slate-500">{row.sku}</td>
                <td className="px-5 py-2.5 text-sm text-slate-200">{row.item}</td>
                <td className="px-5 py-2.5 text-sm text-slate-300 font-mono">{row.onHand}</td>
                <td className="px-5 py-2.5">
                  <span className={`text-xs font-semibold ${statusStyle[row.status]}`}>{row.status}</span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* ── Bottom row ── */}
      <div className="grid grid-cols-3 gap-3">

        {/* Recent Activity */}
        <div className="bg-slate-900 rounded-lg border border-slate-700/60 overflow-hidden">
          <div className="px-5 py-3 border-b border-slate-700/60">
            <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-widest">Recent Activity</span>
          </div>
          <div className="divide-y divide-slate-800/80">
            {recentActivity.map((row, i) => (
              <div key={i} className="px-5 py-2.5 flex gap-3 items-start">
                <span className="text-[10px] text-slate-600 mt-0.5 whitespace-nowrap w-16 flex-shrink-0">{row.time}</span>
                <p className="text-xs text-slate-400 leading-relaxed">{row.event}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Pending Orders */}
        <div className="bg-slate-900 rounded-lg border border-slate-700/60 overflow-hidden">
          <div className="flex items-center justify-between px-5 py-3 border-b border-slate-700/60">
            <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-widest">Pending Orders</span>
            <Link to="/Orders" className="text-xs text-sky-400 hover:text-sky-300 flex items-center gap-1 transition-colors">
              View all <ArrowRight size={11} />
            </Link>
          </div>
          <div className="divide-y divide-slate-800/80">
            {draftOrders.map((o) => (
              <div key={o.po} className="px-5 py-2.5 flex items-center gap-3">
                <span className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${urgencyDot[o.urgency]}`} />
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-mono text-slate-300">{o.po}</p>
                  <p className="text-[11px] text-slate-500 truncate">{o.supplier}</p>
                </div>
                <span className={`text-[10px] px-1.5 py-0.5 rounded font-medium flex-shrink-0 ${orderStatusStyle[o.status]}`}>
                  {o.status}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Quick Actions */}
        <div className="bg-slate-900 rounded-lg border border-slate-700/60 overflow-hidden">
          <div className="px-5 py-3 border-b border-slate-700/60">
            <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-widest">Quick Actions</span>
          </div>
          <div className="p-2">
            {quickActions.map(({ label, to }) => (
              <Link
                key={label}
                to={to}
                className="flex items-center justify-between px-3 py-2.5 rounded-md hover:bg-slate-800 transition-colors text-sm text-slate-300 hover:text-white group"
              >
                {label}
                <ArrowRight size={12} className="text-slate-600 group-hover:text-slate-400 transition-colors" />
              </Link>
            ))}
          </div>
        </div>

      </div>
    </div>
  );
}