import { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { Plus, Edit2, Trash2, ChevronDown, MapPin } from 'lucide-react';
import LocationModal from './LocationModal';
import StorageAreaModal from './StorageAreaModal';

function StatusBadge({ status }) {
  if (status === 'active') return <span className="text-xs font-semibold px-2 py-0.5 rounded bg-emerald-50 text-emerald-700 border border-emerald-200">Active</span>;
  if (status === 'archived') return <span className="text-xs font-semibold px-2 py-0.5 rounded bg-slate-50 text-slate-600 border border-slate-200">Archived</span>;
  return <span className="text-xs font-semibold px-2 py-0.5 rounded bg-amber-50 text-amber-700 border border-amber-200">Inactive</span>;
}

export default function LocationManagementTab() {
  const [locations, setLocations] = useState([]);
  const [storageAreas, setStorageAreas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [expandedLoc, setExpandedLoc] = useState(null);
  const [showLocationModal, setShowLocationModal] = useState(false);
  const [showStorageModal, setShowStorageModal] = useState(false);
  const [editingLocation, setEditingLocation] = useState(null);
  const [editingStorage, setEditingStorage] = useState(null);
  const [selectedLocationId, setSelectedLocationId] = useState(null);

  const loadData = async () => {
    setLoading(true);
    try {
      const locs = await base44.entities.Location.filter({ environment: 'LIVE' }, '-updated_date', 100);
      const areas = await base44.entities.StorageArea.filter({ environment: 'LIVE' }, '-updated_date', 200);
      setLocations(locs || []);
      setStorageAreas(areas || []);
    } catch (err) {
      console.error('Failed to load locations:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadData(); }, []);

  const handleDeleteLocation = async (locId) => {
    if (!confirm('Delete this location? Any storage areas will remain orphaned.')) return;
    try {
      await base44.entities.Location.delete(locId);
      setLocations(prev => prev.filter(l => l.id !== locId));
    } catch (err) {
      alert('Failed to delete location');
    }
  };

  const handleDeleteStorageArea = async (saId) => {
    if (!confirm('Delete this storage area?')) return;
    try {
      await base44.entities.StorageArea.delete(saId);
      setStorageAreas(prev => prev.filter(s => s.id !== saId));
    } catch (err) {
      alert('Failed to delete storage area');
    }
  };

  const openStorageModal = (locId) => {
    setSelectedLocationId(locId);
    setEditingStorage(null);
    setShowStorageModal(true);
  };

  if (loading) {
    return <div className="p-4 text-center text-muted-foreground">Loading locations…</div>;
  }

  return (
    <div className="space-y-4">
      {showLocationModal && (
        <LocationModal
          location={editingLocation}
          onClose={() => { setShowLocationModal(false); setEditingLocation(null); }}
          onSaved={loadData}
        />
      )}

      {showStorageModal && (
        <StorageAreaModal
          locationId={selectedLocationId}
          storageArea={editingStorage}
          onClose={() => { setShowStorageModal(false); setEditingStorage(null); }}
          onSaved={loadData}
        />
      )}

      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold text-foreground">Locations</h2>
        <button
          onClick={() => { setEditingLocation(null); setShowLocationModal(true); }}
          className="flex items-center gap-1.5 h-8 px-3 text-xs bg-primary text-primary-foreground rounded hover:opacity-90 transition-opacity"
        >
          <Plus size={14} /> Add Location
        </button>
      </div>

      {locations.length === 0 ? (
        <div className="rounded border border-border bg-muted/20 px-4 py-6 text-center text-muted-foreground text-sm">
          No locations defined yet. Create one to get started with multi-branch inventory visibility.
        </div>
      ) : (
        <div className="space-y-2">
          {locations.map((loc) => {
            const isExpanded = expandedLoc === loc.id;
            const areasForLoc = storageAreas.filter(s => s.location_id === loc.id);
            const status = loc.is_archived ? 'archived' : loc.is_active ? 'active' : 'inactive';
            return (
              <div key={loc.id} className="rounded border border-border bg-card overflow-hidden">
                <button
                  onClick={() => setExpandedLoc(isExpanded ? null : loc.id)}
                  className="w-full flex items-center justify-between px-4 py-3 hover:bg-muted/20 transition-colors text-left"
                >
                  <div className="flex items-center gap-3 flex-1">
                    <ChevronDown size={16} className={`text-muted-foreground transition-transform ${isExpanded ? 'rotate-180' : ''}`} />
                    <MapPin size={16} className="text-muted-foreground" />
                    <div className="min-w-0 flex-1">
                      <p className="font-semibold text-foreground">{loc.name}</p>
                      <p className="text-xs text-muted-foreground">{loc.location_code} · {loc.location_type}</p>
                    </div>
                  </div>
                  <StatusBadge status={status} />
                </button>

                {isExpanded && (
                  <div className="border-t border-border bg-muted/10 p-4 space-y-3">
                    <div className="grid grid-cols-2 gap-2 text-sm">
                      {loc.city && <div><span className="text-muted-foreground">City:</span> {loc.city}</div>}
                      {loc.contact_phone && <div><span className="text-muted-foreground">Phone:</span> {loc.contact_phone}</div>}
                      {loc.contact_email && <div><span className="text-muted-foreground">Email:</span> {loc.contact_email}</div>}
                      {loc.notes && <div className="col-span-2"><span className="text-muted-foreground">Notes:</span> {loc.notes}</div>}
                    </div>

                    <div className="flex gap-2">
                      <button
                        onClick={() => { setEditingLocation(loc); setShowLocationModal(true); }}
                        className="flex items-center gap-1 px-2 py-1.5 text-xs border border-border rounded hover:bg-muted transition-colors"
                      >
                        <Edit2 size={12} /> Edit
                      </button>
                      <button
                        onClick={() => handleDeleteLocation(loc.id)}
                        className="flex items-center gap-1 px-2 py-1.5 text-xs border border-red-200 text-red-600 rounded hover:bg-red-50 transition-colors"
                      >
                        <Trash2 size={12} /> Delete
                      </button>
                      <button
                        onClick={() => openStorageModal(loc.id)}
                        className="flex items-center gap-1 px-2 py-1.5 text-xs border border-border rounded hover:bg-muted transition-colors ml-auto"
                      >
                        <Plus size={12} /> Add Storage Area
                      </button>
                    </div>

                    {areasForLoc.length > 0 && (
                      <div className="mt-3 pt-3 border-t border-border space-y-1">
                        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Storage Areas</p>
                        {areasForLoc.map((sa) => (
                          <div key={sa.id} className="flex items-center justify-between px-3 py-2 rounded bg-background text-sm">
                            <div>
                              <p className="font-medium text-foreground">{sa.name}</p>
                              <p className="text-xs text-muted-foreground">{sa.storage_area_code} · {sa.storage_type}</p>
                            </div>
                            <div className="flex gap-1">
                              <button
                                onClick={() => { setSelectedLocationId(loc.id); setEditingStorage(sa); setShowStorageModal(true); }}
                                className="p-1 text-muted-foreground hover:text-foreground transition-colors"
                              >
                                <Edit2 size={14} />
                              </button>
                              <button
                                onClick={() => handleDeleteStorageArea(sa.id)}
                                className="p-1 text-red-500 hover:text-red-700 transition-colors"
                              >
                                <Trash2 size={14} />
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}