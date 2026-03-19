import { useState } from 'react';
import { Plus, Search } from 'lucide-react';

const sample = [
  { id: 'ORD-2024-041', supplier: 'CleanTex',   date: '2026-03-14', items: 3, total: 2340.00, status: 'Delivered' },
  { id: 'ORD-2024-042', supplier: 'LinenPro',   date: '2026-03-15', items: 2, total: 1800.00, status: 'In Transit' },
  { id: 'ORD-2024-043', supplier: 'MatSource',  date: '2026-03-17', items: 1, total: 810.00,  status: 'Pending' },
  { id: 'ORD-2024-044', supplier: 'ChemSupply', date: '2026-03-18', items: 2, total: 380.00,  status: 'Pending' },
  { id: 'ORD-2024-040', supplier: 'CleanTex',   date: '2026-03-10', items: 4, total: 3120.00, status: 'Delivered' },
];

const statusColor = {
  Delivered:  'bg-green-50 text-green-700',
  'In Transit': 'bg-blue-50 text-blue-700',
  Pending:    'bg-amber-50 text-amber-700',
};

export default function Orders() {
  const [search, setSearch] = useState('');
  const filtered = sample.filter(o =>
    o.id.toLowerCase().includes(search.toLowerCase()) ||
    o.supplier.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="px-8 py-6">
      <h1 className="text-xl font-semibold text-foreground mb-5">Orders</h1>

      <div className="flex items-center gap-3 mb-5">
        <div className="relative">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search orders…"
            className="pl-8 pr-3 py-1.5 text-sm border border-border rounded bg-card w-52 focus:outline-none focus:ring-1 focus:ring-ring"
          />
        </div>
        <select className="text-sm border border-border rounded px-3 py-1.5 bg-card focus:outline-none focus:ring-1 focus:ring-ring">
          <option>All Statuses</option>
          <option>Pending</option>
          <option>In Transit</option>
          <option>Delivered</option>
        </select>
        <button className="flex items-center gap-1.5 text-sm bg-primary text-primary-foreground px-3 py-1.5 rounded hover:opacity-90 transition-opacity">
          <Plus size={14} /> New Order
        </button>
      </div>

      <div className="border border-border rounded overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-muted text-muted-foreground text-xs uppercase tracking-wide">
            <tr>
              {['Order ID','Supplier','Date','Items','Total','Status'].map(h => (
                <th key={h} className="text-left px-4 py-2.5 font-medium">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {filtered.map((r, i) => (
              <tr key={r.id} className={`border-t border-border ${i % 2 === 0 ? 'bg-card' : 'bg-background'} hover:bg-accent/40 cursor-pointer`}>
                <td className="px-4 py-2.5 font-mono text-xs font-medium">{r.id}</td>
                <td className="px-4 py-2.5">{r.supplier}</td>
                <td className="px-4 py-2.5 text-muted-foreground">{r.date}</td>
                <td className="px-4 py-2.5 text-muted-foreground">{r.items}</td>
                <td className="px-4 py-2.5 font-medium">${r.total.toLocaleString('en-US', {minimumFractionDigits:2})}</td>
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