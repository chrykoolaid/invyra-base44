import { useMemo, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import {
  AlertTriangle,
  ArrowRight,
  BellRing,
  ClipboardCheck,
  Download,
  Filter,
  Plus,
  ScanLine,
  Search,
  ShieldCheck,
} from 'lucide-react';
import {
  getAlertBreaches,
  getApprovalsAuditPrototype,
  getBarcodeMappings,
  getGovernanceSummary,
  getKpiSummary,
  getReasonGovernanceRows,
  getReportingPrototype,
  getUnresolvedScans,
  getWastageRows,
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
  { key: 'REASONS', label: 'Reason Guide' },
  { key: 'BARCODES', label: 'Barcode Guide' },
  { key: 'REPORTING', label: 'Reporting Prototype' },
  { key: 'APPROVALS', label: 'Approvals & Audit' },
];

const reportWindowTabs = [
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

const sourceStyle = {
  ADMIN: 'bg-slate-100 text-slate-700 border border-slate-200',
  SCANNER: 'bg-blue-50 text-blue-700 border border-blue-200',
  POS: 'bg-violet-50 text-violet-700 border border-violet-200',
  IMPORT: 'bg-emerald-50 text-emerald-700 border border-emerald-200',
};

const statusMeaning = {
  DRAFT: 'Not posted yet',
  SUBMITTED: 'Waiting for review',
  APPROVED: 'Stock deducted',
  REJECTED: 'Stopped, no stock impact',
  REVERSED: 'Stock restored',
};

const nextActionLabel = {
  DRAFT: 'Next: submit draft',
  SUBMITTED: 'Next: approve or reject',
  APPROVED: 'Next: reverse only if needed',
  REJECTED: 'Next: review and recapture if needed',
  REVERSED: 'Next: reference only',
};

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
      type="button"
      onClick={onClick}
      className={`h-9 px-4 rounded-xl text-sm font-medium transition-colors border ${
        active
          ? 'bg-primary text-primary-foreground border-primary'
          : 'bg-card text-foreground border-border hover:bg-muted'
      }`}
    >
      {label}
    </button>
  );
}

function SectionCard({ title, subtitle, children, action }) {
  return (
    <section className="border border-border rounded-3xl bg-card shadow-sm overflow-hidden">
      <div className="px-5 py-4 border-b border-border/70 flex flex-col gap-2 md:flex-row md:items-start md:justify-between">
        <div className="min-w-0">
          <h2 className="text-base font-semibold text-foreground">{title}</h2>
          {subtitle ? <p className="text-sm text-muted-foreground mt-1 leading-relaxed">{subtitle}</p> : null}
        </div>
        {action ? <div className="shrink-0">{action}</div> : null}
      </div>
      <div className="p-5">{children}</div>
    </section>
  );
}

