import { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { envFilter } from '@/lib/envFilter';
import { ShieldCheck, X } from 'lucide-react';
import { Input } from '@/components/ui/input';

const STORAGE_TYPES = ['Shop Floor', 'Backroom', 'Receiving Bay', 'Quarantine', 'Returns Area', 'Damaged Goods', 'Chiller', 'Freezer', 'High Value Cage', 'Shelf', 'Bin', 'Stockroom', 'Other'];

export default function StorageAreaModal({ storageArea, locationId, locations = [], onClose, onSaved }) {
  const isEdit = !!storageArea;
  const [form, setForm] = useState({
    location_id: storageArea?.location_id || locationId || '',
    storage_area_code: storageArea?.storage_area_code || '',
    name: storageArea?.name || '',
    storage_type: storageArea?.storage_type || 'Shop Floor',
    is_active: storageArea?.is_active ?? true,
    is_archived: false,
    receiving_allowed: storageArea?.receiving_allowed ?? true,
    transfer_allowed: storageArea?.transfer_allowed ?? true,
    stocktake_allowed: storageArea?.stocktake_allowed ?? true,
    quarantine_allowed: storageArea?.quarantine_allowed ?? storageArea?.storage_type === 'Quarantine',
    notes: storageArea?.notes || '',
    ...envFilter(),
  });
  const [saving, setSaving] = useState(false);

  const set = (key, val) => setForm(f => ({ ...f, [key]: val }));

  const handleSave = async () => {
    if (!form.location_id || !form.storage_area_code.trim() || !form.name.trim()) return;
    setSaving(true);
    try {
      if (isEdit) {
        await base44.entities.StorageArea.update(storageArea.id, form);
      } else {
        await base44.entities.StorageArea.create(form);
      }
      onSaved();
    } catch (err) {
      console.error('Failed to save storage area:', err);
      alert('Failed to save storage area metadata.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="bg-card border border-border rounded-2xl shadow-xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between px-5 py-4 border-b border-border">
          <div>
            <h2 className="text-base font-semibold text-foreground">{isEdit ? 'Edit Storage Area Metadata' : 'Add Storage Area'}</h2>
            <p className="text-xs text-muted-foreground mt-0.5">Storage-area setup only. This does not change stock balances.</p>
          </div>
          <button onClick={onClose} className="h-7 w-7 flex items-center justify-center rounded-lg hover:bg-muted text-muted-foreground">
            <X size={15} />
          </button>
        </div>

        <div className="p-5 space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-medium text-muted-foreground">Storage Area Name *</label>
              <Input value={form.name} onChange={e => set('name', e.target.value)} placeholder="e.g. Shop Floor" className="mt-1" />
            </div>
            <div>
              <label className="text-xs font-medium text-muted-foreground">Storage Area Code *</label>
              <Input value={form.storage_area_code} onChange={e => set('storage_area_code', e.target.value)} placeholder="e.g. SA-001" className="mt-1" />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-medium text-muted-foreground">Parent Location *</label>
              <select value={form.location_id} onChange={e => set('location_id', e.target.value)} className="mt-1 h-9 w-full rounded-xl border border-input bg-background px-3 text-sm">
                <option value="">Select location...</option>
                {locations.map(location => (
                  <option key={location.id} value={location.id}>{location.name}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-xs font-medium text-muted-foreground">Area Type</label>
              <select value={form.storage_type} onChange={e => set('storage_type', e.target.value)} className="mt-1 h-9 w-full rounded-xl border border-input bg-background px-3 text-sm">
                {STORAGE_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
              </select>
            </div>
          </div>

          <div>
            <label className="text-xs font-medium text-muted-foreground">Status</label>
            <select value={form.is_active ? 'active' : 'inactive'} onChange={e => set('is_active', e.target.value === 'active')} className="mt-1 h-9 w-full rounded-xl border border-input bg-background px-3 text-sm">
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
            </select>
          </div>

          <div className="border border-border rounded-xl p-3 space-y-2 bg-muted/10">
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Capabilities</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {[
                ['receiving_allowed', 'Allows receiving'],
                ['transfer_allowed', 'Allows picking'],
                ['quarantine_allowed', 'Allows quarantine'],
                ['stocktake_allowed', 'Allows stocktake counting'],
              ].map(([key, label]) => (
                <label key={key} className="flex items-center gap-2 text-sm text-muted-foreground cursor-pointer">
                  <input
                    type="checkbox"
                    checked={!!form[key]}
                    onChange={e => set(key, e.target.checked)}
                    className="rounded"
                  />
                  {label}
                </label>
              ))}
            </div>
          </div>

          <div>
            <label className="text-xs font-medium text-muted-foreground">Notes</label>
            <Input value={form.notes} onChange={e => set('notes', e.target.value)} placeholder="Optional storage-area notes" className="mt-1" />
          </div>

          <div className="border border-border rounded-xl p-3 bg-background flex items-start gap-2 text-xs text-muted-foreground">
            <ShieldCheck size={14} className="mt-0.5 shrink-0" />
            <p>Storage areas do not directly change stock. Stock movement must still happen through approved workflows.</p>
          </div>
        </div>

        <div className="flex justify-end gap-2 px-5 py-4 border-t border-border">
          <button onClick={onClose} className="h-9 px-4 text-sm rounded-xl border border-border bg-background hover:bg-muted text-muted-foreground">
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={saving || !form.location_id || !form.storage_area_code.trim() || !form.name.trim()}
            className="h-9 px-4 text-sm rounded-xl bg-primary text-primary-foreground hover:opacity-90 disabled:opacity-50 font-medium"
          >
            {saving ? 'Saving…' : isEdit ? 'Save Metadata' : 'Add Storage Area'}
          </button>
        </div>
      </div>
    </div>
  );
}
