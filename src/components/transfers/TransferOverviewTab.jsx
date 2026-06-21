import { AlertTriangle, ArrowRight, CheckCircle2, Clock, RefreshCw, Route, ShieldCheck, Truck } from 'lucide-react';

const ACTIVE_STATUSES = ['PENDING_APPROVAL', 'APPROVED', 'IN_TRANSIT'];

function countByStatus(drafts, status) {
  return drafts.filter(d => d.status === status).length;
}

function isThisMonth(dateValue) {
  if (!dateValue) return false;
  const date = new Date(dateValue);
  const now = new Date();
  return date.getMonth() === now.getMonth() && date.getFullYear() === now.getFullYear();
}

function daysSince(dateValue) {
  if (!dateValue) return null;
  const date = new Date(dateValue);
  if (Number.isNaN(date.getTime())) return null;
  return Math.floor((Date.now() - date.getTime()) / (1000 * 60 * 60 * 24));
}

function SummaryCard({ label, value, helper }) {
  return (
    <div className="rounded-2xl border border-border bg-card p-4 min-h-[112px] flex flex-col justify-between">
      <div>
        <p className="text-xs font-medium text-muted-foreground">{label}</p>
        <p className="text-3xl font-bold text-foreground mt-2 leading-none">{value}</p>
      </div>
      {helper && <p className="text-xs text-muted-foreground mt-3 leading-snug">{helper}</p>}
    </div>
  );
}

function NeedsAttentionRow({ label, count, guidance, tone = 'default' }) {
  const toneClass = tone === 'warning'
    ? 'bg-amber-50 text-amber-700 border-amber-200'
    : tone === 'danger'
      ? 'bg-red-50 text-red-700 border-red-200'
      : 'bg-muted text-muted-foreground border-border';

  return (
    <div className="grid grid-cols-1 md:grid-cols-[1fr_90px_180px] gap-2 md:gap-4 px-4 py-3 border-t border-border first:border-t-0 items-center">
      <div className="text-sm font-medium text-foreground">{label}</div>
      <div>
        <span className={`inline-flex items-center justify-center min-w-8 h-6 px-2 rounded-full border text-xs font-semibold ${toneClass}`}>
          {count}
        </span>
      </div>
      <div className="text-xs text-muted-foreground">{guidance}</div>
    </div>
  );
}

