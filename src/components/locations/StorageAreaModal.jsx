import { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { X } from 'lucide-react';
import { Input } from '@/components/ui/input';

const STORAGE_TYPES = ['Shelf', 'Bin', 'Stockroom', 'Receiving Area', 'Damaged Stock', 'Quarantine', 'Zone', 'Other'];

export default function StorageAreaModal({ storageArea, locationId, onClose, onSaved }) {
  const isEdit = !!storageArea;
  const [form, setForm] = useState({
    location_id: storageArea?.location_id || locationId || '',
    storage_area_code: storageArea?.storage_area_code || '',
    name: storageArea?.name || '',
    storage_type: storageArea?.storage_type || 'Shelf',
    is_active: storageArea?.is_active ?? true,
    is_archived: storageArea?.is_archived ?? false,
    receiving_allowed: storageArea?.receiving_allowed ?? true,
    transfer_allowed: storageArea?.transfer_allowed ?? true,
    stocktake_allowed: storageArea?.stocktake_allowed ?? true,
    notes: storageArea?.notes || '',
    environment: 'LIVE',
  });
  const [saving, setSaving] = useState(false);

  const set = (key, val) => setForm(f => ({ ...f, [key]: val }));

  const handleSave = async () => {
    if (!form.storage_area_code.trim() || !form.name.trim()) return;
    setSaving(true);
    if (isEdit) {
      await base44.entities.StorageArea.update(storageArea.id, form);
    } else {
      await base44.entities.StorageArea.create(form);
    }
    setSaving(false);
    onSaved();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
      <div className="bg-card border border-border rounded-2xl shadow-xl w-full max-w-md">
        <div className="flex items-center justify-between px-5 py-4 border-b border-border">
          <h2 className="text-base font-semibold text-foreground">{isEdit ? 'Edit Storage Area' : 'Add Storage Area'}</h2>
          <button onClick={onClose} className="h-7 w-7 flex items-center justify-center rounded-lg hover:bg-muted text-muted-foreground">
            <X size={15} />
          </button>
        </div>

        <div className="p-5 space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-medium text-muted-foreground">Area Code *</label>
              <Input value={form.storage_area_code} onChange={e => set('storage_area_code', e.target.value)} placeholder="e.g. SA-001" className="mt-1" />
            </div>
            <div>
              <label className="text-xs font-medium text-muted-foreground">Type</label>
              <select value={form.storage_type} onChange={e => set('storage_type', e.target.value)} className="mt-1 h-9 w-full rounded-xl border border-input bg-background px-3 text-sm">
                {STORAGE_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
              </select>
            </div>
          </div>

          <div>
            <label className="text-xs font-medium text-muted-foreground">Name *</label>
            <Input value={form.name} onChange={e => set('name', e.target.value)} placeholder="e.g. Main Stockroom" className="mt-1" />
          </div>

          <div>
            <label className="text-xs font-medium text-muted-foreground">Notes</label>
            <Input value={form.notes} onChange={e => set('notes', e.target.value)} className="mt-1" />
          </div>

          <div className="border border-border rounded-xl p-3 space-y-2">
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Flags</p>
            <div className="grid grid-cols-2 gap-2">
              {[
                ['is_active', 'Active'],
                ['receiving_allowed', 'Receiving Allowed'],
                ['transfer_allowed', 'Transfer Allowed'],
                ['stocktake_allowed', 'Stocktake Allowed'],
                ['is_archived', 'Archived'],
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
        </div>

        <div className="flex justify-end gap-2 px-5 py-4 border-t border-border">
          <button onClick={onClose} className="h-9 px-4 text-sm rounded-xl border border-border bg-background hover:bg-muted text-muted-foreground">
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={saving || !form.storage_area_code.trim() || !form.name.trim()}
            className="h-9 px-4 text-sm rounded-xl bg-primary text-primary-foreground hover:opacity-90 disabled:opacity-50 font-medium"
          >
            {saving ? 'Saving…' : isEdit ? 'Save Changes' : 'Add Area'}
          </button>
        </div>
      </div>
    </div>
  );
}