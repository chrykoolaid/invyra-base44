import { useEffect, useState } from 'react';
import { base44 } from '@/api/base44Client';
import { envFilter, ENV_LIVE } from '@/lib/envFilter';
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
  const [responseText, setResponseText] = useState({});
  const [confirming, setConfirming] = useState(null);

  useEffect(() => {
    if (!token) { setError('Invalid or missing access token.'); setLoading(false); return; }
    base44.entities.PurchaseOrder.filter({ ...envFilter(), supplier_token: token })
      .then(async rows => {
        if (!rows || rows.length === 0) { setError('Order not found or link has expired.'); setLoading(false); return; }
        setOrder(rows[0]);
        
        // Fetch receiving records for this supplier
        const receiving = await base44.entities.ReceivingRecord.filter({ ...envFilter(), supplier: rows[0].supplier });
        setReceivingRecords(receiving || []);
        setLoading(false);
      });
  }, [token]);

  const handleConfirm = async () => {
    setActing(true);
    await base44.entities.PurchaseOrder.update(order.id, {
      status: 'Confirmed',
      supplier_confirmed_at: new Date().toISOString(),
      environment: ENV_LIVE,
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
      environment: ENV_LIVE,
    });
    setOrder(prev => ({ ...prev, status: 'Awaiting Delivery', supplier_dispatched_at: new Date().toISOString() }));
    setDone('dispatched');
    setActing(false);
  };

  const handleSubmitResponse = async (recordId) => {
    const msg = responseText[recordId]?.trim();
    if (!msg) return;

    setActing(true);
    const record = receivingRecords.find(r => r.id === recordId);
    const newResponses = [...(record.supplier_responses || []), { id: Math.random().toString(36), message: msg, created_at: new Date().toISOString() }];

    await base44.entities.ReceivingRecord.update(recordId, {
      supplier_responses: newResponses,
      discrepancy_status: 'Supplier Responded',
      environment: ENV_LIVE,
    });

    setReceivingRecords(prev => prev.map(r => r.id === recordId ? { ...r, supplier_responses: newResponses, discrepancy_status: 'Supplier Responded' } : r));
    setResponseText(prev => ({ ...prev, [recordId]: '' }));
    setActing(false);
  };

  const handleConfirmResolution = async (recordId) => {
    setConfirming(recordId);
    await base44.entities.ReceivingRecord.update(recordId, {
      discrepancy_status: 'Supplier Confirmed',
      supplier_confirmed: true,
      supplier_confirmed_at: new Date().toISOString(),
      resolved_at: new Date().toISOString(),
      environment: ENV_LIVE,
    });

    setReceivingRecords(prev => prev.map(r => r.id === recordId ? {
      ...r,
      discrepancy_status: 'Supplier Confirmed',
      supplier_confirmed: true,
      supplier_confirmed_at: new Date().toISOString(),
      resolved_at: new Date().toISOString(),
    } : r));

    setConfirming(null);
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

        {/* Flagged Discrepancies for Response */}
        {receivingRecords.filter(r => r.status === 'Discrepancy').length > 0 && (
          <div className="bg-white border border-red-200 rounded-2xl p-6 shadow-sm">
            <p className="text-xs font-semibold text-red-600 uppercase tracking-widest mb-4">Discrepancy Resolution</p>
            <div className="space-y-3">
              {receivingRecords.filter(r => r.status === 'Discrepancy').map((record) => (
                <div key={record.id} className="border border-red-100 rounded-xl p-4 bg-red-50/30">
                  <div className="flex items-start justify-between gap-3 mb-3">
                    <div>
                      <p className="font-semibold text-gray-800">{record.po_number}</p>
                      <p className="text-xs text-gray-500 mt-1">{record.items?.map(i => i.item).join(', ')}</p>
                    </div>
                    <span className={`text-xs px-2 py-1 rounded-full font-medium ${
                      record.discrepancy_status === 'Resolution Proposed' ? 'bg-purple-100 text-purple-700' :
                      record.discrepancy_status === 'Supplier Confirmed' || record.discrepancy_status === 'Resolved' ? 'bg-green-100 text-green-700' :
                      record.discrepancy_status === 'Supplier Responded' ? 'bg-blue-100 text-blue-700' :
                      'bg-red-100 text-red-700'
                    }`}>
                      {record.discrepancy_status || 'Flagged'}
                    </span>
                  </div>

                  {/* Response thread */}
                  {record.supplier_responses && record.supplier_responses.length > 0 && (
                    <div className="mb-4 space-y-2 bg-white rounded-lg p-3 border border-red-100">
                      {record.supplier_responses.map((resp) => (
                        <div key={resp.id} className="text-xs">
                          <p className="font-medium text-gray-700">{new Date(resp.created_at).toLocaleString()}</p>
                          <p className="text-gray-600 mt-1">{resp.message}</p>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Your response - shown if waiting for supplier response */}
                  {record.discrepancy_status === 'Awaiting Supplier Response' || (record.discrepancy_status === 'Supplier Responded' && !record.warehouse_decision) && (
                    <div className="space-y-2">
                      <label className="text-xs font-medium text-gray-700">Your response:</label>
                      <textarea
                        value={responseText[record.id] || ''}
                        onChange={e => setResponseText(prev => ({ ...prev, [record.id]: e.target.value }))}
                        placeholder="Explain the situation from your side..."
                        rows={3}
                        className="w-full border border-gray-200 rounded-lg px-3 py-2 text-xs resize-none focus:outline-none focus:ring-1 focus:ring-red-300"
                      />
                      <button
                        onClick={() => handleSubmitResponse(record.id)}
                        disabled={acting || !responseText[record.id]?.trim()}
                        className="text-xs px-3 py-1.5 rounded-lg bg-red-600 text-white hover:bg-red-700 transition-colors disabled:opacity-50"
                      >
                        {acting ? 'Sending…' : 'Submit Response'}
                      </button>
                    </div>
                  )}

                  {/* Warehouse decision - requires confirmation */}
                  {(record.discrepancy_status === 'Resolution Proposed' || record.discrepancy_status === 'Supplier Confirmed') && record.warehouse_decision && (
                    <div className="mt-4 bg-purple-50 border border-purple-200 rounded-lg p-3 space-y-2">
                      <p className="text-xs font-semibold text-purple-700">Warehouse Decision</p>
                      <div className="text-xs text-purple-700 bg-white rounded p-2">
                        <p className="font-medium">{record.warehouse_decision}</p>
                        {record.warehouse_decision_note && <p className="mt-1 text-purple-600">{record.warehouse_decision_note}</p>}
                      </div>
                      {record.discrepancy_status === 'Resolution Proposed' && (
                        <button
                          onClick={() => handleConfirmResolution(record.id)}
                          disabled={confirming === record.id}
                          className="text-xs w-full px-3 py-1.5 rounded-lg bg-purple-600 text-white hover:bg-purple-700 transition-colors disabled:opacity-50"
                        >
                          {confirming === record.id ? 'Confirming…' : 'Confirm Agreement'}
                        </button>
                      )}
                      {record.discrepancy_status === 'Supplier Confirmed' && (
                        <p className="text-xs text-green-700 font-medium">✓ You confirmed this resolution</p>
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>
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