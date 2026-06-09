/** Shared read-only inventory snapshot used across training dashboards. */
import { useTraining } from '@/lib/TrainingContext';

export default function TrainingInventoryTable({ highlightLow = false }) {
  const { items } = useTraining();

  return (
    <div className="border border-border rounded overflow-hidden bg-white">
      <table className="w-full text-sm">
        <thead className="bg-muted text-muted-foreground text-xs uppercase tracking-wide">
          <tr>
            {['SKU', 'Item', 'Stock', 'Unit', 'Reorder Point', 'Status'].map(h => (
              <th key={h} className="text-left px-3 py-2 font-medium">{h}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {items.map((item, i) => {
            const isOut  = item.stock === 0;
            const isLow  = item.reorder_point != null && item.stock > 0 && item.stock <= item.reorder_point;
            const rowBg  = isOut ? 'bg-red-50' : isLow && highlightLow ? 'bg-amber-50' : i % 2 === 0 ? 'bg-white' : 'bg-slate-50/50';
            return (
              <tr key={item.id} className={`border-t border-border ${rowBg}`}>
                <td className="px-3 py-2 font-mono text-xs text-muted-foreground">{item.sku}</td>
                <td className="px-3 py-2 font-medium">{item.name}</td>
                <td className="px-3 py-2 font-mono font-semibold">{item.stock}</td>
                <td className="px-3 py-2 text-muted-foreground">{item.unit}</td>
                <td className="px-3 py-2 text-muted-foreground">{item.reorder_point ?? '—'}</td>
                <td className="px-3 py-2">
                  {isOut  && <span className="text-xs px-2 py-0.5 rounded-full bg-red-100 text-red-700 border border-red-200 font-medium">Out of Stock</span>}
                  {isLow  && !isOut && <span className="text-xs px-2 py-0.5 rounded-full bg-amber-100 text-amber-700 border border-amber-200 font-medium">Low Stock</span>}
                  {!isOut && !isLow && <span className="text-xs px-2 py-0.5 rounded-full bg-green-100 text-green-700 border border-green-200 font-medium">OK</span>}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}