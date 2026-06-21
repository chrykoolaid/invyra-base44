import { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { ShieldCheck, X } from 'lucide-react';
import { Input } from '@/components/ui/input';

const LOCATION_TYPES = ['Branch', 'Warehouse', 'Store', 'Backroom', 'Office', 'Other'];

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
    default_receiving_area: location?.default_receiving_area || '',
    is_active: location?.is_active ?? true,
    is_default: location?.is_default ?? false,
    is_archived: false,
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
    try {
      if (isEdit) {
        await base44.entities.Location.update(location.id, form);
      } else {
        await base44.entities.Location.create(form);
      }
      onSaved();
    } catch (err) {
      console.error('Failed to save location:', err);
      alert('Failed to save location metadata.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="bg-card border border-border rounded-2xl shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between px-5 py-4 border-b border-border">
          <div>
            <h2 className="text-base font-semibold text-foreground">{isEdit ? 'Edit Location Metadata' : 'Add Location'}</h2>
            <p className="text-xs text-muted-foreground mt-0.5">Location setup only. This does not change stock balances.</p>
          </div>
          <button onClick={onClose} className="h-7 w-7 flex items-center justify-center rounded-lg hover:bg-muted text-muted-foreground">
            <X size={15} />
          </button>
        </div>

        <div className="p-5 space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-medium text-muted-foreground">Location Name *</label>
              <Input value={form.name} onChange={e => set('name', e.target.value)} placeholder="e.g. Iloilo Main Branch" className="mt-1" />
            </div>
            <div>
              <label className="text-xs font-medium text-muted-foreground">Location Code *</label>
              <Input value={form.location_code} onChange={e => set('location_code', e.target.value)} placeholder="e.g. BR-001" className="mt-1" />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-medium text-muted-foreground">Location Type</label>
              <select value={form.location_type} onChange={e => set('location_type', e.target.value)} className="mt-1 h-9 w-full rounded-xl border border-input bg-background px-3 text-sm">
                {LOCATION_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
              </select>
            </div>
            <div>
              <label className="text-xs font-medium text-muted-foreground">Status</label>
              <select value={form.is_active ? 'active' : 'inactive'} onChange={e => set('is_active', e.target.value === 'active')} className="mt-1 h-9 w-full rounded-xl border border-input bg-background px-3 text-sm">
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
              </select>
            </div>
          </div>

          <div>
            <label className="text-xs font-medium text-muted-foreground">Address or Description</label>
            <Input value={form.address} onChange={e => set('address', e.target.value)} placeholder="Optional address or operational description" className="mt-1" />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
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
            <label className="text-xs font-medium text-muted-foreground">Default Receiving Area</label>
            <Input value={form.default_receiving_area} onChange={e => set('default_receiving_area', e.target.value)} placeholder="Optional storage area name/code" className="mt-1" />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
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
            <Input value={form.notes} onChange={e => set('notes', e.target.value)} placeholder="Optional setup notes" className="mt-1" />
          </div>

          <div className="border border-border rounded-xl p-3 space-y-2 bg-muted/10">
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Metadata Flags</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {[
                ['is_default', 'Default Location'],
                ['receiving_blocked', 'Receiving Blocked'],
                ['transfer_blocked', 'Transfer Blocked'],
                ['stocktake_blocked', 'Stocktake Blocked'],
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

          <div className="border border-border rounded-xl p-3 bg-background flex items-start gap-2 text-xs text-muted-foreground">
            <ShieldCheck size={14} className="mt-0.5 shrink-0" />
            <p>Deactivation preserves historical records. Locations with stock history should not be deleted; this form only saves metadata.</p>
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
            {saving ? 'Saving…' : isEdit ? 'Save Metadata' : 'Add Location'}
          </button>
        </div>
      </div>
    </div>
  );
}
