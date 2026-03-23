import { useState } from 'react';
import { ArrowLeft, Clock, Plus, Trash2 } from 'lucide-react';

const SUPPLIERS = [
  'ChemSupply Co', 'CleanTex Distributors', 'PackPro Solutions',
  'LaundryChem Direct', 'SafetyFirst Supplies', 'HangerCo Wholesale', 'ProWash Ingredients',
];

const urgencyStyle = {
  low:      'bg-green-50 text-green-700 border border-green-200',
  medium:   'bg-amber-50 text-amber-700 border border-amber-200',
  high:     'bg-red-50 text-red-700 border border-red-200',
  critical: 'bg-red-100 text-red-800 border border-red-300',
};

function SectionHeading({ children }) {
  return (
    <div className="flex items-center gap-3 mb-4">
      <span className="text-[11px] font-semibold text-muted-foreground uppercase tracking-widest whitespace-nowrap">{children}</span>
      <div className="flex-1 border-t border-border" />
    </div>
  );
}

function ReadField({ label, value }) {
  return (
    <div>
      <p className="text-[11px] text-muted-foreground mb-1">{label}</p>
      <p className="text-sm text-foreground">{value ?? '—'}</p>
    </div>
  );
}

function buildInitialLines(order) {
  if (order.lines && order.lines.length > 0) return order.lines;
  return [{
    line_id:   'line-1',
    sku:       order.orderNumber,
    name:      order.supplier,
    qty:       order.suggestedQty ?? 1,
    unit_cost: null,
    supplier:  order.supplier,
    source:    order.source ?? 'manual',
  }];
}

let _lc = 1;
function nextLineId() { return `line-${_lc++}`; }

const STEPS = [
  { n: 1, label: 'Order Details' },
  { n: 2, label: 'Review Order' },
  { n: 3, label: 'Submit' },
];

