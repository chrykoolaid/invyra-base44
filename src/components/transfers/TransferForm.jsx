import { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { Plus, Trash2 } from 'lucide-react';

const REASONS = [
  'Replenishment',
  'Stock Balancing',
  'Branch Closing',
  'Excess Stock Transfer',
  'Emergency Request',
  'Damage Replacement',
  'Other',
];

export default function TransferForm({ sites, items, locations, storageAreas, userRole, onSubmitted, onCancel }) {
  const [fromSite, setFromSite] = useState('');
  const [toSite, setToSite] = useState('');
  const [fromLocation, setFromLocation] = useState('');
  const [toLocation, setToLocation] = useState('');
  const [fromStorageArea, setFromStorageArea] = useState('');
  const [toStorageArea, setToStorageArea] = useState('');
  const [reason, setReason] = useState('');
  const [notes, setNotes] = useState('');
  const [lines, setLines] = useState([{ item_id: '', qty: '' }]);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const canSelfApprove = ['supervisor', 'manager', 'admin', 'owner'].includes((userRole || '').toLowerCase());
  const validLines = lines.filter(l => l.item_id && Number(l.qty) > 0);
  const sameSite = fromSite && toSite && fromSite === toSite;

  const addLine = () => setLines(prev => [...prev, { item_id: '', qty: '' }]);
  const removeLine = (i) => setLines(prev => prev.filter((_, idx) => idx !== i));
  const updateLine = (i, field, val) => setLines(prev => prev.map((l, idx) => idx === i ? { ...l, [field]: val } : l));

  const handleSubmit = async () => {
    if (!fromSite || !toSite || sameSite || validLines.length === 0 || !reason) return;
    setSaving(true);
    setError('');

    const res = await base44.functions.invoke('submitTransferDraft', {
      from_site_id: fromSite,
      to_site_id: toSite,
      from_location_id: fromLocation,
      to_location_id: toLocation,
      from_storage_area_id: fromStorageArea,
      to_storage_area_id: toStorageArea,
      lines: validLines.map(l => ({ item_id: l.item_id, qty: Number(l.qty) })),
      reason,
      notes,
      environment: 'LIVE',
    });

    setSaving(false);
    if (res.data?.error) { setError(res.data.error); return; }
    onSubmitted(res.data);
  };

  const fromAreas = storageAreas.filter(sa => sa.location_id === fromLocation);
  const toAreas = storageAreas.filter(sa => sa.location_id === toLocation);

  return (
    <div className="rounded-2xl border border-border bg-card p-5 space-y-4">
      <h2 className="text-sm font-semibold text-foreground">Create Transfer</h2>

      {/* Sites */}
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-[11px] font-semibold uppercase tracking-widest text-muted-foreground mb-1.5">From Site</label>
          <select value={fromSite} onChange={e => setFromSite(e.target.value)}
            className="w-full h-9 border border-border rounded-lg px-3 text-sm bg-background focus:outline-none focus:ring-1 focus:ring-ring">
            <option value="">Select…</option>
            {sites.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
          </select>
        </div>
        <div>
          <label className="block text-[11px] font-semibold uppercase tracking-widest text-muted-foreground mb-1.5">To Site</label>
          <select value={toSite} onChange={e => setToSite(e.target.value)}
            className="w-full h-9 border border-border rounded-lg px-3 text-sm bg-background focus:outline-none focus:ring-1 focus:ring-ring">
            <option value="">Select…</option>
            {sites.filter(s => s.id !== fromSite).map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
          </select>
        </div>
      </div>

      {sameSite && <p className="text-xs text-destructive">Source and destination cannot be the same site.</p>}

      {/* Locations */}
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-[11px] font-semibold uppercase tracking-widest text-muted-foreground mb-1.5">From Location (optional)</label>
          <select value={fromLocation} onChange={e => { setFromLocation(e.target.value); setFromStorageArea(''); }}
            className="w-full h-9 border border-border rounded-lg px-3 text-sm bg-background focus:outline-none focus:ring-1 focus:ring-ring">
            <option value="">All locations</option>
            {locations.map(loc => <option key={loc.id} value={loc.id}>{loc.name} ({loc.location_code})</option>)}
          </select>
        </div>
        <div>
          <label className="block text-[11px] font-semibold uppercase tracking-widest text-muted-foreground mb-1.5">To Location (optional)</label>
          <select value={toLocation} onChange={e => { setToLocation(e.target.value); setToStorageArea(''); }}
            className="w-full h-9 border border-border rounded-lg px-3 text-sm bg-background focus:outline-none focus:ring-1 focus:ring-ring">
            <option value="">All locations</option>
            {locations.map(loc => <option key={loc.id} value={loc.id}>{loc.name} ({loc.location_code})</option>)}
          </select>
        </div>
      </div>

      {/* Storage Areas */}
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-[11px] font-semibold uppercase tracking-widest text-muted-foreground mb-1.5">From Area (optional)</label>
          <select value={fromStorageArea} onChange={e => setFromStorageArea(e.target.value)} disabled={!fromLocation}
            className="w-full h-9 border border-border rounded-lg px-3 text-sm bg-background focus:outline-none focus:ring-1 focus:ring-ring disabled:opacity-50">
            <option value="">All areas</option>
            {fromAreas.map(sa => <option key={sa.id} value={sa.id}>{sa.name}</option>)}
          </select>
        </div>
        <div>
          <label className="block text-[11px] font-semibold uppercase tracking-widest text-muted-foreground mb-1.5">To Area (optional)</label>
          <select value={toStorageArea} onChange={e => setToStorageArea(e.target.value)} disabled={!toLocation}
            className="w-full h-9 border border-border rounded-lg px-3 text-sm bg-background focus:outline-none focus:ring-1 focus:ring-ring disabled:opacity-50">
            <option value="">All areas</option>
            {toAreas.map(sa => <option key={sa.id} value={sa.id}>{sa.name}</option>)}
          </select>
        </div>
      </div>

      {/* Reason */}
      <div>
        <label className="block text-[11px] font-semibold uppercase tracking-widest text-muted-foreground mb-1.5">Reason *</label>
        <select value={reason} onChange={e => setReason(e.target.value)}
          className="w-full h-9 border border-border rounded-lg px-3 text-sm bg-background focus:outline-none focus:ring-1 focus:ring-ring">
          <option value="">Select reason…</option>
          {REASONS.map(r => <option key={r} value={r}>{r}</option>)}
        </select>
      </div>

      {/* Lines */}
      <div>
        <label className="block text-[11px] font-semibold uppercase tracking-widest text-muted-foreground mb-2">Items *</label>
        <div className="space-y-2">
          {lines.map((line, i) => {
            const itemObj = items.find(it => it.id === line.item_id);
            const overTransfer = itemObj && Number(line.qty) > (itemObj.stock || 0);
            return (
              <div key={i} className="flex gap-2 items-center">
                <select value={line.item_id} onChange={e => updateLine(i, 'item_id', e.target.value)}
                  className="flex-1 h-9 border border-border rounded-lg px-3 text-sm bg-background focus:outline-none focus:ring-1 focus:ring-ring">
                  <option value="">Select item…</option>
                  {items.map(it => <option key={it.id} value={it.id}>{it.name} ({it.sku}) — {it.stock ?? 0} on hand</option>)}
                </select>
                <input type="number" min={1} placeholder="Qty" value={line.qty}
                  onChange={e => updateLine(i, 'qty', e.target.value)}
                  className={`w-20 h-9 border rounded-lg px-2 text-sm text-center bg-background focus:outline-none focus:ring-1 focus:ring-ring ${overTransfer ? 'border-red-400' : 'border-border'}`} />
                {lines.length > 1 && (
                  <button onClick={() => removeLine(i)} className="text-muted-foreground hover:text-destructive"><Trash2 size={14} /></button>
                )}
              </div>
            );
          })}
        </div>
        <button onClick={addLine} className="mt-2 text-xs text-muted-foreground hover:text-foreground flex items-center gap-1">
          <Plus size={12} /> Add item
        </button>
      </div>

      {/* Notes */}
      <div>
        <label className="block text-[11px] font-semibold uppercase tracking-widest text-muted-foreground mb-1.5">Notes (optional)</label>
        <input value={notes} onChange={e => setNotes(e.target.value)} placeholder="Driver name, PO ref, comments…"
          className="w-full h-9 border border-border rounded-lg px-3 text-sm bg-background focus:outline-none focus:ring-1 focus:ring-ring" />
      </div>

      {!canSelfApprove && (
        <div className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-800">
          Transfer will be submitted for <strong>Supervisor / Manager approval</strong> before stock is deducted.
        </div>
      )}

      {error && <div className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">{error}</div>}

      <div className="flex gap-2 justify-end pt-2 border-t border-border">
        <button onClick={onCancel} className="h-9 px-4 text-sm border border-border rounded-xl hover:bg-muted">Cancel</button>
        <button
          onClick={handleSubmit}
          disabled={saving || !fromSite || !toSite || sameSite || validLines.length === 0 || !reason}
          className="h-9 px-5 text-sm bg-primary text-primary-foreground rounded-xl hover:opacity-90 disabled:opacity-40 font-medium"
        >
          {saving ? 'Submitting…' : canSelfApprove ? 'Dispatch Transfer' : 'Submit for Approval'}
        </button>
      </div>
    </div>
  );
}