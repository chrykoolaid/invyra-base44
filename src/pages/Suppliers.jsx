import { useState } from 'react';
import { Plus, Pencil, RefreshCw, Globe, Search } from 'lucide-react';

const suppliers = [
  { id: 'SUP-001', name: 'ChemSupply Co',        contact: 'Alan Marsh',    phone: '(555) 101-2030', email: 'alan@chemsupply.com'     },
  { id: 'SUP-002', name: 'CleanTex Distributors', contact: 'Maria Santos',  phone: '(555) 202-3141', email: 'maria@cleantex.com'      },
  { id: 'SUP-003', name: 'PackPro Solutions',     contact: 'James Yuen',    phone: '(555) 303-4252', email: 'james@packpro.com'       },
  { id: 'SUP-004', name: 'SafetyFirst Supplies',  contact: 'Donna Wright',  phone: '(555) 404-5363', email: 'donna@safetyfirst.com'   },
  { id: 'SUP-005', name: 'HangerCo Wholesale',    contact: 'Ben Okafor',    phone: '(555) 505-6474', email: 'ben@hangerco.com'        },
  { id: 'SUP-006', name: 'LaundryChem Direct',    contact: 'Tracy Lin',     phone: '(555) 606-7585', email: 'tracy@laundrychem.com'   },
  { id: 'SUP-007', name: 'ProWash Ingredients',   contact: 'Sam Patel',     phone: '(555) 707-8696', email: 'sam@prowash.com'         },
];

export default function Suppliers() {
  const [query, setQuery] = useState('');
  const [selected, setSelected] = useState(new Set());

  const filtered = suppliers.filter(s =>
    s.name.toLowerCase().includes(query.toLowerCase()) ||
    s.contact.toLowerCase().includes(query.toLowerCase()) ||
    s.email.toLowerCase().includes(query.toLowerCase())
  );

  const toggleRow = (id) => {
    setSelected(prev => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  const toggleAll = () => {
    setSelected(prev => prev.size === filtered.length ? new Set() : new Set(filtered.map(s => s.id)));
  };

  return (
    <div className="p-6">
      <h1 className="text-xl font-semibold text-foreground mb-4">Suppliers</h1>

      {/* Search */}
      <div className="flex items-center gap-2 mb-4">
        <div className="relative">
          <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <input
            type="text"
            value={query}
            onChange={e => setQuery(e.target.value)}
            placeholder="Search suppliers…"
            className="h-8 w-72 border border-border rounded pl-8 pr-3 text-sm focus:outline-none focus:ring-1 focus:ring-ring bg-card"
          />
        </div>
      </div>

      {/* Action row */}
      <div className="flex flex-wrap items-center gap-2 mb-5">
        <button className="flex items-center gap-1.5 h-8 px-3 text-sm bg-primary text-primary-foreground rounded hover:opacity-90 transition-opacity">
          <Plus size={13} /> Add Supplier
        </button>
        <button
          disabled={selected.size === 0}
          className="flex items-center gap-1.5 h-8 px-3 text-sm border border-border rounded bg-card hover:bg-muted transition-colors text-foreground disabled:opacity-40 disabled:cursor-not-allowed"
        >
          <Pencil size={13} /> Edit Selected {selected.size > 0 && `(${selected.size})`}
        </button>
        <button className="flex items-center gap-1.5 h-8 px-3 text-sm border border-border rounded bg-card hover:bg-muted transition-colors text-foreground">
          <RefreshCw size={13} /> Reload
        </button>
        <button className="flex items-center gap-1.5 h-8 px-3 text-sm border border-border rounded bg-card hover:bg-muted transition-colors text-foreground">
          <Globe size={13} /> Search Online
        </button>
        <span className="ml-auto text-xs text-muted-foreground">{filtered.length} supplier{filtered.length !== 1 ? 's' : ''}</span>
      </div>

      {/* Table */}
      <div className="border border-border rounded overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-muted text-muted-foreground text-xs uppercase tracking-wide">
            <tr>
              <th className="px-4 py-2.5 w-8">
                <input type="checkbox" checked={selected.size === filtered.length && filtered.length > 0} onChange={toggleAll} className="cursor-pointer" />
              </th>
              {['ID', 'Name', 'Contact', 'Phone', 'Email'].map(h => (
                <th key={h} className="text-left px-4 py-2.5 font-medium whitespace-nowrap">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {filtered.map((s, i) => (
              <tr
                key={s.id}
                onClick={() => toggleRow(s.id)}
                className={`border-t border-border cursor-pointer transition-colors ${
                  selected.has(s.id) ? 'bg-primary/5' : i % 2 === 0 ? 'bg-card' : 'bg-background'
                } hover:bg-accent/40`}
              >
                <td className="px-4 py-2.5">
                  <input type="checkbox" checked={selected.has(s.id)} onChange={() => toggleRow(s.id)} onClick={e => e.stopPropagation()} className="cursor-pointer" />
                </td>
                <td className="px-4 py-2.5 font-mono text-xs text-muted-foreground">{s.id}</td>
                <td className="px-4 py-2.5 font-medium">{s.name}</td>
                <td className="px-4 py-2.5 text-muted-foreground">{s.contact}</td>
                <td className="px-4 py-2.5 text-muted-foreground">{s.phone}</td>
                <td className="px-4 py-2.5 text-muted-foreground">{s.email}</td>
              </tr>
            ))}
            {filtered.length === 0 && (
              <tr>
                <td colSpan={6} className="px-4 py-8 text-center text-muted-foreground text-sm">No suppliers found.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}