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
  getWorkflowSteps,
  reasonOptions,
  resolveScannedItem,
  saveDraftEvent,
  sourceOptions,
  statusStyle,
  updateEvent,
} from '../lib/wastageData.js';

function SummaryCard({ label, value, helper, tone = 'text-foreground' }) {
  return (
    <div className="border border-border rounded-2xl bg-card px-4 py-3 min-h-[94px] shadow-sm">
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
        {helper ? <p className="text-xs text-muted-foreground mt-1 normal-case tracking-normal leading-relaxed">{helper}</p> : null}
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
  return <span className={`inline-flex text-[11px] px-2.5 py-0.5 rounded-full font-medium ${policy.chipClass}`}>{policy.bucket}</span>;
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

function WorkflowStep({ done, label, helper }) {
  return (
    <div className="flex items-start gap-3">
      <div className={`mt-0.5 h-6 w-6 rounded-full flex items-center justify-center text-[11px] font-semibold ${done ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'}`}>
        {done ? '✓' : '•'}
      </div>
      <div className="min-w-0">
        <p className={`text-sm font-medium ${done ? 'text-foreground' : 'text-muted-foreground'}`}>{label}</p>
        <p className="text-xs text-muted-foreground mt-1 leading-relaxed">{helper}</p>
      </div>
    </div>
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
  if (status === 'DRAFT') return 'No stock movement yet';
  if (status === 'SUBMITTED') return 'Waiting for approval';
  if (status === 'APPROVED') return 'Stock deducted';
  if (status === 'REVERSED') return 'Stock restored';
  return 'No stock movement';
}

function getReviewActionText(status) {
  if (status === 'DRAFT') return 'Review the saved details, then submit the draft when ready.';
  if (status === 'SUBMITTED') return 'Choose approve or reject after checking the details and stock effect.';
  if (status === 'APPROVED') return 'Reverse only if this wastage event was posted in error.';
  if (status === 'REJECTED') return 'This event is stopped and stays read only in this build.';
  if (status === 'REVERSED') return 'This event has already been reversed and stays read only.';
  return 'Review the record and follow the current workflow state.';
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
  const [scanState, setScanState] = useState({ status: 'idle', helper: 'Scan an item code or type it here to fill the SKU field.' });

  const selectedEvent = useMemo(() => rows.find((row) => row.id === eventId) || getEventById(eventId), [eventId, rows]);
  const isFormMode = mode === 'create';
  const workspaceStatus = isFormMode ? 'CREATE' : selectedEvent?.status || 'UNKNOWN';
  const policy = getReasonPolicy(isFormMode ? formState.reason : selectedEvent?.reason);

  useEffect(() => {
    if (mode === 'create') {
      setFormState(buildFormStateFromEvent(null));
      setCaptureMode('MANUAL');
      setScanInput('');
      setScanState({ status: 'idle', helper: 'Scan an item code or type it here to fill the SKU field.' });
      return;
    }

    if (selectedEvent) {
      setFormState(buildFormStateFromEvent(selectedEvent));
      const nextMode = selectedEvent.source === 'SCANNER' ? 'SCANNER' : 'MANUAL';
      setCaptureMode(nextMode);
      setScanInput(selectedEvent.scanValue || '');
      setScanState({
        status: selectedEvent.scanValue ? 'resolved' : 'idle',
        helper: selectedEvent.scanValue ? 'Scanner resolution was saved with this record.' : 'Scan an item code or type it here to fill the SKU field.',
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
          if (captureMode === 'MANUAL') {
            next.scanResolution = 'Manual SKU entry';
          } else if (scanState.status === 'unresolved') {
            next.scanResolution = 'Manual SKU entered after unmatched scan';
          }
        } else if (field === 'sku') {
          next.itemName = '';
          next.currentOnHand = '—';
          next.activeAlert = false;
          if (captureMode === 'MANUAL') {
            next.scanResolution = '';
          }
        }
      }

      if (field === 'reason') {
        next.activeAlert = getReasonPolicy(value).bucket === 'Reorder affecting';
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
        scanResolution: 'No match yet — enter SKU manually',
      }));
      setScanState({ status: 'unresolved', helper: result.helper });
      return;
    }

    setScanState({ status: 'idle', helper: 'Scan an item code or type it here to fill the SKU field.' });
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
    setRows(getWastageRows());
    setFormState((prev) => ({ ...prev, id: savedId }));
    setActionStatus(nextStatus === 'DRAFT' ? 'draft_saved' : 'submitted');
    setTimeout(() => navigate(`/Wastage/workspace?event=${encodeURIComponent(savedId)}`), 350);
  };

  const handleSubmitDraft = () => {
    if (!selectedEvent) return;
    updateEvent(selectedEvent.id, { status: 'SUBMITTED' });
    setRows(getWastageRows());
    setActionStatus('submitted');
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
  const workflowSteps = !isFormMode ? getWorkflowSteps(liveEvent.status) : [];

  return (
    <>
      <div className="flex flex-col min-h-screen bg-background">
        <div className="flex-1 p-5 lg:p-6 pb-28 space-y-4">
          <button
            onClick={() => navigate('/Wastage')}
            className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            <ArrowLeft size={14} /> Back to Wastage
          </button>

          {isFormMode ? (
            <>
              <div className="space-y-1">
                <h1 className="text-lg font-semibold text-foreground">Record Wastage</h1>
                <p className="text-sm text-muted-foreground">Enter the details, save safely as a draft, then review before submission.</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <SummaryCard label="Step 1" value="Choose capture method" helper="Scan first or enter the SKU manually." />
                <SummaryCard label="Step 2" value="Check the item" helper="Confirm SKU, quantity, reason, and location." />
                <SummaryCard label="Step 3" value="Save safely" helper="Save Draft is the safest next step in this build." tone="text-green-700" />
              </div>

              <div className="grid grid-cols-1 xl:grid-cols-12 gap-4 items-start">
                <div className="xl:col-span-8 space-y-4">
                  <SectionCard label="Capture Method" helper="Pick the path that feels easiest. Both end with a valid SKU.">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      <ModeTab
                        active={captureMode === 'SCANNER'}
                        onClick={() => {
                          setCaptureMode('SCANNER');
                          handleFormChange('source', 'SCANNER');
                        }}
                        icon={ScanLine}
                        label="Handheld Scan"
                        helper="Use a scan first, then confirm the resolved SKU and event details."
                      />
                      <ModeTab
                        active={captureMode === 'MANUAL'}
                        onClick={() => {
                          setCaptureMode('MANUAL');
                          handleFormChange('source', 'ADMIN');
                        }}
                        icon={Save}
                        label="Manual Entry"
                        helper="Use this when scan input is unavailable or you already know the SKU."
                      />
                    </div>
                  </SectionCard>

                  {captureMode === 'SCANNER' ? (
                    <SectionCard label="Scanner Capture" helper="Scan the item, check the result, then continue with the event details.">
                      <div className="space-y-3">
                        <div className="grid grid-cols-1 md:grid-cols-[1fr_auto] gap-3 items-end">
                          <div>
                            <label className="text-xs font-medium text-muted-foreground block mb-1.5">Scan barcode or SKU</label>
                            <Input
                              value={scanInput}
                              onChange={(e) => setScanInput(e.target.value)}
                              placeholder="Scan with handheld device or type the code"
                              onKeyDown={(e) => {
                                if (e.key === 'Enter') {
                                  e.preventDefault();
                                  resolveScan();
                                }
                              }}
                            />
                          </div>
                          <button onClick={resolveScan} className="flex items-center justify-center gap-2 h-10 px-4 text-sm rounded-xl bg-primary text-primary-foreground hover:opacity-90 transition-opacity font-medium">
                            <ScanLine size={14} /> Resolve Scan
                          </button>
                        </div>

                        <div className={`rounded-2xl border px-4 py-3 ${scanState.status === 'resolved' ? 'border-green-200 bg-green-50/70' : scanState.status === 'unresolved' ? 'border-amber-200 bg-amber-50/70' : 'border-border bg-muted/10'}`}>
                          <p className={`text-sm font-medium ${scanState.status === 'resolved' ? 'text-green-800' : scanState.status === 'unresolved' ? 'text-amber-800' : 'text-foreground'}`}>
                            {scanState.status === 'resolved' ? 'Scan resolved' : scanState.status === 'unresolved' ? 'No match found yet' : 'Scanner ready'}
                          </p>
                          <p className="text-sm text-muted-foreground mt-1 leading-relaxed">{scanState.helper}</p>
                          {scanState.status === 'unresolved' ? (
                            <div className="mt-3 flex flex-wrap items-center gap-2">
                              <span className="text-sm text-muted-foreground">Enter the SKU manually to continue.</span>
                              <button
                                onClick={() => navigate('/Wastage?surface=BARCODES')}
                                className="inline-flex items-center gap-1.5 h-8 px-3 text-xs rounded-xl border border-border bg-card hover:bg-muted transition-colors text-foreground"
                              >
                                Open Barcode Guide
                              </button>
                            </div>
                          ) : null}
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
                          <div className="rounded-2xl border border-border bg-muted/10 px-4 py-3">
                            <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-[0.22em] mb-1">Resolved SKU</p>
                            <p className="font-medium text-foreground">{formState.sku || 'Waiting for a scan result'}</p>
                          </div>
                          <div className="rounded-2xl border border-border bg-muted/10 px-4 py-3">
                            <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-[0.22em] mb-1">Resolution Path</p>
                            <p className="font-medium text-foreground">{formState.scanResolution || 'No resolution captured yet'}</p>
                          </div>
                        </div>
                      </div>
                    </SectionCard>
                  ) : null}

                  <SectionCard label="Event Details" helper="Keep the fields in order and confirm the item before saving.">
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
                        <label className="text-xs font-medium text-muted-foreground block mb-1.5">SKU</label>
                        <Input value={formState.sku} onChange={(e) => handleFormChange('sku', e.target.value)} placeholder={captureMode === 'SCANNER' ? 'You can correct the resolved SKU here' : 'Enter SKU code'} />
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
                          <p className="text-sm text-muted-foreground">{captureMode === 'SCANNER' ? 'Resolve the scan or enter a valid SKU to preview the item.' : 'Enter a matching SKU to preview the item.'}</p>
                        )}
                      </div>

                      <div>
                        <label className="text-xs font-medium text-muted-foreground block mb-1.5">Qty</label>
                        <Input type="number" min={1} value={formState.qty} onChange={(e) => handleFormChange('qty', e.target.value)} />
                      </div>
                      <div>
                        <label className="text-xs font-medium text-muted-foreground block mb-1.5">Reason</label>
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
                        <Input value={formState.occurredAt} onChange={(e) => handleFormChange('occurredAt', e.target.value)} placeholder="30 Mar 2026, 20:45" />
                      </div>
                      <div>
                        <label className="text-xs font-medium text-muted-foreground block mb-1.5">Source</label>
                        <select
                          value={formState.source}
                          onChange={(e) => handleFormChange('source', e.target.value)}
                          className="h-10 w-full border border-border rounded-xl bg-card px-3 text-sm focus:outline-none focus:ring-1 focus:ring-ring"
                        >
                          {sourceOptions.map((source) => (
                            <option key={source}>{source}</option>
                          ))}
                        </select>
                      </div>
                      <div className="md:col-span-2">
                        <label className="text-xs font-medium text-muted-foreground block mb-1.5">Notes</label>
                        <Textarea rows={4} value={formState.notes} onChange={(e) => handleFormChange('notes', e.target.value)} placeholder="Add short operational notes if they help the reviewer." />
                      </div>
                    </div>
                  </SectionCard>
                </div>

                <div className="xl:col-span-4 space-y-4 xl:sticky xl:top-6">
                  <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-1 gap-3">
                    <SummaryCard label="Current On Hand" value={String(formState.currentOnHand)} helper="Quantity snapshot before approval." />
                    <SummaryCard label="Projected On Approval" value={String(projectedOnHand)} helper="This only posts after approval." tone={projectedOnHand === '—' ? 'text-muted-foreground' : 'text-foreground'} />
                    <SummaryCard label="Reason Fit" value={policy.bucket} helper={policy.reorderBehavior} tone={policy.impactTone} />
                  </div>

                  <SectionCard label="What to check before saving">
                    <div className="space-y-3 text-sm text-muted-foreground">
                      <p>Confirm the item preview matches the stock you are recording.</p>
                      <p>Check the quantity and reason before saving the event.</p>
                      <p>Use Save Draft first when you want the calmest, safest next step.</p>
                    </div>
                  </SectionCard>

                  <SectionCard label="Workflow reminders">
                    <div className="space-y-3 text-sm text-muted-foreground">
                      <p>Drafts do not post stock.</p>
                      <p>Submitted events wait for review.</p>
                      <p>Only approved events deduct stock.</p>
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

              <SectionCard label="Current state" helper={getReviewActionText(workspaceStatus)}>
                <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                  <div className="space-y-1">
                    <p className="text-sm font-medium text-foreground">{stockEffectText}</p>
                    <p className="text-sm text-muted-foreground">Use the action bar below for the next step available to this record.</p>
                  </div>
                  <div className="flex flex-wrap items-center gap-2">
                    {workspaceStatus === 'DRAFT' ? <span className="text-[11px] px-2.5 py-0.5 rounded-full font-medium bg-amber-50 text-amber-700 border border-amber-200">Next action: Submit Draft</span> : null}
                    {workspaceStatus === 'SUBMITTED' ? <span className="text-[11px] px-2.5 py-0.5 rounded-full font-medium bg-amber-50 text-amber-700 border border-amber-200">Next action: Approve or Reject</span> : null}
                    {workspaceStatus === 'APPROVED' ? <span className="text-[11px] px-2.5 py-0.5 rounded-full font-medium bg-blue-50 text-blue-700 border border-blue-200">Next action: Reverse if needed</span> : null}
                    {['REJECTED', 'REVERSED'].includes(workspaceStatus) ? <span className="text-[11px] px-2.5 py-0.5 rounded-full font-medium bg-slate-100 text-slate-700 border border-slate-200">Read only</span> : null}
                  </div>
                </div>
              </SectionCard>

              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-3">
                <SummaryCard label="Qty" value={String(liveEvent.qty)} helper="Units affected by this record" />
                <SummaryCard label="Stock Effect" value={stockEffectText} helper="Outcome for the current status" tone={liveEvent.status === 'APPROVED' ? 'text-green-700' : liveEvent.status === 'SUBMITTED' ? 'text-amber-700' : 'text-muted-foreground'} />
                <SummaryCard label="Current On Hand" value={String(liveEvent.currentOnHand)} helper="Inventory quantity at this location" />
                <SummaryCard label="Recorded By" value={liveEvent.recordedBy} helper={`Recorded ${liveEvent.recordedAt}`} />
              </div>

              <div className="grid grid-cols-1 xl:grid-cols-12 gap-4 items-start">
                <div className="xl:col-span-8 space-y-4">
                  <SectionCard label="Event Summary">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      <DetailRow label="Event ID" value={liveEvent.id} emphasis />
                      <DetailRow label="Status" value={liveEvent.status} />
                      <DetailRow label="Occurred At" value={liveEvent.occurredAt} muted />
                      <DetailRow label="Recorded At" value={liveEvent.recordedAt} muted />
                      <DetailRow label="Location" value={liveEvent.location} />
                      <DetailRow label="SKU" value={liveEvent.sku} muted />
                      <DetailRow label="Item Name" value={liveEvent.itemName} emphasis />
                      <DetailRow label="Qty" value={String(liveEvent.qty)} />
                      <DetailRow label="Reason" value={liveEvent.reason} />
                      <DetailRow label="Source" value={liveEvent.source} muted />
                      <DetailRow label="Capture Path" value={liveEvent.scanResolution || (liveEvent.source === 'SCANNER' ? 'Resolved to SKU before submit' : 'Manual or system-originated record')} muted />
                      <div className="md:col-span-2">
                        <DetailRow label="Notes" value={liveEvent.notes || 'No notes provided.'} muted={!liveEvent.notes} />
                      </div>
                    </div>
                  </SectionCard>

                  <SectionCard label="Workflow Progress" helper="This helps the current state feel easier to follow at a glance.">
                    <div className="space-y-4">
                      {workflowSteps.map((step) => (
                        <WorkflowStep
                          key={step.key}
                          done={step.done}
                          label={step.label}
                          helper={step.key === 'created'
                            ? 'The wastage event has been recorded.'
                            : step.key === 'submitted'
                              ? 'Submitted events are waiting for review.'
                              : step.key === 'approved'
                                ? 'Approved events post the stock deduction.'
                                : step.key === 'rejected'
                                  ? 'Rejected events do not affect stock.'
                                  : 'Reversed events restore the stock movement.'}
                        />
                      ))}
                    </div>
                  </SectionCard>
                </div>

                <div className="xl:col-span-4 space-y-4 xl:sticky xl:top-6">
                  <SectionCard label="Stock Impact">
                    <div className="grid grid-cols-1 gap-3">
                      <DetailRow label="Current On Hand" value={String(liveEvent.currentOnHand)} />
                      {liveEvent.status === 'DRAFT' ? (
                        <>
                          <DetailRow label="Posting State" value="Draft saved — no stock movement yet" muted />
                          <DetailRow label="Projected On Approval" value={String(liveEvent.currentOnHand - liveEvent.qty)} emphasis />
                        </>
                      ) : liveEvent.status === 'SUBMITTED' ? (
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
                        <p className="text-sm text-muted-foreground">No stock movement has been posted for this event.</p>
                      )}
                    </div>
                  </SectionCard>

                  <SectionCard label="Reason Guidance">
                    <div className="space-y-3">
                      <div className="flex flex-wrap items-center gap-2">
                        <PolicyChip reason={liveEvent.reason} />
                        {liveEvent.activeAlert ? <span className="text-[11px] px-2.5 py-0.5 rounded-full font-medium bg-red-50 text-red-700 border border-red-200">Active alert</span> : null}
                      </div>
                      <p className={`text-sm leading-relaxed ${policy.impactTone}`}>{policy.helper}</p>
                    </div>
                  </SectionCard>

                  <SectionCard label="Available Action">
                    <div className="space-y-3 text-sm text-muted-foreground">
                      <p>{getReviewActionText(workspaceStatus)}</p>
                      <p>Buttons only appear when that action is valid for the current state.</p>
                    </div>
                  </SectionCard>
                </div>
              </div>
            </>
          )}
        </div>

        <div className="fixed bottom-0 left-56 right-0 bg-card/95 backdrop-blur border-t border-border px-4 py-2.5 flex flex-wrap items-center gap-3 z-10 shadow-[0_-6px_18px_rgba(15,23,42,0.04)]">
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

          <div className="ml-auto flex flex-wrap items-center gap-2">
            <button
              onClick={() => navigate('/Wastage')}
              className="flex items-center gap-2 h-9 px-4 text-sm rounded-xl border border-border bg-card hover:bg-muted transition-colors text-foreground"
            >
              {isFormMode ? <X size={14} /> : <ArrowLeft size={14} />} {isFormMode ? 'Cancel' : 'Back to Wastage'}
            </button>

            {isFormMode ? (
              <>
                <button
                  onClick={() => persistForm('DRAFT')}
                  className="flex items-center gap-2 h-9 px-5 text-sm rounded-xl bg-primary text-primary-foreground hover:opacity-90 transition-opacity font-medium"
                >
                  <Save size={14} /> Save Draft
                </button>
                <button
                  disabled={!canSubmitForm}
                  onClick={() => persistForm('SUBMITTED')}
                  className={`flex items-center gap-2 h-9 px-4 text-sm rounded-xl border transition-colors ${
                    canSubmitForm ? 'border-amber-200 bg-amber-50 text-amber-800 hover:bg-amber-100' : 'border-border bg-muted text-muted-foreground cursor-not-allowed'
                  }`}
                >
                  <CheckCircle2 size={14} /> Save & Submit
                </button>
              </>
            ) : workspaceStatus === 'DRAFT' ? (
              <button
                onClick={handleSubmitDraft}
                className="flex items-center gap-2 h-9 px-5 text-sm rounded-xl bg-primary text-primary-foreground hover:opacity-90 transition-opacity font-medium"
              >
                <CheckCircle2 size={14} /> Submit Draft
              </button>
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
                className="flex items-center gap-2 h-9 px-5 text-sm rounded-xl border border-amber-200 bg-amber-50 text-amber-800 hover:bg-amber-100 transition-colors font-medium"
              >
                <Undo2 size={14} /> Reverse
              </button>
            ) : null}
          </div>
        </div>
      </div>

      <AlertDialog open={rejectOpen} onOpenChange={setRejectOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Reject Wastage Event</AlertDialogTitle>
            <AlertDialogDescription>
              Provide a short reason for rejecting this submitted wastage event.
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
