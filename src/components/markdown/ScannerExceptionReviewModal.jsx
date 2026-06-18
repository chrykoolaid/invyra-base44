import { useEffect, useMemo, useState } from 'react';
import { base44 } from '@/api/base44Client';
import {
  AlertCircle,
  CheckCircle2,
  ClipboardCheck,
  RotateCcw,
  ShieldCheck,
  X,
} from 'lucide-react';

const DISCOUNT_OPTIONS = [
  { key: '25', label: '25% off', value: 25 },
  { key: '50', label: '50% off', value: 50 },
  { key: '75', label: '75% off', value: 75 },
  { key: 'custom', label: 'Custom override', value: null },
];

function formatMoney(value) {
  if (value === null || value === undefined || value === '' || Number.isNaN(Number(value))) return '—';
  return `₱${Number(value).toFixed(2)}`;
}

function formatQty(value) {
  if (value === null || value === undefined || value === '' || Number.isNaN(Number(value))) return '—';
  return Number(value).toLocaleString('en-PH');
}

function formatDate(value) {
  if (!value) return '—';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '—';
  return date.toLocaleDateString('en-PH', { year: 'numeric', month: 'short', day: 'numeric' });
}

function PillButton({ active, children, onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`h-8 px-3 rounded-full border text-xs font-semibold transition-colors ${
        active
          ? 'bg-primary text-primary-foreground border-primary'
          : 'bg-background text-muted-foreground border-border hover:bg-muted hover:text-foreground'
      }`}
    >
      {children}
    </button>
  );
}

function EvidenceField({ label, value, mono = false, strong = false }) {
  return (
    <div className="rounded-xl border border-border bg-muted/20 px-3 py-2.5">
      <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">{label}</p>
      <p className={`text-sm mt-1 ${strong ? 'font-semibold text-foreground' : 'text-muted-foreground'} ${mono ? 'font-mono' : ''}`}>{value || '—'}</p>
    </div>
  );
}

async function findInventoryItem(model) {
  if (model.itemId) return { id: model.itemId, sku: model.sku, name: model.itemName };

  const entity = base44.entities?.InventoryItem;
  if (!entity?.filter) return null;

  const lookups = [];
  if (model.sku && model.sku !== 'No SKU') lookups.push({ sku: model.sku });
  if (model.barcode) lookups.push({ barcode: model.barcode });

  for (const query of lookups) {
    try {
      const rows = await entity.filter({ ...query, environment: 'LIVE' }, 'name', 1);
      if (rows?.[0]) return rows[0];
    } catch {
      // Continue to the next lookup option.
    }
  }

  return null;
}

function buildUpdatedPayload(rawRequest, model, status, managerNote, extras = {}) {
  const currentPayload = typeof rawRequest?.payload === 'object' && rawRequest.payload !== null ? rawRequest.payload : {};
  const requestPayload = currentPayload.markdown_request || currentPayload.markdownRequest || currentPayload.request || currentPayload.data || currentPayload;

  const updatedRequest = {
    ...requestPayload,
    approval_status: status,
    reviewed_at: new Date().toISOString(),
    manager_note: managerNote || '',
    manager_action_type: extras.manager_action_type || status,
    item_master_price_mutated: false,
    price_overlay_scope: 'EXPIRY_DATE_QTY',
    auto_close_rule: 'CLOSE_ON_SOLD_OUT_OR_EXPIRY',
    ...extras,
  };

  if (currentPayload.markdown_request) return { ...currentPayload, markdown_request: updatedRequest };
  if (currentPayload.markdownRequest) return { ...currentPayload, markdownRequest: updatedRequest };
  if (currentPayload.request) return { ...currentPayload, request: updatedRequest };
  if (currentPayload.data) return { ...currentPayload, data: updatedRequest };
  return updatedRequest;
}

