import { useState } from 'react';
import { PackageCheck } from 'lucide-react';

const pending = [
  { id: 'ORD-2024-042', supplier: 'LinenPro',   item: 'Bed Sheet Queen',  ordered: 200, received: null },
  { id: 'ORD-2024-042', supplier: 'LinenPro',   item: 'Pillow Case Std',  ordered: 160, received: null },
  { id: 'ORD-2024-043', supplier: 'MatSource',  item: 'Bath Mat 20×30',   ordered: 120, received: null },
  { id: 'ORD-2024-044', supplier: 'ChemSupply', item: 'Detergent 5-Gal',  ordered: 10,  received: null },
];

export default function Receiving() {
  const [rows, setRows] = useState(pending.map(r => ({...r, received: '', condition: 'Good', notes: ''})));

  const update = (i, field, val) => setRows(prev => prev.map((r, idx) => idx === i ? {...r, [field]: val} : r));

  return (
    <div className="px-8 py-6">
      <h1 className="text-xl font-semibold text-foreground mb-5">Receiving</h1>

      <div className="flex items-center gap-3 mb-5">
        <span className="text-sm text-muted-foreground">{rows.length} line items pending receipt</span>
        <button className="ml-auto flex items-center gap-1.5 text-sm bg-primary text-primary-foreground px-3 py-1.5 rounded hover:opacity-90 transition-opacity">
          <PackageCheck size={14} /> Confirm All Received
        </button>
      </div>

      <div className="border border-border rounded overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-muted text-muted-foreground text-xs uppercase tracking-wide">
            <tr>
              {['Order ID','Supplier','Item','Ordered','Qty Received','Condition','Notes',''].map(h => (
                <th key={h} className="text-left px-4 py-2.5 font-medium">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((r, i) => (
              <tr key={i} className={`border-t border-border ${i % 2 === 0 ? 'bg-card' : 'bg-background'}`}>
                <td className="px-4 py-2.5 font-mono text-xs text-muted-foreground">{r.id}</td>
                <td className="px-4 py-2.5 text-muted-foreground">{r.supplier}</td>
                <td className="px-4 py-2.5 font-medium">{r.item}</td>
                <td className="px-4 py-2.5 text-muted-foreground">{r.ordered}</td>
                <td className="px-4 py-2.5">
                  <input
                    type="number"
                    value={r.received}
                    onChange={e => update(i, 'received', e.target.value)}
                    placeholder={String(r.ordered)}
                    className="w-20 border border-border rounded px-2 py-1 text-sm focus:outline-none focus:ring-1 focus:ring-ring"
                  />
                </td>
                <td className="px-4 py-2.5">
                  <select
                    value={r.condition}
                    onChange={e => update(i, 'condition', e.target.value)}
                    className="text-sm border border-border rounded px-2 py-1 bg-card focus:outline-none"
                  >
                    <option>Good</option>
                    <option>Damaged</option>
                    <option>Partial</option>
                  </select>
                </td>
                <td className="px-4 py-2.5">
                  <input
                    value={r.notes}
                    onChange={e => update(i, 'notes', e.target.value)}
                    placeholder="Optional note…"
                    className="border border-border rounded px-2 py-1 text-sm w-40 focus:outline-none focus:ring-1 focus:ring-ring"
                  />
                </td>
                <td className="px-4 py-2.5">
                  <button className="text-xs text-primary hover:underline">Confirm</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}