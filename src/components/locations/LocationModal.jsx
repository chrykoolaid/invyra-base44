import { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { X } from 'lucide-react';
import { Input } from '@/components/ui/input';

const LOCATION_TYPES = ['Branch', 'Warehouse', 'Storage', 'Office', 'Other'];

export default function LocationModal({ location, onClose, onSaved }) {
  const isEdit = !!location;
  const [form, setForm] = useState({
    location_code: location?.location_code || '',
    name: location?.name || '',
    location_type: location?.location_type || 'Branch',
    address: location?.address || '',
    city: location?.city || '',
    province: location?.province || '',
    country: location?.country || 'Philippines',
    contact_name: location?.contact_name || '',
    contact_phone: location?.contact_phone || '',
    contact_email: location?.contact_email || '',
    is_active: location?.is_active ?? true,
    is_default: location?.is_default ?? false,
    is_archived: location?.is_archived ?? false,
    transfer_blocked: location?.transfer_blocked ?? false,
    receiving_blocked: location?.receiving_blocked ?? false,
    stocktake_blocked: location?.stocktake_blocked ?? false,
    notes: location?.notes || '',
    environment: 'LIVE',
  });
  const [saving, setSaving] = useState(false);

  const set = (key, val) => setForm(f => ({ ...f, [key]: val }));

  const handleSave = async () => {
    if (!form.location_code.trim() || !form.name.trim()) return;
    setSaving(true);
    if (isEdit) {
      await base44.entities.Location.update(location.id, form);
    } else {
      await base44.entities.Location.create(form);
    }
    setSaving(false);
    onSaved();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
      <div className="bg-card border border-border rounded-2xl shadow-xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between px-5 py-4 border-b border-border">
          <h2 className="text-base font-semibold text-foreground">{isEdit ? 'Edit Location' : 'Add Location'}</h2>
          <button onClick={onClose} className="h-7 w-7 flex items-center justify-center rounded-lg hover:bg-muted text-muted-foreground">
            <X size={15} />
          </button>
        </div>

        <div className="p-5 space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-medium text-muted-foreground">Location Code *</label>
              <Input value={form.location_code} onChange={e => set('location_code', e.target.value)} placeholder="e.g. BR-001" className="mt-1" />
            </div>
            <div>
              <label className="text-xs font-medium text-muted-foreground">Type</label>
              <select value={form.location_type} onChange={e => set('location_type', e.target.value)} className="mt-1 h-9 w-full rounded-xl border border-input bg-background px-3 text-sm">
                {LOCATION_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
              </select>
            </div>
          </div>

          <div>
            <label className="text-xs font-medium text-muted-foreground">Name *</label>
            <Input value={form.name} onChange={e => set('name', e.target.value)} placeholder="e.g. Iloilo Main Branch" className="mt-1" />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-medium text-muted-foreground">City</label>
              <Input value={form.city} onChange={e => set('city', e.target.value)} className="mt-1" />
            </div>
            <div>
              <label className="text-xs font-medium text-muted-foreground">Province</label>
              <Input value={form.province} onChange={e => set('province', e.target.value)} className="mt-1" />
            </div>
          </div>

          <div>
            <label className="text-xs font-medium text-muted-foreground">Address</label>
            <Input value={form.address} onChange={e => set('address', e.target.value)} className="mt-1" />
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="text-xs font-medium text-muted-foreground">Contact Name</label>
              <Input value={form.contact_name} onChange={e => set('contact_name', e.target.value)} className="mt-1" />
            </div>
            <div>
              <label className="text-xs font-medium text-muted-foreground">Phone</label>
              <Input value={form.contact_phone} onChange={e => set('contact_phone', e.target.value)} className="mt-1" />
            </div>
            <div>
              <label className="text-xs font-medium text-muted-foreground">Email</label>
              <Input value={form.contact_email} onChange={e => set('contact_email', e.target.value)} className="mt-1" />
            </div>
          </div>

          <div>
            <label className="text-xs font-medium text-muted-foreground">Notes</label>
            <Input value={form.notes} onChange={e => set('notes', e.target.value)} className="mt-1" />
          </div>

          <div className="border border-border rounded-xl p-3 space-y-2">
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Status & Flags</p>
            <div className="grid grid-cols-2 gap-2">
              {[
                ['is_active', 'Active'],
                ['is_default', 'Default Location'],
                ['transfer_blocked', 'Transfer Blocked'],
                ['receiving_blocked', 'Receiving Blocked'],
                ['stocktake_blocked', 'Stocktake Blocked'],
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
            disabled={saving || !form.location_code.trim() || !form.name.trim()}
            className="h-9 px-4 text-sm rounded-xl bg-primary text-primary-foreground hover:opacity-90 disabled:opacity-50 font-medium"
          >
            {saving ? 'Saving…' : isEdit ? 'Save Changes' : 'Add Location'}
          </button>
        </div>
      </div>
    </div>
  );
}