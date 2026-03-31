import { useMemo, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { AlertTriangle, ArrowRight, BellRing, Download, Filter, Plus, ScanLine, Search, ShieldCheck } from 'lucide-react';
import {
  getAlertBreaches,
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
];

function KpiCard({ label, value, helper, tone = 'text-foreground' }) {

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
                        <th key={heading} className="text-left px-4 py-2.5 font-medium whitespace-nowrap">
                          {heading}
                        </th>
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
          <SectionCard
            title="How to use this page"
            subtitle="Keep this as a management prototype, not a live reporting claim."
          >
            <div className="space-y-3 text-sm text-muted-foreground">
              <p><span className="font-medium text-foreground">Start broad</span> — Use the current snapshot first, then narrow the scope only if needed.</p>
              <p><span className="font-medium text-foreground">Look for patterns</span> — Group by reason, SKU, or location depending on the question you are answering.</p>
              <p><span className="font-medium text-foreground">Treat exports as prototype actions</span> — This build shapes the flow before real export endpoints exist.</p>
            </div>
          </SectionCard>

          <SectionCard
            title="Prototype boundaries"
            subtitle="Engine-honest reminders for this reporting surface."
          >
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

  return (
    <div className="border border-border rounded-2xl bg-card px-4 py-3 min-h-[104px] shadow-sm">
      <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-[0.22em] mb-1.5">{label}</p>
      <p className={`text-[1.9rem] leading-none font-bold ${tone}`}>{value}</p>
      <p className="text-xs text-muted-foreground mt-2 leading-relaxed">{helper}</p>
    </div>
  );
}

function PillTab({ active, onClick, label }) {

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
                        <th key={heading} className="text-left px-4 py-2.5 font-medium whitespace-nowrap">
                          {heading}
                        </th>
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
          <SectionCard
            title="How to use this page"
            subtitle="Keep this as a management prototype, not a live reporting claim."
          >
            <div className="space-y-3 text-sm text-muted-foreground">
              <p><span className="font-medium text-foreground">Start broad</span> — Use the current snapshot first, then narrow the scope only if needed.</p>
              <p><span className="font-medium text-foreground">Look for patterns</span> — Group by reason, SKU, or location depending on the question you are answering.</p>
              <p><span className="font-medium text-foreground">Treat exports as prototype actions</span> — This build shapes the flow before real export endpoints exist.</p>
            </div>
          </SectionCard>

          <SectionCard
            title="Prototype boundaries"
            subtitle="Engine-honest reminders for this reporting surface."
          >
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
                        <th key={heading} className="text-left px-4 py-2.5 font-medium whitespace-nowrap">
                          {heading}
                        </th>
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
          <SectionCard
            title="How to use this page"
            subtitle="Keep this as a management prototype, not a live reporting claim."
          >
            <div className="space-y-3 text-sm text-muted-foreground">
              <p><span className="font-medium text-foreground">Start broad</span> — Use the current snapshot first, then narrow the scope only if needed.</p>
              <p><span className="font-medium text-foreground">Look for patterns</span> — Group by reason, SKU, or location depending on the question you are answering.</p>
              <p><span className="font-medium text-foreground">Treat exports as prototype actions</span> — This build shapes the flow before real export endpoints exist.</p>
            </div>
          </SectionCard>

          <SectionCard
            title="Prototype boundaries"
            subtitle="Engine-honest reminders for this reporting surface."
          >
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
                        <th key={heading} className="text-left px-4 py-2.5 font-medium whitespace-nowrap">
                          {heading}
                        </th>
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
          <SectionCard
            title="How to use this page"
            subtitle="Keep this as a management prototype, not a live reporting claim."
          >
            <div className="space-y-3 text-sm text-muted-foreground">
              <p><span className="font-medium text-foreground">Start broad</span> — Use the current snapshot first, then narrow the scope only if needed.</p>
              <p><span className="font-medium text-foreground">Look for patterns</span> — Group by reason, SKU, or location depending on the question you are answering.</p>
              <p><span className="font-medium text-foreground">Treat exports as prototype actions</span> — This build shapes the flow before real export endpoints exist.</p>
            </div>
          </SectionCard>

          <SectionCard
            title="Prototype boundaries"
            subtitle="Engine-honest reminders for this reporting surface."
          >
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

  return (
    <div className="p-5 lg:p-6 space-y-4">
      <div className="space-y-1">
        <h1 className="text-xl font-semibold text-foreground">Wastage</h1>
        <p className="text-sm text-muted-foreground">
          Keep operations primary, with calm guidance and prototype surfaces available when needed.
        </p>
      </div>

      <div className="border border-border rounded-2xl bg-card px-4 py-3 shadow-sm flex flex-col xl:flex-row xl:items-center gap-3">
        <div className="flex items-start gap-3 min-w-0">
          <div className="h-9 w-9 rounded-xl bg-amber-50 border border-amber-200 text-amber-700 flex items-center justify-center flex-shrink-0">
            {activeSurface === 'OPERATIONS' ? <ShieldCheck size={16} /> : activeSurface === 'REPORTING' ? <Download size={16} /> : <ScanLine size={16} />}
          </div>
          <div className="min-w-0">
            <p className="text-sm font-medium text-foreground">
              {activeSurface === 'OPERATIONS'
                ? 'Operational wastage workflow'
                : activeSurface === 'REASONS'
                  ? 'Reason guidance reference'
                  : activeSurface === 'BARCODES'
                    ? 'Scanner and barcode guidance'
                    : 'Reporting and export prototype'}
            </p>
            <p className="text-sm text-muted-foreground leading-relaxed">
              {activeSurface === 'OPERATIONS'
                ? 'Use this queue to record wastage, review status, and take the next action without extra clutter.'
                : activeSurface === 'REASONS'
                  ? 'This view brings back the deleted reason surface as a calmer guide for choosing and interpreting wastage reasons.'
                  : activeSurface === 'BARCODES'
                    ? 'This view brings back barcode support guidance in a calmer way, without letting it overwhelm daily capture work.'
                    : 'This prototype shapes manager-facing reporting and exports without pretending the backend is already report-complete.'}
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

      {activeSurface === 'OPERATIONS' && renderOperationsSurface()}
      {activeSurface === 'REASONS' && renderReasonsSurface()}
      {activeSurface === 'BARCODES' && renderBarcodeSurface()}
      {activeSurface === 'REPORTING' && renderReportingSurface()}
    </div>
  );
}
