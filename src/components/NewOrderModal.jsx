import { useState } from 'react';
import { X, Plus, Trash2 } from 'lucide-react';
import { base44 } from '@/api/base44Client';

const SUPPLIERS = [
  'ChemSupply Co', 'CleanTex Distributors', 'PackPro Solutions',
  'LaundryChem Direct', 'SafetyFirst Supplies', 'HangerCo Wholesale', 'ProWash Ingredients',
];

const SUPPLIER_EMAILS = {
  'ChemSupply Co':         'alan@chemsupply.com',
  'CleanTex Distributors': 'maria@cleantex.com',
  'PackPro Solutions':     'james@packpro.com',
  'LaundryChem Direct':    'tracy@laundrychem.com',
  'SafetyFirst Supplies':  'donna@safetyfirst.com',
  'HangerCo Wholesale':    'ben@hangerco.com',
  'ProWash Ingredients':   'sam@prowash.com',
};

let _lc = 100;
function nextLineId() { return `nl-${_lc++}`; }

function generateOrderNumber() {
  const year = new Date().getFullYear();
  const seq = String(Math.floor(Math.random() * 900) + 100);
  return `PO-${year}-M${seq}`;
}

export default function NewOrderModal({ onClose, onCreated }) {
  const [form, setForm] = useState({
    supplier: SUPPLIERS[0],
    expected_date: '',
    urgency: 'low',
    notes: '',
  });
  const [lines, setLines] = useState([
    { line_id: nextLineId(), sku: '', name: '', qty: 1, unit_cost: null, supplier: SUPPLIERS[0] },
  ]);
  const [saving, setSaving] = useState(false);

  const updateForm = (field, value) => setForm(f => ({ ...f, [field]: value }));

  const addLine = () => setLines(prev => [...prev, {
    line_id: nextLineId(), sku: '', name: '', qty: 1, unit_cost: null, supplier: form.supplier,
  }]);

  const removeLine = (id) => setLines(prev => prev.filter(l => l.line_id !== id));

  const updateLine = (id, field, value) =>
    setLines(prev => prev.map(l => l.line_id === id ? { ...l, [field]: value } : l));

  const handleSave = async (asDraft) => {
    setSaving(true);
    const orderNumber = generateOrderNumber();
    const record = await base44.entities.PurchaseOrder.create({
      order_number: orderNumber,
      supplier: form.supplier,
      supplier_email: SUPPLIER_EMAILS[form.supplier] || '',
      status: asDraft ? 'Draft' : 'Submitted',
      source: 'Manual',
      notes: form.notes,
      expected_date: form.expected_date || null,
      urgency: form.urgency,
      lines: lines.filter(l => l.name || l.sku),
      submitted_at: asDraft ? null : new Date().toISOString(),
    });
    setSaving(false);
    onCreated(record, asDraft);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="bg-card border border-border rounded-xl shadow-xl w-full max-w-2xl max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-3.5 border-b border-border">
          <h2 className="text-base font-semibold text-foreground">New Purchase Order</h2>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground transition-colors">
            <X size={16} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-5 space-y-5">
          {/* Order details */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs text-muted-foreground mb-1">Supplier *</label>
              <select value={form.supplier} onChange={e => updateForm('supplier', e.target.value)}
                className="w-full h-8 border border-border rounded px-2 text-sm bg-card focus:outline-none focus:ring-1 focus:ring-ring">
                {SUPPLIERS.map(s => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs text-muted-foreground mb-1">Expected Date</label>
              <input type="date" value={form.expected_date} onChange={e => updateForm('expected_date', e.target.value)}
                className="w-full h-8 border border-border rounded px-2 text-sm bg-card focus:outline-none focus:ring-1 focus:ring-ring" />
            </div>
            <div>
              <label className="block text-xs text-muted-foreground mb-1">Urgency</label>
              <select value={form.urgency} onChange={e => updateForm('urgency', e.target.value)}
                className="w-full h-8 border border-border rounded px-2 text-sm bg-card focus:outline-none focus:ring-1 focus:ring-ring">
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
              </select>
            </div>
            <div>
              <label className="block text-xs text-muted-foreground mb-1">Notes</label>
              <input value={form.notes} onChange={e => updateForm('notes', e.target.value)}
                placeholder="Optional notes…"
                className="w-full h-8 border border-border rounded px-2 text-sm bg-card focus:outline-none focus:ring-1 focus:ring-ring" />
            </div>
          </div>

          {/* Lines */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-widest">Order Lines</p>
            </div>
            <div className="border border-border rounded overflow-hidden mb-2">
              <table className="w-full text-sm">
                <thead className="bg-muted/40 text-muted-foreground text-xs uppercase tracking-wide">
                  <tr>
                    {['SKU', 'Item Name', 'Qty', 'Unit Cost', ''].map(h => (
                      <th key={h} className="text-left px-3 py-2 font-medium whitespace-nowrap">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {lines.map((line, i) => (
                    <tr key={line.line_id} className={`border-t border-border ${i % 2 === 0 ? 'bg-card' : 'bg-background'}`}>
                      <td className="px-3 py-1.5">
                        <input value={line.sku} onChange={e => updateLine(line.line_id, 'sku', e.target.value)}
                          placeholder="SKU"
                          className="w-20 h-7 border border-border rounded px-2 text-xs bg-card focus:outline-none focus:ring-1 focus:ring-ring font-mono" />
                      </td>
                      <td className="px-3 py-1.5">
                        <input value={line.name} onChange={e => updateLine(line.line_id, 'name', e.target.value)}
                          placeholder="Item name"
                          className="w-44 h-7 border border-border rounded px-2 text-xs bg-card focus:outline-none focus:ring-1 focus:ring-ring" />
                      </td>
                      <td className="px-3 py-1.5">
                        <input type="number" min={1} value={line.qty}
                          onChange={e => updateLine(line.line_id, 'qty', Math.max(1, Number(e.target.value)))}
                          className="w-16 h-7 border border-border rounded px-2 text-xs text-center bg-card focus:outline-none focus:ring-1 focus:ring-ring" />
                      </td>
                      <td className="px-3 py-1.5">
                        <input type="number" min={0} step="0.01" value={line.unit_cost ?? ''}
                          onChange={e => updateLine(line.line_id, 'unit_cost', e.target.value === '' ? null : Number(e.target.value))}
                          placeholder="—"
                          className="w-20 h-7 border border-border rounded px-2 text-xs bg-card focus:outline-none focus:ring-1 focus:ring-ring" />
                      </td>
                      <td className="px-3 py-1.5">
                        {lines.length > 1 && (
                          <button onClick={() => removeLine(line.line_id)}
                            className="text-muted-foreground hover:text-destructive transition-colors">
                            <Trash2 size={12} />
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <button onClick={addLine}
              className="flex items-center gap-1.5 h-7 px-3 text-xs border border-border rounded bg-card hover:bg-muted transition-colors text-foreground">
              <Plus size={12} /> Add Line
            </button>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-2 px-5 py-3 border-t border-border">
          <button onClick={onClose}
            className="h-9 px-4 text-sm rounded border border-border bg-card hover:bg-muted transition-colors text-foreground">
            Cancel
          </button>
          <button onClick={() => handleSave(true)} disabled={saving}
            className="h-9 px-4 text-sm rounded border border-border bg-card hover:bg-muted transition-colors text-foreground disabled:opacity-40">
            Save as Draft
          </button>
          <button onClick={() => handleSave(false)} disabled={saving}
            className="h-9 px-5 text-sm rounded bg-primary text-primary-foreground hover:opacity-90 transition-opacity disabled:opacity-40 font-medium">
            {saving ? 'Creating…' : 'Submit Order'}
          </button>
        </div>
      </div>
    </div>
  );
}