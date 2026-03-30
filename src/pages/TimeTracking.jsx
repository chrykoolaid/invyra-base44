import {
  BadgeCheck,
  CalendarClock,
  CircleAlert,
  ClipboardList,
  Clock3,
  FileOutput,
  ScanLine,
  ShieldCheck,
  TimerReset,
  UserCog,
  Workflow,
} from 'lucide-react';

const summaryCards = [
  {
    eyebrow: 'Module role',
    title: 'Attendance execution layer',
    body: 'Time Tracking should capture what actually happened during the shift, including punch events, breaks, exceptions, manager-reviewed corrections, and approved worked-time records.',
  },
  {
    eyebrow: 'Relationship to rostering',
    title: 'Actual labour companion',
    body: 'This module should be the actual attendance truth source that links back to Payroll & Rostering so planned labour can be compared against real worked outcomes.',
  },
  {
    eyebrow: 'Build status',
    title: 'Roadmap placeholder only',
    body: 'This page is intentionally honest in the prototype. It should not present fake live staff attendance or imply that active punch capture is already wired in this build.',
  },
];

const capabilitySections = [
  {
    title: 'Attendance capture foundation',
    description: 'The core event trail for what staff actually worked.',
    items: [
      {
        icon: ScanLine,
        title: 'Clock in / clock out',
        body: 'Timestamped attendance events for shift start and finish with location-aware capture and a clean event history.',
        tag: 'Must-have',
      },
      {
        icon: Clock3,
        title: 'Break tracking',
        body: 'Capture break start and end events so worked-time records reflect real shift activity rather than rough manual estimates.',
        tag: 'Must-have',
      },
      {
        icon: CalendarClock,
        title: 'Shift status states',
        body: 'Track statuses like not started, clocked in, on break, late, clocked out, or missed punch in a way that is operationally useful for managers.',
        tag: 'Core value',
      },
    ],
  },
  {
    title: 'Review, approval, and export readiness',
    description: 'How attendance should mature into trusted payroll-ready records.',
    items: [
      {
        icon: UserCog,
        title: 'Manager corrections',
        body: 'Manager-only correction flow for missed punches, late arrivals, early finishes, and other exception cases with reason capture and audit trail.',
        tag: 'Must-have',
      },
      {
        icon: TimerReset,
        title: 'Planned vs actual link',
        body: 'Compare rostered time against worked attendance so lateness, missed shifts, overruns, and variance summaries can be reviewed safely.',
        tag: 'Depends on rostering',
      },
      {
        icon: FileOutput,
        title: 'Approved attendance output',
        body: 'Expose approved hours, role worked, and branch-linked attendance records for later export into external payroll or accounting systems.',
        tag: 'Export stage',
      },
    ],
  },
];

const dependencyRows = [
  {
    label: 'Punch capture and event trail',
    status: 'Core requirement',
    detail: 'Attendance records must be based on timestamped clock and break events before review or export can be trusted.',
  },
  {
    label: 'Roster linkage',
    status: 'Depends on Payroll & Rostering',
    detail: 'Planned vs actual review only works properly when roster assignments and attendance events are connected to the same shift context.',
  },
  {
    label: 'Approval controls and audit logging',
    status: 'Manager governed',
    detail: 'Manual corrections need clear permissions, reasons, and a review flow so attendance does not become easy to tamper with.',
  },
  {
    label: 'Payroll destination',
    status: 'External systems',
    detail: 'This module should prepare approved attendance for export, not calculate wages, taxes, or full payroll compliance inside Invyra.',
  },
];

const roadmapBlocks = [
  {
    title: 'Phase 1 — Attendance capture',
    body: 'Implement clock events, break tracking, shift status, and the core attendance event trail per location and role worked.',
  },
  {
    title: 'Phase 2 — Review and correction',
    body: 'Add manager-only correction flows, missed punch handling, reason capture, and audit-safe review of attendance exceptions.',
  },
  {
    title: 'Phase 3 — Planned vs actual variance',
    body: 'Link attendance back to rostered shifts so lateness, early finish, missed shift, and overrun conditions can be understood properly.',
  },
  {
    title: 'Phase 4 — Approval and export readiness',
    body: 'Approve final attendance records and expose payroll-ready worked-time outputs for controlled export into external systems.',
  },
];

const dependencyTone = {
  'Core requirement': 'text-emerald-700 bg-emerald-50 border-emerald-200',
  'Depends on Payroll & Rostering': 'text-sky-700 bg-sky-50 border-sky-200',
  'Manager governed': 'text-amber-700 bg-amber-50 border-amber-200',
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

export default function TimeTracking() {
  return (
    <div className="p-5 lg:p-6 max-w-[1280px] space-y-4">
      <div className="space-y-1">
        <h1 className="text-xl font-semibold text-foreground">Time Tracking</h1>
        <p className="text-sm text-muted-foreground">Attendance capture, exception review, approval flow, and payroll-ready worked-time preparation for this prototype roadmap.</p>
      </div>

      <div className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3.5">
        <div className="flex items-start gap-3">
          <div className="mt-0.5 flex h-9 w-9 items-center justify-center rounded-xl border border-amber-200 bg-white/70">
            <CircleAlert className="h-4 w-4 text-amber-700" strokeWidth={2} />
          </div>
          <div className="space-y-1">
            <p className="text-sm font-semibold text-amber-900">This workspace is now positioned as an attendance roadmap hub.</p>
            <p className="text-sm leading-relaxed text-amber-800/90">
              It should explain how Invyra will capture actual worked time and attendance exceptions later on. It should not pretend the prototype already has live punch data, active attendance tables, or a finished time clock workflow.
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
            <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-muted-foreground mb-1">Dependencies</p>
            <h2 className="text-sm font-semibold text-foreground">What must be trusted before activation</h2>
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
                  <p className="text-sm font-semibold text-foreground">Boundary rule</p>
                  <p className="text-sm leading-relaxed text-muted-foreground mt-1">
                    Keep this module focused on attendance truth, worked-time review, and approved records. Wage calculation and payroll compliance stay outside this scope.
                  </p>
                </div>
              </div>
            </div>

            <div className="rounded-2xl border border-dashed border-border bg-muted/20 px-4 py-3.5">
              <div className="flex items-start gap-2.5">
                <Workflow className="h-4 w-4 text-muted-foreground mt-0.5" strokeWidth={1.8} />
                <div>
                  <p className="text-sm font-semibold text-foreground">Workflow intent</p>
                  <p className="text-sm leading-relaxed text-muted-foreground mt-1">
                    Time Tracking should feed approved attendance into Payroll &amp; Rostering and later export layers so planned labour and actual labour can be reviewed together.
                  </p>
                </div>
              </div>
            </div>

            <div className="rounded-2xl border border-dashed border-border bg-muted/20 px-4 py-3.5">
              <div className="flex items-start gap-2.5">
                <BadgeCheck className="h-4 w-4 text-muted-foreground mt-0.5" strokeWidth={1.8} />
                <div>
                  <p className="text-sm font-semibold text-foreground">Approval expectation</p>
                  <p className="text-sm leading-relaxed text-muted-foreground mt-1">
                    Final attendance records should move into a controlled approved state before they are considered ready for payroll-facing export or downstream integration.
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
