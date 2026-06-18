import { useEffect, useState } from 'react';
import { base44 } from '@/api/base44Client';
import { FileText, Clock, AlertTriangle, GitPullRequest, ArrowRight, CheckCircle2, RotateCcw, TrendingUp, Zap } from 'lucide-react';

const statusLabel = {
  DRAFT: 'Draft',
  SUBMITTED: 'Submitted',
  POSTED: 'Posted',
  APPROVED: 'Approved',
  REJECTED: 'Rejected',
  REVERSED: 'Reversed',
  AMENDED: 'Amended',
};

const statusColor = {
  DRAFT: 'text-slate-500 bg-slate-100',
  SUBMITTED: 'text-amber-700 bg-amber-50',
  POSTED: 'text-green-700 bg-green-50',
  APPROVED: 'text-green-700 bg-green-50',
  REJECTED: 'text-red-700 bg-red-50',
  REVERSED: 'text-purple-700 bg-purple-50',
  AMENDED: 'text-blue-700 bg-blue-50',
};

function SummaryCard({ icon: Icon, label, value, tone = 'default', onClick }) {
  const toneStyles = {
    default: 'border-border',
    amber: 'border-amber-200 bg-amber-50/40',
    red: 'border-red-200 bg-red-50/40',
    blue: 'border-blue-200 bg-blue-50/40',
    green: 'border-green-200 bg-green-50/40',
  };
  const iconStyles = {
    default: 'text-muted-foreground',
    amber: 'text-amber-600',
    red: 'text-red-600',
    blue: 'text-blue-600',
    green: 'text-green-600',
  };

  return (
    <div
      className={`border rounded-2xl bg-card px-4 py-4 flex flex-col gap-2 ${toneStyles[tone]} ${onClick ? 'cursor-pointer hover:shadow-md transition-shadow' : ''}`}
      onClick={onClick}
    >
      <div className="flex items-center justify-between">
        <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">{label}</p>
        <Icon size={16} className={iconStyles[tone]} />
      </div>
      <p className="text-3xl font-bold text-foreground">{value ?? '—'}</p>
    </div>
  );
}

function PipelineStage({ label, count, icon: Icon, color, isLast }) {
  return (
    <div className="flex items-center gap-2">
      <div className={`flex flex-col items-center justify-center rounded-xl border px-4 py-3 min-w-[100px] ${color}`}>
        <Icon size={16} className="mb-1 opacity-70" />
        <p className="text-lg font-bold">{count}</p>
        <p className="text-[11px] font-medium mt-0.5">{label}</p>
      </div>
      {!isLast && <ArrowRight size={16} className="text-muted-foreground flex-shrink-0" />}
    </div>
  );
}

