import {
  AlertTriangle,
  BrainCircuit,
  CheckCircle2,
  ClipboardList,
  Lock,
  PauseCircle,
  ShieldCheck,
} from 'lucide-react';

const roadmapGroups = [
  {
    title: 'Locked / Complete',
    description: 'Accepted inventory milestones that must not be reopened by this page.',
    tone: 'emerald',
    items: [
      {
        title: 'Inventory Verification Pass v1',
        status: 'PASSED / LOCK READY',
        summary: [
          'Operational validation pass completed and locked.',
          'Do not reopen during roadmap documentation work.',
        ],
      },
      {
        title: 'LIVE Inventory Seed + Opening Balance Pass v1',
        status: 'PASSED / LOCK READY',
        summary: [
          '10 real LIVE seed items created',
          'Item masters started at 0 stock',
          'Opening balances posted through Adjustment',
          'Central movements ledger confirmed',
          'Dashboard and Advanced Reports reconciled to ₱24,270',
          'LIVE/TRAINING separation passed',
          'Over-deduction guard passed',
          'Setup gaps cleared',
        ],
      },
    ],
  },
  {
    title: 'Active / Next',
    description: 'Near-term work after the locked LIVE seed pass, without touching stock data.',
    tone: 'sky',
    items: [
      {
        title: 'Basic operations with real movement history',
        status: 'NEXT FOUNDATION',
        summary: [
          'Let normal receiving, usage, adjustment, and wastage flows create trusted movement history.',
          'Keep manual overrides available while the system learns enough usage patterns to recommend thresholds later.',
        ],
      },
    ],
  },
  {
    title: 'Deferred / Future Intelligence',
    description: 'Important planning items that are documented now but intentionally not implemented in this pass.',
    tone: 'violet',
    items: [
      {
        title: 'Threshold Intelligence + Reorder Recommendation Engine v1',
        status: 'Deferred / Important Future Enhancement',
        reason: 'During LIVE Inventory Seed + Opening Balance Pass v1, reorder point and reorder quantity were entered manually. This is acceptable during initial setup, but future users should not be expected to know exact reorder thresholds from day one.',
        summary: [
          'The system should eventually help users calculate reorder points and reorder quantities from real movement history, supplier lead time, safety stock, and target stock coverage.',
        ],
        formulas: [
          {
            label: 'Reorder Point',
            value: 'average daily usage × supplier lead time days + safety stock',
          },
          {
            label: 'Suggested Reorder Quantity',
            value: 'target stock coverage - current stock',
          },
        ],
        plannedFeatures: [
          'Manual threshold helper text',
          'Supplier lead time field',
          'Safety stock field',
          'Target coverage days field',
          'Suggested threshold mode',
          '30-day and 60-day movement usage windows',
          'Confidence labels: Low / Medium / High',
          'Reorder Review integration',
          'Manual override remains available',
          'No automatic purchasing without user approval',
        ],
        dependencies: [
          'LIVE movement history',
          'StockMovement ledger',
          'Supplier lead-time records',
          'Reorder Review engine',
        ],
        priority: [
          'After LIVE seed pass',
          'After basic operations have real movement history',
          'Before supplier scorecards',
          'Before AI reorder suggestions',
        ],
      },
    ],
  },
  {
    title: 'Out of Scope / Not Now',
    description: 'Explicit protections for this implementation pass.',
    tone: 'slate',
    items: [
      {
        title: 'No inventory behaviour changes in Roadmap Page v1',
        status: 'LOCKED OUT OF SCOPE',
        summary: [
          'Do not implement threshold intelligence yet',
          'Do not change Inventory item creation',
          'Do not change Adjustments',
          'Do not change StockMovement ledger',
          'Do not change Advanced Reports calculations',
          'Do not change Dashboard calculations',
          'Do not change Reorder Review',
          'Do not change Bulk Stock Update',
          'Do not add AI features',
          'Do not add supplier scorecards',
          'Do not change LIVE seeded inventory data',
        ],
      },
    ],
  },
];

const toneClasses = {
  emerald: {
    icon: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    badge: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  },
  sky: {
    icon: 'bg-sky-50 text-sky-700 border-sky-200',
    badge: 'bg-sky-50 text-sky-700 border-sky-200',
  },
  violet: {
    icon: 'bg-violet-50 text-violet-700 border-violet-200',
    badge: 'bg-violet-50 text-violet-700 border-violet-200',
  },
  slate: {
    icon: 'bg-slate-100 text-slate-700 border-slate-200',
    badge: 'bg-slate-100 text-slate-700 border-slate-200',
  },
};

const groupIcons = {
  'Locked / Complete': CheckCircle2,
  'Active / Next': ClipboardList,
  'Deferred / Future Intelligence': BrainCircuit,
  'Out of Scope / Not Now': PauseCircle,
};

