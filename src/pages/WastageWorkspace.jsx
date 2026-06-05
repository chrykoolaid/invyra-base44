import { useEffect, useMemo, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
import {
  AlertTriangle,
  ArrowLeft,
  ArrowRight,
  CheckCircle2,
  Clock3,
  ScanLine,
  Save,
  ShieldCheck,
  Undo2,
  X,
} from 'lucide-react';
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
  approveEvent,
  createSubmittedEvent,
  getActionGuards,
  getEventById,
  getEventReadinessRows,
  getReasonPolicy,
  getSourcePosture,
  getWorkflowSteps,
  reasonOptions,
  rejectEvent,
  resolveScannedItem,
  reverseEvent,
  saveDraftEvent,
  sourceOptions,
  statusStyle,
  submitEvent,
  getWastageRows,
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

function SectionCard({ label, children, helper, action }) {
  return (
    <div className="border border-border rounded-2xl overflow-hidden bg-card shadow-sm">
      <div className="px-4 py-2.5 border-b border-border bg-muted/20 flex items-start gap-3">
        <div className="min-w-0">
          <span className="text-[10px] font-semibold text-muted-foreground uppercase tracking-[0.22em]">{label}</span>
          {helper ? <p className="text-xs text-muted-foreground mt-1 normal-case tracking-normal leading-relaxed">{helper}</p> : null}
        </div>
        {action ? <div className="ml-auto">{action}</div> : null}
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

function TimelineRow({ item }) {
  return (
    <div className="flex items-start gap-3">
      <div className="mt-1 h-2.5 w-2.5 rounded-full bg-primary/70" />
      <div className="min-w-0">
        <div className="flex flex-wrap items-center gap-2">
          <p className="text-sm font-medium text-foreground">{item.action.replaceAll('_', ' ')}</p>
          <span className="text-[11px] text-muted-foreground">{item.ts}</span>
        </div>
        <p className="text-xs text-muted-foreground mt-1">{item.actor || 'System'}</p>
        {item.details ? <p className="text-sm text-muted-foreground mt-2 leading-relaxed">{item.details}</p> : null}
      </div>
    </div>
  );
}

function MovementRow({ row }) {
  return (
    <tr className="border-t border-border">
      <td className="px-4 py-3 align-top whitespace-nowrap text-foreground">{row.ts}</td>
      <td className="px-4 py-3 align-top whitespace-nowrap">
        <span className={`inline-flex text-[11px] px-2.5 py-0.5 rounded-full font-medium ${row.refType === 'WASTAGE' ? 'bg-green-50 text-green-700 border border-green-200' : 'bg-slate-100 text-slate-700 border border-slate-200'}`}>
          {row.refType}
        </span>
      </td>
      <td className="px-4 py-3 align-top whitespace-nowrap font-medium text-foreground">{row.delta > 0 ? `+${row.delta}` : row.delta}</td>
      <td className="px-4 py-3 align-top whitespace-nowrap text-foreground">{row.postOnHand}</td>
      <td className="px-4 py-3 align-top whitespace-nowrap text-muted-foreground">{row.reasonCode}</td>
      <td className="px-4 py-3 align-top whitespace-nowrap text-muted-foreground">{row.refId}</td>
      <td className="px-4 py-3 align-top whitespace-nowrap text-muted-foreground">{row.actor || 'System'}</td>
      <td className="px-4 py-3 align-top min-w-[240px] text-muted-foreground">{row.note || '—'}</td>
    </tr>
  );
}

function AlertInstanceCard({ instance }) {
  return (
    <div className="border border-border rounded-2xl px-4 py-3 bg-background/40">
      <div className="flex flex-wrap items-center gap-2">
        <span className={`inline-flex text-[11px] px-2.5 py-0.5 rounded-full font-medium ${instance.severityClass || (instance.severity === 'HIGH' ? 'bg-red-50 text-red-700 border border-red-200' : 'bg-amber-50 text-amber-700 border border-amber-200')}`}>
          {instance.severity}
        </span>
        <span className={`inline-flex text-[11px] px-2.5 py-0.5 rounded-full font-medium ${instance.stateClass || 'bg-slate-100 text-slate-700 border border-slate-200'}`}>
          {instance.stateLabel || (instance.isAcknowledged ? 'Acknowledged' : 'Action needed')}
        </span>
        <span className="text-sm font-medium text-foreground">{instance.ruleName || instance.ruleId}</span>
        <span className="text-[11px] text-muted-foreground">{instance.window}</span>
      </div>
      <p className="text-sm text-muted-foreground mt-2 leading-relaxed">{instance.message}</p>
      <p className="text-[11px] text-muted-foreground mt-2">{instance.scope}</p>
      <p className="text-[11px] text-muted-foreground mt-1">{instance.acknowledgementLabel || 'Acknowledgement write pending'}</p>
    </div>
  );
}

function ReadinessLine({ item }) {
  const stateClass = item.state === 'live'
    ? 'bg-green-50 text-green-700 border border-green-200'
    : item.state === 'stored'
      ? 'bg-blue-50 text-blue-700 border border-blue-200'
      : 'bg-slate-100 text-slate-700 border border-slate-200';

  const stateLabel = item.state === 'live' ? 'Live now' : item.state === 'stored' ? 'Stored in engine' : 'Future-ready';

  return (
    <div className="border border-border rounded-2xl px-4 py-3 bg-background/40">
      <div className="flex flex-wrap items-center gap-2">
        <span className={`inline-flex text-[11px] px-2.5 py-0.5 rounded-full font-medium ${stateClass}`}>{stateLabel}</span>
        <span className="text-sm font-medium text-foreground">{item.label}</span>
      </div>
      <p className="text-sm text-muted-foreground mt-2 leading-relaxed">{item.helper}</p>
    </div>
  );
}

function GuardLine({ item }) {
  return (
    <div className="border border-border rounded-2xl px-4 py-3 bg-background/40">
      <div className="flex flex-wrap items-center gap-2">
        <span className={`inline-flex text-[11px] px-2.5 py-0.5 rounded-full font-medium ${item.allowed ? 'bg-green-50 text-green-700 border border-green-200' : 'bg-slate-100 text-slate-700 border border-slate-200'}`}>{item.allowed ? 'Allowed now' : 'Blocked now'}</span>
        <span className="text-sm font-medium text-foreground">{item.action}</span>
      </div>
      <p className="text-sm text-muted-foreground mt-2 leading-relaxed">{item.helper}</p>
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
      occurredAt: '31 Mar 2026, 21:00',
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
    notes: event.notes || '',
    currentOnHand: event.currentOnHand,
    recordedBy: event.recordedBy,
    activeAlert: Boolean(event.activeAlert),
    scanValue: event.scanValue || '',
    scanResolution: event.scanResolution || '',
  };
}

function getStockEffectText(status) {
  if (status === 'DRAFT') return 'No stock impact yet';
  if (status === 'SUBMITTED') return 'Waiting for approval posting';
  if (status === 'APPROVED') return 'Stock deducted';
  if (status === 'REVERSED') return 'Stock restored';
  return 'No stock movement posted';
}

function getReviewActionText(status) {
  if (status === 'DRAFT') return 'Review the saved details, then submit the draft when ready.';
  if (status === 'SUBMITTED') return 'Review the record, then approve or reject it.';
  if (status === 'APPROVED') return 'Review the posted movement proof. Reverse only if the posted event should be undone.';
  if (status === 'REJECTED') return 'The workflow stopped before stock posting. Keep this record for review history.';
  if (status === 'REVERSED') return 'The original approved movement was undone. Keep this record as historical proof.';
  return 'Review the record and follow the current workflow state.';
}

export default function WastageWorkspace() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const eventId = searchParams.get('event');
  const prefillSku = searchParams.get('sku') || '';
  const mode = eventId ? 'review' : 'create';
  const selectedEvent = useMemo(() => (eventId ? getEventById(eventId) : null), [eventId]);
  const [rows, setRows] = useState(() => getWastageRows());
  const [formState, setFormState] = useState(() => {
    const base = buildFormStateFromEvent(selectedEvent);
    if (!eventId && prefillSku) {
      const match = getWastageRows().find(r => r.sku.toLowerCase() === prefillSku.toLowerCase());
      return {
        ...base,
        sku: prefillSku,
        itemName: match?.itemName || '',
        currentOnHand: match?.currentOnHand ?? '—',
        location: match?.location || base.location,
      };
    }
    return base;
  });
  const [captureMode, setCaptureMode] = useState(selectedEvent?.source === 'SCANNER' ? 'SCANNER' : 'MANUAL');
  const [scanInput, setScanInput] = useState(selectedEvent?.scanValue || '');
  const [scanState, setScanState] = useState({ status: 'idle', helper: 'Scan an item code or type it here to fill the SKU field.' });
  const [actionStatus, setActionStatus] = useState('');
  const [rejectOpen, setRejectOpen] = useState(false);
  const [reverseOpen, setReverseOpen] = useState(false);
  const [rejectReason, setRejectReason] = useState('');
  const [reverseReason, setReverseReason] = useState('');

  const liveEvent = mode === 'review' && eventId ? getEventById(eventId) || selectedEvent : null;
  const workspaceStatus = liveEvent?.status || 'UNKNOWN';
  const policy = getReasonPolicy(mode === 'create' ? formState.reason : liveEvent?.reason);
  const sourcePosture = mode === 'create' ? getSourcePosture(formState.source) : getSourcePosture(liveEvent?.source);
  const actionGuards = useMemo(() => getActionGuards(workspaceStatus), [workspaceStatus]);
  const readinessRows = useMemo(() => getEventReadinessRows(liveEvent), [liveEvent]);

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
      setCaptureMode(selectedEvent.source === 'SCANNER' ? 'SCANNER' : 'MANUAL');
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
    return String(onHand - qty);
  }, [formState.currentOnHand, formState.qty]);

  const canSubmitForm = Boolean(formState.sku && formState.itemName && Number(formState.qty) > 0);
  const workflowSteps = !mode === 'create' ? [] : getWorkflowSteps(workspaceStatus);

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
          }
        } else {
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
      currentOnHand: Number(formState.currentOnHand),
      recordedBy: formState.recordedBy || 'Current User',
      activeAlert: formState.activeAlert,
      scanValue: formState.scanValue,
      scanResolution: formState.scanResolution,
    };

    const savedId = nextStatus === 'DRAFT' ? saveDraftEvent(payload) : createSubmittedEvent(payload);
    setRows(getWastageRows());
    setFormState((prev) => ({ ...prev, id: savedId }));
    setActionStatus(nextStatus === 'DRAFT' ? 'draft_saved' : 'submitted');
    setTimeout(() => navigate(`/Wastage/workspace?event=${encodeURIComponent(savedId)}`), 250);
  };

  const handleSubmitDraft = () => {
    if (!liveEvent) return;
    submitEvent(liveEvent.id, 'Current User');
    setRows(getWastageRows());
    setActionStatus('submitted');
  };

  const handleApprove = async () => {
    if (!liveEvent) return;
    // 1. Update in-memory engine
    approveEvent(liveEvent.id, 'Current User');
    setRows(getWastageRows());
    setActionStatus('approved');

    // 2. Post WASTE movement to ledger + update InventoryItem
    try {
      const user = await base44.auth.me();
      const postedBy = user?.email || 'Current User';
      const existing = await base44.entities.InventoryItem.filter({ sku: liveEvent.sku });
      const invItem = existing?.[0];
      if (invItem) {
        const sites = await base44.entities.Site.filter({ is_active: true });
        const siteId = invItem.site_id || sites?.[0]?.id || '';
        const currentSiteStock = invItem.stock_per_site?.[siteId] ?? (invItem.stock || 0);
        const balanceAfter = currentSiteStock - liveEvent.qty;
        const updatedStockPerSite = { ...(invItem.stock_per_site || {}), [siteId]: balanceAfter };

        await Promise.all([
          base44.entities.InventoryItem.update(invItem.id, {
            stock: (invItem.stock || 0) - liveEvent.qty,
            stock_per_site: updatedStockPerSite,
          }),
          base44.entities.StockMovement.create({
            site_id: siteId,
            item_id: invItem.id,
            sku: liveEvent.sku,
            item_name: liveEvent.itemName,
            movement_type: 'WASTE',
            direction: 'OUT',
            qty: liveEvent.qty,
            balance_after: balanceAfter,
            source_ref: liveEvent.id,
            source_type: 'WASTAGE',
            notes: liveEvent.notes || '',
            status: 'POSTED',
            posted_by: postedBy,
          }),
        ]);
      }
    } catch (err) {
      console.error('Ledger post failed', err);
    }
  };

  const handleReject = () => {
    if (!liveEvent || !rejectReason.trim()) return;
    rejectEvent(liveEvent.id, rejectReason.trim(), 'Current User');
    setRows(getWastageRows());
    setRejectOpen(false);
    setRejectReason('');
    setActionStatus('rejected');
  };

  const handleReverse = async () => {
    if (!liveEvent || !reverseReason.trim()) return;
    // 1. Update in-memory engine
    reverseEvent(liveEvent.id, reverseReason.trim(), 'Current User');
    setRows(getWastageRows());
    setReverseOpen(false);
    setReverseReason('');
    setActionStatus('reversed');

    // 2. Post counter-entry REVERSAL movement + restore InventoryItem stock
    try {
      const user = await base44.auth.me();
      const postedBy = user?.email || 'Current User';
      const existing = await base44.entities.InventoryItem.filter({ sku: liveEvent.sku });
      const invItem = existing?.[0];
      if (invItem) {
        const sites = await base44.entities.Site.filter({ is_active: true });
        const siteId = invItem.site_id || sites?.[0]?.id || '';
        const currentSiteStock = invItem.stock_per_site?.[siteId] ?? (invItem.stock || 0);
        const balanceAfter = currentSiteStock + liveEvent.qty;
        const updatedStockPerSite = { ...(invItem.stock_per_site || {}), [siteId]: balanceAfter };

        // Find the original WASTE movement to link the reversal
        const originalMovements = await base44.entities.StockMovement.filter({
          source_ref: liveEvent.id,
          movement_type: 'WASTE',
        });
        const originalMovementId = originalMovements?.[0]?.id || '';

        await Promise.all([
          base44.entities.InventoryItem.update(invItem.id, {
            stock: (invItem.stock || 0) + liveEvent.qty,
            stock_per_site: updatedStockPerSite,
          }),
          base44.entities.StockMovement.create({
            site_id: siteId,
            item_id: invItem.id,
            sku: liveEvent.sku,
            item_name: liveEvent.itemName,
            movement_type: 'REVERSAL',
            direction: 'IN',
            qty: liveEvent.qty,
            balance_after: balanceAfter,
            source_ref: liveEvent.id,
            source_type: 'WASTAGE',
            reversal_of: originalMovementId,
            notes: reverseReason.trim(),
            status: 'POSTED',
            posted_by: postedBy,
          }),
        ]);
      }
    } catch (err) {
      console.error('Reversal ledger post failed', err);
    }
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

          {mode === 'create' ? (
            <>
              <div className="space-y-1">
                <h1 className="text-lg font-semibold text-foreground">Record Wastage</h1>
                <p className="text-sm text-muted-foreground">Capture the event safely first. The deeper workflow, posting, and history surfaces appear once the record exists.</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <SummaryCard label="Step 1" value="Choose capture method" helper="Scan first or enter the SKU manually." />
                <SummaryCard label="Step 2" value="Check the event" helper="Confirm SKU, quantity, reason, and location." />
                <SummaryCard label="Step 3" value="Save safely" helper="Save Draft keeps the event editable before submission." tone="text-green-700" />
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
                          <button
                            onClick={resolveScan}
                            className="h-10 px-4 rounded-xl border border-border bg-card hover:bg-muted transition-colors text-sm font-medium text-foreground"
                          >
                            Resolve Scan
                          </button>
                        </div>

                        <div className={`rounded-2xl border px-4 py-3 ${scanState.status === 'resolved' ? 'border-green-200 bg-green-50/60' : scanState.status === 'unresolved' ? 'border-amber-200 bg-amber-50/60' : 'border-border bg-background/40'}`}>
                          <p className="text-sm font-medium text-foreground">Scanner status</p>
                          <p className="text-sm text-muted-foreground mt-1">{scanState.helper}</p>
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
                          className="w-full h-10 rounded-xl border border-input bg-background px-3 text-sm"
                        >
                          {['Main Store', 'Branch A'].map((option) => (
                            <option key={option} value={option}>{option}</option>
                          ))}
                        </select>
                      </div>
                      <div>
                        <label className="text-xs font-medium text-muted-foreground block mb-1.5">Source</label>
                        <select
                          value={formState.source}
                          onChange={(e) => handleFormChange('source', e.target.value)}
                          className="w-full h-10 rounded-xl border border-input bg-background px-3 text-sm"
                        >
                          {sourceOptions.map((option) => (
                            <option key={option} value={option}>{option}</option>
                          ))}
                        </select>
                      </div>
                      <div>
                        <label className="text-xs font-medium text-muted-foreground block mb-1.5">SKU</label>
                        <Input value={formState.sku} onChange={(e) => handleFormChange('sku', e.target.value)} placeholder="Enter SKU" />
                      </div>
                      <div>
                        <label className="text-xs font-medium text-muted-foreground block mb-1.5">Item name</label>
                        <Input value={formState.itemName} onChange={(e) => handleFormChange('itemName', e.target.value)} placeholder="Resolved item name" />
                      </div>
                      <div>
                        <label className="text-xs font-medium text-muted-foreground block mb-1.5">Quantity</label>
                        <Input type="number" min="1" value={formState.qty} onChange={(e) => handleFormChange('qty', e.target.value)} />
                      </div>
                      <div>
                        <label className="text-xs font-medium text-muted-foreground block mb-1.5">Reason</label>
                        <select
                          value={formState.reason}
                          onChange={(e) => handleFormChange('reason', e.target.value)}
                          className="w-full h-10 rounded-xl border border-input bg-background px-3 text-sm"
                        >
                          {reasonOptions.map((option) => (
                            <option key={option} value={option}>{option}</option>
                          ))}
                        </select>
                      </div>
                      <div className="md:col-span-2">
                        <label className="text-xs font-medium text-muted-foreground block mb-1.5">Notes</label>
                        <Textarea value={formState.notes} onChange={(e) => handleFormChange('notes', e.target.value)} placeholder="Add a short operational note" rows={4} />
                      </div>
                    </div>
                  </SectionCard>
                </div>

                <div className="xl:col-span-4 space-y-4 xl:sticky xl:top-6">
                  <div className="grid grid-cols-1 gap-3">
                    <SummaryCard label="Current On Hand" value={String(formState.currentOnHand)} helper="Snapshot before approval." />
                    <SummaryCard label="Projected On Approval" value={projectedOnHand} helper="No stock movement posts until approval." tone={projectedOnHand === '—' ? 'text-muted-foreground' : 'text-foreground'} />
                    <SummaryCard label="Reason Fit" value={policy.bucket} helper={policy.reorderBehavior} tone={policy.impactTone} />
                  </div>

                  <SectionCard label="Engine alignment note" helper="This capture surface stays simple on purpose.">
                    <div className="space-y-3 text-sm text-muted-foreground">
                      <p><span className="font-medium text-foreground">Create first</span> — Deeper workflow metadata, stock proof, and history become useful after the record exists.</p>
                      <p><span className="font-medium text-foreground">Submit later if needed</span> — Draft is the safest path for uncertain captures.</p>
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
                  <span className={`text-[11px] px-2.5 py-0.5 rounded-full font-medium ${statusStyle[liveEvent.status]}`}>{liveEvent.status}</span>
                  <PolicyChip reason={liveEvent.reason} />
                  <span className="text-[11px] px-2.5 py-0.5 rounded-full font-medium bg-blue-50 text-blue-700 border border-blue-200">
                    {liveEvent.detailContractStatus === 'prototype_enriched' ? 'Detail contract ready' : 'Live detail'}
                  </span>
                </div>
                <p className="text-sm text-muted-foreground">{liveEvent.location} · {liveEvent.sku} · {liveEvent.itemName}</p>
              </div>

              <SectionCard
                label="Current state"
                helper={getReviewActionText(workspaceStatus)}
                action={<span className="text-xs text-muted-foreground">Workflow-backed review surface</span>}
              >
                <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                  <div className="space-y-1">
                    <p className="text-sm font-medium text-foreground">{getStockEffectText(workspaceStatus)}</p>
                    <p className="text-sm text-muted-foreground">This layout is shaped around the engine record, movement proof, and action history instead of a thin list row.</p>
                  </div>
                  <div className="flex flex-wrap items-center gap-2">
                    {workspaceStatus === 'DRAFT' ? <span className="text-[11px] px-2.5 py-0.5 rounded-full font-medium bg-amber-50 text-amber-700 border border-amber-200">Next action: Submit draft</span> : null}
                    {workspaceStatus === 'SUBMITTED' ? <span className="text-[11px] px-2.5 py-0.5 rounded-full font-medium bg-amber-50 text-amber-700 border border-amber-200">Next action: Approve or reject</span> : null}
                    {workspaceStatus === 'APPROVED' ? <span className="text-[11px] px-2.5 py-0.5 rounded-full font-medium bg-blue-50 text-blue-700 border border-blue-200">Next action: Reverse if needed</span> : null}
                    {['REJECTED', 'REVERSED'].includes(workspaceStatus) ? <span className="text-[11px] px-2.5 py-0.5 rounded-full font-medium bg-slate-100 text-slate-700 border border-slate-200">Read only</span> : null}
                  </div>
                </div>
              </SectionCard>

              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-3">
                <SummaryCard label="Workflow state" value={liveEvent.status} helper="Current engine lifecycle state" />
                <SummaryCard label="Stock posting" value={liveEvent.movementState} helper="Posting posture for this record" tone={workspaceStatus === 'APPROVED' ? 'text-green-700' : workspaceStatus === 'REVERSED' ? 'text-slate-700' : 'text-amber-700'} />
                <SummaryCard label="Current on hand" value={String(liveEvent.currentOnHand)} helper="Latest visible on-hand for this record" />
                <SummaryCard label="Latest action" value={liveEvent.lastAction?.action?.replaceAll('_', ' ') || 'Recorded'} helper={liveEvent.lastAction?.ts || liveEvent.recordedAt} tone="text-blue-700" />
              </div>

              <div className="grid grid-cols-1 xl:grid-cols-12 gap-4 items-start">
                <div className="xl:col-span-8 space-y-4">
                  <SectionCard label="Record header" helper="The current public list endpoint is thin, so this prototype-enriched layout expects the richer detail contract later.">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      <DetailRow label="Event ID" value={liveEvent.id} emphasis />
                      <DetailRow label="Status" value={liveEvent.status} />
                      <DetailRow label="Occurred at" value={liveEvent.occurredAt} muted />
                      <DetailRow label="Recorded at" value={liveEvent.recordedAt} muted />
                      <DetailRow label="Recorded by" value={liveEvent.recordedBy} />
                      <DetailRow label="Source" value={liveEvent.source} muted />
                      <DetailRow label="Location" value={liveEvent.location} />
                      <DetailRow label="SKU" value={liveEvent.sku} muted />
                      <DetailRow label="Item name" value={liveEvent.itemName} emphasis />
                      <DetailRow label="Quantity" value={String(liveEvent.qty)} />
                      <DetailRow label="Reason" value={liveEvent.reason} />
                      <DetailRow label="Capture path" value={liveEvent.scanResolution || (liveEvent.source === 'SCANNER' ? 'Scanner capture' : 'Manual or system-originated')} muted />
                      <div className="md:col-span-2">
                        <DetailRow label="Notes" value={liveEvent.notes || 'No notes recorded.'} muted={!liveEvent.notes} />
                      </div>
                    </div>
                  </SectionCard>

                  <SectionCard label="Workflow metadata" helper="Actor and timestamp breakdown for each possible lifecycle step.">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-3">
                        <DetailRow label="Recorded" value={`${liveEvent.recordedBy} · ${liveEvent.recordedAt}`} />
                        <DetailRow label="Submitted" value={liveEvent.submittedAt ? `${liveEvent.submittedBy || 'Unknown'} · ${liveEvent.submittedAt}` : 'Not submitted yet'} muted={!liveEvent.submittedAt} />
                        <DetailRow label="Approved" value={liveEvent.approvedAt ? `${liveEvent.approvedBy || 'Unknown'} · ${liveEvent.approvedAt}` : 'Not approved'} muted={!liveEvent.approvedAt} />
                      </div>
                      <div className="space-y-3">
                        <DetailRow label="Rejected" value={liveEvent.rejectedAt ? `${liveEvent.rejectedBy || 'Unknown'} · ${liveEvent.rejectedAt}` : 'Not rejected'} muted={!liveEvent.rejectedAt} />
                        <DetailRow label="Reversed" value={liveEvent.reversedAt ? `${liveEvent.reversedBy || 'Unknown'} · ${liveEvent.reversedAt}` : 'Not reversed'} muted={!liveEvent.reversedAt} />
                        <DetailRow label="Current posture" value={getReviewActionText(workspaceStatus)} muted />
                      </div>
                    </div>
                  </SectionCard>

                  {(liveEvent.rejectionReason || liveEvent.reversalReason) ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {liveEvent.rejectionReason ? (
                        <SectionCard label="Rejection reason" helper="Decision detail kept with the engine record.">
                          <p className="text-sm text-muted-foreground leading-relaxed">{liveEvent.rejectionReason}</p>
                        </SectionCard>
                      ) : null}
                      {liveEvent.reversalReason ? (
                        <SectionCard label="Reversal reason" helper="Reversal stays visible because the original movement already happened.">
                          <p className="text-sm text-muted-foreground leading-relaxed">{liveEvent.reversalReason}</p>
                        </SectionCard>
                      ) : null}
                    </div>
                  ) : null}

                  <SectionCard label="Stock result posture" helper="Keep the stock result visible separately from the workflow badge.">
                    <div className="space-y-4">
                      <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
                        <SummaryCard label="On hand before" value={String(liveEvent.onHandBefore)} helper="Snapshot before any approval posting" />
                        <SummaryCard label="Projected after approval" value={String(liveEvent.onHandAfterApproval)} helper="Expected result if approval posts" tone="text-amber-700" />
                        <SummaryCard label="Current visible on hand" value={String(liveEvent.currentOnHand)} helper="Latest visible stock position" tone={workspaceStatus === 'APPROVED' ? 'text-green-700' : workspaceStatus === 'REVERSED' ? 'text-slate-700' : 'text-foreground'} />
                        <SummaryCard label="Stock posting state" value={liveEvent.movementState} helper={getStockEffectText(workspaceStatus)} tone={workspaceStatus === 'APPROVED' ? 'text-green-700' : workspaceStatus === 'REVERSED' ? 'text-slate-700' : 'text-amber-700'} />
                      </div>
                      <div className="border border-border rounded-2xl px-4 py-3 bg-background/40">
                        <p className="text-sm font-medium text-foreground">Stock result note</p>
                        <p className="text-sm text-muted-foreground mt-2 leading-relaxed">Approval and reversal are the only moments where the engine writes stock movement rows and updates post-on-hand. Draft, submitted, and rejected states keep the record visible without posting stock.</p>
                      </div>
                    </div>
                  </SectionCard>

                  <SectionCard label="Stock movement proof" helper="Movement rows mirror the engine ledger shape: delta, reason, ref type, actor, note, and post-on-hand.">
                    {liveEvent.movementRows.length === 0 ? (
                      <div className="space-y-2 text-sm text-muted-foreground">
                        <p>No movement rows have been posted for this event yet.</p>
                        {workspaceStatus === 'SUBMITTED' ? <p>Approval is the point where the engine posts the stock deduction.</p> : null}
                      </div>
                    ) : (
                      <div className="space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                          <SummaryCard label="On hand before" value={String(liveEvent.onHandBefore)} helper="Snapshot before posting" />
                          <SummaryCard label="Posted rows" value={String(liveEvent.movementRows.length)} helper="Ledger rows linked to this event" />
                          <SummaryCard label="Current visible on hand" value={String(liveEvent.currentOnHand)} helper="Latest post-on-hand position" tone="text-green-700" />
                        </div>
                        <div className="overflow-x-auto">
                          <table className="w-full text-sm min-w-[760px]">
                            <thead className="bg-muted/15 text-muted-foreground text-[11px] uppercase tracking-[0.18em]">
                              <tr>
                                {['Timestamp', 'Ref Type', 'Delta', 'Post On Hand', 'Reason', 'Ref ID', 'Actor', 'Note'].map((heading) => (
                                  <th key={heading} className="text-left px-4 py-2.5 font-medium whitespace-nowrap">{heading}</th>
                                ))}
                              </tr>
                            </thead>
                            <tbody>
                              {liveEvent.movementRows.map((row) => (
                                <MovementRow key={row.id} row={row} />
                              ))}
                            </tbody>
                          </table>
                        </div>
                      </div>
                    )}
                  </SectionCard>

                  <SectionCard label="Action history" helper="A calmer operational history block that can map cleanly to a future audit endpoint.">
                    <div className="space-y-4">
                      {liveEvent.auditTrail.length === 0 ? (
                        <p className="text-sm text-muted-foreground">No action history recorded yet.</p>
                      ) : (
                        liveEvent.auditTrail.map((item) => <TimelineRow key={item.id} item={item} />)
                      )}
                    </div>
                  </SectionCard>
                </div>

                <div className="xl:col-span-4 space-y-4 xl:sticky xl:top-6">
                  <SectionCard label="Workflow progress" helper="This makes the lifecycle easier to follow at a glance.">
                    <div className="space-y-4">
                      {getWorkflowSteps(liveEvent.status).map((step) => (
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

                  <SectionCard label="Decision posture" helper="Who can act next and what that action means.">
                    <div className="space-y-3 text-sm text-muted-foreground">
                      <p>{getReviewActionText(workspaceStatus)}</p>
                      <p><span className="font-medium text-foreground">Prototype-enriched detail</span> — This layout already reserves space for real decision timestamps, reasons, movement proof, and audit rows.</p>
                    </div>
                  </SectionCard>

                  <SectionCard label="Workflow guardrails" helper="State rules come directly from the engine lifecycle, so blocked actions stay visible instead of surprising the operator.">
                    <div className="space-y-3">
                      {actionGuards.map((item) => (
                        <GuardLine key={item.action} item={item} />
                      ))}
                    </div>
                  </SectionCard>

                  <SectionCard label="Source posture" helper="The engine already stores source type, so the UI should keep that operational context visible.">
                    <div className="space-y-3">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className={`inline-flex text-[11px] px-2.5 py-0.5 rounded-full font-medium ${sourcePosture.chipClass}`}>{liveEvent.source}</span>
                        <span className="text-sm font-medium text-foreground">{sourcePosture.label}</span>
                      </div>
                      <p className="text-sm text-muted-foreground leading-relaxed">{sourcePosture.helper}</p>
                      {liveEvent.scanResolution ? <p className="text-xs text-muted-foreground leading-relaxed">Scanner resolution: {liveEvent.scanResolution}</p> : null}
                    </div>
                  </SectionCard>

                  <SectionCard label="Read model posture" helper="This makes it clear which parts of the record are already public reads and which parts are stored deeper in the engine.">
                    <div className="space-y-3">
                      {readinessRows.map((item) => (
                        <ReadinessLine key={item.label} item={item} />
                      ))}
                    </div>
                  </SectionCard>

                  <SectionCard label="Related alerts" helper="Rule and instance structure is surfaced without implying unsupported acknowledgement writes.">
                    {liveEvent.linkedAlertInstances?.length ? (
                      <div className="space-y-3">
                        {liveEvent.linkedAlertInstances.map((instance) => (
                          <AlertInstanceCard key={instance.id} instance={instance} />
                        ))}
                        <button
                          onClick={() => navigate('/Wastage?surface=ALERTS')}
                          className="inline-flex items-center gap-1.5 h-9 px-4 text-sm rounded-xl border border-border bg-card hover:bg-muted transition-colors text-foreground"
                        >
                          Open Alerts surface <ArrowRight size={14} />
                        </button>
                      </div>
                    ) : (
                      <div className="space-y-3">
                        <p className="text-sm text-muted-foreground">No active alert instances are linked to this event right now.</p>
                        <button
                          onClick={() => navigate('/Wastage?surface=ALERTS')}
                          className="inline-flex items-center gap-1.5 h-9 px-4 text-sm rounded-xl border border-border bg-card hover:bg-muted transition-colors text-foreground"
                        >
                          Open Alerts surface <ArrowRight size={14} />
                        </button>
                      </div>
                    )}
                  </SectionCard>

                  <SectionCard label="Reason guidance">
                    <div className="space-y-3">
                      <div className="flex flex-wrap items-center gap-2">
                        <PolicyChip reason={liveEvent.reason} />
                        {liveEvent.activeAlert ? <span className="text-[11px] px-2.5 py-0.5 rounded-full font-medium bg-red-50 text-red-700 border border-red-200">Active alert instance</span> : null}
                      </div>
                      <p className={`text-sm leading-relaxed ${policy.impactTone}`}>{policy.helper}</p>
                      <p className="text-xs text-muted-foreground leading-relaxed">{policy.reviewNote}</p>
                    </div>
                  </SectionCard>
                </div>
              </div>
            </>
          )}
        </div>

        <div className="fixed bottom-0 left-56 right-0 bg-card/95 backdrop-blur border-t border-border px-4 py-2.5 flex flex-wrap items-center gap-3 z-10 shadow-[0_-6px_18px_rgba(15,23,42,0.04)]">
          {actionStatus === 'draft_saved' ? <span className="text-xs text-green-700 font-medium flex items-center gap-1.5"><Save size={13} /> Draft saved</span> : null}
          {actionStatus === 'submitted' ? <span className="text-xs text-amber-700 font-medium flex items-center gap-1.5"><AlertTriangle size={13} /> Event submitted for approval</span> : null}
          {actionStatus === 'approved' ? <span className="text-xs text-green-700 font-medium flex items-center gap-1.5"><CheckCircle2 size={13} /> Wastage approved — stock adjustment posted</span> : null}
          {actionStatus === 'rejected' ? <span className="text-xs text-red-700 font-medium flex items-center gap-1.5"><X size={13} /> Wastage rejected</span> : null}
          {actionStatus === 'reversed' ? <span className="text-xs text-slate-700 font-medium flex items-center gap-1.5"><Undo2 size={13} /> Wastage reversed</span> : null}

          <div className="ml-auto flex flex-wrap items-center gap-2">
            <button
              onClick={() => navigate('/Wastage')}
              className="flex items-center gap-2 h-9 px-4 text-sm rounded-xl border border-border bg-card hover:bg-muted transition-colors text-foreground"
            >
              {mode === 'create' ? <X size={14} /> : <ArrowLeft size={14} />} {mode === 'create' ? 'Cancel' : 'Back to Wastage'}
            </button>

            {mode === 'create' ? (
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
                  <ShieldCheck size={14} /> Approve
                </button>
              </>
            ) : workspaceStatus === 'APPROVED' ? (
              <button
                onClick={() => setReverseOpen(true)}
                className="flex items-center gap-2 h-9 px-4 text-sm rounded-xl border border-border bg-card hover:bg-muted transition-colors text-foreground"
              >
                <Undo2 size={14} /> Reverse
              </button>
            ) : (
              <div className="text-xs text-muted-foreground flex items-center gap-1.5"><Clock3 size={13} /> No further action available</div>
            )}
          </div>
        </div>
      </div>

      <AlertDialog open={rejectOpen} onOpenChange={setRejectOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Reject wastage event</AlertDialogTitle>
            <AlertDialogDescription>
              This stops the workflow before stock movement posting. Add the reason so the decision stays with the record.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <Textarea value={rejectReason} onChange={(e) => setRejectReason(e.target.value)} placeholder="Why is this record being rejected?" rows={4} />
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setRejectReason('')}>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleReject} disabled={!rejectReason.trim()}>Reject event</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={reverseOpen} onOpenChange={setReverseOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Reverse approved wastage</AlertDialogTitle>
            <AlertDialogDescription>
              This posts an equal and opposite movement. Add the reason so the reversal stays visible in history.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <Textarea value={reverseReason} onChange={(e) => setReverseReason(e.target.value)} placeholder="Why should this approved record be reversed?" rows={4} />
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setReverseReason('')}>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleReverse} disabled={!reverseReason.trim()}>Reverse event</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}