import { useMemo, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { ArrowLeft, CheckCircle2, Save, Undo2, X, AlertTriangle, Clock } from 'lucide-react';

const initialRows = [
  {
    id: 'WE-2026-001',
    occurredAt: '29 Mar 2026, 09:20',
    recordedAt: '29 Mar 2026, 09:22',
    location: 'Main Store',
    sku: 'CHM-001',
    itemName: 'Premium Detergent 20L',
    qty: 2,
    reason: 'Spill',
    source: 'ADMIN',
    status: 'SUBMITTED',
    recordedBy: 'A. Manager',
    notes: 'Leaked during transfer.',
    currentOnHand: 18,
  },
  {
    id: 'WE-2026-002',
    occurredAt: '29 Mar 2026, 08:05',
    recordedAt: '29 Mar 2026, 08:09',
    location: 'Main Store',
    sku: 'PKG-003',
    itemName: 'Garment Tag Roll',
    qty: 1,
    reason: 'Damaged',
    source: 'ADMIN',
    status: 'APPROVED',
    recordedBy: 'S. Cruz',
    notes: 'Outer wrap torn during unloading.',
    currentOnHand: 57,
  },
  {
    id: 'WE-2026-003',
    occurredAt: '28 Mar 2026, 17:45',
    recordedAt: '28 Mar 2026, 17:52',
    location: 'Branch A',
    sku: 'CHM-005',
    itemName: 'Bleach 5L',
    qty: 4,
    reason: 'Expired',
    source: 'IMPORT',
    status: 'DRAFT',
    recordedBy: 'R. Santos',
    notes: 'Pending supervisor review.',
    currentOnHand: 24,
  },
  {
    id: 'WE-2026-004',
    occurredAt: '28 Mar 2026, 15:10',
    recordedAt: '28 Mar 2026, 15:16',
    location: 'Main Store',
    sku: 'SAFE-021',
    itemName: 'Disposable Gloves',
    qty: 12,
    reason: 'Production Use',
    source: 'POS',
    status: 'REVERSED',
    recordedBy: 'M. Lopez',
    notes: 'Reversed after duplicate count.',
    currentOnHand: 320,
  },
  {
    id: 'WE-2026-005',
    occurredAt: '28 Mar 2026, 11:28',
    recordedAt: '28 Mar 2026, 11:30',
    location: 'Branch A',
    sku: 'CHEM-009',
    itemName: 'Stain Remover 2L',
    qty: 3,
    reason: 'Damage in Handling',
    source: 'SCANNER',
    status: 'REJECTED',
    recordedBy: 'L. David',
    notes: 'Rejected due to incorrect SKU selection.',
    currentOnHand: 41,
  },
  {
    id: 'WE-2026-006',
    occurredAt: '27 Mar 2026, 18:40',
    recordedAt: '27 Mar 2026, 18:46',
    location: 'Main Store',
    sku: 'PKG-011',
    itemName: 'Laundry Bag Large',
    qty: 22,
    reason: 'Sampling/Promos',
    source: 'ADMIN',
    status: 'SUBMITTED',
    recordedBy: 'J. Reyes',
    notes: 'Promo bundle drawdown awaiting approval.',
    currentOnHand: 260,
  },
];

const statusStyle = {
  DRAFT:     'bg-muted text-muted-foreground border border-border',
  SUBMITTED: 'bg-amber-50 text-amber-700 border border-amber-200',
  APPROVED:  'bg-green-50 text-green-700 border border-green-200',
  REJECTED:  'bg-red-50 text-red-600 border border-red-200',
  REVERSED:  'bg-slate-100 text-slate-600 border border-slate-200',
};

const sourceOptions  = ['ADMIN', 'SCANNER', 'POS', 'IMPORT'];
const reasonOptions  = [
  'Damage in Handling', 'Theft/Shrink', 'Production Use',
  'Sampling/Promos', 'Spillage', 'Expired', 'Damaged', 'Spill',
];
const locationOptions = ['Main Store', 'Branch A', 'Branch B'];

function Field({ label, children }) {
  return (
    <div>
      <label className="block text-[11px] font-semibold text-muted-foreground uppercase tracking-widest mb-1">{label}</label>
      {children}
    </div>
  );
}

function ReadField({ label, value, mono = false }) {
  return (
    <div>
      <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-widest mb-0.5">{label}</p>
      <p className={`text-sm text-foreground ${mono ? 'font-mono' : ''}`}>{value ?? '—'}</p>
    </div>
  );
}

function SectionHeading({ children }) {
  return (
    <div className="flex items-center gap-3 mb-3">
      <span className="text-[10px] font-semibold text-muted-foreground uppercase tracking-widest whitespace-nowrap">{children}</span>
      <div className="flex-1 border-t border-border" />
    </div>
  );
}

// Compact inline reason input shown in the footer bar
function InlineReasonInput({ label, placeholder, value, onChange, onConfirm, onCancel }) {
  return (
    <div className="flex items-center gap-2 flex-1">
      <span className="text-xs text-muted-foreground whitespace-nowrap font-medium">{label}:</span>
      <input
        autoFocus
        type="text"
        value={value}
        onChange={e => onChange(e.target.value)}
        placeholder={placeholder}
        className="h-8 flex-1 min-w-[180px] border border-border rounded px-2.5 text-xs bg-card focus:outline-none focus:ring-1 focus:ring-ring"
      />
      <button
        onClick={onConfirm}
        disabled={!value.trim()}
        className="h-8 px-3 text-xs rounded bg-primary text-primary-foreground hover:opacity-90 transition-opacity disabled:opacity-30 disabled:cursor-not-allowed font-medium"
      >
        Confirm
      </button>
      <button
        onClick={onCancel}
        className="h-8 px-3 text-xs rounded border border-border bg-card hover:bg-muted transition-colors text-foreground"
      >
        Cancel
      </button>
    </div>
  );
}

export default function WastageWorkspace() {
  const navigate     = useNavigate();
  const [searchParams] = useSearchParams();
  const mode    = searchParams.get('mode');
  const eventId = searchParams.get('event');

  const [rows, setRows]               = useState(initialRows);
  const [actionStatus, setActionStatus] = useState(null);

  // Inline reason states
  const [rejectMode, setRejectMode]   = useState(false);
  const [reverseMode, setReverseMode] = useState(false);
  const [rejectReason, setRejectReason]   = useState('');
  const [reverseReason, setReverseReason] = useState('');

  const [form, setForm] = useState({
    location: 'Main Store',
    sku: '',
    itemName: '',
    qty: 1,
    reason: 'Damage in Handling',
    occurredAt: '30 Mar 2026, 20:45',
    source: 'ADMIN',
    notes: '',
    currentOnHand: '—',
  });

  const selectedEvent = useMemo(() => rows.find(r => r.id === eventId) || null, [eventId, rows]);
  const workspaceStatus = selectedEvent?.status || 'CREATE';

  const handleFormChange = (field, value) => {
    setForm(prev => {
      const next = { ...prev, [field]: value };
      if (field === 'sku') {
        const match = rows.find(r => r.sku.toLowerCase() === value.trim().toLowerCase());
        if (match) {
          next.itemName      = match.itemName;
          next.currentOnHand = match.currentOnHand;
          next.location      = match.location;
        }
      }
      return next;
    });
  };

  const updateEventStatus = (nextStatus, extraNote = '') => {
    if (!selectedEvent) return;
    setRows(prev => prev.map(r =>
      r.id === selectedEvent.id
        ? { ...r, status: nextStatus, notes: extraNote ? `${r.notes}${r.notes ? ' ' : ''}${extraNote}` : r.notes }
        : r
    ));
  };

  const handleCreateAction = (nextStatus) => {
    setActionStatus(nextStatus === 'DRAFT' ? 'draft_saved' : 'submitted');
    setTimeout(() => navigate('/Wastage'), 600);
  };

  const handleApprove = () => {
    updateEventStatus('APPROVED');
    setActionStatus('approved');
  };

  const handleReject = () => {
    if (!rejectReason.trim()) return;
    updateEventStatus('REJECTED', `Rejection reason: ${rejectReason.trim()}.`);
    setRejectMode(false);
    setRejectReason('');
    setActionStatus('rejected');
  };

  const handleReverse = () => {
    if (!reverseReason.trim()) return;
    updateEventStatus('REVERSED', `Reversal reason: ${reverseReason.trim()}.`);
    setReverseMode(false);
    setReverseReason('');
    setActionStatus('reversed');
  };

  const handleDraftUpdate = (nextStatus) => {
    updateEventStatus(nextStatus);
    setActionStatus(nextStatus === 'DRAFT' ? 'draft_saved' : 'submitted');
  };

  // Stock impact helper
  const stockImpact = useMemo(() => {
    if (!selectedEvent) return null;
    const { status, qty, currentOnHand } = selectedEvent;
    if (status === 'SUBMITTED') return { label: 'Pending — no deduction yet', note: `Will deduct ${qty} units on approval`, tone: 'text-amber-700' };
    if (status === 'APPROVED')  return { label: `–${qty} deducted`,           note: `On hand after: ${currentOnHand - qty}`,  tone: 'text-red-700' };
    if (status === 'REVERSED')  return { label: `+${qty} restored`,           note: `Stock offset movement posted`,           tone: 'text-green-700' };
    if (status === 'DRAFT')     return { label: 'Draft — no stock effect',    note: 'Submit to begin review',                 tone: 'text-muted-foreground' };
    return { label: 'No stock effect', note: 'Rejected events do not adjust stock', tone: 'text-muted-foreground' };
  }, [selectedEvent]);

  if (mode !== 'create' && !selectedEvent) {
    return (
      <div className="p-6">
        <button onClick={() => navigate('/Wastage')} className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground mb-4">
          <ArrowLeft size={14} /> Back to Wastage
        </button>
        <p className="text-sm text-muted-foreground">Wastage event not found.</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-screen">
      <div className="flex-1 p-5 max-w-[860px] pb-24">

        {/* Back */}
        <button onClick={() => navigate('/Wastage')}
          className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground mb-4 transition-colors">
          <ArrowLeft size={13} /> Back to Wastage
        </button>

        {/* ── CREATE MODE ── */}
        {mode === 'create' ? (
          <>
            {/* Header */}
            <div className="flex items-baseline justify-between mb-3">
              <div>
                <h1 className="text-sm font-semibold text-foreground">Record Wastage</h1>
                <p className="text-xs text-muted-foreground mt-0.5">Draft records do not adjust stock until approved.</p>
              </div>
              <span className="text-[10px] px-2 py-0.5 rounded-full font-semibold bg-muted text-muted-foreground border border-border">DRAFT</span>
            </div>

            {/* Summary strip — always visible, updates as form fills */}
            <div className="grid grid-cols-4 gap-2 mb-4">
              {[
                { label: 'Location',     value: form.location || '—' },
                { label: 'SKU',          value: form.sku      || '—',   mono: true },
                { label: 'On Hand',      value: String(form.currentOnHand) },
                { label: 'Stock Effect', value: 'No movement yet', dim: true },
              ].map(({ label, value, mono, dim }) => (
                <div key={label} className="border border-border rounded bg-card px-3 py-2">
                  <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-widest mb-0.5">{label}</p>
                  <p className={`text-sm font-semibold leading-snug ${dim ? 'text-muted-foreground' : 'text-foreground'} ${mono ? 'font-mono' : ''}`}>{value}</p>
                </div>
              ))}
            </div>

            {/* Item preview card — shown once SKU resolves */}
            {form.itemName ? (
              <div className="mb-4 border border-border rounded bg-muted/20 px-4 py-3 flex items-center gap-6">
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-semibold text-muted-foreground uppercase tracking-widest mb-0.5">Item</p>
                  <p className="text-sm font-semibold text-foreground truncate">{form.itemName}</p>
                </div>
                <div className="text-right flex-shrink-0">
                  <p className="text-[10px] text-muted-foreground uppercase tracking-widest">On Hand</p>
                  <p className="text-lg font-bold text-foreground leading-none mt-0.5">{form.currentOnHand}</p>
                </div>
                <div className="text-right flex-shrink-0">
                  <p className="text-[10px] text-muted-foreground uppercase tracking-widest">After Approval</p>
                  <p className="text-lg font-bold text-red-600 leading-none mt-0.5">
                    {typeof form.currentOnHand === 'number' ? form.currentOnHand - Number(form.qty) : '—'}
                  </p>
                </div>
              </div>
            ) : (
              <div className="mb-4 border border-dashed border-border rounded px-4 py-2.5 flex items-center gap-2">
                <p className="text-xs text-muted-foreground">Enter a SKU above to preview the item and on-hand quantity.</p>
              </div>
            )}

            {/* Primary fields — location, SKU, qty, reason */}
            <div className="mb-4">
              <SectionHeading>Core Fields</SectionHeading>
              <div className="grid grid-cols-2 gap-x-6 gap-y-3">
                <Field label="Location">
                  <select value={form.location} onChange={e => handleFormChange('location', e.target.value)}
                    className="h-8 w-full border border-border rounded px-2.5 text-sm bg-card focus:outline-none focus:ring-1 focus:ring-ring">
                    {locationOptions.map(l => <option key={l}>{l}</option>)}
                  </select>
                </Field>
                <Field label="SKU">
                  <input value={form.sku} onChange={e => handleFormChange('sku', e.target.value)}
                    placeholder="e.g. CHM-001"
                    className="h-8 w-full border border-border rounded px-2.5 text-sm font-mono bg-card focus:outline-none focus:ring-1 focus:ring-ring placeholder:text-muted-foreground/50" />
                </Field>
                <Field label="Quantity">
                  <input type="number" min={1} value={form.qty} onChange={e => handleFormChange('qty', e.target.value)}
                    className="h-8 w-full border border-border rounded px-2.5 text-sm font-semibold bg-card focus:outline-none focus:ring-1 focus:ring-ring" />
                </Field>
                <Field label="Reason Code">
                  <select value={form.reason} onChange={e => handleFormChange('reason', e.target.value)}
                    className="h-8 w-full border border-border rounded px-2.5 text-sm bg-card focus:outline-none focus:ring-1 focus:ring-ring">
                    {reasonOptions.map(r => <option key={r}>{r}</option>)}
                  </select>
                </Field>
              </div>
            </div>

            {/* Secondary fields — occurred at, source, notes */}
            <div>
              <SectionHeading>Additional Details</SectionHeading>
              <div className="grid grid-cols-2 gap-x-6 gap-y-3">
                <Field label="Occurred At">
                  <input value={form.occurredAt} onChange={e => handleFormChange('occurredAt', e.target.value)}
                    className="h-8 w-full border border-border rounded px-2.5 text-sm bg-card focus:outline-none focus:ring-1 focus:ring-ring" />
                </Field>
                <Field label="Source">
                  <select value={form.source} onChange={e => handleFormChange('source', e.target.value)}
                    className="h-8 w-full border border-border rounded px-2.5 text-sm bg-card focus:outline-none focus:ring-1 focus:ring-ring">
                    {sourceOptions.map(s => <option key={s}>{s}</option>)}
                  </select>
                </Field>
                <div className="col-span-2">
                  <Field label="Notes">
                    <textarea value={form.notes} onChange={e => handleFormChange('notes', e.target.value)}
                      rows={2} placeholder="Optional operational notes…"
                      className="w-full border border-border rounded px-2.5 py-1.5 text-sm bg-card focus:outline-none focus:ring-1 focus:ring-ring resize-none placeholder:text-muted-foreground/40" />
                  </Field>
                </div>
              </div>
            </div>
          </>
        ) : (
          /* ── REVIEW / EXISTING EVENT MODE ── */
          <>
            {/* Page header */}
            <div className="flex items-start justify-between mb-5">
              <div>
                <div className="flex items-baseline gap-3 mb-0.5">
                  <h1 className="text-base font-semibold text-foreground">{selectedEvent.id}</h1>
                  <span className={`text-[10px] px-2 py-0.5 rounded-full font-semibold ${statusStyle[selectedEvent.status]}`}>
                    {selectedEvent.status}
                  </span>
                </div>
                <p className="text-xs text-muted-foreground font-mono">{selectedEvent.sku} · {selectedEvent.itemName}</p>
              </div>
              {/* Stock impact summary */}
              <div className="text-right">
                <p className={`text-sm font-semibold ${stockImpact?.tone}`}>{stockImpact?.label}</p>
                <p className="text-[11px] text-muted-foreground mt-0.5">{stockImpact?.note}</p>
              </div>
            </div>

            {/* Summary strip */}
            <div className="grid grid-cols-4 gap-2.5 mb-5">
              {[
                { label: 'Quantity',      value: selectedEvent.qty },
                { label: 'Location',      value: selectedEvent.location },
                { label: 'Reason',        value: selectedEvent.reason },
                { label: 'Source',        value: selectedEvent.source },
              ].map(({ label, value }) => (
                <div key={label} className="border border-border rounded bg-card px-3 py-2.5">
                  <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-widest mb-0.5">{label}</p>
                  <p className="text-sm font-semibold text-foreground">{value}</p>
                </div>
              ))}
            </div>

            {/* Event details */}
            <section className="mb-5">
              <SectionHeading>Event Details</SectionHeading>
              <div className="grid grid-cols-3 gap-x-8 gap-y-4">
                <ReadField label="Event ID"    value={selectedEvent.id}         mono />
                <ReadField label="Status"      value={selectedEvent.status} />
                <ReadField label="Occurred At" value={selectedEvent.occurredAt} />
                <ReadField label="Recorded At" value={selectedEvent.recordedAt} />
                <ReadField label="Recorded By" value={selectedEvent.recordedBy} />
                <ReadField label="Source"      value={selectedEvent.source} />
                <ReadField label="Location"    value={selectedEvent.location} />
                <ReadField label="SKU"         value={selectedEvent.sku}         mono />
                <ReadField label="Item"        value={selectedEvent.itemName} />
                <ReadField label="Quantity"    value={String(selectedEvent.qty)} />
                <ReadField label="Reason Code" value={selectedEvent.reason} />
                <ReadField label="On Hand"     value={String(selectedEvent.currentOnHand)} />
                <div className="col-span-3">
                  <ReadField label="Notes" value={selectedEvent.notes || 'No notes provided.'} />
                </div>
              </div>
            </section>

            {/* Stock impact detail */}
            <section className="mb-5">
              <SectionHeading>Stock Impact</SectionHeading>
              <div className="border border-border rounded overflow-hidden">
                <table className="w-full text-xs">
                  <thead className="bg-muted/30 text-muted-foreground text-[10px] uppercase tracking-widest">
                    <tr>
                      {['Stage', 'Effect', 'On Hand'].map(h => (
                        <th key={h} className="text-left px-4 py-2 font-semibold">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    <tr className="border-t border-border bg-card">
                      <td className="px-4 py-2.5 font-medium">Draft</td>
                      <td className="px-4 py-2.5 text-muted-foreground">No stock movement</td>
                      <td className="px-4 py-2.5 text-muted-foreground">{selectedEvent.currentOnHand} (unchanged)</td>
                    </tr>
                    <tr className="border-t border-border bg-background">
                      <td className="px-4 py-2.5 font-medium">Submitted</td>
                      <td className="px-4 py-2.5 text-muted-foreground">Pending review only</td>
                      <td className="px-4 py-2.5 text-muted-foreground">{selectedEvent.currentOnHand} (unchanged)</td>
                    </tr>
                    <tr className={`border-t border-border ${selectedEvent.status === 'APPROVED' ? 'bg-green-50' : 'bg-card'}`}>
                      <td className="px-4 py-2.5 font-medium text-green-700">Approved</td>
                      <td className="px-4 py-2.5 text-red-700 font-medium">–{selectedEvent.qty} deducted</td>
                      <td className="px-4 py-2.5 font-semibold text-foreground">{selectedEvent.currentOnHand - selectedEvent.qty}</td>
                    </tr>
                    <tr className={`border-t border-border ${selectedEvent.status === 'REVERSED' ? 'bg-blue-50/40' : 'bg-background'}`}>
                      <td className="px-4 py-2.5 font-medium text-slate-600">Reversed</td>
                      <td className="px-4 py-2.5 text-green-700 font-medium">+{selectedEvent.qty} offset movement</td>
                      <td className="px-4 py-2.5 font-semibold text-foreground">{selectedEvent.currentOnHand} (restored)</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </section>

            {/* Workflow timeline */}
            <section>
              <SectionHeading>Workflow Timeline</SectionHeading>
              <div className="space-y-0 border border-border rounded overflow-hidden">
                {[
                  { step: 'DRAFT',     label: 'Draft Created',    active: true,                                                                              time: selectedEvent.recordedAt,  note: 'No stock movement' },
                  { step: 'SUBMITTED', label: 'Submitted',        active: ['SUBMITTED','APPROVED','REJECTED','REVERSED'].includes(selectedEvent.status),    time: selectedEvent.recordedAt,  note: 'Pending review' },
                  { step: 'APPROVED',  label: 'Approved',         active: ['APPROVED','REVERSED'].includes(selectedEvent.status),                          time: selectedEvent.occurredAt,  note: 'Stock deduction posted' },
                  { step: 'REVERSED',  label: 'Reversed',         active: selectedEvent.status === 'REVERSED',                                             time: '—',                        note: 'Offset movement posted, stock restored' },
                  { step: 'REJECTED',  label: 'Rejected',         active: selectedEvent.status === 'REJECTED',                                             time: '—',                        note: 'No stock deduction' },
                ].map(({ label, active, time, note }, idx) => (
                  <div key={label} className={`flex items-center gap-4 px-4 py-2.5 text-xs ${idx > 0 ? 'border-t border-border' : ''} ${active ? 'bg-card' : 'bg-background'}`}>
                    <div className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${active ? 'bg-primary' : 'bg-border'}`} />
                    <span className={`w-28 font-medium flex-shrink-0 ${active ? 'text-foreground' : 'text-muted-foreground'}`}>{label}</span>
                    <span className="text-muted-foreground w-36 flex-shrink-0">{active ? time : '—'}</span>
                    <span className="text-muted-foreground">{note}</span>
                  </div>
                ))}
              </div>
            </section>
          </>
        )}
      </div>

      {/* ── Sticky footer ── */}
      <div className="fixed bottom-0 left-56 right-0 bg-card border-t border-border px-5 py-2.5 flex items-center gap-3 z-10">

        {/* Status feedback */}
        {actionStatus === 'draft_saved' && (
          <span className="text-xs text-green-700 font-medium flex items-center gap-1.5"><Save size={12} /> Draft saved</span>
        )}
        {actionStatus === 'submitted' && (
          <span className="text-xs text-amber-700 font-medium flex items-center gap-1.5"><Clock size={12} /> Submitted for approval</span>
        )}
        {actionStatus === 'approved' && (
          <span className="text-xs text-green-700 font-medium flex items-center gap-1.5"><CheckCircle2 size={12} /> Approved — stock deduction posted</span>
        )}
        {actionStatus === 'rejected' && (
          <span className="text-xs text-red-600 font-medium flex items-center gap-1.5"><X size={12} /> Rejected — no stock deduction</span>
        )}
        {actionStatus === 'reversed' && (
          <span className="text-xs text-slate-600 font-medium flex items-center gap-1.5"><Undo2 size={12} /> Reversed — stock restored via offset movement</span>
        )}

        {/* Inline reject reason input */}
        {rejectMode && (
          <InlineReasonInput
            label="Rejection reason"
            placeholder="Enter reason for rejection…"
            value={rejectReason}
            onChange={setRejectReason}
            onConfirm={handleReject}
            onCancel={() => { setRejectMode(false); setRejectReason(''); }}
          />
        )}

        {/* Inline reverse reason input */}
        {reverseMode && (
          <InlineReasonInput
            label="Reversal reason"
            placeholder="Enter reason for reversal…"
            value={reverseReason}
            onChange={setReverseReason}
            onConfirm={handleReverse}
            onCancel={() => { setReverseMode(false); setReverseReason(''); }}
          />
        )}

        {/* Action buttons */}
        {!rejectMode && !reverseMode && (
          <div className="ml-auto flex items-center gap-2">
            {mode === 'create' ? (
              <>
                <button onClick={() => navigate('/Wastage')}
                  className="flex items-center gap-1.5 h-9 px-4 text-sm rounded border border-border bg-card hover:bg-muted transition-colors text-foreground">
                  <X size={13} /> Cancel
                </button>
                <button onClick={() => handleCreateAction('DRAFT')}
                  className="flex items-center gap-1.5 h-9 px-4 text-sm rounded border border-border bg-card hover:bg-muted transition-colors text-foreground">
                  <Save size={13} /> Save Draft
                </button>
                <button onClick={() => handleCreateAction('SUBMITTED')}
                  className="flex items-center gap-1.5 h-9 px-5 text-sm rounded bg-primary text-primary-foreground hover:opacity-90 transition-opacity font-medium">
                  <CheckCircle2 size={13} /> Save &amp; Submit
                </button>
              </>
            ) : workspaceStatus === 'DRAFT' ? (
              <>
                <button onClick={() => navigate('/Wastage')}
                  className="flex items-center gap-1.5 h-9 px-4 text-sm rounded border border-border bg-card hover:bg-muted transition-colors text-foreground">
                  <ArrowLeft size={13} /> Back
                </button>
                <button onClick={() => handleDraftUpdate('DRAFT')}
                  className="flex items-center gap-1.5 h-9 px-4 text-sm rounded border border-border bg-card hover:bg-muted transition-colors text-foreground">
                  <Save size={13} /> Save Draft
                </button>
                <button onClick={() => handleDraftUpdate('SUBMITTED')}
                  className="flex items-center gap-1.5 h-9 px-5 text-sm rounded bg-primary text-primary-foreground hover:opacity-90 transition-opacity font-medium">
                  <CheckCircle2 size={13} /> Submit
                </button>
              </>
            ) : workspaceStatus === 'SUBMITTED' ? (
              <>
                <button onClick={() => navigate('/Wastage')}
                  className="flex items-center gap-1.5 h-9 px-4 text-sm rounded border border-border bg-card hover:bg-muted transition-colors text-foreground">
                  <ArrowLeft size={13} /> Back
                </button>
                <button onClick={() => setRejectMode(true)}
                  className="flex items-center gap-1.5 h-9 px-4 text-sm rounded border border-border bg-card hover:bg-muted transition-colors text-foreground">
                  <X size={13} /> Reject
                </button>
                <button onClick={handleApprove}
                  className="flex items-center gap-1.5 h-9 px-5 text-sm rounded bg-primary text-primary-foreground hover:opacity-90 transition-opacity font-medium">
                  <CheckCircle2 size={13} /> Approve
                </button>
              </>
            ) : workspaceStatus === 'APPROVED' ? (
              <>
                <button onClick={() => navigate('/Wastage')}
                  className="flex items-center gap-1.5 h-9 px-4 text-sm rounded border border-border bg-card hover:bg-muted transition-colors text-foreground">
                  <ArrowLeft size={13} /> Back
                </button>
                <button
                  onClick={() => setReverseMode(true)}
                  className="flex items-center gap-1.5 h-9 px-5 text-sm rounded border border-border bg-card hover:bg-muted transition-colors text-foreground">
                  <Undo2 size={13} /> Reverse
                </button>
              </>
            ) : (
              <button onClick={() => navigate('/Wastage')}
                className="flex items-center gap-1.5 h-9 px-4 text-sm rounded border border-border bg-card hover:bg-muted transition-colors text-foreground">
                <ArrowLeft size={13} /> Back to Wastage
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}