function StatusBadge({ children, tone }) {
  return (
    <span className={`inline-flex rounded-full border px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wide ${toneClasses[tone].badge}`}>
      {children}
    </span>
  );
}

function DetailList({ title, items }) {
  if (!items?.length) return null;
  return (
    <div className="space-y-2">
      <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">{title}</p>
      <ul className="grid grid-cols-1 md:grid-cols-2 gap-2">
        {items.map((item) => (
          <li key={item} className="rounded-xl border border-border bg-background px-3 py-2 text-sm text-muted-foreground leading-relaxed">
            {item}
          </li>
        ))}
      </ul>
    </div>
  );
}

function RoadmapCard({ item, tone }) {
  return (
    <article className="rounded-2xl border border-border bg-card p-4 space-y-4 shadow-sm">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0">
          <h3 className="text-base font-semibold text-foreground">{item.title}</h3>
          {item.reason && (
            <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{item.reason}</p>
          )}
        </div>
        <StatusBadge tone={tone}>{item.status}</StatusBadge>
      </div>

      <DetailList title="Summary" items={item.summary} />

      {item.formulas?.length > 0 && (
        <div className="space-y-2">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">Core formulas</p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
            {item.formulas.map((formula) => (
              <div key={formula.label} className="rounded-xl border border-border bg-background px-3 py-3">
                <p className="text-sm font-semibold text-foreground">{formula.label}</p>
                <p className="mt-1 font-mono text-xs text-muted-foreground">{formula.value}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      <DetailList title="Planned features" items={item.plannedFeatures} />
      <DetailList title="Dependencies" items={item.dependencies} />
      <DetailList title="Priority" items={item.priority} />
    </article>
  );
}

function RoadmapGroup({ group }) {
  const Icon = groupIcons[group.title] || ClipboardList;
  return (
    <section className="rounded-3xl border border-border bg-muted/15 p-4 space-y-4">
      <div className="flex items-start gap-3">
        <div className={`flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-2xl border ${toneClasses[group.tone].icon}`}>
          <Icon className="h-5 w-5" strokeWidth={1.9} />
        </div>
        <div className="min-w-0">
          <h2 className="text-lg font-semibold text-foreground">{group.title}</h2>
          <p className="text-sm leading-relaxed text-muted-foreground mt-1">{group.description}</p>
        </div>
      </div>
      <div className="grid grid-cols-1 gap-3">
        {group.items.map((item) => (
          <RoadmapCard key={item.title} item={item} tone={group.tone} />
        ))}
      </div>
    </section>
  );
}

export default function InventoryRoadmap() {
  return (
    <div className="p-5 lg:p-6 max-w-[1280px] space-y-5">
      <header className="rounded-3xl border border-border bg-card p-5 shadow-sm">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div className="space-y-2 max-w-3xl">
            <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.22em] text-muted-foreground">
              <Lock className="h-4 w-4" strokeWidth={1.9} />
              Admin-only read-only planning page
            </div>
            <h1 className="text-2xl font-semibold text-foreground">Inventory Roadmap</h1>
            <p className="text-sm leading-relaxed text-muted-foreground">
              Product-planning reference for locked inventory milestones and future improvements. This page does not write inventory records, movement records, dashboard values, reports, reorder settings, or seeded LIVE data.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <span className="inline-flex items-center gap-2 rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1.5 text-xs font-semibold text-emerald-700">
              <ShieldCheck className="h-3.5 w-3.5" /> Read-only
            </span>
            <span className="inline-flex items-center gap-2 rounded-full border border-violet-200 bg-violet-50 px-3 py-1.5 text-xs font-semibold text-violet-700">
              <Lock className="h-3.5 w-3.5" /> Admin access
            </span>
          </div>
        </div>
      </header>

      <div className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3.5">
        <div className="flex items-start gap-3">
          <div className="mt-0.5 flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-xl border border-amber-200 bg-white/70">
            <AlertTriangle className="h-4 w-4 text-amber-700" strokeWidth={2} />
          </div>
          <div className="space-y-1">
            <p className="text-sm font-semibold text-amber-900">Locked inventory passes remain closed.</p>
            <p className="text-sm leading-relaxed text-amber-800/90">
              Inventory Verification Pass v1 and LIVE Inventory Seed + Opening Balance Pass v1 are documented here as accepted proof only. This implementation pass must not alter stock, ledger, Dashboard, Advanced Reports, Reorder Review, or seeded LIVE data.
            </p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
        {roadmapGroups.map((group) => (
          <RoadmapGroup key={group.title} group={group} />
        ))}
      </div>
    </div>
  );
}
