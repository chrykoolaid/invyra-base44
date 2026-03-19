import { useState, useEffect } from 'react';
import { Plus, Search, X, ChevronDown, AlertCircle } from 'lucide-react';

const ordersData = [
  {
    id: 'PO-2026-001', supplier: 'ChemSupply Co',         created: '2026-03-17', expected: '2026-03-24',
    status: 'Submitted', createdBy: 'Alan M.', items: [
      { sku: 'CHM-001', name: 'Premium Detergent 20L', qty: 20, unit: 'drum',   unitCost: 32.00 },
      { sku: 'MNT-001', name: 'Machine Descaler',       qty: 10, unit: 'bottle', unitCost: 19.00 },
    ]
  },
  {
    id: 'PO-2026-002', supplier: 'CleanTex Distributors', created: '2026-03-15', expected: '2026-03-22',
    status: 'Awaiting Delivery', createdBy: 'Tracy L.', items: [
      { sku: 'CHM-003', name: 'Bleach 5L',         qty: 18, unit: 'bottle', unitCost: 8.00 },
      { sku: 'CHM-004', name: 'Stain Remover 2L',  qty: 12, unit: 'bottle', unitCost: 11.00 },
    ]
  },
  {
    id: 'PO-2026-003', supplier: 'PackPro Solutions',     created: '2026-03-12', expected: '2026-03-19',
    status: 'Partially Received', createdBy: 'Ben O.', items: [
      { sku: 'PKG-001', name: 'Packaging Bag Large', qty: 500, unit: 'pack',  unitCost: 0.15 },
      { sku: 'PKG-002', name: 'Garment Tag Roll',    qty: 10,  unit: 'roll',  unitCost: 4.50 },
    ]
  },
  {
    id: 'PO-2026-004', supplier: 'LaundryChem Direct',    created: '2026-03-08', expected: '2026-03-15',
    status: 'Received', createdBy: 'Tracy L.', items: [
      { sku: 'CHM-002', name: 'Fabric Softener 20L', qty: 8, unit: 'drum', unitCost: 28.50 },
    ]
  },
  {
    id: 'PO-2026-005', supplier: 'SafetyFirst Supplies',  created: '2026-03-05', expected: '2026-03-12',
    status: 'Received', createdBy: 'Alan M.', items: [
      { sku: 'OPS-001', name: 'Gloves Disposable', qty: 200, unit: 'box', unitCost: 0.08 },
    ]
  },
  {
    id: 'PO-2026-006', supplier: 'HangerCo Wholesale',    created: '2026-03-01', expected: '2026-03-10',
    status: 'Cancelled', createdBy: 'Sam P.', items: [
      { sku: 'OPS-002', name: 'Hanger Standard', qty: 200, unit: 'bundle', unitCost: 0.22 },
    ]
  },
  {
    id: 'PO-2026-007', supplier: 'ProWash Ingredients',   created: '2026-03-18', expected: '2026-03-28',
    status: 'Draft', createdBy: 'Ben O.', items: [
      { sku: 'CHM-001', name: 'Premium Detergent 20L', qty: 15, unit: 'drum', unitCost: 32.00 },
    ]
  },
];

const statusStyle = {
  'Draft':               'bg-muted text-muted-foreground border border-border',
  'Submitted':           'bg-blue-50 text-blue-700 border border-blue-200',
  'Awaiting Delivery':   'bg-amber-50 text-amber-700 border border-amber-200',
  'Partially Received':  'bg-orange-50 text-orange-700 border border-orange-200',
  'Received':            'bg-green-50 text-green-700 border border-green-200',
  'Cancelled':           'bg-red-50 text-red-400 border border-red-200',
};

const ALL_STATUSES = ['All', 'Draft', 'Submitted', 'Awaiting Delivery', 'Partially Received', 'Received', 'Cancelled'];

