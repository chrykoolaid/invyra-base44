import { useState } from 'react';
import { RefreshCcw, ShoppingCart } from 'lucide-react';

const suggestions = [
  { id: 'LIN-001', name: 'Bath Towel 27×54',  supplier: 'CleanTex',   onHand: 840, par: 1000, reorder: 200, suggested: 300, unitCost: 4.50 },
  { id: 'LIN-004', name: 'Bed Sheet Queen',   supplier: 'LinenPro',   onHand: 310, par: 500,  reorder: 100, suggested: 200, unitCost: 12.00 },
  { id: 'LIN-006', name: 'Bath Mat 20×30',    supplier: 'MatSource',  onHand: 90,  par: 200,  reorder: 50,  suggested: 120, unitCost: 6.75 },
  { id: 'LIN-008', name: 'Detergent 5-Gal',   supplier: 'ChemSupply', onHand: 12,  par: 20,   reorder: 5,   suggested: 10,  unitCost: 38.00 },
];

export default function ReorderReview() {
  const [qtys, setQtys] = useState(() => Object.fromEntries(suggestions.map(s => [s.id, s.suggested])));
  const [checked, setChecked] = useState(() => Object.fromEntries(suggestions.map(s => [s.id, true])));

  const total = suggestions.filter(s => checked[s.id]).reduce((sum, s) => sum + (qtys[s.id] || 0) * s.unitCost, 0);

  return (
    <div className="px-8 py-6">
      <h1 className="text-xl font-semibold text-foreground mb-5">Reorder Review</h1>

      <div className="flex items-center gap-3 mb-5">
        <button className="flex items-center gap-1.5 text-sm border border-border bg-card px-3 py-1.5 rounded hover:bg-accent transition-colors">
          <RefreshCcw size={14} /> Refresh Suggestions
        </button>
        <button className="flex items-center gap-1.5 text-sm bg-primary text-primary-foreground px-3 py-1.5 rounded hover:opacity-90 transition-opacity">
          <ShoppingCart size={14} /> Place Selected Orders
        </button>
        <span className="ml-auto text-sm text-muted-foreground">Est. total: <strong className="text-foreground">${total.toFixed(2)}</strong></span>
      </div>

      <div className="border border-border rounded overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-muted text-muted-foreground text-xs uppercase tracking-wide">
            <tr>
              <th className="px-4 py-2.5 w-8"></th>
              {['ID','Item','Supplier','On Hand','PAR','Reorder Pt','Order Qty','Unit Cost','Line Total'].map(h => (
                <th key={h} className="text-left px-4 py-2.5 font-medium">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {suggestions.map((r, i) => (
              <tr key={r.id} className={`border-t border-border ${i % 2 === 0 ? 'bg-card' : 'bg-background'} ${!checked[r.id] ? 'opacity-50' : ''}`}>
                <td className="px-4 py-2.5">
                  <input type="checkbox" checked={checked[r.id]} onChange={e => setChecked(p => ({...p,[r.id]:e.target.checked}))} />
                </td>
                <td className="px-4 py-2.5 font-mono text-xs text-muted-foreground">{r.id}</td>
                <td className="px-4 py-2.5 font-medium">{r.name}</td>
                <td className="px-4 py-2.5 text-muted-foreground">{r.supplier}</td>
                <td className="px-4 py-2.5 text-muted-foreground">{r.onHand}</td>
                <td className="px-4 py-2.5 text-muted-foreground">{r.par}</td>
                <td className="px-4 py-2.5 text-muted-foreground">{r.reorder}</td>
                <td className="px-4 py-2.5">
                  <input
                    type="number"
                    value={qtys[r.id]}
                    min={0}
                    onChange={e => setQtys(p => ({...p,[r.id]: parseInt(e.target.value)||0}))}
                    className="w-20 border border-border rounded px-2 py-1 text-sm focus:outline-none focus:ring-1 focus:ring-ring"
                  />
                </td>
                <td className="px-4 py-2.5 text-muted-foreground">${r.unitCost.toFixed(2)}</td>
                <td className="px-4 py-2.5 font-medium">${((qtys[r.id]||0)*r.unitCost).toFixed(2)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}