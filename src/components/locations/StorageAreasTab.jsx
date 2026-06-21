import { useEffect, useMemo, useState } from 'react';
import { base44 } from '@/api/base44Client';
import { ArchiveRestore, Edit2, Plus, Power, ShieldCheck, Warehouse } from 'lucide-react';
import StorageAreaModal from './StorageAreaModal';

function StatusBadge({ area }) {
  const isArchived = !!area.is_archived;
  const isActive = area.is_active !== false && !isArchived;
  if (isArchived) return <span className="text-xs font-semibold px-2 py-0.5 rounded bg-slate-50 text-slate-600 border border-slate-200">Archived</span>;
  if (isActive) return <span className="text-xs font-semibold px-2 py-0.5 rounded bg-emerald-50 text-emerald-700 border border-emerald-200">Active</span>;
  return <span className="text-xs font-semibold px-2 py-0.5 rounded bg-amber-50 text-amber-700 border border-amber-200">Inactive</span>;
}

function Flag({ active, children }) {
  return (
    <span className={`text-[10px] px-2 py-0.5 rounded-full border font-semibold ${active ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-slate-100 text-slate-500 border-slate-200'}`}>
      {children}
    </span>
  );
}

export default function StorageAreasTab() {
  const [locations, setLocations] = useState([]);
  const [storageAreas, setStorageAreas] = useState([]);
  const [balances, setBalances] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingStorageArea, setEditingStorageArea] = useState(null);
  const [selectedLocationId, setSelectedLocationId] = useState('ALL');
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
      console.error('Failed to load storage areas:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadData(); }, []);

  const locationMap = useMemo(() => {
    const map = {};
    locations.forEach(location => { map[location.id] = location; });
    return map;
  }, [locations]);

  const filteredAreas = useMemo(() => {
    const q = query.trim().toLowerCase();
    return storageAreas.filter(area => {
      const parent = locationMap[area.location_id];
      const matchLocation = selectedLocationId === 'ALL' || area.location_id === selectedLocationId;
      const matchQuery = !q
        || String(area.name || '').toLowerCase().includes(q)
        || String(area.storage_area_code || '').toLowerCase().includes(q)
        || String(area.storage_type || '').toLowerCase().includes(q)
        || String(parent?.name || '').toLowerCase().includes(q);
      return matchLocation && matchQuery;
    });
  }, [storageAreas, locationMap, selectedLocationId, query]);

  const openNewArea = () => {
    setEditingStorageArea(null);
    setShowModal(true);
  };

  const openEditArea = (area) => {
    setEditingStorageArea(area);
    setShowModal(true);
  };

  const setStorageAreaActiveState = async (area, isActive) => {
    const hasStockHistory = balances.some(balance => balance.storage_area_id === area.id || balance.storage_area_name === area.name);
    const message = isActive
      ? `Reactivate ${area.name}? This restores the storage area for visibility and approved workflows.`
      : hasStockHistory
        ? `Deactivate ${area.name}? Historical stock balances and movements will be preserved.`
        : `Deactivate ${area.name}? The record will remain available for history and setup review.`;
    if (!confirm(message)) return;

    try {
      await base44.entities.StorageArea.update(area.id, { is_active: isActive, is_archived: false });
      await loadData();
    } catch (err) {
      console.error('Failed to update storage area status:', err);
      alert('Failed to update storage area status.');
    }
  };

  if (loading) {
    return <div className="p-8 text-center text-muted-foreground">Loading storage areas…</div>;
  }

  return (
    <div className="space-y-4">
      {showModal && (
        <StorageAreaModal
          storageArea={editingStorageArea}
          locationId={editingStorageArea?.location_id || (selectedLocationId !== 'ALL' ? selectedLocationId : '')}
          locations={locations}
          onClose={() => { setShowModal(false); setEditingStorageArea(null); }}
          onSaved={() => { setShowModal(false); setEditingStorageArea(null); loadData(); }}
        />
      )}

      <div className="border border-border rounded-2xl bg-card p-4 flex flex-col lg:flex-row lg:items-center justify-between gap-3">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <h2 className="text-base font-semibold text-foreground">Storage Areas</h2>
            <span className="inline-flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-full border border-border bg-background text-muted-foreground font-semibold uppercase tracking-wide">
              <ShieldCheck size={10} /> Metadata only
            </span>
          </div>
          <p className="text-sm text-muted-foreground">
            Storage areas sit under locations. They do not directly change stock; approved inventory workflows own stock movement.
          </p>
        </div>
        <button
          onClick={openNewArea}
          className="inline-flex items-center justify-center gap-1.5 h-9 px-4 text-sm bg-primary text-primary-foreground rounded-xl hover:opacity-90 font-medium"
        >
          <Plus size={14} /> Add Storage Area
        </button>
      </div>

      <div className="border border-border rounded-2xl bg-card p-4 grid grid-cols-1 md:grid-cols-[240px_1fr] gap-3">
        <select value={selectedLocationId} onChange={e => setSelectedLocationId(e.target.value)} className="h-9 w-full rounded-xl border border-input bg-background px-3 text-sm">
          <option value="ALL">All Locations</option>
          {locations.map(location => (
            <option key={location.id} value={location.id}>{location.name}</option>
          ))}
        </select>
        <input
          value={query}
          onChange={e => setQuery(e.target.value)}
          placeholder="Search storage area name, code, type, or parent location..."
          className="h-9 w-full rounded-xl border border-input bg-background px-3 text-sm"
        />
      </div>

      {locations.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-border bg-card px-4 py-10 text-center">
          <Warehouse size={24} className="text-muted-foreground mx-auto mb-3" />
          <p className="text-sm font-medium text-foreground">No locations configured yet.</p>
          <p className="text-xs text-muted-foreground mt-1">Add a location before assigning storage areas.</p>
        </div>
      ) : storageAreas.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-border bg-card px-4 py-10 text-center">
          <Warehouse size={24} className="text-muted-foreground mx-auto mb-3" />
          <p className="text-sm font-medium text-foreground">No storage areas configured for this location.</p>
          <p className="text-xs text-muted-foreground mt-1">Create shop floor, backroom, receiving bay, quarantine, chiller, freezer, or other operational areas.</p>
        </div>
      ) : filteredAreas.length === 0 ? (
        <div className="rounded-2xl border border-border bg-card px-4 py-8 text-center text-sm text-muted-foreground">No storage areas match the current filters.</div>
      ) : (
        <div className="border border-border rounded-2xl bg-card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm min-w-[900px]">
              <thead className="bg-muted/20 border-b border-border text-[11px] uppercase tracking-[0.16em] text-muted-foreground">
                <tr>
                  <th className="text-left px-4 py-2.5 font-semibold">Storage Area</th>
                  <th className="text-left px-4 py-2.5 font-semibold">Parent Location</th>
                  <th className="text-left px-4 py-2.5 font-semibold">Area Type</th>
                  <th className="text-left px-4 py-2.5 font-semibold">Status</th>
                  <th className="text-left px-4 py-2.5 font-semibold">Capabilities</th>
                  <th className="text-left px-4 py-2.5 font-semibold">Notes</th>
                  <th className="text-right px-4 py-2.5 font-semibold">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {filteredAreas.map(area => {
                  const parent = locationMap[area.location_id];
                  const isActive = area.is_active !== false && !area.is_archived;
                  return (
                    <tr key={area.id} className="bg-card hover:bg-muted/10">
                      <td className="px-4 py-3">
                        <p className="font-medium text-foreground">{area.name}</p>
                        <p className="text-xs text-muted-foreground font-mono mt-0.5">{area.storage_area_code || 'No code'}</p>
                      </td>
                      <td className="px-4 py-3 text-muted-foreground">{parent?.name || 'Unassigned'}</td>
                      <td className="px-4 py-3 text-muted-foreground">{area.storage_type || '—'}</td>
                      <td className="px-4 py-3"><StatusBadge area={area} /></td>
                      <td className="px-4 py-3">
                        <div className="flex flex-wrap gap-1.5">
                          <Flag active={area.receiving_allowed !== false}>Receiving</Flag>
                          <Flag active={area.transfer_allowed !== false}>Picking</Flag>
                          <Flag active={area.stocktake_allowed !== false}>Stocktake</Flag>
                          <Flag active={area.quarantine_allowed === true || area.storage_type === 'Quarantine'}>Quarantine</Flag>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-muted-foreground max-w-xs truncate">{area.notes || '—'}</td>
                      <td className="px-4 py-3">
                        <div className="flex justify-end gap-2">
                          <button
                            onClick={() => openEditArea(area)}
                            className="inline-flex items-center gap-1 px-2.5 py-1.5 text-xs border border-border rounded-lg hover:bg-muted transition-colors text-muted-foreground"
                          >
                            <Edit2 size={12} /> Edit
                          </button>
                          {isActive ? (
                            <button
                              onClick={() => setStorageAreaActiveState(area, false)}
                              className="inline-flex items-center gap-1 px-2.5 py-1.5 text-xs border border-amber-200 text-amber-700 rounded-lg hover:bg-amber-50 transition-colors"
                            >
                              <Power size={12} /> Deactivate
                            </button>
                          ) : (
                            <button
                              onClick={() => setStorageAreaActiveState(area, true)}
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
            Guardrail: Storage areas do not create StockMovement records. Deactivation preserves history and only changes metadata.
          </div>
        </div>
      )}
    </div>
  );
}
