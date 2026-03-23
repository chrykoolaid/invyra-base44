import { useState, useRef, useEffect, useMemo } from 'react';
import { X, Clock, Plus, Trash2 } from 'lucide-react';

const lineStatusStyle = {
  original:    'bg-muted text-muted-foreground border border-border',
  added:       'bg-blue-50 text-blue-700 border border-blue-200',
  removed:     'bg-red-50 text-red-500 border border-red-200',
  qty_changed: 'bg-amber-50 text-amber-700 border border-amber-200',
};

const SUPPLIERS = [
  'ChemSupply Co', 'CleanTex Distributors', 'PackPro Solutions',
  'LaundryChem Direct', 'SafetyFirst Supplies', 'HangerCo Wholesale', 'ProWash Ingredients',
];

const flowSteps = ['Draft', 'Approved', 'Submitted'];

const urgencyStyle = {
  low:      'bg-green-50 text-green-700 border border-green-200',
  medium:   'bg-amber-50 text-amber-700 border border-amber-200',
  high:     'bg-red-50 text-red-700 border border-red-200',
  critical: 'bg-red-100 text-red-800 border border-red-300',
};

const footerStatusStyle = {
  idle:     'bg-muted text-muted-foreground',
  approved: 'bg-green-50 text-green-700 border border-green-200',
  rejected: 'bg-red-50 text-red-600 border border-red-200',
  done:     'bg-green-100 text-green-800 border border-green-200',
};

function SectionHeading({ children }) {
  return (
    <div className="flex items-center gap-3 mb-4">
      <span className="text-[11px] font-semibold text-muted-foreground uppercase tracking-widest whitespace-nowrap">
        {children}
      </span>
      <div className="flex-1 border-t border-border" />
    </div>
  );
}

function ReadField({ label, value }) {
  return (
    <div>
      <p className="text-[11px] text-muted-foreground mb-1">{label}</p>
      <p className="text-sm text-foreground">{value}</p>
    </div>
  );
}

