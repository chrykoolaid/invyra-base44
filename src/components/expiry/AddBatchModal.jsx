import { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { envFilter } from '@/lib/envFilter';
import { X } from 'lucide-react';

export default function AddBatchModal({ onClose, onSuccess }) {
  const [items, setItems] = useState([]);
  const [form, setForm] = useState({
    item_id: '', sku: '', item_name: '',
    batch_number: '', lot_number: '', supplier_batch_number: '',
    expiry_date: '', received_date: '', quantity: '',
    supplier_name: '', status: 'Active', notes: '',
  });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    base44.entities.InventoryItem.filter({ ...envFilter(), is_active: true }, 'name', 200)
      .then(rows => setItems(rows || []));
  }, []);

  const handleItemChange = (id) => {
    const item = items.find(i => i.id === id);
    if (item) setForm(f => ({ ...f, item_id: id, sku: item.sku || '', item_name: item.name }));
  };

  const set = (key, val) => setForm(f => ({ ...f, [key]: val }));

  const handleSave = async () => {
    if (!form.item_id || !form.batch_number || !form.expiry_date || !form.quantity) return;
    setSaving(true);
    await base44.entities.ItemBatch.create({
      ...form,
      quantity: Number(form.quantity),
      environment: 'LIVE',
    });
    setSaving(false);
    onSuccess();
  };

  const Field = ({ label, required, children }) => (
    <div>
      <label className="block text-[11px] font-semibold uppercase tracking-widest text-muted-foreground mb-1">
        {label}{required && <span className="text-red-500 ml-0.5">*</span>}
      </label>
      {children}
    </div>
  );

  const inputCls = "w-full h-8 border border-border rounded-lg px-3 text-sm bg-background focus:outline-none focus:ring-1 focus:ring-ring";

  return (
    <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4">
      <div className="bg-card rounded-2xl border border-border shadow-xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between px-5 py-4 border-b border-border">
          <h2 className="text-sm font-semibold text-foreground">Add Batch / Lot Record</h2>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground"><X size={16} /></button>
        </div>
        <div className="p-5 space-y-3.5">
          <Field label="Item" required>
            <select value={form.item_id} onChange={e => handleItemChange(e.target.value)}
              className={inputCls}>
              <option value="">Select item…</option>
              {items.map(i => <option key={i.id} value={i.id}>{i.name} ({i.sku})</option>)}
            </select>
          </Field>

          <div className="grid grid-cols-2 gap-3">
            <Field label="Batch Number" required>
              <input className={inputCls} value={form.batch_number} onChange={e => set('batch_number', e.target.value)} placeholder="e.g. BATCH-001" />
            </Field>
            <Field label="Lot Number">
              <input className={inputCls} value={form.lot_number} onChange={e => set('lot_number', e.target.value)} placeholder="Manufacturer lot" />
            </Field>
          </div>

          <Field label="Supplier Batch Number">
            <input className={inputCls} value={form.supplier_batch_number} onChange={e => set('supplier_batch_number', e.target.value)} placeholder="Supplier's reference" />
          </Field>

          <div className="grid grid-cols-2 gap-3">
            <Field label="Expiry Date" required>
              <input type="date" className={inputCls} value={form.expiry_date} onChange={e => set('expiry_date', e.target.value)} />
            </Field>
            <Field label="Received Date">
              <input type="date" className={inputCls} value={form.received_date} onChange={e => set('received_date', e.target.value)} />
            </Field>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <Field label="Quantity" required>
              <input type="number" min={0} className={inputCls} value={form.quantity} onChange={e => set('quantity', e.target.value)} placeholder="0" />
            </Field>
            <Field label="Status">
              <select className={inputCls} value={form.status} onChange={e => set('status', e.target.value)}>
                {['Active', 'Near Expiry', 'Expired', 'Depleted', 'Quarantine', 'Disposed'].map(s => <option key={s}>{s}</option>)}
              </select>
            </Field>
          </div>

          <Field label="Supplier Name">
            <input className={inputCls} value={form.supplier_name} onChange={e => set('supplier_name', e.target.value)} placeholder="Optional supplier name" />
          </Field>

          <Field label="Notes">
            <textarea className="w-full border border-border rounded-lg px-3 py-2 text-sm bg-background focus:outline-none focus:ring-1 focus:ring-ring resize-none h-16"
              value={form.notes} onChange={e => set('notes', e.target.value)} placeholder="Optional notes…" />
          </Field>
        </div>
        <div className="flex justify-end gap-2 px-5 py-4 border-t border-border">
          <button onClick={onClose} className="h-8 px-4 text-sm rounded-lg border border-border bg-card hover:bg-muted transition-colors">Cancel</button>
          <button
            onClick={handleSave}
            disabled={saving || !form.item_id || !form.batch_number || !form.expiry_date || !form.quantity}
            className="h-8 px-5 text-sm bg-primary text-primary-foreground rounded-lg hover:opacity-90 transition-opacity disabled:opacity-40"
          >
            {saving ? 'Saving…' : 'Save Batch'}
          </button>
        </div>
      </div>
    </div>
  );
}