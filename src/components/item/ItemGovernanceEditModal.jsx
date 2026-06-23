import { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { X, ShieldCheck, Lock } from 'lucide-react';

const CATEGORIES = ['Food & Beverage', 'Cleaning & Sanitation', 'Office Supplies', 'Packaging', 'Equipment', 'Perishable', 'Non-Perishable', 'Other'];
const TAX_GROUPS = ['VAT Exempt', 'VAT Inclusive (12%)', 'Zero Rated', 'Non-VAT'];

function Toggle({ label, description, checked, onChange }) {
  return (
    <div className="flex items-center justify-between gap-4 rounded-lg border border-border bg-background px-3 py-2.5">
      <div className="min-w-0">
        <p className="text-xs font-medium text-foreground">{label}</p>
        {description && <p className="text-[11px] text-muted-foreground mt-0.5">{description}</p>}
      </div>
      <button
        type="button"
        onClick={() => onChange(!checked)}
        className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors focus:outline-none ${
          checked === true ? 'bg-green-500' : checked === false ? 'bg-slate-300' : 'bg-amber-300'
        }`}
      >
        <span
          className={`pointer-events-none inline-block h-4 w-4 rounded-full bg-white shadow transform transition-transform ${
            checked === true ? 'translate-x-4' : 'translate-x-0'
          }`}
        />
      </button>
    </div>
  );
}

export default function ItemGovernanceEditModal({ item, onClose, onSaved }) {
  const [form, setForm] = useState({
    name: item.name || '',
    unit: item.unit || 'pcs',
    product_category: item.product_category || '',
    pack_size: item.pack_size || '',
    tax_group: item.tax_group || '',
    is_active: item.is_active !== false,
    pos_sellable: item.pos_sellable ?? null,
    reorder_eligible: item.reorder_eligible ?? null,
    expiry_tracking_required: item.expiry_tracking_required ?? null,
    batch_tracking_required: item.batch_tracking_required ?? null,
    markdown_eligible: item.markdown_eligible ?? null,
    wastage_eligible: item.wastage_eligible ?? null,
    stocktake_eligible: item.stocktake_eligible ?? null,
    transfer_eligible: item.transfer_eligible ?? null,
    preferred_supplier: item.preferred_supplier || '',
    supplier_item_code: item.supplier_item_code || '',
    supplier_pack_size: item.supplier_pack_size || '',
    supplier_uom: item.supplier_uom || '',
    governance_notes: item.governance_notes || '',
  });
  const [reason, setReason] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const set = (field, value) => setForm(prev => ({ ...prev, [field]: value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!reason.trim()) { setError('A reason for this change is required.'); return; }
    setSaving(true);
    setError('');

    try {
      const res = await base44.functions.invoke('updateItemGovernance', {
        item_id: item.id,
        governance_reason: reason.trim(),
        ...form,
      });
      if (res.data?.error) { setError(res.data.error); return; }
      onSaved(res.data.item);
    } catch (err) {
      console.error('Failed to save item governance:', err);
      setError('Failed to save governance metadata. No stock, price, or movement data was changed.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/40 flex items-start justify-center p-4 overflow-y-auto">
      <div className="w-full max-w-2xl bg-card border border-border rounded-xl shadow-xl my-8">
        {/* Header */}
        <div className="flex items-start justify-between px-5 py-4 border-b border-border">
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-base font-semibold text-foreground">Edit Item Governance</h2>
              <span className="inline-flex items-center gap-1 rounded-full border border-blue-200 bg-blue-50 px-2 py-0.5 text-[11px] font-medium text-blue-700">
                <ShieldCheck size={10} /> Metadata Only
              </span>
              <span className="inline-flex items-center gap-1 rounded-full border border-slate-200 bg-slate-100 px-2 py-0.5 text-[11px] font-medium text-slate-700">
                <Lock size={10} /> No Stock Mutation
              </span>
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              <span className="font-mono">{item.sku}</span> — Changes are audit-logged and do not affect stock balances.
            </p>
          </div>
          <button onClick={onClose} className="h-7 w-7 flex items-center justify-center rounded hover:bg-muted text-muted-foreground">
            <X size={15} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="px-5 py-5 space-y-6">
          {/* Identity */}
          <section>
            <h3 className="text-xs font-semibold uppercase tracking-widest text-muted-foreground mb-3">Identity</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <label className="space-y-1">
                <span className="text-xs text-muted-foreground">Item Name *</span>
                <input value={form.name} onChange={e => set('name', e.target.value)} required
                  className="h-9 w-full border border-border rounded-lg px-3 text-sm bg-background focus:outline-none focus:ring-1 focus:ring-ring" />
              </label>
              <label className="space-y-1">
                <span className="text-xs text-muted-foreground">Unit of Measure</span>
                <input value={form.unit} onChange={e => set('unit', e.target.value)} placeholder="pcs"
                  className="h-9 w-full border border-border rounded-lg px-3 text-sm bg-background focus:outline-none focus:ring-1 focus:ring-ring" />
              </label>
              <label className="space-y-1">
                <span className="text-xs text-muted-foreground">Product Category</span>
                <select value={form.product_category} onChange={e => set('product_category', e.target.value)}
                  className="h-9 w-full border border-border rounded-lg px-3 text-sm bg-background focus:outline-none focus:ring-1 focus:ring-ring">
                  <option value="">— Select —</option>
                  {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </label>
              <label className="space-y-1">
                <span className="text-xs text-muted-foreground">Pack Size</span>
                <input value={form.pack_size} onChange={e => set('pack_size', e.target.value)} placeholder="e.g. 12 x 500ml"
                  className="h-9 w-full border border-border rounded-lg px-3 text-sm bg-background focus:outline-none focus:ring-1 focus:ring-ring" />
              </label>
              <label className="space-y-1">
                <span className="text-xs text-muted-foreground">Tax Group</span>
                <select value={form.tax_group} onChange={e => set('tax_group', e.target.value)}
                  className="h-9 w-full border border-border rounded-lg px-3 text-sm bg-background focus:outline-none focus:ring-1 focus:ring-ring">
                  <option value="">— Select —</option>
                  {TAX_GROUPS.map(t => <option key={t} value={t}>{t}</option>)}
                </select>
              </label>
              <div className="flex items-center gap-2 pt-5">
                <input type="checkbox" id="is_active" checked={form.is_active} onChange={e => set('is_active', e.target.checked)} />
                <label htmlFor="is_active" className="text-sm text-foreground cursor-pointer">Active item</label>
              </div>
            </div>
          </section>

          {/* Operational Rules */}
          <section>
            <h3 className="text-xs font-semibold uppercase tracking-widest text-muted-foreground mb-3">Operational Rules</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              <Toggle label="POS Sellable" checked={form.pos_sellable} onChange={v => set('pos_sellable', v)} />
              <Toggle label="Reorder Eligible" checked={form.reorder_eligible} onChange={v => set('reorder_eligible', v)} />
              <Toggle label="Expiry Tracking Required" checked={form.expiry_tracking_required} onChange={v => set('expiry_tracking_required', v)} />
              <Toggle label="Batch Tracking Required" checked={form.batch_tracking_required} onChange={v => set('batch_tracking_required', v)} />
              <Toggle label="Markdown Eligible" checked={form.markdown_eligible} onChange={v => set('markdown_eligible', v)} />
              <Toggle label="Wastage Eligible" checked={form.wastage_eligible} onChange={v => set('wastage_eligible', v)} />
              <Toggle label="Stocktake Eligible" checked={form.stocktake_eligible} onChange={v => set('stocktake_eligible', v)} />
              <Toggle label="Transfer Eligible" checked={form.transfer_eligible} onChange={v => set('transfer_eligible', v)} />
            </div>
            <p className="text-[11px] text-muted-foreground mt-2">Toggles are read by downstream workflows. They do not create movements or alerts.</p>
          </section>

          {/* Supplier Reference */}
          <section>
            <h3 className="text-xs font-semibold uppercase tracking-widest text-muted-foreground mb-3">Supplier Reference</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <label className="space-y-1">
                <span className="text-xs text-muted-foreground">Preferred Supplier</span>
                <input value={form.preferred_supplier} onChange={e => set('preferred_supplier', e.target.value)}
                  className="h-9 w-full border border-border rounded-lg px-3 text-sm bg-background focus:outline-none focus:ring-1 focus:ring-ring" />
              </label>
              <label className="space-y-1">
                <span className="text-xs text-muted-foreground">Supplier Item Code</span>
                <input value={form.supplier_item_code} onChange={e => set('supplier_item_code', e.target.value)} placeholder="Supplier's SKU or reference"
                  className="h-9 w-full border border-border rounded-lg px-3 text-sm bg-background focus:outline-none focus:ring-1 focus:ring-ring" />
              </label>
              <label className="space-y-1">
                <span className="text-xs text-muted-foreground">Supplier Pack Size</span>
                <input value={form.supplier_pack_size} onChange={e => set('supplier_pack_size', e.target.value)}
                  className="h-9 w-full border border-border rounded-lg px-3 text-sm bg-background focus:outline-none focus:ring-1 focus:ring-ring" />
              </label>
              <label className="space-y-1">
                <span className="text-xs text-muted-foreground">Supplier UOM</span>
                <input value={form.supplier_uom} onChange={e => set('supplier_uom', e.target.value)}
                  className="h-9 w-full border border-border rounded-lg px-3 text-sm bg-background focus:outline-none focus:ring-1 focus:ring-ring" />
              </label>
            </div>
            <p className="text-[11px] text-muted-foreground mt-2">Supplier references do not own item identity. Inventory remains the source of truth.</p>
          </section>

          {/* Governance Notes */}
          <section>
            <h3 className="text-xs font-semibold uppercase tracking-widest text-muted-foreground mb-3">Notes</h3>
            <textarea value={form.governance_notes} onChange={e => set('governance_notes', e.target.value)}
              rows={2} placeholder="Optional governance context or notes…"
              className="w-full border border-border rounded-lg px-3 py-2 text-sm bg-background focus:outline-none focus:ring-1 focus:ring-ring resize-none" />
          </section>

          {/* Audit Reason — mandatory */}
          <section className="rounded-xl border border-amber-200 bg-amber-50 p-4 space-y-2">
            <label className="text-xs font-semibold text-amber-900 uppercase tracking-widest">Reason for Change *</label>
            <input
              value={reason}
              onChange={e => setReason(e.target.value)}
              required
              placeholder="e.g. Annual catalogue review — pack size updated to match new supplier format"
              className="h-9 w-full border border-amber-300 rounded-lg px-3 text-sm bg-white focus:outline-none focus:ring-1 focus:ring-amber-400"
            />
            <p className="text-[11px] text-amber-800">This reason is stored in the audit log and cannot be changed after saving.</p>
          </section>

          {error && <div className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">{error}</div>}

          <div className="flex items-center justify-end gap-2 pt-2 border-t border-border">
            <button type="button" onClick={onClose} disabled={saving}
              className="h-9 px-4 text-sm border border-border rounded-lg hover:bg-muted transition-colors">
              Cancel
            </button>
            <button type="submit" disabled={saving || !reason.trim()}
              className="h-9 px-5 text-sm bg-primary text-primary-foreground rounded-lg hover:opacity-90 disabled:opacity-50 font-medium">
              {saving ? 'Saving…' : 'Save Governance'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}