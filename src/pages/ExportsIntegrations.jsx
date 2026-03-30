import {
  ArrowUpFromLine,
  CircleAlert,
  FileSpreadsheet,
  FileUp,
  Link2,
  ListChecks,
  PackageOpen,
  PlugZap,
  ReceiptText,
  ShieldEllipsis,
  Webhook,
} from 'lucide-react';

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
        body: 'Future export for draft, submitted, and received purchase order history once the orders flow is complete.',
        tag: 'Depends on Orders',
      },
      {
        icon: ArrowUpFromLine,
        title: 'Adjustment and wastage export',
        body: 'Later-stage outbound reporting for approved inventory changes, not placeholder rows pretending this already exists.',
        tag: 'Later',
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
        body: 'Later integration surface for stock valuation, purchasing, and accounting sync after connector design is chosen.',
        tag: 'Not started',
      },
      {
        icon: Webhook,
        title: 'API / webhook sync',
        body: 'Reserved for future machine-to-machine exchange once core inventory contracts and payload design are settled.',
        tag: 'Design later',
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
  },
  {
    icon: ListChecks,
    title: 'Phase 2',
    body: 'Introduce controlled CSV export only after the relevant inventory and order outputs have stable source data.',
  },
  {
    icon: Link2,
    title: 'Phase 3',
    body: 'Layer in imports, accounting links, and external sync once templates, payload contracts, and connector rules are ready.',
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

export default function ExportsIntegrations() {
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
            <div className="px-4 py-3 border-b border-border bg-muted/25">
              <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-muted-foreground mb-1">Planned capabilities</p>
              <h2 className="text-sm font-semibold text-foreground">{section.title}</h2>
              <p className="text-sm text-muted-foreground mt-1">{section.description}</p>
            </div>
            <div className="p-4 space-y-3">
              {section.items.map((item) => (
                <CapabilityCard key={item.title} {...item} />
              ))}
            </div>
          </section>
        ))}
      </div>

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
            <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-muted-foreground mb-1">Release path</p>
            <h2 className="text-sm font-semibold text-foreground">How this module should grow</h2>
          </div>
          <div className="p-4 space-y-3">
            {releasePlan.map(({ icon: Icon, title, body }) => (
              <div key={title} className="rounded-2xl border border-border bg-background px-4 py-3.5">
                <div className="flex items-center gap-2 mb-1.5">
                  <Icon className="h-4 w-4 text-muted-foreground" strokeWidth={1.8} />
                  <p className="text-sm font-semibold text-foreground">{title}</p>
                </div>
                <p className="text-sm leading-relaxed text-muted-foreground">{body}</p>
              </div>
            ))}

            <div className="rounded-2xl border border-dashed border-border bg-muted/20 px-4 py-3.5">
              <div className="flex items-start gap-2.5">
                <ShieldEllipsis className="h-4 w-4 text-muted-foreground mt-0.5" strokeWidth={1.8} />
                <div>
                  <p className="text-sm font-semibold text-foreground">Connector rule</p>
                  <p className="text-sm leading-relaxed text-muted-foreground mt-1">
                    Do not imply live connector infrastructure, payload guarantees, or accounting sync until a dedicated post-core implementation stage exists.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
