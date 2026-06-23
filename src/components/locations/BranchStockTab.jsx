import { useEffect, useMemo, useState } from 'react';
import { base44 } from '@/api/base44Client';
import { envFilter } from '@/lib/envFilter';
import { AlertTriangle, MapPin, Package, RefreshCw, Search } from 'lucide-react';
import { Input } from '@/components/ui/input';

const toQty = (value) => Number(value ?? 0) || 0;

const getAvailableQty = (balance) => {
  if (balance.available_qty !== undefined && balance.available_qty !== null) return toQty(balance.available_qty);
  return Math.max(0, toQty(balance.on_hand_qty) - toQty(balance.reserved_qty ?? balance.committed_qty));
};

const getLastMovementTime = (balance) => {
  const value = balance.last_movement_at || balance.last_synced_at || balance.updated_date || balance.created_date;
  if (!value) return 0;
  const date = new Date(value).getTime();
  return Number.isNaN(date) ? 0 : date;
};

const getStatus = (balance, item) => {
  const stock = toQty(balance.on_hand_qty);
  const available = getAvailableQty(balance);
  const reorderPoint = toQty(item?.reorder_point);
  if (stock <= 0 || available <= 0) return 'Out of Stock';
  if (reorderPoint > 0 && available <= reorderPoint) return 'Low Stock';
  if (balance.balance_status === 'Stale') return 'Stale Balance';
  return 'Healthy';
};

function StatusChip({ status }) {
  const styles = {
    Healthy: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    'Low Stock': 'bg-amber-50 text-amber-700 border-amber-200',
    'Out of Stock': 'bg-red-50 text-red-700 border-red-200',
    'Stale Balance': 'bg-slate-100 text-slate-600 border-slate-200',
  };
  return (
    <span className={`inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-full border ${styles[status] || styles.Healthy}`}>
      {(status === 'Low Stock' || status === 'Out of Stock') && <AlertTriangle size={9} />}
      {status}
    </span>
  );
}

function SummaryCard({ label, value, note }) {
  return (
    <div className="border border-border rounded-xl bg-card px-4 py-3">
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="text-2xl font-bold text-foreground mt-0.5">{value}</p>
      {note && <p className="text-[11px] text-muted-foreground mt-0.5">{note}</p>}
    </div>
  );
}

function SectionTab({ active, onClick, children }) {
  return (
    <button
      onClick={onClick}
      className={`h-8 px-3 rounded-lg text-xs font-medium border transition-colors ${
        active
          ? 'border-primary bg-primary/5 text-primary'
          : 'border-border bg-background text-muted-foreground hover:bg-muted'
      }`}
    >
      {children}
    </button>
  );
}

