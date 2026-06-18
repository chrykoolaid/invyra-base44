import { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  AlertTriangle,
  ArrowRight,
  BarChart3,
  CheckCircle2,
  ClipboardList,
  Clock,
  Plus,
  Printer,
  RefreshCw,
  Tag,
} from 'lucide-react';
import { base44 } from '@/api/base44Client';
import CreateMarkdownBatchModal from '@/components/markdown/CreateMarkdownBatchModal';

const SECONDARY_LINKS = [
  { id: 'batches', label: 'Active Batches', icon: Tag, path: '/Markdown/Batches' },
  { id: 'review', label: 'Review Queue', icon: ClipboardList, path: '/Markdown/ReviewQueue' },
  { id: 'monitor', label: 'Monitor Sheet', icon: Printer, path: '/Markdown/Monitor' },
  { id: 'reports', label: 'Reports', icon: BarChart3, path: '/Markdown/Reports' },
];

const OPEN_REVIEW_STATUSES = [
  'Pending_Investigation',
  'Supervisor_Ack',
  'Manager_Auth',
  'Ready_For_Disposition',
];

const batchStatusStyle = {
  Draft: 'bg-slate-100 text-slate-600 border-slate-200',
  Pending_Approval: 'bg-amber-50 text-amber-700 border-amber-200',
  Active: 'bg-green-50 text-green-700 border-green-200',
  Review_Queue: 'bg-orange-50 text-orange-700 border-orange-200',
  Disposition_Complete: 'bg-blue-50 text-blue-700 border-blue-200',
  Recovered: 'bg-purple-50 text-purple-700 border-purple-200',
  Voided: 'bg-red-50 text-red-700 border-red-200',
};

const formatQty = (value) => Number(value || 0).toLocaleString('en-PH');
const formatMoney = (value) => {
  if (value === null || value === undefined || Number.isNaN(Number(value))) return '—';
  return `₱${Number(value).toFixed(2)}`;
};
const formatDate = (value) => {
  if (!value) return '—';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '—';
  return date.toLocaleDateString('en-PH', { month: 'short', day: 'numeric' });
};

function todayKey() {
  return new Date().toISOString().slice(0, 10);
}

function getSlaStatus(entry) {
  const now = new Date();
  if (!entry?.deadline_warning_at) return 'ok';
  if (entry.deadline_critical_at && now >= new Date(entry.deadline_critical_at)) return 'critical';
  if (entry.deadline_escalation_at && now >= new Date(entry.deadline_escalation_at)) return 'escalation';
  if (now >= new Date(entry.deadline_warning_at)) return 'warning';
  return 'ok';
}

function daysUntil(dateString) {
  if (!dateString) return null;
  const start = new Date(todayKey());
  const end = new Date(dateString);
  if (Number.isNaN(end.getTime())) return null;
  return Math.ceil((end - start) / 86400000);
}

async function safeFilter(entityName, query, sort, limit) {
  try {
    const entity = base44.entities?.[entityName];
    if (!entity?.filter) return { data: [], ok: false };
    const data = await entity.filter(query, sort, limit);
    return { data: data || [], ok: true };
  } catch (error) {
    console.warn(`Markdown control board could not load ${entityName}:`, error);
    return { data: [], ok: false };
  }
}

function SummaryCard({ icon: Icon, label, value, tone = 'default', to }) {
  const toneStyles = {
    default: 'border-border bg-card',
    amber: 'border-amber-200 bg-amber-50/40',
    orange: 'border-orange-200 bg-orange-50/40',
    blue: 'border-blue-200 bg-blue-50/40',
    green: 'border-green-200 bg-green-50/40',
  };
  const iconStyles = {
    default: 'text-muted-foreground',
    amber: 'text-amber-600',
    orange: 'text-orange-600',
    blue: 'text-blue-600',
    green: 'text-green-600',
  };

  const content = (
    <div className={`border rounded-2xl px-4 py-3.5 ${toneStyles[tone]} ${to ? 'hover:shadow-sm hover:border-primary/30 transition-all' : ''}`}>
      <div className="flex items-center justify-between gap-3">
        <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-muted-foreground truncate">{label}</p>
        <Icon size={16} className={`${iconStyles[tone]} flex-shrink-0`} />
      </div>
      <p className="text-2xl font-bold text-foreground mt-2">{value ?? '—'}</p>
    </div>
  );

  return to ? <Link to={to}>{content}</Link> : content;
}