export default function Orders() {
  const [query, setQuery]         = useState('');
  const [statusFilter, setStatus] = useState('All');
  const [selected, setSelected]   = useState(null);

  const filtered = ordersData.filter(o => {
    const matchQuery = o.id.toLowerCase().includes(query.toLowerCase()) ||
      o.supplier.toLowerCase().includes(query.toLowerCase());
    const matchStatus = statusFilter === 'All' || o.status === statusFilter;
    return matchQuery && matchStatus;
  });

  const orderTotal = (items) => items.reduce((sum, i) => sum + i.qty * i.unitCost, 0);

  return (
    <div className="p-6 flex flex-col gap-5">
      <h1 className="text-xl font-semibold text-foreground">Orders</h1>

      {/* Search / filter / actions */}
      <div className="flex flex-wrap items-center gap-2">
        <div className="relative">
          <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <input
            type="text"
            value={query}
            onChange={e => setQuery(e.target.value)}
            placeholder="Search orders…"
            className="h-8 w-64 border border-border rounded pl-8 pr-3 text-sm focus:outline-none focus:ring-1 focus:ring-ring bg-card"
          />
        </div>

        <div className="flex items-center gap-1.5 border border-border rounded bg-card px-3 h-8">
          <ChevronDown size={13} className="text-muted-foreground" />
          <select
            value={statusFilter}
            onChange={e => setStatus(e.target.value)}
            className="text-sm bg-transparent focus:outline-none cursor-pointer pr-1"
          >
            {ALL_STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
          </select>
        </div>

        <button className="flex items-center gap-1.5 h-8 px-3 text-sm bg-primary text-primary-foreground rounded hover:opacity-90 transition-opacity ml-auto">
          <Plus size={13} /> New Order
        </button>
      </div>

      <div className={`flex gap-5 ${selected ? 'items-start' : ''}`}>
        {/* Order table */}
        <div className={`border border-border rounded overflow-hidden ${selected ? 'flex-1' : 'w-full'}`}>
          <table className="w-full text-sm">
            <thead className="bg-muted text-muted-foreground text-xs uppercase tracking-wide">
              <tr>
                {['Order #', 'Supplier', 'Created', 'Expected', 'Status', 'Items', 'Created By'].map(h => (
                  <th key={h} className="text-left px-4 py-2.5 font-medium whitespace-nowrap">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map((order, i) => (
                <tr
                  key={order.id}
                  onClick={() => setSelected(selected?.id === order.id ? null : order)}
                  className={`border-t border-border cursor-pointer transition-colors ${
                    selected?.id === order.id ? 'bg-primary/5' : i % 2 === 0 ? 'bg-card' : 'bg-background'
                  } hover:bg-accent/40`}
                >
                  <td className="px-4 py-2.5 font-mono text-xs text-muted-foreground">{order.id}</td>
                  <td className="px-4 py-2.5 font-medium">{order.supplier}</td>
                  <td className="px-4 py-2.5 text-muted-foreground">{order.created}</td>
                  <td className="px-4 py-2.5 text-muted-foreground">{order.expected}</td>
                  <td className="px-4 py-2.5">
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${statusStyle[order.status]}`}>
                      {order.status}
                    </span>
                  </td>
                  <td className="px-4 py-2.5 text-muted-foreground">{order.items.length}</td>
                  <td className="px-4 py-2.5 text-muted-foreground">{order.createdBy}</td>
                </tr>
              ))}
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={7} className="px-4 py-8 text-center text-muted-foreground text-sm">No orders found.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Detail panel */}
        {selected && (
          <div className="w-80 border border-border rounded bg-card text-sm flex-shrink-0">
            <div className="flex items-center justify-between px-4 py-3 border-b border-border">
              <span className="font-semibold text-foreground">{selected.id}</span>
              <button onClick={() => setSelected(null)} className="text-muted-foreground hover:text-foreground transition-colors">
                <X size={15} />
              </button>
            </div>
            <div className="px-4 py-3 space-y-1 border-b border-border text-muted-foreground text-xs">
              <div className="flex justify-between"><span>Supplier</span><span className="text-foreground font-medium">{selected.supplier}</span></div>
              <div className="flex justify-between"><span>Created</span><span>{selected.created}</span></div>
              <div className="flex justify-between"><span>Expected</span><span>{selected.expected}</span></div>
              <div className="flex justify-between"><span>Created By</span><span>{selected.createdBy}</span></div>
              <div className="flex justify-between items-center pt-1">
                <span>Status</span>
                <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${statusStyle[selected.status]}`}>{selected.status}</span>
              </div>
            </div>
            <div className="px-4 py-3">
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-2">Line Items</p>
              <table className="w-full text-xs">
                <thead>
                  <tr className="text-muted-foreground">
                    <th className="text-left py-1 font-medium">Item</th>
                    <th className="text-right py-1 font-medium">Qty</th>
                    <th className="text-right py-1 font-medium">Total</th>
                  </tr>
                </thead>
                <tbody>
                  {selected.items.map(item => (
                    <tr key={item.sku} className="border-t border-border">
                      <td className="py-1.5">
                        <div className="text-foreground font-medium">{item.name}</div>
                        <div className="text-muted-foreground font-mono">{item.sku}</div>
                      </td>
                      <td className="py-1.5 text-right text-muted-foreground">{item.qty} {item.unit}</td>
                      <td className="py-1.5 text-right font-medium">${(item.qty * item.unitCost).toFixed(2)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
              <div className="flex justify-between items-center pt-3 border-t border-border mt-2">
                <span className="text-xs text-muted-foreground font-medium">Order Total</span>
                <span className="font-semibold text-foreground">${orderTotal(selected.items).toFixed(2)}</span>
              </div>
            </div>
          </div>
        )}
      </div>

      <p className="text-xs text-muted-foreground">{filtered.length} order{filtered.length !== 1 ? 's' : ''}</p>
    </div>
  );
}