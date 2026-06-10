import {
  AlertTriangle,
  BarChart3,
  BrainCircuit,
  CheckCircle2,
  ClipboardCheck,
  ClipboardList,
  DollarSign,
  Layers3,
  Link2,
  Lock,
  PackageOpen,
  PauseCircle,
  PlugZap,
  ShieldCheck,
  Users,
} from 'lucide-react';

const discoveryCards = [
  {
    title: 'Inventory-owned roadmap content',
    body: 'Existing Inventory Roadmap, Inventory Admin roadmap tab, movements/readability locks, seed/verification locks, stock operations, reporting, purchasing, receiving, and costing notes were consolidated here.',
  },
  {
    title: 'Inventory-adjacent roadmap content',
    body: 'Exports & Integrations, POS receipt/refund inventory effects, accounting sync hardening, supplier imports, and pricing intelligence are tracked here only where they affect inventory truth.',
  },
  {
    title: 'Non-inventory placeholders',
    body: 'Payroll & Rostering and Time Tracking remain their own placeholder module pages. They are listed only as related non-inventory placeholders, not as inventory implementation scope.',
  },
];

const roadmapGroups = [
  {
    title: 'Locked / Complete',
    description: 'Accepted inventory work and proof points that should not be reopened from this roadmap page.',
    tone: 'emerald',
    icon: CheckCircle2,
    items: [
      {
        title: 'Inventory Verification Pass v1',
        status: 'PASSED / LOCK READY',
        source: 'Verification thread lock',
        summary: [
          'Code-complete inventory workflows were reclassified into operational validation and passed the controlled verification program.',
          'Do not reopen during roadmap or documentation consolidation work.',
        ],
      },
      {
        title: 'LIVE Inventory Seed + Opening Balance Pass v1',
        status: 'PASSED / LOCK READY',
        source: 'LIVE seed proof',
        summary: [
          '10 real LIVE seed items created',
          'Item masters started at 0 stock',
          'Opening balances posted through Adjustment',
          'Central StockMovement ledger confirmed',
          'Dashboard and Advanced Reports reconciled to ₱24,270',
          'LIVE/TRAINING separation passed',
          'Over-deduction guard passed',
          'Setup gaps cleared to 0',
        ],
      },
      {
        title: 'Inventory UI cleanup locks',
        status: 'LOCKED UI BASELINE',
        source: 'Recent UI polish passes',
        summary: [
          'Inventory Sidebar Operations Sorting v1 accepted',
          'Inventory Page Action Cleanup v1 accepted',
          'Movements Page Readability Polish v1.2 accepted',
          'Inventory Roadmap Page v1 created as Admin-only read-only documentation',
        ],
      },
      {
        title: 'Existing module baselines',
        status: 'LOCKED CURRENT FORM',
        source: 'Prior inventory module locks',
        summary: [
          'Gap Scan current baseline locked',
          'Suppliers current baseline locked',
          'Reorder Review current baseline locked',
          'Dashboard inventory value proof retained',
        ],
      },
    ],
  },
  {
    title: 'Active / Next',
    description: 'Near-term inventory review queue after the locked LIVE seed and Movements readability passes.',
    tone: 'sky',
    icon: ClipboardList,
    items: [
      {
        title: 'Inventory Roadmap Discovery + Consolidation v1',
        status: 'THIS PASS',
        source: 'Project-wide roadmap scan',
        summary: [
          'Consolidate inventory-related roadmap items from existing module pages into this Admin-only roadmap.',
          'Classify Payroll & Rostering and Time Tracking as non-inventory placeholder modules instead of merging them into inventory scope.',
        ],
      },
      {
        title: 'Module-by-module polish review queue',
        status: 'NEXT REVIEW QUEUE',
        source: 'Sidebar and module cleanup sequence',
        summary: [
          'Inventory Admin / Unit Pricing review',
          'Advanced Reports polish review',
          'Exports & Integrations classification review',
          'Adjustments, Wastage, Transfers, and Stocktake polish review',
          'Receiving / Delivery Portal workflow review',
          'Orders workflow continuation',
        ],
      },
    ],
  },
  {
    title: 'Core Stock Operations',
    description: 'Inventory-owned operational pages and stock-control workflows.',
    tone: 'teal',
    icon: PackageOpen,
    items: [
      {
        title: 'Stock operation modules',
        status: 'FOUNDATIONAL INVENTORY SCOPE',
        source: 'Operations sidebar and stock workflow pages',
        summary: [
          'Inventory item master remains the current stock truth surface',
          'Movements ledger remains the read-only audit trail',
          'Adjustments, Transfers, Stocktake, and Wastage stay as dedicated stock-changing modules',
          'Bulk Stock Update and Stock History remain inventory-list/admin utilities',
        ],
        dependencies: [
          'StockMovement ledger integrity',
          'Role-gated stock-changing actions',
          'Over-deduction protection',
          'LIVE/TRAINING separation',
        ],
      },
      {
        title: 'Wastage operational hardening',
        status: 'ACTIVE / REVIEW LATER',
        source: 'Wastage page future notes and workspace metadata',
        summary: [
          'Approved wastage movements should continue to feed reporting and audit views cleanly.',
          'Future action history and acknowledgement write endpoints remain planned until public write contracts exist.',
          'Grouped views can shape future reporting but must not pretend export/compliance output is finished before validation.',
        ],
      },
    ],
  },
  {
    title: 'Purchasing & Receiving',
    description: 'Replenishment workflow from reorder review through purchase orders and receiving evidence.',
    tone: 'indigo',
    icon: ClipboardCheck,
    items: [
      {
        title: 'Reorder Review + Orders + Receiving workflow',
        status: 'ACTIVE PRODUCT LINE',
        source: 'Purchasing sidebar and current module baselines',
        summary: [
          'Reorder Review remains the recommendation and draft-order start point.',
          'Orders continue as the purchase order workflow surface, including manual order and amendment flows.',
          'Receiving and Delivery Portal remain the stock-in and supplier/delivery support surfaces.',
        ],
        plannedFeatures: [
          'Partial receiving review',
          'Receiving evidence and delivery notes',
          'Supplier-linked purchase order outcomes',
          'Backorders automation — deferred',
          'Invoice 3-way matching — deferred',
        ],
      },
    ],
  },
  {
    title: 'Supplier Intelligence',
    description: 'Supplier-side data that should improve purchasing decisions after enough real order and receiving history exists.',
    tone: 'amber',
    icon: Users,
    items: [
      {
        title: 'Supplier lead-time and reliability tracking',
        status: 'DEFERRED / DEPENDS ON HISTORY',
        source: 'Reorder threshold discussion, Inventory Admin readiness, supplier roadmap notes',
        summary: [
          'Supplier lead time should become a first-class input for reorder point calculations.',
          'Supplier delivery reliability and receipt accuracy should be measured after Orders and Receiving are trusted.',
          'Supplier scorecards should come after basic operations have real movement, order, and receiving history.',
        ],
        plannedFeatures: [
          'Supplier lead-time field',
          'Purchase price history',
          'Delivery reliability metrics',
          'Receipt variance monitoring',
          'Supplier scorecards — deferred',
          'Supplier reorder suggestions — deferred',
        ],
      },
    ],
  },
  {
    title: 'Costing & Pricing Intelligence',
    description: 'Cost valuation and future pricing suggestions, separated from today’s manual unit pricing.',
    tone: 'violet',
    icon: DollarSign,
    items: [
      {
        title: 'Cost Intelligence + Unit Valuation Suggestions v1',
        status: 'DEFERRED / FUTURE INTELLIGENCE',
        source: 'Inventory Admin Unit Pricing review',
        reason: 'Current unit pricing is manual and is used for inventory valuation. This is acceptable during initial LIVE setup, but later the system should help suggest valuation costs using supplier purchase history, landed cost, average cost, and supplier price-change history.',
        summary: [
          'Unit Price on Inventory Admin should represent internal cost / landed valuation, not necessarily customer-facing selling price.',
          'Suggestions must be advisory only and require Admin approval before any cost value changes.',
        ],
        plannedFeatures: [
          'Last supplier purchase price',
          'Average landed cost',
          'Bulk-buy price changes',
          'Supplier cost-change warnings',
          'Suggested valuation cost',
          'Confidence labels: Low / Medium / High',
          'Manual override remains available',
          'No automatic cost changes',
        ],
        dependencies: [
          'Receiving price history',
          'Supplier records',
          'Inventory Admin audit log',
          'Advanced Reports valuation rules',
        ],
      },
      {
        title: 'Sales Pricing Recommendation Engine v1',
        status: 'INVENTORY-ADJACENT / LATER',
        source: 'Pricing strategy discussion',
        summary: [
          'Customer-facing selling price suggestions belong closer to POS, product catalogue, retail/service pricing, and margin reporting.',
          'Inventory can provide cost, movement, waste, and availability signals, but should not become the retail pricing command center by itself.',
        ],
        plannedFeatures: [
          'Target margin input',
          'Demand / sell-through signals',
          'Slow-moving or overstock alerts',
          'Competitor price signal support — later',
          'Promotion suggestions — later',
          'Manual approval required',
          'No automatic selling price changes',
        ],
      },
    ],
  },
  {
    title: 'Reporting / Audit / Compliance',
    description: 'Read-only reports, ledger proof, valuation history, and audit exports consolidated from Inventory Admin roadmap notes.',
    tone: 'slate',
    icon: BarChart3,
    items: [
      {
        title: 'Inventory Admin reporting roadmap',
        status: 'CONSOLIDATED FROM INVENTORY ADMIN',
        source: 'InventoryAdmin Roadmap tab',
        summary: [
          'Inventory Admin remains the high-trust oversight hub for audit visibility, adjustment reporting, supplier scorecards, and inventory-level admin controls.',
          'Local roadmap/readiness notes are now represented here so the dedicated Inventory Roadmap is the canonical planning surface.',
        ],
        plannedFeatures: [
          'Stock value summary',
          'Movement audit trail',
          'Adjustment and wastage reporting',
          'Supplier reporting after Orders + Receiving are complete',
          'Role-gated admin history',
        ],
        dependencies: [
          'Inventory movement ledger coverage',
          'Wastage flow completion',
          'Return / refund inventory effects',
          'Export layer readiness',
        ],
      },
      {
        title: 'Ledger audit export + valuation history',
        status: 'DEFERRED / REPORTING HARDENING',
        source: 'Advanced Reports and ledger audit requirements',
        summary: [
          'Advanced Reports and Dashboard values must continue to reconcile before any expanded export/reporting layer is treated as complete.',
          'Movement exception review and stock valuation history should remain read-only and audit-safe.',
        ],
        plannedFeatures: [
          'Movement audit export',
          'Stock valuation history',
          'Exception review workflow',
          'LIVE-only reporting guardrails',
          'Report reconciliation proof',
        ],
      },
    ],
  },
  {
    title: 'Exports & Integrations',
    description: 'Inventory-adjacent exchange surfaces discovered in the Exports & Integrations roadmap page.',
    tone: 'indigo',
    icon: PlugZap,
    items: [
      {
        title: 'Controlled inventory exports',
        status: 'VERIFY BEFORE LOCK',
        source: 'Exports & Integrations page release roadmap',
        summary: [
          'Inventory CSV, order history, and adjustment/wastage export surfaces were discovered in the project roadmap content.',
          'Treat export availability as requiring separate runtime verification before marking operationally locked.',
        ],
        dependencies: [
          'Stable inventory source data',
          'Orders workflow completion',
          'Receiving outcomes and ledger integrity',
          'Role-gated report/export access',
        ],
      },
      {
        title: 'Accounting sync + API/webhook hardening',
        status: 'DEFERRED / INTEGRATION HARDENING',
        source: 'Exports & Integrations connector roadmap',
        summary: [
          'Accounting connector and webhook surfaces should be governed as separate integration infrastructure work, not assumed complete from placeholder UI alone.',
          'External sync must be driven by reliable inventory events and must not roll back internal stock movements if outbound sync fails.',
        ],
        plannedFeatures: [
          'OAuth/token handling',
          'Retry queue with backoff',
          'Integration failure boundaries',
          'Sync audit log',
          'Performance monitoring',
          'Data transformation and webhook governance',
        ],
      },
    ],
  },
  {
    title: 'Forecasting / AI — Later',
    description: 'Forecasting and AI belong after manual inventory operations have enough trusted history.',
    tone: 'violet',
    icon: BrainCircuit,
    items: [
      {
        title: 'Threshold Intelligence + Reorder Recommendation Engine v1',
        status: 'DEFERRED / IMPORTANT FUTURE ENHANCEMENT',
        source: 'LIVE seed pass follow-up',
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
      {
        title: 'AI inventory suggestions posture',
        status: 'OBSERVE-ONLY / LATER',
        source: 'Inventory governance lock',
        summary: [
          'AI reorder suggestions, AI pricing suggestions, and AI supplier risk summaries remain later-stage convenience features only.',
          'AI must not hide incomplete inventory workflows, mutate stock, create purchase orders, or change costs/prices without explicit approval.',
        ],
        plannedFeatures: [
          'Demand forecasting',
          'Waste probability signals',
          'Supplier variance prediction',
          'AI reorder suggestions — later',
          'AI pricing suggestions — later',
          'AI supplier risk summaries — later',
        ],
      },
    ],
  },
  {
    title: 'Inventory Dependencies',
    description: 'Other module work that can affect inventory, but should not be treated as inventory implementation by default.',
    tone: 'amber',
    icon: Link2,
    items: [
      {
        title: 'POS receipt/refund inventory effects',
        status: 'DEPENDENCY / LATER MODULE',
        source: 'POS future receipt lookup note and Inventory Admin readiness row',
        summary: [
          'Receipt lookup, returns, refunds, and POS deductions may affect inventory later, but should be validated in their own POS/returns scope first.',
          'Inventory reports should only reflect return/refund effects after a trusted movement contract exists.',
        ],
      },
      {
        title: 'Payroll & Rostering / Time Tracking placeholders',
        status: 'RELATED BUT NON-INVENTORY',
        source: 'Payroll.jsx and TimeTracking.jsx',
        summary: [
          'Payroll & Rostering is a workforce planning placeholder module.',
          'Time Tracking is an attendance truth placeholder module.',
          'Neither module should be merged into Inventory Roadmap as active inventory work.',
        ],
      },
    ],
  },
  {
    title: 'Out of Scope / Not Now',
    description: 'Explicit boundaries that protect the locked LIVE inventory proof and keep the roadmap honest.',
    tone: 'rose',
    icon: PauseCircle,
    items: [
      {
        title: 'Do not change locked inventory behaviour during roadmap work',
        status: 'LOCKED OUT OF SCOPE',
        source: 'Roadmap implementation guardrail',
        summary: [
          'Do not change Inventory item creation',
          'Do not change Adjustments, Wastage, Transfers, Receiving, or Reorder Review logic',
          'Do not change StockMovement ledger logic',
          'Do not change Dashboard or Advanced Reports calculations',
          'Do not change Bulk Stock Update',
          'Do not change LIVE seeded inventory data',
        ],
      },
      {
        title: 'No automatic intelligence actions yet',
        status: 'NOT NOW',
        source: 'Forecasting, pricing, and supplier roadmap discussions',
        summary: [
          'Do not automate purchasing',
          'Do not auto-change unit costs',
          'Do not auto-change customer selling prices',
          'Do not add supplier scorecards yet',
          'Do not add AI before inventory operations are stable with real history',
          'Do not treat Payroll or Time Tracking placeholders as inventory scope',
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
  teal: {
    icon: 'bg-teal-50 text-teal-700 border-teal-200',
    badge: 'bg-teal-50 text-teal-700 border-teal-200',
  },
  indigo: {
    icon: 'bg-indigo-50 text-indigo-700 border-indigo-200',
    badge: 'bg-indigo-50 text-indigo-700 border-indigo-200',
  },
  amber: {
    icon: 'bg-amber-50 text-amber-700 border-amber-200',
    badge: 'bg-amber-50 text-amber-700 border-amber-200',
  },
  violet: {
    icon: 'bg-violet-50 text-violet-700 border-violet-200',
    badge: 'bg-violet-50 text-violet-700 border-violet-200',
  },
  slate: {
    icon: 'bg-slate-100 text-slate-700 border-slate-200',
    badge: 'bg-slate-100 text-slate-700 border-slate-200',
  },
  rose: {
    icon: 'bg-rose-50 text-rose-700 border-rose-200',
    badge: 'bg-rose-50 text-rose-700 border-rose-200',
  },
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
        {items.map((item, index) => (
          <li key={`${title}-${index}-${item}`} className="rounded-xl border border-border bg-background px-3 py-2 text-sm text-muted-foreground leading-relaxed">
            {item}
          </li>
        ))}
      </ul>
    </div>
  );
}

function FormulaList({ formulas }) {
  if (!formulas?.length) return null;
  return (
    <div className="space-y-2">
      <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">Core formulas</p>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
        {formulas.map((formula) => (
          <div key={formula.label} className="rounded-xl border border-border bg-background px-3 py-3">
            <p className="text-sm font-semibold text-foreground">{formula.label}</p>
            <p className="mt-1 font-mono text-xs text-muted-foreground">{formula.value}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

function RoadmapCard({ item, tone }) {
  return (
    <article className="rounded-2xl border border-border bg-card p-4 space-y-4 shadow-sm">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0 space-y-2">
          <h3 className="text-base font-semibold text-foreground">{item.title}</h3>
          {item.source && (
            <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">Source: {item.source}</p>
          )}
          {item.reason && (
            <p className="text-sm leading-relaxed text-muted-foreground">{item.reason}</p>
          )}
        </div>
        <StatusBadge tone={tone}>{item.status}</StatusBadge>
      </div>

      <DetailList title="Summary" items={item.summary} />
      <FormulaList formulas={item.formulas} />
      <DetailList title="Planned features" items={item.plannedFeatures} />
      <DetailList title="Dependencies" items={item.dependencies} />
      <DetailList title="Priority" items={item.priority} />
    </article>
  );
}

function RoadmapGroup({ group }) {
  const Icon = group.icon || ClipboardList;
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
    <div className="p-5 lg:p-6 max-w-[1440px] space-y-5">
      <header className="rounded-3xl border border-border bg-card p-5 shadow-sm">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div className="space-y-2 max-w-4xl">
            <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.22em] text-muted-foreground">
              <Lock className="h-4 w-4" strokeWidth={1.9} />
              Admin-only read-only planning page
            </div>
            <h1 className="text-2xl font-semibold text-foreground">Inventory Roadmap</h1>
            <p className="text-sm leading-relaxed text-muted-foreground">
              Consolidated product-planning reference for inventory-owned work, inventory-adjacent dependencies, deferred intelligence, and out-of-scope boundaries discovered across the project. This page does not write inventory records, movement records, dashboard values, reports, reorder settings, or seeded LIVE data.
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
              Inventory Verification Pass v1, LIVE Inventory Seed + Opening Balance Pass v1, and the accepted Movements readability baseline are documented here as accepted proof only. This consolidation pass must not alter stock, ledger, Dashboard, Advanced Reports, Reorder Review, or seeded LIVE data.
            </p>
          </div>
        </div>
      </div>

      <section className="rounded-3xl border border-border bg-card p-4 shadow-sm">
        <div className="flex items-start gap-3 mb-4">
          <div className="flex h-10 w-10 items-center justify-center rounded-2xl border border-sky-200 bg-sky-50 text-sky-700">
            <Layers3 className="h-5 w-5" strokeWidth={1.9} />
          </div>
          <div>
            <h2 className="text-lg font-semibold text-foreground">Discovery classification</h2>
            <p className="text-sm text-muted-foreground mt-1">Roadmap and placeholder content found across the project was classified before being consolidated.</p>
          </div>
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-3">
          {discoveryCards.map((card) => (
            <div key={card.title} className="rounded-2xl border border-border bg-muted/20 px-4 py-3.5">
              <p className="text-sm font-semibold text-foreground">{card.title}</p>
              <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">{card.body}</p>
            </div>
          ))}
        </div>
      </section>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
        {roadmapGroups.map((group) => (
          <RoadmapGroup key={group.title} group={group} />
        ))}
      </div>
    </div>
  );
}
