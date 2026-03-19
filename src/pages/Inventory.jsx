import { useState } from 'react';
import { Plus, Search } from 'lucide-react';

const sample = [
  { id: 'LIN-001', name: 'Bath Towel 27×54', category: 'Towels', unit: 'Each', onHand: 840, par: 1000, reorder: 200, supplier: 'CleanTex' },
  { id: 'LIN-002', name: 'Hand Towel 16×28', category: 'Towels', unit: 'Each', onHand: 520, par: 600, reorder: 150, supplier: 'CleanTex' },
  { id: 'LIN-003', name: 'Washcloth 12×12',  category: 'Towels', unit: 'Each', onHand: 1200, par: 1200, reorder: 300, supplier: 'CleanTex' },
  { id: 'LIN-004', name: 'Bed Sheet Queen',  category: 'Bedding', unit: 'Each', onHand: 310, par: 500, reorder: 100, supplier: 'LinenPro' },
  { id: 'LIN-005', name: 'Pillow Case Std',  category: 'Bedding', unit: 'Each', onHand: 680, par: 800, reorder: 200, supplier: 'LinenPro' },
  { id: 'LIN-006', name: 'Bath Mat 20×30',   category: 'Mats',   unit: 'Each', onHand: 90,  par: 200, reorder: 50,  supplier: 'MatSource' },
  { id: 'LIN-007', name: 'Pool Towel 30×60', category: 'Towels', unit: 'Each', onHand: 440, par: 600, reorder: 150, supplier: 'CleanTex' },
  { id: 'LIN-008', name: 'Detergent 5-Gal',  category: 'Chemicals', unit: 'Pail', onHand: 12, par: 20, reorder: 5, supplier: 'ChemSupply' },
];

export default function Inventory() {
  const [search, setSearch] = useState('');
  const filtered = sample.filter(r =>
    r.name.toLowerCase().includes(search.toLowerCase()) ||
    r.category.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="px-8 py-6">
      <h1 className="text-xl font-semibold text-foreground mb-5">Inventory</h1>

      {/* Controls */}
      <div className="flex items-center gap-3 mb-5">
        <div className="relative">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search items…"
            className="pl-8 pr-3 py-1.5 text-sm border border-border rounded bg-card w-56 focus:outline-none focus:ring-1 focus:ring-ring"
          />
        </div>
        <button className="flex items-center gap-1.5 text-sm bg-primary text-primary-foreground px-3 py-1.5 rounded hover:opacity-90 transition-opacity">
          <Plus size={14} /> Add Item
        </button>
      </div>

      {/* Table */}
      <div className="border border-border rounded overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-muted text-muted-foreground text-xs uppercase tracking-wide">
            <tr>
              {['ID','Item Name','Category','Unit','On Hand','PAR Level','Reorder Pt','Supplier'].map(h => (
                <th key={h} className="text-left px-4 py-2.5 font-medium">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {filtered.map((r, i) => {
              const low = r.onHand <= r.reorder;
              return (
                <tr key={r.id} className={`border-t border-border ${i % 2 === 0 ? 'bg-card' : 'bg-background'} hover:bg-accent/40 cursor-pointer`}>
                  <td className="px-4 py-2.5 text-muted-foreground font-mono text-xs">{r.id}</td>
                  <td className="px-4 py-2.5 font-medium">{r.name}</td>
                  <td className="px-4 py-2.5 text-muted-foreground">{r.category}</td>
                  <td className="px-4 py-2.5 text-muted-foreground">{r.unit}</td>
                  <td className={`px-4 py-2.5 font-medium ${low ? 'text-destructive' : 'text-foreground'}`}>{r.onHand}</td>
                  <td className="px-4 py-2.5 text-muted-foreground">{r.par}</td>
                  <td className="px-4 py-2.5 text-muted-foreground">{r.reorder}</td>
                  <td className="px-4 py-2.5 text-muted-foreground">{r.supplier}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}