import { useState, useEffect, useCallback } from 'react';
import { Plus, Search, ChevronDown, AlertCircle } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import DraftOrderWorkspace from '@/components/DraftOrderWorkspace';
import ActiveOrderWorkspace from '@/components/ActiveOrderWorkspace';

// Draft statuses — open in DraftOrderWorkspace modal
const DRAFT_STATUSES = new Set(['Draft']);

// Post-submit statuses — open in ActiveOrderWorkspace inline sub-page
const ACTIVE_STATUSES = new Set(['Submitted', 'Awaiting Delivery', 'Partially Received', 'Received', 'Cancelled']);

const initialOrders = [
  {
    id: 1, orderNumber: 'PO-2026-001', status: 'Submitted',
    supplier: 'ChemSupply Co', expectedDate: '2026-03-24',
    createdBy: 'Alan M.', createdOn: '2026-03-17',
    source: 'Manual', notes: '', sourceModule: 'Manual Entry',
    triggerReason: 'Manual reorder', urgency: 'low',
    coverageDays: 14, onHandAtCreation: 12, suggestedQty: 20,
    lines: [
      { line_id: 'l1-1', sku: 'CHM-001', name: 'Premium Detergent 20L', qty: 20, unit_cost: 45, supplier: 'ChemSupply Co', source: 'manual' },
      { line_id: 'l1-2', sku: 'MNT-001', name: 'Machine Descaler',       qty: 10, unit_cost: 22, supplier: 'ChemSupply Co', source: 'manual' },
    ],
  },
  {
    id: 2, orderNumber: 'PO-2026-002', status: 'Awaiting Delivery',
    supplier: 'CleanTex Distributors', expectedDate: '2026-03-22',
    createdBy: 'Tracy L.', createdOn: '2026-03-15',
    source: 'Manual', notes: '', sourceModule: 'Manual Entry',
    triggerReason: 'Scheduled replenishment', urgency: 'low',
    coverageDays: 10, onHandAtCreation: 30, suggestedQty: 18,
    lines: [
      { line_id: 'l2-1', sku: 'CHM-003', name: 'Bleach 5L',        qty: 18, unit_cost: 12, supplier: 'CleanTex Distributors', source: 'manual' },
      { line_id: 'l2-2', sku: 'CHM-004', name: 'Stain Remover 2L', qty: 12, unit_cost: 18, supplier: 'CleanTex Distributors', source: 'manual' },
    ],
  },
  {
    id: 3, orderNumber: 'PO-2026-003', status: 'Partially Received',
    supplier: 'PackPro Solutions', expectedDate: '2026-03-19',
    createdBy: 'Ben O.', createdOn: '2026-03-12',
    source: 'Manual', notes: '', sourceModule: 'Manual Entry',
    triggerReason: 'Packaging restock', urgency: 'medium',
    coverageDays: 7, onHandAtCreation: 200, suggestedQty: 500,
    lines: [
      { line_id: 'l3-1', sku: 'PKG-001', name: 'Packaging Bag Large', qty: 500, unit_cost: 0.50, supplier: 'PackPro Solutions', source: 'manual' },
      { line_id: 'l3-2', sku: 'PKG-002', name: 'Garment Tag Roll',     qty: 10,  unit_cost: 15,   supplier: 'PackPro Solutions', source: 'manual' },
    ],
  },
  {
    id: 4, orderNumber: 'PO-2026-004', status: 'Received',
    supplier: 'LaundryChem Direct', expectedDate: '2026-03-15',
    createdBy: 'Tracy L.', createdOn: '2026-03-08',
    source: 'Manual', notes: '', sourceModule: 'Manual Entry',
    triggerReason: 'Routine order', urgency: 'low',
    coverageDays: 14, onHandAtCreation: 5, suggestedQty: 8,
    lines: [
      { line_id: 'l4-1', sku: 'CHM-002', name: 'Fabric Softener 20L', qty: 8, unit_cost: 55, supplier: 'LaundryChem Direct', source: 'manual' },
    ],
  },
  {
    id: 5, orderNumber: 'PO-2026-005', status: 'Received',
    supplier: 'SafetyFirst Supplies', expectedDate: '2026-03-12',
    createdBy: 'Alan M.', createdOn: '2026-03-05',
    source: 'Manual', notes: '', sourceModule: 'Manual Entry',
    triggerReason: 'Safety stock replenishment', urgency: 'low',
    coverageDays: 21, onHandAtCreation: 100, suggestedQty: 200,
    lines: [
      { line_id: 'l5-1', sku: 'OPS-001', name: 'Gloves Disposable', qty: 200, unit_cost: 0.25, supplier: 'SafetyFirst Supplies', source: 'manual' },
    ],
  },
  {
    id: 6, orderNumber: 'PO-2026-022', status: 'Draft',
    supplier: 'HangerCo Wholesale', expectedDate: '2026-03-28',
    createdBy: '1234', createdOn: '2026-03-21',
    source: 'Reorder Review', notes: 'Created from Reorder Review',
    sourceModule: 'Reorder Review', triggerReason: 'Low stock / reorder threshold reached',
    urgency: 'medium', coverageDays: 0.0, onHandAtCreation: '—', suggestedQty: 7,
    lines: [],
  },
  {
    id: 7, orderNumber: 'PO-2026-023', status: 'Draft',
    supplier: 'ProWash Ingredients', expectedDate: '2026-04-02',
    createdBy: 'Ben O.', createdOn: '2026-03-21',
    source: 'Gap Scan', notes: 'Flagged by Gap Scan — critical level',
    sourceModule: 'Gap Scan', triggerReason: 'Critical stock level detected',
    urgency: 'high', coverageDays: 1.2, onHandAtCreation: 4, suggestedQty: 20,
    lines: [],
  },
];