export default function BranchStockTab() {
  const [locations, setLocations] = useState([]);
  const [storageAreas, setStorageAreas] = useState([]);
  const [balances, setBalances] = useState([]);
  const [items, setItems] = useState([]);
  const [selectedLocationId, setSelectedLocationId] = useState('');
  const [locationQuery, setLocationQuery] = useState('');
  const [itemQuery, setItemQuery] = useState('');
  const [locationFilter, setLocationFilter] = useState('ACTIVE');
  const [section, setSection] = useState('STOCKED');
  const [loading, setLoading] = useState(true);
  const [lastRefreshed, setLastRefreshed] = useState(new Date());

  const load = async () => {
    setLoading(true);
    try {
      const [locs, areas, bal, inv] = await Promise.all([
        base44.entities.Location.filter(envFilter(), 'name', 200),
        base44.entities.StorageArea.filter(envFilter(), 'name', 500),
        base44.entities.ItemStockBalance.filter(envFilter(), '-last_synced_at', 1000),
        base44.entities.InventoryItem.filter({ ...envFilter(), is_active: true }, 'name', 500),
      ]);
      setLocations(locs || []);
      setStorageAreas(areas || []);
      setBalances(bal || []);
      setItems(inv || []);
      setLastRefreshed(new Date());
    } catch (err) {
      console.error('Failed to load branch stock:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  useEffect(() => {
    if (locations.length > 0 && !selectedLocationId) {
      const activeLocations = locations.filter(l => l.is_active !== false && !l.is_archived);
      const def = activeLocations.find(l => l.is_default) || activeLocations[0] || locations[0];
      if (def) setSelectedLocationId(def.id);
    }
  }, [locations, selectedLocationId]);

  const itemMap = useMemo(() => {
    const m = {};
    items.forEach(i => { m[i.id] = i; m[i.sku] = i; });
    return m;
  }, [items]);

  const locationBalances = useMemo(() => balances.filter(b => b.location_id === selectedLocationId), [balances, selectedLocationId]);
  const selectedLocation = locations.find(l => l.id === selectedLocationId);
  const selectedStorageAreas = storageAreas.filter(area => area.location_id === selectedLocationId);

  const branchList = useMemo(() => {
    const q = locationQuery.trim().toLowerCase();
    return locations.filter(location => {
      const isActive = location.is_active !== false && !location.is_archived;
      const matchStatus = locationFilter === 'ALL' || isActive;
      const matchQuery = !q || String(location.name || '').toLowerCase().includes(q) || String(location.location_code || '').toLowerCase().includes(q);
      return matchStatus && matchQuery;
    });
  }, [locations, locationQuery, locationFilter]);

  const sectionBalances = useMemo(() => {
    const q = itemQuery.trim().toLowerCase();
    const base = locationBalances.filter(balance => {
      const item = itemMap[balance.item_id] || itemMap[balance.sku];
      const matchQuery = !q
        || String(balance.sku || '').toLowerCase().includes(q)
        || String(balance.item_name || '').toLowerCase().includes(q)
        || String(item?.name || '').toLowerCase().includes(q);
      if (!matchQuery) return false;

      const status = getStatus(balance, item);
      if (section === 'LOW') return status === 'Low Stock' || status === 'Out of Stock';
      if (section === 'NEAR_EXPIRY') return Boolean(balance.expiry_status || balance.near_expiry_qty > 0 || item?.expiry_date);
      if (section === 'RECENT') return getLastMovementTime(balance) > 0;
      return true;
    });

    if (section === 'RECENT') return [...base].sort((a, b) => getLastMovementTime(b) - getLastMovementTime(a)).slice(0, 50);
    return base;
  }, [locationBalances, itemQuery, section, itemMap]);

  const summary = useMemo(() => {
    const total = locationBalances.length;
    const low = locationBalances.filter(balance => {
      const item = itemMap[balance.item_id] || itemMap[balance.sku];
      const status = getStatus(balance, item);
      return status === 'Low Stock' || status === 'Out of Stock';
    }).length;
    const nearExpiry = locationBalances.filter(balance => {
      const item = itemMap[balance.item_id] || itemMap[balance.sku];
      return Boolean(balance.expiry_status || balance.near_expiry_qty > 0 || item?.expiry_date);
    }).length;
    const valueBalances = locationBalances.filter(balance => balance.stock_value !== undefined || balance.inventory_value !== undefined);
    const stockValue = valueBalances.reduce((sum, balance) => sum + toQty(balance.stock_value ?? balance.inventory_value), 0);
    return { total, low, nearExpiry, stockValue: valueBalances.length ? stockValue.toLocaleString() : '—' };
  }, [locationBalances, itemMap]);

  return (
    <div className="grid grid-cols-1 xl:grid-cols-[280px_1fr] gap-4">
      <div className="border border-border rounded-2xl bg-card overflow-hidden h-fit">
        <div className="px-4 py-3 border-b border-border bg-muted/10 space-y-3">
          <div className="flex items-center justify-between gap-2">
            <h2 className="text-sm font-semibold text-foreground">Branches / Locations</h2>
            <button onClick={load} className="h-8 w-8 flex items-center justify-center rounded-lg border border-border bg-background hover:bg-muted text-muted-foreground">
              <RefreshCw size={13} className={loading ? 'animate-spin' : ''} />
            </button>
          </div>
          <div className="relative">
            <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <Input value={locationQuery} onChange={e => setLocationQuery(e.target.value)} placeholder="Search location..." className="pl-8 h-8 text-sm" />
          </div>
          <select value={locationFilter} onChange={e => setLocationFilter(e.target.value)} className="h-8 w-full rounded-lg border border-input bg-background px-2 text-xs">
            <option value="ACTIVE">Active only</option>
            <option value="ALL">Include inactive</option>
          </select>
        </div>

        {branchList.length === 0 ? (
          <div className="p-6 text-center text-sm text-muted-foreground">No locations configured yet. Add a location before assigning stock balances.</div>
        ) : (
          <div className="divide-y divide-border max-h-[620px] overflow-y-auto">
            {branchList.map(location => {
              const isSelected = location.id === selectedLocationId;
              const isActive = location.is_active !== false && !location.is_archived;
              return (
                <button
                  key={location.id}
                  onClick={() => setSelectedLocationId(location.id)}
                  className={`w-full text-left px-4 py-3 hover:bg-muted/20 transition-colors ${isSelected ? 'bg-primary/5' : 'bg-card'}`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-foreground truncate">{location.name}</p>
                      <p className="text-xs text-muted-foreground font-mono mt-0.5">{location.location_code || 'No code'}</p>
                    </div>
                    <span className={`text-[10px] px-2 py-0.5 rounded-full border font-semibold ${isActive ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-amber-50 text-amber-700 border-amber-200'}`}>
                      {isActive ? 'Active' : 'Inactive'}
                    </span>
                  </div>
                  <p className="text-[11px] text-muted-foreground mt-1">{location.location_type || 'Location'}</p>
                </button>
              );
            })}
          </div>
        )}
      </div>

      <div className="space-y-4">
        {loading ? (
          <div className="flex items-center justify-center py-24">
            <div className="w-6 h-6 border-2 border-muted border-t-foreground rounded-full animate-spin" />
          </div>
        ) : !selectedLocation ? (
          <div className="border border-dashed border-border rounded-2xl p-12 text-center bg-card">
            <MapPin size={24} className="text-muted-foreground mx-auto mb-3" />
            <p className="text-sm text-muted-foreground">Select a branch or location to view stock visibility.</p>
          </div>
        ) : (
          <>
            <div className="border border-border rounded-2xl bg-card p-4 space-y-3">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <h2 className="text-base font-semibold text-foreground">{selectedLocation.name}</h2>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {selectedLocation.location_code || 'No code'} · {selectedLocation.location_type || 'Location'} · Last refreshed: {lastRefreshed.toLocaleTimeString()}
                  </p>
                </div>
                <span className="text-[10px] px-2 py-0.5 rounded-full border border-border bg-background text-muted-foreground font-semibold uppercase tracking-wide">Read-only</span>
              </div>

              <div className="grid grid-cols-2 lg:grid-cols-5 gap-3">
                <SummaryCard label="Total SKUs Stocked" value={summary.total} />
                <SummaryCard label="Low Stock Items" value={summary.low} />
                <SummaryCard label="Near-Expiry Items" value={summary.nearExpiry} />
                <SummaryCard label="Stock Value" value={summary.stockValue} note="Shown only if available" />
                <SummaryCard label="Open Transfers" value="—" note="Handled in Transfers" />
              </div>
            </div>

            <div className="border border-border rounded-2xl bg-card overflow-hidden">
              <div className="px-4 py-3 border-b border-border bg-muted/10">
                <h3 className="text-sm font-semibold text-foreground">Storage Areas</h3>
                <p className="text-xs text-muted-foreground mt-0.5">Storage-area metadata only. Stock movement remains in approved workflows.</p>
              </div>
              {selectedStorageAreas.length === 0 ? (
                <div className="px-4 py-6 text-sm text-muted-foreground">No storage areas configured for this location.</div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3 p-4">
                  {selectedStorageAreas.map(area => (
                    <div key={area.id} className="border border-border rounded-xl bg-background px-3 py-2">
                      <div className="flex items-center justify-between gap-2">
                        <p className="text-sm font-medium text-foreground truncate">{area.name}</p>
                        <span className={`text-[10px] px-2 py-0.5 rounded-full border font-semibold ${area.is_active !== false && !area.is_archived ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-amber-50 text-amber-700 border-amber-200'}`}>
                          {area.is_active !== false && !area.is_archived ? 'Active' : 'Inactive'}
                        </span>
                      </div>
                      <p className="text-xs text-muted-foreground mt-1">{area.storage_area_code || 'No code'} · {area.storage_type || 'Area'}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="border border-border rounded-2xl bg-card overflow-hidden">
              <div className="px-4 py-3 border-b border-border bg-muted/10 space-y-3">
                <div className="flex flex-wrap items-center gap-2">
                  <SectionTab active={section === 'STOCKED'} onClick={() => setSection('STOCKED')}>Stocked Items</SectionTab>
                  <SectionTab active={section === 'LOW'} onClick={() => setSection('LOW')}>Low Stock</SectionTab>
                  <SectionTab active={section === 'NEAR_EXPIRY'} onClick={() => setSection('NEAR_EXPIRY')}>Near Expiry</SectionTab>
                  <SectionTab active={section === 'RECENT'} onClick={() => setSection('RECENT')}>Recently Moved</SectionTab>
                </div>
                <div className="relative max-w-md">
                  <Package size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                  <Input value={itemQuery} onChange={e => setItemQuery(e.target.value)} placeholder="Search item name or SKU..." className="pl-9 h-9" />
                </div>
              </div>

              {sectionBalances.length === 0 ? (
                <div className="p-8 text-center text-sm text-muted-foreground">
                  {locationBalances.length === 0
                    ? `No stock balance records found for ${selectedLocation.name}. Balance records are created when stock movements include location context.`
                    : 'No items match the current branch view.'}
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm min-w-[760px]">
                    <thead className="bg-muted/20 border-b border-border text-[11px] uppercase tracking-[0.16em] text-muted-foreground">
                      <tr>
                        <th className="text-left px-4 py-2.5 font-semibold">SKU</th>
                        <th className="text-left px-4 py-2.5 font-semibold">Item</th>
                        <th className="text-left px-4 py-2.5 font-semibold">Storage Area</th>
                        <th className="text-right px-4 py-2.5 font-semibold">On Hand</th>
                        <th className="text-right px-4 py-2.5 font-semibold">Available</th>
                        <th className="text-left px-4 py-2.5 font-semibold">Status</th>
                        <th className="text-left px-4 py-2.5 font-semibold">Last Movement</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border">
                      {sectionBalances.map(balance => {
                        const item = itemMap[balance.item_id] || itemMap[balance.sku];
                        const status = getStatus(balance, item);
                        const lastMovementTime = getLastMovementTime(balance);
                        return (
                          <tr key={balance.id} className="bg-card hover:bg-muted/10">
                            <td className="px-4 py-3 font-mono text-xs text-muted-foreground">{balance.sku || item?.sku || '—'}</td>
                            <td className="px-4 py-3 font-medium text-foreground">{balance.item_name || item?.name || 'Unknown Item'}</td>
                            <td className="px-4 py-3 text-muted-foreground">{balance.storage_area_name || '—'}</td>
                            <td className="px-4 py-3 text-right font-semibold text-foreground">{toQty(balance.on_hand_qty)}</td>
                            <td className="px-4 py-3 text-right font-semibold text-foreground">{getAvailableQty(balance)}</td>
                            <td className="px-4 py-3"><StatusChip status={status} /></td>
                            <td className="px-4 py-3 text-muted-foreground">{lastMovementTime ? new Date(lastMovementTime).toLocaleDateString() : '—'}</td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