function AttentionRow({ label, count, tone, onReview }) {
  if (!count) return null;
  const toneStyles = {
    amber: 'border-amber-100 bg-amber-50/50',
    red: 'border-red-100 bg-red-50/50',
    blue: 'border-blue-100 bg-blue-50/50',
    slate: 'border-slate-100 bg-slate-50/50',
  };
  const badgeStyles = {
    amber: 'bg-amber-100 text-amber-700',
    red: 'bg-red-100 text-red-700',
    blue: 'bg-blue-100 text-blue-700',
    slate: 'bg-slate-100 text-slate-600',
  };

  return (
    <div className={`flex items-center justify-between gap-3 px-4 py-3 rounded-xl border ${toneStyles[tone]}`}>
      <div className="flex items-center gap-3">
        <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${badgeStyles[tone]}`}>{count}</span>
        <span className="text-sm text-foreground font-medium">{label}</span>
      </div>
      <button
        onClick={onReview}
        className="text-xs font-medium px-3 py-1.5 rounded-lg border border-border bg-card hover:bg-muted transition-colors whitespace-nowrap"
      >
        Review →
      </button>
    </div>
  );
}

export default function OverviewTab({ onNavigate }) {
  const [loading, setLoading] = useState(true);
  const [counts, setCounts] = useState({
    drafts: 0,
    submitted: 0,
    posted: 0,
    reversed: 0,
    openAlerts: 0,
    pendingAmendments: 0,
    pendingScanner: 0,
    pendingValue: 0,
  });
  const [recentRecords, setRecentRecords] = useState([]);

  useEffect(() => {
    async function load() {
      setLoading(true);
      try {
        const [drafts, submitted, posted, reversed, alerts, amendments, scanner, recent] = await Promise.all([
          base44.entities.StockOutRecord.filter({ status: 'DRAFT', environment: 'LIVE' }, '-created_date', 200),
          base44.entities.StockOutRecord.filter({ status: 'SUBMITTED', environment: 'LIVE' }, '-created_date', 200),
          base44.entities.StockOutRecord.filter({ status: 'POSTED', environment: 'LIVE' }, '-created_date', 200),
          base44.entities.StockOutRecord.filter({ status: 'REVERSED', environment: 'LIVE' }, '-created_date', 200),
          base44.entities.StockOutAlert.filter({ status: 'OPEN', environment: 'LIVE' }, '-created_date', 100),
          base44.entities.StockOutAmendment.filter({ request_status: 'PENDING', environment: 'LIVE' }, '-created_date', 100),
          base44.entities.ScannerIntakeQueue.filter({ sync_status: 'QUEUED', environment: 'LIVE' }, '-created_date', 100),
          base44.entities.StockOutRecord.list('-updated_date', 10),
        ]);

        const pendingValue = [...drafts, ...submitted].reduce((s, r) => s + (r.estimated_value || 0), 0);

        setCounts({
          drafts: drafts.length,
          submitted: submitted.length,
          posted: posted.length,
          reversed: reversed.length,
          openAlerts: alerts.length,
          pendingAmendments: amendments.length,
          pendingScanner: scanner.length,
          pendingValue,
        });
        setRecentRecords(recent || []);
      } catch (e) {
        console.warn('OverviewTab load error:', e);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  const needsAttention = [
    { label: 'Submitted stock-outs awaiting approval', count: counts.submitted, tone: 'amber', tab: 'WASTAGE' },
    { label: 'Draft stock-outs not yet submitted', count: counts.drafts, tone: 'slate', tab: 'WASTAGE' },
    { label: 'Scanner intake records unresolved', count: counts.pendingScanner, tone: 'blue', tab: 'SCANNER_INTAKE' },
    { label: 'Amendment requests pending', count: counts.pendingAmendments, tone: 'blue', tab: 'AMENDMENTS' },
    { label: 'Open alerts unresolved', count: counts.openAlerts, tone: 'red', tab: 'ALERTS' },
  ].filter(r => r.count > 0);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-24">
        <div className="w-6 h-6 border-2 border-muted border-t-foreground rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-base font-semibold text-foreground">Stock-Out Control Board</h2>
        <p className="text-sm text-muted-foreground mt-0.5">Review open drafts, approvals, scanner intake, amendments, and alerts.</p>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
        <SummaryCard icon={FileText} label="Drafts" value={counts.drafts} tone="default" onClick={() => onNavigate('WASTAGE')} />
        <SummaryCard icon={Clock} label="Awaiting Review" value={counts.submitted} tone="amber" onClick={() => onNavigate('WASTAGE')} />
        <SummaryCard icon={AlertTriangle} label="Open Alerts" value={counts.openAlerts} tone="red" onClick={() => onNavigate('ALERTS')} />
        <SummaryCard icon={GitPullRequest} label="Amendments" value={counts.pendingAmendments} tone="blue" onClick={() => onNavigate('AMENDMENTS')} />
        <SummaryCard
          icon={TrendingUp}
          label="Pending Value"
          value={`₱${counts.pendingValue > 999 ? (counts.pendingValue / 1000).toFixed(1) + 'k' : counts.pendingValue.toFixed(0)}`}
          tone="green"
        />
      </div>

      {/* Workflow Pipeline */}
      <div className="border border-border rounded-2xl bg-card p-4">
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground mb-4">Workflow Pipeline</p>
        <div className="flex flex-wrap items-center gap-2">
          <PipelineStage label="Drafts" count={counts.drafts} icon={FileText} color="border-slate-200 bg-slate-50 text-slate-700" />
          <PipelineStage label="Submitted" count={counts.submitted} icon={Clock} color="border-amber-200 bg-amber-50 text-amber-700" />
          <PipelineStage label="Posted" count={counts.posted} icon={CheckCircle2} color="border-green-200 bg-green-50 text-green-700" />
          <PipelineStage label="Reversed" count={counts.reversed} icon={RotateCcw} color="border-purple-200 bg-purple-50 text-purple-700" isLast />
        </div>
      </div>

      {/* Needs Attention */}
      <div className="border border-border rounded-2xl bg-card p-4 space-y-2">
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground mb-3">Needs Attention</p>
        {needsAttention.length === 0 ? (
          <div className="flex items-center gap-2 text-sm text-green-700 bg-green-50 border border-green-100 rounded-xl px-4 py-3">
            <CheckCircle2 size={15} />
            <span>No immediate actions required. All queues are clear.</span>
          </div>
        ) : (
          needsAttention.map((row) => (
            <AttentionRow
              key={row.label}
              label={row.label}
              count={row.count}
              tone={row.tone}
              onReview={() => onNavigate(row.tab)}
            />
          ))
        )}
      </div>

      {/* Recent Activity */}
      <div className="border border-border rounded-2xl bg-card overflow-hidden">
        <div className="px-4 py-3 border-b border-border bg-muted/20">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">Recent Activity</p>
        </div>
        {recentRecords.length === 0 ? (
          <div className="px-4 py-8 text-center text-sm text-muted-foreground">No recent stock-out records.</div>
        ) : (
          <div className="divide-y divide-border">
            {recentRecords.map((r) => (
              <div key={r.id} className="flex items-center justify-between px-4 py-3 gap-3">
                <div className="flex items-center gap-3 min-w-0">
                  <Zap size={13} className="text-muted-foreground flex-shrink-0" />
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-foreground truncate">{r.item_name || r.sku}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {r.stock_out_class === 'WASTAGE' ? 'Wastage' : 'Store Use'} · {r.quantity} units
                      {r.estimated_value ? ` · ₱${r.estimated_value.toFixed(0)}` : ''}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
                  <span className={`text-[11px] font-semibold px-2 py-0.5 rounded-full ${statusColor[r.status] || 'bg-muted text-muted-foreground'}`}>
                    {statusLabel[r.status] || r.status}
                  </span>
                  <span className="text-xs text-muted-foreground whitespace-nowrap">
                    {r.updated_date
                      ? new Date(r.updated_date).toLocaleDateString('en-PH', { month: 'short', day: 'numeric' })
                      : new Date(r.created_date).toLocaleDateString('en-PH', { month: 'short', day: 'numeric' })}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}