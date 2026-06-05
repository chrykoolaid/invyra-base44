import { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { RefreshCw, AlertCircle, CheckCircle2, Clock, XCircle, Filter } from 'lucide-react';

const statusConfig = {
  success: { icon: CheckCircle2, color: 'bg-green-50 border-green-200 text-green-700' },
  failed: { icon: XCircle, color: 'bg-red-50 border-red-200 text-red-700' },
  partial: { icon: AlertCircle, color: 'bg-amber-50 border-amber-200 text-amber-700' },
  pending: { icon: Clock, color: 'bg-sky-50 border-sky-200 text-sky-700' },
};

const reconcilConfig = {
  verified: { label: 'Verified', color: 'text-green-700 bg-green-50 border-green-200' },
  mismatch: { label: 'Mismatch', color: 'text-red-700 bg-red-50 border-red-200' },
  pending_review: { label: 'Pending Review', color: 'text-amber-700 bg-amber-50 border-amber-200' },
  resolved: { label: 'Resolved', color: 'text-blue-700 bg-blue-50 border-blue-200' },
};

export default function SyncAuditViewer() {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const [selectedLog, setSelectedLog] = useState(null);

  const loadLogs = async () => {
    setLoading(true);
    const data = await base44.entities.SyncAuditLog.list('-created_date', 100);
    setLogs(data || []);
    setLoading(false);
  };

  useEffect(() => { loadLogs(); }, []);

  const filtered = logs.filter(log => {
    if (filter === 'all') return true;
    if (filter === 'failed') return log.status === 'failed';
    if (filter === 'mismatch') return log.reconciliation_status === 'mismatch';
    if (filter === 'pending') return log.status === 'pending';
    return true;
  });

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-sm font-semibold text-foreground">Sync History</h2>
          <p className="text-xs text-muted-foreground mt-1">Last 100 external system transactions</p>
        </div>
        <button
          onClick={loadLogs}
          disabled={loading}
          className="flex items-center gap-1.5 h-8 px-3 text-sm rounded border border-border hover:bg-muted disabled:opacity-50"
        >
          <RefreshCw size={14} className={loading ? 'animate-spin' : ''} /> Refresh
        </button>
      </div>

      <div className="flex gap-2 flex-wrap">
        {['all', 'failed', 'mismatch', 'pending'].map(f => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`px-3 py-1.5 text-xs rounded-full border font-medium transition-colors ${
              filter === f
                ? 'bg-primary text-primary-foreground border-primary'
                : 'border-border bg-card hover:bg-muted'
            }`}
          >
            {f === 'all' ? 'All' : f === 'failed' ? 'Failed' : f === 'mismatch' ? 'Mismatches' : 'Pending'}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="text-center py-8 text-muted-foreground text-sm">Loading sync history…</div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-8 text-muted-foreground text-sm">No sync records found</div>
      ) : (
        <div className="border border-border rounded-xl overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-muted/25 text-muted-foreground text-xs uppercase tracking-wide">
              <tr>
                <th className="text-left px-4 py-2.5 font-medium">Timestamp</th>
                <th className="text-left px-4 py-2.5 font-medium">Sync Type</th>
                <th className="text-left px-4 py-2.5 font-medium">External System</th>
                <th className="text-left px-4 py-2.5 font-medium">Status</th>
                <th className="text-left px-4 py-2.5 font-medium">Reconciliation</th>
                <th className="text-center px-4 py-2.5 font-medium">Duration</th>
                <th className="text-center px-4 py-2.5 font-medium">Action</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((log, i) => {
                const StatusIcon = statusConfig[log.status]?.icon;
                return (
                  <tr
                    key={log.id}
                    className={`border-t border-border cursor-pointer transition-colors hover:bg-accent/30 ${
                      i % 2 === 0 ? 'bg-card' : 'bg-background'
                    }`}
                  >
                    <td className="px-4 py-3 text-xs text-muted-foreground whitespace-nowrap">
                      {new Date(log.created_date).toLocaleString()}
                    </td>
                    <td className="px-4 py-3 text-sm font-medium">
                      {log.sync_type === 'xero_inventory' ? 'Xero Inventory'
                        : log.sync_type === 'webhook_inventory' ? 'Webhook Stock'
                        : 'Webhook Order'}
                    </td>
                    <td className="px-4 py-3 text-sm">{log.external_system || '—'}</td>
                    <td className="px-4 py-3">
                      <div className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full border text-xs font-medium ${statusConfig[log.status]?.color}`}>
                        {StatusIcon && <StatusIcon size={12} />}
                        {log.status.charAt(0).toUpperCase() + log.status.slice(1)}
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex px-2.5 py-1 rounded-full border text-xs font-medium ${
                        reconcilConfig[log.reconciliation_status]?.color
                      }`}>
                        {reconcilConfig[log.reconciliation_status]?.label}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-center text-xs text-muted-foreground font-mono">
                      {log.sync_duration_ms ? `${log.sync_duration_ms}ms` : '—'}
                    </td>
                    <td className="px-4 py-3 text-center">
                      <button
                        onClick={() => setSelectedLog(selectedLog?.id === log.id ? null : log)}
                        className="text-xs text-primary hover:underline"
                      >
                        {selectedLog?.id === log.id ? 'Hide' : 'Details'}
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {selectedLog && (
        <div className="rounded-xl border border-border bg-card p-4 space-y-3">
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-semibold text-foreground">Sync Details</h3>
            <button
              onClick={() => setSelectedLog(null)}
              className="text-xs px-2 py-1 rounded border border-border hover:bg-muted"
            >
              Close
            </button>
          </div>

          <div className="grid grid-cols-2 gap-3 text-sm">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Source Entity</p>
              <p className="text-foreground mt-1">{selectedLog.source_entity}</p>
              {selectedLog.source_id && <p className="text-xs text-muted-foreground font-mono">ID: {selectedLog.source_id}</p>}
            </div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Triggered By</p>
              <p className="text-foreground mt-1">{selectedLog.triggered_by || 'System'}</p>
            </div>
          </div>

          {selectedLog.error_message && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-3">
              <p className="text-xs font-semibold text-red-700 mb-1">Error</p>
              <p className="text-sm text-red-600">{selectedLog.error_message}</p>
            </div>
          )}

          {selectedLog.reconciliation_notes && (
            <div className="bg-amber-50 border border-amber-200 rounded-lg p-3">
              <p className="text-xs font-semibold text-amber-700 mb-1">Reconciliation Notes</p>
              <p className="text-sm text-amber-700">{selectedLog.reconciliation_notes}</p>
            </div>
          )}

          {selectedLog.payload_sent && (
            <div className="bg-muted/25 rounded-lg p-3 font-mono text-xs overflow-auto max-h-48">
              <p className="text-muted-foreground font-semibold mb-2">Payload Sent</p>
              <pre className="text-foreground">{JSON.stringify(selectedLog.payload_sent, null, 2)}</pre>
            </div>
          )}

          {selectedLog.response_data && (
            <div className="bg-muted/25 rounded-lg p-3 font-mono text-xs overflow-auto max-h-48">
              <p className="text-muted-foreground font-semibold mb-2">Response ({selectedLog.response_code})</p>
              <pre className="text-foreground">{JSON.stringify(selectedLog.response_data, null, 2)}</pre>
            </div>
          )}
        </div>
      )}
    </div>
  );
}