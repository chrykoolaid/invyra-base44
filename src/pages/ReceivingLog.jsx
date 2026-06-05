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
  'Resolved': 'bg-green-100 text-green-700',
};

export default function ReceivingLog() {
  const navigate = useNavigate();
  const [records, setRecords] = useState([]);
  const [expandedId, setExpandedId] = useState(null);
  const [resolving, setResolving] = useState(null);
  const [resolutionNote, setResolutionNote] = useState({});

  useEffect(() => {
    base44.entities.ReceivingRecord.list('-confirmed_at', 50).then(data => setRecords(data || []));
  }, []);

  const handleResolve = async (recordId) => {
    setResolving(recordId);
    await base44.entities.ReceivingRecord.update(recordId, {
      discrepancy_status: 'Resolved',
      resolution_note: resolutionNote[recordId] || '',
      resolved_at: new Date().toISOString(),
    });
    setRecords(prev => prev.map(r => r.id === recordId ? { ...r, discrepancy_status: 'Resolved', resolved_at: new Date().toISOString() } : r));
    
    // Notify supplier
    try {
      await base44.functions.invoke('notifyDiscrepancyResolved', { recordId });
    } catch (err) {
      console.error('Failed to notify supplier:', err);
    }
    
    setResolving(null);
    setResolutionNote(prev => ({ ...prev, [recordId]: '' }));
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

                  {/* Resolution controls */}
                  {record.status === 'Discrepancy' && record.discrepancy_status !== 'Resolved' && (
                    <div className="bg-amber-50 border border-amber-200 rounded p-3 space-y-2">
                      <p className="text-xs font-semibold text-amber-700">Resolve Discrepancy</p>
                      <textarea
                        placeholder="Internal resolution note (e.g., 'Accepted supplier explanation', 'Credit memo issued')..."
                        value={resolutionNote[record.id] || ''}
                        onChange={e => setResolutionNote(prev => ({ ...prev, [record.id]: e.target.value }))}
                        rows={2}
                        className="w-full text-xs border border-amber-200 rounded px-2 py-1.5 bg-white focus:outline-none focus:ring-1 focus:ring-amber-300 resize-none"
                      />
                      <button
                        onClick={() => handleResolve(record.id)}
                        disabled={resolving === record.id}
                        className="text-xs px-3 py-1.5 rounded bg-amber-600 text-white hover:bg-amber-700 transition-colors disabled:opacity-50"
                      >
                        {resolving === record.id ? 'Marking resolved…' : 'Mark Resolved'}
                      </button>
                    </div>
                  )}

                  {record.discrepancy_status === 'Resolved' && (
                    <div className="bg-green-50 border border-green-200 rounded p-3">
                      <p className="text-xs font-semibold text-green-700 mb-1">✓ Resolved</p>
                      {record.resolution_note && <p className="text-xs text-green-700">{record.resolution_note}</p>}
                      <p className="text-xs text-green-600 mt-1">{new Date(record.resolved_at).toLocaleString()}</p>
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