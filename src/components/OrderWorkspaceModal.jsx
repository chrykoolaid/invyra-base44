import { useState, useRef, useEffect, useMemo } from 'react';
import { X, Clock, Plus, Trash2, GitBranch, Check } from 'lucide-react';

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
  idle:      'bg-muted text-muted-foreground',
  approved:  'bg-green-50 text-green-700 border border-green-200',
  rejected:  'bg-red-50 text-red-600 border border-red-200',
  done:      'bg-green-100 text-green-800 border border-green-200',
  amending:  'bg-amber-50 text-amber-700 border border-amber-200',
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

let _lineCounter = 100;
function nextLineId() { return `line-amend-${_lineCounter++}`; }

// ── Amendment helpers ──────────────────────────────────────────────────────────

// Apply amendments to base_lines to produce projected_lines
function applyAmendments(baseLines, amendments) {
  // Start from base lines (no merging by SKU — each line is independent)
  let lines = baseLines.map(l => ({ ...l }));

  for (const amendment of amendments) {
    if (amendment.type === 'REMOVE') {
      lines = lines.filter(l => l.line_id !== amendment.line_id);
    } else if (amendment.type === 'CHANGE_QTY') {
      lines = lines.map(l =>
        l.line_id === amendment.line_id ? { ...l, qty: amendment.qty } : l
      );
    } else if (amendment.type === 'ADD') {
      lines = [...lines, { ...amendment.line }];
    }
  }

  return lines;
}

// Derive per-line status by comparing projected line against base
function deriveAmendmentStatus(line, baseLines, amendments) {
  const isAdded = amendments.some(a => a.type === 'ADD' && a.line.line_id === line.line_id);
  if (isAdded) return 'added';
  const baseLine = baseLines.find(b => b.line_id === line.line_id);
  if (!baseLine) return 'added';
  if (baseLine.qty !== line.qty) return 'qty_changed';
  return 'original';
}

// ──────────────────────────────────────────────────────────────────────────────

