import { useState } from 'react';
import { Calculator, TrendingDown } from 'lucide-react';

export default function SimulationPreview({ recipes, inventoryItems }) {
  const [qty, setQty] = useState(10);

  if (!recipes || recipes.length === 0) return null;

  const lines = recipes.map(r => {
    const item = inventoryItems.find(i => i.id === r.item_id);
    const stock = item?.stock ?? 0;
    const totalNeeded = r.qty_consumed * qty;
    const isSafe = stock >= totalNeeded;
    const runsPossible = r.qty_consumed > 0 ? Math.floor(stock / r.qty_consumed) : null;

    return {
      ...r,
      stock,
      totalNeeded,
      isSafe,
      runsPossible,
    };
  });

  return (
    <div className="border-t border-border px-5 py-4 bg-muted/20">
      <div className="flex items-center justify-between mb-3">
        <p className="text-xs font-semibold text-foreground flex items-center gap-1.5">
          <Calculator size={13} /> Stock Simulation
        </p>
        <div className="flex items-center gap-2">
          <span className="text-xs text-muted-foreground">Runs:</span>
          <input
            type="number"
            min={1}
            max={9999}
            value={qty}
            onChange={e => setQty(Math.max(1, Number(e.target.value)))}
            className="w-16 h-7 rounded-lg border border-border bg-card px-2 text-xs text-center focus:outline-none focus:ring-2 focus:ring-ring"
          />
        </div>
      </div>
      <div className="space-y-1.5">
        {lines.map(l => (
          <div key={l.id} className={`rounded-lg border px-3 py-2 flex items-center justify-between gap-3 text-xs ${
            l.isSafe ? 'border-green-200 bg-green-50' : 'border-red-200 bg-red-50'
          }`}>
            <div className="min-w-0">
              <span className="font-medium text-foreground">{l.item_name}</span>
              <span className="text-muted-foreground ml-2">needs {l.totalNeeded.toFixed(3)} {l.unit}</span>
            </div>
            <div className="flex items-center gap-1.5 shrink-0">
              {!l.isSafe && <TrendingDown size={12} className="text-red-600" />}
              <span className={`font-semibold ${l.isSafe ? 'text-green-700' : 'text-red-700'}`}>
                {l.isSafe ? `Safe (${(l.stock - l.totalNeeded).toFixed(2)} left)` : `Shortage! Only ${l.stock} in stock`}
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}