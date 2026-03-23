import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ScanLine, ClipboardList, Search, ChevronRight } from 'lucide-react';

const receivingRows = [
  { po: 'PO-2026-001', supplier: 'ChemSupply Co',         item: 'Premium Detergent 20L', expected: 20,  received: 0,   unit: 'drum',   status: 'Awaiting'  },
  { po: 'PO-2026-001', supplier: 'ChemSupply Co',         item: 'Machine Descaler',       expected: 10,  received: 0,   unit: 'bottle', status: 'Awaiting'  },
  { po: 'PO-2026-002', supplier: 'CleanTex Distributors', item: 'Bleach 5L',              expected: 18,  received: 18,  unit: 'bottle', status: 'Completed' },
  { po: 'PO-2026-002', supplier: 'CleanTex Distributors', item: 'Stain Remover 2L',       expected: 12,  received: 8,   unit: 'bottle', status: 'Partial'   },
  { po: 'PO-2026-003', supplier: 'PackPro Solutions',     item: 'Packaging Bag Large',    expected: 500, received: 500, unit: 'pack',   status: 'Completed' },
  { po: 'PO-2026-003', supplier: 'PackPro Solutions',     item: 'Garment Tag Roll',        expected: 10,  received: 4,   unit: 'roll',   status: 'Partial'   },
  { po: 'PO-2026-004', supplier: 'LaundryChem Direct',    item: 'Fabric Softener 20L',    expected: 8,   received: 8,   unit: 'drum',   status: 'Completed' },
  { po: 'PO-2026-005', supplier: 'SafetyFirst Supplies',  item: 'Gloves Disposable',       expected: 200, received: 0,   unit: 'pcs',    status: 'Awaiting'  },
];

const statusStyle = {
  Awaiting:  'bg-muted text-muted-foreground border border-border',
  Partial:   'bg-amber-50 text-amber-700 border border-amber-200',
  Completed: 'bg-green-50 text-green-700 border border-green-200',
};

// Group rows by PO
function groupByPO(rows) {
  const map = {};
  for (const row of rows) {
    if (!map[row.po]) {
      map[row.po] = { po: row.po, supplier: row.supplier, items: [] };
    }
    map[row.po].items.push(row);
  }
  return Object.values(map);
}

// Derive overall PO status from its items
function poStatus(items) {
  if (items.every(i => i.status === 'Completed')) return 'Completed';
  if (items.every(i => i.status === 'Awaiting'))  return 'Awaiting';
  return 'Partial';
}

export default function Receiving() {
  const navigate = useNavigate();
  const [query, setQuery] = useState('');

  const filtered = receivingRows.filter(r =>
    r.po.toLowerCase().includes(query.toLowerCase()) ||
    r.item.toLowerCase().includes(query.toLowerCase()) ||
    r.supplier.toLowerCase().includes(query.toLowerCase())
  );

  const groups = groupByPO(filtered);

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

        <button onClick={() => navigate('/Receiving/log')} className="flex items-center gap-1.5 h-8 px-3 text-sm border border-border rounded bg-card hover:bg-muted transition-colors text-foreground">
          <ClipboardList size={13} /> Receiving Log
        </button>

        <span className="ml-auto text-xs text-muted-foreground">{filtered.length} line{filtered.length !== 1 ? 's' : ''}</span>
      </div>

      {/* Grouped table */}
      <div className="border border-border rounded overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-muted text-muted-foreground text-xs uppercase tracking-wide">
            <tr>
              {['Item', 'Expected', 'Received', 'Unit', 'Status'].map(h => (
                <th key={h} className="text-left px-4 py-2.5 font-medium whitespace-nowrap">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {groups.length === 0 && (
              <tr>
                <td colSpan={5} className="px-4 py-8 text-center text-muted-foreground text-sm">No results found.</td>
              </tr>
            )}
            {groups.map((group) => {
              const overallStatus = poStatus(group.items);
              return (
                <>
                  {/* PO group header */}
                  <tr key={`header-${group.po}`} className="bg-muted/40 border-t border-border">
                    <td colSpan={5} className="px-4 py-2">
                      <div className="flex items-center gap-3">
                        <button
                          onClick={() => navigate(`/Receiving/workspace?po=${group.po}`)}
                          className="font-mono text-xs font-semibold text-primary hover:underline"
                        >
                          {group.po}
                        </button>
                        <span className="text-xs text-muted-foreground">{group.supplier}</span>
                        <span className={`ml-auto text-[10px] px-2 py-0.5 rounded-full font-semibold ${statusStyle[overallStatus]}`}>
                          {overallStatus}
                        </span>
                      </div>
                    </td>
                  </tr>

                  {/* Child rows */}
                  {group.items.map((row, i) => (
                    <tr
                      key={`${row.po}-${row.item}`}
                      className={`border-t border-border/60 ${i % 2 === 0 ? 'bg-card' : 'bg-background'} hover:bg-accent/30 transition-colors`}
                    >
                      <td className="px-4 py-2.5 pl-8 font-medium">{row.item}</td>
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
                </>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}