export default function TransferOverviewTab({ drafts, loading, onRefresh, onNewTransfer }) {
  const pending = countByStatus(drafts, 'PENDING_APPROVAL');
  const approved = countByStatus(drafts, 'APPROVED');
  const inTransit = countByStatus(drafts, 'IN_TRANSIT');
  const awaitingReceiving = inTransit;
  const completedThisMonth = drafts.filter(d => d.status === 'RECEIVED' && isThisMonth(d.received_at || d.submitted_at)).length;
  const rejected = countByStatus(drafts, 'REJECTED');
  const discrepancies = drafts.filter(d => d.has_discrepancy).length;
  const overdueInTransit = drafts.filter(d => d.status === 'IN_TRANSIT' && (daysSince(d.dispatched_at || d.approved_at || d.submitted_at) ?? 0) >= 7).length;
  const activeTransfers = drafts.filter(d => ACTIVE_STATUSES.includes(d.status)).length;
  const needsAttentionTotal = pending + awaitingReceiving + rejected + discrepancies + overdueInTransit;

  return (
    <div className="space-y-5">
      <div className="rounded-2xl border border-border bg-card p-5 flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div className="flex items-start gap-3">
          <div className="w-9 h-9 rounded-xl border border-border bg-muted/30 flex items-center justify-center flex-shrink-0">
            <ShieldCheck size={16} className="text-muted-foreground" />
          </div>
          <div className="space-y-1">
            <h2 className="text-base font-semibold text-foreground">Controlled stock transfer workflow</h2>
            <p className="text-sm text-muted-foreground leading-relaxed max-w-3xl">
              Transfers moves stock through approval, dispatch, in-transit tracking, and receiving confirmation. Use Locations for visibility only; this page is the governed stock-changing workflow.
            </p>
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            onClick={onRefresh}
            disabled={loading}
            className="h-9 px-3.5 rounded-xl border border-border bg-card text-sm text-foreground hover:bg-muted disabled:opacity-50 flex items-center gap-2"
          >
            <RefreshCw size={14} className={loading ? 'animate-spin' : ''} /> Refresh
          </button>
          <button
            onClick={onNewTransfer}
            className="h-9 px-3.5 rounded-xl bg-primary text-primary-foreground text-sm font-medium hover:opacity-90"
          >
            New Transfer
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-5 gap-3">
        <SummaryCard label="Pending Approval" value={pending} helper="Awaiting supervisor or manager action" />
        <SummaryCard label="Approved" value={approved} helper="Approved but not yet in transit" />
        <SummaryCard label="In Transit" value={inTransit} helper="Awaiting destination receiving" />
        <SummaryCard label="Completed This Month" value={completedThisMonth} helper="Received transfers only" />
        <SummaryCard label="Needs Attention" value={needsAttentionTotal} helper="Approval, receiving, rejection, or discrepancy review" />
      </div>

      <div className="rounded-2xl border border-border bg-card overflow-hidden">
        <div className="px-5 py-3.5 border-b border-border bg-muted/20 flex items-center gap-2">
          <Route size={15} className="text-muted-foreground" />
          <h2 className="text-sm font-semibold text-foreground">Transfer Pipeline</h2>
        </div>
        <div className="p-5">
          <div className="flex flex-col lg:flex-row lg:items-center gap-3 text-sm">
            {[
              { label: 'Pending Approval', icon: Clock, count: pending },
              { label: 'Approved', icon: CheckCircle2, count: approved },
              { label: 'In Transit', icon: Truck, count: inTransit },
              { label: 'Received', icon: CheckCircle2, count: completedThisMonth },
            ].map((step, index, arr) => {
              const Icon = step.icon;
              return (
                <div key={step.label} className="flex items-center gap-3 flex-1 min-w-0">
                  <div className="flex items-center gap-2 rounded-xl border border-border bg-background px-3 py-2 flex-1 min-w-0">
                    <Icon size={14} className="text-muted-foreground flex-shrink-0" />
                    <span className="font-medium text-foreground truncate">{step.label}</span>
                    <span className="ml-auto text-xs rounded-full border border-border bg-muted px-2 py-0.5 font-semibold text-muted-foreground">{step.count}</span>
                  </div>
                  {index < arr.length - 1 && <ArrowRight size={14} className="hidden lg:block text-muted-foreground flex-shrink-0" />}
                </div>
              );
            })}
          </div>
          {activeTransfers === 0 && (
            <p className="text-sm text-muted-foreground mt-4">No active transfers are currently moving through the pipeline.</p>
          )}
        </div>
      </div>

      <div className="rounded-2xl border border-border bg-card overflow-hidden">
        <div className="px-5 py-3.5 border-b border-border bg-muted/20 flex items-center gap-2">
          <AlertTriangle size={15} className="text-muted-foreground" />
          <h2 className="text-sm font-semibold text-foreground">Needs Attention</h2>
        </div>
        {needsAttentionTotal === 0 ? (
          <div className="px-5 py-10 text-center text-sm text-muted-foreground">No transfer workflow issues found.</div>
        ) : (
          <div>
            <NeedsAttentionRow label="Transfers awaiting approval" count={pending} guidance="Review pending approvals" tone={pending > 0 ? 'warning' : 'default'} />
            <NeedsAttentionRow label="Transfers awaiting receiving" count={awaitingReceiving} guidance="Confirm at destination" tone={awaitingReceiving > 0 ? 'warning' : 'default'} />
            <NeedsAttentionRow label="Overdue in-transit transfers" count={overdueInTransit} guidance="Investigate route or delivery" tone={overdueInTransit > 0 ? 'danger' : 'default'} />
            <NeedsAttentionRow label="Rejected transfers needing correction" count={rejected} guidance="Review and recreate if required" tone={rejected > 0 ? 'warning' : 'default'} />
            <NeedsAttentionRow label="Transfers with discrepancies" count={discrepancies} guidance="Review exception trail" tone={discrepancies > 0 ? 'danger' : 'default'} />
          </div>
        )}
      </div>
    </div>
  );
}
