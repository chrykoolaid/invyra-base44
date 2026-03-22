import { Monitor, Terminal, Receipt, UtensilsCrossed } from 'lucide-react';

const panels = [
  {
    icon: Monitor,
    title: 'Register Status',
    desc: 'Active register state, session info, and till summary will appear here.',
  },
  {
    icon: Terminal,
    title: 'Current Terminal',
    desc: 'Terminal ID, operator login, and connection status will be displayed here.',
  },
  {
    icon: Receipt,
    title: 'Receipt Lookup',
    desc: 'Search and retrieve past transaction receipts by order or customer reference.',
  },
  {
    icon: UtensilsCrossed,
    title: 'Service Menu',
    desc: 'Laundry service catalogue, pricing tiers, and item selection will load here.',
  },
];

export default function POSMode() {
  return (
    <div className="p-6 max-w-[1000px]">

      {/* Header */}
      <div className="mb-5">
        <h1 className="text-lg font-semibold text-foreground">POS Mode</h1>
        <p className="text-sm text-muted-foreground mt-0.5">Laundry POS prototype workspace placeholder</p>
      </div>

      {/* Notice banner */}
      <div className="mb-6 px-4 py-3 border border-border rounded bg-muted/40 text-sm text-muted-foreground">
        POS prototype not yet connected in this Base44 build. The POS interface — including register management, service dispatch, and receipt handling — will be integrated in a future phase.
      </div>

      {/* Placeholder panels */}
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