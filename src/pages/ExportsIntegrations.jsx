import { FileDown, Upload, Calculator, Plug } from 'lucide-react';

const panels = [
  { icon: FileDown,    title: 'CSV Exports',             desc: 'Export inventory, orders, and stock movement data as CSV files.' },
  { icon: Upload,      title: 'Supplier Import',         desc: 'Bulk import supplier catalogues and pricing sheets from CSV or spreadsheet.' },
  { icon: Calculator,  title: 'Accounting Integration',  desc: 'Sync purchase orders and stock values with connected accounting platforms.' },
  { icon: Plug,        title: 'API / External Sync',     desc: 'Connect external systems via REST API or webhook endpoints.' },
];

const statusRows = [
  { feature: 'Inventory CSV Export',       status: 'Planned',      notes: 'Scope defined, not yet built' },
  { feature: 'Order History Export',       status: 'Planned',      notes: 'Pending order module completion' },
  { feature: 'Supplier Price Import',      status: 'Planned',      notes: 'Template design in progress' },
  { feature: 'Xero / MYOB Integration',    status: 'Not Started',  notes: 'Requires accounting connector' },
  { feature: 'Webhook / API Sync',         status: 'Not Started',  notes: 'API design not finalised' },
];

const statusStyle = {
  'Planned':     'text-amber-600',
  'Not Started': 'text-muted-foreground',
  'Active':      'text-emerald-600',
};

export default function ExportsIntegrations() {
  return (
    <div className="p-6 max-w-[1000px]">

      <div className="mb-5">
        <h1 className="text-lg font-semibold text-foreground">Exports &amp; Integrations</h1>
        <p className="text-sm text-muted-foreground mt-0.5">Data export tools and third-party connection points</p>
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

      {/* Status table */}
      <div className="border border-border rounded overflow-hidden mb-5">
        <div className="px-5 py-3 border-b border-border bg-muted/30">
          <span className="text-[10px] font-semibold text-muted-foreground uppercase tracking-widest">Feature Status</span>
        </div>
        <table className="w-full text-sm">
          <thead className="bg-muted/20 text-muted-foreground text-xs uppercase tracking-wide">
            <tr>
              {['Feature', 'Status', 'Notes'].map(h => (
                <th key={h} className="text-left px-5 py-2.5 font-medium">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {statusRows.map((row, i) => (
              <tr key={row.feature} className={`border-t border-border ${i % 2 === 0 ? 'bg-card' : 'bg-background'}`}>
                <td className="px-5 py-2.5 font-medium">{row.feature}</td>
                <td className={`px-5 py-2.5 text-xs font-semibold ${statusStyle[row.status]}`}>{row.status}</td>
                <td className="px-5 py-2.5 text-muted-foreground text-xs">{row.notes}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <p className="text-xs text-muted-foreground px-1">Exports and integrations are planned but not yet active in this build.</p>

    </div>
  );
}