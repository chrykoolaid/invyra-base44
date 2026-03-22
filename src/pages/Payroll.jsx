import { CalendarDays, Users, Banknote, AlertCircle } from 'lucide-react';

const panels = [
  {
    icon: CalendarDays,
    title: 'Upcoming Shifts',
    desc: 'Scheduled staff shifts for the current and next week will appear here.',
  },
  {
    icon: Users,
    title: 'Staff on Roster',
    desc: 'Active roster assignments, role coverage, and headcount by shift.',
  },
  {
    icon: Banknote,
    title: 'Payroll Cycle',
    desc: 'Current pay period, run status, and submission deadline tracking.',
  },
  {
    icon: AlertCircle,
    title: 'Attendance Exceptions',
    desc: 'Late arrivals, no-shows, and unresolved attendance flags for review.',
  },
];

export default function Payroll() {
  return (
    <div className="p-6 max-w-[1000px]">

      <div className="mb-5">
        <h1 className="text-lg font-semibold text-foreground">Payroll &amp; Rostering</h1>
        <p className="text-sm text-muted-foreground mt-0.5">Staff scheduling and payroll controls</p>
      </div>

      <div className="mb-6 px-4 py-3 border border-border rounded bg-muted/40 text-sm text-muted-foreground">
        This module is a prototype placeholder and will be connected later.
      </div>

      <div className="grid grid-cols-2 gap-4">
        {panels.map(({ icon: Icon, title, desc }) => (
          <div key={title} className="border border-border rounded bg-card px-5 py-4">
            <div className="flex items-center gap-2.5 mb-2">
              <Icon className="w-4 h-4 text-muted-foreground" strokeWidth={1.8} />
              <span className="text-sm font-medium text-foreground">{title}</span>
            </div>
            <p className="text-xs text-muted-foreground leading-relaxed">{desc}</p>
            <div className="mt-3 h-7 w-24 rounded bg-muted/50 border border-border flex items-center justify-center">
              <span className="text-[10px] text-muted-foreground/60 font-medium uppercase tracking-wide">Coming soon</span>
            </div>
          </div>
        ))}
      </div>

    </div>
  );
}