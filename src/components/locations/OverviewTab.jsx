import { useEffect, useMemo, useState } from 'react';
import { base44 } from '@/api/base44Client';
import { AlertTriangle, MapPin, RefreshCw, Warehouse } from 'lucide-react';

function SummaryCard({ label, value, note }) {
  return (
    <div className="border border-border rounded-2xl bg-card p-4">
      <p className="text-xs font-medium text-muted-foreground">{label}</p>
      <p className="text-2xl font-bold text-foreground mt-1">{value}</p>
      {note && <p className="text-[11px] text-muted-foreground mt-1">{note}</p>}
    </div>
  );
}

function EmptyState({ children }) {
  return (
    <div className="border border-dashed border-border rounded-2xl bg-card p-8 text-center text-sm text-muted-foreground">
      {children}
    </div>
  );
}

const normalize = (value) => String(value || '').trim().toLowerCase();

const isBranchLike = (location) => {
  const type = normalize(location.location_type);
  return ['branch', 'store', 'warehouse'].includes(type);
};

const formatRefreshTime = (value) => {
  if (!value) return 'No balance refresh recorded';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return 'No balance refresh recorded';
  return date.toLocaleString();
};

export default function OverviewTab() {
  const [locations, setLocations] = useState([]);
  const [storageAreas, setStorageAreas] = useState([]);
  const [balances, setBalances] = useState([]);
  const [loading, setLoading] = useState(true);
  const [lastRefreshed, setLastRefreshed] = useState(new Date());

  const load = async () => {
    setLoading(true);
    try {
      const [locs, areas, stockBalances] = await Promise.all([
        base44.entities.Location.filter({ environment: 'LIVE' }, 'name', 200),
        base44.entities.StorageArea.filter({ environment: 'LIVE' }, 'name', 500),
        base44.entities.ItemStockBalance.filter({ environment: 'LIVE' }, '-last_synced_at', 1000),
      ]);
      setLocations(locs || []);
      setStorageAreas(areas || []);
      setBalances(stockBalances || []);
      setLastRefreshed(new Date());
    } catch (err) {
      console.error('Failed to load location overview:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const metrics = useMemo(() => {
    const locationIds = new Set(locations.map(loc => loc.id));
    const activeLocations = locations.filter(loc => loc.is_active !== false && !loc.is_archived);
    const activeBranches = activeLocations.filter(isBranchLike).length;
    const activeStorageAreas = storageAreas.filter(area => area.is_active !== false && !area.is_archived);

    const locationCountByItem = new Map();
    balances.forEach(balance => {
      const itemKey = balance.item_id || balance.sku;
      if (!itemKey || !balance.location_id) return;
      if (!locationCountByItem.has(itemKey)) locationCountByItem.set(itemKey, new Set());
      locationCountByItem.get(itemKey).add(balance.location_id);
    });

    const multiLocationItems = Array.from(locationCountByItem.values()).filter(set => set.size > 1).length;
    const locationsMissingStorageAreas = activeLocations.filter(loc => !activeStorageAreas.some(area => area.location_id === loc.id)).length;
    const storageAreasWithoutLocation = activeStorageAreas.filter(area => !area.location_id || !locationIds.has(area.location_id)).length;
    const inactiveLocationIds = new Set(locations.filter(loc => loc.is_active === false || loc.is_archived).map(loc => loc.id));
    const inactiveLocationsWithStock = new Set(
      balances
        .filter(balance => inactiveLocationIds.has(balance.location_id) && (balance.on_hand_qty ?? 0) > 0)
        .map(balance => balance.location_id)
    ).size;

    const stockInUnknownLocation = balances.filter(balance => {
      const locationName = normalize(balance.location_name);
      return !balance.location_id || !locationIds.has(balance.location_id) || locationName === 'unknown location' || locationName === 'default location';
    }).length;

    const nameCounts = new Map();
    locations.forEach(loc => {
      const name = normalize(loc.name);
      if (!name) return;
      nameCounts.set(name, (nameCounts.get(name) || 0) + 1);
    });
    const duplicateLocationNames = Array.from(nameCounts.values()).filter(count => count > 1).length;

    const latestBalanceTime = balances
      .map(balance => balance.last_synced_at || balance.last_movement_at || balance.updated_date || balance.created_date)
      .filter(Boolean)
      .map(value => new Date(value).getTime())
      .filter(value => !Number.isNaN(value))
      .sort((a, b) => b - a)[0];

    const setupIssueCount = locationsMissingStorageAreas + storageAreasWithoutLocation + inactiveLocationsWithStock + stockInUnknownLocation + duplicateLocationNames;

    return {
      totalLocations: locations.length,
      activeBranches,
      activeStorageAreas: activeStorageAreas.length,
      multiLocationItems,
      setupIssueCount,
      lastBalanceRefresh: latestBalanceTime ? new Date(latestBalanceTime).toISOString() : null,
      needsAttention: [
        { label: 'Locations missing storage areas', count: locationsMissingStorageAreas, guidance: 'Set up storage areas' },
        { label: 'Storage areas without location assignment', count: storageAreasWithoutLocation, guidance: 'Assign parent location' },
        { label: 'Inactive locations with stock balance records', count: inactiveLocationsWithStock, guidance: 'Review historical balances' },
        { label: 'Items with stock in unknown/default location', count: stockInUnknownLocation, guidance: 'Review location context' },
        { label: 'Duplicate or unclear location names', count: duplicateLocationNames, guidance: 'Rename for clarity' },
      ],
    };
  }, [locations, storageAreas, balances]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-24">
        <div className="w-6 h-6 border-2 border-muted border-t-foreground rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="border border-border rounded-2xl bg-card p-4 flex items-start justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <MapPin size={16} className="text-muted-foreground" />
            <h2 className="text-base font-semibold text-foreground">Multi-location stock visibility</h2>
          </div>
          <p className="text-sm text-muted-foreground max-w-3xl">
            Locations provides branch and storage-area visibility only. Stock changes must be completed through Adjustments, Transfers, Receiving, Wastage, or other approved inventory workflows.
          </p>
        </div>
        <button
          onClick={load}
          className="h-9 px-3 inline-flex items-center gap-1.5 rounded-xl border border-border bg-background hover:bg-muted text-sm text-muted-foreground shrink-0"
        >
          <RefreshCw size={13} /> Refresh
        </button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-6 gap-3">
        <SummaryCard label="Total Locations" value={metrics.totalLocations} />
        <SummaryCard label="Active Branches" value={metrics.activeBranches} />
        <SummaryCard label="Storage Areas" value={metrics.activeStorageAreas} />
        <SummaryCard label="Multi-Location Items" value={metrics.multiLocationItems} />
        <SummaryCard label="Needs Setup" value={metrics.setupIssueCount} />
        <SummaryCard label="Last Refresh" value={formatRefreshTime(metrics.lastBalanceRefresh)} note={`Viewed ${lastRefreshed.toLocaleTimeString()}`} />
      </div>

      <div className="border border-border rounded-2xl bg-card overflow-hidden">
        <div className="px-4 py-3 border-b border-border bg-muted/10 flex items-center gap-2">
          <AlertTriangle size={15} className="text-muted-foreground" />
          <h3 className="text-sm font-semibold text-foreground">Needs Attention</h3>
        </div>
        {metrics.setupIssueCount === 0 ? (
          <EmptyState>No location setup issues found.</EmptyState>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm min-w-[680px]">
              <thead className="bg-muted/20 border-b border-border text-[11px] uppercase tracking-[0.16em] text-muted-foreground">
                <tr>
                  <th className="text-left px-4 py-2.5 font-semibold">Issue</th>
                  <th className="text-right px-4 py-2.5 font-semibold">Count</th>
                  <th className="text-left px-4 py-2.5 font-semibold">Guidance</th>
                  <th className="text-left px-4 py-2.5 font-semibold">Boundary</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {metrics.needsAttention.map(issue => (
                  <tr key={issue.label} className="bg-card">
                    <td className="px-4 py-3 font-medium text-foreground">{issue.label}</td>
                    <td className="px-4 py-3 text-right font-semibold text-foreground">{issue.count}</td>
                    <td className="px-4 py-3 text-muted-foreground">{issue.guidance}</td>
                    <td className="px-4 py-3 text-xs text-muted-foreground">Read-only visibility; no stock mutation.</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {locations.length === 0 && (
        <div className="border border-dashed border-border rounded-2xl bg-card p-8 text-center">
          <Warehouse size={24} className="text-muted-foreground mx-auto mb-3" />
          <p className="text-sm font-medium text-foreground">No locations configured yet.</p>
          <p className="text-xs text-muted-foreground mt-1">Add a location before assigning stock balances.</p>
        </div>
      )}
    </div>
  );
}
