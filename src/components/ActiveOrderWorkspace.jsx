import { useState, useMemo } from 'react';
import { ArrowLeft, GitBranch, Plus, Trash2, Check, X, Clock, Link2, CheckCircle2, Truck } from 'lucide-react';
import { base44 } from '@/api/base44Client';

const lineStatusStyle = {
  original:    'bg-muted text-muted-foreground border border-border',
  added:       'bg-blue-50 text-blue-700 border border-blue-200',
  removed:     'bg-red-50 text-red-500 border border-red-200',
  qty_changed: 'bg-amber-50 text-amber-700 border border-amber-200',
};

const statusStyle = {
  'Submitted':          'bg-blue-50 text-blue-700 border border-blue-200',
  'Confirmed':          'bg-violet-50 text-violet-700 border border-violet-200',
  'Awaiting Delivery':  'bg-amber-50 text-amber-700 border border-amber-200',
  'Partially Received': 'bg-orange-50 text-orange-700 border border-orange-200',
  'Received':           'bg-green-50 text-green-700 border border-green-200',
  'Cancelled':          'bg-red-50 text-red-400 border border-red-200',
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

// ── Amendment helpers ─────────────────────────────────────────────────────────

function applyAmendments(baseLines, amendments) {
  let lines = baseLines.map(l => ({ ...l }));
  for (const a of amendments) {
    if (a.type === 'REMOVE') {
      lines = lines.filter(l => l.line_id !== a.line_id);
    } else if (a.type === 'CHANGE_QTY') {
      lines = lines.map(l => l.line_id === a.line_id ? { ...l, qty: a.qty } : l);
    } else if (a.type === 'ADD') {
      lines = [...lines, { ...a.line }];
    }
  }
  return lines;
}

function getLineStatus(line, baseLines, amendments) {
  const isAdded = amendments.some(a => a.type === 'ADD' && a.line.line_id === line.line_id);
  if (isAdded) return 'added';
  const base = baseLines.find(b => b.line_id === line.line_id);
  if (!base) return 'added';
  if (base.qty !== line.qty) return 'qty_changed';
  return 'original';
}

let _ac = 200;
function nextAmendLineId() { return `amend-line-${_ac++}`; }

// ─────────────────────────────────────────────────────────────────────────────

export default function ActiveOrderWorkspace({ order, onBack, onCancelOrder }) {
  // base_order is immutable — never edited directly
  const [baseOrder] = useState(() => ({
    ...order,
    lines: (order.lines || []).map(l => ({ ...l })),
  }));

  // Current committed lines (starts from base, updated on each amendment commit)
  const [committedLines, setCommittedLines] = useState(() =>
    (order.lines || []).map(l => ({ ...l }))
  );

  const [version, setVersion] = useState(1);
  const [orderStatus, setOrderStatus] = useState(order.status);

  // Amendment session: null = not amending
  const [amendSession, setAmendSession] = useState(null);
  const isAmending = amendSession !== null;

  // Amendment step: 'edit' | 'review'
  const [amendStep, setAmendStep] = useState('edit');

  const projectedLines = useMemo(() => {
    if (!amendSession) return committedLines;
    return applyAmendments(amendSession.base_lines, amendSession.amendments);
  }, [amendSession, committedLines]);

  const amendChangeSummary = useMemo(() => {
    if (!amendSession) return { added: [], removed: [], qtyChanged: [] };
    const { base_lines, amendments } = amendSession;
    const removed    = amendments.filter(a => a.type === 'REMOVE')
      .map(a => base_lines.find(b => b.line_id === a.line_id)).filter(Boolean);
    const added      = amendments.filter(a => a.type === 'ADD').map(a => a.line);
    const qtyChanged = amendments.filter(a => a.type === 'CHANGE_QTY').map(a => ({
      ...base_lines.find(b => b.line_id === a.line_id),
      newQty: a.qty,
    })).filter(b => b.line_id);
    return { added, removed, qtyChanged };
  }, [amendSession]);

  // All lines for diff (projected + removed marked)
  const diffLines = useMemo(() => {
    if (!amendSession) return committedLines;
    const { base_lines, amendments } = amendSession;
    const removedIds = new Set(amendments.filter(a => a.type === 'REMOVE').map(a => a.line_id));
    const removedLines = base_lines.filter(l => removedIds.has(l.line_id)).map(l => ({ ...l, _removed: true }));
    return [...projectedLines, ...removedLines];
  }, [amendSession, projectedLines, committedLines]);

  const totalQty = committedLines.reduce((s, l) => s + (l.qty || 0), 0);

  // ── Amendment actions ─────────────────────────────────────────────────────

  const startAmending = () => {
    setAmendSession({ base_lines: committedLines.map(l => ({ ...l })), amendments: [] });
    setAmendStep('edit');
  };

  const cancelAmending = () => { setAmendSession(null); setAmendStep('edit'); };

  const commitAmendment = async () => {
    const newLines = projectedLines.map(l => ({ ...l }));
    setCommittedLines(newLines);
    setVersion(v => v + 1);
    setAmendSession(null);
    setAmendStep('edit');

    // Persist to DB if real record
    if (order.id && typeof order.id === 'string' && order.id.length >= 10) {
      const wasConfirmed = !!order.supplier_confirmed_at;

      // Always persist the new lines + amended_at
      await base44.entities.PurchaseOrder.update(order.id, {
        lines: newLines,
        amended_at: new Date().toISOString(),
      });

      if (wasConfirmed) {
        // Reset confirmation state
        await base44.entities.PurchaseOrder.update(order.id, {
          supplier_token: null,
          supplier_confirmed_at: null,
          supplier_dispatched_at: null,
          supplier_dispatch_note: null,
          status: 'Submitted',
        });
        setOrderStatus('Submitted');
        setPortalLink(null);

        // Generate new token + notify supplier by email
        const res = await base44.functions.invoke('notifySupplierAmendment', { order_id: order.id });
        if (res.data?.portal_url) setPortalLink(res.data.portal_url);
      }
    }
  };

  const amendRemove = (line_id) => {
    setAmendSession(prev => {
      const isAdded = prev.amendments.some(a => a.type === 'ADD' && a.line.line_id === line_id);
      if (isAdded) return { ...prev, amendments: prev.amendments.filter(a => !(a.type === 'ADD' && a.line.line_id === line_id)) };
      if (prev.amendments.some(a => a.type === 'REMOVE' && a.line_id === line_id)) return prev;
      return { ...prev, amendments: [...prev.amendments, { type: 'REMOVE', line_id }] };
    });
  };

  const amendChangeQty = (line_id, qty) => {
    const n = Math.max(0, Number(qty));
    if (isNaN(n)) return;
    setAmendSession(prev => {
      // If it's an added line, update the ADD amendment
      const addIdx = prev.amendments.findIndex(a => a.type === 'ADD' && a.line.line_id === line_id);
      if (addIdx !== -1) {
        return { ...prev, amendments: prev.amendments.map((a, i) => i === addIdx ? { ...a, line: { ...a.line, qty: n } } : a) };
      }
      const base = prev.base_lines.find(b => b.line_id === line_id);
      const existIdx = prev.amendments.findIndex(a => a.type === 'CHANGE_QTY' && a.line_id === line_id);
      // If qty matches base, remove amendment
      if (base && base.qty === n) {
        return { ...prev, amendments: prev.amendments.filter((_, i) => i !== existIdx) };
      }
      if (existIdx !== -1) {
        return { ...prev, amendments: prev.amendments.map((a, i) => i === existIdx ? { ...a, qty: n } : a) };
      }
      return { ...prev, amendments: [...prev.amendments, { type: 'CHANGE_QTY', line_id, qty: n }] };
    });
  };

  const amendUpdateField = (line_id, field, value) => {
    setAmendSession(prev => {
      const addIdx = prev.amendments.findIndex(a => a.type === 'ADD' && a.line.line_id === line_id);
      if (addIdx === -1) return prev;
      return { ...prev, amendments: prev.amendments.map((a, i) => i === addIdx ? { ...a, line: { ...a.line, [field]: value } } : a) };
    });
  };

  const amendAddLine = () => {
    setAmendSession(prev => ({
      ...prev,
      amendments: [...prev.amendments, { type: 'ADD', line: {
        line_id: nextAmendLineId(), sku: '', name: '', qty: 1,
        unit_cost: null, supplier: order.supplier, source: 'amendment',
      }}],
    }));
  };

  // ── Supplier portal link ─────────────────────────────────────────────────
  const [portalLink, setPortalLink] = useState(
    order.supplier_token
      ? `${window.location.origin}/SupplierPortal?token=${order.supplier_token}`
      : null
  );
  const [generatingLink, setGeneratingLink] = useState(false);
  const [linkCopied, setLinkCopied] = useState(false);

  const handleGenerateLink = async () => {
    if (!order.id || typeof order.id !== 'string' || order.id.length < 10) return;
    setGeneratingLink(true);
    const res = await base44.functions.invoke('generateSupplierToken', { order_id: order.id });
    setPortalLink(res.data?.portal_url || null);
    setGeneratingLink(false);
  };

  const handleCopyLink = () => {
    if (!portalLink) return;
    navigator.clipboard.writeText(portalLink);
    setLinkCopied(true);
    setTimeout(() => setLinkCopied(false), 2000);
  };

  // Supplier confirmation status from order data
  const supplierConfirmed = order.supplier_confirmed_at;
  const supplierDispatched = order.supplier_dispatched_at;

  // ── Activity log (static placeholder) ────────────────────────────────────
  const activityLog = [
    { time: order.createdOn,   actor: order.createdBy, event: 'Draft created' },
    { time: order.createdOn,   actor: order.createdBy, event: 'Approved' },
    { time: order.expectedDate, actor: order.createdBy, event: 'Submitted' },
    ...(version > 1 ? [{ time: '—', actor: '—', event: `Amendment committed — v${version}` }] : []),
  ];

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <div className="flex flex-col min-h-screen">
      <div className="flex-1 p-6 max-w-[960px] pb-28">

        {/* Back */}
        <button onClick={onBack}
          className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground mb-5 transition-colors">
          <ArrowLeft size={14} /> Back to Orders
        </button>

        {/* Page header */}
        <div className="flex items-start justify-between mb-5">
          <div>
            <div className="flex items-baseline gap-3 mb-1">
              <h1 className="text-lg font-semibold text-foreground">Active Order Workspace</h1>
              <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${statusStyle[orderStatus] || 'bg-muted text-muted-foreground'}`}>
                {orderStatus}
              </span>
              {version > 1 && (
                <span className="text-xs px-1.5 py-0.5 rounded bg-muted text-muted-foreground font-mono">v{version}</span>
              )}
            </div>
            <p className="text-sm text-muted-foreground font-mono">{order.orderNumber} · {order.supplier}</p>
            <p className="text-xs text-muted-foreground mt-0.5">Source: {order.sourceModule}</p>
          </div>
        </div>

        {/* Amendment mode banner */}
        {isAmending && (
          <div className="flex items-center justify-between mb-5 px-4 py-2.5 bg-amber-50 border border-amber-200 rounded">
            <span className="flex items-center gap-1.5 text-xs text-amber-700 font-medium">
              <GitBranch size={12} />
              Amendment in progress — {amendSession.amendments.length} pending change{amendSession.amendments.length !== 1 ? 's' : ''}
            </span>
            <div className="flex items-center gap-2">
              {amendStep === 'edit' && (
                <button onClick={() => setAmendStep('review')}
                  className="flex items-center gap-1.5 h-7 px-3 text-xs border border-amber-400 rounded bg-amber-100 hover:bg-amber-200 text-amber-800 font-medium transition-colors">
                  Review Changes →
                </button>
              )}
              {amendStep === 'review' && (
                <button onClick={() => setAmendStep('edit')}
                  className="h-7 px-3 text-xs border border-amber-300 rounded bg-white hover:bg-amber-50 text-amber-700 transition-colors">
                  ← Back to Edit
                </button>
              )}
              <button onClick={cancelAmending}
                className="h-7 px-3 text-xs border border-amber-300 rounded bg-white hover:bg-amber-50 text-amber-700 transition-colors">
                Cancel
              </button>
            </div>
          </div>
        )}

        {/* Summary strip */}
        <div className="grid grid-cols-4 gap-3 mb-6">
          {[
            { label: 'Supplier',      value: order.supplier },
            { label: 'Expected Date', value: order.expectedDate },
            { label: 'Total Lines',   value: committedLines.length },
            { label: 'Total Qty',     value: totalQty.toLocaleString() },
          ].map(({ label, value }) => (
            <div key={label} className="border border-border rounded bg-card px-4 py-3">
              <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-widest mb-1">{label}</p>
              <p className="text-sm font-semibold text-foreground">{value}</p>
            </div>
          ))}
        </div>

        {/* ── Amendment Edit View ── */}
        {isAmending && amendStep === 'edit' && (
          <section className="mb-6">
            <SectionHeading>Projected Lines — Edit Amendment</SectionHeading>
            <div className="border border-border rounded overflow-hidden mb-3">
              <table className="w-full text-sm">
                <thead className="bg-muted/40 text-muted-foreground text-xs uppercase tracking-wide">
                  <tr>{['SKU', 'Item Name', 'Supplier', 'Qty', 'Source', 'Change', ''].map(h => (
                    <th key={h} className="text-left px-4 py-2 font-medium whitespace-nowrap">{h}</th>
                  ))}</tr>
                </thead>
                <tbody>
                  {projectedLines.length === 0 && (
                    <tr><td colSpan={7} className="px-4 py-5 text-center text-muted-foreground text-xs">No active lines.</td></tr>
                  )}
                  {projectedLines.map((line, i) => {
                    const st = getLineStatus(line, amendSession.base_lines, amendSession.amendments);
                    const rowBg = st === 'added' ? 'bg-blue-50/40' : st === 'qty_changed' ? 'bg-amber-50/40' : i % 2 === 0 ? 'bg-card' : 'bg-background';
                    const isAdded = st === 'added';
                    return (
                      <tr key={line.line_id} className={`border-t border-border ${rowBg}`}>
                        <td className="px-4 py-2">
                          {isAdded
                            ? <input value={line.sku || ''} onChange={e => amendUpdateField(line.line_id, 'sku', e.target.value)} placeholder="SKU"
                                className="w-24 h-7 border border-border rounded px-2 text-xs bg-card focus:outline-none focus:ring-1 focus:ring-ring font-mono" />
                            : <span className="font-mono text-xs text-muted-foreground">{line.sku || '—'}</span>
                          }
                        </td>
                        <td className="px-4 py-2">
                          {isAdded
                            ? <input value={line.name || ''} onChange={e => amendUpdateField(line.line_id, 'name', e.target.value)} placeholder="Item name"
                                className="w-44 h-7 border border-border rounded px-2 text-xs bg-card focus:outline-none focus:ring-1 focus:ring-ring" />
                            : <span className="font-medium">{line.name || '—'}</span>
                          }
                        </td>
                        <td className="px-4 py-2">
                          {isAdded
                            ? <input value={line.supplier || ''} onChange={e => amendUpdateField(line.line_id, 'supplier', e.target.value)} placeholder="Supplier"
                                className="w-32 h-7 border border-border rounded px-2 text-xs bg-card focus:outline-none focus:ring-1 focus:ring-ring" />
                            : <span className="text-xs text-muted-foreground">{line.supplier}</span>
                          }
                        </td>
                        <td className="px-4 py-2">
                          <input type="number" min={0} value={line.qty} onChange={e => amendChangeQty(line.line_id, e.target.value)}
                            className="w-16 h-7 border border-border rounded px-2 text-xs text-center bg-card focus:outline-none focus:ring-1 focus:ring-ring" />
                        </td>
                        <td className="px-4 py-2 text-xs text-muted-foreground">{line.source}</td>
                        <td className="px-4 py-2">
                          {st !== 'original' && (
                            <span className={`text-[10px] px-2 py-0.5 rounded-full font-semibold ${lineStatusStyle[st]}`}>
                              {st.replace('_', ' ')}
                            </span>
                          )}
                        </td>
                        <td className="px-4 py-2">
                          <button onClick={() => amendRemove(line.line_id)}
                            className="text-muted-foreground hover:text-destructive transition-colors">
                            <Trash2 size={13} />
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
            <button onClick={amendAddLine}
              className="flex items-center gap-1.5 h-7 px-3 text-xs border border-border rounded bg-card hover:bg-muted transition-colors text-foreground">
              <Plus size={12} /> Add Line
            </button>
          </section>
        )}

        {/* ── Amendment Review View ── */}
        {isAmending && amendStep === 'review' && (
          <>
            <div className="flex gap-6 items-start mb-6">
              {/* Diff table */}
              <div className="flex-1 min-w-0">
                <SectionHeading>Amendment Diff</SectionHeading>
                <div className="border border-border rounded overflow-hidden">
                  <table className="w-full text-sm">
                    <thead className="bg-muted/40 text-muted-foreground text-xs uppercase tracking-wide">
                      <tr>{['SKU', 'Item Name', 'Qty', 'Status'].map(h => (
                        <th key={h} className="text-left px-4 py-2 font-medium whitespace-nowrap">{h}</th>
                      ))}</tr>
                    </thead>
                    <tbody>
                      {diffLines.map((line, i) => {
                        const isRemoved = line._removed;
                        const st = isRemoved ? 'removed' : getLineStatus(line, amendSession.base_lines, amendSession.amendments);
                        const baseLine = amendSession.base_lines.find(b => b.line_id === line.line_id);
                        return (
                          <tr key={line.line_id} className={`border-t border-border ${isRemoved ? 'opacity-50' : i % 2 === 0 ? 'bg-card' : 'bg-background'}`}>
                            <td className="px-4 py-2 font-mono text-xs text-muted-foreground">{line.sku || '—'}</td>
                            <td className={`px-4 py-2 font-medium ${isRemoved ? 'line-through text-muted-foreground' : ''}`}>{line.name || '—'}</td>
                            <td className="px-4 py-2">
                              {st === 'qty_changed' ? (
                                <span className="flex items-center gap-1.5">
                                  <span className="line-through text-muted-foreground text-xs">{baseLine?.qty}</span>
                                  <span className="text-amber-700 font-semibold">{line.qty}</span>
                                </span>
                              ) : <span>{line.qty}</span>}
                            </td>
                            <td className="px-4 py-2">
                              <span className={`text-[10px] px-2 py-0.5 rounded-full font-semibold ${lineStatusStyle[st]}`}>
                                {st.replace('_', ' ')}
                              </span>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Summary panel */}
              <div className="w-56 flex-shrink-0 space-y-3">
                <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-widest">Summary</p>
                {[
                  { label: 'Added',       count: amendChangeSummary.added.length,      style: lineStatusStyle.added },
                  { label: 'Removed',     count: amendChangeSummary.removed.length,    style: lineStatusStyle.removed },
                  { label: 'Qty changed', count: amendChangeSummary.qtyChanged.length, style: lineStatusStyle.qty_changed },
                ].map(({ label, count, style }) => (
                  <div key={label} className="flex items-center justify-between text-xs">
                    <span className="text-muted-foreground">{label}</span>
                    <span className={`px-2 py-0.5 rounded-full font-semibold ${count > 0 ? style : 'text-muted-foreground'}`}>{count}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Final projected */}
            <section>
              <SectionHeading>Final Projected Order</SectionHeading>
              <div className="border border-border rounded overflow-hidden">
                <table className="w-full text-sm">
                  <thead className="bg-muted/40 text-muted-foreground text-xs uppercase tracking-wide">
                    <tr>{['SKU', 'Item Name', 'Supplier', 'Final Qty'].map(h => (
                      <th key={h} className="text-left px-4 py-2 font-medium whitespace-nowrap">{h}</th>
                    ))}</tr>
                  </thead>
                  <tbody>
                    {projectedLines.length === 0 && (
                      <tr><td colSpan={4} className="px-4 py-5 text-center text-muted-foreground text-xs">No active lines.</td></tr>
                    )}
                    {projectedLines.map((row, i) => (
                      <tr key={row.line_id} className={`border-t border-border ${i % 2 === 0 ? 'bg-card' : 'bg-background'}`}>
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
        )}

        {/* ── Submitted order lines (read-only, shown when not amending) ── */}
        {!isAmending && (
          <>
            <section className="mb-6">
              <SectionHeading>Order Lines</SectionHeading>
              <div className="border border-border rounded overflow-hidden">
                <table className="w-full text-sm">
                  <thead className="bg-muted/40 text-muted-foreground text-xs uppercase tracking-wide">
                    <tr>{['SKU', 'Item Name', 'Supplier', 'Qty', 'Unit Cost', 'Source'].map(h => (
                      <th key={h} className="text-left px-4 py-2 font-medium whitespace-nowrap">{h}</th>
                    ))}</tr>
                  </thead>
                  <tbody>
                    {committedLines.length === 0 && (
                      <tr><td colSpan={6} className="px-4 py-5 text-center text-muted-foreground text-xs">No lines.</td></tr>
                    )}
                    {committedLines.map((line, i) => (
                      <tr key={line.line_id} className={`border-t border-border ${i % 2 === 0 ? 'bg-card' : 'bg-background'}`}>
                        <td className="px-4 py-2 font-mono text-xs text-muted-foreground">{line.sku || '—'}</td>
                        <td className="px-4 py-2 font-medium">{line.name || '—'}</td>
                        <td className="px-4 py-2 text-muted-foreground">{line.supplier}</td>
                        <td className="px-4 py-2">{line.qty}</td>
                        <td className="px-4 py-2 text-muted-foreground">{line.unit_cost != null ? `$${line.unit_cost}` : '—'}</td>
                        <td className="px-4 py-2 text-xs text-muted-foreground">{line.source}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </section>

            {/* Supplier Portal section */}
            <section className="mb-6">
              <SectionHeading>Supplier Confirmation</SectionHeading>
              <div className="border border-border rounded bg-card p-4 space-y-4">
                {/* Status row */}
                <div className="flex flex-wrap gap-3">
                  <div className={`flex items-center gap-2 text-sm px-3 py-2 rounded-lg border ${supplierConfirmed ? 'bg-violet-50 border-violet-200 text-violet-700' : 'bg-muted border-border text-muted-foreground'}`}>
                    <CheckCircle2 size={14} />
                    <span>{supplierConfirmed ? `Confirmed ${new Date(supplierConfirmed).toLocaleDateString()}` : 'Awaiting confirmation'}</span>
                  </div>
                  <div className={`flex items-center gap-2 text-sm px-3 py-2 rounded-lg border ${supplierDispatched ? 'bg-amber-50 border-amber-200 text-amber-700' : 'bg-muted border-border text-muted-foreground'}`}>
                    <Truck size={14} />
                    <span>{supplierDispatched ? `Dispatched ${new Date(supplierDispatched).toLocaleDateString()}` : 'Not dispatched yet'}</span>
                  </div>
                </div>

                {order.supplier_dispatch_note && (
                  <p className="text-xs text-muted-foreground border-l-2 border-border pl-3">{order.supplier_dispatch_note}</p>
                )}

                {/* Portal link */}
                <div className="space-y-2">
                  <p className="text-xs text-muted-foreground">Send this link to <span className="font-medium text-foreground">{order.supplier}</span> — they can confirm and mark as dispatched without logging in.</p>
                  {portalLink ? (
                    <div className="flex items-center gap-2">
                      <input readOnly value={portalLink} className="flex-1 h-8 border border-border rounded px-3 text-xs bg-background font-mono text-muted-foreground focus:outline-none" />
                      <button onClick={handleCopyLink} className="flex items-center gap-1.5 h-8 px-3 text-xs border border-border rounded bg-card hover:bg-muted transition-colors text-foreground whitespace-nowrap">
                        <Link2 size={12} /> {linkCopied ? 'Copied!' : 'Copy'}
                      </button>
                    </div>
                  ) : (
                    <button
                      onClick={handleGenerateLink}
                      disabled={generatingLink || !order.id || typeof order.id !== 'string' || order.id.length < 10}
                      className="flex items-center gap-1.5 h-8 px-4 text-xs border border-border rounded bg-card hover:bg-muted transition-colors text-foreground disabled:opacity-40"
                    >
                      <Link2 size={12} /> {generatingLink ? 'Generating…' : 'Generate Supplier Portal Link'}
                    </button>
                  )}
                </div>
              </div>
            </section>

            {/* Activity log */}
            <section>
              <SectionHeading>Activity Log</SectionHeading>
              <div className="border border-border rounded overflow-hidden">
                {activityLog.map((entry, i) => (
                  <div key={i} className={`flex items-center gap-4 px-4 py-2.5 text-xs ${i > 0 ? 'border-t border-border' : ''} ${i % 2 === 0 ? 'bg-card' : 'bg-background'}`}>
                    <span className="text-muted-foreground w-24 flex-shrink-0">{entry.time}</span>
                    <span className="text-muted-foreground w-20 flex-shrink-0">{entry.actor}</span>
                    <span className="text-foreground">{entry.event}</span>
                  </div>
                ))}
              </div>
            </section>
          </>
        )}
      </div>

      {/* Sticky action bar */}
      <div className="fixed bottom-0 left-56 right-0 bg-card border-t border-border px-6 py-3 flex items-center gap-3 z-10">
        {isAmending ? (
          <>
            <button onClick={cancelAmending}
              className="flex items-center gap-2 h-10 px-5 text-sm rounded border border-border bg-card hover:bg-muted transition-colors text-foreground">
              <X size={14} /> Cancel Amendment
            </button>
            <span className="flex items-center gap-1.5 text-xs px-2.5 py-1 rounded font-medium bg-amber-50 text-amber-700 border border-amber-200">
              <GitBranch size={11} /> Amending — v{version}
            </span>
            <button
              onClick={commitAmendment}
              disabled={amendSession.amendments.length === 0}
              className="ml-auto flex items-center gap-2 h-10 px-6 text-sm rounded bg-primary text-primary-foreground hover:opacity-90 transition-opacity disabled:opacity-30 disabled:cursor-not-allowed font-medium">
              <Check size={14} /> Commit Amendment
            </button>
          </>
        ) : (
          <>
            <button onClick={onBack}
              className="flex items-center gap-2 h-10 px-5 text-sm rounded border border-border bg-card hover:bg-muted transition-colors text-foreground">
              <ArrowLeft size={14} /> Return to Orders
            </button>
            <button onClick={startAmending}
              className="flex items-center gap-2 h-10 px-5 text-sm rounded border border-border bg-card hover:bg-muted transition-colors text-foreground">
              <GitBranch size={14} /> Amend Order
            </button>
            <span className="flex items-center gap-1.5 text-xs px-2.5 py-1 rounded font-medium bg-muted text-muted-foreground">
              <Clock size={11} /> {orderStatus}
            </span>
            <button
              onClick={() => { if (window.confirm('Cancel this order?')) { setOrderStatus('Cancelled'); onCancelOrder && onCancelOrder(); } }}
              className="ml-auto flex items-center gap-2 h-10 px-5 text-sm rounded border border-red-200 bg-red-50 hover:bg-red-100 transition-colors text-red-700">
              <X size={14} /> Cancel Order
            </button>
          </>
        )}
      </div>
    </div>
  );
}