import { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { envFilter } from '@/lib/envFilter';
import { RefreshCw } from 'lucide-react';

export default function CostAnalysisReport() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  const loadData = async () => {
    setLoading(true);
    const items = await base44.entities.InventoryItem.filter(envFilter(), '-cost_per_unit', 500);
    
    const analysis = items.reduce((acc, item) => {
      const inventory_value = (item.stock || 0) * (item.cost_per_unit || 0);
      acc.total_inventory_value += inventory_value;
      acc.items_count++;
      
      if (inventory_value > 5000) acc.high_value.push(item);
      if ((item.stock || 0) <= (item.reorder_point || 0)) acc.slow_moving.push(item);
      
      return acc;
    }, { total_inventory_value: 0, items_count: 0, high_value: [], slow_moving: [] });

    setData(analysis);
    setLoading(false);
  };

  useEffect(() => { loadData(); }, []);

  if (loading) return <div className="p-8 text-center text-muted-foreground">Loading cost analysis…</div>;

  return (
    <div className="space-y-5">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="rounded-xl border border-border bg-background p-4">
          <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Total Inventory Value</p>
          <p className="text-3xl font-bold text-foreground mt-2">₱{data?.total_inventory_value.toLocaleString('en-PH', {maximumFractionDigits: 0})}</p>
          <p className="text-xs text-muted-foreground mt-1">{data?.items_count} SKUs tracked</p>
        </div>
        <div className="rounded-xl border border-border bg-background p-4">
          <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">High-Value Items</p>
          <p className="text-3xl font-bold text-foreground mt-2">{data?.high_value.length}</p>
          <p className="text-xs text-muted-foreground mt-1">Cost &gt; ₱5,000 each</p>
        </div>
        <div className="rounded-xl border border-border bg-background p-4">
          <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Slow Moving</p>
          <p className="text-3xl font-bold text-amber-600 mt-2">{data?.slow_moving.length}</p>
          <p className="text-xs text-muted-foreground mt-1">At or below reorder point</p>
        </div>
      </div>

      {/* High-Value Items */}
      {data?.high_value.length > 0 && (
        <div className="rounded-xl border border-border bg-background overflow-hidden">
          <div className="px-4 py-3 border-b border-border bg-muted/25">
            <h3 className="text-sm font-semibold text-foreground">High-Value Items (Top 10)</h3>
          </div>
          <div className="divide-y divide-border">
            {data.high_value.slice(0, 10).map(item => {
              const value = (item.stock || 0) * (item.cost_per_unit || 0);
              return (
                <div key={item.id} className="px-4 py-3 flex items-center justify-between">
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-foreground">{item.name}</p>
                    <p className="text-xs text-muted-foreground">{item.sku}</p>
                  </div>
                  <div className="text-right flex-shrink-0">
                    <p className="text-sm font-mono font-semibold text-foreground">₱{value.toLocaleString('en-PH', {maximumFractionDigits: 0})}</p>
                    <p className="text-xs text-muted-foreground">{item.stock} × ₱{item.cost_per_unit}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      <button onClick={loadData} disabled={loading} className="flex items-center gap-2 h-9 px-4 text-sm rounded-lg border border-border hover:bg-muted disabled:opacity-50">
        <RefreshCw size={14} className={loading ? 'animate-spin' : ''} /> Refresh
      </button>
    </div>
  );
}