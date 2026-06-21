import { useEffect, useState } from 'react';
import { base44 } from '@/api/base44Client';
import { ArchiveRestore, Edit2, MapPin, Plus, Power, ShieldCheck } from 'lucide-react';
import LocationModal from './LocationModal';

function StatusBadge({ location }) {
  const isArchived = !!location.is_archived;
  const isActive = location.is_active !== false && !isArchived;
  if (isArchived) return <span className="text-xs font-semibold px-2 py-0.5 rounded bg-slate-50 text-slate-600 border border-slate-200">Archived</span>;
  if (isActive) return <span className="text-xs font-semibold px-2 py-0.5 rounded bg-emerald-50 text-emerald-700 border border-emerald-200">Active</span>;
  return <span className="text-xs font-semibold px-2 py-0.5 rounded bg-amber-50 text-amber-700 border border-amber-200">Inactive</span>;
}

export default function LocationManagementTab() {
  const [locations, setLocations] = useState([]);
  const [storageAreas, setStorageAreas] = useState([]);
  const [balances, setBalances] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showLocationModal, setShowLocationModal] = useState(false);
  const [editingLocation, setEditingLocation] = useState(null);
  const [query, setQuery] = useState('');

  const loadData = async () => {
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
    } catch (err) {
      console.error('Failed to load locations:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadData(); }, []);

  const openNewLocation = () => {
    setEditingLocation(null);
    setShowLocationModal(true);
  };

  const openEditLocation = (location) => {
    setEditingLocation(location);
    setShowLocationModal(true);
  };

  const setLocationActiveState = async (location, isActive) => {
    const hasStockHistory = balances.some(balance => balance.location_id === location.id);
    const message = isActive
      ? `Reactivate ${location.name}? This restores the location for visibility and future approved workflows.`
      : hasStockHistory
        ? `Deactivate ${location.name}? Historical stock balances and movements will be preserved.`
        : `Deactivate ${location.name}? The record will remain available for history and setup review.`;
    if (!confirm(message)) return;

    try {
      await base44.entities.Location.update(location.id, { is_active: isActive, is_archived: false });
      await loadData();
    } catch (err) {
      console.error('Failed to update location status:', err);
      alert('Failed to update location status.');
    }
  };

  const filteredLocations = locations.filter(location => {
    const q = query.trim().toLowerCase();
    if (!q) return true;
    return String(location.name || '').toLowerCase().includes(q)
      || String(location.location_code || '').toLowerCase().includes(q)
      || String(location.location_type || '').toLowerCase().includes(q);
  });

  if (loading) {
    return <div className="p-8 text-center text-muted-foreground">Loading locations…</div>;
  }

  return (
    <div className="space-y-4">
      {showLocationModal && (
        <LocationModal
          location={editingLocation}
          onClose={() => { setShowLocationModal(false); setEditingLocation(null); }}
          onSaved={() => { setShowLocationModal(false); setEditingLocation(null); loadData(); }}
        />
      )}

      <div className="border border-border rounded-2xl bg-card p-4 flex flex-col lg:flex-row lg:items-center justify-between gap-3">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <h2 className="text-base font-semibold text-foreground">Manage Locations</h2>
            <span className="inline-flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-full border border-border bg-background text-muted-foreground font-semibold uppercase tracking-wide">
              <ShieldCheck size={10} /> Metadata only
            </span>
          </div>
          <p className="text-sm text-muted-foreground">
            Manage branch, warehouse, store, and backroom records. This tab does not change stock balances.
          </p>
        </div>
        <button
          onClick={openNewLocation}
          className="inline-flex items-center justify-center gap-1.5 h-9 px-4 text-sm bg-primary text-primary-foreground rounded-xl hover:opacity-90 font-medium"
        >
          <Plus size={14} /> Add Location
        </button>
      </div>

      <div className="border border-border rounded-2xl bg-card p-4">
        <input
          value={query}
          onChange={e => setQuery(e.target.value)}
          placeholder="Search location name, code, or type..."
          className="h-9 w-full rounded-xl border border-input bg-background px-3 text-sm"
        />
      </div>

      {locations.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-border bg-card px-4 py-10 text-center">
          <MapPin size={24} className="text-muted-foreground mx-auto mb-3" />
          <p className="text-sm font-medium text-foreground">No locations configured yet.</p>
          <p className="text-xs text-muted-foreground mt-1">Add a location before assigning stock balances.</p>
        </div>
      ) : filteredLocations.length === 0 ? (
        <div className="rounded-2xl border border-border bg-card px-4 py-8 text-center text-sm text-muted-foreground">No locations match the current search.</div>
      ) : (
        <div className="border border-border rounded-2xl bg-card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm min-w-[900px]">
              <thead className="bg-muted/20 border-b border-border text-[11px] uppercase tracking-[0.16em] text-muted-foreground">
                <tr>
                  <th className="text-left px-4 py-2.5 font-semibold">Location</th>
                  <th className="text-left px-4 py-2.5 font-semibold">Code</th>
                  <th className="text-left px-4 py-2.5 font-semibold">Type</th>
                  <th className="text-left px-4 py-2.5 font-semibold">Status</th>
                  <th className="text-right px-4 py-2.5 font-semibold">Storage Areas</th>
                  <th className="text-left px-4 py-2.5 font-semibold">Description</th>
                  <th className="text-right px-4 py-2.5 font-semibold">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {filteredLocations.map(location => {
                  const areaCount = storageAreas.filter(area => area.location_id === location.id).length;
                  const hasStockHistory = balances.some(balance => balance.location_id === location.id);
                  const isActive = location.is_active !== false && !location.is_archived;
                  return (
                    <tr key={location.id} className="bg-card hover:bg-muted/10">
                      <td className="px-4 py-3">
                        <p className="font-medium text-foreground">{location.name}</p>
                        {hasStockHistory && <p className="text-[11px] text-muted-foreground mt-0.5">Historical stock records preserved</p>}
                      </td>
                      <td className="px-4 py-3 font-mono text-xs text-muted-foreground">{location.location_code || '—'}</td>
                      <td className="px-4 py-3 text-muted-foreground">{location.location_type || '—'}</td>
                      <td className="px-4 py-3"><StatusBadge location={location} /></td>
                      <td className="px-4 py-3 text-right font-semibold text-foreground">{areaCount}</td>
                      <td className="px-4 py-3 text-muted-foreground max-w-xs truncate">{location.address || location.notes || location.city || '—'}</td>
                      <td className="px-4 py-3">
                        <div className="flex justify-end gap-2">
                          <button
                            onClick={() => openEditLocation(location)}
                            className="inline-flex items-center gap-1 px-2.5 py-1.5 text-xs border border-border rounded-lg hover:bg-muted transition-colors text-muted-foreground"
                          >
                            <Edit2 size={12} /> Edit
                          </button>
                          {isActive ? (
                            <button
                              onClick={() => setLocationActiveState(location, false)}
                              className="inline-flex items-center gap-1 px-2.5 py-1.5 text-xs border border-amber-200 text-amber-700 rounded-lg hover:bg-amber-50 transition-colors"
                            >
                              <Power size={12} /> Deactivate
                            </button>
                          ) : (
                            <button
                              onClick={() => setLocationActiveState(location, true)}
                              className="inline-flex items-center gap-1 px-2.5 py-1.5 text-xs border border-emerald-200 text-emerald-700 rounded-lg hover:bg-emerald-50 transition-colors"
                            >
                              <ArchiveRestore size={12} /> Reactivate
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          <div className="border-t border-border px-4 py-3 text-xs text-muted-foreground bg-muted/10">
            Guardrail: Locations with stock history are never deleted from this page. Deactivation preserves historical records and does not create stock movements.
          </div>
        </div>
      )}
    </div>
  );
}
