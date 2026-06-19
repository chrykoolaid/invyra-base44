import { useEffect, useState } from 'react';
import { base44 } from '@/api/base44Client';
import { Plus, Pencil, Archive, MapPin, ChevronDown, ChevronRight } from 'lucide-react';
import LocationModal from './LocationModal';
import StorageAreaModal from './StorageAreaModal';

const statusBadge = (loc) => {
  if (loc.is_archived) return <span className="text-[10px] px-2 py-0.5 rounded-full bg-slate-100 text-slate-500 font-semibold">Archived</span>;
  if (!loc.is_active) return <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-50 text-amber-700 font-semibold border border-amber-200">Inactive</span>;
  return <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 font-semibold border border-emerald-200">Active</span>;
};

export default function LocationsTab() {
  const [locations, setLocations] = useState([]);
  const [storageAreas, setStorageAreas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState({});
  const [locationModal, setLocationModal] = useState(null); // null | 'new' | location object
  const [storageModal, setStorageModal] = useState(null);   // null | { locationId } | storageArea object

  const load = async () => {
    setLoading(true);
    const [locs, areas] = await Promise.all([
      base44.entities.Location.filter({ environment: 'LIVE' }, 'name', 200),
      base44.entities.StorageArea.filter({ environment: 'LIVE' }, 'name', 500),
    ]);
    setLocations(locs || []);
    setStorageAreas(areas || []);
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const toggleExpand = (id) => setExpanded(prev => ({ ...prev, [id]: !prev[id] }));

  const areasFor = (locationId) => storageAreas.filter(a => a.location_id === locationId);

  if (loading) return (
    <div className="flex items-center justify-center py-24">
      <div className="w-6 h-6 border-2 border-muted border-t-foreground rounded-full animate-spin" />
    </div>
  );

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <button
          onClick={() => setLocationModal('new')}
          className="inline-flex items-center gap-1.5 h-9 px-4 text-sm rounded-xl bg-primary text-primary-foreground hover:opacity-90 font-medium"
        >
          <Plus size={14} /> Add Location
        </button>
      </div>

      {locations.length === 0 ? (
        <div className="border border-dashed border-border rounded-2xl p-12 text-center">
          <MapPin size={24} className="text-muted-foreground mx-auto mb-3" />
          <p className="text-sm font-medium text-foreground">No locations yet</p>
          <p className="text-xs text-muted-foreground mt-1">Add your first branch or warehouse to get started.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {locations.map(loc => (
            <div key={loc.id} className="border border-border rounded-2xl bg-card overflow-hidden">
              <div className="flex items-center justify-between px-4 py-3 gap-3">
                <button
                  className="flex items-center gap-2 min-w-0 flex-1 text-left"
                  onClick={() => toggleExpand(loc.id)}
                >
                  {expanded[loc.id] ? <ChevronDown size={15} className="text-muted-foreground shrink-0" /> : <ChevronRight size={15} className="text-muted-foreground shrink-0" />}
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-sm font-semibold text-foreground">{loc.name}</span>
                      <span className="text-xs text-muted-foreground font-mono">{loc.location_code}</span>
                      {loc.is_default && <span className="text-[10px] px-2 py-0.5 rounded-full bg-primary/10 text-primary font-semibold">Default</span>}
                      {statusBadge(loc)}
                    </div>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {loc.location_type}{loc.city ? ` · ${loc.city}` : ''}{loc.province ? `, ${loc.province}` : ''}
                    </p>
                  </div>
                </button>
                <div className="flex items-center gap-2 shrink-0">
                  <span className="text-xs text-muted-foreground">{areasFor(loc.id).length} area{areasFor(loc.id).length !== 1 ? 's' : ''}</span>
                  <button
                    onClick={() => setLocationModal(loc)}
                    className="h-7 w-7 flex items-center justify-center rounded-lg border border-border bg-background hover:bg-muted text-muted-foreground"
                  >
                    <Pencil size={12} />
                  </button>
                </div>
              </div>

              {expanded[loc.id] && (
                <div className="border-t border-border bg-muted/10 px-4 py-3 space-y-2">
                  <div className="flex items-center justify-between mb-2">
                    <p className="text-xs font-semibold uppercase tracking-[0.16em] text-muted-foreground">Storage Areas</p>
                    <button
                      onClick={() => setStorageModal({ locationId: loc.id })}
                      className="inline-flex items-center gap-1 h-7 px-2.5 text-xs rounded-lg border border-border bg-card hover:bg-muted text-muted-foreground"
                    >
                      <Plus size={11} /> Add Area
                    </button>
                  </div>
                  {areasFor(loc.id).length === 0 ? (
                    <p className="text-xs text-muted-foreground">No storage areas defined for this location.</p>
                  ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
                      {areasFor(loc.id).map(area => (
                        <div
                          key={area.id}
                          className="flex items-center justify-between gap-2 border border-border rounded-xl bg-card px-3 py-2"
                        >
                          <div className="min-w-0">
                            <p className="text-sm font-medium text-foreground truncate">{area.name}</p>
                            <p className="text-xs text-muted-foreground">{area.storage_type} · {area.storage_area_code}</p>
                          </div>
                          <button
                            onClick={() => setStorageModal(area)}
                            className="h-6 w-6 flex items-center justify-center rounded border border-border text-muted-foreground hover:bg-muted shrink-0"
                          >
                            <Pencil size={11} />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {locationModal !== null && (
        <LocationModal
          location={locationModal === 'new' ? null : locationModal}
          onClose={() => setLocationModal(null)}
          onSaved={() => { setLocationModal(null); load(); }}
        />
      )}

      {storageModal !== null && (
        <StorageAreaModal
          storageArea={'locationId' in storageModal ? null : storageModal}
          locationId={'locationId' in storageModal ? storageModal.locationId : storageModal.location_id}
          onClose={() => setStorageModal(null)}
          onSaved={() => { setStorageModal(null); load(); }}
        />
      )}
    </div>
  );
}