const statusStyle = {
  'Draft':               'bg-muted text-muted-foreground border border-border',
  'Submitted':           'bg-blue-50 text-blue-700 border border-blue-200',
  'Confirmed':           'bg-violet-50 text-violet-700 border border-violet-200',
  'Awaiting Delivery':   'bg-amber-50 text-amber-700 border border-amber-200',
  'Partially Received':  'bg-orange-50 text-orange-700 border border-orange-200',
  'Received':            'bg-green-50 text-green-700 border border-green-200',
  'Cancelled':           'bg-red-50 text-red-400 border border-red-200',
};

const ALL_STATUSES = ['All', 'Draft', 'Submitted', 'Confirmed', 'Awaiting Delivery', 'Partially Received', 'Received', 'Cancelled'];

export default function Orders() {
  const [orders, setOrders]           = useState(initialOrders);
  const [query, setQuery]             = useState('');
  const [statusFilter, setStatus]     = useState('All');
  const [draftOrder, setDraftOrder]   = useState(null);
  const [activeOrder, setActiveOrder] = useState(null);
  const [showBanner, setShowBanner]   = useState(false);

  // Load live DB orders and merge/override static list
  const loadDbOrders = useCallback(async () => {
    const dbOrders = await base44.entities.PurchaseOrder.list('-created_date', 100);
    if (dbOrders && dbOrders.length > 0) {
      const mapped = dbOrders.map(o => ({
        id: o.id,
        orderNumber: o.order_number,
        status: o.status || 'Draft',
        supplier: o.supplier,
        expectedDate: o.expected_date || '',
        createdBy: o.created_by || '',
        createdOn: o.created_date ? o.created_date.slice(0, 10) : '',
        source: o.source || 'Manual',
        notes: o.notes || '',
        sourceModule: o.source || 'Manual Entry',
        triggerReason: o.notes || '',
        urgency: o.urgency || 'low',
        coverageDays: 0,
        onHandAtCreation: '—',
        suggestedQty: 0,
        lines: o.lines || [],
        supplier_token: o.supplier_token,
        supplier_confirmed_at: o.supplier_confirmed_at,
        supplier_dispatched_at: o.supplier_dispatched_at,
        supplier_dispatch_note: o.supplier_dispatch_note,
      }));
      setOrders(mapped);
    }
  }, []);

  useEffect(() => {
    loadDbOrders();
    const params = new URLSearchParams(window.location.search);
    if (params.get('source') === 'reorder_review') {
      setShowBanner(true);
      const t = setTimeout(() => setShowBanner(false), 5000);
      return () => clearTimeout(t);
    }
  }, [loadDbOrders]);

  const handleOrderClick = (order) => {
    if (DRAFT_STATUSES.has(order.status)) {
      setDraftOrder(order);
    } else {
      setActiveOrder(order);
    }
  };

  // Called when a draft is submitted — transition it to ActiveOrderWorkspace
  const handleDraftSubmit = async (submittedOrder) => {
    setOrders(prev => prev.map(o => o.id === submittedOrder.id ? { ...submittedOrder } : o));
    // Persist to DB if it has a real DB id
    if (typeof submittedOrder.id === 'string' && submittedOrder.id.length > 10) {
      await base44.entities.PurchaseOrder.update(submittedOrder.id, {
        status: submittedOrder.status,
        submitted_at: new Date().toISOString(),
      });
    }
    setDraftOrder(null);
    setActiveOrder(submittedOrder);
  };

  // Called when order status changes (cancel, etc.)
  const handleStatusChange = async (orderId, newStatus) => {
    setOrders(prev => prev.map(o => o.id === orderId ? { ...o, status: newStatus } : o));
    if (typeof orderId === 'string' && orderId.length > 10) {
      await base44.entities.PurchaseOrder.update(orderId, { status: newStatus });
    }
    setActiveOrder(null);
  };

  const filtered = orders.filter(o => {
    const matchQuery  = o.orderNumber.toLowerCase().includes(query.toLowerCase()) ||
                        o.supplier.toLowerCase().includes(query.toLowerCase());
    const matchStatus = statusFilter === 'All' || o.status === statusFilter;
    return matchQuery && matchStatus;
  });

  // ── Draft order inline workspace ──────────────────────────────────────────
  if (draftOrder) {
    return (
      <DraftOrderWorkspace
        order={draftOrder}
        onBack={() => setDraftOrder(null)}
        onSubmit={handleDraftSubmit}
      />
    );
  }

  // ── Active order inline workspace ─────────────────────────────────────────
  if (activeOrder) {
    return (
      <ActiveOrderWorkspace
        order={activeOrder}
        onBack={() => { setActiveOrder(null); loadDbOrders(); }}
        onCancelOrder={() => handleStatusChange(activeOrder.id, 'Cancelled')}
      />
    );
  }

  // ── Orders list ───────────────────────────────────────────────────────────
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
            type="text" value={query} onChange={e => setQuery(e.target.value)}
            placeholder="Search orders…"
            className="h-8 w-64 border border-border rounded pl-8 pr-3 text-sm focus:outline-none focus:ring-1 focus:ring-ring bg-card"
          />
        </div>
        <div className="flex items-center gap-1.5 border border-border rounded bg-card px-3 h-8">
          <ChevronDown size={13} className="text-muted-foreground" />
          <select value={statusFilter} onChange={e => setStatus(e.target.value)}
            className="text-sm bg-transparent focus:outline-none cursor-pointer pr-1">
            {ALL_STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
          </select>
        </div>
        <button className="flex items-center gap-1.5 h-8 px-3 text-sm bg-primary text-primary-foreground rounded hover:opacity-90 transition-opacity ml-auto">
          <Plus size={13} /> New Order
        </button>
      </div>

      {/* Orders table */}
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
              <tr key={order.id}
                className={`border-t border-border transition-colors ${i % 2 === 0 ? 'bg-card' : 'bg-background'} hover:bg-accent/40`}>
                <td className="px-4 py-2.5">
                  <button onClick={() => handleOrderClick(order)}
                    className="font-mono text-xs text-primary hover:underline cursor-pointer transition-colors">
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
              <tr><td colSpan={6} className="px-4 py-8 text-center text-muted-foreground text-sm">No orders found.</td></tr>
            )}
          </tbody>
        </table>
      </div>

      <p className="text-xs text-muted-foreground">{filtered.length} order{filtered.length !== 1 ? 's' : ''}</p>
    </div>
  );
}