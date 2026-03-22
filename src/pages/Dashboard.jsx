import { Link } from 'react-router-dom';
import { AlertTriangle, Trash2, ShoppingCart, ArrowRight } from 'lucide-react';

const kpiCards = [
  {
    label: 'Low Stock',
    value: '6',
    sub: 'items below reorder threshold',
    icon: AlertTriangle,
    iconColor: 'text-amber-400',
    accent: 'border-amber-500/30',
  },
  {
    label: 'Waste Flagged',
    value: '3',
    sub: 'exceptions this week',
    icon: Trash2,
    iconColor: 'text-red-400',
    accent: 'border-red-500/30',
  },
  {
    label: 'Orders Pending',
    value: '4',
    sub: 'draft & submitted orders',
    icon: ShoppingCart,
    iconColor: 'text-blue-400',
    accent: 'border-blue-500/30',
  },
];

const priorityIssues = [
  { sku: 'CHM-001', item: 'Premium Detergent 20L',  onHand: 4,   status: 'Reorder' },
  { sku: 'MNT-001', item: 'Machine Descaler',        onHand: 3,   status: 'Reorder' },
  { sku: 'CHM-003', item: 'Bleach 5L',               onHand: 0,   status: 'Out'     },
  { sku: 'CHM-004', item: 'Stain Remover 2L',        onHand: 8,   status: 'Reorder' },
  { sku: 'CHM-002', item: 'Fabric Softener 20L',     onHand: 18,  status: 'OK'      },
  { sku: 'PKG-002', item: 'Garment Tag Roll',         onHand: 5,   status: 'Reorder' },
];

const recentActivity = [
  { time: '08:14',  event: 'Stock adjusted — Bleach 5L → 0 units (wastage)' },
  { time: '07:52',  event: 'Draft order PO-2026-023 created from Gap Scan' },
  { time: 'Yesterday', event: 'PO-2026-022 submitted — HangerCo Wholesale' },
  { time: 'Yesterday', event: 'Receiving confirmed — LaundryChem Direct (8 drums)' },
  { time: '2d ago',    event: 'Waste exception logged — Stain Remover batch expiry' },
];

const draftOrders = [
  { po: 'PO-2026-023', supplier: 'ProWash Ingredients',  status: 'Draft',     urgency: 'high'   },
  { po: 'PO-2026-022', supplier: 'HangerCo Wholesale',   status: 'Draft',     urgency: 'medium' },
  { po: 'PO-2026-001', supplier: 'ChemSupply Co',        status: 'Submitted', urgency: 'low'    },
  { po: 'PO-2026-002', supplier: 'CleanTex Distributors',status: 'Awaiting Delivery', urgency: 'low' },
];

const statusStyle = {
  Reorder: 'bg-amber-50 text-amber-700 border border-amber-200',
  Out:     'bg-red-50 text-red-700 border border-red-200',
  OK:      'bg-green-50 text-green-700 border border-green-200',
};

const orderStatusStyle = {
  'Draft':            'bg-muted text-muted-foreground border border-border',
  'Submitted':        'bg-blue-50 text-blue-700 border border-blue-200',
  'Awaiting Delivery':'bg-amber-50 text-amber-700 border border-amber-200',
};

const urgencyDot = {
  high:   'bg-red-400',
  medium: 'bg-amber-400',
  low:    'bg-green-400',
};

