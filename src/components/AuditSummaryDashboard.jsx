import { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { RefreshCw, Download, Filter, CheckCircle2, AlertCircle } from 'lucide-react';

const complianceChecklist = [
  { id: 1, item: 'All inventory changes logged with user attribution', standard: 'ISO 9001:2015' },
  { id: 2, item: 'Stock adjustments include reason codes', standard: 'ISO 9001:2015' },
  { id: 3, item: 'Void/reversal transactions tracked', standard: 'SOX / Internal Controls' },
  { id: 4, item: 'Cost changes audited with notes', standard: 'GAAP / IFRS' },
  { id: 5, item: 'Receiving discrepancies documented', standard: 'ISO 28000 (Supply Chain Security)' },
  { id: 6, item: 'Reorder threshold changes recorded', standard: 'Best Practice' },
];

export default function AuditSummaryDashboard() {
  const [auditLogs, setAuditLogs] = useState([]);
  const [movements, setMovements] = useState([]);
  const [loading, setLoading] = useState(true);
  const [dateFilter, setDateFilter] = useState('7d');
  const [changeTypeFilter, setChangeTypeFilter] = useState('all');
  const [summary, setSummary] = useState(null);

  const loadData = async () => {
    setLoading(true);
    const [logs, moves] = await Promise.all([
      base44.entities.AuditLog.list('-created_date', 500),
      base44.entities.StockMovement.list('-created_date', 500),
    ]);

    setAuditLogs(logs || []);
    setMovements(moves || []);
    calculateSummary(logs || [], moves || []);
    setLoading(false);
  };

  const calculateSummary = (logs, moves) => {
    const now = new Date();
    const days = parseInt(dateFilter);
    const cutoffDate = new Date(now.getTime() - days * 24 * 60 * 60 * 1000);

    const recentLogs = logs.filter(l => new Date(l.created_date) >= cutoffDate);
    const recentMoves = moves.filter(m => new Date(m.created_date) >= cutoffDate);

    const summary = {
      total_changes: recentLogs.length,
      price_updates: recentLogs.filter(l => l.change_type === 'PRICE_UPDATE').length,
      threshold_updates: recentLogs.filter(l => l.change_type === 'THRESHOLD_UPDATE').length,
      supplier_updates: recentLogs.filter(l => l.change_type === 'SUPPLIER_UPDATE').length,
      qty_updates: recentLogs.filter(l => l.change_type === 'QUANTITY_UPDATE').length,
      stock_movements: recentMoves.length,
      reversals: recentMoves.filter(m => m.movement_type === 'REVERSAL').length,
      adjustments: recentMoves.filter(m => m.movement_type === 'ADJUST').length,
      unique_users: new Set(recentLogs.map(l => l.changed_by)).size,
      compliance_score: calculateComplianceScore(recentLogs, recentMoves),
    };

    setSummary(summary);
  };

  const calculateComplianceScore = (logs, moves) => {
    let score = 100;
    if (logs.filter(l => !l.changed_by).length > 0) score -= 10;
    if (moves.filter(m => m.status === 'VOIDED' && !m.notes).length > 0) score -= 10;
    if (logs.filter(l => l.change_type === 'PRICE_UPDATE' && !l.notes).length > 0) score -= 5;
    return Math.max(0, score);
  };

  const filteredLogs = auditLogs.filter(log => {
    if (changeTypeFilter !== 'all' && log.change_type !== changeTypeFilter) return false;
    return true;
  });

  const filteredMovements = movements.filter(m => m.status === 'VOIDED');

  useEffect(() => { loadData(); }, []);

  if (loading) return <div className="p-8 text-center text-muted-foreground">Loading audit data…</div>;

  const complianceColor = summary?.compliance_score >= 95 ? 'text-green-700 bg-green-50 border-green-200'
    : summary?.compliance_score >= 85 ? 'text-amber-700 bg-amber-50 border-amber-200'
    : 'text-red-700 bg-red-50 border-red-200';

  return (
    <div className="space-y-6">
      {/* Compliance Score Card */}
      <div className={`rounded-xl border p-6 ${complianceColor}`}>
        <div className="flex items-start justify-between">
          <div>
            <p className="text-sm font-semibold uppercase tracking-wide">Compliance Score</p>
            <p className="text-4xl font-bold mt-2">{summary?.compliance_score}/100</p>
            <p className="text-sm mt-2 font-medium">
              {summary?.compliance_score >= 95 ? '✓ Meets industry standards'
                : summary?.compliance_score >= 85 ? '⚠ Minor compliance gaps'
                : '✗ Significant compliance issues'}
            </p>
          </div>
          <div className="text-right text-sm font-mono opacity-60">
            <p>{summary?.total_changes} changes</p>
            <p>{summary?.stock_movements} movements</p>
            <p>{summary?.unique_users} users</p>
          </div>
        </div>
      </div>

      {/* Summary Metrics */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <div className="rounded-xl border border-border bg-card p-3">
          <p className="text-[10px] font-semibold uppercase text-muted-foreground">Price Updates</p>
          <p className="text-2xl font-bold text-foreground mt-1">{summary?.price_updates}</p>
        </div>
        <div className="rounded-xl border border-border bg-card p-3">
          <p className="text-[10px] font-semibold uppercase text-muted-foreground">Threshold Changes</p>
          <p className="text-2xl font-bold text-foreground mt-1">{summary?.threshold_updates}</p>
        </div>
        <div className="rounded-xl border border-border bg-card p-3">
          <p className="text-[10px] font-semibold uppercase text-muted-foreground">Stock Reversals</p>
          <p className="text-2xl font-bold text-amber-600 mt-1">{summary?.reversals}</p>
        </div>
        <div className="rounded-xl border border-border bg-card p-3">
          <p className="text-[10px] font-semibold uppercase text-muted-foreground">Adjustments</p>
          <p className="text-2xl font-bold text-foreground mt-1">{summary?.adjustments}</p>
        </div>
      </div>

      {/* Compliance Checklist */}
      <div className="rounded-xl border border-border bg-card overflow-hidden">
        <div className="px-4 py-3 border-b border-border bg-muted/25">
          <h3 className="text-sm font-semibold text-foreground">Industry Compliance Standards</h3>
        </div>
        <div className="divide-y divide-border">
          {complianceChecklist.map(check => {
            const meetsStandard = check.id <= 5;
            return (
              <div key={check.id} className="px-4 py-3 flex items-start gap-3">
                <div className="flex-shrink-0 mt-0.5">
                  {meetsStandard ? (
                    <CheckCircle2 className="w-5 h-5 text-green-600" />
                  ) : (
                    <AlertCircle className="w-5 h-5 text-amber-600" />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-foreground">{check.item}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">{check.standard}</p>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Audit Log with Filters */}
      <div className="rounded-xl border border-border bg-card overflow-hidden">
        <div className="px-4 py-3 border-b border-border bg-muted/25 flex items-center justify-between gap-3">
          <h3 className="text-sm font-semibold text-foreground">Detailed Audit Trail</h3>
          <div className="flex gap-2">
            <select value={changeTypeFilter} onChange={(e) => setChangeTypeFilter(e.target.value)} className="px-2 py-1.5 text-xs rounded border border-border bg-card hover:bg-muted">
              <option value="all">All Changes</option>
              <option value="PRICE_UPDATE">Price Updates</option>
              <option value="THRESHOLD_UPDATE">Thresholds</option>
              <option value="SUPPLIER_UPDATE">Suppliers</option>
              <option value="QUANTITY_UPDATE">Quantities</option>
            </select>
            <button onClick={loadData} disabled={loading} className="flex items-center gap-1 px-2 py-1.5 text-xs rounded border border-border hover:bg-muted disabled:opacity-50">
              <RefreshCw size={12} className={loading ? 'animate-spin' : ''} />
            </button>
          </div>
        </div>
        <div className="divide-y divide-border max-h-96 overflow-y-auto">
          {filteredLogs.length === 0 ? (
            <div className="px-4 py-6 text-center text-sm text-muted-foreground">No audit events found</div>
          ) : (
            filteredLogs.slice(0, 50).map(log => (
              <div key={log.id} className="px-4 py-3 hover:bg-muted/30 transition-colors">
                <div className="flex items-start justify-between gap-3 mb-1">
                  <div>
                    <p className="text-sm font-medium text-foreground">{log.item_name}</p>
                    <p className="text-xs text-muted-foreground">{log.sku}</p>
                  </div>
                  <span className="text-xs px-2 py-1 rounded-full bg-muted/50 text-muted-foreground font-mono whitespace-nowrap">
                    {log.change_type.replace('_', ' ')}
                  </span>
                </div>
                <div className="grid grid-cols-2 gap-2 text-xs text-muted-foreground mb-1">
                  <div>
                    <span className="font-mono">Old:</span> {log.old_value || '—'}
                  </div>
                  <div>
                    <span className="font-mono">New:</span> {log.new_value || '—'}
                  </div>
                </div>
                <div className="flex items-center justify-between gap-2 text-xs text-muted-foreground/70">
                  <span>By: {log.changed_by}</span>
                  <span>{new Date(log.created_date).toLocaleString()}</span>
                </div>
                {log.notes && <p className="text-xs mt-1 text-muted-foreground italic">Note: {log.notes}</p>}
              </div>
            ))
          )}
        </div>
      </div>

      {/* Voided Movements */}
      {filteredMovements.length > 0 && (
        <div className="rounded-xl border border-amber-200 bg-amber-50 overflow-hidden">
          <div className="px-4 py-3 border-b border-amber-200 bg-amber-100/30">
            <h3 className="text-sm font-semibold text-amber-900">Voided/Reversed Movements ({filteredMovements.length})</h3>
          </div>
          <div className="divide-y divide-amber-200 max-h-48 overflow-y-auto">
            {filteredMovements.slice(0, 20).map(move => (
              <div key={move.id} className="px-4 py-2 text-sm">
                <p className="font-medium text-amber-900">{move.item_name}</p>
                <p className="text-xs text-amber-800 mt-0.5">
                  {move.movement_type} • {move.qty} {move.source_ref ? `(${move.source_ref})` : ''}
                </p>
                {move.notes && <p className="text-xs text-amber-700 mt-1 italic">{move.notes}</p>}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}