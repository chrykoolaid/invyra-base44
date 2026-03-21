import { useState, useEffect } from 'react';
import { Plus, Search, ChevronDown, AlertCircle } from 'lucide-react';
import OrderWorkspaceModal from '@/components/OrderWorkspaceModal';

const ordersData = [
  {
    id: 1,
    orderNumber:      'PO-2026-001',
    status:           'Submitted',
    supplier:         'ChemSupply Co',
    expectedDate:     '2026-03-24',
    createdBy:        'Alan M.',
    createdOn:        '2026-03-17',
    source:           'Manual',
    notes:            '',
    sourceModule:     'Manual Entry',
    triggerReason:    'Manual reorder',
    urgency:          'low',
    coverageDays:     14,
    onHandAtCreation: 12,
    suggestedQty:     20,
  },
  {
    id: 2,
    orderNumber:      'PO-2026-002',
    status:           'Awaiting Delivery',
    supplier:         'CleanTex Distributors',
    expectedDate:     '2026-03-22',
    createdBy:        'Tracy L.',
    createdOn:        '2026-03-15',
    source:           'Manual',
    notes:            '',
    sourceModule:     'Manual Entry',
    triggerReason:    'Scheduled replenishment',
    urgency:          'low',
    coverageDays:     10,
    onHandAtCreation: 30,
    suggestedQty:     18,
  },
  {
    id: 3,
    orderNumber:      'PO-2026-003',
    status:           'Partially Received',
    supplier:         'PackPro Solutions',
    expectedDate:     '2026-03-19',
    createdBy:        'Ben O.',
    createdOn:        '2026-03-12',
    source:           'Manual',
    notes:            '',
    sourceModule:     'Manual Entry',
    triggerReason:    'Packaging restock',
    urgency:          'medium',
    coverageDays:     7,
    onHandAtCreation: 200,
    suggestedQty:     500,
  },
  {
    id: 4,
    orderNumber:      'PO-2026-004',
    status:           'Received',
    supplier:         'LaundryChem Direct',
    expectedDate:     '2026-03-15',
    createdBy:        'Tracy L.',
    createdOn:        '2026-03-08',
    source:           'Manual',
    notes:            '',
    sourceModule:     'Manual Entry',
    triggerReason:    'Routine order',
    urgency:          'low',
    coverageDays:     14,
    onHandAtCreation: 5,
    suggestedQty:     8,
  },
  {
    id: 5,
    orderNumber:      'PO-2026-005',
    status:           'Received',
    supplier:         'SafetyFirst Supplies',
    expectedDate:     '2026-03-12',
    createdBy:        'Alan M.',
    createdOn:        '2026-03-05',
    source:           'Manual',
    notes:            '',
    sourceModule:     'Manual Entry',
    triggerReason:    'Safety stock replenishment',
    urgency:          'low',
    coverageDays:     21,
    onHandAtCreation: 100,
    suggestedQty:     200,
  },
  {
    id: 6,
    orderNumber:      'PO-2026-022',
    status:           'Draft',
    supplier:         'HangerCo Wholesale',
    expectedDate:     '2026-03-28',
    createdBy:        '1234',
    createdOn:        '2026-03-21',
    source:           'Reorder Review',
    notes:            'Created from Reorder Review',
    sourceModule:     'Reorder Review',
    triggerReason:    'Low stock / reorder threshold reached',
    urgency:          'medium',
    coverageDays:     0.0,
    onHandAtCreation: '—',
    suggestedQty:     7,
  },
  {
    id: 7,
    orderNumber:      'PO-2026-023',
    status:           'Draft',
    supplier:         'ProWash Ingredients',
    expectedDate:     '2026-04-02',
    createdBy:        'Ben O.',
    createdOn:        '2026-03-21',
    source:           'Gap Scan',
    notes:            'Flagged by Gap Scan — critical level',
    sourceModule:     'Gap Scan',
    triggerReason:    'Critical stock level detected',
    urgency:          'high',
    coverageDays:     1.2,
    onHandAtCreation: 4,
    suggestedQty:     20,
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
  const [query, setQuery]           = useState('');
  const [statusFilter, setStatus]   = useState('All');
  const [modalOrder, setModalOrder] = useState(null);
  const [showBanner, setShowBanner] = useState(false);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get('source') === 'reorder_review') {
      setShowBanner(true);
      const t = setTimeout(() => setShowBanner(false), 5000);
      return () => clearTimeout(t);
    }
  }, []);

  const filtered = ordersData.filter(o => {
    const matchQuery  = o.orderNumber.toLowerCase().includes(query.toLowerCase()) ||
                        o.supplier.toLowerCase().includes(query.toLowerCase());
    const matchStatus = statusFilter === 'All' || o.status === statusFilter;
    return matchQuery && matchStatus;
  });

  return (
    <div className="p-6 flex flex-col gap-5">
      <div>
        <h1 className="text-xl font-semibold text-foreground">Orders</h1>
        <p className="text-sm text-muted-foreground mt-0.5">Purchase order queue, draft review, receiving, and status tracking.</p>
      </div>

      {showBanner && (
        <div className="flex items-center gap-2 p-3 bg-blue-50 border border-blue-200 rounded text-sm text-blue-700">
          <AlertCircle size={16} className="flex-shrink-0" />
          <span>Draft order created from Reorder Review</span>
        </div>
      )}

      {/* Toolbar */}
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

      {/* Orders queue table */}
      <div className="border border-border rounded overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-muted text-muted-foreground text-xs uppercase tracking-wide">
            <tr>
              {['Order #', 'Supplier', 'Status', 'Source', 'Created On', 'Expected Date'].map(h => (
                <th key={h} className="text-left px-4 py-2.5 font-medium whitespace-nowrap">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {filtered.map((order, i) => (
              <tr
                key={order.id}
                className={`border-t border-border transition-colors ${i % 2 === 0 ? 'bg-card' : 'bg-background'} hover:bg-accent/40`}
              >
                <td className="px-4 py-2.5">
                  <button
                    onClick={() => setModalOrder(order)}
                    className="font-mono text-xs text-primary hover:underline cursor-pointer transition-colors"
                  >
                    {order.orderNumber}
                  </button>
                </td>
                <td className="px-4 py-2.5 font-medium">{order.supplier}</td>
                <td className="px-4 py-2.5">
                  <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${statusStyle[order.status]}`}>
                    {order.status}
                  </span>
                </td>
                <td className="px-4 py-2.5 text-muted-foreground">{order.source}</td>
                <td className="px-4 py-2.5 text-muted-foreground">{order.createdOn}</td>
                <td className="px-4 py-2.5 text-muted-foreground">{order.expectedDate}</td>
              </tr>
            ))}
            {filtered.length === 0 && (
              <tr>
                <td colSpan={6} className="px-4 py-8 text-center text-muted-foreground text-sm">No orders found.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <p className="text-xs text-muted-foreground">{filtered.length} order{filtered.length !== 1 ? 's' : ''}</p>

      {/* Workspace modal */}
      {modalOrder && (
        <OrderWorkspaceModal
          order={modalOrder}
          onClose={() => setModalOrder(null)}
        />
      )}
    </div>
  );
}