import { useEffect, useState, useMemo } from 'react';
import { base44 } from '@/api/base44Client';
import { Search, Package, RefreshCw } from 'lucide-react';
import { Input } from '@/components/ui/input';

export default function StockLookupTab() {
  const [items, setItems] = useState([]);
  const [balances, setBalances] = useState([]);
  const [locations, setLocations] = useState([]);
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [lastRefreshed, setLastRefreshed] = useState(new Date());

  const load = async () => {
    setLoading(true);
    const [inv, bal, locs] = await Promise.all([
      base44.entities.InventoryItem.filter({ environment: 'LIVE', is_active: true }, 'name', 500),
      base44.entities.ItemStockBalance.filter({ environment: 'LIVE' }, '-last_synced_at', 1000),
      base44.entities.Location.filter({ environment: 'LIVE', is_active: true }, 'name', 100),
    ]);
    setItems(inv || []);
    setBalances(bal || []);
    setLocations(locs || []);
    setLastRefreshed(new Date());
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const locationMap = useMemo(() => {
    const m = {};
    locations.forEach(l => { m[l.id] = l; });
    return m;
  }, [locations]);

  const results = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return [];

    const matchedItems = items.filter(item =>
      item.name.toLowerCase().includes(q) || item.sku.toLowerCase().includes(q)
    );

    return matchedItems.map(item => {
      const itemBalances = balances.filter(b => b.item_id === item.id || b.sku === item.sku);
      const totalStock = item.stock ?? 0;
      return { item, balances: itemBalances, totalStock };
    });
  }, [query, items, balances]);

  const hasQuery = query.trim().length > 0;

  return (
    <div className="space-y-4">
      <div className="border border-border rounded-2xl bg-card p-4 space-y-3">
        <div className="flex items-center gap-3">
          <div className="relative flex-1">
            <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={query}
              onChange={e => setQuery(e.target.value)}
              placeholder="Search by item name or SKU..."
              className="pl-9"
              autoFocus
            />
          </div>
          <button
            onClick={load}
            className="h-9 w-9 flex items-center justify-center rounded-xl border border-border bg-card hover:bg-muted text-muted-foreground"
            title="Refresh"
          >
            <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
          </button>
        </div>
        <p className="text-xs text-muted-foreground">
          Last refreshed: {lastRefreshed.toLocaleTimeString()} · Stock balances are read from ItemStockBalance records. Changes must be made through Adjustments, Transfers, Receiving, or Wastage.
        </p>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-16">
          <div className="w-6 h-6 border-2 border-muted border-t-foreground rounded-full animate-spin" />
        </div>
      ) : !hasQuery ? (
        <div className="border border-dashed border-border rounded-2xl p-12 text-center">
          <Search size={24} className="text-muted-foreground mx-auto mb-3" />
          <p className="text-sm text-muted-foreground">Type an item name or SKU above to look up stock across locations.</p>
        </div>
      ) : results.length === 0 ? (
        <div className="border border-border rounded-2xl p-8 text-center">
          <Package size={20} className="text-muted-foreground mx-auto mb-2" />
          <p className="text-sm text-muted-foreground">No items matched "{query}".</p>
        </div>
      ) : (
        <div className="space-y-3">
          {results.map(({ item, balances: itemBalances, totalStock }) => (
            <div key={item.id} className="border border-border rounded-2xl bg-card overflow-hidden">
              <div className="px-4 py-3 border-b border-border bg-muted/10 flex items-center justify-between gap-3">
                <div>
                  <p className="text-sm font-semibold text-foreground">{item.name}</p>
                  <p className="text-xs text-muted-foreground font-mono mt-0.5">{item.sku} · {item.unit || 'unit'}</p>
                </div>
                <div className="text-right shrink-0">
                  <p className="text-lg font-bold text-foreground">{totalStock}</p>
                  <p className="text-xs text-muted-foreground">total on hand</p>
                </div>
              </div>

              {itemBalances.length === 0 ? (
                <div className="px-4 py-3">
                  <p className="text-xs text-muted-foreground">No location-level stock balance records found. Stock is tracked at the item level only.</p>
                </div>
              ) : (
                <div className="divide-y divide-border">
                  {itemBalances.map(bal => {
                    const loc = locationMap[bal.location_id];
                    return (
                      <div key={bal.id} className="flex items-center justify-between px-4 py-2.5 gap-3">
                        <div className="min-w-0">
                          <p className="text-sm font-medium text-foreground">{bal.location_name || loc?.name || 'Unknown Location'}</p>
                          {bal.storage_area_name && <p className="text-xs text-muted-foreground">{bal.storage_area_name}</p>}
                        </div>
                        <div className="flex items-center gap-4 shrink-0">
                          <div className="text-right">
                            <p className="text-sm font-semibold text-foreground">{bal.on_hand_qty ?? 0}</p>
                            <p className="text-[10px] text-muted-foreground">on hand</p>
                          </div>
                          <StatusChip status={bal.balance_status} />
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function StatusChip({ status }) {
  const styles = {
    'Current': 'bg-emerald-50 text-emerald-700 border-emerald-200',
    'Stale': 'bg-amber-50 text-amber-700 border-amber-200',
    'Count Overdue': 'bg-orange-50 text-orange-700 border-orange-200',
    'Movement Mismatch': 'bg-red-50 text-red-700 border-red-200',
    'Rebuild Recommended': 'bg-slate-100 text-slate-600 border-slate-200',
  };
  if (!status) return null;
  return (
    <span className={`text-[10px] px-2 py-0.5 rounded-full border font-semibold ${styles[status] || styles['Current']}`}>
      {status}
    </span>
  );
}