export default function DraftOrderWorkspace({ order, onBack, onSubmit }) {
  const [step, setStep] = useState(1);
  const [sourceFilter, setSourceFilter] = useState('All');
  const [form, setForm] = useState({
    supplier:     order.supplier,
    expectedDate: order.expectedDate,
    notes:        order.notes || '',
  });
  const [lines, setLines] = useState(() => buildInitialLines(order));
  const [approved, setApproved] = useState(false);
  const [rejected, setRejected] = useState(false);

  const updateQty = (line_id, val) => {
    const n = Math.max(0, Number(val));
    if (!isNaN(n)) setLines(prev => prev.map(l => l.line_id === line_id ? { ...l, qty: n } : l));
  };
  const removeLine = (line_id) => setLines(prev => prev.filter(l => l.line_id !== line_id));
  const addLine = () => setLines(prev => [...prev, {
    line_id: nextLineId(), sku: '', name: '', qty: 1, unit_cost: null,
    supplier: form.supplier, source: 'manual',
  }]);
  const updateField = (line_id, field, value) =>
    setLines(prev => prev.map(l => l.line_id === line_id ? { ...l, [field]: value } : l));

  const handleSubmit = () => {
    if (!approved) return;
    onSubmit({ ...order, supplier: form.supplier, expectedDate: form.expectedDate, notes: form.notes, lines, status: 'Submitted' });
  };

  const footerLabel = approved ? 'Approved — ready to submit' : rejected ? 'Marked for rejection' : 'Pending decision';
  const footerStyle = approved
    ? 'bg-green-50 text-green-700 border border-green-200'
    : rejected ? 'bg-red-50 text-red-600 border border-red-200' : 'bg-muted text-muted-foreground';

  const visibleLines = sourceFilter === 'All' ? lines : lines.filter(l => l.source === sourceFilter);
  const currentStatus = approved ? 'Approved' : 'Draft';

  return (
    <div className="flex flex-col min-h-screen">
      <div className="flex-1 p-6 max-w-[960px] pb-28">

        {/* Back */}
        <button onClick={onBack}
          className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground mb-5 transition-colors">
          <ArrowLeft size={14} /> Back to Orders
        </button>

        {/* Page header */}
        <div className="mb-5">
          <div className="flex items-baseline gap-3 mb-1">
            <h1 className="text-lg font-semibold text-foreground">Draft Order Workspace</h1>
            <span className="text-sm font-mono text-muted-foreground">{order.orderNumber}</span>
            <span className="text-xs px-2 py-0.5 rounded-full font-medium bg-muted text-muted-foreground border border-border">
              {currentStatus}
            </span>
          </div>
          <p className="text-xs text-muted-foreground">
            Source: <span className="font-medium text-foreground/70">{order.sourceModule}</span>
            <span className="mx-2">·</span>
            {order.triggerReason}
            <span className="mx-2">·</span>
            <span className={`inline-flex px-1.5 py-0.5 rounded text-[10px] font-semibold ${urgencyStyle[order.urgency]}`}>
              {order.urgency.charAt(0).toUpperCase() + order.urgency.slice(1)}
            </span>
          </p>
        </div>

        {/* Step navigation */}
        <div className="flex items-center gap-0 border-b border-border mb-6">
          {STEPS.map(({ n, label }) => (
            <button key={n} onClick={() => setStep(n)}
              className={`text-xs px-5 py-2.5 border-b-2 transition-colors font-medium ${
                step === n ? 'border-primary text-primary' : 'border-transparent text-muted-foreground hover:text-foreground'
              }`}>
              {n}. {label}
            </button>
          ))}
          <div className="ml-auto flex items-center gap-1.5 pb-1 pr-1">
            {STEPS.map(({ n, label }, i) => (
              <span key={n} className="flex items-center gap-1.5">
                <span className={`text-[10px] px-2 py-0.5 rounded font-medium ${
                  n === step ? 'bg-primary/10 text-primary' :
                  n < step   ? 'text-muted-foreground/40 line-through' : 'text-muted-foreground/30'
                }`}>{label}</span>
                {i < STEPS.length - 1 && <span className="text-muted-foreground/30 text-xs">›</span>}
              </span>
            ))}
          </div>
        </div>

        {/* ── Step 1: Order Details ── */}
        {step === 1 && (
          <div className="space-y-7">
            <section>
              <SectionHeading>Order Details</SectionHeading>
              <div className="grid grid-cols-2 gap-x-10 gap-y-5 max-w-xl">
                <div>
                  <label className="block text-[11px] text-muted-foreground mb-1">Supplier</label>
                  <select value={form.supplier} onChange={e => setForm(f => ({ ...f, supplier: e.target.value }))}
                    className="w-full h-8 border border-border rounded px-2 text-sm bg-card focus:outline-none focus:ring-1 focus:ring-ring">
                    {SUPPLIERS.map(s => <option key={s} value={s}>{s}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-[11px] text-muted-foreground mb-1">Expected Date</label>
                  <input type="date" value={form.expectedDate} onChange={e => setForm(f => ({ ...f, expectedDate: e.target.value }))}
                    className="w-full h-8 border border-border rounded px-2 text-sm bg-card focus:outline-none focus:ring-1 focus:ring-ring" />
                </div>
                <ReadField label="Created By" value={order.createdBy} />
                <ReadField label="Created On" value={order.createdOn} />
                <div className="col-span-2">
                  <label className="block text-[11px] text-muted-foreground mb-1">Notes</label>
                  <textarea value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))}
                    rows={2} placeholder="Add order notes…"
                    className="w-full border border-border rounded px-2 py-1.5 text-sm bg-card focus:outline-none focus:ring-1 focus:ring-ring resize-none placeholder:text-muted-foreground/40" />
                </div>
              </div>
            </section>

            <section>
              <SectionHeading>Why This Draft Exists</SectionHeading>
              <div className="grid grid-cols-3 gap-x-10 gap-y-5 max-w-2xl">
                <ReadField label="Source Module"       value={order.sourceModule} />
                <ReadField label="Coverage Days"       value={order.coverageDays} />
                <ReadField label="On Hand at Creation" value={order.onHandAtCreation} />
                <ReadField label="Trigger Reason"      value={order.triggerReason} />
                <ReadField label="Urgency"             value={order.urgency.charAt(0).toUpperCase() + order.urgency.slice(1)} />
                <ReadField label="Suggested Qty"       value={order.suggestedQty} />
              </div>
            </section>

            <section>
              <SectionHeading>Lines ({lines.length})</SectionHeading>
              <div className="border border-border rounded overflow-hidden">
                <table className="w-full text-sm">
                  <thead className="bg-muted/40 text-muted-foreground text-xs uppercase tracking-wide">
                    <tr>{['SKU', 'Item Name', 'Supplier', 'Qty', 'Source'].map(h => (
                      <th key={h} className="text-left px-4 py-2 font-medium whitespace-nowrap">{h}</th>
                    ))}</tr>
                  </thead>
                  <tbody>
                    {lines.length === 0 && (
                      <tr><td colSpan={5} className="px-4 py-5 text-center text-muted-foreground text-xs">No lines. Go to Step 2 to add items.</td></tr>
                    )}
                    {lines.map((line, i) => (
                      <tr key={line.line_id} className={`border-t border-border ${i % 2 === 0 ? 'bg-card' : 'bg-background'}`}>
                        <td className="px-4 py-2 font-mono text-xs text-muted-foreground">{line.sku || '—'}</td>
                        <td className="px-4 py-2 font-medium">{line.name || '—'}</td>
                        <td className="px-4 py-2 text-muted-foreground">{line.supplier}</td>
                        <td className="px-4 py-2">{line.qty}</td>
                        <td className="px-4 py-2 text-muted-foreground text-xs">{line.source}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </section>
          </div>
        )}

        {/* ── Step 2: Review & Edit ── */}
        {step === 2 && (
          <section>
            <div className="flex items-center gap-3 mb-4">
              <span className="text-[11px] font-semibold text-muted-foreground uppercase tracking-widest whitespace-nowrap">
                Line Items — Review &amp; Edit
              </span>
              <div className="flex-1 border-t border-border" />
              <div className="flex items-center gap-1.5">
                <span className="text-xs text-muted-foreground">Source</span>
                <select value={sourceFilter} onChange={e => setSourceFilter(e.target.value)}
                  className="h-7 border border-border rounded px-2 text-xs bg-card focus:outline-none focus:ring-1 focus:ring-ring">
                  <option value="All">All</option>
                  <option value="recommendation">Recommendations</option>
                  <option value="inventory">Inventory</option>
                </select>
              </div>
            </div>
            <div className="border border-border rounded overflow-hidden mb-3">
              <table className="w-full text-sm">
                <thead className="bg-muted/40 text-muted-foreground text-xs uppercase tracking-wide">
                  <tr>{['SKU', 'Item Name', 'Supplier', 'Qty', 'Unit Cost', 'Source', ''].map(h => (
                    <th key={h} className="text-left px-4 py-2 font-medium whitespace-nowrap">{h}</th>
                  ))}</tr>
                </thead>
                <tbody>
                  {visibleLines.length === 0 && (
                    <tr><td colSpan={7} className="px-4 py-5 text-center text-muted-foreground text-xs">No lines match this filter.</td></tr>
                  )}
                  {visibleLines.map((line, i) => (
                    <tr key={line.line_id} className={`border-t border-border ${i % 2 === 0 ? 'bg-card' : 'bg-background'}`}>
                      <td className="px-4 py-2">
                        <input value={line.sku || ''} onChange={e => updateField(line.line_id, 'sku', e.target.value)} placeholder="SKU"
                          className="w-24 h-7 border border-border rounded px-2 text-xs bg-card focus:outline-none focus:ring-1 focus:ring-ring font-mono" />
                      </td>
                      <td className="px-4 py-2">
                        <input value={line.name || ''} onChange={e => updateField(line.line_id, 'name', e.target.value)} placeholder="Item name"
                          className="w-44 h-7 border border-border rounded px-2 text-xs bg-card focus:outline-none focus:ring-1 focus:ring-ring" />
                      </td>
                      <td className="px-4 py-2">
                        <input value={line.supplier || ''} onChange={e => updateField(line.line_id, 'supplier', e.target.value)} placeholder="Supplier"
                          className="w-36 h-7 border border-border rounded px-2 text-xs bg-card focus:outline-none focus:ring-1 focus:ring-ring" />
                      </td>
                      <td className="px-4 py-2">
                        <input type="number" min={0} value={line.qty} onChange={e => updateQty(line.line_id, e.target.value)}
                          className="w-16 h-7 border border-border rounded px-2 text-xs text-center bg-card focus:outline-none focus:ring-1 focus:ring-ring" />
                      </td>
                      <td className="px-4 py-2">
                        <input type="number" min={0} step="0.01" value={line.unit_cost ?? ''} placeholder="—"
                          onChange={e => updateField(line.line_id, 'unit_cost', e.target.value === '' ? null : Number(e.target.value))}
                          className="w-20 h-7 border border-border rounded px-2 text-xs bg-card focus:outline-none focus:ring-1 focus:ring-ring" />
                      </td>
                      <td className="px-4 py-2 text-xs text-muted-foreground">{line.source}</td>
                      <td className="px-4 py-2">
                        <button onClick={() => removeLine(line.line_id)} className="text-muted-foreground hover:text-destructive transition-colors">
                          <Trash2 size={13} />
                        </button>
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
          </section>
        )}

        {/* ── Step 3: Submit ── */}
        {step === 3 && (
          <div className="space-y-6">
            <section>
              <SectionHeading>Order Summary</SectionHeading>
              <div className="grid grid-cols-4 gap-3 mb-6">
                {[
                  { label: 'Supplier',      value: form.supplier },
                  { label: 'Expected Date', value: form.expectedDate },
                  { label: 'Lines',         value: lines.length },
                  { label: 'Notes',         value: form.notes || '—' },
                ].map(({ label, value }) => (
                  <div key={label} className="border border-border rounded bg-card px-4 py-3">
                    <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-widest mb-1">{label}</p>
                    <p className="text-sm font-semibold text-foreground truncate">{value}</p>
                  </div>
                ))}
              </div>
            </section>
            <section>
              <SectionHeading>Lines ({lines.length})</SectionHeading>
              <div className="border border-border rounded overflow-hidden">
                <table className="w-full text-sm">
                  <thead className="bg-muted/40 text-muted-foreground text-xs uppercase tracking-wide">
                    <tr>{['SKU', 'Item Name', 'Supplier', 'Qty', 'Unit Cost'].map(h => (
                      <th key={h} className="text-left px-4 py-2 font-medium whitespace-nowrap">{h}</th>
                    ))}</tr>
                  </thead>
                  <tbody>
                    {lines.length === 0 && (
                      <tr><td colSpan={5} className="px-4 py-5 text-center text-muted-foreground text-xs">No lines.</td></tr>
                    )}
                    {lines.map((line, i) => (
                      <tr key={line.line_id} className={`border-t border-border ${i % 2 === 0 ? 'bg-card' : 'bg-background'}`}>
                        <td className="px-4 py-2 font-mono text-xs text-muted-foreground">{line.sku || '—'}</td>
                        <td className="px-4 py-2 font-medium">{line.name || '—'}</td>
                        <td className="px-4 py-2 text-muted-foreground">{line.supplier}</td>
                        <td className="px-4 py-2">{line.qty}</td>
                        <td className="px-4 py-2 text-muted-foreground">{line.unit_cost != null ? `$${line.unit_cost}` : '—'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              {!approved && (
                <p className="text-xs text-amber-600 mt-3">Approve the order below before submitting.</p>
              )}
            </section>
          </div>
        )}
      </div>

      {/* Sticky action bar — same pattern as ReceivingWorkspace */}
      <div className="fixed bottom-0 left-56 right-0 bg-card border-t border-border px-6 py-3 flex items-center gap-3 z-10">
        <button onClick={() => { setRejected(true); setApproved(false); }}
          className={`flex items-center gap-2 h-10 px-5 text-sm rounded border transition-colors ${
            rejected ? 'bg-red-50 text-red-700 border-red-200' : 'bg-card border-border text-foreground hover:bg-muted'
          }`}>
          Reject
        </button>
        <button onClick={() => { setApproved(true); setRejected(false); }}
          className={`flex items-center gap-2 h-10 px-5 text-sm rounded border transition-colors ${
            approved ? 'bg-green-50 text-green-700 border-green-200' : 'bg-card border-border text-foreground hover:bg-muted'
          }`}>
          Approve
        </button>
        <span className={`inline-flex items-center gap-1.5 text-xs px-2.5 py-1 rounded font-medium ${footerStyle}`}>
          <Clock size={11} /> {footerLabel}
        </span>
        <div className="ml-auto flex items-center gap-2">
          <button onClick={onBack}
            className="flex items-center gap-2 h-10 px-5 text-sm rounded border border-border bg-card hover:bg-muted transition-colors text-foreground">
            <ArrowLeft size={14} /> Back to Orders
          </button>
          <button onClick={handleSubmit} disabled={!approved}
            className="flex items-center gap-2 h-10 px-6 text-sm rounded bg-primary text-primary-foreground hover:opacity-90 transition-opacity disabled:opacity-30 disabled:cursor-not-allowed font-medium">
            Submit Order
          </button>
        </div>
      </div>
    </div>
  );
}