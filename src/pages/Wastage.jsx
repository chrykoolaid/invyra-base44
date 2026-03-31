import { useMemo, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { AlertTriangle, ArrowRight, BellRing, Download, Filter, Plus, ScanLine, Search, ShieldCheck } from 'lucide-react';
import { Input } from '@/components/ui/input';
import {
  createAlertRule,
  evaluateAlertRules,
  getAlertInstances,
  getAlertRules,
  getBarcodeMappings,
  getGovernanceSummary,
  getKpiSummary,
  getLastAlertEvaluation,
  getLiveKpiSummary,
  getReasonGovernanceRows,
  getReportingPrototype,
  getUnresolvedScans,
  getWastageRows,
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
    <div className="border border-border rounded-2xl bg-card shadow-sm overflow-hidden">
      <div className="px-4 py-3 border-b border-border bg-muted/20 flex items-start gap-3">
        <div className="min-w-0">
          <p className="text-sm font-medium text-foreground">{title}</p>
          {subtitle ? <p className="text-xs text-muted-foreground mt-1 leading-relaxed">{subtitle}</p> : null}
        </div>
        {action ? <div className="ml-auto">{action}</div> : null}
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
        <span className={`inline-flex text-[11px] px-2.5 py-0.5 rounded-full font-medium ${instance.severity === 'HIGH' ? 'bg-red-50 text-red-700 border border-red-200' : 'bg-amber-50 text-amber-700 border border-amber-200'}`}>
          {instance.severity}
        </span>
        <p className="text-sm font-medium text-foreground">{instance.ruleId}</p>
        <span className="text-[11px] text-muted-foreground">{instance.window}</span>
      </div>
      <p className="text-sm text-muted-foreground mt-2 leading-relaxed">{instance.message}</p>
      <p className="text-[11px] text-muted-foreground mt-2">{instance.scope}</p>
      <p className="text-[11px] text-muted-foreground mt-1">Acknowledgement write flow stays prototype-safe in this build.</p>
    </div>
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
  const [ruleForm, setRuleForm] = useState({
    name: 'Custom wastage threshold',
    location: '',
    sku: '',
    reason: '',
    thresholdQty: 8,
    windowHours: 24,
    severity: 'MEDIUM',
  });

  const rows = useMemo(() => getWastageRows(), [refreshTick]);
  const reasonRows = useMemo(() => getReasonGovernanceRows(), [refreshTick]);
  const barcodeRows = useMemo(() => getBarcodeMappings(), [refreshTick]);
  const unresolvedScans = useMemo(() => getUnresolvedScans(), [refreshTick]);
  const governanceSummary = useMemo(() => getGovernanceSummary(), [refreshTick]);
  const alertRules = useMemo(() => getAlertRules(), [refreshTick]);
  const alertInstances = useMemo(() => getAlertInstances(), [refreshTick]);
  const lastAlertEvaluation = useMemo(() => getLastAlertEvaluation(), [refreshTick]);
  const kpis = useMemo(() => getKpiSummary(rows), [rows]);
  const liveKpis = useMemo(() => getLiveKpiSummary(Number(reportWindowHours)), [reportWindowHours, refreshTick]);
  const reporting = useMemo(
    () => getReportingPrototype(rows, { window: reportPrototypeWindow, scope: reportScope, groupBy: reportGroupBy }),
    [reportGroupBy, reportPrototypeWindow, reportScope, rows]
  );

  const filteredRows = useMemo(() => {
    const q = query.trim().toLowerCase();
    return rows.filter((row) => {
      const matchesQuery =
        !q ||
        row.id.toLowerCase().includes(q) ||
        row.location.toLowerCase().includes(q) ||
        row.sku.toLowerCase().includes(q) ||
        row.itemName.toLowerCase().includes(q) ||
        row.reason.toLowerCase().includes(q) ||
        row.recordedBy.toLowerCase().includes(q);
      const matchesStatus = activeTab === 'ALL' || row.status === activeTab;
      return matchesQuery && matchesStatus;
    });
  }, [activeTab, query, rows]);

  const highSeverityAlerts = alertInstances.filter((instance) => instance.severity === 'HIGH');

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

      <div className="grid grid-cols-1 xl:grid-cols-12 gap-4 items-start">
        <div className="xl:col-span-8 space-y-4">
          <SectionCard
            title="Operations queue"
            subtitle="Table-first review of wastage events. Open a record to see workflow metadata, stock proof, and action history."
            action={<span className="text-xs text-muted-foreground">{filteredRows.length} visible</span>}
          >
            <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
              <div className="relative w-full lg:max-w-md">
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

            {filteredRows.length === 0 ? (
              <div className="px-2 py-12 text-center">
                <p className="text-base font-medium text-foreground mb-1">No wastage events match this view</p>
                <p className="text-sm text-muted-foreground">Try clearing the search or switching the status filter.</p>
              </div>
            ) : (
              <div className="overflow-x-auto mt-4">
                <table className="w-full text-sm min-w-[1180px]">
                  <thead className="bg-muted/15 text-muted-foreground text-[11px] uppercase tracking-[0.18em]">
                    <tr>
                      {['Event', 'Workflow', 'Qty', 'Reason', 'Stock Posting', 'Last Action', 'Open'].map((heading) => (
                        <th key={heading} className="text-left px-4 py-2.5 font-medium whitespace-nowrap">{heading}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {filteredRows.map((row, index) => (
                      <tr key={row.id} className={`border-t border-border ${index % 2 === 0 ? 'bg-card' : 'bg-background/40'} hover:bg-muted/25 transition-colors`}>
                        <td className="px-4 py-3 align-top min-w-[250px]">
                          <div className="font-medium text-foreground">{row.id}</div>
                          <div className="text-[11px] text-muted-foreground mt-0.5">{row.location} · {row.sku}</div>
                          <div className="text-[11px] text-muted-foreground mt-0.5">{row.itemName}</div>
                        </td>
                        <td className="px-4 py-3 align-top min-w-[180px]">
                          <span className={`inline-flex text-[11px] px-2.5 py-0.5 rounded-full font-medium ${statusStyle[row.status]}`}>{row.status}</span>
                          <div className="text-[11px] text-muted-foreground mt-2">Recorded {row.recordedAt}</div>
                          {row.submittedAt ? <div className="text-[11px] text-muted-foreground mt-0.5">Submitted {row.submittedAt}</div> : null}
                        </td>
                        <td className="px-4 py-3 align-top whitespace-nowrap font-medium text-foreground">{row.qty}</td>
                        <td className="px-4 py-3 align-top min-w-[220px]">
                          <div className="text-foreground">{row.reason}</div>
                          <div className="text-[11px] text-muted-foreground mt-0.5">{row.recordedBy}</div>
                        </td>
                        <td className="px-4 py-3 align-top min-w-[200px]">
                          <div className="text-foreground">{row.movementState}</div>
                          <div className="text-[11px] text-muted-foreground mt-0.5">Current on hand {row.currentOnHand}</div>
                        </td>
                        <td className="px-4 py-3 align-top min-w-[220px]">
                          <div className="text-foreground">{row.lastAction?.action?.replaceAll('_', ' ') || 'WASTAGE CREATED'}</div>
                          <div className="text-[11px] text-muted-foreground mt-0.5">{row.lastAction?.ts || row.recordedAt}</div>
                        </td>
                        <td className="px-4 py-3 align-top whitespace-nowrap">
                          <button
                            onClick={() => navigate(`/Wastage/workspace?event=${encodeURIComponent(row.id)}`)}
                            className="inline-flex items-center gap-1.5 text-sm text-primary font-medium hover:opacity-80"
                          >
                            Open <ArrowRight size={14} />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </SectionCard>
        </div>

        <div className="xl:col-span-4 space-y-4 xl:sticky xl:top-6">
          <SectionCard title="Workflow guide" subtitle="Plain-language status meanings for daily operations.">
            <div className="space-y-3 text-sm text-muted-foreground">
              <p><span className="font-medium text-foreground">Draft</span> — Record exists, no stock movement posted.</p>
              <p><span className="font-medium text-foreground">Submitted</span> — Waiting for workflow decision.</p>
              <p><span className="font-medium text-foreground">Approved</span> — Movement posted and on-hand changed.</p>
              <p><span className="font-medium text-foreground">Rejected</span> — Decision stored, no stock impact.</p>
              <p><span className="font-medium text-foreground">Reversed</span> — Original approved movement was undone.</p>
            </div>
          </SectionCard>

          <SectionCard title="Active alert instances" subtitle="Engine-aligned signals generated from the current ruleset." action={<span className="text-xs text-muted-foreground">{alertInstances.length} active</span>}>
            {alertInstances.length === 0 ? (
              <p className="text-sm text-muted-foreground">No active alert instances right now.</p>
            ) : (
              <div className="space-y-3">
                {alertInstances.slice(0, 3).map((instance) => (
                  <AlertInstanceCard key={instance.id} instance={instance} />
                ))}
              </div>
            )}
          </SectionCard>
        </div>
      </div>
    </div>
  );

  const renderAlertsSurface = () => (
    <div className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-3">
        <KpiCard label="Alert Rules" value={alertRules.length} helper="Configured rule scaffolds in this prototype" tone="text-slate-700" />
        <KpiCard label="Active Instances" value={alertInstances.length} helper="Generated from the latest evaluation pass" tone="text-red-700" />
        <KpiCard label="High Severity" value={highSeverityAlerts.length} helper="High-severity generated instances" tone="text-red-700" />
        <KpiCard label="Last Evaluated" value={lastAlertEvaluation.display} helper="Prototype-safe evaluate-now timestamp" tone="text-blue-700" />
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-12 gap-4 items-start">
        <div className="xl:col-span-8 space-y-4">
          <SectionCard title="Create alert rule" subtitle="Prototype-safe writer around the engine's rule structure. Keep scope and threshold simple.">
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

          <SectionCard title="Rule summary" subtitle="Rules are stored separately from generated alert instances.">
            <div className="overflow-x-auto">
              <table className="w-full text-sm min-w-[860px]">
                <thead className="bg-muted/15 text-muted-foreground text-[11px] uppercase tracking-[0.18em]">
                  <tr>
                    {['Rule', 'Scope', 'Threshold', 'Window', 'Severity', 'Created'].map((heading) => (
                      <th key={heading} className="text-left px-4 py-2.5 font-medium whitespace-nowrap">{heading}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {alertRules.map((rule) => (
                    <tr key={rule.id} className="border-t border-border">
                      <td className="px-4 py-3 align-top min-w-[220px]">
                        <div className="font-medium text-foreground">{rule.id}</div>
                        <div className="text-[11px] text-muted-foreground mt-0.5">{rule.name}</div>
                      </td>
                      <td className="px-4 py-3 align-top min-w-[220px] text-muted-foreground">{rule.scopeLabel || rule.scope}</td>
                      <td className="px-4 py-3 align-top whitespace-nowrap text-foreground">{rule.thresholdQty ? `${rule.thresholdQty}+ qty` : `${rule.thresholdCount}+ events`}</td>
                      <td className="px-4 py-3 align-top whitespace-nowrap text-foreground">{rule.windowHours}h</td>
                      <td className="px-4 py-3 align-top whitespace-nowrap">
                        <span className={`inline-flex text-[11px] px-2.5 py-0.5 rounded-full font-medium ${rule.severity === 'HIGH' ? 'bg-red-50 text-red-700 border border-red-200' : 'bg-amber-50 text-amber-700 border border-amber-200'}`}>{rule.severity}</span>
                      </td>
                      <td className="px-4 py-3 align-top whitespace-nowrap text-muted-foreground">{rule.createdAt}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </SectionCard>
        </div>

        <div className="xl:col-span-4 space-y-4 xl:sticky xl:top-6">
          <SectionCard title="Recent alert instances" subtitle="Generated instances sit beside rules, not inside the queue rows.">
            {alertInstances.length === 0 ? (
              <p className="text-sm text-muted-foreground">No generated instances yet.</p>
            ) : (
              <div className="space-y-3">
                {alertInstances.slice(0, 6).map((instance) => (
                  <AlertInstanceCard key={instance.id} instance={instance} />
                ))}
              </div>
            )}
          </SectionCard>

          <SectionCard title="Prototype boundary" subtitle="Important engine-honest reminder for this surface.">
            <div className="space-y-3 text-sm text-muted-foreground">
              <p><span className="font-medium text-foreground">Rules and evaluate-now posture exist</span> — That matches the current engine structure.</p>
              <p><span className="font-medium text-foreground">Acknowledgement stays scaffolded</span> — Do not imply a finished acknowledgement write flow until the API exposes it.</p>
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
        <p className="text-sm text-muted-foreground">This pass deepens the UI around the engine’s real lifecycle, stock effect, action history, and alert scaffolding.</p>
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
