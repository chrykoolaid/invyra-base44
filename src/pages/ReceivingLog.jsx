import { useNavigate } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { ArrowLeft, ChevronDown } from 'lucide-react';
import { base44 } from '@/api/base44Client';

const statusStyle = {
  'Complete':     'bg-green-50 text-green-700 border border-green-200',
  'Partial':      'bg-amber-50 text-amber-700 border border-amber-200',
  'Discrepancy':  'bg-red-50 text-red-700 border border-red-200',
};

const discrepancyStatusStyle = {
  'Flagged': 'bg-red-100 text-red-700',
  'Awaiting Supplier Response': 'bg-amber-100 text-amber-700',
  'Supplier Responded': 'bg-blue-100 text-blue-700',
  'Resolution Proposed': 'bg-purple-100 text-purple-700',
  'Supplier Confirmed': 'bg-emerald-100 text-emerald-700',
  'Resolved': 'bg-green-100 text-green-700',
};

export default function ReceivingLog() {
  const navigate = useNavigate();
  const [records, setRecords] = useState([]);
  const [expandedId, setExpandedId] = useState(null);
  const [proposing, setProposing] = useState(null);
  const [warehouseDecision, setWarehouseDecision] = useState({});
  const [warehouseNote, setWarehouseNote] = useState({});

  useEffect(() => {
    base44.entities.ReceivingRecord.list('-confirmed_at', 50).then(data => {
      const sorted = (data || []).sort((a, b) => {
        // Prioritize: Overdue → Due soon → Already resolved
        const aDate = a.expected_resolution_date ? new Date(a.expected_resolution_date) : null;
        const bDate = b.expected_resolution_date ? new Date(b.expected_resolution_date) : null;
        const today = new Date().toDateString();

        const aIsOpen = a.discrepancy_status && !['Resolved', 'Supplier Confirmed'].includes(a.discrepancy_status);
        const bIsOpen = b.discrepancy_status && !['Resolved', 'Supplier Confirmed'].includes(b.discrepancy_status);

        if (aIsOpen && !bIsOpen) return -1;
        if (!aIsOpen && bIsOpen) return 1;

        if (aIsOpen && bIsOpen && aDate && bDate) {
          return new Date(aDate) - new Date(bDate);
        }

        return 0;
      });
      setRecords(sorted);
    });
  }, []);

  const handleProposeResolution = async (recordId) => {
    if (!warehouseDecision[recordId]?.trim()) return;
    setProposing(recordId);
    
    await base44.entities.ReceivingRecord.update(recordId, {
      discrepancy_status: 'Resolution Proposed',
      warehouse_decision: warehouseDecision[recordId],
      warehouse_decision_note: warehouseNote[recordId] || '',
      warehouse_decided_at: new Date().toISOString(),
    });
    
    setRecords(prev => prev.map(r => r.id === recordId ? {
      ...r,
      discrepancy_status: 'Resolution Proposed',
      warehouse_decision: warehouseDecision[recordId],
      warehouse_decided_at: new Date().toISOString(),
    } : r));
    
    // Notify supplier of warehouse decision
    try {
      await base44.functions.invoke('notifyWarehouseDecision', { recordId });
    } catch (err) {
      console.error('Failed to notify supplier:', err);
    }
    
    setProposing(null);
    setWarehouseDecision(prev => ({ ...prev, [recordId]: '' }));
    setWarehouseNote(prev => ({ ...prev, [recordId]: '' }));
  };

  return (
    <div className="p-6">
      <button
        onClick={() => navigate('/Receiving')}
        className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground mb-5 transition-colors"
      >
        <ArrowLeft size={14} /> Back to Receiving
      </button>

      <div className="mb-5">
        <h1 className="text-lg font-semibold text-foreground">Receiving Log</h1>
        <p className="text-sm text-muted-foreground mt-0.5">History of completed and partial receiving events</p>
      </div>

      <div className="space-y-3">
        {records.length === 0 ? (
          <div className="border border-dashed border-border rounded bg-card p-8 text-center text-sm text-muted-foreground">
            No receiving records yet
          </div>
        ) : (
          records.map((record) => (
            <div key={record.id} className="border border-border rounded bg-card overflow-hidden">
              <button
                onClick={() => setExpandedId(expandedId === record.id ? null : record.id)}
                className="w-full flex items-center justify-between px-5 py-3 hover:bg-muted/30 transition-colors text-left"
              >
                <div className="flex-1 flex items-center gap-4">
                  <ChevronDown size={16} className={`text-muted-foreground transition-transform ${expandedId === record.id ? 'rotate-180' : ''}`} />
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-1">
                      <p className="font-mono text-sm text-primary font-semibold">{record.po_number}</p>
                      <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${statusStyle[record.status]}`}>
                        {record.status}
                      </span>
                      {record.discrepancy_status && (
                        <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${discrepancyStatusStyle[record.discrepancy_status]}`}>
                          {record.discrepancy_status}
                        </span>
                      )}
                    </div>
                    <p className="text-sm text-muted-foreground">{record.supplier} • {new Date(record.confirmed_at).toLocaleDateString()}</p>
                  </div>
                </div>
              </button>

              {expandedId === record.id && (
                <div className="border-t border-border px-5 py-4 space-y-4 bg-background/50">
                  {/* Expected resolution date - if set */}
                  {record.expected_resolution_date && (
                    <div className={`rounded p-3 ${
                      new Date(record.expected_resolution_date) < new Date() && record.discrepancy_status && !['Resolved', 'Supplier Confirmed'].includes(record.discrepancy_status)
                        ? 'bg-red-50 border border-red-200'
                        : 'bg-blue-50 border border-blue-200'
                    }`}>
                      <p className={`text-xs font-semibold ${
                        new Date(record.expected_resolution_date) < new Date() && record.discrepancy_status && !['Resolved', 'Supplier Confirmed'].includes(record.discrepancy_status)
                          ? 'text-red-700'
                          : 'text-blue-700'
                      }`}>
                        {new Date(record.expected_resolution_date) < new Date() && record.discrepancy_status && !['Resolved', 'Supplier Confirmed'].includes(record.discrepancy_status)
                          ? '⚠ OVERDUE'
                          : 'Due by'} {new Date(record.expected_resolution_date).toLocaleDateString()}
                      </p>
                    </div>
                  )}

                  {/* Items */}
                  <div>
                    <p className="text-xs font-semibold text-muted-foreground mb-2">Items</p>
                    <div className="space-y-1.5 text-sm">
                      {record.items?.map((item, i) => (
                        <div key={i} className="flex justify-between">
                          <span className="text-foreground">{item.item}</span>
                          <span className="text-muted-foreground">Expected {item.expected} • Received {item.received} {item.unit}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Discrepancy details */}
                  {record.status === 'Discrepancy' && record.items?.some(i => i.discrepancy_reason) && (
                    <div className="bg-red-50 border border-red-200 rounded p-3 space-y-2">
                      <p className="text-xs font-semibold text-red-700">Flagged Discrepancies</p>
                      {record.items?.filter(i => i.discrepancy_reason).map((item, i) => (
                        <div key={i} className="text-xs text-red-700">
                          <p className="font-medium">{item.item}</p>
                          <p className="text-red-600 mt-1">Reason: {item.discrepancy_reason}</p>
                          {item.discrepancy_note && <p className="text-red-600">Note: {item.discrepancy_note}</p>}
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Supplier responses */}
                  {record.supplier_responses?.length > 0 && (
                    <div className="bg-blue-50 border border-blue-200 rounded p-3 space-y-2">
                      <p className="text-xs font-semibold text-blue-700">Supplier Responses</p>
                      {record.supplier_responses.map((resp) => (
                        <div key={resp.id} className="text-xs text-blue-700 bg-white rounded p-2">
                          <p className="font-medium text-blue-900">{new Date(resp.created_at).toLocaleString()}</p>
                          <p className="mt-1">{resp.message}</p>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Warehouse decision stage */}
                  {record.status === 'Discrepancy' && record.discrepancy_status === 'Supplier Responded' && (
                    <div className="bg-purple-50 border border-purple-200 rounded p-3 space-y-2">
                      <p className="text-xs font-semibold text-purple-700">Warehouse Decision Required</p>
                      <input
                        type="text"
                        placeholder="e.g., 'Accept explanation', 'Credit memo issued', 'Replacement shipment requested'"
                        value={warehouseDecision[record.id] || ''}
                        onChange={e => setWarehouseDecision(prev => ({ ...prev, [record.id]: e.target.value }))}
                        className="w-full text-xs border border-purple-200 rounded px-2 py-1.5 bg-white focus:outline-none focus:ring-1 focus:ring-purple-300"
                      />
                      <textarea
                        placeholder="Additional reasoning for supplier..."
                        value={warehouseNote[record.id] || ''}
                        onChange={e => setWarehouseNote(prev => ({ ...prev, [record.id]: e.target.value }))}
                        rows={2}
                        className="w-full text-xs border border-purple-200 rounded px-2 py-1.5 bg-white focus:outline-none focus:ring-1 focus:ring-purple-300 resize-none"
                      />
                      <button
                        onClick={() => handleProposeResolution(record.id)}
                        disabled={proposing === record.id || !warehouseDecision[record.id]?.trim()}
                        className="text-xs px-3 py-1.5 rounded bg-purple-600 text-white hover:bg-purple-700 transition-colors disabled:opacity-50"
                      >
                        {proposing === record.id ? 'Proposing…' : 'Propose Resolution'}
                      </button>
                    </div>
                  )}

                  {/* Resolution proposed - awaiting supplier confirmation */}
                  {record.discrepancy_status === 'Resolution Proposed' && (
                    <div className="bg-purple-50 border border-purple-200 rounded p-3 space-y-2">
                      <p className="text-xs font-semibold text-purple-700">Resolution Proposed to Supplier</p>
                      <div className="text-xs text-purple-700 bg-white rounded p-2">
                        <p className="font-medium">{record.warehouse_decision}</p>
                        {record.warehouse_decision_note && <p className="mt-1 text-purple-600">{record.warehouse_decision_note}</p>}
                      </div>
                      <p className="text-xs text-purple-600">Awaiting supplier confirmation on portal…</p>
                    </div>
                  )}

                  {/* Supplier confirmed */}
                  {record.discrepancy_status === 'Supplier Confirmed' && (
                    <div className="bg-emerald-50 border border-emerald-200 rounded p-3">
                      <p className="text-xs font-semibold text-emerald-700 mb-1">✓ Supplier Confirmed</p>
                      <p className="text-xs text-emerald-700">{record.warehouse_decision}</p>
                      <p className="text-xs text-emerald-600 mt-1">Confirmed on {new Date(record.supplier_confirmed_at).toLocaleString()}</p>
                    </div>
                  )}

                  {/* Fully resolved */}
                  {record.discrepancy_status === 'Resolved' && (
                    <div className="bg-green-50 border border-green-200 rounded p-3">
                      <p className="text-xs font-semibold text-green-700 mb-1">✓ Fully Resolved</p>
                      <p className="text-xs text-green-700">{record.warehouse_decision}</p>
                      <p className="text-xs text-green-600 mt-1">Resolution finalized on {new Date(record.resolved_at).toLocaleString()}</p>
                    </div>
                  )}
                </div>
              )}
            </div>
          ))
        )}
      </div>

      <p className="text-xs text-muted-foreground mt-4 px-1">{records.length} receiving events on record</p>
    </div>
  );
}