function EmptyState({ icon: Icon, title, description }) {
  return (
    <div className="border border-dashed border-border rounded-xl bg-muted/20 px-4 py-8 text-center">
      <Icon size={28} className="mx-auto mb-3 text-muted-foreground/40" />
      <p className="text-sm font-medium text-foreground">{title}</p>
      {description && <p className="text-xs text-muted-foreground mt-1">{description}</p>}
    </div>
  );
}

function StatusBadge({ status }) {
  return (
    <span className={`text-[10px] px-2 py-0.5 rounded-full border font-semibold whitespace-nowrap ${batchStatusStyle[status] || 'bg-muted text-muted-foreground border-border'}`}>
      {(status || 'Unknown').replace(/_/g, ' ')}
    </span>
  );
}

function ActiveBatchRow({ batch, round }) {
  const sellPct = Number(batch.sell_through_pct || 0);
  const expiryDays = daysUntil(round?.expiry_date);
  const expiryTone = expiryDays === null
    ? 'text-muted-foreground'
    : expiryDays < 0
      ? 'text-red-700 font-semibold'
      : expiryDays <= 1
        ? 'text-red-600 font-semibold'
        : expiryDays <= 3
          ? 'text-amber-700 font-medium'
          : 'text-muted-foreground';

  return (
    <div className="grid grid-cols-12 gap-3 px-4 py-3 items-center hover:bg-muted/30 transition-colors">
      <div className="col-span-12 md:col-span-4 min-w-0">
        <div className="flex items-center gap-2 min-w-0">
          <span className="font-mono text-xs font-semibold text-foreground truncate">{batch.batch_ref || batch.id?.slice(-8) || '—'}</span>
          <StatusBadge status={batch.status} />
        </div>
        <p className="text-sm font-medium text-foreground truncate mt-1">{batch.item_name || 'Unnamed item'}</p>
        <p className="text-xs font-mono text-muted-foreground truncate">{batch.sku || 'No SKU'}</p>
      </div>

      <div className="col-span-4 md:col-span-2 text-xs">
        <p className="text-muted-foreground">Remaining</p>
        <p className="font-semibold text-foreground mt-0.5">{formatQty(batch.current_remaining_qty)}</p>
      </div>

      <div className="col-span-4 md:col-span-2 text-xs">
        <p className="text-muted-foreground">Round / Price</p>
        <p className="font-semibold text-foreground mt-0.5">R{batch.current_round_number || round?.round_number || 1} · {formatMoney(round?.markdown_unit_price)}</p>
      </div>

      <div className="col-span-4 md:col-span-2 text-xs">
        <p className="text-muted-foreground">Expiry</p>
        <p className={`mt-0.5 ${expiryTone}`}>{round?.expiry_date ? formatDate(round.expiry_date) : '—'}</p>
      </div>

      <div className="col-span-12 md:col-span-2 flex items-center justify-between md:justify-end gap-3">
        <div className="text-xs md:text-right">
          <p className="text-muted-foreground">Sell-through</p>
          <p className={`font-bold mt-0.5 ${sellPct >= 80 ? 'text-green-700' : sellPct >= 50 ? 'text-amber-700' : 'text-slate-700'}`}>{sellPct.toFixed(1)}%</p>
        </div>
        <Link to="/Markdown/Batches" className="text-xs font-semibold text-primary hover:underline whitespace-nowrap">
          Open <ArrowRight size={12} className="inline ml-0.5" />
        </Link>
      </div>
    </div>
  );
}