export default function ScannerExceptionReviewModal({ request, model, onClose, onProcessed }) {
  const [discountMode, setDiscountMode] = useState(() => {
    const known = DISCOUNT_OPTIONS.find((option) => option.value === Math.round(Number(model.discount || 0)));
    return known?.key || (model.manualPriceOverride ? 'custom' : '50');
  });
  const [customPrice, setCustomPrice] = useState(model.manualPriceOverride && model.proposedPrice ? String(model.proposedPrice) : '');
  const [managerNote, setManagerNote] = useState('');
  const [inventoryItem, setInventoryItem] = useState(null);
  const [resolvingItem, setResolvingItem] = useState(true);
  const [savingAction, setSavingAction] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    let mounted = true;
    setResolvingItem(true);
    findInventoryItem(model)
      .then((item) => {
        if (mounted) setInventoryItem(item);
      })
      .finally(() => {
        if (mounted) setResolvingItem(false);
      });
    return () => { mounted = false; };
  }, [model]);

  const originalPrice = Number(model.originalPrice || 0);
  const selectedDiscount = discountMode === 'custom' ? null : Number(discountMode || 0);
  const customOverlayPrice = Number(customPrice || 0);
  const calculatedOverlayPrice = originalPrice > 0 && selectedDiscount > 0
    ? Math.round((originalPrice * (1 - selectedDiscount / 100)) * 100) / 100
    : 0;
  const overlayPrice = discountMode === 'custom' ? customOverlayPrice : calculatedOverlayPrice;
  const finalDiscount = originalPrice > 0 && overlayPrice > 0
    ? Math.max(0, Math.round((1 - overlayPrice / originalPrice) * 10000) / 100)
    : null;

  const exceptionReasons = useMemo(() => {
    const reasons = [];
    if (model.thresholdExceeded || Number(model.qty || 0) > 20) reasons.push('Qty exceeds 20 threshold');
    if (model.manualPriceOverride || discountMode === 'custom') reasons.push('Manager/custom overlay price');
    if (model.syncStatus === 'Conflict') reasons.push('Sync conflict');
    if (model.syncStatus === 'Failed') reasons.push('Sync failure recovery');
    return reasons.length ? reasons : ['Manager review requested by ScanOps'];
  }, [model, discountMode]);

  const updateSyncRequest = async (status, extras = {}) => {
    if (!base44.entities?.MarkdownSyncQueue?.update || !request?.id) return;
    const payload = buildUpdatedPayload(request, model, status, managerNote, extras);
    await base44.entities.MarkdownSyncQueue.update(request.id, {
      payload,
      sync_status: extras.sync_status || 'Processed',
      processed_at: new Date().toISOString(),
      batch_id: extras.batch_id || request.batch_id || '',
      server_event_id: extras.server_event_id || request.server_event_id || '',
    });
  };

  const handleApprove = async () => {
    setError('');
    setSuccess('');

    if (resolvingItem) {
      setError('Still resolving the scanned SKU against Item Master. Try again in a moment.');
      return;
    }

    if (!inventoryItem?.id) {
      setError('Cannot activate overlay because the synced request does not resolve to an Item Master record. Mark manually handled or reject, then correct the ScanOps payload.');
      return;
    }

    if (!Number(model.qty || 0)) {
      setError('Synced request is missing captured quantity. Quantity must come from ScanOps evidence.');
      return;
    }

    if (!model.expiryDate) {
      setError('Synced request is missing expiry / sell-by date. A scoped overlay cannot be activated without the affected date.');
      return;
    }

    if (!originalPrice || originalPrice <= 0) {
      setError('Synced request is missing original shelf price snapshot. A scoped overlay cannot be activated safely.');
      return;
    }

    if (!overlayPrice || overlayPrice <= 0) {
      setError(discountMode === 'custom' ? 'Enter the manager override overlay price.' : 'Select a valid markdown discount.');
      return;
    }

    if (overlayPrice > originalPrice) {
      setError('Overlay price cannot be higher than the original shelf price snapshot.');
      return;
    }

    setSavingAction('approve');
    try {
      const response = await base44.functions.invoke('createMarkdownBatch', {
        sku: inventoryItem.sku || model.sku,
        item_id: inventoryItem.id,
        item_name: inventoryItem.name || model.itemName,
        allocated_qty: Number(model.qty),
        site_id: model.siteId || '',
        environment: 'LIVE',
        capture_method: model.captureMethod || 'ScanOps',
        markdown_reason: model.reason || 'Near expiry',
        initial_original_price: originalPrice,
        initial_markdown_price: overlayPrice,
        markdown_discount_percent: finalDiscount,
        price_entry_mode: discountMode === 'custom' ? 'custom_price' : 'discount_percent',
        manual_price_override: discountMode === 'custom',
        high_qty_threshold: 20,
        threshold_exceeded: true,
        initial_expiry_date: model.expiryDate,
        label_qty: Number(model.qty),
        request_notes: managerNote || model.notes || '',
        scanner_session_ref: model.sessionId || model.id,
        requested_source: 'ScanOpsExceptionReview',
      });

      if (!response.data?.success) {
        throw new Error(response.data?.error || 'Failed to approve the synced ScanOps markdown exception.');
      }

      await updateSyncRequest('Approved', {
        sync_status: 'Processed',
        batch_id: response.data.batch?.id || '',
        server_event_id: response.data.batch?.batch_ref || '',
        manager_action_type: 'APPROVE_TEMPORARY_PRICE_OVERLAY',
        approved_markdown_price: overlayPrice,
        approved_discount_percent: finalDiscount,
        approved_expiry_date: model.expiryDate,
      });

      setSuccess('Scoped markdown overlay approved. Item Master price remains unchanged.');
      onProcessed?.();
    } catch (approveError) {
      setError(approveError?.message || 'Failed to approve scoped markdown overlay.');
    } finally {
      setSavingAction('');
    }
  };

  const handleNonApprovalAction = async (status) => {
    setError('');
    setSuccess('');
    setSavingAction(status);

    try {
      const managerActionType = status === 'Rejected' ? 'REJECT_SCANOPS_EXCEPTION' : 'MARK_MANUALLY_HANDLED';
      await updateSyncRequest(status, { sync_status: 'Processed', manager_action_type: managerActionType });
      setSuccess(status === 'Rejected' ? 'ScanOps markdown exception rejected.' : 'ScanOps exception marked as manually handled.');
      onProcessed?.();
    } catch (actionError) {
      setError(actionError?.message || 'Failed to update ScanOps markdown request.');
    } finally {
      setSavingAction('');
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/30 flex items-center justify-center p-4">
      <div className="w-full max-w-4xl bg-card border border-border rounded-xl shadow-xl max-h-[92vh] overflow-hidden flex flex-col">
        <div className="flex items-center justify-between px-5 py-4 border-b border-border">
          <div>
            <h2 className="text-base font-semibold text-foreground">Markdown Exception Review</h2>
            <p className="text-xs text-muted-foreground mt-0.5">Read-only ScanOps evidence — manager action activates a temporary price overlay only.</p>
          </div>
          <button onClick={onClose} className="w-7 h-7 flex items-center justify-center rounded hover:bg-muted text-muted-foreground">
            <X size={15} />
          </button>
        </div>

        <div className="p-5 space-y-5 overflow-y-auto">
          <section className="rounded-2xl border border-indigo-100 bg-indigo-50/50 p-4">
            <div className="flex items-start gap-3">
              <ClipboardCheck size={18} className="text-indigo-700 mt-0.5 flex-shrink-0" />
              <div>
                <p className="text-sm font-semibold text-foreground">Captured by ScanOps handheld</p>
                <p className="text-xs text-muted-foreground mt-0.5">Item, quantity, expiry date, and price snapshot are floor evidence and cannot be re-entered on desktop.</p>
              </div>
            </div>
          </section>

          <section className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <EvidenceField label="Item" value={model.itemName} strong />
            <EvidenceField label="SKU / Barcode" value={`${model.sku || '—'}${model.barcode ? ` · ${model.barcode}` : ''}`} mono />
            <EvidenceField label="Exception reason" value={exceptionReasons.join(' · ')} strong />
            <EvidenceField label="Captured quantity" value={formatQty(model.qty)} strong />
            <EvidenceField label="On hand snapshot" value={model.onHand !== null ? formatQty(model.onHand) : '—'} />
            <EvidenceField label="Expiry / sell-by date" value={formatDate(model.expiryDate)} strong />
            <EvidenceField label="Original price snapshot" value={formatMoney(model.originalPrice)} strong />
            <EvidenceField label="Requested discount" value={model.discount !== null ? `${Number(model.discount).toFixed(1)}% off` : '—'} />
            <EvidenceField label="Requested overlay price" value={formatMoney(model.proposedPrice)} strong />
            <EvidenceField label="Operator" value={model.operatorId} />
            <EvidenceField label="Device / Session" value={`${model.deviceId || '—'}${model.sessionId ? ` · ${model.sessionId}` : ''}`} mono />
            <EvidenceField label="Captured at" value={model.capturedAt ? formatDate(model.capturedAt) : '—'} />
          </section>

          <section className="rounded-2xl border border-border bg-card p-4 space-y-4">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-muted-foreground">Manager action</p>
              <p className="text-sm text-muted-foreground mt-1">Approve or adjust the scoped overlay. This never changes the normal Item Master price.</p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Approved markdown discount</label>
                <div className="flex flex-wrap gap-2">
                  {DISCOUNT_OPTIONS.map((option) => (
                    <PillButton
                      key={option.key}
                      active={discountMode === option.key}
                      onClick={() => {
                        setDiscountMode(option.key);
                        if (option.key !== 'custom') setCustomPrice('');
                        setError('');
                      }}
                    >
                      {option.label}
                    </PillButton>
                  ))}
                </div>
                {discountMode === 'custom' && (
                  <input
                    type="number"
                    step="0.01"
                    min="0.01"
                    value={customPrice}
                    onChange={(event) => { setCustomPrice(event.target.value); setError(''); }}
                    placeholder="Manager override overlay price"
                    className="w-full h-10 border border-amber-300 rounded-lg px-3 text-sm bg-background focus:outline-none focus:ring-1 focus:ring-amber-400"
                  />
                )}
              </div>

              <div className="rounded-xl border border-border bg-muted/20 px-4 py-3">
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Approved scoped overlay</p>
                <div className="mt-2 flex items-end justify-between gap-3">
                  <div>
                    <p className="text-2xl font-bold text-foreground">{overlayPrice > 0 ? formatMoney(overlayPrice) : '—'}</p>
                    <p className="text-xs text-muted-foreground mt-1">{finalDiscount !== null ? `${finalDiscount.toFixed(1)}% off` : 'Select discount'} · closes on sold-out or expiry</p>
                  </div>
                  <ShieldCheck size={24} className="text-green-600" />
                </div>
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Manager note</label>
              <textarea
                value={managerNote}
                onChange={(event) => setManagerNote(event.target.value)}
                placeholder="Optional: verbal approval note, reason for adjusted discount, or manual handling note"
                rows={2}
                className="w-full border border-border rounded-lg px-3 py-2 text-sm bg-background focus:outline-none focus:ring-1 focus:ring-ring resize-none"
              />
            </div>
          </section>

          <section className="rounded-xl border border-amber-200 bg-amber-50 p-3 text-xs text-amber-800">
            <strong>Price safety:</strong> Approval creates a SKU + expiry/date + quantity-scoped markdown overlay. The original SKU price remains untouched and POS falls back automatically after the affected quantity sells out, expires, or is manually closed.
          </section>

          {resolvingItem && (
            <div className="flex items-start gap-2 p-3 rounded border border-blue-200 bg-blue-50 text-xs text-blue-700">
              <RotateCcw size={13} className="mt-0.5 flex-shrink-0 animate-spin" /> Resolving scanned SKU against Item Master…
            </div>
          )}

          {error && (
            <div className="flex items-start gap-2 p-3 rounded border border-red-200 bg-red-50 text-xs text-red-700">
              <AlertCircle size={13} className="mt-0.5 flex-shrink-0" /> {error}
            </div>
          )}

          {success && (
            <div className="flex items-start gap-2 p-3 rounded border border-green-200 bg-green-50 text-xs text-green-700">
              <CheckCircle2 size={13} className="mt-0.5 flex-shrink-0" /> {success}
            </div>
          )}
        </div>

        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 px-5 py-4 border-t border-border bg-muted/20">
          <div className="text-xs text-muted-foreground">
            {inventoryItem?.id ? `Resolved to Item Master: ${inventoryItem.name || model.itemName}` : 'No desktop item re-entry required; resolution uses the synced SKU/barcode.'}
          </div>
          <div className="flex flex-wrap justify-end gap-2">
            <button type="button" onClick={() => handleNonApprovalAction('Manual_Handled')} disabled={Boolean(savingAction)} className="h-9 px-3 text-sm border border-border rounded hover:bg-muted disabled:opacity-50">
              {savingAction === 'Manual_Handled' ? 'Saving…' : 'Mark Manually Handled'}
            </button>
            <button type="button" onClick={() => handleNonApprovalAction('Rejected')} disabled={Boolean(savingAction)} className="h-9 px-3 text-sm border border-red-200 text-red-700 rounded hover:bg-red-50 disabled:opacity-50">
              {savingAction === 'Rejected' ? 'Rejecting…' : 'Reject'}
            </button>
            <button type="button" onClick={handleApprove} disabled={Boolean(savingAction) || resolvingItem} className="h-9 px-4 text-sm bg-primary text-primary-foreground rounded hover:opacity-90 disabled:opacity-50">
              {savingAction === 'approve' ? 'Approving…' : 'Approve Overlay'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
