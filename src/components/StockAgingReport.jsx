import { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { RefreshCw } from 'lucide-react';

export default function StockAgingReport() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  const loadData = async () => {
    setLoading(true);
    const items = await base44.entities.InventoryItem.list('-created_date', 500);
    const movements = await base44.entities.StockMovement.list('-created_date', 1000);

    const now = new Date();
    const aging = items.map(item => {
      const lastMove = movements.find(m => m.item_id === item.id);
      const lastDate = lastMove ? new Date(lastMove.created_date) : new Date(item.created_date);
      const daysOld = Math.floor((now - lastDate) / (1000 * 60 * 60 * 24));
      
      let category = 'Current';
      if (daysOld > 180) category = 'Old (6m+)';
      else if (daysOld > 90) category = 'Aging (3m+)';
      else if (daysOld > 30) category = 'Moderate (1m+)';

      return { ...item, daysOld, category, lastMove };
    });

    const grouped = aging.reduce((acc, item) => {
      acc[item.category] = (acc[item.category] || 0) + 1;
      return acc;
    }, {});

    setData({ aged_items: aging, summary: grouped });
    setLoading(false);
  };

  useEffect(() => { loadData(); }, []);

  if (loading) return <div className="p-8 text-center text-muted-foreground">Loading stock aging…</div>;

  const categories = [
    { name: 'Current', color: 'bg-green-50 border-green-200 text-green-700' },
    { name: 'Moderate (1m+)', color: 'bg-blue-50 border-blue-200 text-blue-700' },
    { name: 'Aging (3m+)', color: 'bg-amber-50 border-amber-200 text-amber-700' },
    { name: 'Old (6m+)', color: 'bg-red-50 border-red-200 text-red-700' },
  ];

  return (
    <div className="p-6 space-y-6">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {categories.map(cat => (
          <div key={cat.name} className={`rounded-xl border p-3 ${cat.color}`}>
            <p className="text-xs font-semibold uppercase tracking-wide">{cat.name}</p>
            <p className="text-2xl font-bold mt-1">{data?.summary[cat.name] || 0}</p>
          </div>
        ))}
      </div>

      {/* Aged Items */}
      <div className="rounded-xl border border-border bg-background overflow-hidden">
        <div className="px-4 py-3 border-b border-border bg-muted/25">
          <h3 className="text-sm font-semibold text-foreground">Stock Aging Detail</h3>
        </div>
        <div className="divide-y divide-border max-h-96 overflow-y-auto">
          {data?.aged_items.filter(i => i.daysOld > 30).map(item => {
            const colorMap = {
              'Moderate (1m+)': 'text-blue-700',
              'Aging (3m+)': 'text-amber-700',
              'Old (6m+)': 'text-red-700',
            };
            return (
              <div key={item.id} className="px-4 py-3 flex items-center justify-between">
                <div className="min-w-0">
                  <p className="text-sm font-medium text-foreground">{item.name}</p>
                  <p className="text-xs text-muted-foreground">{item.sku} • {item.stock} units</p>
                </div>
                <div className="text-right flex-shrink-0">
                  <p className={`text-sm font-semibold ${colorMap[item.category]}`}>{item.daysOld} days</p>
                  <p className="text-xs text-muted-foreground">{item.category}</p>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <button onClick={loadData} disabled={loading} className="flex items-center gap-2 h-9 px-4 text-sm rounded-lg border border-border hover:bg-muted disabled:opacity-50">
        <RefreshCw size={14} className={loading ? 'animate-spin' : ''} /> Refresh
      </button>
    </div>
  );
}