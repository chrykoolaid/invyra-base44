import { useEffect, useMemo, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { AlertTriangle, ArrowLeft, CheckCircle2, ScanLine, Save, Undo2, X } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import {
  appendEventNote,
  createSubmittedEvent,
  getEventById,
  getReasonPolicy,
  getWastageRows,
  reasonOptions,
  resolveScannedItem,
  saveDraftEvent,
  statusStyle,
  updateEvent,
} from '../lib/wastageData.js';

function SummaryCard({ label, value, helper, tone = 'text-foreground' }) {
  return (
    <div className="border border-border rounded-2xl bg-card px-4 py-3 min-h-[98px] shadow-sm">
      <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-[0.22em] mb-1">{label}</p>
      <p className={`text-lg font-semibold leading-tight ${tone}`}>{value}</p>
      {helper ? <p className="text-xs text-muted-foreground mt-2 leading-relaxed">{helper}</p> : null}
    </div>
  );
}

function SectionCard({ label, children, helper }) {
  return (
    <div className="border border-border rounded-2xl overflow-hidden bg-card shadow-sm">
      <div className="px-4 py-2.5 border-b border-border bg-muted/20">
        <span className="text-[10px] font-semibold text-muted-foreground uppercase tracking-[0.22em]">{label}</span>
        {helper ? <p className="text-xs text-muted-foreground mt-1 normal-case tracking-normal">{helper}</p> : null}
      </div>
      <div className="p-4">{children}</div>
    </div>
  );
}

function DetailRow({ label, value, muted = false, emphasis = false }) {
  return (
    <div>
      <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-[0.22em] mb-1">{label}</p>
      <p className={`text-sm leading-relaxed ${emphasis ? 'font-medium text-foreground' : muted ? 'text-muted-foreground' : 'text-foreground'}`}>{value}</p>
    </div>
  );
}

function PolicyChip({ reason }) {
  const policy = getReasonPolicy(reason);
  return <span className={`inline-flex text-[11px] px-2.5 py-0.5 rounded-full font-medium ${policy.chipClass}`}>{policy.effect}</span>;
}

function ModeTab({ active, onClick, icon: Icon, label, helper }) {
  return (
    <button
      onClick={onClick}
      className={`text-left border rounded-2xl px-4 py-3 transition-colors ${
        active ? 'border-primary bg-primary/5' : 'border-border bg-card hover:bg-muted/40'
      }`}
    >
      <div className="flex items-start gap-3">
        <div className={`h-9 w-9 rounded-xl flex items-center justify-center ${active ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'}`}>
          <Icon size={16} />
        </div>
        <div>
          <p className="text-sm font-medium text-foreground">{label}</p>
          <p className="text-xs text-muted-foreground mt-1 leading-relaxed">{helper}</p>
        </div>
      </div>
    </button>
  );
}

function buildFormStateFromEvent(event) {
  if (!event) {
    return {
      id: '',
      location: 'Main Store',
      sku: '',
      itemName: '',
      qty: 1,
      reason: 'Damage in Handling',
      occurredAt: '30 Mar 2026, 20:45',
      source: 'ADMIN',
      notes: '',
      currentOnHand: '—',
      recordedBy: 'Current User',
      activeAlert: false,
      scanValue: '',
      scanResolution: '',
    };
  }

  return {
    id: event.id,
    location: event.location,
    sku: event.sku,
    itemName: event.itemName,
    qty: event.qty,
    reason: event.reason,
    occurredAt: event.occurredAt,
    source: event.source,
    notes: event.notes,
    currentOnHand: event.currentOnHand,
    recordedBy: event.recordedBy,
    activeAlert: Boolean(event.activeAlert),
    scanValue: event.scanValue || '',
    scanResolution: event.scanResolution || '',
  };
}

function getStockEffectText(status) {
  if (status === 'SUBMITTED') return 'Pending approval';
  if (status === 'APPROVED') return 'Stock deducted';
  if (status === 'REVERSED') return 'Stock restored';
  return 'No stock movement';
}

export default function WastageWorkspace() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const mode = searchParams.get('mode');
  const eventId = searchParams.get('event');

  const [rows, setRows] = useState(() => getWastageRows());
  const [actionStatus, setActionStatus] = useState(null);
  const [rejectOpen, setRejectOpen] = useState(false);
  const [reverseOpen, setReverseOpen] = useState(false);
  const [rejectReason, setRejectReason] = useState('');
  const [reverseReason, setReverseReason] = useState('');
  const [formState, setFormState] = useState(() => buildFormStateFromEvent(null));
  const [captureMode, setCaptureMode] = useState('MANUAL');
  const [scanInput, setScanInput] = useState('');
  const [scanState, setScanState] = useState({ status: 'idle', helper: 'Scanner-ready capture resolves barcode or typed SKU into the engine-required SKU field before submit.' });

  const selectedEvent = useMemo(() => rows.find((row) => row.id === eventId) || getEventById(eventId), [eventId, rows]);
  const isDraftEvent = selectedEvent?.status === 'DRAFT';
  const isFormMode = mode === 'create' || isDraftEvent;
  const workspaceStatus = isFormMode ? (mode === 'create' ? 'CREATE' : 'DRAFT') : selectedEvent?.status || 'UNKNOWN';
  const policy = getReasonPolicy(isFormMode ? formState.reason : selectedEvent?.reason);

  useEffect(() => {
    if (mode === 'create') {
      setFormState(buildFormStateFromEvent(null));
      setCaptureMode('MANUAL');
      setScanInput('');
      setScanState({ status: 'idle', helper: 'Scanner-ready capture resolves barcode or typed SKU into the engine-required SKU field before submit.' });
      return;
    }

    if (selectedEvent && selectedEvent.status === 'DRAFT') {
      setFormState(buildFormStateFromEvent(selectedEvent));
      const nextMode = selectedEvent.source === 'SCANNER' ? 'SCANNER' : 'MANUAL';
      setCaptureMode(nextMode);
      setScanInput(selectedEvent.scanValue || '');
      setScanState({
        status: selectedEvent.scanValue ? 'resolved' : 'idle',
        helper: selectedEvent.scanValue ? `Draft retains ${selectedEvent.scanResolution || 'scanner'} item resolution.` : 'Scanner-ready capture resolves barcode or typed SKU into the engine-required SKU field before submit.',
      });
    }
  }, [mode, selectedEvent]);

  const projectedOnHand = useMemo(() => {
    const onHand = Number(formState.currentOnHand);
    const qty = Number(formState.qty || 0);
    if (Number.isNaN(onHand)) return '—';
    return onHand - qty;
  }, [formState.currentOnHand, formState.qty]);

  const canSubmitForm = Boolean(formState.sku && formState.itemName && Number(formState.qty) > 0);

  const handleFormChange = (field, value) => {
    setFormState((prev) => {
      const next = { ...prev, [field]: value };

      if (field === 'sku') {
        const match = rows.find((row) => row.sku.toLowerCase() === value.trim().toLowerCase());
        if (match) {
          next.itemName = match.itemName;
          next.currentOnHand = match.currentOnHand;
          next.location = match.location;
          next.activeAlert = Boolean(match.activeAlert);
          next.scanResolution = captureMode === 'SCANNER' ? next.scanResolution : 'Manual SKU entry';
        }
      }

      if (field === 'reason') {
        next.activeAlert = getReasonPolicy(value).effect === 'Reorder affecting';
      }

      if (field === 'source' && value !== 'SCANNER' && captureMode === 'SCANNER') {
        setCaptureMode('MANUAL');
      }

      return next;
    });
  };

  const resolveScan = () => {
    const result = resolveScannedItem(scanInput);
    if (result.status === 'resolved') {
      setFormState((prev) => ({
        ...prev,
        sku: result.sku,
        itemName: result.itemName,
        location: result.location,
        currentOnHand: result.currentOnHand,
        activeAlert: result.activeAlert,
        source: 'SCANNER',
        scanValue: result.scanValue,
        scanResolution: result.resolutionType === 'BARCODE' ? `Resolved from barcode ${result.scanValue}` : `Resolved from scanned SKU ${result.sku}`,
      }));
      setScanState({ status: 'resolved', helper: result.helper });
      return;
    }

    if (result.status === 'unresolved') {
      setFormState((prev) => ({
        ...prev,
        source: 'SCANNER',
        scanValue: result.scanValue,
        scanResolution: 'Unresolved scan — manual review required',
      }));
      setScanState({ status: 'unresolved', helper: result.helper });
      return;
    }

    setScanState({ status: 'idle', helper: 'Scan a barcode or SKU to resolve the item before submit.' });
  };

  const persistForm = (nextStatus) => {
    const payload = {
      id: formState.id || undefined,
      location: formState.location,
      sku: formState.sku.trim(),
      itemName: formState.itemName.trim(),
      qty: Number(formState.qty),
      reason: formState.reason,
      occurredAt: formState.occurredAt,
      source: formState.source,
      notes: formState.notes,
      currentOnHand: Number.isNaN(Number(formState.currentOnHand)) ? formState.currentOnHand : Number(formState.currentOnHand),
      recordedBy: formState.recordedBy || 'Current User',
      activeAlert: formState.activeAlert,
      scanValue: formState.scanValue,
      scanResolution: formState.scanResolution,
    };

    const savedId = nextStatus === 'DRAFT' ? saveDraftEvent(payload) : createSubmittedEvent(payload);
    const nextRows = getWastageRows();
    setRows(nextRows);
    setFormState((prev) => ({ ...prev, id: savedId }));
    setActionStatus(nextStatus === 'DRAFT' ? 'draft_saved' : 'submitted');
    setTimeout(() => navigate(`/Wastage/workspace?event=${encodeURIComponent(savedId)}`), 350);
  };

  const handleApprove = () => {
    if (!selectedEvent) return;
    updateEvent(selectedEvent.id, { status: 'APPROVED' });
    setRows(getWastageRows());
    setActionStatus('approved');
  };

  const handleReject = () => {
    if (!selectedEvent || !rejectReason.trim()) return;
    appendEventNote(selectedEvent.id, `Rejection reason: ${rejectReason.trim()}.`, 'REJECTED');
    setRows(getWastageRows());
    setRejectOpen(false);
    setRejectReason('');
    setActionStatus('rejected');
  };

  const handleReverse = () => {
    if (!selectedEvent || !reverseReason.trim()) return;
    appendEventNote(selectedEvent.id, `Reversal reason: ${reverseReason.trim()}.`, 'REVERSED');
    setRows(getWastageRows());
    setReverseOpen(false);
    setReverseReason('');
    setActionStatus('reversed');
  };

  if (mode !== 'create' && !selectedEvent) {
    return (
      <div className="p-6">
        <button
          onClick={() => navigate('/Wastage')}
          className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground mb-4"
        >
          <ArrowLeft size={14} /> Back to Wastage
        </button>
        <p className="text-sm text-muted-foreground">Wastage event not found.</p>
      </div>
    );
  }

  const liveEvent = selectedEvent ? getEventById(selectedEvent.id) || selectedEvent : null;
  const stockEffectText = getStockEffectText(liveEvent?.status);

  return (
    <>
      <div className="flex flex-col min-h-screen bg-background">
        <div className="flex-1 p-5 lg:p-6 pb-24 space-y-4">
          <button
            onClick={() => navigate('/Wastage')}
            className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            <ArrowLeft size={14} /> Back to Wastage
          </button>

          {isFormMode ? (
            <>
              <div className="space-y-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <h1 className="text-lg font-semibold text-foreground">{mode === 'create' ? 'Record Wastage' : `Draft ${selectedEvent.id}`}</h1>
                  {mode !== 'create' ? <span className={`text-[11px] px-2.5 py-0.5 rounded-full font-medium ${statusStyle.DRAFT}`}>DRAFT</span> : null}
                </div>
                <p className="text-sm text-muted-foreground">Capture stock loss details for review. Draft records stay non-posting until submitted and approved.</p>
              </div>

              <div className="border border-border rounded-2xl bg-card px-4 py-3 flex items-start gap-3 shadow-sm">
                <div className="h-9 w-9 rounded-xl bg-amber-50 border border-amber-200 text-amber-700 flex items-center justify-center flex-shrink-0">
                  <AlertTriangle size={16} />
                </div>
                <div>
                  <p className="text-sm font-medium text-foreground">Engine constraint — scanner-ready, not barcode-native</p>
                  <p className="text-sm text-muted-foreground leading-relaxed">The waste engine already supports a <span className="font-medium text-foreground">SCANNER</span> source, but it still posts by SKU. Barcode scans must resolve to a valid SKU before the event is submitted.</p>
                </div>
              </div>

              <div className="grid grid-cols-1 xl:grid-cols-12 gap-4 items-start">
                <div className="xl:col-span-8 space-y-4">
                  <SectionCard label="Capture Mode" helper="Design the UI around handheld scanner use, but keep manual fallback because the engine currently stores SKU rather than barcode.">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      <ModeTab active={captureMode === 'SCANNER'} onClick={() => { setCaptureMode('SCANNER'); handleFormChange('source', 'SCANNER'); }} icon={ScanLine} label="Handheld Scan" helper="Best for keyboard-wedge scanners. Scan first, review resolution, then confirm quantity and reason." />
                      <ModeTab active={captureMode === 'MANUAL'} onClick={() => { setCaptureMode('MANUAL'); handleFormChange('source', 'ADMIN'); }} icon={Save} label="Manual Entry" helper="Use when barcodes are missing, damaged, or unresolved. Direct SKU entry remains available." />
                    </div>
                  </SectionCard>

                  {captureMode === 'SCANNER' ? (
                    <SectionCard label="Scanner Capture" helper="Recommended flow: scan barcode → resolve to SKU → confirm quantity → submit for approval.">
                      <div className="space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-[1fr_auto] gap-3 items-end">
                          <div>
                            <label className="text-xs font-medium text-muted-foreground block mb-1.5">Scan barcode or SKU</label>
                            <Input value={scanInput} onChange={(e) => setScanInput(e.target.value)} placeholder="Scan with handheld device or type code" onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); resolveScan(); } }} />
                          </div>
                          <button onClick={resolveScan} className="flex items-center justify-center gap-2 h-10 px-4 text-sm rounded-xl bg-primary text-primary-foreground hover:opacity-90 transition-opacity font-medium">
                            <ScanLine size={14} /> Resolve Scan
                          </button>
                        </div>

                        <div className={`rounded-2xl border px-4 py-3 ${scanState.status === 'resolved' ? 'border-green-200 bg-green-50/70' : scanState.status === 'unresolved' ? 'border-red-200 bg-red-50/70' : 'border-border bg-muted/10'}`}>
                          <p className={`text-sm font-medium ${scanState.status === 'resolved' ? 'text-green-800' : scanState.status === 'unresolved' ? 'text-red-700' : 'text-foreground'}`}>
                            {scanState.status === 'resolved' ? 'Scan resolved' : scanState.status === 'unresolved' ? 'Manual review required' : 'Scanner input pending'}
                          </p>
                          <p className="text-sm text-muted-foreground mt-1 leading-relaxed">{scanState.helper}</p>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
                          <div className="rounded-2xl border border-border bg-muted/10 px-4 py-3">
                            <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-[0.22em] mb-1">Resolved SKU</p>
                            <p className="font-medium text-foreground">{formState.sku || 'Awaiting scan resolution'}</p>
                          </div>
                          <div className="rounded-2xl border border-border bg-muted/10 px-4 py-3">
                            <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-[0.22em] mb-1">Resolution Path</p>
                            <p className="font-medium text-foreground">{formState.scanResolution || 'No resolution captured yet'}</p>
                          </div>
                        </div>
                      </div>
                    </SectionCard>
                  ) : null}

                  <SectionCard label="Event Entry" helper="Manual correction remains available even in scanner mode because the engine validates against SKU, not raw barcode.">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      <div>
                        <label className="text-xs font-medium text-muted-foreground block mb-1.5">Location</label>
                        <select
                          value={formState.location}
                          onChange={(e) => handleFormChange('location', e.target.value)}
                          className="h-10 w-full border border-border rounded-xl bg-card px-3 text-sm focus:outline-none focus:ring-1 focus:ring-ring"
                        >
                          <option>Main Store</option>
                          <option>Branch A</option>
                          <option>Branch B</option>
                        </select>
                      </div>
                      <div>
                        <label className="text-xs font-medium text-muted-foreground block mb-1.5">SKU Search</label>
                        <Input value={formState.sku} onChange={(e) => handleFormChange('sku', e.target.value)} placeholder={captureMode === 'SCANNER' ? 'Resolved SKU can still be corrected here' : 'Enter SKU code'} />
                      </div>

                      <div className="md:col-span-2 border border-border rounded-2xl bg-muted/10 px-4 py-3 space-y-2">
                        <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-[0.22em]">Item Preview</p>
                        {formState.itemName ? (
                          <>
                            <div className="flex flex-wrap items-center gap-2">
                              <div className="text-sm font-medium text-foreground">{formState.itemName}</div>
                              <PolicyChip reason={formState.reason} />
                              {formState.source === 'SCANNER' ? <span className="text-[11px] px-2.5 py-0.5 rounded-full font-medium bg-blue-50 text-blue-700 border border-blue-200">Scanner capture</span> : null}
                            </div>
                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-[11px] text-muted-foreground">
                              <span>SKU: <span className="font-medium text-foreground">{formState.sku}</span></span>
                              <span>Location: <span className="font-medium text-foreground">{formState.location}</span></span>
                              <span>On Hand: <span className="font-medium text-foreground">{formState.currentOnHand}</span></span>
                            </div>
                          </>
                        ) : (
                          <p className="text-sm text-muted-foreground">{captureMode === 'SCANNER' ? 'Resolve a scan or enter a valid SKU to preview the item.' : 'Type a matching SKU to preview the item.'}</p>
                        )}
                      </div>

                      <div>
                        <label className="text-xs font-medium text-muted-foreground block mb-1.5">Qty</label>
                        <Input type="number" min={1} value={formState.qty} onChange={(e) => handleFormChange('qty', e.target.value)} />
                      </div>
                      <div>
                        <label className="text-xs font-medium text-muted-foreground block mb-1.5">Reason Code</label>
                        <select
                          value={formState.reason}
                          onChange={(e) => handleFormChange('reason', e.target.value)}
                          className="h-10 w-full border border-border rounded-xl bg-card px-3 text-sm focus:outline-none focus:ring-1 focus:ring-ring"
                        >
                          {reasonOptions.map((reason) => (
                            <option key={reason}>{reason}</option>
                          ))}
                        </select>
                      </div>
                      <div>
                        <label className="text-xs font-medium text-muted-foreground block mb-1.5">Occurred At</label>
                        <Input value={formState.occurredAt} onChange={(e) => handleFormChange('occurredAt', e.target.value)} />
                      </div>
                      <div>
                        <label className="text-xs font-medium text-muted-foreground block mb-1.5">Source</label>
                        <Input value={formState.source} onChange={(e) => handleFormChange('source', e.target.value)} />
                      </div>
                      <div className="md:col-span-2">
                        <label className="text-xs font-medium text-muted-foreground block mb-1.5">Notes</label>
                        <Textarea rows={4} value={formState.notes} onChange={(e) => handleFormChange('notes', e.target.value)} placeholder="Operational notes, review context, or approval handoff detail..." />
                      </div>
                    </div>
                  </SectionCard>
                </div>

                <div className="xl:col-span-4 space-y-4 xl:sticky xl:top-6">
                  <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-1 gap-3">
                    <SummaryCard label="Location" value={formState.location || 'Select location'} helper="Record against the correct inventory location." />
                    <SummaryCard label="Current On Hand" value={String(formState.currentOnHand)} helper="Live quantity snapshot before approval." />
                    <SummaryCard label="Projected On Approval" value={String(projectedOnHand)} helper="Only posts after approval." tone={projectedOnHand === '—' ? 'text-muted-foreground' : 'text-foreground'} />
                  </div>

                  <SectionCard label="Scanner Workflow Fit">
                    <div className="space-y-3 text-sm text-muted-foreground">
                      <p>Handheld scanners are viable when they behave like keyboard input.</p>
                      <p>The UI must always resolve the scan into a valid SKU before submit.</p>
                      <p>Unknown or damaged labels should fall back to manual SKU correction without blocking the rest of the form.</p>
                    </div>
                  </SectionCard>

                  <SectionCard label="Inventory Intelligence">
                    <div className="space-y-3">
                      <div className="flex flex-wrap items-center gap-2">
                        <PolicyChip reason={formState.reason} />
                        {formState.activeAlert ? <span className="text-[11px] px-2.5 py-0.5 rounded-full font-medium bg-red-50 text-red-700 border border-red-200">Alert candidate</span> : null}
                      </div>
                      <p className={`text-sm leading-relaxed ${policy.impactTone}`}>{policy.helper}</p>
                    </div>
                  </SectionCard>

                  <SectionCard label="Submission Rules">
                    <div className="space-y-3 text-sm text-muted-foreground">
                      <p>Drafts can be saved without approval.</p>
                      <p>Submitted events wait in the review queue.</p>
                      <p>Approved events are the only records that adjust stock.</p>
                    </div>
                  </SectionCard>
                </div>
              </div>
            </>
          ) : (
            <>
              <div className="space-y-1">
                <div className="flex items-baseline gap-3 flex-wrap">
                  <h1 className="text-lg font-semibold text-foreground">Event {liveEvent.id}</h1>
                  <span className={`text-[11px] px-2.5 py-0.5 rounded-full font-medium ${statusStyle[liveEvent.status]}`}>
                    {liveEvent.status}
                  </span>
                  <PolicyChip reason={liveEvent.reason} />
                </div>
                <p className="text-sm text-muted-foreground">{liveEvent.location}</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-3">
                <SummaryCard label="Qty" value={String(liveEvent.qty)} helper="Units affected by this record" />
                <SummaryCard label="Stock Effect" value={stockEffectText} helper="Posting outcome for the current workflow state" tone={liveEvent.status === 'APPROVED' ? 'text-green-700' : liveEvent.status === 'SUBMITTED' ? 'text-amber-700' : 'text-muted-foreground'} />
                <SummaryCard label="Current On Hand" value={String(liveEvent.currentOnHand)} helper="Inventory quantity at the selected location" />
                <SummaryCard label="Recorded By" value={liveEvent.recordedBy} helper={`Recorded ${liveEvent.recordedAt}`} />
              </div>

              <div className="grid grid-cols-1 xl:grid-cols-12 gap-4 items-start">
                <div className="xl:col-span-8 space-y-4">
                  <SectionCard label="Event Details">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      <DetailRow label="Event ID" value={liveEvent.id} emphasis />
                      <DetailRow label="Status" value={liveEvent.status} />
                      <DetailRow label="Occurred At" value={liveEvent.occurredAt} muted />
                      <DetailRow label="Recorded At" value={liveEvent.recordedAt} muted />
                      <DetailRow label="Location" value={liveEvent.location} />
                      <DetailRow label="SKU" value={liveEvent.sku} muted />
                      <DetailRow label="Item Name" value={liveEvent.itemName} emphasis />
                      <DetailRow label="Qty" value={String(liveEvent.qty)} />
                      <DetailRow label="Reason Code" value={liveEvent.reason} />
                      <DetailRow label="Source" value={liveEvent.source} muted />
                      <DetailRow label="Capture Path" value={liveEvent.scanResolution || (liveEvent.source === 'SCANNER' ? 'Resolved to SKU before submit' : 'Manual or system-originated record')} muted />
                      <div className="md:col-span-2">
                        <DetailRow label="Notes" value={liveEvent.notes || 'No notes provided.'} muted={!liveEvent.notes} />
                      </div>
                    </div>
                  </SectionCard>

                  <SectionCard label="Workflow Timeline">
                    <div className="space-y-2.5 text-sm">
                      <div className="flex items-center justify-between gap-3">
                        <span className="font-medium text-foreground">Created</span>
                        <span className="text-muted-foreground">{liveEvent.recordedAt}</span>
                      </div>
                      <div className="flex items-center justify-between gap-3">
                        <span className={`font-medium ${['SUBMITTED', 'APPROVED', 'REJECTED', 'REVERSED'].includes(liveEvent.status) ? 'text-foreground' : 'text-muted-foreground'}`}>Submitted</span>
                        <span className="text-muted-foreground">{['SUBMITTED', 'APPROVED', 'REJECTED', 'REVERSED'].includes(liveEvent.status) ? liveEvent.recordedAt : 'Pending'}</span>
                      </div>
                      <div className="flex items-center justify-between gap-3">
                        <span className={`font-medium ${liveEvent.status === 'APPROVED' ? 'text-green-700' : 'text-muted-foreground'}`}>Approved</span>
                        <span className="text-muted-foreground">{liveEvent.status === 'APPROVED' ? 'Posted to stock movement' : 'Not approved'}</span>
                      </div>
                      <div className="flex items-center justify-between gap-3">
                        <span className={`font-medium ${liveEvent.status === 'REJECTED' ? 'text-red-700' : 'text-muted-foreground'}`}>Rejected</span>
                        <span className="text-muted-foreground">{liveEvent.status === 'REJECTED' ? 'Rejected with reason logged' : 'Not rejected'}</span>
                      </div>
                      <div className="flex items-center justify-between gap-3">
                        <span className={`font-medium ${liveEvent.status === 'REVERSED' ? 'text-slate-700' : 'text-muted-foreground'}`}>Reversed</span>
                        <span className="text-muted-foreground">{liveEvent.status === 'REVERSED' ? 'Opposite movement posted' : 'Not reversed'}</span>
                      </div>
                    </div>
                  </SectionCard>
                </div>

                <div className="xl:col-span-4 space-y-4 xl:sticky xl:top-6">
                  <SectionCard label="Inventory Intelligence">
                    <div className="space-y-3">
                      <div className="flex flex-wrap items-center gap-2">
                        <PolicyChip reason={liveEvent.reason} />
                        {liveEvent.activeAlert ? <span className="text-[11px] px-2.5 py-0.5 rounded-full font-medium bg-red-50 text-red-700 border border-red-200">Active alert</span> : null}
                      </div>
                      <p className={`text-sm leading-relaxed ${policy.impactTone}`}>{policy.helper}</p>
                    </div>
                  </SectionCard>

                  <SectionCard label="Stock Impact">
                    <div className="grid grid-cols-1 gap-3">
                      <DetailRow label="Current On Hand" value={String(liveEvent.currentOnHand)} />
                      {liveEvent.status === 'SUBMITTED' ? (
                        <>
                          <DetailRow label="Adjustment on Approval" value={`-${liveEvent.qty}`} muted />
                          <DetailRow label="Projected On Hand" value={String(liveEvent.currentOnHand - liveEvent.qty)} emphasis />
                        </>
                      ) : liveEvent.status === 'APPROVED' ? (
                        <>
                          <DetailRow label="Stock Deducted" value={`-${liveEvent.qty}`} muted />
                          <DetailRow label="Resulting On Hand" value={String(liveEvent.currentOnHand - liveEvent.qty)} emphasis />
                        </>
                      ) : liveEvent.status === 'REVERSED' ? (
                        <>
                          <DetailRow label="Restored Qty" value={`+${liveEvent.qty}`} muted />
                          <DetailRow label="Restored On Hand" value={String(liveEvent.currentOnHand)} emphasis />
                        </>
                      ) : (
                        <p className="text-sm text-muted-foreground">This event has not adjusted stock yet.</p>
                      )}
                    </div>
                  </SectionCard>
                </div>
              </div>
            </>
          )}
        </div>

        <div className="fixed bottom-0 left-56 right-0 bg-card/95 backdrop-blur border-t border-border px-4 py-2.5 flex items-center gap-3 z-10 shadow-[0_-6px_18px_rgba(15,23,42,0.04)]">
          {actionStatus === 'draft_saved' && (
            <span className="text-xs text-green-700 font-medium flex items-center gap-1.5">
              <Save size={13} /> Draft saved
            </span>
          )}
          {actionStatus === 'submitted' && (
            <span className="text-xs text-amber-700 font-medium flex items-center gap-1.5">
              <AlertTriangle size={13} /> Event submitted for approval
            </span>
          )}
          {actionStatus === 'approved' && (
            <span className="text-xs text-green-700 font-medium flex items-center gap-1.5">
              <CheckCircle2 size={13} /> Wastage approved — stock adjustment posted
            </span>
          )}
          {actionStatus === 'rejected' && (
            <span className="text-xs text-red-700 font-medium flex items-center gap-1.5">
              <X size={13} /> Wastage rejected
            </span>
          )}
          {actionStatus === 'reversed' && (
            <span className="text-xs text-slate-700 font-medium flex items-center gap-1.5">
              <Undo2 size={13} /> Wastage reversed
            </span>
          )}

          <div className="ml-auto flex items-center gap-2">
            {isFormMode ? (
              <>
                <button
                  onClick={() => navigate('/Wastage')}
                  className="flex items-center gap-2 h-9 px-4 text-sm rounded-xl border border-border bg-card hover:bg-muted transition-colors text-foreground"
                >
                  <X size={14} /> Cancel
                </button>
                <button
                  onClick={() => persistForm('DRAFT')}
                  className="flex items-center gap-2 h-9 px-4 text-sm rounded-xl border border-border bg-card hover:bg-muted transition-colors text-foreground"
                >
                  <Save size={14} /> Save Draft
                </button>
                <button
                  disabled={!canSubmitForm}
                  onClick={() => persistForm('SUBMITTED')}
                  className={`flex items-center gap-2 h-9 px-5 text-sm rounded-xl font-medium transition-opacity ${
                    canSubmitForm ? 'bg-primary text-primary-foreground hover:opacity-90' : 'bg-muted text-muted-foreground cursor-not-allowed'
                  }`}
                >
                  <CheckCircle2 size={14} /> {mode === 'create' ? 'Save & Submit' : 'Submit'}
                </button>
              </>
            ) : workspaceStatus === 'SUBMITTED' ? (
              <>
                <button
                  onClick={() => setRejectOpen(true)}
                  className="flex items-center gap-2 h-9 px-4 text-sm rounded-xl border border-border bg-card hover:bg-muted transition-colors text-foreground"
                >
                  <X size={14} /> Reject
                </button>
                <button
                  onClick={handleApprove}
                  className="flex items-center gap-2 h-9 px-5 text-sm rounded-xl bg-primary text-primary-foreground hover:opacity-90 transition-opacity font-medium"
                >
                  <CheckCircle2 size={14} /> Approve
                </button>
              </>
            ) : workspaceStatus === 'APPROVED' ? (
              <button
                onClick={() => setReverseOpen(true)}
                className="flex items-center gap-2 h-9 px-5 text-sm rounded-xl bg-primary text-primary-foreground hover:opacity-90 transition-opacity font-medium"
              >
                <Undo2 size={14} /> Reverse
              </button>
            ) : (
              <button
                onClick={() => navigate('/Wastage')}
                className="flex items-center gap-2 h-9 px-4 text-sm rounded-xl border border-border bg-card hover:bg-muted transition-colors text-foreground"
              >
                <ArrowLeft size={14} /> Back to Wastage
              </button>
            )}
          </div>
        </div>
      </div>

      <AlertDialog open={rejectOpen} onOpenChange={setRejectOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Reject Wastage Event</AlertDialogTitle>
            <AlertDialogDescription>
              Provide a reason for rejecting this submitted wastage event.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <Textarea value={rejectReason} onChange={(e) => setRejectReason(e.target.value)} placeholder="Rejection reason" rows={3} />
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setRejectReason('')}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={(e) => {
                e.preventDefault();
                handleReject();
              }}
            >
              Confirm Rejection
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={reverseOpen} onOpenChange={setReverseOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Reverse Approved Wastage</AlertDialogTitle>
            <AlertDialogDescription>
              Reversing this event will restore on-hand quantity through an opposite stock movement.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <Textarea value={reverseReason} onChange={(e) => setReverseReason(e.target.value)} placeholder="Reversal reason" rows={3} />
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setReverseReason('')}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={(e) => {
                e.preventDefault();
                handleReverse();
              }}
            >
              Confirm Reversal
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
