import { useEffect, useMemo, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { ArrowRight, BellRing, Download, Filter, History, Plus, ScanLine, Search, ShieldCheck } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { base44 } from '@/api/base44Client';
import {
  createAlertRule,
  evaluateAlertRules,
  getAlertApiPosture,
  getAlertInstances,
  getAlertRuleReadinessRows,
  getAlertRules,
  getAlertSummary,
  getBarcodeMappings,
  getGovernanceSummary,
  getKpiSummary,
  getLastAlertEvaluation,
  getLiveKpiSummary,
  getReasonGovernanceRows,
  getReportingPrototype,
  getSourcePosture,
  getUnresolvedScans,
  reasonOptions,
  statusStyle,
} from '../lib/wastageData.js';

const statusTabs = [
  { key: 'ALL', label: 'All Events' },
  { key: 'DRAFT', label: 'Drafts' },
  { key: 'SUBMITTED', label: 'Submitted' },
  { key: 'APPROVED', label: 'Approved' },
  { key: 'REJECTED', label: 'Rejected' },
  { key: 'REVERSED', label: 'Reversed' },
];

const surfaceTabs = [
  { key: 'OPERATIONS', label: 'Operations Queue' },
  { key: 'ALERTS', label: 'Alert Rules & Instances' },
  { key: 'REPORTING', label: 'Reporting' },
  { key: 'GUIDES', label: 'Guides' },
];

const alertTabs = [
  { key: 'ALL', label: 'All instances' },
  { key: 'ACTION_NEEDED', label: 'Action needed' },
  { key: 'ACKNOWLEDGED', label: 'Acknowledged' },
  { key: 'HIGH', label: 'High severity' },
];

const reportWindowTabs = [
  { key: '24', label: '24 hours' },
  { key: '168', label: '7 days' },
  { key: '720', label: '30 days' },
];

const reportPrototypeWindowTabs = [
  { key: '7D', label: 'Last 7 days' },
  { key: '30D', label: 'Last 30 days' },
  { key: 'SNAPSHOT', label: 'Current snapshot' },
];

const reportScopeTabs = [
  { key: 'APPROVED', label: 'Approved only' },
  { key: 'REVIEWED', label: 'Reviewed' },
  { key: 'ALL', label: 'All events' },
];

const reportGroupTabs = [
  { key: 'REASON', label: 'By reason' },
  { key: 'SKU', label: 'By SKU' },
  { key: 'LOCATION', label: 'By location' },
];

function KpiCard({ label, value, helper, tone = 'text-foreground' }) {
  return (
    <div className="border border-border rounded-2xl bg-card px-4 py-3 min-h-[104px] shadow-sm">
      <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-[0.22em] mb-1.5">{label}</p>
      <p className={`text-[1.9rem] leading-none font-bold ${tone}`}>{value}</p>
      <p className="text-xs text-muted-foreground mt-2 leading-relaxed">{helper}</p>
    </div>
  );
}

function PillTab({ active, onClick, label }) {
  return (
    <button
      onClick={onClick}
      className={`h-9 px-3.5 rounded-xl border text-sm font-medium transition-colors ${
        active ? 'border-primary bg-primary/5 text-primary' : 'border-border bg-card text-muted-foreground hover:bg-muted hover:text-foreground'
      }`}
    >
      {label}
    </button>
  );
}

function SectionCard({ title, subtitle, children, action }) {
  return (
    <div className="min-w-0 border border-border rounded-2xl bg-card shadow-sm overflow-hidden">
      <div className="px-4 py-3 border-b border-border bg-muted/20 flex items-start gap-3">
        <div className="min-w-0">
          <p className="text-sm font-medium text-foreground">{title}</p>
          {subtitle ? <p className="text-xs text-muted-foreground mt-1 leading-relaxed">{subtitle}</p> : null}
        </div>
        {action ? <div className="ml-auto shrink-0">{action}</div> : null}
      </div>
      <div className="p-4">{children}</div>
    </div>
  );
}

function PolicyChip({ bucket, chipClass }) {
  return <span className={`inline-flex text-[11px] px-2.5 py-0.5 rounded-full font-medium ${chipClass}`}>{bucket}</span>;
}

function AlertInstanceCard({ instance }) {
  return (
    <div className="border border-border rounded-2xl px-4 py-3 bg-background/40">
      <div className="flex flex-wrap items-center gap-2">
        <span className={`inline-flex text-[11px] px-2.5 py-0.5 rounded-full font-medium ${instance.severityClass || (instance.severity === 'HIGH' ? 'bg-red-50 text-red-700 border border-red-200' : 'bg-amber-50 text-amber-700 border border-amber-200')}`}>
          {instance.severity}
        </span>
        <span className={`inline-flex text-[11px] px-2.5 py-0.5 rounded-full font-medium ${instance.stateClass || 'bg-slate-100 text-slate-700 border border-slate-200'}`}>
          {instance.stateLabel || (instance.isAcknowledged ? 'Acknowledged' : 'Action needed')}
        </span>
        <p className="min-w-0 text-sm font-medium text-foreground break-words">{instance.ruleName || instance.ruleId}</p>
        <span className="text-[11px] text-muted-foreground">{instance.window}</span>
      </div>
      <p className="text-sm text-muted-foreground mt-2 leading-relaxed">{instance.message}</p>
      <p className="text-[11px] text-muted-foreground mt-2">{instance.scope}</p>
      <p className="text-[11px] text-muted-foreground mt-1">{instance.acknowledgementLabel || 'Acknowledgement write pending'}</p>
    </div>
  );
}

function ReadinessLine({ item }) {
  const stateClass = item.state === 'live'
    ? 'bg-green-50 text-green-700 border border-green-200'
    : item.state === 'stored'
      ? 'bg-blue-50 text-blue-700 border border-blue-200'
      : 'bg-slate-100 text-slate-700 border border-slate-200';

  const stateLabel = item.state === 'live' ? 'Live now' : item.state === 'stored' ? 'Stored in engine' : 'Future-ready';

  return (
    <div className="border border-border rounded-2xl px-4 py-3 bg-background/40">
      <div className="flex flex-wrap items-center gap-2">
        <span className={`inline-flex text-[11px] px-2.5 py-0.5 rounded-full font-medium ${stateClass}`}>{stateLabel}</span>
        <p className="text-sm font-medium text-foreground">{item.label}</p>
      </div>
      <p className="text-sm text-muted-foreground mt-2 leading-relaxed">{item.helper}</p>
    </div>
  );
}



function getOperationsImpactLines(row) {
  if (row.status === 'APPROVED') {
    return [row.movementState || 'Movement posted', `On-hand reduced by ${row.qty}`, `Current stock ${row.currentOnHand}`];
  }

  if (row.status === 'REVERSED') {
    return [row.movementState || 'Posted and reversed', 'Original movement undone', `Current stock ${row.currentOnHand}`];
  }

  if (row.status === 'SUBMITTED') {
    return [row.movementState || 'Waiting for approval', 'No stock movement posted yet', `Current stock unchanged (${row.currentOnHand})`];
  }

  if (row.status === 'REJECTED') {
    return ['Rejected / no stock impact', 'No movement posted', `Current stock ${row.currentOnHand}`];
  }

  return [row.movementState || 'No movement posted', 'Draft / not submitted', `Current stock ${row.currentOnHand}`];
}

function AlertQueueRow({ instance, selected, onSelect, onOpenEvent }) {
  return (
    <tr
      className={`border-t border-border cursor-pointer transition-colors ${selected ? 'bg-primary/5' : 'bg-card hover:bg-muted/25'}`}
      onClick={() => onSelect(instance.id)}
    >
      <td className="px-4 py-3 align-top min-w-[260px]">
        <div className="font-medium text-foreground">{instance.ruleName}</div>
        <div className="text-[11px] text-muted-foreground mt-0.5">{instance.id} · {instance.window}</div>
        <div className="text-[11px] text-muted-foreground mt-1">{instance.message}</div>
      </td>
      <td className="px-4 py-3 align-top whitespace-nowrap">
        <span className={`inline-flex text-[11px] px-2.5 py-0.5 rounded-full font-medium ${instance.severityClass}`}>{instance.severity}</span>
      </td>
      <td className="px-4 py-3 align-top whitespace-nowrap">
        <span className={`inline-flex text-[11px] px-2.5 py-0.5 rounded-full font-medium ${instance.stateClass}`}>{instance.stateLabel}</span>
      </td>
      <td className="px-4 py-3 align-top min-w-[220px] text-muted-foreground">
        <div>{instance.scope}</div>
        <div className="text-[11px] mt-0.5">{instance.thresholdLabel}</div>
      </td>
      <td className="px-4 py-3 align-top min-w-[200px] text-muted-foreground">
        <div>{instance.eventId}</div>
        <div className="text-[11px] mt-0.5">{instance.relatedLocation} · {instance.relatedSku}</div>
      </td>
      <td className="px-4 py-3 align-top min-w-[230px] text-muted-foreground">
        <div>{instance.acknowledgementLabel}</div>
        <div className="text-[11px] mt-0.5">{instance.nextAction}</div>
      </td>
      <td className="px-4 py-3 align-top whitespace-nowrap">
        <button
          onClick={(event) => {
            event.stopPropagation();
            onOpenEvent(instance.eventId);
          }}
          className="inline-flex items-center gap-1.5 text-sm text-primary font-medium hover:opacity-80"
        >
          Open event <ArrowRight size={14} />
        </button>
      </td>
    </tr>
  );
}

export default function Wastage() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const initialSurface = (() => {
    const surface = searchParams.get('surface');
    return surfaceTabs.some((tab) => tab.key === surface) ? surface : 'OPERATIONS';
  })();

  const [query, setQuery] = useState('');
  const [activeTab, setActiveTab] = useState('ALL');
  const [refreshTick, setRefreshTick] = useState(0);
  const [activeSurface, setActiveSurface] = useState(initialSurface);
  const [reportWindowHours, setReportWindowHours] = useState('168');
  const [reportPrototypeWindow, setReportPrototypeWindow] = useState('30D');
  const [reportScope, setReportScope] = useState('REVIEWED');
  const [reportGroupBy, setReportGroupBy] = useState('REASON');
  const [alertQuery, setAlertQuery] = useState('');
  const [alertFilter, setAlertFilter] = useState('ACTION_NEEDED');
  const [selectedAlertId, setSelectedAlertId] = useState('');
  const [ruleForm, setRuleForm] = useState({
    name: 'Custom wastage threshold',
    location: '',
    sku: '',
    reason: '',
    thresholdQty: 8,
    windowHours: 24,
    severity: 'MEDIUM',
  });
  const [liveMovements, setLiveMovements] = useState([]);
  const [liveAuditFeed, setLiveAuditFeed] = useState([]);

  // Fetch live stock movements for wastage
  useEffect(() => {
    base44.entities.StockMovement.filter({ movement_type: 'WASTE' }, '-created_date', 10).then(data => {
      setLiveMovements(data || []);
    });
  }, [refreshTick]);

  const reasonRows = useMemo(() => getReasonGovernanceRows(), [refreshTick]);
  const barcodeRows = useMemo(() => getBarcodeMappings(), [refreshTick]);
  const unresolvedScans = useMemo(() => getUnresolvedScans(), [refreshTick]);
  const governanceSummary = useMemo(() => getGovernanceSummary(), [refreshTick]);
  const alertRules = useMemo(() => getAlertRules(), [refreshTick]);
  const alertInstances = useMemo(() => getAlertInstances(), [refreshTick]);
  const alertSummary = useMemo(() => getAlertSummary(), [refreshTick]);
  const alertReadiness = useMemo(() => getAlertRuleReadinessRows(), [refreshTick]);
  const alertApiPosture = useMemo(() => getAlertApiPosture(), [refreshTick]);
  const lastAlertEvaluation = useMemo(() => getLastAlertEvaluation(), [refreshTick]);

  // Format live movements for display
  const movementLedger = useMemo(() => {
    return liveMovements.map(m => ({
      id: m.id,
      ts: new Date(m.created_date).toLocaleString(),
      eventId: m.source_ref,
      location: m.site_id,
      sku: m.sku,
      refType: m.movement_type,
      delta: m.direction === 'OUT' ? -m.qty : m.qty,
      postOnHand: m.balance_after,
      reasonCode: m.notes || '—',
      actor: m.posted_by,
    }));
  }, [liveMovements]);

  // Calculate KPIs from live movements
  const kpis = useMemo(() => {
    const approvedMovements = liveMovements.filter(m => m.status === 'POSTED');
    const totalQty = approvedMovements.reduce((sum, m) => sum + m.qty, 0);
    return {
      pendingApproval: liveMovements.length - approvedMovements.length,
      approvedWasteQty: totalQty,
      approvedEvents: approvedMovements.length,
      activeAlerts: 3, // From alert system
    };
  }, [liveMovements]);

  const liveKpis = useMemo(() => getLiveKpiSummary(Number(reportWindowHours)), [reportWindowHours, refreshTick]);
  const reporting = useMemo(
    () => getReportingPrototype([], { window: reportPrototypeWindow, scope: reportScope, groupBy: reportGroupBy }),
    [reportGroupBy, reportPrototypeWindow, reportScope]
  );

  const filteredRows = useMemo(() => {
    const q = query.trim().toLowerCase();
    // For now, show movement ledger as operations queue since live data comes from StockMovement
    return movementLedger.filter((row) => {
      const matchesQuery =
        !q ||
        row.eventId.toLowerCase().includes(q) ||
        row.location.toLowerCase().includes(q) ||
        row.sku.toLowerCase().includes(q);
      return matchesQuery;
    });
  }, [query, movementLedger]);

  const filteredAlertInstances = useMemo(() => {
    const q = alertQuery.trim().toLowerCase();
    return alertInstances.filter((instance) => {
      const matchesQuery =
        !q ||
        instance.id.toLowerCase().includes(q) ||
        instance.ruleName.toLowerCase().includes(q) ||
        instance.scope.toLowerCase().includes(q) ||
        instance.message.toLowerCase().includes(q) ||
        instance.eventId.toLowerCase().includes(q) ||
        instance.relatedSku.toLowerCase().includes(q) ||
        instance.relatedLocation.toLowerCase().includes(q);

      const matchesFilter =
        alertFilter === 'ALL' ||
        (alertFilter === 'ACTION_NEEDED' && !instance.isAcknowledged) ||
        (alertFilter === 'ACKNOWLEDGED' && instance.isAcknowledged) ||
        (alertFilter === 'HIGH' && instance.severity === 'HIGH');

      return matchesQuery && matchesFilter;
    });
  }, [alertFilter, alertInstances, alertQuery]);

  const selectedAlert = useMemo(
    () => filteredAlertInstances.find((instance) => instance.id === selectedAlertId) || filteredAlertInstances[0] || null,
    [filteredAlertInstances, selectedAlertId]
  );

  useEffect(() => {
    if (!selectedAlert && filteredAlertInstances.length) {
      setSelectedAlertId(filteredAlertInstances[0].id);
      return;
    }

    if (selectedAlert && selectedAlertId !== selectedAlert.id) {
      setSelectedAlertId(selectedAlert.id);
      return;
    }

    if (!filteredAlertInstances.length && selectedAlertId) {
      setSelectedAlertId('');
    }
  }, [filteredAlertInstances, selectedAlert, selectedAlertId]);

  const updateSurface = (surfaceKey) => {
    setActiveSurface(surfaceKey);
    const nextParams = new URLSearchParams(searchParams);
    nextParams.set('surface', surfaceKey);
    setSearchParams(nextParams);
  };

  const handleCreateRule = () => {
    createAlertRule({ ...ruleForm, createdBy: 'Current User' });
    setRefreshTick((value) => value + 1);
  };

  const handleEvaluateAlerts = () => {
    evaluateAlertRules();
    setRefreshTick((value) => value + 1);
  };

  const renderOperationsSurface = () => (
    <div className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-3">
        <KpiCard label="Pending Approval" value={kpis.pendingApproval} helper="Submitted events waiting for a decision" tone="text-amber-700" />
        <KpiCard label="Approved Waste Qty" value={kpis.approvedWasteQty} helper="Units already posted from approved events" tone="text-slate-700" />
        <KpiCard label="Approved Events" value={kpis.approvedEvents} helper="Records that already posted stock impact" tone="text-green-700" />
        <KpiCard label="Active Alerts" value={kpis.activeAlerts} helper="Generated instances from the current ruleset" tone="text-red-700" />
      </div>

      <div className="min-w-0 space-y-4">
        <SectionCard
          title="Operations queue"
          subtitle="Full-width review of wastage events. Open a record to see workflow metadata, stock proof, and action history."
          action={<span className="text-xs text-muted-foreground">{filteredRows.length} visible</span>}
        >
          <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
            <div className="relative w-full lg:max-w-xl">
              <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
              <Input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search by event, SKU, item, reason, location, or user" className="pl-9" />
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <button
                onClick={() => navigate('/Wastage/workspace')}
                className="inline-flex items-center gap-1.5 h-9 px-4 text-sm rounded-xl bg-primary text-primary-foreground hover:opacity-90 transition-opacity font-medium"
              >
                <Plus size={14} /> Record Wastage
              </button>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2 mt-4">
            {statusTabs.map((tab) => (
              <PillTab key={tab.key} label={tab.label} active={activeTab === tab.key} onClick={() => setActiveTab(tab.key)} />
            ))}
            <div className="ml-auto inline-flex items-center gap-1.5 text-xs text-muted-foreground"><Filter size={13} /> Calm queue filters</div>
          </div>

          <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1.5 rounded-2xl border border-border bg-muted/15 px-3 py-2.5 text-xs text-muted-foreground">
            <span className="font-medium text-foreground">Workflow guide</span>
            <span><span className="font-medium text-foreground">Draft</span> no stock movement</span>
            <span><span className="font-medium text-foreground">Submitted</span> awaiting decision</span>
            <span><span className="font-medium text-foreground">Approved</span> movement posted</span>
            <span><span className="font-medium text-foreground">Rejected</span> no stock impact</span>
            <span><span className="font-medium text-foreground">Reversed</span> movement undone</span>
          </div>

          {filteredRows.length === 0 ? (
            <div className="px-2 py-12 text-center">
              <p className="text-base font-medium text-foreground mb-1">No wastage events match this view</p>
              <p className="text-sm text-muted-foreground">Try clearing the search or switching the status filter.</p>
            </div>
          ) : (
            <div className="mt-4 min-w-0 overflow-hidden rounded-2xl border border-border">
              <div className="hidden lg:grid grid-cols-[minmax(0,2.15fr)_minmax(150px,1.2fr)_80px_minmax(150px,1fr)_minmax(180px,1.35fr)] gap-3 bg-muted/15 px-4 py-2.5 text-[11px] font-medium uppercase tracking-[0.18em] text-muted-foreground">
                <div className="min-w-0">Event / Item</div>
                <div className="min-w-0">Workflow</div>
                <div className="min-w-0 text-right">Qty</div>
                <div className="min-w-0">Reason</div>
                <div className="min-w-0">Impact</div>
              </div>
              <div className="divide-y divide-border">
                {filteredRows.map((row, index) => (
                  <div
                    key={row.id}
                    className={`grid grid-cols-1 lg:grid-cols-[minmax(0,2.15fr)_minmax(150px,1.2fr)_80px_minmax(150px,1fr)_minmax(180px,1.35fr)] gap-3 px-4 py-3 transition-colors ${index % 2 === 0 ? 'bg-card' : 'bg-background/40'} hover:bg-muted/25`}
                  >
                    <div className="min-w-0 space-y-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="font-medium text-foreground break-words">{row.eventId}</span>
                        <span className="inline-flex shrink-0 text-[11px] px-2.5 py-0.5 rounded-full font-medium bg-green-50 text-green-700 border border-green-200">WASTE</span>
                      </div>
                      <div className="text-[11px] text-muted-foreground break-words">{row.location} · {row.sku}</div>
                    </div>

                    <div className="min-w-0 space-y-1.5">
                      <span className="inline-flex w-fit text-[11px] px-2.5 py-0.5 rounded-full font-medium bg-green-50 text-green-700 border border-green-200">POSTED</span>
                      <div className="text-[11px] text-muted-foreground break-words">{row.ts}</div>
                    </div>

                    <div className="min-w-0 lg:text-right font-semibold text-foreground">
                      <span className="lg:hidden text-[11px] font-medium uppercase tracking-[0.18em] text-muted-foreground mr-2">Qty</span>
                      {Math.abs(row.delta)}
                    </div>

                    <div className="min-w-0 space-y-1">
                      <div className="text-foreground break-words">{row.reasonCode}</div>
                      <div className="text-[11px] text-muted-foreground break-words">{row.actor || 'System'}</div>
                    </div>

                    <div className="min-w-0 space-y-1">
                      <div className="text-foreground break-words">Stock {row.delta > 0 ? 'increased' : 'decreased'} by {Math.abs(row.delta)}</div>
                      <div className="text-[11px] text-muted-foreground break-words">Current stock: {row.postOnHand}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </SectionCard>

        <SectionCard title="Recent stock movement ledger" subtitle="Approval and reversal are the only points where the engine posts stock movements.">
          {movementLedger.length === 0 ? (
            <p className="text-sm text-muted-foreground">No movement rows have been posted yet.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm min-w-[980px]">
                <thead className="bg-muted/15 text-muted-foreground text-[11px] uppercase tracking-[0.18em]">
                  <tr>
                    {['Timestamp', 'Event', 'Ref Type', 'Delta', 'Post On Hand', 'Reason', 'Actor'].map((heading) => (
                      <th key={heading} className="text-left px-4 py-2.5 font-medium whitespace-nowrap">{heading}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {movementLedger.map((row, index) => (
                    <tr key={row.id} className={`border-t border-border ${index % 2 === 0 ? 'bg-card' : 'bg-background/40'}`}>
                      <td className="px-4 py-3 align-top whitespace-nowrap text-foreground">{row.ts}</td>
                      <td className="px-4 py-3 align-top min-w-[220px]">
                        <div className="font-medium text-foreground">{row.eventId}</div>
                        <div className="text-[11px] text-muted-foreground mt-0.5">{row.location} · {row.sku}</div>
                      </td>
                      <td className="px-4 py-3 align-top whitespace-nowrap"><span className={`inline-flex text-[11px] px-2.5 py-0.5 rounded-full font-medium ${row.refType === 'WASTAGE' ? 'bg-green-50 text-green-700 border border-green-200' : 'bg-slate-100 text-slate-700 border border-slate-200'}`}>{row.refType}</span></td>
                      <td className="px-4 py-3 align-top whitespace-nowrap font-medium text-foreground">{row.delta > 0 ? `+${row.delta}` : row.delta}</td>
                      <td className="px-4 py-3 align-top whitespace-nowrap text-foreground">{row.postOnHand}</td>
                      <td className="px-4 py-3 align-top min-w-[180px] text-muted-foreground">{row.reasonCode}</td>
                      <td className="px-4 py-3 align-top whitespace-nowrap text-muted-foreground">{row.actor || 'System'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </SectionCard>

        <SectionCard title="Recent audit feed" subtitle="Operational history is already written by the engine, even before a dedicated public audit read exists.">
           {movementLedger.length === 0 ? (
             <p className="text-sm text-muted-foreground">No audit rows recorded yet.</p>
           ) : (
             <div className="space-y-3">
               {movementLedger.map((row) => (
                 <div key={row.id} className="border border-border rounded-2xl px-4 py-3 bg-background/40">
                   <div className="flex flex-wrap items-center gap-2">
                     <History size={14} className="text-muted-foreground" />
                     <p className="text-sm font-medium text-foreground">WASTAGE POSTED</p>
                     <span className="text-[11px] text-muted-foreground">{row.ts}</span>
                   </div>
                   <p className="text-sm text-muted-foreground mt-2 leading-relaxed">Stock movement recorded for {row.sku}</p>
                   <p className="text-[11px] text-muted-foreground mt-2">{row.eventId} · {row.location} · {row.sku} · {row.actor || 'System'}</p>
                 </div>
               ))}
             </div>
           )}
         </SectionCard>
      </div>
    </div>
  );

  const renderAlertsSurface = () => (
    <div className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-3">
        <KpiCard label="Alert Rules" value={alertSummary.rulesTotal} helper="Configured rule scaffolds in this build" tone="text-slate-700" />
        <KpiCard label="Action Needed" value={alertSummary.actionNeeded} helper="Instances still waiting on acknowledgement posture" tone="text-amber-700" />
        <KpiCard label="Acknowledged" value={alertSummary.acknowledged} helper="Read-only acknowledgement fields already visible" tone="text-blue-700" />
        <KpiCard label="High Severity" value={alertSummary.highSeverity} helper="Keep these at the top of manager review" tone="text-red-700" />
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-12 gap-4 items-start">
        <div className="xl:col-span-8 space-y-4">
          <SectionCard
            title="Alert instance queue"
            subtitle="Manager-facing queue for generated alert instances. This pass makes acknowledgement posture visible without pretending the write flow is finished."
            action={<span className="text-xs text-muted-foreground">{filteredAlertInstances.length} visible</span>}
          >
            <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between mb-4">
              <div className="relative w-full md:max-w-sm">
                <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                <Input
                  value={alertQuery}
                  onChange={(e) => setAlertQuery(e.target.value)}
                  placeholder="Search alert ID, rule, scope, event, SKU..."
                  className="pl-9"
                />
              </div>
              <div className="flex flex-wrap items-center gap-2">
                {alertTabs.map((tab) => (
                  <PillTab key={tab.key} label={tab.label} active={alertFilter === tab.key} onClick={() => setAlertFilter(tab.key)} />
                ))}
              </div>
            </div>

            {filteredAlertInstances.length === 0 ? (
              <div className="px-2 py-12 text-center">
                <p className="text-base font-medium text-foreground mb-1">No alert instances in this view</p>
                <p className="text-sm text-muted-foreground">Change the filter or run Evaluate Now after creating a rule.</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm min-w-[1220px]">
                  <thead className="bg-muted/15 text-muted-foreground text-[11px] uppercase tracking-[0.18em]">
                    <tr>
                      {['Alert', 'Severity', 'State', 'Scope', 'Related Event', 'Acknowledgement Posture', 'Open'].map((heading) => (
                        <th key={heading} className="text-left px-4 py-2.5 font-medium whitespace-nowrap">{heading}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {filteredAlertInstances.map((instance) => (
                      <AlertQueueRow
                        key={instance.id}
                        instance={instance}
                        selected={selectedAlert?.id === instance.id}
                        onSelect={setSelectedAlertId}
                        onOpenEvent={(eventId) => navigate(`/Wastage/workspace?event=${encodeURIComponent(eventId)}`)}
                      />
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </SectionCard>

          <SectionCard title="Rule summary" subtitle="Rules stay separate from generated instances so the manager can review setup and outcomes calmly.">
            <div className="flex flex-wrap items-center gap-2 mb-4">
              <button onClick={handleEvaluateAlerts} className="inline-flex items-center gap-1.5 h-9 px-4 text-sm rounded-xl border border-border bg-card hover:bg-muted transition-colors text-foreground">
                <ShieldCheck size={14} /> Evaluate Now
              </button>
              <span className="text-xs text-muted-foreground">Last evaluated {lastAlertEvaluation.display}</span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-sm min-w-[980px]">
                <thead className="bg-muted/15 text-muted-foreground text-[11px] uppercase tracking-[0.18em]">
                  <tr>
                    {['Rule', 'Coverage', 'Threshold', 'Severity', 'Triggered', 'Acknowledged', 'Created'].map((heading) => (
                      <th key={heading} className="text-left px-4 py-2.5 font-medium whitespace-nowrap">{heading}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {alertRules.map((rule) => (
                    <tr key={rule.id} className="border-t border-border">
                      <td className="px-4 py-3 align-top min-w-[240px]">
                        <div className="font-medium text-foreground">{rule.name}</div>
                        <div className="text-[11px] text-muted-foreground mt-0.5">{rule.id} · {rule.ruleType}</div>
                      </td>
                      <td className="px-4 py-3 align-top min-w-[230px] text-muted-foreground">{rule.coverageLabel}</td>
                      <td className="px-4 py-3 align-top whitespace-nowrap text-foreground">{rule.thresholdLabel} · {rule.windowHours}h</td>
                      <td className="px-4 py-3 align-top whitespace-nowrap">
                        <span className={`inline-flex text-[11px] px-2.5 py-0.5 rounded-full font-medium ${rule.severity === 'HIGH' ? 'bg-red-50 text-red-700 border border-red-200' : 'bg-amber-50 text-amber-700 border border-amber-200'}`}>{rule.severity}</span>
                      </td>
                      <td className="px-4 py-3 align-top whitespace-nowrap text-foreground">{rule.linkedInstances}</td>
                      <td className="px-4 py-3 align-top whitespace-nowrap text-muted-foreground">{rule.linkedAcknowledged} ack · {rule.linkedActionNeeded} waiting</td>
                      <td className="px-4 py-3 align-top whitespace-nowrap text-muted-foreground">{rule.createdAt}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </SectionCard>

          <SectionCard title="Create alert rule" subtitle="Prototype-safe writer around the engine's existing rule structure.">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-medium text-muted-foreground block mb-1.5">Rule name</label>
                <Input value={ruleForm.name} onChange={(e) => setRuleForm((prev) => ({ ...prev, name: e.target.value }))} />
              </div>
              <div>
                <label className="text-xs font-medium text-muted-foreground block mb-1.5">Severity</label>
                <select value={ruleForm.severity} onChange={(e) => setRuleForm((prev) => ({ ...prev, severity: e.target.value }))} className="w-full h-10 rounded-xl border border-input bg-background px-3 text-sm">
                  <option value="MEDIUM">Medium</option>
                  <option value="HIGH">High</option>
                </select>
              </div>
              <div>
                <label className="text-xs font-medium text-muted-foreground block mb-1.5">Location scope</label>
                <Input value={ruleForm.location} onChange={(e) => setRuleForm((prev) => ({ ...prev, location: e.target.value }))} placeholder="Leave blank for any location" />
              </div>
              <div>
                <label className="text-xs font-medium text-muted-foreground block mb-1.5">SKU scope</label>
                <Input value={ruleForm.sku} onChange={(e) => setRuleForm((prev) => ({ ...prev, sku: e.target.value }))} placeholder="Leave blank for any SKU" />
              </div>
              <div>
                <label className="text-xs font-medium text-muted-foreground block mb-1.5">Reason scope</label>
                <select value={ruleForm.reason} onChange={(e) => setRuleForm((prev) => ({ ...prev, reason: e.target.value }))} className="w-full h-10 rounded-xl border border-input bg-background px-3 text-sm">
                  <option value="">Any reason</option>
                  {reasonOptions.map((reason) => (
                    <option key={reason} value={reason}>{reason}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="text-xs font-medium text-muted-foreground block mb-1.5">Window hours</label>
                <Input type="number" min="1" value={ruleForm.windowHours} onChange={(e) => setRuleForm((prev) => ({ ...prev, windowHours: e.target.value }))} />
              </div>
              <div>
                <label className="text-xs font-medium text-muted-foreground block mb-1.5">Threshold qty</label>
                <Input type="number" min="1" value={ruleForm.thresholdQty} onChange={(e) => setRuleForm((prev) => ({ ...prev, thresholdQty: e.target.value }))} />
              </div>
            </div>
            <div className="flex flex-wrap items-center gap-2 mt-4">
              <button onClick={handleCreateRule} className="inline-flex items-center gap-1.5 h-9 px-4 text-sm rounded-xl bg-primary text-primary-foreground hover:opacity-90 transition-opacity font-medium">
                <BellRing size={14} /> Save Rule
              </button>
              <button onClick={handleEvaluateAlerts} className="inline-flex items-center gap-1.5 h-9 px-4 text-sm rounded-xl border border-border bg-card hover:bg-muted transition-colors text-foreground">
                <ShieldCheck size={14} /> Evaluate Now
              </button>
            </div>
          </SectionCard>
        </div>

        <div className="xl:col-span-4 space-y-4 xl:sticky xl:top-6">
          <SectionCard title="Selected alert detail" subtitle="Keep instance review calm, explicit, and grounded in the related event.">
            {selectedAlert ? (
              <div className="space-y-4">
                <AlertInstanceCard instance={selectedAlert} />
                <div className="grid grid-cols-1 gap-3">
                  <div className="border border-border rounded-2xl px-4 py-3 bg-background/40">
                    <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-[0.22em] mb-1.5">Related event</p>
                    <p className="text-sm font-medium text-foreground">{selectedAlert.eventId}</p>
                    <p className="text-sm text-muted-foreground mt-2 leading-relaxed">{selectedAlert.relatedLocation} · {selectedAlert.relatedSku} · {selectedAlert.relatedItemName}</p>
                    <p className="text-[11px] text-muted-foreground mt-2">{selectedAlert.relatedStatus} · {selectedAlert.relatedSource} · Recorded {selectedAlert.relatedRecordedAt}</p>
                  </div>
                  <div className="border border-border rounded-2xl px-4 py-3 bg-background/40">
                    <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-[0.22em] mb-1.5">Acknowledgement posture</p>
                    <p className="text-sm font-medium text-foreground">{selectedAlert.acknowledgementLabel}</p>
                    <p className="text-sm text-muted-foreground mt-2 leading-relaxed">{selectedAlert.acknowledgementHelper}</p>
                    <button disabled className="mt-3 inline-flex items-center gap-1.5 h-9 px-4 text-sm rounded-xl border border-border bg-muted text-muted-foreground cursor-not-allowed">
                      <ShieldCheck size={14} /> Acknowledge (API pending)
                    </button>
                  </div>
                  <div className="border border-border rounded-2xl px-4 py-3 bg-background/40">
                    <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-[0.22em] mb-1.5">Next operator step</p>
                    <p className="text-sm text-muted-foreground leading-relaxed">{selectedAlert.nextAction}</p>
                  </div>
                </div>
                <button
                  onClick={() => navigate(`/Wastage/workspace?event=${encodeURIComponent(selectedAlert.eventId)}`)}
                  className="inline-flex items-center gap-1.5 h-9 px-4 text-sm rounded-xl bg-primary text-primary-foreground hover:opacity-90 transition-opacity font-medium"
                >
                  Open related event <ArrowRight size={14} />
                </button>
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">Select an alert instance to inspect its posture.</p>
            )}
          </SectionCard>

          <SectionCard title="Alert read posture" subtitle="This pass leans into the read side that is already stored in the engine.">
            <div className="space-y-3">
              {alertReadiness.map((item) => (
                <ReadinessLine key={item.label} item={item} />
              ))}
            </div>
          </SectionCard>

          <SectionCard title="Prototype boundary" subtitle="Keep the UI honest while still making manager review useful.">
            <div className="space-y-3 text-sm text-muted-foreground">
              <p><span className="font-medium text-foreground">Read acknowledgement now</span> — The fields can already be shown calmly on the instance detail.</p>
              <p><span className="font-medium text-foreground">Do not imply finished write support</span> — Leave acknowledgement actions visibly disabled until a public endpoint exists.</p>
            </div>
          </SectionCard>

          <SectionCard title="Alert API posture" subtitle="Writer endpoints are live; queue and acknowledgement remain read-first surfaces.">
            <div className="space-y-3">
              {alertApiPosture.map((item) => (
                <ReadinessLine key={item.label} item={item} />
              ))}
            </div>
          </SectionCard>
        </div>
      </div>
    </div>
  );

  const renderReportingSurface = () => (
    <div className="space-y-4">
      <SectionCard title="Live engine-backed now" subtitle="These cards represent the current live KPI posture in the chosen time window.">
        <div className="flex flex-wrap items-center gap-2 mb-4">
          {reportWindowTabs.map((tab) => (
            <PillTab key={tab.key} label={tab.label} active={reportWindowHours === tab.key} onClick={() => setReportWindowHours(tab.key)} />
          ))}
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <KpiCard label="Approved Events" value={liveKpis.totalWasteEvents} helper={`Approved records in the last ${liveKpis.windowLabel}`} tone="text-green-700" />
          <KpiCard label="Approved Waste Qty" value={liveKpis.totalWasteQty} helper="Total approved quantity in the selected live window" tone="text-amber-700" />
          <KpiCard label="Affected SKUs" value={liveKpis.totalWasteSkus} helper="Distinct SKUs in the selected live window" tone="text-blue-700" />
        </div>
      </SectionCard>

      <div className="grid grid-cols-1 xl:grid-cols-12 gap-4 items-start">
        <div className="xl:col-span-8 space-y-4">
          <SectionCard title="Prototype grouped reporting" subtitle="Grouped rollups and export actions remain prototype surfaces until deeper reporting endpoints exist." action={<span className="text-xs text-muted-foreground">Prototype only</span>}>
            <div className="space-y-4">
              <div>
                <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-[0.22em] mb-2">Window</p>
                <div className="flex flex-wrap items-center gap-2">
                  {reportPrototypeWindowTabs.map((tab) => (
                    <PillTab key={tab.key} label={tab.label} active={reportPrototypeWindow === tab.key} onClick={() => setReportPrototypeWindow(tab.key)} />
                  ))}
                </div>
              </div>
              <div>
                <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-[0.22em] mb-2">Scope</p>
                <div className="flex flex-wrap items-center gap-2">
                  {reportScopeTabs.map((tab) => (
                    <PillTab key={tab.key} label={tab.label} active={reportScope === tab.key} onClick={() => setReportScope(tab.key)} />
                  ))}
                </div>
              </div>
              <div>
                <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-[0.22em] mb-2">Group results</p>
                <div className="flex flex-wrap items-center gap-2">
                  {reportGroupTabs.map((tab) => (
                    <PillTab key={tab.key} label={tab.label} active={reportGroupBy === tab.key} onClick={() => setReportGroupBy(tab.key)} />
                  ))}
                </div>
              </div>
            </div>
          </SectionCard>

          <SectionCard
            title="Grouped report view"
            subtitle={reporting.tableSubtitle}
            action={
              <div className="flex flex-wrap items-center gap-2">
                <button className="inline-flex items-center gap-1.5 h-9 px-3.5 text-sm rounded-xl border border-border bg-card hover:bg-muted transition-colors text-foreground">
                  <Download size={14} /> CSV prototype
                </button>
                <button className="inline-flex items-center gap-1.5 h-9 px-3.5 text-sm rounded-xl border border-border bg-card hover:bg-muted transition-colors text-foreground">
                  <Download size={14} /> PDF prototype
                </button>
              </div>
            }
          >
            {reporting.groups.length === 0 ? (
              <div className="px-2 py-12 text-center">
                <p className="text-base font-medium text-foreground mb-1">No data in this reporting view</p>
                <p className="text-sm text-muted-foreground">Try widening the window or changing the scope.</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm min-w-[920px]">
                  <thead className="bg-muted/15 text-muted-foreground text-[11px] uppercase tracking-[0.18em]">
                    <tr>
                      {[reporting.primaryHeading, 'Events', 'Qty', 'Latest Event', 'Status Mix', 'Notes'].map((heading) => (
                        <th key={heading} className="text-left px-4 py-2.5 font-medium whitespace-nowrap">{heading}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {reporting.groups.map((group, index) => (
                      <tr key={group.key} className={`border-t border-border ${index % 2 === 0 ? 'bg-card' : 'bg-background/40'}`}>
                        <td className="px-4 py-3 align-top min-w-[220px]">
                          <div className="font-medium text-foreground">{group.label}</div>
                          {group.subLabel ? <div className="text-[11px] text-muted-foreground mt-0.5">{group.subLabel}</div> : null}
                        </td>
                        <td className="px-4 py-3 align-top whitespace-nowrap">{group.events}</td>
                        <td className="px-4 py-3 align-top whitespace-nowrap">{group.qty}</td>
                        <td className="px-4 py-3 align-top whitespace-nowrap">{group.latestOccurred}</td>
                        <td className="px-4 py-3 align-top min-w-[170px] text-muted-foreground">{group.statusMix}</td>
                        <td className="px-4 py-3 align-top min-w-[240px] text-muted-foreground">{group.note}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </SectionCard>
        </div>

        <div className="xl:col-span-4 space-y-4 xl:sticky xl:top-6">
          <SectionCard title="How to use this page" subtitle="Keep live KPI reading separate from prototype grouped analysis.">
            <div className="space-y-3 text-sm text-muted-foreground">
              <p><span className="font-medium text-foreground">Read live cards first</span> — They reflect the current approved-event KPI posture.</p>
              <p><span className="font-medium text-foreground">Use grouped views second</span> — They help shape the future reporting workflow without pretending export is complete.</p>
            </div>
          </SectionCard>
        </div>
      </div>
    </div>
  );

  const renderGuidesSurface = () => (
    <div className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-3">
        <KpiCard label="Tracked Reasons" value={governanceSummary.totalReasons} helper="Visible reason options in this build" tone="text-slate-700" />
        <KpiCard label="Reorder Affecting" value={governanceSummary.reorderAffecting} helper="Contributes to reorder demand logic" tone="text-amber-700" />
        <KpiCard label="Mapped Barcodes" value={governanceSummary.mappedBarcodes} helper="Scanner mappings available in the prototype" tone="text-blue-700" />
        <KpiCard label="Unresolved Scan Prompts" value={governanceSummary.manualFallbackCount} helper="Examples where manual follow-up is still needed" tone="text-slate-700" />
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-12 gap-4 items-start">
        <div className="xl:col-span-8 space-y-4">
          <SectionCard title="Reason guide" subtitle="Use this when choosing a reason or checking how that reason should be treated operationally." action={<span className="text-xs text-muted-foreground">{reasonRows.length} reasons</span>}>
            <div className="space-y-3">
              {reasonRows.map((row) => (
                <div key={row.reason} className="border border-border rounded-2xl px-4 py-4 bg-background/40 space-y-3">
                  <div className="flex flex-col gap-2 md:flex-row md:items-start md:justify-between">
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-foreground">{row.reason}</p>
                      <p className="text-sm text-muted-foreground mt-1 leading-relaxed">{row.helper}</p>
                    </div>
                    <PolicyChip bucket={row.bucket} chipClass={row.chipClass} />
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-sm">
                    <div>
                      <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-[0.22em] mb-1">Reorder behaviour</p>
                      <p className="text-foreground leading-relaxed">{row.reorderBehavior}</p>
                    </div>
                    <div>
                      <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-[0.22em] mb-1">Review path</p>
                      <p className="text-foreground leading-relaxed">{row.approvalPath}</p>
                    </div>
                    <div>
                      <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-[0.22em] mb-1">Capture guidance</p>
                      <p className="text-foreground leading-relaxed">{row.captureGuidance}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </SectionCard>

          <SectionCard title="Barcode guide" subtitle="Scanner support is shaped here without overstating backend completeness.">
            <div className="overflow-x-auto">
              <table className="w-full text-sm min-w-[820px]">
                <thead className="bg-muted/15 text-muted-foreground text-[11px] uppercase tracking-[0.18em]">
                  <tr>
                    {['Barcode', 'SKU', 'Item Name', 'Status'].map((heading) => (
                      <th key={heading} className="text-left px-4 py-2.5 font-medium whitespace-nowrap">{heading}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {barcodeRows.map((row) => (
                    <tr key={row.barcode} className="border-t border-border">
                      <td className="px-4 py-3 align-top whitespace-nowrap text-foreground">{row.barcode}</td>
                      <td className="px-4 py-3 align-top whitespace-nowrap text-foreground">{row.sku}</td>
                      <td className="px-4 py-3 align-top text-muted-foreground">{row.itemName}</td>
                      <td className="px-4 py-3 align-top whitespace-nowrap"><span className="inline-flex text-[11px] px-2.5 py-0.5 rounded-full font-medium bg-blue-50 text-blue-700 border border-blue-200">{row.mappingStatus}</span></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {unresolvedScans.length ? (
              <div className="space-y-3 mt-4">
                {unresolvedScans.map((scan) => (
                  <div key={scan.id} className="border border-border rounded-2xl px-4 py-3 bg-background/40">
                    <div className="flex items-center gap-2"><ScanLine size={14} className="text-muted-foreground" /><p className="text-sm font-medium text-foreground">{scan.scanValue}</p></div>
                    <p className="text-sm text-muted-foreground mt-2">{scan.suggestedAction}</p>
                    <p className="text-[11px] text-muted-foreground mt-2">{scan.scannedAt} · {scan.status}</p>
                  </div>
                ))}
              </div>
            ) : null}
          </SectionCard>
        </div>

        <div className="xl:col-span-4 space-y-4 xl:sticky xl:top-6">
          <SectionCard title="How to use this page" subtitle="Keep this as a reference surface, not a daily-action queue.">
            <div className="space-y-3 text-sm text-muted-foreground">
              <p><span className="font-medium text-foreground">Choose the nearest reason</span> — Pick the clearest operational reason first.</p>
              <p><span className="font-medium text-foreground">Check scanner fit</span> — Mapped barcodes help fast capture, but unmatched scans still need manual follow-up.</p>
            </div>
          </SectionCard>
        </div>
      </div>
    </div>
  );

  return (
    <div className="p-5 lg:p-6 space-y-4">
      <div className="space-y-1">
        <h1 className="text-xl font-semibold text-foreground">Wastage</h1>
        <p className="text-sm text-muted-foreground">Record, review, and track wastage events without narrowing the daily operations queue.</p>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        {surfaceTabs.map((tab) => (
          <PillTab key={tab.key} label={tab.label} active={activeSurface === tab.key} onClick={() => updateSurface(tab.key)} />
        ))}
      </div>

      {activeSurface === 'OPERATIONS' ? renderOperationsSurface() : null}
      {activeSurface === 'ALERTS' ? renderAlertsSurface() : null}
      {activeSurface === 'REPORTING' ? renderReportingSurface() : null}
      {activeSurface === 'GUIDES' ? renderGuidesSurface() : null}
    </div>
  );
}