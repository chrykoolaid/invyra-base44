import {
  CalendarRange,
  CircleAlert,
  ClipboardCheck,
  ClipboardList,
  FileOutput,
  Layers3,
  ShieldCheck,
  UserRoundCheck,
  Users,
  WandSparkles,
} from 'lucide-react';

const summaryCards = [
  {
    eyebrow: 'Module role',
    title: 'Workforce planning hub',
    body: 'Payroll & Rostering is intended to plan shifts, assign staff, review attendance outcomes, and prepare payroll-ready workforce data without becoming payroll software itself.',
  },
  {
    eyebrow: 'Build status',
    title: 'Module placeholder only',
    body: 'This workforce module remains a placeholder in this inventory build. It is not part of Inventory Roadmap scope and does not imply active payroll or rostering execution today.',
  },
  {
    eyebrow: 'Product boundary',
    title: 'Supports payroll operations only',
    body: 'Invyra should support roster planning, attendance comparison, approvals, and export-ready records while external payroll or accounting systems handle wages, taxes, and compliance execution.',
  },
];

const capabilitySections = [
  {
    title: 'Roster planning foundation',
    description: 'The manager-facing planning side of the module.',
    items: [
      {
        icon: CalendarRange,
        title: 'Roster calendar',
        body: 'Weekly and daily scheduling surface for creating, reviewing, and adjusting shifts across one or more branches or locations.',
        tag: 'Must-have',
      },
      {
        icon: Users,
        title: 'Shift assignment',
        body: 'Assign staff by role, location, timing, and availability so managers can build realistic rosters without implying fully automatic scheduling.',
        tag: 'Must-have',
      },
      {
        icon: WandSparkles,
        title: 'Rule-assisted setup',
        body: 'Guided shift setup, templates, and advisory warnings for conflicts or soft compliance issues while keeping the manager in control.',
        tag: 'Later in MVP',
      },
    ],
  },
  {
    title: 'Attendance link and review',
    description: 'How planned labour should connect to actual labour outcomes.',
    items: [
      {
        icon: UserRoundCheck,
        title: 'Planned vs actual variance',
        body: 'Compare rostered shifts against worked attendance to surface lateness, missed shifts, overruns, early finishes, and staffing mismatches.',
        tag: 'Core value',
      },
      {
        icon: ClipboardCheck,
        title: 'Manager approvals',
        body: 'Review and approve attendance-linked records before they become part of payroll-ready export output.',
        tag: 'Must-have',
      },
      {
        icon: FileOutput,
        title: 'Payroll-ready exports',
        body: 'Prepare approved hours, role-linked shift records, and branch or cost-centre tagging for CSV or JSON handoff to external payroll systems.',
        tag: 'Export stage',
      },
    ],
  },
];

const boundaryRows = [
  {
    label: 'This module does include',
    status: 'Planned scope',
    detail: 'Roster planning, staff assignment, attendance comparison, approvals, and export-ready workforce data.',
  },
  {
    label: 'This module does not include',
    status: 'Hard boundary',
    detail: 'Direct wage payments, tax filing, full compliance automation, or payroll execution inside Invyra Core.',
  },
  {
    label: 'Attendance truth source',
    status: 'Depends on Time Tracking',
    detail: 'Actual worked-time capture, missed punches, and corrections should come from the Time Tracking module, not be duplicated here.',
  },
  {
    label: 'Export destination',
    status: 'External systems',
    detail: 'Approved payroll-ready records are meant to hand off into outside payroll or accounting tools rather than finishing the payroll run inside Invyra.',
  },
];

const roadmapBlocks = [
  {
    title: 'Phase 1 — Rostering foundation',
    body: 'Build the calendar-based roster workspace with create, edit, delete, and assignment flows by role, location, and shift timing.',
  },
  {
    title: 'Phase 2 — Attendance comparison',
    body: 'Link planned shifts to actual attendance outcomes so managers can review lateness, missed shifts, overruns, and other variance conditions.',
  },
  {
    title: 'Phase 3 — Review and approval',
    body: 'Provide approval controls, audit-safe review flow, and a cleaner path for managers to finalise workforce records before export.',
  },
  {
    title: 'Phase 4 — Payroll-ready export',
    body: 'Generate structured workforce outputs for external payroll or accounting systems without turning this module into a payroll processor.',
  },
];

