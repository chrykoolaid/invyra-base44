import { useState } from 'react';
import { Globe } from 'lucide-react';

const deliveries = [
  { id: 'DEL-0091', order: 'ORD-2024-042', supplier: 'LinenPro',  eta: '2026-03-20', carrier: 'FedEx',  tracking: '7742-0019', status: 'In Transit' },
  { id: 'DEL-0090', order: 'ORD-2024-040', supplier: 'CleanTex',  eta: '2026-03-13', carrier: 'UPS',    tracking: '1Z99X00', status: 'Delivered' },
  { id: 'DEL-0089', order: 'ORD-2024-039', supplier: 'MatSource', eta: '2026-03-11', carrier: 'FedEx',  tracking: '7701-8854', status: 'Delivered' },
  { id: 'DEL-0092', order: 'ORD-2024-043', supplier: 'MatSource', eta: '2026-03-22', carrier: 'USPS',   tracking: '9400-1112', status: 'Pending' },
  { id: 'DEL-0093', order: 'ORD-2024-044', supplier: 'ChemSupply',eta: '2026-03-21', carrier: 'UPS',    tracking: '1Z00WXYZ', status: 'Pending' },
];

const statusColor = {
  Delivered:   'bg-green-50 text-green-700',
  'In Transit': 'bg-blue-50 text-blue-700',
  Pending:     'bg-amber-50 text-amber-700',
};

export default function DeliveryPortal() {
  const [filter, setFilter] = useState('All');
  const filtered = filter === 'All' ? deliveries : deliveries.filter(d => d.status === filter);

  return (
    <div className="px-8 py-6">
      <h1 className="text-xl font-semibold text-foreground mb-5">Delivery Portal</h1>

      <div className="flex items-center gap-3 mb-5">
        {['All', 'Pending', 'In Transit', 'Delivered'].map(s => (
          <button
            key={s}
            onClick={() => setFilter(s)}
            className={`text-sm px-3 py-1.5 rounded border transition-colors ${filter === s ? 'bg-primary text-primary-foreground border-primary' : 'bg-card border-border text-foreground hover:bg-accent'}`}
          >
            {s}
          </button>
        ))}
        <button className="ml-auto flex items-center gap-1.5 text-sm border border-border bg-card px-3 py-1.5 rounded hover:bg-accent transition-colors">
          <Globe size={14} /> Refresh Tracking
        </button>
      </div>

      <div className="border border-border rounded overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-muted text-muted-foreground text-xs uppercase tracking-wide">
            <tr>
              {['Delivery ID','Order','Supplier','ETA','Carrier','Tracking #','Status'].map(h => (
                <th key={h} className="text-left px-4 py-2.5 font-medium">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {filtered.map((r, i) => (
              <tr key={r.id} className={`border-t border-border ${i % 2 === 0 ? 'bg-card' : 'bg-background'} hover:bg-accent/40`}>
                <td className="px-4 py-2.5 font-mono text-xs text-muted-foreground">{r.id}</td>
                <td className="px-4 py-2.5 font-mono text-xs text-muted-foreground">{r.order}</td>
                <td className="px-4 py-2.5 font-medium">{r.supplier}</td>
                <td className="px-4 py-2.5 text-muted-foreground">{r.eta}</td>
                <td className="px-4 py-2.5 text-muted-foreground">{r.carrier}</td>
                <td className="px-4 py-2.5 font-mono text-xs">{r.tracking}</td>
                <td className="px-4 py-2.5">
                  <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${statusColor[r.status]}`}>{r.status}</span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}