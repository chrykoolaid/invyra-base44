import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
import { envFilter } from '@/lib/envFilter';
import { ArrowRight, Package, RefreshCw, Search } from 'lucide-react';
import { Input } from '@/components/ui/input';

const getItemBarcode = (item) => item.barcode || item.primary_barcode || item.item_barcode || item.ean || '';

const toQty = (value) => Number(value ?? 0) || 0;

const getAvailableQty = (balance) => {
  if (balance.available_qty !== undefined && balance.available_qty !== null) return toQty(balance.available_qty);
  return Math.max(0, toQty(balance.on_hand_qty) - toQty(balance.reserved_qty ?? balance.committed_qty));
};

const getLastMovement = (balance) => {
  const value = balance.last_movement_at || balance.last_synced_at || balance.updated_date || balance.created_date;
  if (!value) return '—';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '—';
  return date.toLocaleDateString();
};

const getStockStatus = (balance, item) => {
  const available = getAvailableQty(balance);
  const onHand = toQty(balance.on_hand_qty);
  const reorderPoint = toQty(item?.reorder_point);
  if (onHand <= 0 || available <= 0) return 'Unavailable';
  if (reorderPoint > 0 && available <= reorderPoint) return 'Low';
  if (toQty(balance.reserved_qty ?? balance.committed_qty) > 0) return 'Reserved';
  if (balance.balance_status === 'Stale') return 'Stale Balance';
  return 'Available';
};

const getSuggestedAction = (status, balance) => {
  if (status === 'Unavailable') return 'No action';
  if (status === 'Low') return 'Reorder for this branch';
  if (status === 'Stale Balance') return 'Check shelf';
  if (balance.expiry_status || balance.near_expiry_qty > 0) return 'Review expiry';
  if (getAvailableQty(balance) > 0) return 'Transfer from this branch';
  return 'No action';
};

function StatusChip({ status }) {
  const styles = {
    Available: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    Low: 'bg-amber-50 text-amber-700 border-amber-200',
    Reserved: 'bg-blue-50 text-blue-700 border-blue-200',
    Unavailable: 'bg-red-50 text-red-700 border-red-200',
    'Stale Balance': 'bg-slate-100 text-slate-600 border-slate-200',
    'Unknown Location': 'bg-slate-100 text-slate-600 border-slate-200',
  };
  return (
    <span className={`text-[10px] px-2 py-0.5 rounded-full border font-semibold ${styles[status] || styles.Available}`}>
      {status}
    </span>
  );
}

function MetricCard({ label, value }) {
  return (
    <div className="border border-border rounded-xl bg-background px-3 py-2">
      <p className="text-[11px] text-muted-foreground">{label}</p>
      <p className="text-lg font-bold text-foreground mt-0.5">{value}</p>
    </div>
  );
}

function NavigationButton({ to, children }) {
  return (
    <Link
      to={to}
      className="inline-flex items-center gap-1.5 h-8 px-3 text-xs rounded-lg border border-border bg-background hover:bg-muted text-muted-foreground"
    >
      {children} <ArrowRight size={11} />
    </Link>
  );
}

