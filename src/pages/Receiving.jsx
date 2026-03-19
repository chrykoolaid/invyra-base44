import { useState } from 'react';
import { ScanLine, ClipboardList, Search } from 'lucide-react';

const receivingRows = [
  { po: 'PO-2026-001', supplier: 'ChemSupply Co',         item: 'Premium Detergent 20L', expected: 20,  received: 0,   unit: 'drum',   status: 'Awaiting'  },
  { po: 'PO-2026-001', supplier: 'ChemSupply Co',         item: 'Machine Descaler',       expected: 10,  received: 0,   unit: 'bottle', status: 'Awaiting'  },
  { po: 'PO-2026-002', supplier: 'CleanTex Distributors', item: 'Bleach 5L',              expected: 18,  received: 18,  unit: 'bottle', status: 'Completed' },
  { po: 'PO-2026-002', supplier: 'CleanTex Distributors', item: 'Stain Remover 2L',       expected: 12,  received: 8,   unit: 'bottle', status: 'Partial'   },
  { po: 'PO-2026-003', supplier: 'PackPro Solutions',     item: 'Packaging Bag Large',    expected: 500, received: 500, unit: 'pack',   status: 'Completed' },
  { po: 'PO-2026-003', supplier: 'PackPro Solutions',     item: 'Garment Tag Roll',        expected: 10,  received: 4,   unit: 'roll',   status: 'Partial'   },
  { po: 'PO-2026-004', supplier: 'LaundryChem Direct',    item: 'Fabric Softener 20L',    expected: 8,   received: 8,   unit: 'drum',   status: 'Completed' },
  { po: 'PO-2026-005', supplier: 'SafetyFirst Supplies',  item: 'Gloves Disposable',       expected: 200, received: 0,   unit: 'box',    status: 'Awaiting'  },
];

const statusStyle = {
  Awaiting:  'bg-muted text-muted-foreground border border-border',
  Partial:   'bg-amber-50 text-amber-700 border border-amber-200',
  Completed: 'bg-green-50 text-green-700 border border-green-200',
};

export default function Receiving() {
  const [query, setQuery] = useState('');

  const filtered = receivingRows.filter(r =>
    r.po.toLowerCase().includes(query.toLowerCase()) ||
    r.item.toLowerCase().includes(query.toLowerCase()) ||
    r.supplier.toLowerCase().includes(query.toLowerCase())
  );

  return (
    <div className="p-6">
      <h1 className="text-xl font-semibold text-foreground mb-4">Receiving</h1>

      {/* Search + actions */}
      <div className="flex flex-wrap items-center gap-2 mb-5">
        <div className="relative">
          <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <input
            type="text"
            value={query}
            onChange={e => setQuery(e.target.value)}
            placeholder="Search by PO, item, or supplier…"
            className="h-8 w-72 border border-border rounded pl-8 pr-3 text-sm focus:outline-none focus:ring-1 focus:ring-ring bg-card"
          />
        </div>

        <button className="flex items-center gap-1.5 h-8 px-3 text-sm bg-primary text-primary-foreground rounded hover:opacity-90 transition-opacity">
          <ScanLine size={13} /> Start Receiving
        </button>

        <button className="flex items-center gap-1.5 h-8 px-3 text-sm border border-border rounded bg-card hover:bg-muted transition-colors text-foreground">
          <ClipboardList size={13} /> Receiving Log
        </button>

        <span className="ml-auto text-xs text-muted-foreground">{filtered.length} line{filtered.length !== 1 ? 's' : ''}</span>
      </div>

      {/* Table */}
      <div className="border border-border rounded overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-muted text-muted-foreground text-xs uppercase tracking-wide">
            <tr>
              {['PO', 'Supplier', 'Item', 'Expected', 'Received', 'Unit', 'Status'].map(h => (
                <th key={h} className="text-left px-4 py-2.5 font-medium whitespace-nowrap">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {filtered.map((row, i) => (
              <tr
                key={`${row.po}-${row.item}`}
                className={`border-t border-border transition-colors hover:bg-accent/40 ${i % 2 === 0 ? 'bg-card' : 'bg-background'}`}
              >
                <td className="px-4 py-2.5 font-mono text-xs text-muted-foreground">{row.po}</td>
                <td className="px-4 py-2.5 text-muted-foreground">{row.supplier}</td>
                <td className="px-4 py-2.5 font-medium">{row.item}</td>
                <td className="px-4 py-2.5">{row.expected}</td>
                <td className={`px-4 py-2.5 font-medium ${
                  row.received === 0 ? 'text-muted-foreground' :
                  row.received < row.expected ? 'text-amber-600' : 'text-green-700'
                }`}>{row.received}</td>
                <td className="px-4 py-2.5 text-muted-foreground">{row.unit}</td>
                <td className="px-4 py-2.5">
                  <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${statusStyle[row.status]}`}>
                    {row.status}
                  </span>
                </td>
              </tr>
            ))}
            {filtered.length === 0 && (
              <tr>
                <td colSpan={7} className="px-4 py-8 text-center text-muted-foreground text-sm">No results found.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}