function PolicyChip({ bucket, chipClass }) {
  return <span className={`inline-flex text-[11px] px-2.5 py-0.5 rounded-full font-medium ${chipClass}`}>{bucket}</span>;
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
  const [reportWindow, setReportWindow] = useState('30D');
  const [reportScope, setReportScope] = useState('REVIEWED');
  const [reportGroupBy, setReportGroupBy] = useState('REASON');

  const rows = useMemo(() => getWastageRows(), [refreshTick]);
  const reasonRows = useMemo(() => getReasonGovernanceRows(), [refreshTick]);
  const barcodeRows = useMemo(() => getBarcodeMappings(), [refreshTick]);
  const unresolvedScans = useMemo(() => getUnresolvedScans(), [refreshTick]);
  const governanceSummary = useMemo(() => getGovernanceSummary(), [refreshTick]);
  const alertBreaches = useMemo(() => getAlertBreaches(rows), [rows]);
  const kpis = useMemo(() => getKpiSummary(rows), [rows]);
  const reporting = useMemo(
    () => getReportingPrototype(rows, { window: reportWindow, scope: reportScope, groupBy: reportGroupBy }),
    [reportGroupBy, reportScope, reportWindow, rows]
  );
  const approvals = useMemo(() => getApprovalsAuditPrototype(rows), [rows]);

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

      const matchesTab = activeTab === 'ALL' ? true : row.status === activeTab;
      return matchesQuery && matchesTab;
    });
  }, [activeTab, query, rows]);

  const setSurface = (nextSurface) => {
    setActiveSurface(nextSurface);
    if (nextSurface === 'OPERATIONS') {
      setSearchParams({});
    } else {
      setSearchParams({ surface: nextSurface });
    }
  };

  const renderOperationsSurface = () => (
    <div className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-3">
        <KpiCard label="Drafts" value={kpis.drafts} helper="Saved but not yet submitted" tone="text-slate-700" />
        <KpiCard label="Submitted" value={kpis.submitted} helper="Waiting for review" tone="text-amber-700" />
        <KpiCard label="Approved Events" value={kpis.approvedEvents} helper="Events already posted to stock" tone="text-green-700" />
        <KpiCard label="Approved Waste Qty" value={kpis.approvedQty} helper="Quantity already deducted" tone="text-green-700" />
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-12 gap-4 items-start">
        <div className="xl:col-span-8 space-y-4">
          <SectionCard
            title="Wastage Queue"
            subtitle="Review the record, understand the workflow state, and open the next action when needed."
            action={<span className="text-xs text-muted-foreground">{filteredRows.length} of {rows.length} events</span>}
          >
            <div className="space-y-4">
              <div className="flex flex-col xl:flex-row xl:items-center gap-3">
                <div className="relative flex-1 min-w-[240px] max-w-[460px]">
                  <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                  <input
                    type="text"
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    placeholder="Search by event, SKU, item, location, reason, or staff"
                    className="h-10 w-full border border-border rounded-xl pl-9 pr-3 text-sm focus:outline-none focus:ring-1 focus:ring-ring bg-card"
                  />
                </div>

                <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                  <span className="inline-flex items-center gap-1.5 h-9 px-3 rounded-xl border border-border bg-background/60">
                    <Filter size={13} /> Workflow filter
                  </span>
                  <span className="inline-flex items-center h-9 px-3 rounded-xl border border-border bg-background/60">
                    {activeTab === 'ALL' ? 'Showing all statuses' : `Showing ${activeTab.toLowerCase()} only`}
                  </span>
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                {statusTabs.map((tab) => (
                  <PillTab key={tab.key} label={tab.label} active={activeTab === tab.key} onClick={() => setActiveTab(tab.key)} />
                ))}
              </div>
            </div>

            {filteredRows.length === 0 ? (
              <div className="px-2 py-12 text-center">
                <p className="text-base font-medium text-foreground mb-1">No wastage events match this view</p>
                <p className="text-sm text-muted-foreground mb-4">Try another search or clear the workflow filter.</p>
                <button
                  onClick={() => {
                    setQuery('');
                    setActiveTab('ALL');
                  }}
                  className="inline-flex items-center gap-1.5 h-9 px-4 text-sm rounded-xl border border-border bg-card hover:bg-muted transition-colors"
                >
                  Clear Filters
                </button>
              </div>
            ) : (
              <div className="overflow-x-auto mt-4">
                <table className="w-full text-sm min-w-[980px]">
                  <thead className="bg-muted/15 text-muted-foreground text-[11px] uppercase tracking-[0.18em]">
                    <tr>
                      {['Event', 'Location', 'Item', 'Qty', 'Reason', 'Workflow', 'Action'].map((heading) => (
                        <th key={heading} className="text-left px-4 py-3 font-medium whitespace-nowrap">
                          {heading}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {filteredRows.map((row, index) => (
                      <tr
                        key={row.id}
                        className={`border-t border-border ${index % 2 === 0 ? 'bg-card' : 'bg-background/40'} hover:bg-muted/20 transition-colors`}
                      >
                        <td className="px-4 py-3.5 align-top min-w-[180px]">
                          <div className="space-y-1">
                            <div className="font-medium text-foreground">{row.id}</div>
                            <div className="text-[11px] text-muted-foreground">Occurred {row.occurredAt}</div>
                            <div className="text-[11px] text-muted-foreground">Recorded {row.recordedAt}</div>
                          </div>
                        </td>
                        <td className="px-4 py-3.5 align-top min-w-[150px]">
                          <div className="space-y-1">
                            <div className="font-medium text-foreground">{row.location}</div>
                            <div className="text-[11px] text-muted-foreground">Recorded by {row.recordedBy}</div>
                          </div>
                        </td>
                        <td className="px-4 py-3.5 align-top min-w-[220px]">
                          <div className="space-y-1">
                            <div className="font-medium text-foreground">{row.itemName}</div>
                            <div className="text-[11px] text-muted-foreground">SKU {row.sku}</div>
                          </div>
                        </td>
                        <td className="px-4 py-3.5 align-top min-w-[120px]">
                          <div className="space-y-1">
                            <div className="text-base font-semibold text-foreground">{row.qty}</div>
                            <div className="text-[11px] text-muted-foreground">On hand {row.currentOnHand}</div>
                          </div>
                        </td>
                        <td className="px-4 py-3.5 align-top min-w-[240px]">
                          <div className="space-y-1">
                            <div className="font-medium text-foreground">{row.reason}</div>
                            <div className="text-[11px] text-muted-foreground leading-relaxed">{row.notes}</div>
                          </div>
                        </td>
                        <td className="px-4 py-3.5 align-top min-w-[200px]">
                          <div className="space-y-2">
                            <div className="flex flex-wrap items-center gap-2">
                              <span className={`inline-flex text-[11px] px-2.5 py-0.5 rounded-full font-medium ${sourceStyle[row.source] || sourceStyle.ADMIN}`}>
                                {row.source}
                              </span>
                              <span className={`inline-flex text-[11px] px-2.5 py-0.5 rounded-full font-medium ${statusStyle[row.status]}`}>
                                {row.status}
                              </span>
                            </div>
                            <div className="text-[11px] text-muted-foreground">{statusMeaning[row.status]}</div>
                            <div className="text-[11px] font-medium text-foreground">{nextActionLabel[row.status]}</div>
                          </div>
                        </td>
                        <td className="px-4 py-3.5 align-top min-w-[150px]">
                          <div className="space-y-2">
                            <button
                              onClick={() => navigate(`/Wastage/workspace?event=${encodeURIComponent(row.id)}`)}
                              className="inline-flex items-center justify-center gap-1.5 h-9 px-4 text-sm rounded-xl border border-border bg-card hover:bg-muted transition-colors font-medium text-foreground"
                            >
                              Open record <ArrowRight size={14} />
                            </button>
                            <div className="text-[11px] text-muted-foreground">Review details and take the next step.</div>
                          </div>
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
          <SectionCard title="How to scan this queue" subtitle="Read the most important detail first, then open only when needed.">
            <div className="space-y-3 text-sm text-muted-foreground">
              <p><span className="font-medium text-foreground">Start with workflow</span> — Check status and the next-step hint before opening the record.</p>
              <p><span className="font-medium text-foreground">Use quantity as a cue</span> — Larger losses stand out faster when the queue stays visually quiet.</p>
              <p><span className="font-medium text-foreground">Open only when needed</span> — The table gives enough context for quick scanning without forcing every row open.</p>
            </div>
          </SectionCard>

          <SectionCard title="Workflow status guide" subtitle="Plain-language status meanings for daily use.">
            <div className="space-y-3 text-sm text-muted-foreground">
              <p><span className="font-medium text-foreground">Draft</span> — Not posted yet.</p>
              <p><span className="font-medium text-foreground">Submitted</span> — Waiting for review.</p>
              <p><span className="font-medium text-foreground">Approved</span> — Stock deducted.</p>
              <p><span className="font-medium text-foreground">Rejected</span> — Stopped, no stock impact.</p>
              <p><span className="font-medium text-foreground">Reversed</span> — Stock restored.</p>
            </div>
          </SectionCard>

          <SectionCard
            title="Active alerts"
            subtitle="Lightweight breach signals from the current ruleset."
            action={<span className="text-xs text-muted-foreground">{alertBreaches.length} active</span>}
          >
            {alertBreaches.length === 0 ? (
              <p className="text-sm text-muted-foreground">No active breaches in this view.</p>
            ) : (
              <div className="space-y-3">
                {alertBreaches.slice(0, 3).map((breach) => (
                  <div key={breach.id} className="border border-border rounded-2xl px-4 py-3 bg-background/40">
                    <div className="flex items-center gap-2">
                      <span className={`inline-flex text-[11px] px-2.5 py-0.5 rounded-full font-medium ${
                        breach.severity === 'High'
                          ? 'bg-red-50 text-red-700 border border-red-200'
                          : 'bg-amber-50 text-amber-700 border border-amber-200'
                      }`}>
                        {breach.severity}
                      </span>
                      <p className="text-sm font-medium text-foreground">{breach.label}</p>
                    </div>
                    <p className="text-sm text-muted-foreground mt-2 leading-relaxed">{breach.message}</p>
                    <p className="text-[11px] text-muted-foreground mt-2">{breach.scope}</p>
                  </div>
                ))}
              </div>
            )}
          </SectionCard>
        </div>
      </div>
    </div>
  );

  const renderReasonsSurface = () => (
    <div className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-3">
        <KpiCard label="Reason Codes" value={governanceSummary.totalReasons} helper="Policy rows visible in this prototype" tone="text-slate-700" />
        <KpiCard label="Reorder Affecting" value={governanceSummary.reorderAffecting} helper="Reasons that can influence replenishment logic" tone="text-amber-700" />
        <KpiCard label="Report Only" value={governanceSummary.reportOnly} helper="Reasons kept visible for reporting only" tone="text-blue-700" />
        <KpiCard label="Manager Review" value={governanceSummary.managerReview} helper="Reasons currently flagged for manager review" tone="text-green-700" />
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-12 gap-4 items-start">
        <div className="xl:col-span-8 space-y-4">
          <SectionCard
            title="Reason guide"
            subtitle="Keep this as a calm support view. It explains how reasons are expected to behave without pretending that governance is fully backend-enforced."
            action={<span className="text-xs text-muted-foreground">{reasonRows.length} rows</span>}
          >
            <div className="overflow-x-auto">
              <table className="w-full text-sm min-w-[980px]">
                <thead className="bg-muted/15 text-muted-foreground text-[11px] uppercase tracking-[0.18em]">
                  <tr>
                    {['Reason', 'Policy', 'Reorder Behavior', 'Approval Path', 'Status', 'Capture Guidance'].map((heading) => (
                      <th key={heading} className="text-left px-4 py-2.5 font-medium whitespace-nowrap">{heading}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {reasonRows.map((row, index) => (
                    <tr key={row.reason} className={`border-t border-border ${index % 2 === 0 ? 'bg-card' : 'bg-background/40'}`}>
                      <td className="px-4 py-3 align-top min-w-[220px]">
                        <div className="font-medium text-foreground">{row.reason}</div>
                        <div className="text-[11px] text-muted-foreground mt-0.5">{row.helper}</div>
                      </td>
                      <td className="px-4 py-3 align-top whitespace-nowrap"><PolicyChip bucket={row.bucket} chipClass={row.chipClass} /></td>
                      <td className="px-4 py-3 align-top min-w-[170px] text-muted-foreground">{row.reorderBehavior}</td>
                      <td className="px-4 py-3 align-top whitespace-nowrap">{row.approvalPath}</td>
                      <td className="px-4 py-3 align-top whitespace-nowrap">{row.catalogStatus}</td>
                      <td className="px-4 py-3 align-top min-w-[260px] text-muted-foreground">{row.captureGuidance}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </SectionCard>
        </div>

        <div className="xl:col-span-4 space-y-4 xl:sticky xl:top-6">
          <SectionCard title="How to use this guide" subtitle="Keep the guidance short and operational.">
            <div className="space-y-3 text-sm text-muted-foreground">
              <p><span className="font-medium text-foreground">Choose the clearest reason</span> — Pick the reason that best explains the loss without overthinking the policy layer.</p>
              <p><span className="font-medium text-foreground">Check the policy chip</span> — It helps explain whether the reason is planning-affecting or report-only.</p>
              <p><span className="font-medium text-foreground">Use manager review cues</span> — Higher-sensitivity reasons should feel more visible here before deeper backend rules exist.</p>
            </div>
          </SectionCard>

          <SectionCard title="Prototype boundaries" subtitle="What this guide does and does not claim yet.">
            <div className="space-y-3 text-sm text-muted-foreground">
              <p><span className="font-medium text-foreground">Useful now</span> — This shapes calm reason policy UX around the engine's current reason_code model.</p>
              <p><span className="font-medium text-foreground">Not full governance yet</span> — Status toggles, approvals, and policy enforcement still need backend support.</p>
              <p><span className="font-medium text-foreground">Safe to prototype</span> — It gives managers a policy reference without cluttering daily wastage capture.</p>
            </div>
          </SectionCard>
        </div>
      </div>
    </div>
  );

  const renderBarcodeSurface = () => (
    <div className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-3">
        <KpiCard label="Mapped Barcodes" value={governanceSummary.mappedBarcodes} helper="Mappings available to scanner-assisted capture" tone="text-slate-700" />
        <KpiCard label="Scanner-ready SKUs" value={governanceSummary.scannerReadySkus} helper="SKUs with active scanner support" tone="text-blue-700" />
        <KpiCard label="Needs Manual Fallback" value={governanceSummary.manualFallbackCount} helper="Scans that may still need human review" tone="text-amber-700" />
        <KpiCard label="Unresolved Scans" value={unresolvedScans.length} helper="Recent scan cases without a clean match" tone="text-red-700" />
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-12 gap-4 items-start">
        <div className="xl:col-span-8 space-y-4">
          <SectionCard
            title="Barcode mapping guide"
            subtitle="Use this when scanner input needs checking or when a barcode match feels unclear."
            action={<span className="text-xs text-muted-foreground">{barcodeRows.length} mappings</span>}
          >
            <div className="overflow-x-auto">
              <table className="w-full text-sm min-w-[900px]">
                <thead className="bg-muted/15 text-muted-foreground text-[11px] uppercase tracking-[0.18em]">
                  <tr>
                    {['Barcode', 'SKU', 'Item', 'Mapping Status', 'Mode', 'Location Hint', 'Updated'].map((heading) => (
                      <th key={heading} className="text-left px-4 py-2.5 font-medium whitespace-nowrap">{heading}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {barcodeRows.map((row, index) => (
                    <tr key={row.barcode} className={`border-t border-border ${index % 2 === 0 ? 'bg-card' : 'bg-background/40'}`}>
                      <td className="px-4 py-3 align-top font-medium text-foreground whitespace-nowrap">{row.barcode}</td>
                      <td className="px-4 py-3 align-top whitespace-nowrap">{row.sku}</td>
                      <td className="px-4 py-3 align-top min-w-[180px]">{row.itemName}</td>
                      <td className="px-4 py-3 align-top whitespace-nowrap">
                        <span className={`inline-flex text-[11px] px-2.5 py-0.5 rounded-full font-medium ${
                          row.mappingStatus === 'Active'
                            ? 'bg-green-50 text-green-700 border border-green-200'
                            : 'bg-amber-50 text-amber-700 border border-amber-200'
                        }`}>
                          {row.mappingStatus}
                        </span>
                      </td>
                      <td className="px-4 py-3 align-top whitespace-nowrap">{row.captureMode}</td>
                      <td className="px-4 py-3 align-top min-w-[180px] text-muted-foreground">{row.locationHint}</td>
                      <td className="px-4 py-3 align-top whitespace-nowrap text-muted-foreground">{row.updatedAt}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </SectionCard>

          <SectionCard
            title="Unresolved scan review"
            subtitle="These cases still need manual checking. Keep the wording supportive and avoid dead ends for operators."
            action={<span className="text-xs text-muted-foreground">{unresolvedScans.length} cases</span>}
          >
            <div className="space-y-3">
              {unresolvedScans.map((scan) => (
                <div key={scan.id} className="border border-border rounded-2xl px-4 py-4 bg-background/40">
                  <div className="flex items-start gap-3">
                    <div className="h-9 w-9 rounded-xl bg-amber-50 border border-amber-200 text-amber-700 flex items-center justify-center flex-shrink-0">
                      <AlertTriangle size={16} />
                    </div>
                    <div className="min-w-0 flex-1 space-y-2">
                      <div className="flex flex-col gap-1 md:flex-row md:items-center md:justify-between">
                        <p className="text-sm font-medium text-foreground">{scan.rawValue}</p>
                        <span className="text-xs text-muted-foreground">{scan.recordedAt}</span>
                      </div>
                      <p className="text-sm text-muted-foreground leading-relaxed">{scan.helper}</p>
                      <p className="text-xs text-muted-foreground">{scan.location} · {scan.operator}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </SectionCard>
        </div>

        <div className="xl:col-span-4 space-y-4 xl:sticky xl:top-6">
          <SectionCard title="How scanning works here" subtitle="Keep the scanner path simple and forgiving.">
            <div className="space-y-3 text-sm text-muted-foreground">
              <p><span className="font-medium text-foreground">Scan first</span> — Try to resolve the item quickly from barcode or SKU.</p>
              <p><span className="font-medium text-foreground">Confirm the match</span> — Review the SKU before saving the event.</p>
              <p><span className="font-medium text-foreground">Fallback calmly</span> — When no match is found, enter the SKU manually and continue.</p>
            </div>
          </SectionCard>

          <SectionCard title="Scanner support in this build" subtitle="Engine-honest reminders for the current wastage flow.">
            <div className="space-y-3 text-sm text-muted-foreground">
              <p><span className="font-medium text-foreground">Scanner input is supported</span> — The UI can resolve a scan before save.</p>
              <p><span className="font-medium text-foreground">SKU is still required</span> — The backend remains SKU-based.</p>
              <p><span className="font-medium text-foreground">Manual fallback is valid</span> — Unresolved scans should not block the operator.</p>
            </div>
          </SectionCard>
        </div>
      </div>
    </div>
  );

  const renderReportingSurface = () => (
    <div className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-3">
        <KpiCard label="Visible Events" value={reporting.summary.visibleEvents} helper="Events in the current reporting view" tone="text-slate-700" />
        <KpiCard label="Visible Waste Qty" value={reporting.summary.visibleQty} helper="Quantity represented in this prototype report" tone="text-amber-700" />
        <KpiCard label="Affected SKUs" value={reporting.summary.affectedSkus} helper="Unique SKUs in the current view" tone="text-blue-700" />
        <KpiCard label="Top Driver" value={reporting.summary.topDriverLabel} helper={reporting.summary.topDriverHelper} tone="text-green-700" />
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-12 gap-4 items-start">
        <div className="xl:col-span-8 space-y-4">
          <SectionCard
            title="Reporting filters"
            subtitle="This prototype keeps reporting calm and easy to scan before backend reporting endpoints exist."
            action={<span className="text-xs text-muted-foreground">Prototype surface</span>}
          >
            <div className="space-y-4">
              <div>
                <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-[0.22em] mb-2">Window</p>
                <div className="flex flex-wrap items-center gap-2">
                  {reportWindowTabs.map((tab) => (
                    <PillTab key={tab.key} label={tab.label} active={reportWindow === tab.key} onClick={() => setReportWindow(tab.key)} />
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
          <SectionCard title="How to use this page" subtitle="Keep this as a management prototype, not a live reporting claim.">
            <div className="space-y-3 text-sm text-muted-foreground">
              <p><span className="font-medium text-foreground">Start broad</span> — Use the current snapshot first, then narrow the scope only if needed.</p>
              <p><span className="font-medium text-foreground">Look for patterns</span> — Group by reason, SKU, or location depending on the question you are answering.</p>
              <p><span className="font-medium text-foreground">Treat exports as prototype actions</span> — This build shapes the flow before real export endpoints exist.</p>
            </div>
          </SectionCard>

          <SectionCard title="Prototype boundaries" subtitle="Engine-honest reminders for this reporting surface.">
            <div className="space-y-3 text-sm text-muted-foreground">
              <p><span className="font-medium text-foreground">Backed by current event rows</span> — This view derives from the same wastage records used in the queue.</p>
              <p><span className="font-medium text-foreground">Not a full BI module</span> — Cost, value, and scheduled exports still need backend support.</p>
              <p><span className="font-medium text-foreground">Useful for direction now</span> — It helps shape calm manager-facing reporting before deeper endpoints exist.</p>
            </div>
          </SectionCard>
        </div>
      </div>
    </div>
  );

  const renderApprovalsSurface = () => (
    <div className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-3">
        <KpiCard label="Awaiting Review" value={approvals.summary.awaitingReview} helper="Submitted events waiting for a decision" tone="text-amber-700" />
        <KpiCard label="Manager Review" value={approvals.summary.managerReview} helper="Submitted events with a higher-sensitivity review path" tone="text-red-700" />
        <KpiCard label="Reviewed Events" value={approvals.summary.reviewedEvents} helper="Approved, rejected, or reversed events in view" tone="text-slate-700" />
        <KpiCard label="Exceptions" value={approvals.summary.exceptions} helper="Rejected or reversed events that may need follow-up" tone="text-blue-700" />
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-12 gap-4 items-start">
        <div className="xl:col-span-8 space-y-4">
          <SectionCard
            title="Approval queue"
            subtitle="Calm review-first prototype for managers. Keep the next action obvious without claiming advanced policy enforcement yet."
            action={<span className="text-xs text-muted-foreground">{approvals.queue.length} waiting</span>}
          >
            {approvals.queue.length === 0 ? (
              <div className="px-2 py-12 text-center">
                <p className="text-base font-medium text-foreground mb-1">No submitted events are waiting right now</p>
                <p className="text-sm text-muted-foreground">The queue will fill when wastage events are submitted for review.</p>
              </div>
            ) : (
              <div className="space-y-3">
                {approvals.queue.map((item) => (
                  <div key={item.id} className="border border-border rounded-2xl px-4 py-4 bg-background/40">
                    <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                      <div className="space-y-2 min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                          <p className="text-sm font-semibold text-foreground">{item.id}</p>
                          <span className={`inline-flex text-[11px] px-2.5 py-0.5 rounded-full font-medium ${statusStyle[item.status]}`}>{item.status}</span>
                          <span className={`inline-flex text-[11px] px-2.5 py-0.5 rounded-full font-medium ${item.reviewTone}`}>{item.reviewPath}</span>
                        </div>
                        <p className="text-sm text-foreground">{item.sku} · {item.itemName} · {item.qty} units</p>
                        <p className="text-sm text-muted-foreground">{item.location} · {item.reason} · {item.recordedBy}</p>
                        <p className="text-sm text-muted-foreground leading-relaxed">{item.reviewHint}</p>
                      </div>
                      <div className="md:text-right space-y-2 shrink-0">
                        <p className="text-xs text-muted-foreground">{item.occurredAt}</p>
                        <button
                          onClick={() => navigate(`/Wastage/workspace?event=${encodeURIComponent(item.id)}`)}
                          className="inline-flex items-center gap-1.5 h-9 px-4 text-sm rounded-xl bg-primary text-primary-foreground hover:opacity-90 transition-opacity"
                        >
                          Review event <ArrowRight size={14} />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </SectionCard>

          <SectionCard
            title="Decision history"
            subtitle="Use this as a calm audit-style timeline until a deeper audit read model exists."
            action={<span className="text-xs text-muted-foreground">{approvals.history.length} recent entries</span>}
          >
            <div className="space-y-3">
              {approvals.history.map((entry) => (
                <div key={`${entry.id}-${entry.status}`} className="border border-border rounded-2xl px-4 py-4 bg-card">
                  <div className="flex flex-col gap-2 md:flex-row md:items-start md:justify-between">
                    <div className="space-y-1 min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <p className="text-sm font-semibold text-foreground">{entry.id}</p>
                        <span className={`inline-flex text-[11px] px-2.5 py-0.5 rounded-full font-medium ${statusStyle[entry.status]}`}>{entry.status}</span>
                        <span className="inline-flex text-[11px] px-2.5 py-0.5 rounded-full font-medium bg-slate-100 text-slate-700 border border-slate-200">{entry.stockEffect}</span>
                      </div>
                      <p className="text-sm text-muted-foreground">{entry.actor} · {entry.when}</p>
                      <p className="text-sm text-foreground">{entry.outcome}</p>
                      <p className="text-sm text-muted-foreground leading-relaxed">{entry.note}</p>
                    </div>
                    <div className="text-xs text-muted-foreground shrink-0">{entry.location}</div>
                  </div>
                </div>
              ))}
            </div>
          </SectionCard>
        </div>

        <div className="xl:col-span-4 space-y-4 xl:sticky xl:top-6">
          <SectionCard title="Review posture" subtitle="Short reminders for a low-stress decision flow.">
            <div className="space-y-3 text-sm text-muted-foreground">
              <p><span className="font-medium text-foreground">Orient first</span> — Start with status, quantity, reason, and stock effect before acting.</p>
              <p><span className="font-medium text-foreground">Review the reason path</span> — Higher-sensitivity reasons should feel more visible, not more confusing.</p>
              <p><span className="font-medium text-foreground">Use the workspace to decide</span> — Open the event when the queue card alone is not enough.</p>
            </div>
          </SectionCard>

          <SectionCard title="Prototype boundaries" subtitle="Engine-honest reminders for this approvals view.">
            <div className="space-y-3 text-sm text-muted-foreground">
              <p><span className="font-medium text-foreground">Useful now</span> — The queue and history reflect the current wastage event states.</p>
              <p><span className="font-medium text-foreground">Not deep audit yet</span> — Role enforcement, dual approval, and full audit endpoints still need backend support.</p>
              <p><span className="font-medium text-foreground">Calm by design</span> — This keeps approvals readable without turning the page into a dense compliance console.</p>
            </div>
          </SectionCard>

          <SectionCard title="Follow-up signals" subtitle="Events that may need extra manager attention.">
            <div className="space-y-3">
              {approvals.followUps.map((item) => (
                <div key={item.id} className="border border-border rounded-2xl px-4 py-3 bg-background/40">
                  <div className="flex items-start gap-3">
                    <div className="h-9 w-9 rounded-xl bg-amber-50 border border-amber-200 text-amber-700 flex items-center justify-center flex-shrink-0">
                      <ClipboardCheck size={16} />
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-foreground">{item.id}</p>
                      <p className="text-sm text-muted-foreground mt-1 leading-relaxed">{item.message}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </SectionCard>
        </div>
      </div>
    </div>
  );

  return (
    <div className="space-y-5">
      <div className="flex flex-col xl:flex-row xl:items-start gap-3 xl:gap-4 xl:justify-between">
        <div className="space-y-1">
          <h1 className="text-xl font-semibold text-foreground">Wastage</h1>
          <p className="text-sm text-muted-foreground">Record, review, and action wastage events through the current workflow.</p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => setRefreshTick((value) => value + 1)}
            className="flex items-center gap-1.5 h-10 px-4 text-sm rounded-xl border border-border bg-card hover:bg-muted transition-colors text-foreground"
          >
            <BellRing size={14} /> Refresh Queue
          </button>
          <button
            onClick={() => navigate('/Wastage/workspace?mode=create')}
            className="flex items-center gap-1.5 h-10 px-4 text-sm bg-primary text-primary-foreground rounded-xl hover:opacity-90 transition-opacity font-medium"
          >
            <Plus size={14} /> Record Wastage
          </button>
        </div>
      </div>

      <div className="border border-border rounded-2xl bg-card px-4 py-3 shadow-sm flex flex-col xl:flex-row xl:items-center gap-3">
        <div className="min-w-0">
          <p className="text-sm font-medium text-foreground">Operational wastage workflow</p>
          <p className="text-sm text-muted-foreground leading-relaxed">
            Keep the main queue for daily work. Use the guide and prototype surfaces for planning, review, and missing-engine feature design.
          </p>
        </div>
        <div className="xl:ml-auto flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
          <span className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-muted/40 border border-border"><ShieldCheck size={14} /> Engine-honest main workflow</span>
          <span className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-muted/40 border border-border"><ScanLine size={14} /> Prototype support surfaces</span>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        {surfaceTabs.map((tab) => (
          <PillTab key={tab.key} label={tab.label} active={activeSurface === tab.key} onClick={() => setSurface(tab.key)} />
        ))}
      </div>

      {activeSurface === 'OPERATIONS' && renderOperationsSurface()}
      {activeSurface === 'REASONS' && renderReasonsSurface()}
      {activeSurface === 'BARCODES' && renderBarcodeSurface()}
      {activeSurface === 'REPORTING' && renderReportingSurface()}
      {activeSurface === 'APPROVALS' && renderApprovalsSurface()}
    </div>
  );
}