// Build initial lines from order data (each line is independent, no SKU merging)
function buildInitialLines(order) {
  if (order.lines && order.lines.length > 0) return order.lines;
  // Fallback: single line from order metadata
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

let _lineCounter = 1;
function nextLineId() { return `line-new-${_lineCounter++}`; }

export default function OrderWorkspaceModal({ order, onClose }) {
  const scrollRef = useRef(null);

  const [form, setForm] = useState({
    supplier:     order.supplier,
    expectedDate: order.expectedDate,
    notes:        order.notes,
  });

  // Snapshot of original lines at open — used to derive statuses
  const [originalLines] = useState(() => buildInitialLines(order));

  // Draft order — lines include soft-deleted (removed: true) for Step 3 diff display
  const [draftOrder, setDraftOrder] = useState(() => ({
    order_id: order.orderNumber,
    status:   'draft',
    lines:    buildInitialLines(order).map(l => ({ ...l, _removed: false })),
  }));

  // Derive line status by comparing current line against original snapshot
  const getLineStatus = (line) => {
    if (line._removed) return 'removed';
    const orig = originalLines.find(o => o.line_id === line.line_id);
    if (!orig) return 'added';
    if (orig.qty !== line.qty) return 'qty_changed';
    return 'original';
  };

  // Lines visible in Step 2 (active only)
  const activeLines = draftOrder.lines.filter(l => !l._removed);

  // Lines for Step 3 full diff (all, including removed)
  const allLinesForDiff = draftOrder.lines;

  // Change summary counts
  const changeSummary = useMemo(() => {
    const added      = draftOrder.lines.filter(l => !l._removed && !originalLines.find(o => o.line_id === l.line_id));
    const removed    = draftOrder.lines.filter(l => l._removed);
    const qtyChanged = draftOrder.lines.filter(l => {
      if (l._removed) return false;
      const orig = originalLines.find(o => o.line_id === l.line_id);
      return orig && orig.qty !== l.qty;
    });
    return { added, removed, qtyChanged };
  }, [draftOrder.lines, originalLines]);

  // Final projected order: merge active lines by SKU, sum qty
  const finalProjection = useMemo(() => {
    const map = {};
    activeLines.forEach(l => {
      const key = l.sku || l.line_id;
      if (!map[key]) map[key] = { sku: l.sku, name: l.name, supplier: l.supplier, qty: 0 };
      map[key].qty += l.qty;
    });
    return Object.values(map);
  }, [activeLines]);

  const updateQty = (line_id, qty) => {
    const n = Math.max(0, Number(qty));
    if (isNaN(n)) return;
    setDraftOrder(prev => ({
      ...prev,
      lines: prev.lines.map(l => l.line_id === line_id ? { ...l, qty: n } : l),
    }));
  };

  // Soft-delete: mark as removed (preserved for diff in Step 3)
  const removeLine = (line_id) => {
    const isAdded = !originalLines.find(o => o.line_id === line_id);
    if (isAdded) {
      // Added lines can be truly deleted
      setDraftOrder(prev => ({ ...prev, lines: prev.lines.filter(l => l.line_id !== line_id) }));
    } else {
      setDraftOrder(prev => ({
        ...prev,
        lines: prev.lines.map(l => l.line_id === line_id ? { ...l, _removed: true } : l),
      }));
    }
  };

  const addLine = () => {
    const newLine = {
      line_id:   nextLineId(),
      sku:       '',
      name:      '',
      qty:       1,
      unit_cost: null,
      supplier:  form.supplier,
      source:    'manual',
      _removed:  false,
    };
    setDraftOrder(prev => ({ ...prev, lines: [...prev.lines, newLine] }));
  };

  const updateLineField = (line_id, field, value) => {
    setDraftOrder(prev => ({
      ...prev,
      lines: prev.lines.map(l => l.line_id === line_id ? { ...l, [field]: value } : l),
    }));
  };

  const [step, setStep] = useState(1);
  const [sourceFilter, setSourceFilter] = useState('All');

  const [approved,   setApproved]   = useState(false);
  const [rejected,   setRejected]   = useState(false);
  const [submitted,  setSubmitted]  = useState(false);
  const [isAmending, setIsAmending] = useState(false);

  // Immutable base snapshot — created once on approval, never mutated
  const [baseOrder, setBaseOrder] = useState(null);

  // Scroll to top whenever step changes
  useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollTop = 0;
  }, [order.id, step]);

  const handleApprove = () => {
    if (!approved) {
      // Freeze a deep-copy snapshot of current draftOrder as the approved base
      setBaseOrder({
        order_id: draftOrder.order_id,
        lines:    draftOrder.lines.map(l => ({ ...l })),
        status:   'approved',
      });
    }
    setApproved(true);
    setRejected(false);
    setIsAmending(false);
  };
  const handleReject  = () => { setRejected(true); setApproved(false); setBaseOrder(null); setIsAmending(false); };
  const handleSubmit  = () => { if (approved && !submitted) setSubmitted(true); };

  const currentStep = submitted ? 'Submitted' : approved ? 'Approved' : 'Draft';

  const footerStatus = submitted ? { label: 'Order submitted', style: footerStatusStyle.done }
    : approved  ? { label: 'Approved — ready to submit', style: footerStatusStyle.approved }
    : rejected  ? { label: 'Marked for rejection', style: footerStatusStyle.rejected }
    : { label: 'Pending decision', style: footerStatusStyle.idle };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/50 backdrop-blur-[2px]" onClick={onClose} />

      {/* Modal */}
      <div
        className="relative z-10 bg-background border border-border rounded-lg shadow-2xl flex flex-col"
        style={{ width: 'min(1060px, calc(100vw - 48px))', height: 'min(800px, calc(100vh - 48px))' }}
      >

        {/* ── Header ── */}
        <div className="flex items-center justify-between px-8 py-4 border-b border-border flex-shrink-0">
          <div className="flex items-baseline gap-2.5">
            <h2 className="text-sm font-semibold text-foreground tracking-tight">Draft Order Workspace</h2>
            <span className="text-sm font-mono text-muted-foreground">{order.orderNumber}</span>
          </div>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground transition-colors p-0.5">
            <X size={17} />
          </button>
        </div>

        {/* ── Workflow + source strip (one coherent zone) ── */}
        <div className="flex items-center px-8 py-2.5 border-b border-border bg-muted/20 flex-shrink-0 gap-4">
          {/* Steps */}
          <div className="flex items-center gap-0">
            {flowSteps.map((step, i) => {
              const isActive = step === currentStep;
              const isDone   = flowSteps.indexOf(currentStep) > i;
              return (
                <div key={step} className="flex items-center">
                  <span className={`text-xs px-2.5 py-0.5 rounded font-medium transition-colors ${
                    isActive ? 'bg-primary/10 text-primary ring-1 ring-primary/20' :
                    isDone   ? 'text-muted-foreground/50 line-through' :
                               'text-muted-foreground/40'
                  }`}>
                    {step}
                  </span>
                  {i < flowSteps.length - 1 && (
                    <span className="mx-1.5 text-muted-foreground/30 text-xs select-none">›</span>
                  )}
                </div>
              );
            })}
          </div>

          {/* Separator */}
          <div className="h-3.5 w-px bg-border mx-1" />

          {/* Source context */}
          <span className="text-xs text-muted-foreground">
            Source: <span className="font-medium text-foreground/70">{order.sourceModule}</span>
          </span>

          {/* Spacer + urgency on the right */}
          <div className="ml-auto flex items-center gap-2">
            <span className="text-xs text-muted-foreground">{order.triggerReason}</span>
            <span className={`text-xs px-2 py-0.5 rounded font-medium ${urgencyStyle[order.urgency]}`}>
              {order.urgency.charAt(0).toUpperCase() + order.urgency.slice(1)}
            </span>
          </div>
        </div>

        {/* ── Step tabs ── */}
        <div className="flex items-center gap-0 px-8 border-b border-border bg-background flex-shrink-0">
          {[
            { n: 1, label: 'Order Details' },
            { n: 2, label: 'Review Order' },
            { n: 3, label: 'Submit' },
          ].map(({ n, label }) => (
            <button
              key={n}
              onClick={() => setStep(n)}
              className={`text-xs px-4 py-2.5 border-b-2 transition-colors font-medium ${
                step === n
                  ? 'border-primary text-primary'
                  : 'border-transparent text-muted-foreground hover:text-foreground'
              }`}
            >
              {n}. {label}
            </button>
          ))}
        </div>

        {/* ── Scrollable body ── */}
        <div ref={scrollRef} className="flex-1 overflow-y-auto px-8 py-6 space-y-7">

          {/* ── Step 1: Order Details ── */}
          {step === 1 && (
            <>
              <section>
                <SectionHeading>Order Details</SectionHeading>
                <div className="grid grid-cols-2 gap-x-10 gap-y-5">
                  <div>
                    <label className="block text-[11px] text-muted-foreground mb-1">Supplier</label>
                    <select
                      value={form.supplier}
                      onChange={e => setForm(f => ({ ...f, supplier: e.target.value }))}
                      disabled={approved && !isAmending}
                      className="w-full h-8 border border-border rounded px-2 text-sm bg-card focus:outline-none focus:ring-1 focus:ring-ring disabled:opacity-60 disabled:cursor-not-allowed"
                    >
                      {SUPPLIERS.map(s => <option key={s} value={s}>{s}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="block text-[11px] text-muted-foreground mb-1">Expected Date</label>
                    <input
                      type="date"
                      value={form.expectedDate}
                      onChange={e => setForm(f => ({ ...f, expectedDate: e.target.value }))}
                      className="w-full h-8 border border-border rounded px-2 text-sm bg-card focus:outline-none focus:ring-1 focus:ring-ring"
                    />
                  </div>
                  <ReadField label="Created By" value={order.createdBy} />
                  <ReadField label="Created On" value={order.createdOn} />
                  <div className="col-span-2">
                    <label className="block text-[11px] text-muted-foreground mb-1">Notes</label>
                    <textarea
                      value={form.notes}
                      onChange={e => setForm(f => ({ ...f, notes: e.target.value }))}
                      rows={2}
                      placeholder="Add order notes…"
                      className="w-full border border-border rounded px-2 py-1.5 text-sm bg-card focus:outline-none focus:ring-1 focus:ring-ring resize-none placeholder:text-muted-foreground/40"
                    />
                  </div>
                </div>
              </section>

              <section>
                <SectionHeading>Why This Draft Exists</SectionHeading>
                <div className="grid grid-cols-3 gap-x-10 gap-y-5">
                  <ReadField label="Source Module"      value={order.sourceModule} />
                  <ReadField label="Coverage Days"       value={order.coverageDays} />
                  <ReadField label="On Hand at Creation" value={order.onHandAtCreation} />
                  <ReadField label="Trigger Reason"      value={order.triggerReason} />
                  <ReadField label="Urgency"             value={order.urgency.charAt(0).toUpperCase() + order.urgency.slice(1)} />
                  <ReadField label="Suggested Qty"       value={order.suggestedQty} />
                </div>
              </section>

              {/* Read-only line summary */}
              <section>
                <SectionHeading>Lines ({draftOrder.lines.length})</SectionHeading>
                <div className="border border-border rounded overflow-hidden">
                  <table className="w-full text-sm">
                    <thead className="bg-muted/40 text-muted-foreground text-xs uppercase tracking-wide">
                      <tr>
                        {['SKU', 'Item Name', 'Supplier', 'Qty', 'Source'].map(h => (
                          <th key={h} className="text-left px-4 py-2 font-medium whitespace-nowrap">{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {activeLines.length === 0 && (
                        <tr><td colSpan={5} className="px-4 py-5 text-center text-muted-foreground text-xs">No lines. Go to Step 2 to add items.</td></tr>
                      )}
                      {activeLines.map((line, i) => (
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
            </>
          )}

          {/* ── Step 2: Review Order — editable line items ── */}
          {step === 2 && (
            <section>
              <div className="flex items-center gap-3 mb-4">
                <span className="text-[11px] font-semibold text-muted-foreground uppercase tracking-widest whitespace-nowrap">
                  Line Items — Review &amp; Edit
                </span>
                <div className="flex-1 border-t border-border" />
                {/* Source filter */}
                <div className="flex items-center gap-1.5">
                  <span className="text-xs text-muted-foreground">Source</span>
                  <select
                    value={sourceFilter}
                    onChange={e => setSourceFilter(e.target.value)}
                    className="h-7 border border-border rounded px-2 text-xs bg-card focus:outline-none focus:ring-1 focus:ring-ring"
                  >
                    <option value="All">All</option>
                    <option value="recommendation">Recommendations</option>
                    <option value="inventory">Inventory</option>
                  </select>
                </div>
              </div>

              <div className="border border-border rounded overflow-hidden mb-3">
                <table className="w-full text-sm">
                  <thead className="bg-muted/40 text-muted-foreground text-xs uppercase tracking-wide">
                    <tr>
                      {['SKU', 'Item Name', 'Supplier', 'Qty', 'Unit Cost', 'Source', ''].map(h => (
                        <th key={h} className="text-left px-4 py-2 font-medium whitespace-nowrap">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {(() => {
                      const visible = sourceFilter === 'All'
                        ? activeLines
                        : activeLines.filter(l => l.source === sourceFilter);
                      if (visible.length === 0) return (
                        <tr><td colSpan={7} className="px-4 py-5 text-center text-muted-foreground text-xs">No lines match this filter.</td></tr>
                      );
                      return visible.map((line, i) => (
                        <tr key={line.line_id} className={`border-t border-border ${i % 2 === 0 ? 'bg-card' : 'bg-background'}`}>
                          <td className="px-4 py-2">
                            <input
                              value={line.sku}
                              onChange={e => updateLineField(line.line_id, 'sku', e.target.value)}
                              placeholder="SKU"
                              className="w-24 h-7 border border-border rounded px-2 text-xs bg-card focus:outline-none focus:ring-1 focus:ring-ring font-mono"
                            />
                          </td>
                          <td className="px-4 py-2">
                            <input
                              value={line.name}
                              onChange={e => updateLineField(line.line_id, 'name', e.target.value)}
                              placeholder="Item name"
                              className="w-44 h-7 border border-border rounded px-2 text-xs bg-card focus:outline-none focus:ring-1 focus:ring-ring"
                            />
                          </td>
                          <td className="px-4 py-2">
                            <input
                              value={line.supplier}
                              onChange={e => updateLineField(line.line_id, 'supplier', e.target.value)}
                              placeholder="Supplier"
                              className="w-36 h-7 border border-border rounded px-2 text-xs bg-card focus:outline-none focus:ring-1 focus:ring-ring"
                            />
                          </td>
                          <td className="px-4 py-2">
                            <input
                              type="number"
                              min={0}
                              value={line.qty}
                              onChange={e => updateQty(line.line_id, e.target.value)}
                              className="w-16 h-7 border border-border rounded px-2 text-xs text-center bg-card focus:outline-none focus:ring-1 focus:ring-ring"
                            />
                          </td>
                          <td className="px-4 py-2">
                            <input
                              type="number"
                              min={0}
                              step="0.01"
                              value={line.unit_cost ?? ''}
                              onChange={e => updateLineField(line.line_id, 'unit_cost', e.target.value === '' ? null : Number(e.target.value))}
                              placeholder="—"
                              className="w-20 h-7 border border-border rounded px-2 text-xs bg-card focus:outline-none focus:ring-1 focus:ring-ring"
                            />
                          </td>
                          <td className="px-4 py-2 text-xs text-muted-foreground">{line.source}</td>
                          <td className="px-4 py-2">
                            <button
                              onClick={() => removeLine(line.line_id)}
                              className="text-muted-foreground hover:text-destructive transition-colors"
                              title="Remove line"
                            >
                              <Trash2 size={13} />
                            </button>
                          </td>
                        </tr>
                      ));
                    })()}
                  </tbody>
                </table>
              </div>
              <button
                onClick={addLine}
                className="flex items-center gap-1.5 h-7 px-3 text-xs border border-border rounded bg-card hover:bg-muted transition-colors text-foreground"
              >
                <Plus size={12} /> Add Line
              </button>
            </section>
          )}

          {/* ── Step 3: Final Review ── */}
          {step === 3 && (
            <>
              {/* Two-column layout: main table + right summary panel */}
              <div className="flex gap-6 items-start">

                {/* Left: full diff table */}
                <div className="flex-1 min-w-0">
                  <SectionHeading>All Lines — Change Review</SectionHeading>
                  <div className="border border-border rounded overflow-hidden">
                    <table className="w-full text-sm">
                      <thead className="bg-muted/40 text-muted-foreground text-xs uppercase tracking-wide">
                        <tr>
                          {['SKU', 'Item Name', 'Qty', 'Status'].map(h => (
                            <th key={h} className="text-left px-4 py-2 font-medium whitespace-nowrap">{h}</th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {allLinesForDiff.map((line, i) => {
                          const status = getLineStatus(line);
                          const orig = originalLines.find(o => o.line_id === line.line_id);
                          return (
                            <tr
                              key={line.line_id}
                              className={`border-t border-border text-sm ${
                                status === 'removed' ? 'opacity-50' : i % 2 === 0 ? 'bg-card' : 'bg-background'
                              }`}
                            >
                              <td className="px-4 py-2 font-mono text-xs text-muted-foreground">{line.sku || '—'}</td>
                              <td className={`px-4 py-2 font-medium ${status === 'removed' ? 'line-through text-muted-foreground' : ''}`}>
                                {line.name || '—'}
                              </td>
                              <td className="px-4 py-2">
                                {status === 'qty_changed' ? (
                                  <span className="flex items-center gap-1.5">
                                    <span className="line-through text-muted-foreground text-xs">{orig.qty}</span>
                                    <span className="text-amber-700 font-semibold">{line.qty}</span>
                                  </span>
                                ) : (
                                  <span>{line.qty}</span>
                                )}
                              </td>
                              <td className="px-4 py-2">
                                <span className={`text-[10px] px-2 py-0.5 rounded-full font-semibold ${lineStatusStyle[status]}`}>
                                  {status.replace('_', ' ')}
                                </span>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* Right: change summary panel */}
                <div className="w-64 flex-shrink-0 space-y-4">
                  <div>
                    <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-widest mb-3">Change Summary</p>
                    <div className="space-y-2">
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-muted-foreground">Added</span>
                        <span className={`px-2 py-0.5 rounded-full font-semibold ${changeSummary.added.length > 0 ? lineStatusStyle.added : 'text-muted-foreground'}`}>
                          {changeSummary.added.length}
                        </span>
                      </div>
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-muted-foreground">Removed</span>
                        <span className={`px-2 py-0.5 rounded-full font-semibold ${changeSummary.removed.length > 0 ? lineStatusStyle.removed : 'text-muted-foreground'}`}>
                          {changeSummary.removed.length}
                        </span>
                      </div>
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-muted-foreground">Qty changed</span>
                        <span className={`px-2 py-0.5 rounded-full font-semibold ${changeSummary.qtyChanged.length > 0 ? lineStatusStyle.qty_changed : 'text-muted-foreground'}`}>
                          {changeSummary.qtyChanged.length}
                        </span>
                      </div>
                    </div>
                  </div>

                  {changeSummary.added.length > 0 && (
                    <div>
                      <p className="text-[10px] font-semibold text-blue-600 uppercase tracking-widest mb-1.5">Added Items</p>
                      <ul className="space-y-1">
                        {changeSummary.added.map(l => (
                          <li key={l.line_id} className="text-xs text-foreground flex items-center gap-1.5">
                            <span className="w-1.5 h-1.5 rounded-full bg-blue-400 flex-shrink-0" />
                            <span className="truncate">{l.name || l.sku || '—'}</span>
                            <span className="ml-auto text-muted-foreground font-mono">{l.qty}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {changeSummary.removed.length > 0 && (
                    <div>
                      <p className="text-[10px] font-semibold text-red-500 uppercase tracking-widest mb-1.5">Removed Items</p>
                      <ul className="space-y-1">
                        {changeSummary.removed.map(l => (
                          <li key={l.line_id} className="text-xs text-muted-foreground flex items-center gap-1.5 line-through">
                            <span className="w-1.5 h-1.5 rounded-full bg-red-400 flex-shrink-0" />
                            <span className="truncate">{l.name || l.sku || '—'}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {changeSummary.qtyChanged.length > 0 && (
                    <div>
                      <p className="text-[10px] font-semibold text-amber-600 uppercase tracking-widest mb-1.5">Qty Updates</p>
                      <ul className="space-y-1">
                        {changeSummary.qtyChanged.map(l => {
                          const orig = originalLines.find(o => o.line_id === l.line_id);
                          return (
                            <li key={l.line_id} className="text-xs text-foreground flex items-center gap-1.5">
                              <span className="w-1.5 h-1.5 rounded-full bg-amber-400 flex-shrink-0" />
                              <span className="truncate flex-1">{l.name || l.sku || '—'}</span>
                              <span className="text-muted-foreground line-through font-mono text-[10px]">{orig?.qty}</span>
                              <span className="text-amber-700 font-mono font-semibold text-[10px]">→{l.qty}</span>
                            </li>
                          );
                        })}
                      </ul>
                    </div>
                  )}
                </div>
              </div>

              {/* Final Projected Order */}
              <section>
                <SectionHeading>Final Projected Order</SectionHeading>
                <div className="border border-border rounded overflow-hidden">
                  <table className="w-full text-sm">
                    <thead className="bg-muted/40 text-muted-foreground text-xs uppercase tracking-wide">
                      <tr>
                        {['SKU', 'Item Name', 'Supplier', 'Final Qty'].map(h => (
                          <th key={h} className="text-left px-4 py-2 font-medium whitespace-nowrap">{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {finalProjection.length === 0 && (
                        <tr><td colSpan={4} className="px-4 py-5 text-center text-muted-foreground text-xs">No active lines.</td></tr>
                      )}
                      {finalProjection.map((row, i) => (
                        <tr key={row.sku || i} className={`border-t border-border ${i % 2 === 0 ? 'bg-card' : 'bg-background'}`}>
                          <td className="px-4 py-2 font-mono text-xs text-muted-foreground">{row.sku || '—'}</td>
                          <td className="px-4 py-2 font-medium">{row.name || '—'}</td>
                          <td className="px-4 py-2 text-muted-foreground">{row.supplier}</td>
                          <td className="px-4 py-2 font-semibold">{row.qty}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </section>

              {submitted && (
                <div className="p-3 bg-green-50 border border-green-200 rounded text-sm text-green-700 font-medium">
                  Order submitted successfully.
                </div>
              )}
            </>
          )}
        </div>

        {/* ── Sticky footer command bar ── */}
        <div className="flex items-center px-8 py-3 border-t border-border bg-muted/10 flex-shrink-0 gap-2.5">
          <button
            onClick={handleReject}
            disabled={submitted}
            className={`h-8 px-4 text-sm rounded border transition-colors disabled:opacity-40 disabled:cursor-not-allowed ${
              rejected ? 'bg-red-50 text-red-700 border-red-200' : 'bg-card border-border text-foreground hover:bg-muted'
            }`}
          >
            Reject
          </button>
          <button
            onClick={handleApprove}
            disabled={submitted}
            className={`h-8 px-4 text-sm rounded border transition-colors disabled:opacity-40 disabled:cursor-not-allowed ${
              approved ? 'bg-green-50 text-green-700 border-green-200' : 'bg-card border-border text-foreground hover:bg-muted'
            }`}
          >
            Approve
          </button>

          {/* Status hint — compact badge style */}
          <span className={`ml-3 inline-flex items-center gap-1.5 text-xs px-2.5 py-1 rounded font-medium ${footerStatus.style}`}>
            <Clock size={11} />
            {footerStatus.label}
          </span>

          <button
            onClick={handleSubmit}
            disabled={!approved || submitted}
            className="h-8 px-5 text-sm rounded bg-primary text-primary-foreground hover:opacity-90 transition-opacity disabled:opacity-30 disabled:cursor-not-allowed ml-auto"
          >
            {submitted ? 'Submitted ✓' : 'Submit Order'}
          </button>
        </div>

      </div>
    </div>
  );
}