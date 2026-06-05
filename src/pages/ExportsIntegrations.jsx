import { useState } from 'react';
import {
  ArrowUpFromLine,
  CheckCircle2,
  CircleAlert,
  Clock3,
  Download,
  FileSpreadsheet,
  FileUp,
  Link2,
  ListChecks,
  Loader2,
  PackageOpen,
  PlugZap,
  ReceiptText,
  ShieldEllipsis,
  Webhook,
  Settings,
  TrendingUp,
} from 'lucide-react';
import { base44 } from '@/api/base44Client';
import SupplierImportModal from '@/components/SupplierImportModal';
import AccountingConnectorPanel from '@/components/AccountingConnectorPanel';
import SyncAuditViewer from '@/components/SyncAuditViewer';
import SyncPerformanceMonitor from '@/components/SyncPerformanceMonitor';

const summaryCards = [
  {
    eyebrow: 'Module role',
    title: 'Data exchange hub',
    body: 'Reserved for future exports, supplier imports, accounting connectors, and API-based exchange with external systems.',
  },
  {
    eyebrow: 'Build status',
    title: 'Roadmap placeholder',
    body: 'No live import, export, or sync actions run from this page yet. The UI is intentionally honest about that.',
  },
  {
    eyebrow: 'Release approach',
    title: 'Core flows first',
    body: 'Exports and integrations should only arrive after Orders, Receiving, ledger coverage, and reporting surfaces are stable enough to expose outside the app.',
  },
];

const sections = [
  {
    title: 'Planned exports',
    description: 'Outbound data surfaces once inventory and order events are stable and trusted.',
    items: [
      {
        icon: FileSpreadsheet,
        title: 'Inventory CSV export',
        body: 'Export stock lists, on-hand positions, cost fields, and threshold-related master data in a clean structured output.',
        tag: 'Planned',
      },
      {
        icon: ReceiptText,
        title: 'Order history export',
        body: 'Export for draft, submitted, and received purchase order history with supplier and status details.',
        tag: 'Live',
      },
      {
        icon: ArrowUpFromLine,
        title: 'Adjustment and wastage export',
        body: 'Outbound reporting for approved inventory wastage movements with dates, quantities, and posting details.',
        tag: 'Live',
      },
    ],
  },
  {
    title: 'Planned imports & connectors',
    description: 'Inbound catalogue loading and future third-party system links.',
    items: [
      {
        icon: FileUp,
        title: 'Supplier catalogue import',
        body: 'Bulk import support for pricing sheets and supplier item files once templates and field mapping rules are finalised.',
        tag: 'Planned',
      },
      {
        icon: PlugZap,
        title: 'Accounting connectors',
        body: 'Xero integration for inventory sync and stock valuation reporting.',
        tag: 'Live',
      },
      {
        icon: Webhook,
        title: 'API / webhook sync',
        body: 'Machine-to-machine endpoints for external systems to push inventory and order data.',
        tag: 'Live',
      },
    ],
  },
];

const dependencyRows = [
  {
    label: 'Orders workflow completion',
    status: 'Required first',
    detail: 'Order history export and purchasing-related integrations should not be exposed until the orders module is complete and trusted.',
  },
  {
    label: 'Receiving outcomes + inventory ledger',
    status: 'Required first',
    detail: 'External sync must be driven by reliable inventory events rather than partial or placeholder status data.',
  },
  {
    label: 'Template and mapping rules',
    status: 'In design',
    detail: 'Supplier imports need strict column mapping, validation rules, and clean failure handling before activation.',
  },
  {
    label: 'Connector architecture',
    status: 'Separate stage',
    detail: 'Accounting and API sync require their own infrastructure pass and should not be implied by a placeholder card today.',
  },
];