const boundaryTone = {
  'Planned scope': 'text-emerald-700 bg-emerald-50 border-emerald-200',
  'Hard boundary': 'text-rose-700 bg-rose-50 border-rose-200',
  'Depends on Time Tracking': 'text-sky-700 bg-sky-50 border-sky-200',
  'External systems': 'text-violet-700 bg-violet-50 border-violet-200',
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

export default function Payroll() {
  return (
    <div className="p-5 lg:p-6 max-w-[1280px] space-y-4">
      <div className="space-y-1">
        <h1 className="text-xl font-semibold text-foreground">Payroll &amp; Rostering</h1>
        <p className="text-sm text-muted-foreground">Workforce planning placeholder kept separate from Inventory Roadmap scope.</p>
      </div>

      <div className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3.5">
        <div className="flex items-start gap-3">
          <div className="mt-0.5 flex h-9 w-9 items-center justify-center rounded-xl border border-amber-200 bg-white/70">
            <CircleAlert className="h-4 w-4 text-amber-700" strokeWidth={2} />
          </div>
          <div className="space-y-1">
            <p className="text-sm font-semibold text-amber-900">This is a non-inventory placeholder module.</p>
            <p className="text-sm leading-relaxed text-amber-800/90">
              It should help Invyra plan shifts, review attendance outcomes, and prepare export-ready records later on. It is not part of the Inventory Roadmap, and it does not represent live payroll execution, tax handling, or direct wage payment inside this build.
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
        {capabilitySections.map((section) => (
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
            <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-muted-foreground mb-1">Module boundaries</p>
            <h2 className="text-sm font-semibold text-foreground">What this module should and should not become</h2>
          </div>
          <div className="divide-y divide-border">
            {boundaryRows.map((row) => (
              <div key={row.label} className="px-4 py-3.5 flex flex-col gap-2 md:flex-row md:items-start md:justify-between md:gap-4">
                <div className="min-w-0">
                  <p className="text-sm font-medium text-foreground">{row.label}</p>
                  <p className="text-sm text-muted-foreground leading-relaxed mt-1">{row.detail}</p>
                </div>
                <span className={`shrink-0 inline-flex items-center rounded-full border px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wide ${boundaryTone[row.status]}`}>
                  {row.status}
                </span>
              </div>
            ))}
          </div>
        </section>

        <section className="rounded-2xl border border-border bg-card overflow-hidden">
          <div className="px-4 py-3 border-b border-border bg-muted/25">
            <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-muted-foreground mb-1">Roadmap</p>
            <h2 className="text-sm font-semibold text-foreground">Suggested MVP rollout</h2>
          </div>
          <div className="p-4 space-y-3">
            {roadmapBlocks.map((block) => (
              <div key={block.title} className="rounded-2xl border border-border bg-background px-4 py-3.5">
                <div className="flex items-center gap-2 mb-1.5">
                  <ClipboardList className="h-4 w-4 text-muted-foreground" strokeWidth={1.8} />
                  <p className="text-sm font-semibold text-foreground">{block.title}</p>
                </div>
                <p className="text-sm leading-relaxed text-muted-foreground">{block.body}</p>
              </div>
            ))}

            <div className="rounded-2xl border border-dashed border-border bg-muted/20 px-4 py-3.5">
              <div className="flex items-start gap-2.5">
                <ShieldCheck className="h-4 w-4 text-muted-foreground mt-0.5" strokeWidth={1.8} />
                <div>
                  <p className="text-sm font-semibold text-foreground">Safety rule</p>
                  <p className="text-sm leading-relaxed text-muted-foreground mt-1">
                    Keep payroll calculation, tax filing, and country-specific compliance logic outside this module until a separate dedicated payroll product scope exists.
                  </p>
                </div>
              </div>
            </div>

            <div className="rounded-2xl border border-dashed border-border bg-muted/20 px-4 py-3.5">
              <div className="flex items-start gap-2.5">
                <Layers3 className="h-4 w-4 text-muted-foreground mt-0.5" strokeWidth={1.8} />
                <div>
                  <p className="text-sm font-semibold text-foreground">Companion module</p>
                  <p className="text-sm leading-relaxed text-muted-foreground mt-1">
                    Payroll &amp; Rostering should represent planned labour, while Time Tracking should remain the actual worked-time and attendance truth layer.
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
