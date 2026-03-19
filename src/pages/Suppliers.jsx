import { useState } from 'react';
import { Plus, Search } from 'lucide-react';

const sample = [
  { id: 'SUP-01', name: 'CleanTex',    contact: 'Jane Morris',    email: 'jane@cleantex.com',    phone: '555-0101', category: 'Linens',    leadDays: 3,  status: 'Active' },
  { id: 'SUP-02', name: 'LinenPro',    contact: 'Mark Alvarez',   email: 'mark@linenpro.com',    phone: '555-0202', category: 'Bedding',   leadDays: 5,  status: 'Active' },
  { id: 'SUP-03', name: 'MatSource',   contact: 'Priya Nair',     email: 'priya@matsource.com',  phone: '555-0303', category: 'Mats',      leadDays: 7,  status: 'Active' },
  { id: 'SUP-04', name: 'ChemSupply',  contact: 'Tom Reeves',     email: 'tom@chemsupply.com',   phone: '555-0404', category: 'Chemicals', leadDays: 2,  status: 'Active' },
  { id: 'SUP-05', name: 'UniTex',      contact: 'Sarah Bloom',    email: 'sarah@unitex.com',     phone: '555-0505', category: 'Uniforms',  leadDays: 10, status: 'Inactive' },
];

export default function Suppliers() {
  const [search, setSearch] = useState('');
  const filtered = sample.filter(s =>
    s.name.toLowerCase().includes(search.toLowerCase()) ||
    s.category.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="px-8 py-6">
      <h1 className="text-xl font-semibold text-foreground mb-5">Suppliers</h1>

      <div className="flex items-center gap-3 mb-5">
        <div className="relative">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search suppliers…"
            className="pl-8 pr-3 py-1.5 text-sm border border-border rounded bg-card w-52 focus:outline-none focus:ring-1 focus:ring-ring"
          />
        </div>
        <button className="flex items-center gap-1.5 text-sm bg-primary text-primary-foreground px-3 py-1.5 rounded hover:opacity-90 transition-opacity">
          <Plus size={14} /> Add Supplier
        </button>
      </div>

      <div className="border border-border rounded overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-muted text-muted-foreground text-xs uppercase tracking-wide">
            <tr>
              {['ID','Name','Contact','Email','Phone','Category','Lead Days','Status'].map(h => (
                <th key={h} className="text-left px-4 py-2.5 font-medium">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {filtered.map((r, i) => (
              <tr key={r.id} className={`border-t border-border ${i % 2 === 0 ? 'bg-card' : 'bg-background'} hover:bg-accent/40 cursor-pointer`}>
                <td className="px-4 py-2.5 text-muted-foreground font-mono text-xs">{r.id}</td>
                <td className="px-4 py-2.5 font-medium">{r.name}</td>
                <td className="px-4 py-2.5 text-muted-foreground">{r.contact}</td>
                <td className="px-4 py-2.5 text-muted-foreground">{r.email}</td>
                <td className="px-4 py-2.5 text-muted-foreground">{r.phone}</td>
                <td className="px-4 py-2.5 text-muted-foreground">{r.category}</td>
                <td className="px-4 py-2.5 text-muted-foreground">{r.leadDays}d</td>
                <td className="px-4 py-2.5">
                  <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${r.status === 'Active' ? 'bg-green-50 text-green-700' : 'bg-muted text-muted-foreground'}`}>{r.status}</span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}