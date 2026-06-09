import { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { envFilter } from '@/lib/envFilter';
import { RefreshCw, AlertCircle, CheckCircle2 } from 'lucide-react';

export default function ComplianceReport() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  const loadData = async () => {
    setLoading(true);
    const [auditLogs, movements, receiving] = await Promise.all([
      base44.entities.AuditLog.filter(envFilter(), '-created_date', 500),
      base44.entities.StockMovement.filter(envFilter(), '-created_date', 500),
      base44.entities.ReceivingRecord.filter(envFilter(), '-confirmed_at', 500),
    ]);

    const compliance = {
      total_audit_events: auditLogs.length,
      movements_posted: movements.filter(m => m.status === 'POSTED').length,
      movements_voided: movements.filter(m => m.status === 'VOIDED').length,
      receiving_complete: receiving.filter(r => r.status === 'Complete').length,
      receiving_discrepancy: receiving.filter(r => r.status === 'Discrepancy').length,
      unresolved_discrepancies: receiving.filter(r => r.discrepancy_status && r.discrepancy_status !== 'Resolved').length,
      audit_trail_coverage: auditLogs.length > 0 ? ((auditLogs.filter(a => a.changed_by).length / auditLogs.length) * 100).toFixed(0) : 0,
    };

    // Change types breakdown
    const changeTypes = auditLogs.reduce((acc, log) => {
      acc[log.change_type] = (acc[log.change_type] || 0) + 1;
      return acc;
    }, {});

    setData({ compliance, changeTypes, auditLogs: auditLogs.slice(0, 20) });
    setLoading(false);
  };

  useEffect(() => { loadData(); }, []);

  if (loading) return <div className="p-8 text-center text-muted-foreground">Loading compliance…</div>;

  return (
    <div className="p-6 space-y-6">
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-3">
        <div className="rounded-xl border border-green-200 bg-green-50 p-4">
          <p className="text-xs font-semibold uppercase tracking-wide text-green-700">Complete Receipts</p>
          <p className="text-2xl font-bold text-green-700 mt-1">{data?.compliance.receiving_complete}</p>
        </div>
        <div className="rounded-xl border border-amber-200 bg-amber-50 p-4">
          <p className="text-xs font-semibold uppercase tracking-wide text-amber-700">Discrepancies</p>
          <p className="text-2xl font-bold text-amber-700 mt-1">{data?.compliance.receiving_discrepancy}</p>
        </div>
        <div className="rounded-xl border border-red-200 bg-red-50 p-4">
          <p className="text-xs font-semibold uppercase tracking-wide text-red-700">Unresolved</p>
          <p className="text-2xl font-bold text-red-700 mt-1">{data?.compliance.unresolved_discrepancies}</p>
        </div>
        <div className="rounded-xl border border-blue-200 bg-blue-50 p-4">
          <p className="text-xs font-semibold uppercase tracking-wide text-blue-700">Audit Trail</p>
          <p className="text-2xl font-bold text-blue-700 mt-1">{data?.compliance.audit_trail_coverage}%</p>
        </div>
      </div>

      {/* Movement Status */}
      <div className="rounded-xl border border-border bg-background p-4">
        <h3 className="text-sm font-semibold text-foreground mb-3">Stock Movement Integrity</h3>
        <div className="grid grid-cols-2 gap-4">
          <div className="flex items-start gap-3">
            <CheckCircle2 className="w-5 h-5 text-green-600 mt-0.5 flex-shrink-0" />
            <div>
              <p className="text-sm font-medium text-foreground">{data?.compliance.movements_posted} Posted</p>
              <p className="text-xs text-muted-foreground">Active movements</p>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-amber-600 mt-0.5 flex-shrink-0" />
            <div>
              <p className="text-sm font-medium text-foreground">{data?.compliance.movements_voided} Voided</p>
              <p className="text-xs text-muted-foreground">Reversals/corrections</p>
            </div>
          </div>
        </div>
      </div>

      {/* Change Types Breakdown */}
      {Object.keys(data?.changeTypes || {}).length > 0 && (
        <div className="rounded-xl border border-border bg-background overflow-hidden">
          <div className="px-4 py-3 border-b border-border bg-muted/25">
            <h3 className="text-sm font-semibold text-foreground">Audit Event Types</h3>
          </div>
          <div className="divide-y divide-border">
            {Object.entries(data?.changeTypes || {}).map(([type, count]) => (
              <div key={type} className="px-4 py-2 flex items-center justify-between text-sm">
                <span className="text-foreground font-medium">{type.replace('_', ' ')}</span>
                <span className="text-muted-foreground font-mono">{count}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Recent Audit Events */}
      <div className="rounded-xl border border-border bg-background overflow-hidden">
        <div className="px-4 py-3 border-b border-border bg-muted/25">
          <h3 className="text-sm font-semibold text-foreground">Recent Audit Trail</h3>
        </div>
        <div className="divide-y divide-border max-h-64 overflow-y-auto">
          {data?.auditLogs.map(log => (
            <div key={log.id} className="px-4 py-2 text-xs">
              <p className="text-foreground font-medium">{log.item_name}</p>
              <p className="text-muted-foreground">{log.change_type} by {log.changed_by}</p>
              <p className="text-muted-foreground mt-0.5">{new Date(log.created_date).toLocaleString()}</p>
            </div>
          ))}
        </div>
      </div>

      <button onClick={loadData} disabled={loading} className="flex items-center gap-2 h-9 px-4 text-sm rounded-lg border border-border hover:bg-muted disabled:opacity-50">
        <RefreshCw size={14} className={loading ? 'animate-spin' : ''} /> Refresh
      </button>
    </div>
  );
}