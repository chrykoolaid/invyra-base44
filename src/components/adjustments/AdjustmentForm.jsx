import { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { ArrowUpCircle, ArrowDownCircle } from 'lucide-react';

const REASONS = [
  { label: 'Stock Found',                      direction: 'IN' },
  { label: 'Stock Correction',                 direction: 'IN' },
  { label: 'Count Variance (Over)',            direction: 'IN' },
  { label: 'Opening Balance',                  direction: 'IN' },
  { label: 'Supplier Short Shipment Correction', direction: 'IN' },
  { label: 'System Correction',               direction: 'IN' },
  { label: 'Count Variance (Under)',           direction: 'OUT' },
  { label: 'Damaged – Not Wastage',            direction: 'OUT' },
  { label: 'Write-Off',                        direction: 'OUT' },
];

export default function AdjustmentForm({ items, locations, storageAreas, userRole, onSubmitted, onCancel }) {
  const [selectedItem, setSelectedItem] = useState('');
  const [selectedLocation, setSelectedLocation] = useState('');
  const [selectedStorageArea, setSelectedStorageArea] = useState('');
  const [reason, setReason] = useState('');
  const [qty, setQty] = useState('');
  const [notes, setNotes] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const selectedReason = REASONS.find(r => r.label === reason);
  const direction = selectedReason?.direction || 'IN';
  const item = items.find(i => i.id === selectedItem);
  const onHand = item?.stock ?? 0;
  const isOverDeduction = direction === 'OUT' && qty && Number(qty) > onHand;

  const canSelfApprove = ['supervisor', 'manager', 'admin', 'owner'].includes((userRole || '').toLowerCase());

  const handleSubmit = async () => {
    if (!selectedItem || !reason || !qty || Number(qty) <= 0 || isOverDeduction) return;
    setSaving(true);
    setError('');

    const payload = {
      item_id: selectedItem,
      qty: Number(qty),
      reason,
      notes,
      direction,
      location_id: selectedLocation || '',
      storage_area_id: selectedStorageArea || '',
      environment: 'LIVE',
    };

    if (canSelfApprove) {
      // Managers/Supervisors: submit draft then immediately approve
      const submitRes = await base44.functions.invoke('submitAdjustmentDraft', payload);
      if (submitRes.data?.error) { setError(submitRes.data.error); setSaving(false); return; }

      const approveRes = await base44.functions.invoke('approveAdjustmentDraft', { draft_id: submitRes.data.draft_id });
      if (approveRes.data?.error) { setError(approveRes.data.error); setSaving(false); return; }

      onSubmitted({ selfApproved: true });
    } else {
      // Staff: submit for approval
      const res = await base44.functions.invoke('submitAdjustmentDraft', payload);
      if (res.data?.error) { setError(res.data.error); setSaving(false); return; }
      onSubmitted({ selfApproved: false });
    }

    setSaving(false);
  };

  const filteredAreas = storageAreas.filter(sa => sa.location_id === selectedLocation);

  return (
    <div className="rounded-2xl border border-border bg-card p-5 space-y-4">
      <h2 className="text-sm font-semibold text-foreground">Create Adjustment</h2>

      {/* Item */}
      <div>
        <label className="block text-[11px] font-semibold uppercase tracking-widest text-muted-foreground mb-1.5">Item</label>
        <select value={selectedItem} onChange={e => setSelectedItem(e.target.value)}
          className="w-full h-9 border border-border rounded-lg px-3 text-sm bg-background focus:outline-none focus:ring-1 focus:ring-ring">
          <option value="">Select item…</option>
          {items.map(it => (
            <option key={it.id} value={it.id}>{it.name} ({it.sku}) — On hand: {it.stock ?? 0}</option>
          ))}
        </select>
      </div>

      {/* Location / Area */}
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-[11px] font-semibold uppercase tracking-widest text-muted-foreground mb-1.5">Location (optional)</label>
          <select value={selectedLocation} onChange={e => { setSelectedLocation(e.target.value); setSelectedStorageArea(''); }}
            className="w-full h-9 border border-border rounded-lg px-3 text-sm bg-background focus:outline-none focus:ring-1 focus:ring-ring">
            <option value="">All locations</option>
            {locations.map(loc => (
              <option key={loc.id} value={loc.id}>{loc.name} ({loc.location_code})</option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-[11px] font-semibold uppercase tracking-widest text-muted-foreground mb-1.5">Storage Area (optional)</label>
          <select value={selectedStorageArea} onChange={e => setSelectedStorageArea(e.target.value)}
            disabled={!selectedLocation}
            className="w-full h-9 border border-border rounded-lg px-3 text-sm bg-background focus:outline-none focus:ring-1 focus:ring-ring disabled:opacity-50">
            <option value="">All areas</option>
            {filteredAreas.map(sa => (
              <option key={sa.id} value={sa.id}>{sa.name} ({sa.storage_area_code})</option>
            ))}
          </select>
        </div>
      </div>

      {/* Reason */}
      <div>
        <label className="block text-[11px] font-semibold uppercase tracking-widest text-muted-foreground mb-1.5">Reason</label>
        <select value={reason} onChange={e => setReason(e.target.value)}
          className="w-full h-9 border border-border rounded-lg px-3 text-sm bg-background focus:outline-none focus:ring-1 focus:ring-ring">
          <option value="">Select reason…</option>
          {REASONS.map(r => <option key={r.label} value={r.label}>{r.label} ({r.direction === 'IN' ? '+' : '−'})</option>)}
        </select>
      </div>

      {reason && (
        <div className={`rounded-lg border px-3 py-2 text-xs font-medium flex items-center gap-2 ${
          direction === 'IN' ? 'border-green-200 bg-green-50 text-green-700' : 'border-red-200 bg-red-50 text-red-700'
        }`}>
          {direction === 'IN' ? <ArrowUpCircle size={14} /> : <ArrowDownCircle size={14} />}
          This adjustment will <strong className="ml-1">{direction === 'IN' ? 'increase (+)' : 'decrease (−)'}</strong> stock
        </div>
      )}

      {isOverDeduction && (
        <div className="rounded-lg border border-red-300 bg-red-50 px-3 py-2 text-xs font-medium text-red-700">
          ⛔ Over-deduction blocked: qty {qty} exceeds on-hand stock of {onHand}. Reduce quantity.
        </div>
      )}

      {/* Qty + Notes */}
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-[11px] font-semibold uppercase tracking-widest text-muted-foreground mb-1.5">Quantity</label>
          <input type="number" min={1} value={qty} onChange={e => setQty(e.target.value)} placeholder="e.g. 5"
            className="w-full h-9 border border-border rounded-lg px-3 text-sm bg-background focus:outline-none focus:ring-1 focus:ring-ring" />
        </div>
        <div>
          <label className="block text-[11px] font-semibold uppercase tracking-widest text-muted-foreground mb-1.5">Notes (optional)</label>
          <input value={notes} onChange={e => setNotes(e.target.value)} placeholder="Additional context…"
            className="w-full h-9 border border-border rounded-lg px-3 text-sm bg-background focus:outline-none focus:ring-1 focus:ring-ring" />
        </div>
      </div>

      {/* Approval hint */}
      {!canSelfApprove && (
        <div className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-800">
          Your adjustment will be submitted for <strong>Supervisor / Manager approval</strong> before being posted to the ledger.
        </div>
      )}

      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">{error}</div>
      )}

      <div className="flex gap-2 justify-end pt-2 border-t border-border">
        <button onClick={onCancel} className="h-9 px-4 text-sm border border-border rounded-xl hover:bg-muted">Cancel</button>
        <button
          onClick={handleSubmit}
          disabled={saving || !selectedItem || !reason || !qty || Number(qty) <= 0 || isOverDeduction}
          className="h-9 px-5 text-sm bg-primary text-primary-foreground rounded-xl hover:opacity-90 disabled:opacity-40 font-medium"
        >
          {saving ? 'Submitting…' : canSelfApprove ? 'Post Adjustment' : 'Submit for Approval'}
        </button>
      </div>
    </div>
  );
}