export default function OrderWorkspaceModal({ order, onClose }) {
  const scrollRef = useRef(null);

  const [form, setForm] = useState({
    supplier:     order.supplier,
    expectedDate: order.expectedDate,
    notes:        order.notes,
  });

  // The working draft lines (pre-amendment, or post-commit)
  const [draftLines, setDraftLines] = useState(() =>
    buildInitialLines(order).map(l => ({ ...l }))
  );

  // Version counter — incremented on each amendment commit
  const [version, setVersion] = useState(1);

  // Workflow state
  const [step, setStep]           = useState(1);
  const [sourceFilter, setSource] = useState('All');
  const [approved,  setApproved]  = useState(false);
  const [rejected,  setRejected]  = useState(false);
  const [submitted, setSubmitted] = useState(false);

  // Amendment session — null means not in amendment mode
  // Shape: { base_lines: [...], amendments: [...] }
  const [amendSession, setAmendSession] = useState(null);
  const isAmending = amendSession !== null;

  // Scroll to top on step change
  useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollTop = 0;
  }, [order.id, step]);

  // ── Projected lines (amendment mode only) ────────────────────────────────
  const projectedLines = useMemo(() => {
    if (!amendSession) return [];
    return applyAmendments(amendSession.base_lines, amendSession.amendments);
  }, [amendSession]);

  // ── Change summary for Step 3 ─────────────────────────────────────────────
  const changeSummary = useMemo(() => {
    if (!isAmending) {
      // Pre-approval: compare draftLines against original
      return { added: [], removed: [], qtyChanged: [] };
    }
    const { base_lines, amendments } = amendSession;
    const removed    = amendments.filter(a => a.type === 'REMOVE').map(a =>
      base_lines.find(b => b.line_id === a.line_id)
    ).filter(Boolean);
    const added      = amendments.filter(a => a.type === 'ADD').map(a => a.line);
    const qtyChanged = amendments.filter(a => a.type === 'CHANGE_QTY').map(a => ({
      ...base_lines.find(b => b.line_id === a.line_id),
      newQty: a.qty,
    })).filter(b => b.line_id);
    return { added, removed, qtyChanged };
  }, [amendSession, isAmending]);

  // ── Final projection for Step 3 table (no SKU merging) ───────────────────
  const finalProjection = useMemo(() => {
    return isAmending ? projectedLines : draftLines;
  }, [isAmending, projectedLines, draftLines]);

  // All lines for diff display in Step 3 (amendment mode)
  const allLinesForDiff = useMemo(() => {
    if (!isAmending) return draftLines;
    const { base_lines, amendments } = amendSession;
    const removedIds = new Set(amendments.filter(a => a.type === 'REMOVE').map(a => a.line_id));
    const removedLines = base_lines.filter(l => removedIds.has(l.line_id)).map(l => ({ ...l, _removed: true }));
    const activeLines = projectedLines;
    // Merge: active lines first (in projected order), then removed lines at end
    return [...activeLines, ...removedLines];
  }, [isAmending, amendSession, projectedLines, draftLines]);

  // ── Amendment actions ─────────────────────────────────────────────────────

  const startAmending = () => {
    setAmendSession({
      base_lines: draftLines.map(l => ({ ...l })),
      amendments: [],
    });
  };

  const cancelAmending = () => {
    setAmendSession(null);
  };

  const commitAmendment = () => {
    // Apply projected lines as new draftLines
    setDraftLines(projectedLines.map(l => ({ ...l })));
    setVersion(v => v + 1);
    setAmendSession(null);
  };

  // Amendment mutations — all operate on amendSession.amendments

  const amendRemoveLine = (line_id) => {
    setAmendSession(prev => {
      const alreadyRemoved = prev.amendments.some(a => a.type === 'REMOVE' && a.line_id === line_id);
      if (alreadyRemoved) return prev;
      // If it was an ADD, just remove the ADD amendment instead
      const isAdded = prev.amendments.some(a => a.type === 'ADD' && a.line.line_id === line_id);
      if (isAdded) {
        return { ...prev, amendments: prev.amendments.filter(a => !(a.type === 'ADD' && a.line.line_id === line_id)) };
      }
      return { ...prev, amendments: [...prev.amendments, { type: 'REMOVE', line_id }] };
    });
  };

  const amendChangeQty = (line_id, qty) => {
    const n = Math.max(0, Number(qty));
    if (isNaN(n)) return;
    setAmendSession(prev => {
      // Check if this line was added in this session
      const addIdx = prev.amendments.findIndex(a => a.type === 'ADD' && a.line.line_id === line_id);
      if (addIdx !== -1) {
        const updated = prev.amendments.map((a, i) =>
          i === addIdx ? { ...a, line: { ...a.line, qty: n } } : a
        );
        return { ...prev, amendments: updated };
      }
      // Otherwise update or create a CHANGE_QTY amendment
      const existing = prev.amendments.findIndex(a => a.type === 'CHANGE_QTY' && a.line_id === line_id);
      if (existing !== -1) {
        const updated = prev.amendments.map((a, i) =>
          i === existing ? { ...a, qty: n } : a
        );
        // If qty matches base, remove the amendment
        const baseLine = prev.base_lines.find(b => b.line_id === line_id);
        if (baseLine && baseLine.qty === n) {
          return { ...prev, amendments: prev.amendments.filter((_, i) => i !== existing) };
        }
        return { ...prev, amendments: updated };
      }
      // New CHANGE_QTY
      const baseLine = prev.base_lines.find(b => b.line_id === line_id);
      if (baseLine && baseLine.qty === n) return prev; // no change
      return { ...prev, amendments: [...prev.amendments, { type: 'CHANGE_QTY', line_id, qty: n }] };
    });
  };

  const amendUpdateField = (line_id, field, value) => {
    setAmendSession(prev => {
      const addIdx = prev.amendments.findIndex(a => a.type === 'ADD' && a.line.line_id === line_id);
      if (addIdx !== -1) {
        const updated = prev.amendments.map((a, i) =>
          i === addIdx ? { ...a, line: { ...a.line, [field]: value } } : a
        );
        return { ...prev, amendments: updated };
      }
      return prev;
    });
  };

  const amendAddLine = () => {
    const newLine = {
      line_id:   nextLineId(),
      sku:       '',
      name:      '',
      qty:       1,
      unit_cost: null,
      supplier:  form.supplier,
      source:    'amendment',
    };
    setAmendSession(prev => ({
      ...prev,
      amendments: [...prev.amendments, { type: 'ADD', line: newLine }],
    }));
  };

  // ── Pre-approval line mutations (on draftLines directly) ──────────────────

  const updateQty = (line_id, qty) => {
    const n = Math.max(0, Number(qty));
    if (isNaN(n)) return;
    setDraftLines(prev => prev.map(l => l.line_id === line_id ? { ...l, qty: n } : l));
  };

  const removeLine = (line_id) => {
    setDraftLines(prev => prev.filter(l => l.line_id !== line_id));
  };

  const addLine = () => {
    setDraftLines(prev => [...prev, {
      line_id:   nextLineId(),
      sku:       '',
      name:      '',
      qty:       1,
      unit_cost: null,
      supplier:  form.supplier,
      source:    'manual',
    }]);
  };

  const updateLineField = (line_id, field, value) => {
    setDraftLines(prev => prev.map(l => l.line_id === line_id ? { ...l, [field]: value } : l));
  };

  // ── Workflow ──────────────────────────────────────────────────────────────

  const handleApprove = () => {
    setApproved(true);
    setRejected(false);
    if (isAmending) cancelAmending();
  };

  const handleReject = () => {
    setRejected(true);
    setApproved(false);
    if (isAmending) cancelAmending();
  };

  const handleSubmit = () => {
    if (approved && !submitted && !isAmending) setSubmitted(true);
  };

  const currentStep = submitted ? 'Submitted' : approved ? 'Approved' : 'Draft';

  const footerStatus = isAmending
    ? { label: `Amending — v${version}`, style: footerStatusStyle.amending }
    : submitted
      ? { label: 'Order submitted', style: footerStatusStyle.done }
      : approved
        ? { label: `Approved — v${version}`, style: footerStatusStyle.approved }
        : rejected
          ? { label: 'Marked for rejection', style: footerStatusStyle.rejected }
          : { label: 'Pending decision', style: footerStatusStyle.idle };

  // Lines shown in Step 2 edit table
  const step2Lines = isAmending ? projectedLines : draftLines;

  // ── Render ────────────────────────────────────────────────────────────────

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-[2px]" onClick={onClose} />

      <div
        className="relative z-10 bg-background border border-border rounded-lg shadow-2xl flex flex-col"
        style={{ width: 'min(1060px, calc(100vw - 48px))', height: 'min(800px, calc(100vh - 48px))' }}
      >

        {/* ── Header ── */}
        <div className="flex items-center justify-between px-8 py-4 border-b border-border flex-shrink-0">
          <div className="flex items-baseline gap-2.5">
            <h2 className="text-sm font-semibold text-foreground tracking-tight">
              {isAmending ? 'Amendment Mode' : 'Draft Order Workspace'}
            </h2>
            <span className="text-sm font-mono text-muted-foreground">{order.orderNumber}</span>
            {version > 1 && (
              <span className="text-xs px-1.5 py-0.5 rounded bg-muted text-muted-foreground font-mono">v{version}</span>
            )}
          </div>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground transition-colors p-0.5">
            <X size={17} />
          </button>
        </div>

        {/* ── Workflow strip ── */}
        <div className="flex items-center px-8 py-2.5 border-b border-border bg-muted/20 flex-shrink-0 gap-4">
          <div className="flex items-center gap-0">
            {flowSteps.map((s, i) => {
              const isActive = s === currentStep;
              const isDone   = flowSteps.indexOf(currentStep) > i;
              return (
                <div key={s} className="flex items-center">
                  <span className={`text-xs px-2.5 py-0.5 rounded font-medium transition-colors ${
                    isActive ? 'bg-primary/10 text-primary ring-1 ring-primary/20' :
                    isDone   ? 'text-muted-foreground/50 line-through' :
                               'text-muted-foreground/40'
                  }`}>{s}</span>
                  {i < flowSteps.length - 1 && (
                    <span className="mx-1.5 text-muted-foreground/30 text-xs select-none">›</span>
                  )}
                </div>
              );
            })}
          </div>
          <div className="h-3.5 w-px bg-border mx-1" />
          <span className="text-xs text-muted-foreground">
            Source: <span className="font-medium text-foreground/70">{order.sourceModule}</span>
          </span>
          {isAmending && (
            <>
              <div className="h-3.5 w-px bg-border mx-1" />
              <span className="flex items-center gap-1.5 text-xs text-amber-600 font-medium">
                <GitBranch size={11} /> Amendment in progress — {amendSession.amendments.length} change{amendSession.amendments.length !== 1 ? 's' : ''}
              </span>
            </>
          )}
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
            { n: 2, label: isAmending ? 'Amend Lines' : 'Review Order' },
            { n: 3, label: isAmending ? 'Review Changes' : 'Submit' },
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
                      disabled={(approved && !isAmending) || submitted}
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
                      disabled={(approved && !isAmending) || submitted}
                      className="w-full h-8 border border-border rounded px-2 text-sm bg-card focus:outline-none focus:ring-1 focus:ring-ring disabled:opacity-60 disabled:cursor-not-allowed"
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
                      disabled={(approved && !isAmending) || submitted}
                      className="w-full border border-border rounded px-2 py-1.5 text-sm bg-card focus:outline-none focus:ring-1 focus:ring-ring resize-none placeholder:text-muted-foreground/40 disabled:opacity-60 disabled:cursor-not-allowed"
                    />
                  </div>
                </div>
              </section>

              <section>
                <SectionHeading>Why This Draft Exists</SectionHeading>
                <div className="grid grid-cols-3 gap-x-10 gap-y-5">
                  <ReadField label="Source Module"      value={order.sourceModule} />
                  <ReadField label="Coverage Days"      value={order.coverageDays} />
                  <ReadField label="On Hand at Creation" value={order.onHandAtCreation} />
                  <ReadField label="Trigger Reason"     value={order.triggerReason} />
                  <ReadField label="Urgency"            value={order.urgency.charAt(0).toUpperCase() + order.urgency.slice(1)} />
                  <ReadField label="Suggested Qty"      value={order.suggestedQty} />
                </div>
              </section>

              <section>
                <SectionHeading>Lines ({step2Lines.length})</SectionHeading>
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
                      {step2Lines.length === 0 && (
                        <tr><td colSpan={5} className="px-4 py-5 text-center text-muted-foreground text-xs">No active lines.</td></tr>
                      )}
                      {step2Lines.map((line, i) => (
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

          {/* ── Step 2: Lines (editable or amendment) ── */}
          {step === 2 && (
            <section>
              {/* Banner */}
              {approved && !isAmending && (
                <div className="flex items-center justify-between mb-4 px-4 py-2.5 bg-green-50 border border-green-200 rounded">
                  <span className="text-xs text-green-700 font-medium">Order approved — lines are read-only.</span>
                  <button
                    onClick={startAmending}
                    className="flex items-center gap-1.5 h-7 px-3 text-xs border border-green-300 rounded bg-white hover:bg-green-50 text-green-700 font-medium transition-colors"
                  >
                    <GitBranch size={11} /> Amend Order
                  </button>
                </div>
              )}
              {isAmending && (
                <div className="flex items-center justify-between mb-4 px-4 py-2.5 bg-amber-50 border border-amber-200 rounded">
                  <span className="text-xs text-amber-700 font-medium">
                    Amendment mode — changes tracked against approved base. {amendSession.amendments.length} pending change{amendSession.amendments.length !== 1 ? 's' : ''}.
                  </span>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={cancelAmending}
                      className="h-7 px-3 text-xs border border-amber-300 rounded bg-white hover:bg-amber-50 text-amber-700 transition-colors"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={() => setStep(3)}
                      className="flex items-center gap-1.5 h-7 px-3 text-xs border border-amber-400 rounded bg-amber-100 hover:bg-amber-200 text-amber-800 font-medium transition-colors"
                    >
                      Review Changes →
                    </button>
                  </div>
                </div>
              )}

              <div className="flex items-center gap-3 mb-4">
                <span className="text-[11px] font-semibold text-muted-foreground uppercase tracking-widest whitespace-nowrap">
                  {isAmending ? 'Projected Lines' : 'Line Items — Review & Edit'}
                </span>
                <div className="flex-1 border-t border-border" />
                {!isAmending && (
                  <div className="flex items-center gap-1.5">
                    <span className="text-xs text-muted-foreground">Source</span>
                    <select
                      value={sourceFilter}
                      onChange={e => setSource(e.target.value)}
                      className="h-7 border border-border rounded px-2 text-xs bg-card focus:outline-none focus:ring-1 focus:ring-ring"
                    >
                      <option value="All">All</option>
                      <option value="recommendation">Recommendations</option>
                      <option value="inventory">Inventory</option>
                      <option value="amendment">Amendments</option>
                    </select>
                  </div>
                )}
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
                      const locked = approved && !isAmending;

                      // Which lines to show
                      let visible = isAmending
                        ? projectedLines
                        : (sourceFilter === 'All' ? draftLines : draftLines.filter(l => l.source === sourceFilter));

                      if (visible.length === 0) return (
                        <tr><td colSpan={7} className="px-4 py-5 text-center text-muted-foreground text-xs">No lines match this filter.</td></tr>
                      );

                      return visible.map((line, i) => {
                        const amendStatus = isAmending
                          ? deriveAmendmentStatus(line, amendSession.base_lines, amendSession.amendments)
                          : null;
                        const rowBg = amendStatus === 'added'
                          ? 'bg-blue-50/40'
                          : amendStatus === 'qty_changed'
                            ? 'bg-amber-50/40'
                            : i % 2 === 0 ? 'bg-card' : 'bg-background';

                        return (
                          <tr key={line.line_id} className={`border-t border-border ${rowBg}`}>
                            <td className="px-4 py-2">
                              {locked
                                ? <span className="font-mono text-xs text-muted-foreground">{line.sku || '—'}</span>
                                : isAmending && amendStatus !== 'added'
                                  ? <span className="font-mono text-xs text-muted-foreground">{line.sku || '—'}</span>
                                  : <input value={line.sku || ''} onChange={e => isAmending ? amendUpdateField(line.line_id, 'sku', e.target.value) : updateLineField(line.line_id, 'sku', e.target.value)} placeholder="SKU" className="w-24 h-7 border border-border rounded px-2 text-xs bg-card focus:outline-none focus:ring-1 focus:ring-ring font-mono" />
                              }
                            </td>
                            <td className="px-4 py-2">
                              {locked
                                ? <span className="text-sm font-medium">{line.name || '—'}</span>
                                : isAmending && amendStatus !== 'added'
                                  ? <span className="text-sm font-medium">{line.name || '—'}</span>
                                  : <input value={line.name || ''} onChange={e => isAmending ? amendUpdateField(line.line_id, 'name', e.target.value) : updateLineField(line.line_id, 'name', e.target.value)} placeholder="Item name" className="w-44 h-7 border border-border rounded px-2 text-xs bg-card focus:outline-none focus:ring-1 focus:ring-ring" />
                              }
                            </td>
                            <td className="px-4 py-2">
                              {locked || (isAmending && amendStatus !== 'added')
                                ? <span className="text-xs text-muted-foreground">{line.supplier}</span>
                                : <input value={line.supplier || ''} onChange={e => isAmending ? amendUpdateField(line.line_id, 'supplier', e.target.value) : updateLineField(line.line_id, 'supplier', e.target.value)} placeholder="Supplier" className="w-36 h-7 border border-border rounded px-2 text-xs bg-card focus:outline-none focus:ring-1 focus:ring-ring" />
                              }
                            </td>
                            <td className="px-4 py-2">
                              {locked
                                ? <span className="text-sm">{line.qty}</span>
                                : <input
                                    type="number" min={0} value={line.qty}
                                    onChange={e => isAmending ? amendChangeQty(line.line_id, e.target.value) : updateQty(line.line_id, e.target.value)}
                                    className="w-16 h-7 border border-border rounded px-2 text-xs text-center bg-card focus:outline-none focus:ring-1 focus:ring-ring"
                                  />
                              }
                            </td>
                            <td className="px-4 py-2">
                              {locked
                                ? <span className="text-xs text-muted-foreground">{line.unit_cost ?? '—'}</span>
                                : <input type="number" min={0} step="0.01" value={line.unit_cost ?? ''} onChange={e => { const v = e.target.value === '' ? null : Number(e.target.value); isAmending ? amendUpdateField(line.line_id, 'unit_cost', v) : updateLineField(line.line_id, 'unit_cost', v); }} placeholder="—" className="w-20 h-7 border border-border rounded px-2 text-xs bg-card focus:outline-none focus:ring-1 focus:ring-ring" />
                              }
                            </td>
                            <td className="px-4 py-2">
                              <span className="text-xs text-muted-foreground">{line.source}</span>
                              {isAmending && amendStatus && amendStatus !== 'original' && (
                                <span className={`ml-2 text-[10px] px-1.5 py-0.5 rounded-full font-semibold ${lineStatusStyle[amendStatus]}`}>
                                  {amendStatus.replace('_', ' ')}
                                </span>
                              )}
                            </td>
                            <td className="px-4 py-2">
                              {!locked && (
                                <button
                                  onClick={() => isAmending ? amendRemoveLine(line.line_id) : removeLine(line.line_id)}
                                  className="text-muted-foreground hover:text-destructive transition-colors"
                                  title="Remove line"
                                >
                                  <Trash2 size={13} />
                                </button>
                              )}
                            </td>
                          </tr>
                        );
                      });
                    })()}
                  </tbody>
                </table>
              </div>

              {/* Add line button */}
              {(!approved || isAmending) && (
                <button
                  onClick={isAmending ? amendAddLine : addLine}
                  className="flex items-center gap-1.5 h-7 px-3 text-xs border border-border rounded bg-card hover:bg-muted transition-colors text-foreground"
                >
                  <Plus size={12} /> Add Line
                </button>
              )}
            </section>
          )}

          {/* ── Step 3: Review / Submit ── */}
          {step === 3 && (
            <>
              {/* Amendment diff view */}
              {isAmending ? (
                <>
                  <div className="flex gap-6 items-start">
                    {/* Left: diff table */}
                    <div className="flex-1 min-w-0">
                      <SectionHeading>All Lines — Amendment Diff</SectionHeading>
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
                              const isRemoved = line._removed;
                              const status = isRemoved ? 'removed' : deriveAmendmentStatus(line, amendSession.base_lines, amendSession.amendments);
                              const baseLine = amendSession.base_lines.find(b => b.line_id === line.line_id);
                              return (
                                <tr
                                  key={line.line_id}
                                  className={`border-t border-border text-sm ${
                                    isRemoved ? 'opacity-50' : i % 2 === 0 ? 'bg-card' : 'bg-background'
                                  }`}
                                >
                                  <td className="px-4 py-2 font-mono text-xs text-muted-foreground">{line.sku || '—'}</td>
                                  <td className={`px-4 py-2 font-medium ${isRemoved ? 'line-through text-muted-foreground' : ''}`}>
                                    {line.name || '—'}
                                  </td>
                                  <td className="px-4 py-2">
                                    {status === 'qty_changed' ? (
                                      <span className="flex items-center gap-1.5">
                                        <span className="line-through text-muted-foreground text-xs">{baseLine?.qty}</span>
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

                    {/* Right: change summary */}
                    <div className="w-64 flex-shrink-0 space-y-4">
                      <div>
                        <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-widest mb-3">Amendment Summary</p>
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
                          <p className="text-[10px] font-semibold text-blue-600 uppercase tracking-widest mb-1.5">Added</p>
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
                          <p className="text-[10px] font-semibold text-red-500 uppercase tracking-widest mb-1.5">Removed</p>
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
                            {changeSummary.qtyChanged.map(l => (
                              <li key={l.line_id} className="text-xs text-foreground flex items-center gap-1.5">
                                <span className="w-1.5 h-1.5 rounded-full bg-amber-400 flex-shrink-0" />
                                <span className="truncate flex-1">{l.name || l.sku || '—'}</span>
                                <span className="text-muted-foreground line-through font-mono text-[10px]">{l.qty}</span>
                                <span className="text-amber-700 font-mono font-semibold text-[10px]">→{l.newQty}</span>
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Final projected order */}
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
                            <tr key={row.line_id || i} className={`border-t border-border ${i % 2 === 0 ? 'bg-card' : 'bg-background'}`}>
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
                </>
              ) : (
                /* Normal (non-amendment) Step 3 */
                <>
                  <div className="flex gap-6 items-start">
                    <div className="flex-1 min-w-0">
                      <SectionHeading>All Lines</SectionHeading>
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
                            {draftLines.map((line, i) => (
                              <tr key={line.line_id} className={`border-t border-border ${i % 2 === 0 ? 'bg-card' : 'bg-background'}`}>
                                <td className="px-4 py-2 font-mono text-xs text-muted-foreground">{line.sku || '—'}</td>
                                <td className="px-4 py-2 font-medium">{line.name || '—'}</td>
                                <td className="px-4 py-2 text-muted-foreground">{line.supplier}</td>
                                <td className="px-4 py-2">{line.qty}</td>
                                <td className="px-4 py-2 text-xs text-muted-foreground">{line.source}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  </div>

                  {submitted && (
                    <div className="p-3 bg-green-50 border border-green-200 rounded text-sm text-green-700 font-medium">
                      Order submitted successfully.
                    </div>
                  )}
                </>
              )}
            </>
          )}
        </div>

        {/* ── Footer ── */}
        <div className="flex items-center px-8 py-3 border-t border-border bg-muted/10 flex-shrink-0 gap-2.5">
          {isAmending ? (
            <>
              <button
                onClick={cancelAmending}
                className="h-8 px-4 text-sm rounded border border-border bg-card hover:bg-muted transition-colors text-foreground"
              >
                Cancel Amendment
              </button>
              <span className={`ml-3 inline-flex items-center gap-1.5 text-xs px-2.5 py-1 rounded font-medium ${footerStatus.style}`}>
                <GitBranch size={11} />
                {footerStatus.label}
              </span>
              <button
                onClick={commitAmendment}
                disabled={amendSession.amendments.length === 0}
                className="ml-auto flex items-center gap-1.5 h-8 px-5 text-sm rounded bg-primary text-primary-foreground hover:opacity-90 transition-opacity disabled:opacity-30 disabled:cursor-not-allowed"
              >
                <Check size={13} /> Commit Amendment
              </button>
            </>
          ) : (
            <>
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
            </>
          )}
        </div>

      </div>
    </div>
  );
}