const releasePlan = [
{
  icon: PackageOpen,
  title: 'Phase 1',
  body: 'Keep this as a clean roadmap surface so users understand what exports and integrations will eventually live here.',
  status: 'Complete',
  milestones: ['Roadmap UI complete', 'Dependency tracking visible', 'Release plan clearly communicated'],
},
{
  icon: ListChecks,
  title: 'Phase 2',
  body: 'Introduce controlled CSV export only after the relevant inventory and order outputs have stable source data.',
  status: 'Complete',
  reason: 'All inventory, order, and wastage exports now live',
  milestones: ['Inventory CSV export ✓', 'Order history export ✓', 'Adjustment/wastage export ✓'],
},
{
  icon: Link2,
  title: 'Phase 3',
  body: 'Accounting integration and webhook endpoints for external system sync now active.',
  status: 'Complete',
  reason: 'Xero sync + webhook receiver endpoints live',
  milestones: ['Supplier catalogue import ✓', 'Accounting connectors ✓', 'API/webhook sync ✓'],
},
{
  icon: TrendingUp,
  title: 'Phase 4',
  body: 'Performance monitoring and real-time sync health dashboards for operational visibility.',
  status: 'Complete',
  reason: 'Sync metrics + performance tracking live',
  milestones: ['Sync performance entity ✓', 'Live monitoring dashboard ✓', 'Error analytics ✓'],
},
];

const dependencyTone = {
  'Required first': 'text-amber-700 bg-amber-50 border-amber-200',
  'In design': 'text-sky-700 bg-sky-50 border-sky-200',
  'Separate stage': 'text-violet-700 bg-violet-50 border-violet-200',
};

function SummaryCard({ eyebrow, title, body }) {
  return (
    <div className="rounded-2xl border border-border bg-card px-4 py-4">
      <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-muted-foreground mb-2">{eyebrow}</p>
      <h3 className="text-sm font-semibold text-foreground mb-1.5">{title}</h3>
      <p className="text-sm leading-relaxed text-muted-foreground">{body}</p>
    </div>
  );
}

function CapabilityCard({ icon: Icon, title, body, tag }) {
  return (
    <div className="rounded-2xl border border-border bg-card px-4 py-4">
      <div className="flex items-start justify-between gap-3 mb-3">
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-muted/70 border border-border">
            <Icon className="h-4 w-4 text-foreground" strokeWidth={1.9} />
          </div>
          <h3 className="text-sm font-semibold text-foreground">{title}</h3>
        </div>
        <span className="shrink-0 rounded-full border border-border bg-muted px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
          {tag}
        </span>
      </div>
      <p className="text-sm leading-relaxed text-muted-foreground">{body}</p>
    </div>
  );
}

