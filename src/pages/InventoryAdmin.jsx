import { DollarSign, ScrollText, TrendingUp, SlidersHorizontal } from 'lucide-react';

const panels = [
  { icon: DollarSign,        title: 'Stock Valuation',      desc: 'Current inventory value by category, supplier, and total cost.' },
  { icon: ScrollText,        title: 'Audit Logs',           desc: 'Full history of stock adjustments, overrides, and admin actions.' },
  { icon: TrendingUp,        title: 'Supplier Performance', desc: 'On-time delivery rates, order accuracy, and supplier scorecards.' },
  { icon: SlidersHorizontal, title: 'Adjustment Reports',   desc: 'Summary of manual stock adjustments, wastage entries, and returns.' },
];

const reports = [
  { type: 'Monthly Stock Valuation',   status: 'Available', lastGenerated: '2026-03-01' },
  { type: 'Supplier Performance Q1',   status: 'Available', lastGenerated: '2026-03-15' },
  { type: 'Wastage & Adjustments',     status: 'Pending',   lastGenerated: '—'          },
  { type: 'Audit Log Export',          status: 'Pending',   lastGenerated: '—'          },
  { type: 'Low Stock Trend Report',    status: 'Available', lastGenerated: '2026-03-20' },
];

const statusStyle = {
  Available: 'text-emerald-600',
  Pending:   'text-muted-foreground',
};

export default function InventoryAdmin() {
  return (
    <div className="p-6 max-w-[1000px]">

      <div className="mb-5">
        <h1 className="text-lg font-semibold text-foreground">Inventory Admin &amp; Reporting</h1>
        <p className="text-sm text-muted-foreground mt-0.5">Administrative controls, reporting, and inventory oversight</p>
      </div>

      {/* Panels */}
      <div className="grid grid-cols-2 gap-3 mb-5">
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

      {/* Reports table */}
      <div className="border border-border rounded overflow-hidden mb-5">
        <div className="px-5 py-3 border-b border-border bg-muted/30">
          <span className="text-[10px] font-semibold text-muted-foreground uppercase tracking-widest">Report Queue</span>
        </div>
        <table className="w-full text-sm">
          <thead className="bg-muted/20 text-muted-foreground text-xs uppercase tracking-wide">
            <tr>
              {['Report Type', 'Status', 'Last Generated'].map(h => (
                <th key={h} className="text-left px-5 py-2.5 font-medium">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {reports.map((row, i) => (
              <tr key={row.type} className={`border-t border-border ${i % 2 === 0 ? 'bg-card' : 'bg-background'}`}>
                <td className="px-5 py-2.5 font-medium">{row.type}</td>
                <td className={`px-5 py-2.5 text-xs font-semibold ${statusStyle[row.status]}`}>{row.status}</td>
                <td className="px-5 py-2.5 text-muted-foreground font-mono text-xs">{row.lastGenerated}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <p className="text-xs text-muted-foreground px-1">Advanced reporting and admin tools will be connected later.</p>

    </div>
  );
}