export default function StockLookupTab() {
  const [items, setItems] = useState([]);
  const [balances, setBalances] = useState([]);
  const [locations, setLocations] = useState([]);
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [lastRefreshed, setLastRefreshed] = useState(new Date());

  const load = async () => {
    setLoading(true);
    try {
      const [inv, bal, locs] = await Promise.all([
        base44.entities.InventoryItem.filter({ ...envFilter(), is_active: true }, 'name', 500),
        base44.entities.ItemStockBalance.filter(envFilter(), '-last_synced_at', 1000),
        base44.entities.Location.filter({ ...envFilter(), is_active: true }, 'name', 100),
      ]);
      setItems(inv || []);
      setBalances(bal || []);
      setLocations(locs || []);
      setLastRefreshed(new Date());
    } catch (err) {
      console.error('Failed to load stock lookup:', err);
    } finally {
      setLoading(false);
    }
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

    const matchedItems = items.filter(item => {
      const name = String(item.name || '').toLowerCase();
      const sku = String(item.sku || '').toLowerCase();
      const barcode = String(getItemBarcode(item)).toLowerCase();
      return name.includes(q) || sku.includes(q) || barcode.includes(q);
    });

    return matchedItems.map(item => {
      const itemBalances = balances.filter(b => b.item_id === item.id || b.sku === item.sku);
      const totalOnHandFromBalances = itemBalances.reduce((sum, b) => sum + toQty(b.on_hand_qty), 0);
      const totalAvailableFromBalances = itemBalances.reduce((sum, b) => sum + getAvailableQty(b), 0);
      const totalOnHand = itemBalances.length > 0 ? totalOnHandFromBalances : toQty(item.stock);
      const totalAvailable = itemBalances.length > 0 ? totalAvailableFromBalances : totalOnHand;
      const locationCount = new Set(itemBalances.filter(b => b.location_id).map(b => b.location_id)).size;
      const hasBatchOrExpiry = Boolean(item.expiry_date || item.track_expiry || item.batch_tracking || item.lot_tracking || item.tracking_type === 'Batch/Expiry');
      return { item, balances: itemBalances, totalOnHand, totalAvailable, locationCount, hasBatchOrExpiry };
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
              placeholder="Search by SKU, item name, or barcode..."
              className="pl-9"
              autoFocus
            />
          </div>
          <button
            onClick={load}
            className="h-9 w-9 flex items-center justify-center rounded-xl border border-border bg-card hover:bg-muted text-muted-foreground"
            title="Refresh balances"
          >
            <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
          </button>
        </div>
        <p className="text-xs text-muted-foreground">
          Last refreshed: {lastRefreshed.toLocaleTimeString()} · Stock balances are read from ItemStockBalance records. Locations gives guidance only; it does not change stock.
        </p>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-16">
          <div className="w-6 h-6 border-2 border-muted border-t-foreground rounded-full animate-spin" />
        </div>
      ) : !hasQuery ? (
        <div className="border border-dashed border-border rounded-2xl p-12 text-center bg-card">
          <Search size={24} className="text-muted-foreground mx-auto mb-3" />
          <p className="text-sm font-medium text-foreground">Search for an item or SKU to view stock across locations.</p>
          <p className="text-xs text-muted-foreground mt-1">You can search by SKU, item name, or barcode when available.</p>
        </div>
      ) : results.length === 0 ? (
        <div className="border border-border rounded-2xl p-8 text-center bg-card">
          <Package size={20} className="text-muted-foreground mx-auto mb-2" />
          <p className="text-sm text-muted-foreground">No stock records found for this item across active locations.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {results.map(({ item, balances: itemBalances, totalOnHand, totalAvailable, locationCount, hasBatchOrExpiry }) => (
            <div key={item.id} className="border border-border rounded-2xl bg-card overflow-hidden">
              <div className="px-4 py-3 border-b border-border bg-muted/10 space-y-3">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-sm font-semibold text-foreground">{item.name}</p>
                    <p className="text-xs text-muted-foreground font-mono mt-0.5">
                      SKU: {item.sku || '—'}{getItemBarcode(item) ? ` · Barcode: ${getItemBarcode(item)}` : ''} · Unit: {item.unit || 'unit'}
                    </p>
                  </div>
                  <span className="text-[10px] px-2 py-0.5 rounded-full border border-border bg-background text-muted-foreground font-semibold">
                    {hasBatchOrExpiry ? 'Batch/Expiry indicator' : 'No batch/expiry flag'}
                  </span>
                </div>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                  <MetricCard label="Total On Hand" value={totalOnHand} />
                  <MetricCard label="Total Available" value={totalAvailable} />
                  <MetricCard label="Locations Carrying Stock" value={locationCount} />
                  <MetricCard label="Balance Rows" value={itemBalances.length} />
                </div>
                <div className="flex flex-wrap gap-2">
                  <NavigationButton to="/Inventory">View Item Details</NavigationButton>
                  <NavigationButton to="/Movements">View Movements</NavigationButton>
                  <NavigationButton to="/Transfers">Start Transfer</NavigationButton>
                  <NavigationButton to="/ReorderReview">Open Reorder Review</NavigationButton>
                </div>
              </div>

              {itemBalances.length === 0 ? (
                <div className="px-4 py-5">
                  <p className="text-sm text-muted-foreground">No stock records found for this item across active locations.</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm min-w-[860px]">
                    <thead className="bg-muted/20 border-b border-border text-[11px] uppercase tracking-[0.16em] text-muted-foreground">
                      <tr>
                        <th className="text-left px-4 py-2.5 font-semibold">Location</th>
                        <th className="text-left px-4 py-2.5 font-semibold">Storage Area</th>
                        <th className="text-right px-4 py-2.5 font-semibold">On Hand</th>
                        <th className="text-right px-4 py-2.5 font-semibold">Reserved / Committed</th>
                        <th className="text-right px-4 py-2.5 font-semibold">Available</th>
                        <th className="text-left px-4 py-2.5 font-semibold">Status</th>
                        <th className="text-left px-4 py-2.5 font-semibold">Last Movement</th>
                        <th className="text-left px-4 py-2.5 font-semibold">Suggested Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border">
                      {itemBalances.map(balance => {
                        const loc = locationMap[balance.location_id];
                        const status = loc ? getStockStatus(balance, item) : 'Unknown Location';
                        return (
                          <tr key={balance.id} className="bg-card hover:bg-muted/10">
                            <td className="px-4 py-3 font-medium text-foreground">{balance.location_name || loc?.name || 'Unknown Location'}</td>
                            <td className="px-4 py-3 text-muted-foreground">{balance.storage_area_name || '—'}</td>
                            <td className="px-4 py-3 text-right font-semibold text-foreground">{toQty(balance.on_hand_qty)}</td>
                            <td className="px-4 py-3 text-right text-muted-foreground">{toQty(balance.reserved_qty ?? balance.committed_qty)}</td>
                            <td className="px-4 py-3 text-right font-semibold text-foreground">{getAvailableQty(balance)}</td>
                            <td className="px-4 py-3"><StatusChip status={status} /></td>
                            <td className="px-4 py-3 text-muted-foreground">{getLastMovement(balance)}</td>
                            <td className="px-4 py-3 text-muted-foreground">{getSuggestedAction(status, balance)}</td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