export default function Dashboard() {
  return (
    <div className="p-6 space-y-6 max-w-[1200px]">

      {/* Page title */}
      <div>
        <h1 className="text-lg font-semibold text-foreground">Operations Overview</h1>
        <p className="text-xs text-muted-foreground mt-0.5">Today — 22 Mar 2026 · Invyra Laundry</p>
      </div>

      {/* KPI Cards — dark operational style */}
      <div className="grid grid-cols-3 gap-4">
        {kpiCards.map(({ label, value, sub, icon: Icon, iconColor, accent }) => (
          <div
            key={label}
            className={`bg-slate-900 border ${accent} rounded-lg px-5 py-4 flex items-start justify-between`}
          >
            <div>
              <p className="text-xs text-slate-400 uppercase tracking-wide font-medium mb-1">{label}</p>
              <p className="text-3xl font-bold text-white leading-none mb-1.5">{value}</p>
              <p className="text-xs text-slate-500">{sub}</p>
            </div>
            <Icon className={`w-5 h-5 mt-0.5 ${iconColor}`} />
          </div>
        ))}
      </div>

      {/* Priority Issues table */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <h2 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Priority Inventory Issues</h2>
          <Link to="/Inventory" className="text-xs text-primary hover:underline flex items-center gap-1">
            View all <ArrowRight size={11} />
          </Link>
        </div>
        <div className="border border-border rounded overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-muted/50">
              <tr>
                {['SKU', 'Item', 'On Hand', 'Status'].map(h => (
                  <th key={h} className="text-left px-4 py-2 text-xs font-medium text-muted-foreground uppercase tracking-wide">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {priorityIssues.map((row, i) => (
                <tr key={row.sku} className={`border-t border-border ${i % 2 === 0 ? 'bg-card' : 'bg-background'}`}>
                  <td className="px-4 py-2.5 font-mono text-xs text-muted-foreground">{row.sku}</td>
                  <td className="px-4 py-2.5 text-sm font-medium">{row.item}</td>
                  <td className="px-4 py-2.5 text-sm">{row.onHand}</td>
                  <td className="px-4 py-2.5">
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${statusStyle[row.status]}`}>
                      {row.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Bottom row: activity + orders + quick actions */}
      <div className="grid grid-cols-3 gap-4">

        {/* Recent Stock Activity */}
        <div className="col-span-1">
          <h2 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">Recent Activity</h2>
          <div className="border border-border rounded bg-card divide-y divide-border">
            {recentActivity.map((row, i) => (
              <div key={i} className="px-4 py-2.5 flex gap-3 items-start">
                <span className="text-[10px] text-muted-foreground mt-0.5 whitespace-nowrap w-16 flex-shrink-0">{row.time}</span>
                <p className="text-xs text-foreground leading-relaxed">{row.event}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Pending Orders */}
        <div className="col-span-1">
          <div className="flex items-center justify-between mb-2">
            <h2 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Pending Orders</h2>
            <Link to="/Orders" className="text-xs text-primary hover:underline flex items-center gap-1">
              View all <ArrowRight size={11} />
            </Link>
          </div>
          <div className="border border-border rounded bg-card divide-y divide-border">
            {draftOrders.map((o) => (
              <div key={o.po} className="px-4 py-2.5 flex items-center gap-3">
                <span className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${urgencyDot[o.urgency]}`} />
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-mono text-foreground">{o.po}</p>
                  <p className="text-[11px] text-muted-foreground truncate">{o.supplier}</p>
                </div>
                <span className={`text-[10px] px-1.5 py-0.5 rounded font-medium flex-shrink-0 ${orderStatusStyle[o.status]}`}>
                  {o.status}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Quick Actions */}
        <div className="col-span-1">
          <h2 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">Quick Actions</h2>
          <div className="flex flex-col gap-2">
            {[
              { label: 'Open Inventory',  to: '/Inventory'     },
              { label: 'Review Orders',   to: '/Orders'        },
              { label: 'View Low Stock',  to: '/GapScan'       },
              { label: 'Run Gap Scan',    to: '/GapScan'       },
              { label: 'Reorder Review',  to: '/ReorderReview' },
            ].map(({ label, to }) => (
              <Link
                key={label}
                to={to}
                className="flex items-center justify-between px-4 py-2.5 border border-border rounded bg-card hover:bg-muted transition-colors text-sm text-foreground"
              >
                {label}
                <ArrowRight size={13} className="text-muted-foreground" />
              </Link>
            ))}
          </div>
        </div>
      </div>

    </div>
  );
}