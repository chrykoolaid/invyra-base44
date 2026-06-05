import { useEffect, useState } from 'react';
import { base44 } from '@/api/base44Client';
import { CheckCircle2, Truck, Package, AlertTriangle, FileText, Clock } from 'lucide-react';

const statusStyle = {
  Draft:               'bg-gray-100 text-gray-600',
  Submitted:           'bg-blue-100 text-blue-700',
  Confirmed:           'bg-violet-100 text-violet-700',
  'Awaiting Delivery': 'bg-amber-100 text-amber-700',
  'Partially Received':'bg-orange-100 text-orange-700',
  Received:            'bg-green-100 text-green-700',
  Cancelled:           'bg-red-100 text-red-600',
};

export default function SupplierPortal() {
  const urlParams = new URLSearchParams(window.location.search);
  const token = urlParams.get('token');

  const [order, setOrder] = useState(null);
  const [receivingRecords, setReceivingRecords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [dispatchNote, setDispatchNote] = useState('');
  const [acting, setActing] = useState(false);
  const [done, setDone] = useState('');

  useEffect(() => {
    if (!token) { setError('Invalid or missing access token.'); setLoading(false); return; }
    base44.entities.PurchaseOrder.filter({ supplier_token: token })
      .then(async rows => {
        if (!rows || rows.length === 0) { setError('Order not found or link has expired.'); setLoading(false); return; }
        setOrder(rows[0]);
        
        // Fetch receiving records for this supplier
        const receiving = await base44.entities.ReceivingRecord.filter({ supplier: rows[0].supplier });
        setReceivingRecords(receiving || []);
        setLoading(false);
      });
  }, [token]);

  const handleConfirm = async () => {
    setActing(true);
    await base44.entities.PurchaseOrder.update(order.id, {
      status: 'Confirmed',
      supplier_confirmed_at: new Date().toISOString(),
    });
    setOrder(prev => ({ ...prev, status: 'Confirmed', supplier_confirmed_at: new Date().toISOString() }));
    setDone('confirmed');
    setActing(false);
  };

  const handleDispatch = async () => {
    setActing(true);
    await base44.entities.PurchaseOrder.update(order.id, {
      status: 'Awaiting Delivery',
      supplier_dispatched_at: new Date().toISOString(),
      supplier_dispatch_note: dispatchNote.trim() || null,
    });
    setOrder(prev => ({ ...prev, status: 'Awaiting Delivery', supplier_dispatched_at: new Date().toISOString() }));
    setDone('dispatched');
    setActing(false);
  };

  if (loading) return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="w-6 h-6 border-2 border-gray-300 border-t-gray-700 rounded-full animate-spin" />
    </div>
  );

  if (error) return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-6">
      <div className="bg-white border border-red-200 rounded-2xl p-8 max-w-md w-full text-center shadow-sm">
        <AlertTriangle size={32} className="text-red-400 mx-auto mb-3" />
        <h2 className="text-lg font-semibold text-gray-800 mb-2">Access Error</h2>
        <p className="text-sm text-gray-500">{error}</p>
      </div>
    </div>
  );

  const canConfirm = order.status === 'Submitted';
  const canDispatch = order.status === 'Confirmed';
  const isTerminal = ['Awaiting Delivery', 'Partially Received', 'Received', 'Cancelled'].includes(order.status);

  // Show amendment warning if order was amended after supplier confirmed
  const wasAmended = order.amended_at && order.supplier_confirmed_at &&
    new Date(order.amended_at) > new Date(order.supplier_confirmed_at);

  return (
    <div className="min-h-screen bg-gray-50 py-10 px-4">
      <div className="max-w-2xl mx-auto space-y-5">

        {/* Header */}
        <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-widest mb-1">Purchase Order</p>
              <h1 className="text-2xl font-bold text-gray-900">{order.order_number}</h1>
              <p className="text-sm text-gray-500 mt-1">Supplier: <span className="font-medium text-gray-700">{order.supplier}</span></p>
            </div>
            <span className={`text-xs px-3 py-1 rounded-full font-semibold ${statusStyle[order.status]}`}>
              {order.status}
            </span>
          </div>

          {order.expected_date && (
            <div className="flex items-center gap-1.5 mt-4 text-sm text-gray-500">
              <Clock size={14} />
              Expected delivery: <span className="font-medium text-gray-700">{order.expected_date}</span>
            </div>
          )}

          {order.notes && (
            <p className="mt-3 text-sm text-gray-500 border-t border-gray-100 pt-3">{order.notes}</p>
          )}

          {wasAmended && (
            <div className="mt-3 flex items-start gap-2 bg-amber-50 border border-amber-200 rounded-xl px-4 py-3">
              <AlertTriangle size={15} className="text-amber-500 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-semibold text-amber-800">Order was amended</p>
                <p className="text-xs text-amber-700 mt-0.5">The buyer updated the order lines after your confirmation. Please review the current lines below before dispatching.</p>
              </div>
            </div>
          )}
        </div>

        {/* Discrepancy Summary */}
        {receivingRecords.length > 0 && (
          <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm">
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-widest mb-4">Receiving History & Discrepancies</p>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="border-l-4 border-blue-400 pl-4 py-2">
                <p className="text-2xl font-bold text-gray-900">{receivingRecords.length}</p>
                <p className="text-xs text-gray-500 mt-1">Total Receiving Records</p>
              </div>
              <div className="border-l-4 border-amber-400 pl-4 py-2">
                <p className="text-2xl font-bold text-gray-900">
                  {receivingRecords.filter(r => r.status === 'Partial').length}
                </p>
                <p className="text-xs text-gray-500 mt-1">Partial Receipts</p>
              </div>
              <div className="border-l-4 border-red-400 pl-4 py-2">
                <p className="text-2xl font-bold text-gray-900">
                  {receivingRecords.filter(r => r.status === 'Discrepancy').length}
                </p>
                <p className="text-xs text-gray-500 mt-1">Discrepancy Reports</p>
              </div>
              <div className="border-l-4 border-green-400 pl-4 py-2">
                <p className="text-2xl font-bold text-gray-900">
                  {receivingRecords.filter(r => r.status === 'Complete').length}
                </p>
                <p className="text-xs text-gray-500 mt-1">Completed Orders</p>
              </div>
            </div>
            
            {receivingRecords.some(r => r.items?.some(item => item.supplier_stated_reason)) && (
              <div className="mt-4 pt-4 border-t border-gray-100">
                <p className="text-xs font-semibold text-gray-600 mb-3">Recent Supplier-Stated Reasons</p>
                <div className="space-y-2 max-h-32 overflow-y-auto">
                  {receivingRecords.map(record =>
                    record.items?.map(item =>
                      item.supplier_stated_reason && (
                        <div key={`${record.id}-${item.item}`} className="text-xs bg-amber-50 border border-amber-100 rounded px-3 py-2">
                          <p className="font-medium text-amber-900">{item.item}</p>
                          <p className="text-amber-700 mt-1">{item.supplier_stated_reason}</p>
                        </div>
                      )
                    )
                  )}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Order lines */}
        {order.lines && order.lines.length > 0 && (
          <div className="bg-white border border-gray-200 rounded-2xl overflow-hidden shadow-sm">
            <div className="px-5 py-3 border-b border-gray-100">
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-widest">Order Lines</p>
            </div>
            <table className="w-full text-sm">
              <thead className="bg-gray-50 text-xs text-gray-500 uppercase tracking-wide">
                <tr>
                  {['SKU', 'Item', 'Qty', 'Unit'].map(h => (
                    <th key={h} className="text-left px-5 py-2.5 font-medium">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {order.lines.map((line, i) => (
                  <tr key={line.line_id || i} className={`border-t border-gray-100 ${i % 2 === 0 ? 'bg-white' : 'bg-gray-50/50'}`}>
                    <td className="px-5 py-2.5 font-mono text-xs text-gray-400">{line.sku}</td>
                    <td className="px-5 py-2.5 font-medium text-gray-800">{line.name}</td>
                    <td className="px-5 py-2.5 text-gray-700">{line.qty}</td>
                    <td className="px-5 py-2.5 text-gray-500">{line.unit || '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Timeline */}
        <div className="bg-white border border-gray-200 rounded-2xl p-5 shadow-sm space-y-3">
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-widest mb-2">Order Timeline</p>
          <TimelineItem icon={FileText} label="Order Submitted" done={!!order.submitted_at} ts={order.submitted_at} />
          <TimelineItem icon={CheckCircle2} label="Supplier Confirmed" done={!!order.supplier_confirmed_at} ts={order.supplier_confirmed_at} />
          <TimelineItem icon={Truck} label="Dispatched by Supplier" done={!!order.supplier_dispatched_at} ts={order.supplier_dispatched_at} note={order.supplier_dispatch_note} />
          <TimelineItem icon={Package} label="Received at Warehouse" done={!!order.received_at} ts={order.received_at} />
        </div>

        {/* Actions */}
        {!isTerminal && (
          <div className="bg-white border border-gray-200 rounded-2xl p-5 shadow-sm space-y-4">
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-widest">Your Action</p>

            {done === 'confirmed' && (
              <div className="flex items-center gap-2 text-sm text-violet-700 bg-violet-50 border border-violet-200 rounded-xl px-4 py-3">
                <CheckCircle2 size={15} /> Order confirmed. You can now mark it as dispatched when goods are shipped.
              </div>
            )}
            {done === 'dispatched' && (
              <div className="flex items-center gap-2 text-sm text-green-700 bg-green-50 border border-green-200 rounded-xl px-4 py-3">
                <Truck size={15} /> Dispatch recorded. The buyer will be notified and will confirm receipt on their end.
              </div>
            )}

            {canConfirm && done !== 'confirmed' && (
              <div className="space-y-3">
                <p className="text-sm text-gray-600">Confirm you have received and accepted this purchase order.</p>
                <button
                  onClick={handleConfirm}
                  disabled={acting}
                  className="flex items-center gap-2 h-10 px-6 rounded-xl bg-violet-600 text-white text-sm font-medium hover:bg-violet-700 transition-colors disabled:opacity-50"
                >
                  <CheckCircle2 size={15} /> {acting ? 'Confirming…' : 'Confirm Order'}
                </button>
              </div>
            )}

            {canDispatch && done !== 'dispatched' && (
              <div className="space-y-3">
                <p className="text-sm text-gray-600">Once goods have been shipped, mark this order as dispatched.</p>
                <textarea
                  value={dispatchNote}
                  onChange={e => setDispatchNote(e.target.value)}
                  placeholder="Optional: tracking number, driver name, vehicle plate…"
                  rows={3}
                  className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-amber-300"
                />
                <button
                  onClick={handleDispatch}
                  disabled={acting}
                  className="flex items-center gap-2 h-10 px-6 rounded-xl bg-amber-500 text-white text-sm font-medium hover:bg-amber-600 transition-colors disabled:opacity-50"
                >
                  <Truck size={15} /> {acting ? 'Saving…' : 'Mark as Dispatched'}
                </button>
              </div>
            )}
          </div>
        )}

        {isTerminal && (
          <div className="bg-white border border-gray-200 rounded-2xl p-5 shadow-sm text-center text-sm text-gray-500">
            This order is now <span className="font-semibold text-gray-700">{order.status}</span>. No further action needed from your side.
          </div>
        )}

        <p className="text-center text-xs text-gray-400">Powered by Invyra · This link is unique to your order</p>
      </div>
    </div>
  );
}

function TimelineItem({ icon: Icon, label, done, ts, note }) {
  return (
    <div className="flex items-start gap-3">
      <div className={`mt-0.5 h-7 w-7 rounded-full flex items-center justify-center flex-shrink-0 ${done ? 'bg-green-100 text-green-600' : 'bg-gray-100 text-gray-400'}`}>
        <Icon size={13} />
      </div>
      <div>
        <p className={`text-sm font-medium ${done ? 'text-gray-800' : 'text-gray-400'}`}>{label}</p>
        {ts && <p className="text-xs text-gray-400 mt-0.5">{new Date(ts).toLocaleString()}</p>}
        {note && <p className="text-xs text-gray-500 mt-0.5 italic">{note}</p>}
      </div>
    </div>
  );
}