function PhaseCard({ icon: Icon, title, body, status, reason, milestones }) {
  const statusConfig = {
    'In progress': { icon: Clock3, color: 'bg-sky-50 border-sky-200 text-sky-700' },
    'Blocked': { icon: CircleAlert, color: 'bg-amber-50 border-amber-200 text-amber-700' },
    'Not started': { icon: CircleAlert, color: 'bg-slate-50 border-slate-200 text-slate-700' },
    'Complete': { icon: CheckCircle2, color: 'bg-emerald-50 border-emerald-200 text-emerald-700' },
  };
  const config = statusConfig[status];
  const StatusIcon = config.icon;

  return (
    <div className="rounded-2xl border border-border bg-card overflow-hidden">
      <div className="px-4 py-3.5 border-b border-border bg-muted/25 flex items-start justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <Icon className="h-5 w-5 text-foreground" strokeWidth={1.9} />
          <h3 className="text-sm font-semibold text-foreground">{title}</h3>
        </div>
        <div className={`flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[10px] font-semibold ${config.color}`}>
          <StatusIcon className="h-3 w-3" strokeWidth={2} />
          <span>{status}</span>
        </div>
      </div>
      <div className="p-4 space-y-3">
        <p className="text-sm leading-relaxed text-muted-foreground">{body}</p>
        {reason && <p className="text-xs text-muted-foreground italic">⚠ {reason}</p>}
        {milestones && (
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-muted-foreground mb-2">Milestones</p>
            <ul className="space-y-1.5">
              {milestones.map(m => (
                <li key={m} className="text-xs text-muted-foreground flex items-start gap-2">
                  <span className="text-primary mt-1 flex-shrink-0">•</span>
                  <span>{m}</span>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </div>
  );
}

export default function ExportsIntegrations() {
  const [activePhase, setActivePhase] = useState(null);
  const [exporting, setExporting] = useState(false);
  const [importModalOpen, setImportModalOpen] = useState(false);
  const [showConnectorPanel, setShowConnectorPanel] = useState(false);

  const handleExport = async (functionName, fileName) => {
    setExporting(true);
    try {
      const response = await base44.functions.invoke(functionName, {});
      const blob = new Blob([response.data], { type: 'text/csv' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${fileName}-${new Date().toISOString().split('T')[0]}.csv`;
      a.click();
      window.URL.revokeObjectURL(url);
    } catch (err) {
      console.error('Export failed:', err);
    } finally {
      setExporting(false);
    }
  };

  return (
    <div className="p-5 lg:p-6 max-w-[1280px] space-y-4">
      <div className="space-y-1">
        <h1 className="text-xl font-semibold text-foreground">Exports &amp; Integrations</h1>
        <p className="text-sm text-muted-foreground">Reserved data exchange and connector workspace with a cleaner roadmap-hub presentation for this prototype.</p>
      </div>

      <div className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3.5">
        <div className="flex items-start gap-3">
          <div className="mt-0.5 flex h-9 w-9 items-center justify-center rounded-xl border border-amber-200 bg-white/70">
            <CircleAlert className="h-4 w-4 text-amber-700" strokeWidth={2} />
          </div>
          <div className="space-y-1">
            <p className="text-sm font-semibold text-amber-900">This page is now positioned as an honest connector roadmap hub.</p>
            <p className="text-sm leading-relaxed text-amber-800/90">
              It no longer pretends imports, exports, or third-party sync are already working. This workspace should mature only after core inventory and order workflows are complete enough to expose safely outside the app.
            </p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-3">
        {summaryCards.map((card) => (
          <SummaryCard key={card.title} {...card} />
        ))}
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
        {sections.map((section) => (
          <section key={section.title} className="rounded-2xl border border-border bg-card overflow-hidden">
            <div className="px-4 py-3 border-b border-border bg-muted/25 flex items-start justify-between gap-3">
              <div>
                <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-muted-foreground mb-1">Planned capabilities</p>
                <h2 className="text-sm font-semibold text-foreground">{section.title}</h2>
                <p className="text-sm text-muted-foreground mt-1">{section.description}</p>
              </div>
              <div className="flex gap-2 flex-shrink-0 flex-wrap justify-end">
                {section.title === 'Planned exports' && (
                  <>
                    <button
                      onClick={() => handleExport('exportInventoryCSV', 'inventory')}
                      disabled={exporting}
                      className="inline-flex items-center gap-1.5 h-9 px-3 text-sm rounded-xl bg-primary text-primary-foreground hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed font-medium"
                    >
                      {exporting ? (
                        <>
                          <Loader2 size={14} className="animate-spin" /> Exporting…
                        </>
                      ) : (
                        <>
                          <Download size={14} /> Inventory
                        </>
                      )}
                    </button>
                    <button
                      onClick={() => handleExport('exportOrdersCSV', 'orders')}
                      disabled={exporting}
                      className="inline-flex items-center gap-1.5 h-9 px-3 text-sm rounded-xl bg-primary/70 text-primary-foreground hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed font-medium"
                    >
                      {exporting ? (
                        <>
                          <Loader2 size={14} className="animate-spin" /> Exporting…
                        </>
                      ) : (
                        <>
                          <Download size={14} /> Orders
                        </>
                      )}
                    </button>
                    <button
                      onClick={() => handleExport('exportWastageCSV', 'wastage')}
                      disabled={exporting}
                      className="inline-flex items-center gap-1.5 h-9 px-3 text-sm rounded-xl bg-primary/70 text-primary-foreground hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed font-medium"
                    >
                      {exporting ? (
                        <>
                          <Loader2 size={14} className="animate-spin" /> Exporting…
                        </>
                      ) : (
                        <>
                          <Download size={14} /> Wastage
                        </>
                      )}
                    </button>
                  </>
                )}
                {section.title === 'Planned imports & connectors' && (
                  <button
                    onClick={() => setImportModalOpen(true)}
                    className="inline-flex items-center gap-1.5 h-9 px-3 text-sm rounded-xl bg-primary text-primary-foreground hover:opacity-90 transition-opacity font-medium"
                  >
                    <FileUp size={14} /> Import
                  </button>
                )}
              </div>
            </div>
            <div className="p-4 space-y-3">
              {section.items.map((item) => (
                <CapabilityCard key={item.title} {...item} />
              ))}
            </div>
          </section>
        ))}
      </div>

      {/* Active Connectors & Webhooks */}
      {showConnectorPanel && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-foreground flex items-center gap-2">
              <Settings className="h-5 w-5" /> Connector Configuration
            </h2>
            <button
              onClick={() => setShowConnectorPanel(false)}
              className="text-xs px-2 py-1 rounded border border-border hover:bg-muted"
            >
              Hide
            </button>
          </div>
          <AccountingConnectorPanel />
        </div>
      )}

      {!showConnectorPanel && (
        <button
          onClick={() => setShowConnectorPanel(true)}
          className="flex items-center gap-2 h-10 px-4 text-sm rounded-xl bg-primary/10 text-primary hover:bg-primary/15 transition-colors border border-primary/20 font-medium"
        >
          <Settings size={16} /> Configure Connectors & Webhooks
        </button>
      )}

      {/* Sync Performance Monitor */}
      <section className="rounded-2xl border border-border bg-card overflow-hidden p-4">
        <SyncPerformanceMonitor />
      </section>

      {/* Sync Audit Log */}
      <section className="rounded-2xl border border-border bg-card overflow-hidden p-4">
        <SyncAuditViewer />
      </section>

      <div className="grid grid-cols-1 xl:grid-cols-[1.08fr_0.92fr] gap-4">
        <section className="rounded-2xl border border-border bg-card overflow-hidden">
          <div className="px-4 py-3 border-b border-border bg-muted/25">
            <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-muted-foreground mb-1">Dependencies</p>
            <h2 className="text-sm font-semibold text-foreground">What has to be true before activation</h2>
          </div>
          <div className="divide-y divide-border">
            {dependencyRows.map((row) => (
              <div key={row.label} className="px-4 py-3.5 flex flex-col gap-2 md:flex-row md:items-start md:justify-between md:gap-4">
                <div className="min-w-0">
                  <p className="text-sm font-medium text-foreground">{row.label}</p>
                  <p className="text-sm text-muted-foreground leading-relaxed mt-1">{row.detail}</p>
                </div>
                <span className={`shrink-0 inline-flex items-center rounded-full border px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wide ${dependencyTone[row.status]}`}>
                  {row.status}
                </span>
              </div>
            ))}
          </div>
        </section>

        <section className="rounded-2xl border border-border bg-card overflow-hidden">
         <div className="px-4 py-3 border-b border-border bg-muted/25">
           <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-muted-foreground mb-1">Release roadmap</p>
           <h2 className="text-sm font-semibold text-foreground">Phased implementation plan</h2>
         </div>
         <div className="p-4 space-y-3">
           {releasePlan.map(({ icon: Icon, title, body, status, reason, milestones }) => (
             <div key={title} className="rounded-2xl border border-border bg-background px-4 py-3.5">
               <div className="flex items-start justify-between gap-2 mb-2">
                 <div className="flex items-center gap-2">
                   <Icon className="h-4 w-4 text-muted-foreground" strokeWidth={1.8} />
                   <p className="text-sm font-semibold text-foreground">{title}</p>
                 </div>
                 <span className={`text-[10px] px-2 py-0.5 rounded-full font-semibold whitespace-nowrap ${
                   status === 'In progress' ? 'bg-sky-100 text-sky-700' :
                   status === 'Blocked' ? 'bg-amber-100 text-amber-700' :
                   'bg-slate-100 text-slate-700'
                 }`}>
                   {status}
                 </span>
               </div>
               <p className="text-sm leading-relaxed text-muted-foreground">{body}</p>
             </div>
           ))}

           <div className="rounded-2xl border border-dashed border-border bg-muted/20 px-4 py-3.5">
             <div className="flex items-start gap-2.5">
               <ShieldEllipsis className="h-4 w-4 text-muted-foreground mt-0.5" strokeWidth={1.8} />
               <div>
                 <p className="text-sm font-semibold text-foreground">Governance principle</p>
                 <p className="text-sm leading-relaxed text-muted-foreground mt-1">
                   Each phase waits for its blocking dependencies to be stable. No exports without clean source data. No connectors until contracts and templates are finalized.
                 </p>
               </div>
             </div>
           </div>
         </div>
        </section>
        </div>

        <SupplierImportModal isOpen={importModalOpen} onClose={() => setImportModalOpen(false)} onSuccess={() => {}} />
        </div>
        );
        }