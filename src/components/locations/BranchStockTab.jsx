import { useEffect, useState, useMemo } from 'react';
import { base44 } from '@/api/base44Client';
import { MapPin, RefreshCw, AlertTriangle, Package } from 'lucide-react';
import { Input } from '@/components/ui/input';

export default function BranchStockTab() {
  const [locations, setLocations] = useState([]);
  const [balances, setBalances] = useState([]);
  const [items, setItems] = useState([]);
  const [selectedLocationId, setSelectedLocationId] = useState('');
  const [query, setQuery] = useState('');
  const [filter, setFilter] = useState('ALL');
  const [loading, setLoading] = useState(true);
  const [lastRefreshed, setLastRefreshed] = useState(new Date());

  const load = async () => {
    setLoading(true);
    const [locs, bal, inv] = await Promise.all([
      base44.entities.Location.filter({ environment: 'LIVE', is_active: true }, 'name', 100),
      base44.entities.ItemStockBalance.filter({ environment: 'LIVE' }, '-last_synced_at', 1000),
      base44.entities.InventoryItem.filter({ environment: 'LIVE', is_active: true }, 'name', 500),
    ]);
    setLocations(locs || []);
    setBalances(bal || []);
    setItems(inv || []);
    setLastRefreshed(new Date());
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  useEffect(() => {
    if (locations.length > 0 && !selectedLocationId) {
      const def = locations.find(l => l.is_default) || locations[0];
      if (def) setSelectedLocationId(def.id);
    }
  }, [locations]);

  const itemMap = useMemo(() => {
    const m = {};
    items.forEach(i => { m[i.id] = i; m[i.sku] = i; });
    return m;
  }, [items]);

  const locationBalances = useMemo(() => {
    return balances.filter(b => b.location_id === selectedLocationId);
  }, [balances, selectedLocationId]);

  const filteredBalances = useMemo(() => {
    const q = query.trim().toLowerCase();
    return locationBalances.filter(b => {
      const matchQ = !q || b.sku?.toLowerCase().includes(q) || b.item_name?.toLowerCase().includes(q);
      const item = itemMap[b.item_id] || itemMap[b.sku];
      const reorderPoint = item?.reorder_point ?? 0;
      const stock = b.on_hand_qty ?? 0;

      if (filter === 'LOW') return matchQ && stock > 0 && stock <= reorderPoint;
      if (filter === 'OUT') return matchQ && stock <= 0;
      if (filter === 'OK') return matchQ && stock > reorderPoint;
      return matchQ;
    });
  }, [locationBalances, query, filter, itemMap]);

  const summary = useMemo(() => {
    const total = locationBalances.length;
    const out = locationBalances.filter(b => (b.on_hand_qty ?? 0) <= 0).length;
    const low = locationBalances.filter(b => {
      const item = itemMap[b.item_id] || itemMap[b.sku];
      const rp = item?.reorder_point ?? 0;
      const stock = b.on_hand_qty ?? 0;
      return stock > 0 && stock <= rp;
    }).length;
    return { total, out, low, ok: total - out - low };
  }, [locationBalances, itemMap]);

  const selectedLocation = locations.find(l => l.id === selectedLocationId);

  return (
    <div className="space-y-4">
      {/* Location selector */}
      <div className="border border-border rounded-2xl bg-card p-4 space-y-3">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 items-end">
          <div className="lg:col-span-2">
            <label className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">Branch / Location</label>
            <select
              value={selectedLocationId}
              onChange={e => setSelectedLocationId(e.target.value)}
              className="mt-1 h-9 w-full rounded-xl border border-input bg-background px-3 text-sm"
            >
              <option value="">Select a location...</option>
              {locations.map(l => (
                <option key={l.id} value={l.id}>{l.name} ({l.location_code})</option>
              ))}
            </select>
          </div>
          <div>
            <label className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">Filter</label>
            <select
              value={filter}
              onChange={e => setFilter(e.target.value)}
              className="mt-1 h-9 w-full rounded-xl border border-input bg-background px-3 text-sm"
            >
              <option value="ALL">All Items</option>
              <option value="LOW">Low Stock</option>
              <option value="OUT">Out of Stock</option>
              <option value="OK">Healthy</option>
            </select>
          </div>
          <button
            onClick={load}
            className="h-9 flex items-center justify-center gap-1.5 rounded-xl border border-border bg-card hover:bg-muted text-sm text-muted-foreground px-3"
          >
            <RefreshCw size={13} className={loading ? 'animate-spin' : ''} /> Refresh
          </button>
        </div>

        <div className="relative">
          <Package size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={query}
            onChange={e => setQuery(e.target.value)}
            placeholder="Search item name or SKU..."
            className="pl-9"
          />
        </div>

        <p className="text-xs text-muted-foreground">Last refreshed: {lastRefreshed.toLocaleTimeString()}</p>
      </div>

      {/* Summary chips */}
      {selectedLocationId && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[
            { label: 'Total Items', value: summary.total, tone: 'default' },
            { label: 'Out of Stock', value: summary.out, tone: 'red' },
            { label: 'Low Stock', value: summary.low, tone: 'amber' },
            { label: 'Healthy', value: summary.ok, tone: 'emerald' },
          ].map(s => (
            <div key={s.label} className="border border-border rounded-xl bg-card px-4 py-3">
              <p className="text-xs text-muted-foreground">{s.label}</p>
              <p className={`text-2xl font-bold mt-0.5 ${
                s.tone === 'red' ? 'text-red-600' :
                s.tone === 'amber' ? 'text-amber-600' :
                s.tone === 'emerald' ? 'text-emerald-600' :
                'text-foreground'
              }`}>{s.value}</p>
            </div>
          ))}
        </div>
      )}

      {/* Stock table */}
      {loading ? (
        <div className="flex items-center justify-center py-16">
          <div className="w-6 h-6 border-2 border-muted border-t-foreground rounded-full animate-spin" />
        </div>
      ) : !selectedLocationId ? (
        <div className="border border-dashed border-border rounded-2xl p-12 text-center">
          <MapPin size={24} className="text-muted-foreground mx-auto mb-3" />
          <p className="text-sm text-muted-foreground">Select a location above to view its stock.</p>
        </div>
      ) : filteredBalances.length === 0 ? (
        <div className="border border-border rounded-2xl p-8 text-center">
          <Package size={20} className="text-muted-foreground mx-auto mb-2" />
          <p className="text-sm text-muted-foreground">
            {locationBalances.length === 0
              ? `No stock balance records found for ${selectedLocation?.name || 'this location'}. Balance records are created when stock movements include location context.`
              : 'No items match the current filters.'}
          </p>
        </div>
      ) : (
        <div className="border border-border rounded-2xl bg-card overflow-hidden">
          <div className="px-4 py-3 border-b border-border bg-muted/10">
            <p className="text-sm font-semibold text-foreground">{selectedLocation?.name}</p>
            <p className="text-xs text-muted-foreground mt-0.5">{filteredBalances.length} item{filteredBalances.length !== 1 ? 's' : ''} shown</p>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm min-w-[600px]">
              <thead className="bg-muted/20 border-b border-border text-[11px] uppercase tracking-[0.16em] text-muted-foreground">
                <tr>
                  <th className="text-left px-4 py-2.5 font-semibold">Item / SKU</th>
                  <th className="text-left px-4 py-2.5 font-semibold">Storage Area</th>
                  <th className="text-right px-4 py-2.5 font-semibold">On Hand</th>
                  <th className="text-right px-4 py-2.5 font-semibold">Reorder Point</th>
                  <th className="text-left px-4 py-2.5 font-semibold">Status</th>
                  <th className="text-left px-4 py-2.5 font-semibold">Balance Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {filteredBalances.map(b => {
                  const item = itemMap[b.item_id] || itemMap[b.sku];
                  const rp = item?.reorder_point ?? 0;
                  const stock = b.on_hand_qty ?? 0;
                  const stockStatus = stock <= 0 ? 'out' : rp > 0 && stock <= rp ? 'low' : 'ok';

                  return (
                    <tr key={b.id} className="bg-card hover:bg-muted/10">
                      <td className="px-4 py-2.5">
                        <p className="font-medium text-foreground">{b.item_name}</p>
                        <p className="text-xs text-muted-foreground font-mono">{b.sku}</p>
                      </td>
                      <td className="px-4 py-2.5 text-muted-foreground text-xs">{b.storage_area_name || '—'}</td>
                      <td className="px-4 py-2.5 text-right font-semibold text-foreground">{stock}</td>
                      <td className="px-4 py-2.5 text-right text-muted-foreground">{rp || '—'}</td>
                      <td className="px-4 py-2.5">
                        {stockStatus === 'out' && (
                          <span className="inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-full bg-red-50 text-red-700 border border-red-200">
                            <AlertTriangle size={9} /> Out of Stock
                          </span>
                        )}
                        {stockStatus === 'low' && (
                          <span className="inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-full bg-amber-50 text-amber-700 border border-amber-200">
                            <AlertTriangle size={9} /> Low Stock
                          </span>
                        )}
                        {stockStatus === 'ok' && (
                          <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
                            Healthy
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-2.5">
                        <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border ${
                          b.balance_status === 'Current' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' :
                          b.balance_status === 'Stale' ? 'bg-amber-50 text-amber-700 border-amber-200' :
                          'bg-slate-100 text-slate-600 border-slate-200'
                        }`}>
                          {b.balance_status || 'Current'}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}