function AttentionItem({ tone, count, title, description, to }) {
  const toneStyles = {
    red: 'border-red-100 bg-red-50/60 text-red-700',
    amber: 'border-amber-100 bg-amber-50/60 text-amber-700',
    orange: 'border-orange-100 bg-orange-50/60 text-orange-700',
    blue: 'border-blue-100 bg-blue-50/60 text-blue-700',
    slate: 'border-slate-100 bg-slate-50/60 text-slate-700',
  };

  return (
    <Link to={to} className={`block border rounded-xl px-3.5 py-3 hover:shadow-sm transition-all ${toneStyles[tone] || toneStyles.slate}`}>
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-sm font-semibold text-foreground">{title}</p>
          <p className="text-xs mt-0.5 opacity-80">{description}</p>
        </div>
        <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-white/80 border border-current/10 flex-shrink-0">{count}</span>
      </div>
    </Link>
  );
}

export default function Markdown() {
  const navigate = useNavigate();
  const [showCreate, setShowCreate] = useState(false);
  const [loading, setLoading] = useState(true);
  const [lastRefresh, setLastRefresh] = useState(null);
  const [batches, setBatches] = useState([]);
  const [reviewEntries, setReviewEntries] = useState([]);
  const [roundsByBatch, setRoundsByBatch] = useState({});
  const [printEvents, setPrintEvents] = useState([]);
  const [printEventsAvailable, setPrintEventsAvailable] = useState(true);

  const load = async () => {
    setLoading(true);

    const [batchResult, reviewResult, roundResult, printResult] = await Promise.all([
      safeFilter('MarkdownBatch', { environment: 'LIVE' }, '-created_date', 200),
      safeFilter('MarkdownReviewQueue', { environment: 'LIVE' }, '-entered_review_at', 100),
      safeFilter('MarkdownRound', { environment: 'LIVE' }, '-created_date', 500),
      safeFilter('MarkdownPrintEvent', { environment: 'LIVE' }, '-printed_at', 200),
    ]);

    const roundMap = {};
    (roundResult.data || []).forEach((round) => {
      if (!round.batch_id) return;
      if (!roundMap[round.batch_id]) roundMap[round.batch_id] = [];
      roundMap[round.batch_id].push(round);
    });

    Object.keys(roundMap).forEach((batchId) => {
      roundMap[batchId].sort((a, b) => Number(b.round_number || 0) - Number(a.round_number || 0));
    });

    setBatches(batchResult.data || []);
    setReviewEntries(reviewResult.data || []);
    setRoundsByBatch(roundMap);
    setPrintEvents(printResult.data || []);
    setPrintEventsAvailable(printResult.ok);
    setLastRefresh(new Date());
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const computed = useMemo(() => {
    const active = batches.filter((batch) => ['Active', 'Pending_Approval', 'Review_Queue'].includes(batch.status));
    const openReview = reviewEntries.filter((entry) => OPEN_REVIEW_STATUSES.includes(entry.status));
    const criticalReview = openReview.filter((entry) => getSlaStatus(entry) === 'critical');
    const warningReview = openReview.filter((entry) => ['warning', 'escalation'].includes(getSlaStatus(entry)));
    const readyForDisposition = openReview.filter((entry) => entry.status === 'Ready_For_Disposition');
    const pendingApproval = batches.filter((batch) => batch.status === 'Pending_Approval');
    const failedPrints = printEvents.filter((event) => event.print_status === 'Failed');
    const printedToday = printEvents.filter((event) => {
      if (event.print_status !== 'Success' || !event.printed_at) return false;
      return String(event.printed_at).slice(0, 10) === todayKey();
    });

    const expiringSoon = active.filter((batch) => {
      const round = (roundsByBatch[batch.id] || []).find((r) => r.status === 'Active') || roundsByBatch[batch.id]?.[0];
      const days = daysUntil(round?.expiry_date);
      return days !== null && days <= 1;
    });

    const activeSorted = [...active].sort((a, b) => {
      const priority = { Pending_Approval: 0, Review_Queue: 1, Active: 2 };
      return (priority[a.status] ?? 9) - (priority[b.status] ?? 9);
    });

    return {
      active,
      activeSorted,
      openReview,
      criticalReview,
      warningReview,
      readyForDisposition,
      pendingApproval,
      failedPrints,
      printedToday,
      expiringSoon,
      inReviewCount: Math.max(openReview.length, batches.filter((batch) => batch.status === 'Review_Queue').length),
    };
  }, [batches, reviewEntries, roundsByBatch, printEvents]);

  const attentionItems = [
    computed.criticalReview.length > 0 && {
      tone: 'red',
      count: computed.criticalReview.length,
      title: 'Critical review entries overdue',
      description: 'Manager confirmation required before disposition.',
      to: '/Markdown/ReviewQueue',
    },
    computed.readyForDisposition.length > 0 && {
      tone: 'orange',
      count: computed.readyForDisposition.length,
      title: 'Ready for disposition',
      description: 'Awaiting final waste, recovery, or store-use outcome.',
      to: '/Markdown/ReviewQueue',
    },
    computed.pendingApproval.length > 0 && {
      tone: 'amber',
      count: computed.pendingApproval.length,
      title: 'Batches pending approval',
      description: 'Supervisor or manager approval needed before labels.',
      to: '/Markdown/Batches',
    },
    computed.failedPrints.length > 0 && {
      tone: 'red',
      count: computed.failedPrints.length,
      title: 'Label print failures',
      description: 'Check printer/device before releasing markdown labels.',
      to: '/Markdown/Monitor',
    },
    computed.warningReview.length > 0 && {
      tone: 'amber',
      count: computed.warningReview.length,
      title: 'Review entries nearing SLA',
      description: 'Investigate before escalation becomes critical.',
      to: '/Markdown/ReviewQueue',
    },
    computed.expiringSoon.length > 0 && {
      tone: 'blue',
      count: computed.expiringSoon.length,
      title: 'Labels expiring soon',
      description: 'Check active floor labels and monitor sheet.',
      to: '/Markdown/Monitor',
    },
  ].filter(Boolean);

  return (
    <div className="p-6 space-y-5">
      {showCreate && (
        <CreateMarkdownBatchModal
          onClose={() => setShowCreate(false)}
          onCreated={() => {
            setShowCreate(false);
            load();
          }}
        />
      )}

      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-foreground tracking-tight">Markdown Control</h1>
          <p className="text-sm text-muted-foreground mt-1">Near-expiry price reduction and recovery workflow</p>
          <p className="text-xs text-muted-foreground mt-1">
            {lastRefresh ? `Last refreshed ${lastRefresh.toLocaleTimeString('en-PH', { hour: '2-digit', minute: '2-digit' })}` : 'Loading live markdown queues'}
          </p>
        </div>

        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => setShowCreate(true)}
            className="flex items-center gap-1.5 h-9 px-3 text-sm bg-primary text-primary-foreground rounded-lg hover:opacity-90"
          >
            <Plus size={14} /> New Markdown Batch
          </button>
          <Link to="/Markdown/Monitor" className="flex items-center gap-1.5 h-9 px-3 text-sm border border-border rounded-lg bg-card hover:bg-muted text-foreground">
            <Printer size={14} /> Print Monitor Sheet
          </Link>
          <button onClick={load} className="flex items-center gap-1.5 h-9 px-3 text-sm border border-border rounded-lg bg-card hover:bg-muted text-foreground">
            <RefreshCw size={14} className={loading ? 'animate-spin' : ''} /> Refresh
          </button>
          <Link to="/Markdown/Reports" className="flex items-center gap-1.5 h-9 px-3 text-sm border border-border rounded-lg bg-card hover:bg-muted text-foreground">
            <BarChart3 size={14} /> Reports
          </Link>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-5 gap-3">
        <SummaryCard icon={Tag} label="Active Batches" value={batches.filter((batch) => batch.status === 'Active').length} tone="green" to="/Markdown/Batches" />
        <SummaryCard icon={Clock} label="Pending Approval" value={computed.pendingApproval.length} tone="amber" to="/Markdown/Batches" />
        <SummaryCard icon={ClipboardList} label="In Review" value={computed.inReviewCount} tone="orange" to="/Markdown/ReviewQueue" />
        <SummaryCard icon={CheckCircle2} label="Ready for Disposition" value={computed.readyForDisposition.length} tone="blue" to="/Markdown/ReviewQueue" />
        <SummaryCard icon={Printer} label="Labels Printed Today" value={printEventsAvailable ? computed.printedToday.length : '—'} tone="default" to="/Markdown/Monitor" />
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20 border border-border rounded-2xl bg-card">
          <div className="w-6 h-6 border-2 border-muted border-t-foreground rounded-full animate-spin" />
        </div>
      ) : (
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">
          <section className="xl:col-span-2 border border-border rounded-2xl bg-card overflow-hidden">
            <div className="flex items-center justify-between gap-3 px-4 py-3 border-b border-border bg-muted/20">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.16em] text-muted-foreground">Active Markdown Work</p>
                <p className="text-sm text-muted-foreground mt-0.5">Latest active, approval, and review batches.</p>
              </div>
              <Link to="/Markdown/Batches" className="hidden sm:flex items-center gap-1 text-xs font-semibold text-primary hover:underline">
                View all <ArrowRight size={12} />
              </Link>
            </div>

            {computed.activeSorted.length === 0 ? (
              <div className="p-4">
                <EmptyState
                  icon={Tag}
                  title="No active markdown batches"
                  description="Create a new batch when near-expiry stock is ready for controlled markdown."
                />
              </div>
            ) : (
              <div className="divide-y divide-border">
                {computed.activeSorted.slice(0, 8).map((batch) => {
                  const activeRound = (roundsByBatch[batch.id] || []).find((round) => round.status === 'Active') || roundsByBatch[batch.id]?.[0];
                  return <ActiveBatchRow key={batch.id} batch={batch} round={activeRound} />;
                })}
              </div>
            )}
          </section>

          <aside className="space-y-4">
            <section className="border border-border rounded-2xl bg-card p-4">
              <div className="flex items-start justify-between gap-3 mb-3">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.16em] text-muted-foreground">Needs Attention</p>
                  <p className="text-sm text-muted-foreground mt-0.5">Approval, review, and label issues.</p>
                </div>
                <AlertTriangle size={16} className={attentionItems.length ? 'text-amber-600' : 'text-green-600'} />
              </div>

              {attentionItems.length === 0 ? (
                <div className="flex items-start gap-2 rounded-xl border border-green-100 bg-green-50/70 px-3 py-3 text-sm text-green-700">
                  <CheckCircle2 size={15} className="mt-0.5 flex-shrink-0" />
                  <span>No immediate markdown actions required. Queues are clear.</span>
                </div>
              ) : (
                <div className="space-y-2">
                  {attentionItems.map((item) => <AttentionItem key={item.title} {...item} />)}
                </div>
              )}
            </section>

            <section className="border border-border rounded-2xl bg-card p-4">
              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-muted-foreground mb-3">Workflow Shortcuts</p>
              <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-1 gap-2">
                {SECONDARY_LINKS.map((link) => {
                  const Icon = link.icon;
                  return (
                    <Link
                      key={link.id}
                      to={link.path}
                      className="flex items-center justify-between gap-3 rounded-xl border border-border bg-background px-3 py-2.5 text-sm hover:bg-muted/60 transition-colors"
                    >
                      <span className="flex items-center gap-2 min-w-0">
                        <Icon size={15} className="text-primary flex-shrink-0" />
                        <span className="font-medium text-foreground truncate">{link.label}</span>
                      </span>
                      <ArrowRight size={13} className="text-muted-foreground flex-shrink-0" />
                    </Link>
                  );
                })}
              </div>
            </section>

            <section className="border border-dashed border-border rounded-2xl bg-muted/20 p-4">
              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-muted-foreground">Guardrail</p>
              <p className="text-sm text-foreground mt-2">Markdown stays separate from Wastage. Final waste, recovery, or store-use outcomes still require controlled review and posting.</p>
            </section>
          </aside>
        </div>
      )}
    </div>
  );
}
