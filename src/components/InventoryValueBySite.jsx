import { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { envFilter } from '@/lib/envFilter';
import { RefreshCw } from 'lucide-react';

export default function InventoryValueBySite() {
  const [siteValues, setSiteValues] = useState([]);
  const [loading, setLoading] = useState(true);
  const [totalValue, setTotalValue] = useState(0);

  const loadData = async () => {
    setLoading(true);
    const [items, sites] = await Promise.all([
      base44.entities.InventoryItem.filter(envFilter(), '', 500),
      base44.entities.Site.list('', 100),
    ]);

    // Calculate value per site
    const siteMap = {};
    sites.forEach(site => {
      siteMap[site.id] = { ...site, total_value: 0, item_count: 0, items: [] };
    });

    let total = 0;
    items.forEach(item => {
      if (item.site_id && siteMap[item.site_id]) {
        const itemValue = (item.stock || 0) * (item.cost_per_unit || 0);
        siteMap[item.site_id].total_value += itemValue;
        siteMap[item.site_id].item_count++;
        siteMap[item.site_id].items.push({
          name: item.name,
          sku: item.sku,
          stock: item.stock || 0,
          cost: item.cost_per_unit || 0,
          value: itemValue,
        });
        total += itemValue;
      }
    });

    const sorted = Object.values(siteMap)
      .filter(s => s.total_value > 0)
      .sort((a, b) => b.total_value - a.total_value);

    setSiteValues(sorted);
    setTotalValue(total);
    setLoading(false);
  };

  useEffect(() => { loadData(); }, []);

  if (loading) return <div className="p-8 text-center text-muted-foreground">Loading site valuation…</div>;

  const topSite = siteValues[0];
  const avgValue = siteValues.length > 0 ? totalValue / siteValues.length : 0;

  return (
    <div className="space-y-6">
      {/* Overview Cards */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="rounded-xl border border-border bg-background p-4">
          <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Total Inventory Value</p>
          <p className="text-3xl font-bold text-foreground mt-2">₱{totalValue.toLocaleString('en-PH', {maximumFractionDigits: 0})}</p>
          <p className="text-xs text-muted-foreground mt-1">{siteValues.length} sites</p>
        </div>
        <div className="rounded-xl border border-border bg-background p-4">
          <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Highest Value Site</p>
          <p className="text-2xl font-bold text-foreground mt-2">{topSite?.name}</p>
          <p className="text-sm font-mono text-muted-foreground mt-1">₱{topSite?.total_value.toLocaleString('en-PH', {maximumFractionDigits: 0})}</p>
        </div>
        <div className="rounded-xl border border-border bg-background p-4">
          <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Average Site Value</p>
          <p className="text-3xl font-bold text-foreground mt-2">₱{avgValue.toLocaleString('en-PH', {maximumFractionDigits: 0})}</p>
          <p className="text-xs text-muted-foreground mt-1">Per location</p>
        </div>
      </div>

      {/* Per-Site Breakdown */}
      <div className="rounded-xl border border-border bg-card overflow-hidden">
        <div className="px-4 py-3 border-b border-border bg-muted/25 flex items-center justify-between">
          <h3 className="text-sm font-semibold text-foreground">Inventory Value by Site</h3>
          <button onClick={loadData} disabled={loading} className="flex items-center gap-1 h-8 px-3 text-xs rounded border border-border hover:bg-muted disabled:opacity-50">
            <RefreshCw size={12} className={loading ? 'animate-spin' : ''} />
          </button>
        </div>
        <div className="divide-y divide-border">
          {siteValues.map((site, idx) => {
            const percentage = (site.total_value / totalValue) * 100;
            const trend = idx === 0 ? 'up' : 'neutral';
            return (
              <div key={site.id} className="p-4 hover:bg-muted/30 transition-colors">
                <div className="flex items-start justify-between gap-4 mb-3">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-foreground">{site.name}</p>
                    <p className="text-xs text-muted-foreground">{site.address}</p>
                  </div>
                  <div className="text-right flex-shrink-0">
                    <p className="text-lg font-bold text-foreground">₱{site.total_value.toLocaleString('en-PH', {maximumFractionDigits: 0})}</p>
                    <p className="text-xs text-muted-foreground">{percentage.toFixed(1)}% of total</p>
                  </div>
                </div>

                {/* Progress bar */}
                <div className="w-full h-2 rounded-full bg-muted overflow-hidden mb-2">
                  <div
                    className="h-full bg-primary transition-all"
                    style={{ width: `${percentage}%` }}
                  />
                </div>

                {/* Details */}
                <div className="grid grid-cols-3 gap-3 text-xs">
                  <div className="rounded-lg bg-muted/30 p-2">
                    <p className="text-muted-foreground font-medium">Items</p>
                    <p className="font-bold text-foreground">{site.item_count}</p>
                  </div>
                  <div className="rounded-lg bg-muted/30 p-2">
                    <p className="text-muted-foreground font-medium">Avg Value/Item</p>
                    <p className="font-bold text-foreground">₱{(site.total_value / Math.max(site.item_count, 1)).toLocaleString('en-PH', {maximumFractionDigits: 0})}</p>
                  </div>
                  <div className="rounded-lg bg-muted/30 p-2">
                    <p className="text-muted-foreground font-medium">Timezone</p>
                    <p className="font-bold text-foreground text-[10px]">{site.timezone}</p>
                  </div>
                </div>

                {/* Top Items */}
                {site.items.length > 0 && (
                  <div className="mt-3 pt-3 border-t border-border/50 space-y-1">
                    <p className="text-[10px] font-semibold uppercase text-muted-foreground">Top Items by Value</p>
                    {site.items.sort((a, b) => b.value - a.value).slice(0, 3).map((item, i) => (
                      <div key={i} className="flex items-center justify-between text-xs">
                        <span className="text-muted-foreground truncate">{item.sku} • {item.name}</span>
                        <span className="font-mono text-foreground ml-2">₱{item.value.toLocaleString('en-PH', {maximumFractionDigits: 0})}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}