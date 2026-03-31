import { useMemo, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
<<<<<<< HEAD
import { AlertTriangle, ArrowRight, BellRing, Download, FileJson, FileSpreadsheet, Filter, Plus, ScanLine, Search, Settings2, ShieldCheck } from 'lucide-react';
=======
import { AlertTriangle, ArrowRight, BellRing, Filter, Plus, ScanLine, Search, ShieldCheck } from 'lucide-react';
>>>>>>> e4e8de4 (Reinstate wastage guide surfaces with neurodiverse-friendly redesign)
import {
  getAlertBreaches,
  getBarcodeMappings,
<<<<<<< HEAD
  getExportHistory,
  getExportReadiness,
=======
>>>>>>> e4e8de4 (Reinstate wastage guide surfaces with neurodiverse-friendly redesign)
  getGovernanceSummary,
  getKpiSummary,
  getReasonGovernanceRows,
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
<<<<<<< HEAD
  { key: 'REASONS', label: 'Reason Governance' },
  { key: 'BARCODES', label: 'Barcode Admin' },
  { key: 'REPORTING', label: 'Reporting & Exports' },
=======
  { key: 'REASONS', label: 'Reason Guide' },
  { key: 'BARCODES', label: 'Barcode Guide' },
>>>>>>> e4e8de4 (Reinstate wastage guide surfaces with neurodiverse-friendly redesign)
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

  const rows = useMemo(() => getWastageRows(), [refreshTick]);
  const reasonRows = useMemo(() => getReasonGovernanceRows(), [refreshTick]);
  const barcodeRows = useMemo(() => getBarcodeMappings(), [refreshTick]);
  const unresolvedScans = useMemo(() => getUnresolvedScans(), [refreshTick]);
  const governanceSummary = useMemo(() => getGovernanceSummary(), [refreshTick]);
<<<<<<< HEAD
  const reportingSummary = useMemo(() => getReportingSummary(rows), [rows]);
  const reportingByReason = useMemo(() => getReportingByReason(rows), [rows]);
  const reportingByLocation = useMemo(() => getReportingByLocation(rows), [rows]);
  const exportReadiness = useMemo(() => getExportReadiness(rows), [rows]);
  const exportHistory = useMemo(() => getExportHistory(), []);

  const setSurface = (nextSurface) => {
    setActiveSurface(nextSurface);
    if (nextSurface === 'OPERATIONS') {
      setSearchParams({});
    } else {
      setSearchParams({ surface: nextSurface });
    }
  };
=======
  const alertBreaches = useMemo(() => getAlertBreaches(rows), [rows]);
  const kpis = useMemo(() => getKpiSummary(rows), [rows]);
>>>>>>> e4e8de4 (Reinstate wastage guide surfaces with neurodiverse-friendly redesign)

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
    <>
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
            subtitle="Open a record to review its status and take the next action."
            action={<span className="text-xs text-muted-foreground">{filteredRows.length} events</span>}
          >
            <div className="space-y-3">
              <div className="flex flex-col lg:flex-row lg:items-center gap-2.5">
                <div className="relative flex-1 min-w-[240px] max-w-[460px]">
                  <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                  <input
                    type="text"
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    placeholder="Search by event, SKU, location, reason, or staff"
                    className="h-10 w-full border border-border rounded-xl pl-9 pr-3 text-sm focus:outline-none focus:ring-1 focus:ring-ring bg-card"
                  />
                </div>
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <Filter size={13} />
                  <span>Workflow filter</span>
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
                <table className="w-full text-sm min-w-[1120px]">
                  <thead className="bg-muted/15 text-muted-foreground text-[11px] uppercase tracking-[0.18em]">
                    <tr>
                      {['Event ID', 'Occurred', 'Location', 'SKU', 'Qty', 'Reason', 'Source', 'Status', 'Recorded By', 'Open'].map((heading) => (
                        <th key={heading} className="text-left px-4 py-2.5 font-medium whitespace-nowrap">
                          {heading}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {filteredRows.map((row, index) => (
                      <tr
                        key={row.id}
                        className={`border-t border-border ${index % 2 === 0 ? 'bg-card' : 'bg-background/40'} hover:bg-muted/25 transition-colors`}
                      >
                        <td className="px-4 py-3 align-top whitespace-nowrap min-w-[150px]">
                          <div className="font-medium text-foreground">{row.id}</div>
                          <div className="text-[11px] text-muted-foreground mt-0.5">{row.recordedAt}</div>
                        </td>
                        <td className="px-4 py-3 align-top whitespace-nowrap min-w-[150px]">
                          <div className="text-foreground">{row.occurredAt}</div>
                        </td>
                        <td className="px-4 py-3 align-top whitespace-nowrap min-w-[130px]">{row.location}</td>
                        <td className="px-4 py-3 align-top min-w-[190px]">
                          <div className="font-medium text-foreground">{row.sku}</div>
                          <div className="text-[11px] text-muted-foreground mt-0.5">{row.itemName}</div>
                        </td>
                        <td className="px-4 py-3 align-top whitespace-nowrap">{row.qty}</td>
                        <td className="px-4 py-3 align-top min-w-[200px]">{row.reason}</td>
                        <td className="px-4 py-3 align-top whitespace-nowrap">
                          <span className="inline-flex text-[11px] px-2.5 py-0.5 rounded-full font-medium bg-blue-50 text-blue-700 border border-blue-200">
                            {row.source}
                          </span>
                        </td>
                        <td className="px-4 py-3 align-top whitespace-nowrap">
                          <span className={`inline-flex text-[11px] px-2.5 py-0.5 rounded-full font-medium ${statusStyle[row.status]}`}>
                            {row.status}
                          </span>
                        </td>
                        <td className="px-4 py-3 align-top whitespace-nowrap min-w-[140px]">{row.recordedBy}</td>
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
          <SectionCard
            title="Workflow status guide"
            subtitle="Plain-language status meanings for daily use."
          >
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
    </>
  );

  const renderReasonsSurface = () => (
    <div className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-3">
        <KpiCard label="Tracked Reasons" value={governanceSummary.totalReasons} helper="Visible reason options in this build" tone="text-slate-700" />
        <KpiCard label="Reorder Affecting" value={governanceSummary.reorderAffecting} helper="Contributes to reorder demand logic" tone="text-amber-700" />
        <KpiCard label="Report Only" value={governanceSummary.reportOnly} helper="Visible for review, excluded from demand" tone="text-slate-700" />
        <KpiCard label="Manager Review" value={governanceSummary.managerReview} helper="Reasons that deserve closer review" tone="text-blue-700" />
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-12 gap-4 items-start">
        <div className="xl:col-span-8 space-y-4">
          <SectionCard
            title="Reason guide"
            subtitle="Use this when choosing a reason or checking how that reason should be treated operationally."
            action={<span className="text-xs text-muted-foreground">{reasonRows.length} reasons</span>}
          >
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
        </div>

        <div className="xl:col-span-4 space-y-4 xl:sticky xl:top-6">
          <SectionCard
            title="How to use this page"
            subtitle="Keep this as a reference surface, not a daily-action queue."
          >
            <div className="space-y-3 text-sm text-muted-foreground">
              <p><span className="font-medium text-foreground">Choose the nearest reason</span> — Pick the clearest operational reason first.</p>
              <p><span className="font-medium text-foreground">Check stock effect</span> — Some reasons affect reorder logic and some are review-only.</p>
              <p><span className="font-medium text-foreground">Use capture guidance</span> — The guidance line keeps naming and usage more consistent.</p>
            </div>
          </SectionCard>

          <SectionCard
            title="Calm interpretation"
            subtitle="Short reminders to reduce ambiguity while recording wastage."
          >
            <div className="space-y-3 text-sm text-muted-foreground">
              <p><span className="font-medium text-foreground">Reorder affecting</span> — This type of waste can change replenishment demand.</p>
              <p><span className="font-medium text-foreground">Report only</span> — Keep it visible for review without inflating demand.</p>
              <p><span className="font-medium text-foreground">Manager review</span> — The reason is valid, but deserves a closer look before trends are trusted.</p>
            </div>
          </SectionCard>
        </div>
      </div>
    </div>
  );

  const renderBarcodeSurface = () => (
    <div className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-3">
        <KpiCard label="Mapped Barcodes" value={governanceSummary.mappedBarcodes} helper="Known barcode-to-SKU mappings" tone="text-slate-700" />
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
                      <th key={heading} className="text-left px-4 py-2.5 font-medium whitespace-nowrap">
                        {heading}
                      </th>
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
          <SectionCard
            title="How scanning works here"
            subtitle="Keep the scanner path simple and forgiving."
          >
            <div className="space-y-3 text-sm text-muted-foreground">
              <p><span className="font-medium text-foreground">Scan first</span> — Try to resolve the item quickly from barcode or SKU.</p>
              <p><span className="font-medium text-foreground">Confirm the match</span> — Review the SKU before saving the event.</p>
              <p><span className="font-medium text-foreground">Fallback calmly</span> — When no match is found, enter the SKU manually and continue.</p>
            </div>
          </SectionCard>

          <SectionCard
            title="Scanner support in this build"
            subtitle="Engine-honest reminders for the current wastage flow."
          >
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

  return (
    <div className="p-5 lg:p-6 space-y-4">
      <div className="space-y-1">
        <h1 className="text-xl font-semibold text-foreground">Wastage</h1>
        <p className="text-sm text-muted-foreground">
<<<<<<< HEAD
          Capture wastage, review the workflow queue, and prototype the governance, barcode, reporting, and export surfaces that the current SKU-based waste engine still needs next.
=======
          Keep operations primary, with calm reason and barcode reference surfaces available when needed.
>>>>>>> e4e8de4 (Reinstate wastage guide surfaces with neurodiverse-friendly redesign)
        </p>
      </div>

      <div className="border border-border rounded-2xl bg-card px-4 py-3 shadow-sm flex flex-col xl:flex-row xl:items-center gap-3">
        <div className="flex items-start gap-3 min-w-0">
          <div className="h-9 w-9 rounded-xl bg-amber-50 border border-amber-200 text-amber-700 flex items-center justify-center flex-shrink-0">
            {activeSurface === 'OPERATIONS' ? <ShieldCheck size={16} /> : <ScanLine size={16} />}
          </div>
          <div className="min-w-0">
            <p className="text-sm font-medium text-foreground">
              {activeSurface === 'OPERATIONS'
                ? 'Operational wastage workflow'
                : activeSurface === 'REASONS'
                  ? 'Reason guidance reference'
                  : 'Scanner and barcode guidance'}
            </p>
            <p className="text-sm text-muted-foreground leading-relaxed">
<<<<<<< HEAD
              Operations already match the current backend flow. This pass keeps those surfaces stable while adding honest admin prototypes for <span className="font-medium text-foreground">reason governance</span>, <span className="font-medium text-foreground">barcode mapping</span>, and <span className="font-medium text-foreground">reporting/export readiness</span> without pretending the backend already has those layers built in.
=======
              {activeSurface === 'OPERATIONS'
                ? 'Use this queue to record wastage, review status, and take the next action without extra clutter.'
                : activeSurface === 'REASONS'
                  ? 'This view brings back the deleted reason surface as a calmer guide for choosing and interpreting wastage reasons.'
                  : 'This view brings back barcode support guidance in a calmer way, without letting it overwhelm daily capture work.'}
>>>>>>> e4e8de4 (Reinstate wastage guide surfaces with neurodiverse-friendly redesign)
            </p>
          </div>
        </div>

        <div className="xl:ml-auto flex flex-wrap items-center gap-2">
          <button
            onClick={() => setRefreshTick((value) => value + 1)}
            className="flex items-center gap-1.5 h-10 px-4 text-sm rounded-xl border border-border bg-card hover:bg-muted transition-colors text-foreground"
          >
            <BellRing size={14} /> Refresh
          </button>
          {activeSurface === 'OPERATIONS' ? (
            <button
              onClick={() => navigate('/Wastage/workspace?mode=create')}
              className="flex items-center gap-1.5 h-10 px-4 text-sm bg-primary text-primary-foreground rounded-xl hover:opacity-90 transition-opacity font-medium"
            >
              <Plus size={14} /> Record Wastage
            </button>
          ) : (
            <button
              onClick={() => setSurface('OPERATIONS')}
              className="flex items-center gap-1.5 h-10 px-4 text-sm bg-primary text-primary-foreground rounded-xl hover:opacity-90 transition-opacity font-medium"
            >
              <ArrowRight size={14} /> Back to Operations
            </button>
          )}
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        {surfaceTabs.map((tab) => (
          <PillTab key={tab.key} label={tab.label} active={activeSurface === tab.key} onClick={() => setSurface(tab.key)} />
        ))}
      </div>

<<<<<<< HEAD
      {activeSurface === 'OPERATIONS' ? (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-3">
            <KpiCard label="Drafts" value={kpis.drafts} helper="Saved but not yet submitted" tone="text-slate-700" />
            <KpiCard label="Submitted" value={kpis.submitted} helper="Awaiting manager review" tone="text-amber-700" />
            <KpiCard label="Approved Qty" value={kpis.approvedQty} helper="Quantity already posted to stock" tone="text-green-700" />
            <KpiCard label="Alert Breaches" value={alertBreaches.length} helper="Threshold breaches from the lightweight ruleset" tone="text-red-700" />
          </div>

          <div className="grid grid-cols-1 xl:grid-cols-12 gap-4 items-start">
            <div className="xl:col-span-8 space-y-4">
              <SectionCard
                title="Wastage Queue"
                subtitle="Open a record to review its workflow state. Create mode is the only full entry form; saved drafts return as review-first records in this build."
                action={<span className="text-xs text-muted-foreground">{filteredRows.length} visible</span>}
              >
                <div className="space-y-3">
                  <div className="flex flex-col lg:flex-row lg:items-center gap-2.5">
                    <div className="relative flex-1 min-w-[240px] max-w-[460px]">
                      <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                      <input
                        type="text"
                        value={query}
                        onChange={(e) => setQuery(e.target.value)}
                        placeholder="Search by event, item, SKU, location, reason, or staff"
                        className="h-10 w-full border border-border rounded-xl pl-9 pr-3 text-sm focus:outline-none focus:ring-1 focus:ring-ring bg-card"
                      />
                    </div>
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <Filter size={13} />
                      <span>Workflow filter</span>
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
                    <p className="text-sm text-muted-foreground mb-4">Try another search or reset the workflow filter.</p>
                    <button
                      onClick={() => {
                        setQuery('');
                        setActiveTab('ALL');
                      }}
                      className="inline-flex items-center gap-1.5 h-10 px-4 text-sm rounded-xl border border-border bg-card hover:bg-muted transition-colors text-foreground"
                    >
                      Reset view
                    </button>
                  </div>
                ) : (
                  <div className="overflow-x-auto mt-4">
                    <table className="w-full text-sm min-w-[1080px]">
                      <thead className="bg-muted/15 text-muted-foreground text-[11px] uppercase tracking-[0.18em]">
                        <tr>
                          {['Event', 'Occurred', 'Item / SKU', 'Location', 'Reason Policy', 'Capture', 'Workflow', 'Recorded By', 'Action'].map((heading) => (
                            <th key={heading} className="text-left px-4 py-2.5 font-medium whitespace-nowrap">{heading}</th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {filteredRows.map((row, index) => {
                          const policy = getReasonPolicy(row.reason);
                          const actionLabel = row.status === 'DRAFT' ? 'Review draft' : row.status === 'SUBMITTED' ? 'Review queue item' : 'Open record';
                          return (
                            <tr key={row.id} className={`border-t border-border ${index % 2 === 0 ? 'bg-card' : 'bg-background/40'}`}>
                              <td className="px-4 py-3 align-top">
                                <div className="font-medium text-foreground">{row.id}</div>
                                <div className="text-[11px] text-muted-foreground mt-1">{row.notes || 'No notes captured'}</div>
                              </td>
                              <td className="px-4 py-3 align-top whitespace-nowrap text-muted-foreground">{row.occurredAt}</td>
                              <td className="px-4 py-3 align-top min-w-[220px]">
                                <div className="font-medium text-foreground">{row.itemName}</div>
                                <div className="text-[11px] text-muted-foreground mt-1">{row.sku} · {row.qty} units · On hand {row.currentOnHand}</div>
                              </td>
                              <td className="px-4 py-3 align-top whitespace-nowrap text-muted-foreground">{row.location}</td>
                              <td className="px-4 py-3 align-top min-w-[220px]">
                                <div className="flex flex-wrap items-center gap-2">
                                  <div className="font-medium text-foreground">{row.reason}</div>
                                  <PolicyChip policy={policy} />
                                </div>
                                <div className="text-[11px] text-muted-foreground mt-1">{policy.reorderBehavior}</div>
                              </td>
                              <td className="px-4 py-3 align-top whitespace-nowrap">
                                <span className="inline-flex text-[11px] px-2.5 py-0.5 rounded-full font-medium bg-blue-50 text-blue-700 border border-blue-200">{row.source}</span>
                                {row.scanResolution ? <div className="text-[11px] text-muted-foreground mt-1">{row.scanResolution}</div> : null}
                              </td>
                              <td className="px-4 py-3 align-top whitespace-nowrap">
                                <span className={`inline-flex text-[11px] px-2.5 py-0.5 rounded-full font-medium ${statusStyle[row.status]}`}>{row.status}</span>
                              </td>
                              <td className="px-4 py-3 align-top whitespace-nowrap text-muted-foreground">{row.recordedBy}</td>
                              <td className="px-4 py-3 align-top whitespace-nowrap">
                                <button
                                  onClick={() => navigate(`/Wastage/workspace?id=${row.id}`)}
                                  className="inline-flex items-center gap-1.5 h-9 px-4 text-sm rounded-xl border border-border bg-card hover:bg-muted transition-colors text-foreground"
                                >
                                  {actionLabel} <ArrowRight size={14} />
                                </button>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                )}
              </SectionCard>
            </div>

            <div className="xl:col-span-4 space-y-4 xl:sticky xl:top-6">
              <SectionCard title="Alert Rules" subtitle="The current engine already has lightweight threshold rules, so the UI can honestly surface them here.">
                <div className="space-y-3">
                  {alertRules.map((rule) => (
                    <div key={rule.id} className="border border-border rounded-2xl px-4 py-3 bg-background/40">
                      <div className="flex items-center gap-2">
                        <div className="font-medium text-foreground">{rule.name}</div>
                        <span className={`inline-flex text-[11px] px-2.5 py-0.5 rounded-full font-medium ${rule.severity === 'High' ? 'bg-red-50 text-red-700 border border-red-200' : 'bg-amber-50 text-amber-700 border border-amber-200'}`}>{rule.severity}</span>
                      </div>
                      <div className="text-xs text-muted-foreground mt-2">{rule.scope} · {rule.threshold} · {rule.window}</div>
                    </div>
                  ))}
                </div>
              </SectionCard>

              <SectionCard title="Alert Breaches" subtitle="Threshold-based exception list derived from the current prototype data.">
                {alertBreaches.length === 0 ? (
                  <p className="text-sm text-muted-foreground">No alert breaches right now.</p>
                ) : (
                  <div className="space-y-3">
                    {alertBreaches.map((breach) => (
                      <div key={breach.id} className="border border-border rounded-2xl px-4 py-3 bg-background/40 flex gap-3">
                        <div className="h-9 w-9 rounded-xl bg-red-50 border border-red-200 text-red-700 flex items-center justify-center flex-shrink-0">
                          <AlertTriangle size={15} />
                        </div>
                        <div className="min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <p className="text-sm font-medium text-foreground">{breach.label}</p>
                            <span className={`inline-flex text-[11px] px-2.5 py-0.5 rounded-full font-medium ${breach.severity === 'High' ? 'bg-red-50 text-red-700 border border-red-200' : 'bg-amber-50 text-amber-700 border border-amber-200'}`}>{breach.severity}</span>
                          </div>
                          <p className="text-xs text-muted-foreground mt-1 leading-relaxed">{breach.message}</p>
                          <p className="text-[11px] text-muted-foreground mt-2">{breach.scope}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </SectionCard>
            </div>
          </div>
        </>
      ) : activeSurface === 'REASONS' ? (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-3">
            <KpiCard label="Reason Codes" value={governanceSummary.totalReasons} helper="Prototype reason catalog rows" tone="text-slate-700" />
            <KpiCard label="Reorder Affecting" value={governanceSummary.reorderAffecting} helper="Reasons still visible to replenishment logic" tone="text-amber-700" />
            <KpiCard label="Report Only" value={governanceSummary.reportOnly} helper="Reasons excluded from reorder demand logic" tone="text-slate-700" />
            <KpiCard label="Manager Review" value={governanceSummary.managerReview} helper="Reasons flagged for stronger review posture" tone="text-red-700" />
          </div>

          <div className="grid grid-cols-1 xl:grid-cols-12 gap-4 items-start">
            <div className="xl:col-span-8 space-y-4">
              <SectionCard
                title="Reason Governance"
                subtitle="Prototype the future reason master so managers can see which wastage reasons affect reorder logic and which stay report-only."
                action={<span className="text-xs text-muted-foreground">{governanceRows.length} rows</span>}
              >
                <div className="overflow-x-auto">
                  <table className="w-full text-sm min-w-[1080px]">
                    <thead className="bg-muted/15 text-muted-foreground text-[11px] uppercase tracking-[0.18em]">
                      <tr>
                        {['Reason', 'Policy', 'Reorder Behavior', 'Approval Path', 'Catalog Status', 'Capture Guidance'].map((heading) => (
                          <th key={heading} className="text-left px-4 py-2.5 font-medium whitespace-nowrap">{heading}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {governanceRows.map((row, index) => (
                        <tr key={row.reason} className={`border-t border-border ${index % 2 === 0 ? 'bg-card' : 'bg-background/40'}`}>
                          <td className="px-4 py-3 align-top min-w-[180px]">
                            <div className="font-medium text-foreground">{row.reason}</div>
                          </td>
                          <td className="px-4 py-3 align-top whitespace-nowrap"><PolicyChip policy={row} /></td>
                          <td className="px-4 py-3 align-top min-w-[150px]">
                            <div className="font-medium text-foreground">{row.reorderBehavior}</div>
                            <div className="text-[11px] text-muted-foreground mt-1">{row.helper}</div>
                          </td>
                          <td className="px-4 py-3 align-top min-w-[150px]">
                            <div className="font-medium text-foreground">{row.approvalPath}</div>
                            <div className="text-[11px] text-muted-foreground mt-1">{row.reviewNote}</div>
                          </td>
                          <td className="px-4 py-3 align-top whitespace-nowrap">
                            <span className={`inline-flex text-[11px] px-2.5 py-0.5 rounded-full font-medium ${row.catalogStatus === 'Active' ? 'bg-green-50 text-green-700 border border-green-200' : 'bg-amber-50 text-amber-700 border border-amber-200'}`}>{row.catalogStatus}</span>
                          </td>
                          <td className="px-4 py-3 align-top min-w-[220px] text-muted-foreground">{row.captureGuidance}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </SectionCard>
            </div>

            <div className="xl:col-span-4 space-y-4 xl:sticky xl:top-6">
              <SectionCard
                title="Why this screen exists"
                subtitle="The engine does not yet have a dedicated wastage-reason table, so the UI needs a clear policy surface first."
                action={<Settings2 size={15} className="text-muted-foreground" />}
              >
                <div className="space-y-3 text-sm text-muted-foreground">
                  <p>Reason policy should not stay hidden in code or scattered helper text.</p>
                  <p>Managers need one place to confirm which reasons affect reorder logic and which remain report-only.</p>
                  <p>This screen is a UI prototype for the future reason master, not a claim that the backend already has full governance CRUD.</p>
                </div>
              </SectionCard>

              <SectionCard title="Proposed next controls" subtitle="These are the strongest follow-up actions once the backend grows a proper reason master.">
                <div className="space-y-3 text-sm text-muted-foreground">
                  <p>Add reason create/edit/archive controls.</p>
                  <p>Bind approval requirements and role restrictions per reason.</p>
                  <p>Version the policy so exports and audit can snapshot which rules were active.</p>
                </div>
              </SectionCard>
            </div>
          </div>
        </>
      ) : activeSurface === 'BARCODES' ? (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-3">
            <KpiCard label="Mapped Codes" value={governanceSummary.mappedBarcodes} helper="Barcodes currently linked to a SKU in the prototype catalog" tone="text-blue-700" />
            <KpiCard label="Scanner Ready SKUs" value={governanceSummary.scannerReadySkus} helper="Items with at least one active mapping" tone="text-slate-700" />
            <KpiCard label="Needs Review" value={unresolvedScans.length} helper="Recent scans that could not resolve cleanly" tone="text-red-700" />
            <KpiCard label="Fallback Capture" value={governanceSummary.manualFallbackCount} helper="Events that would still rely on manual SKU correction" tone="text-amber-700" />
          </div>

          <div className="grid grid-cols-1 xl:grid-cols-12 gap-4 items-start">
            <div className="xl:col-span-8 space-y-4">
              <SectionCard
                title="Barcode Mapping Admin"
                subtitle="Prototype the missing barcode layer that sits in front of the current SKU-based engine. This surface is about mapping and governance, not pretending the backend already stores barcode natively."
                action={<span className="text-xs text-muted-foreground">{barcodeMappings.length} mappings</span>}
              >
                <div className="overflow-x-auto">
                  <table className="w-full text-sm min-w-[1040px]">
                    <thead className="bg-muted/15 text-muted-foreground text-[11px] uppercase tracking-[0.18em]">
                      <tr>
                        {['Barcode', 'SKU', 'Item', 'Mapping Status', 'Capture Mode', 'Updated', 'Notes'].map((heading) => (
                          <th key={heading} className="text-left px-4 py-2.5 font-medium whitespace-nowrap">{heading}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {barcodeMappings.map((row, index) => (
                        <tr key={row.barcode} className={`border-t border-border ${index % 2 === 0 ? 'bg-card' : 'bg-background/40'}`}>
                          <td className="px-4 py-3 align-top whitespace-nowrap font-medium text-foreground">{row.barcode}</td>
                          <td className="px-4 py-3 align-top whitespace-nowrap text-muted-foreground">{row.sku}</td>
                          <td className="px-4 py-3 align-top min-w-[220px]">
                            <div className="font-medium text-foreground">{row.itemName}</div>
                            <div className="text-[11px] text-muted-foreground mt-1">{row.locationHint}</div>
                          </td>
                          <td className="px-4 py-3 align-top whitespace-nowrap">
                            <span className={`inline-flex text-[11px] px-2.5 py-0.5 rounded-full font-medium ${row.mappingStatus === 'Active' ? 'bg-green-50 text-green-700 border border-green-200' : 'bg-amber-50 text-amber-700 border border-amber-200'}`}>{row.mappingStatus}</span>
                          </td>
                          <td className="px-4 py-3 align-top whitespace-nowrap">
                            <span className="inline-flex text-[11px] px-2.5 py-0.5 rounded-full font-medium bg-blue-50 text-blue-700 border border-blue-200">{row.captureMode}</span>
                          </td>
                          <td className="px-4 py-3 align-top min-w-[150px] text-muted-foreground">{row.updatedAt}</td>
                          <td className="px-4 py-3 align-top min-w-[220px] text-muted-foreground">{row.notes}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </SectionCard>

              <SectionCard title="Unresolved Scan Queue" subtitle="A future barcode layer should collect scan misses here so managers can map or correct them instead of losing the scanner trail.">
                {unresolvedScans.length === 0 ? (
                  <p className="text-sm text-muted-foreground">No unresolved scans in the prototype queue.</p>
                ) : (
                  <div className="space-y-3">
                    {unresolvedScans.map((scan) => (
                      <div key={scan.id} className="border border-border rounded-2xl px-4 py-3 bg-background/40 flex flex-col md:flex-row md:items-start gap-3">
                        <div className="h-9 w-9 rounded-xl bg-red-50 border border-red-200 text-red-700 flex items-center justify-center flex-shrink-0">
                          <ScanLine size={15} />
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="flex flex-wrap items-center gap-2">
                            <p className="text-sm font-medium text-foreground">{scan.rawValue}</p>
                            <span className="inline-flex text-[11px] px-2.5 py-0.5 rounded-full font-medium bg-red-50 text-red-700 border border-red-200">Needs mapping</span>
                          </div>
                          <p className="text-xs text-muted-foreground mt-1 leading-relaxed">{scan.helper}</p>
                          <p className="text-[11px] text-muted-foreground mt-2">{scan.location} · {scan.recordedAt} · {scan.operator}</p>
                        </div>
                        <button className="inline-flex items-center gap-1.5 h-9 px-4 text-sm rounded-xl border border-border bg-card hover:bg-muted transition-colors text-foreground">
                          Review Mapping <ArrowRight size={14} />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </SectionCard>
            </div>

            <div className="xl:col-span-4 space-y-4 xl:sticky xl:top-6">
              <SectionCard title="Scanner Reality" subtitle="How handheld capture should work with the current engine.">
                <div className="space-y-3 text-sm text-muted-foreground">
                  <p>Scanners can already behave like keyboard input at capture time.</p>
                  <p>The missing piece is barcode governance: code-to-SKU mapping, review of misses, and a manager place to maintain them.</p>
                  <p>This screen prototypes that admin layer while the engine remains SKU-posting underneath.</p>
                </div>
              </SectionCard>

              <SectionCard title="Recommended backend next step" subtitle="After the UI is agreed, these are the lowest-risk follow-ups.">
                <div className="space-y-3 text-sm text-muted-foreground">
                  <p>Add a barcode or item-code mapping table.</p>
                  <p>Store the raw scanned value alongside the resolved SKU for audit.</p>
                  <p>Expose a lookup endpoint so the capture workspace can stop simulating resolution locally.</p>
                </div>
              </SectionCard>
            </div>
          </div>
        </>
      ) : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-3">
            <KpiCard label="Approved Events" value={reportingSummary.approvedEvents} helper="Records already in the clean export-ready lane" tone="text-green-700" />
            <KpiCard label="Report-only Qty" value={reportingSummary.reportOnlyQty} helper="Visible for reporting without feeding reorder logic" tone="text-slate-700" />
            <KpiCard label="Reorder Qty" value={reportingSummary.reorderQty} helper="Reviewed quantity that still matters to replenishment review" tone="text-amber-700" />
            <KpiCard label="Export-ready Records" value={reportingSummary.exportReadyRecords} helper="Approved rows currently safe to package for downstream handoff" tone="text-blue-700" />
          </div>

          <div className="grid grid-cols-1 xl:grid-cols-12 gap-4 items-start">
            <div className="xl:col-span-8 space-y-4">
              <SectionCard
                title="Reporting Snapshot by Reason"
                subtitle="Prototype the future report layer using the workflow states and reason policy already present in the engine-aligned module."
                action={<span className="text-xs text-muted-foreground">{reportingByReason.length} grouped rows</span>}
              >
                <div className="overflow-x-auto">
                  <table className="w-full text-sm min-w-[900px]">
                    <thead className="bg-muted/15 text-muted-foreground text-[11px] uppercase tracking-[0.18em]">
                      <tr>
                        {['Reason', 'Policy', 'Reviewed Events', 'Quantity', 'Last Seen'].map((heading) => (
                          <th key={heading} className="text-left px-4 py-2.5 font-medium whitespace-nowrap">{heading}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {reportingByReason.map((row, index) => (
                        <tr key={row.reason} className={`border-t border-border ${index % 2 === 0 ? 'bg-card' : 'bg-background/40'}`}>
                          <td className="px-4 py-3 align-top font-medium text-foreground">{row.reason}</td>
                          <td className="px-4 py-3 align-top whitespace-nowrap"><PolicyChip policy={getReasonPolicy(row.reason)} /></td>
                          <td className="px-4 py-3 align-top whitespace-nowrap text-muted-foreground">{row.reviewedEvents}</td>
                          <td className="px-4 py-3 align-top whitespace-nowrap text-foreground font-medium">{row.qty}</td>
                          <td className="px-4 py-3 align-top whitespace-nowrap text-muted-foreground">{row.lastSeen}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </SectionCard>

              <SectionCard
                title="Location Reporting View"
                subtitle="Use this to shape future location reports without claiming that the backend already has a full analytics or export engine."
                action={<span className="text-xs text-muted-foreground">{reportingByLocation.length} locations</span>}
              >
                <div className="overflow-x-auto">
                  <table className="w-full text-sm min-w-[860px]">
                    <thead className="bg-muted/15 text-muted-foreground text-[11px] uppercase tracking-[0.18em]">
                      <tr>
                        {['Location', 'Reviewed Events', 'Pending Review', 'Report-only Qty', 'Reorder Qty'].map((heading) => (
                          <th key={heading} className="text-left px-4 py-2.5 font-medium whitespace-nowrap">{heading}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {reportingByLocation.map((row, index) => (
                        <tr key={row.location} className={`border-t border-border ${index % 2 === 0 ? 'bg-card' : 'bg-background/40'}`}>
                          <td className="px-4 py-3 align-top font-medium text-foreground">{row.location}</td>
                          <td className="px-4 py-3 align-top whitespace-nowrap text-muted-foreground">{row.reviewedEvents}</td>
                          <td className="px-4 py-3 align-top whitespace-nowrap text-amber-700 font-medium">{row.pendingReview}</td>
                          <td className="px-4 py-3 align-top whitespace-nowrap text-slate-700 font-medium">{row.reportOnlyQty}</td>
                          <td className="px-4 py-3 align-top whitespace-nowrap text-amber-700 font-medium">{row.reorderQty}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </SectionCard>

              <SectionCard
                title="Export History"
                subtitle="Prototype the audit-safe export log that should exist before wastage data is handed to other systems."
                action={<span className="text-xs text-muted-foreground">{exportHistory.length} recent runs</span>}
              >
                <div className="space-y-3">
                  {exportHistory.map((run) => (
                    <div key={run.id} className="border border-border rounded-2xl px-4 py-3 bg-background/40 flex flex-col md:flex-row md:items-start gap-3">
                      <div className={`h-9 w-9 rounded-xl border flex items-center justify-center flex-shrink-0 ${run.format === 'CSV' ? 'bg-green-50 border-green-200 text-green-700' : 'bg-blue-50 border-blue-200 text-blue-700'}`}>
                        {run.format === 'CSV' ? <FileSpreadsheet size={15} /> : <FileJson size={15} />}
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <p className="text-sm font-medium text-foreground">{run.id}</p>
                          <span className={`inline-flex text-[11px] px-2.5 py-0.5 rounded-full font-medium ${run.status === 'Verified' ? 'bg-green-50 text-green-700 border border-green-200' : run.status === 'Blocked' ? 'bg-red-50 text-red-700 border border-red-200' : 'bg-amber-50 text-amber-700 border border-amber-200'}`}>{run.status}</span>
                        </div>
                        <p className="text-sm text-muted-foreground mt-1">{run.scope}</p>
                        <p className="text-[11px] text-muted-foreground mt-2">{run.generatedAt} · {run.generatedBy}</p>
                        <p className="text-[11px] text-muted-foreground mt-1">{run.helper}</p>
                      </div>
                      <button className="inline-flex items-center gap-1.5 h-9 px-4 text-sm rounded-xl border border-border bg-card hover:bg-muted transition-colors text-foreground">
                        Review Log <ArrowRight size={14} />
                      </button>
                    </div>
                  ))}
                </div>
              </SectionCard>
            </div>

            <div className="xl:col-span-4 space-y-4 xl:sticky xl:top-6">
              <SectionCard title="Export Readiness" subtitle="Show what still blocks a clean downstream handoff in the current prototype.">
                <div className="space-y-3">
                  <div className="grid grid-cols-2 gap-3 text-sm">
                    <div className="border border-border rounded-2xl px-3 py-3 bg-background/40">
                      <div className="text-[11px] uppercase tracking-[0.18em] text-muted-foreground">Approved</div>
                      <div className="text-lg font-semibold text-foreground mt-1">{exportReadiness.approvedRecords}</div>
                    </div>
                    <div className="border border-border rounded-2xl px-3 py-3 bg-background/40">
                      <div className="text-[11px] uppercase tracking-[0.18em] text-muted-foreground">Pending review</div>
                      <div className="text-lg font-semibold text-amber-700 mt-1">{exportReadiness.pendingReview}</div>
                    </div>
                    <div className="border border-border rounded-2xl px-3 py-3 bg-background/40">
                      <div className="text-[11px] uppercase tracking-[0.18em] text-muted-foreground">Scan blockers</div>
                      <div className="text-lg font-semibold text-red-700 mt-1">{exportReadiness.unresolvedScans}</div>
                    </div>
                    <div className="border border-border rounded-2xl px-3 py-3 bg-background/40">
                      <div className="text-[11px] uppercase tracking-[0.18em] text-muted-foreground">Watchlist reasons</div>
                      <div className="text-lg font-semibold text-amber-700 mt-1">{exportReadiness.watchlistReasons}</div>
                    </div>
                  </div>
                  <div className="border border-border rounded-2xl px-4 py-3 bg-background/40 text-sm text-muted-foreground leading-relaxed">
                    {exportReadiness.helper}
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <button className="inline-flex items-center gap-1.5 h-10 px-4 text-sm rounded-xl border border-border bg-card hover:bg-muted transition-colors text-foreground">
                      <Download size={14} /> Export CSV Prototype
                    </button>
                    <button className="inline-flex items-center gap-1.5 h-10 px-4 text-sm rounded-xl border border-border bg-card hover:bg-muted transition-colors text-foreground">
                      <FileJson size={14} /> Export JSON Prototype
                    </button>
                  </div>
                </div>
              </SectionCard>

              <SectionCard title="Why this screen exists" subtitle="The engine has KPI scaffolding but not a full report/export layer yet.">
                <div className="space-y-3 text-sm text-muted-foreground">
                  <p>This surface lets the prototype show what reporting and export control should feel like before the backend grows filtered reporting and real export endpoints.</p>
                  <p>It keeps reporting honest by grounding every number in the current workflow states and reason policy layer rather than in fake analytics widgets.</p>
                </div>
              </SectionCard>

              <SectionCard title="Recommended backend next step" subtitle="Lowest-risk work after the UI direction is accepted.">
                <div className="space-y-3 text-sm text-muted-foreground">
                  <p>Add filtered report endpoints by location, reason, status, and date range.</p>
                  <p>Create CSV and JSON export endpoints with audit-safe export history.</p>
                  <p>Link export verification to approvals, unresolved scans, and reason policy snapshots.</p>
                </div>
              </SectionCard>
            </div>
          </div>
        </>
      )}
=======
      {activeSurface === 'OPERATIONS' && renderOperationsSurface()}
      {activeSurface === 'REASONS' && renderReasonsSurface()}
      {activeSurface === 'BARCODES' && renderBarcodeSurface()}
>>>>>>> e4e8de4 (Reinstate wastage guide surfaces with neurodiverse-friendly redesign)
    </div>
  );
}
