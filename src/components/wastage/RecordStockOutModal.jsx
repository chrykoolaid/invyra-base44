import { useState, useEffect, useMemo } from 'react';
import { base44 } from '@/api/base44Client';
import { Input } from '@/components/ui/input';
import { AlertTriangle, CheckCircle2, Search, X } from 'lucide-react';
import {
  RECORDABLE_STOCK_OUT_CLASSES,
  getReasonOptions,
  getStockOutClassConfig,
  getStockOutClassLabel,
  requiresControlledLossReview,
} from '@/lib/stockOutLossConfig';

const EDITABLE_FIELDS = [
  'quantity',
  'reason_category',
  'reason_notes',
  'location',
  'department',
  'cost_centre',
  'site_id',
  'incident_reference',
  'evidence_reference',
];

function normaliseValue(value) {
  if (value === null || value === undefined) return '';
  return String(value);
}

function formatMoney(value) {
  return `₱${Number(value || 0).toFixed(0)}`;
}

function buildChangedFields(originalRecord, nextPayload) {
  if (!originalRecord) return [];

  return EDITABLE_FIELDS
    .map((field) => {
      const oldValue = field === 'quantity'
        ? Number(originalRecord[field] || 0)
        : normaliseValue(originalRecord[field]);
      const newValue = field === 'quantity'
        ? Number(nextPayload[field] || 0)
        : normaliseValue(nextPayload[field]);

      if (oldValue === newValue) return null;
      return { field, old_value: oldValue, new_value: newValue };
    })
    .filter(Boolean);
}

export default function RecordStockOutModal({ onClose, onSuccess, initialRecord = null }) {
  const isEditMode = Boolean(initialRecord?.id);
  const [step, setStep] = useState(isEditMode ? 'details' : 'class'); // 'class', 'details'
  const [stockOutClass, setStockOutClass] = useState(initialRecord?.stock_out_class || 'WASTAGE');
  const [items, setItems] = useState([]);
  const [sites, setSites] = useState([]);
  const [loading, setLoading] = useState(false);
  const [itemSearch, setItemSearch] = useState('');

  const [form, setForm] = useState({
    item_id: initialRecord?.item_id || '',
    item_name: initialRecord?.item_name || '',
    sku: initialRecord?.sku || '',
    available_stock: Number(initialRecord?.available_stock || 0),
    quantity: initialRecord?.quantity ? String(initialRecord.quantity) : '',
    reason_category: initialRecord?.reason_category || '',
    reason_notes: initialRecord?.reason_notes || '',
    location: initialRecord?.location || '',
    department: initialRecord?.department || '',
    cost_centre: initialRecord?.cost_centre || '',
    site_id: initialRecord?.site_id || '',
    incident_reference: initialRecord?.incident_reference || '',
    evidence_reference: initialRecord?.evidence_reference || '',
  });

  useEffect(() => {
    base44.entities.InventoryItem.filter({ is_active: true }, '', 100).then(data => {
      setItems(data || []);
    });
    base44.entities.Site.filter({ is_active: true }, 'name', 100)
      .then(data => setSites(data || []))
      .catch(() => setSites([]));
  }, []);

  const selectedItem = useMemo(
    () => items.find(item => item.id === form.item_id),
    [items, form.item_id]
  );

  useEffect(() => {
    if (!selectedItem) return;
    setForm(prev => ({
      ...prev,
      available_stock: Number(selectedItem.stock || prev.available_stock || 0),
    }));
  }, [selectedItem]);

  useEffect(() => {
    setForm(prev => ({ ...prev, reason_category: '' }));
  }, [stockOutClass]);

  const filteredItems = useMemo(() => {
    const query = itemSearch.trim().toLowerCase();

    if (!query) {
      return items;
    }

    return items.filter(item => {
      const searchText = [
        item.name,
        item.sku,
        item.barcode,
        item.item_barcode,
        item.upc,
        item.category,
        item.category_name,
      ]
        .filter(Boolean)
        .join(' ')
        .toLowerCase();

      return searchText.includes(query);
    });
  }, [items, itemSearch]);

  const selectedAvailableStock = Number(form.available_stock ?? selectedItem?.stock ?? 0);
  const fallbackCostPerUnit = initialRecord?.quantity ? Number(initialRecord.estimated_value || 0) / Number(initialRecord.quantity || 1) : 0;
  const costPerUnit = Number(selectedItem?.cost_per_unit ?? selectedItem?.unit_cost ?? fallbackCostPerUnit ?? 0);
  const quantityNumber = Number(form.quantity);
  const hasQuantity = form.quantity !== '';
  const quantityInvalid = hasQuantity && (
    Number.isNaN(quantityNumber) ||
    quantityNumber <= 0 ||
    (selectedAvailableStock > 0 && quantityNumber > selectedAvailableStock)
  );
  const estimatedValue = quantityInvalid || !hasQuantity ? 0 : quantityNumber * costPerUnit;
  const originalEstimatedValue = Number(initialRecord?.estimated_value || 0);
  const classConfig = getStockOutClassConfig(stockOutClass);
  const reasonOptions = getReasonOptions(stockOutClass);
  const isControlledLoss = requiresControlledLossReview(stockOutClass);

  const draftPayload = useMemo(() => ({
    quantity: hasQuantity ? quantityNumber : 0,
    reason_category: form.reason_category,
    reason_notes: form.reason_notes,
    location: form.location,
    department: form.department,
    cost_centre: form.cost_centre,
    site_id: form.site_id,
    incident_reference: form.incident_reference,
    evidence_reference: form.evidence_reference,
    estimated_value: estimatedValue,
    stock_out_class: stockOutClass,
  }), [estimatedValue, form.cost_centre, form.department, form.evidence_reference, form.incident_reference, form.location, form.reason_category, form.reason_notes, form.site_id, hasQuantity, quantityNumber, stockOutClass]);

  const changedFields = useMemo(
    () => buildChangedFields(initialRecord, draftPayload),
    [initialRecord, draftPayload]
  );

  const estimatedValueChanged = isEditMode && Number(originalEstimatedValue || 0) !== Number(estimatedValue || 0);
  const hasChanges = isEditMode && (changedFields.length > 0 || estimatedValueChanged);

  const canSaveDraft = Boolean(
    form.item_id &&
    hasQuantity &&
    !quantityInvalid &&
    form.reason_category &&
    !loading &&
    (!isEditMode || hasChanges)
  );

  const handleSelectItem = (item) => {
    if (isEditMode) return;
    setForm(prev => ({
      ...prev,
      item_id: item.id,
      item_name: item.name,
      sku: item.sku,
      available_stock: Number(item.stock || 0),
    }));
  };

  const handleChangeItem = () => {
    if (isEditMode) return;
    setForm(prev => ({
      ...prev,
      item_id: '',
      item_name: '',
      sku: '',
      available_stock: 0,
      quantity: '',
    }));
  };

  const createDraft = async () => {
    await base44.functions.invoke('createStockOutRecord', {
      item_id: form.item_id,
      item_name: form.item_name,
      sku: form.sku,
      stock_out_class: stockOutClass,
      quantity: Number(form.quantity),
      reason_category: form.reason_category,
      reason_notes: form.reason_notes,
      location: form.location,
      location_name: form.location,
      location_id: form.site_id,
      department: form.department,
      cost_centre: form.cost_centre,
      site_id: form.site_id,
      source: 'MANUAL',
      environment: 'LIVE',
      review_required: false,
      incident_reference: form.incident_reference,
      evidence_reference: form.evidence_reference,
    });
  };

  const createControlledLossSubmission = async () => {
    const user = await base44.auth.me().catch(() => null);
    const actor = user?.email || user?.id || 'unknown';
    const now = new Date().toISOString();

    const record = await base44.entities.StockOutRecord.create({
      item_id: form.item_id,
      item_name: form.item_name,
      sku: form.sku,
      stock_out_class: stockOutClass,
      quantity: Number(form.quantity),
      uom: selectedItem?.uom || selectedItem?.unit || 'units',
      available_stock: selectedAvailableStock,
      estimated_value: estimatedValue,
      reason_category: form.reason_category,
      reason_code: form.reason_category,
      reason_notes: form.reason_notes,
      notes: form.reason_notes,
      location: form.location,
      location_name: form.location,
      location_id: form.site_id,
      department: form.department,
      cost_centre: form.cost_centre,
      site_id: form.site_id,
      source: 'MANUAL',
      environment: 'LIVE',
      status: 'SUBMITTED',
      review_required: true,
      review_decision: null,
      review_notes: '',
      final_classification: null,
      incident_reference: form.incident_reference,
      evidence_reference: form.evidence_reference,
      posted_movement_id: null,
      created_by: actor,
      created_by_email: user?.email || '',
      created_at: now,
      updated_at: now,
    });

    await base44.entities.AuditLog.create({
      item_id: form.item_id,
      sku: form.sku,
      item_name: form.item_name,
      change_type: 'STOCK_WASTE',
      field_name: 'controlled_loss_event',
      old_value: '',
      new_value: JSON.stringify({
        stock_out_record_id: record?.id,
        stock_out_class: stockOutClass,
        quantity: Number(form.quantity),
        reason_category: form.reason_category,
        review_required: true,
        status: 'SUBMITTED',
      }),
      changed_by: actor,
      actor_role: user?.role || 'unknown',
      source_module: 'StockOut',
      action_type: 'CONTROLLED_LOSS_SUBMITTED_FOR_REVIEW',
      linked_source_record: record?.id,
      source_record_id: record?.id,
      notes: 'Controlled loss event submitted for manager review. No StockMovement was created.',
      environment: 'LIVE',
    });
  };

  const updateDraft = async () => {
    if (!initialRecord || initialRecord.status !== 'DRAFT') {
      throw new Error('Only DRAFT stock-out records can be edited.');
    }

    const user = await base44.auth.me().catch(() => null);
    const now = new Date().toISOString();

    await base44.entities.StockOutRecord.update(initialRecord.id, {
      quantity: Number(form.quantity),
      reason_category: form.reason_category,
      reason_notes: form.reason_notes,
      location: form.location,
      location_name: form.location,
      location_id: form.site_id,
      department: form.department,
      cost_centre: form.cost_centre,
      site_id: form.site_id,
      estimated_value: estimatedValue,
      incident_reference: form.incident_reference,
      evidence_reference: form.evidence_reference,
      environment: initialRecord.environment || 'LIVE',
      updated_at: now,
    });

    await base44.entities.AuditLog.create({
      item_id: initialRecord.item_id,
      sku: initialRecord.sku,
      item_name: initialRecord.item_name,
      change_type: 'STOCK_WASTE',
      field_name: 'stock_out_draft',
      old_value: JSON.stringify({
        quantity: initialRecord.quantity,
        reason_category: initialRecord.reason_category,
        reason_notes: initialRecord.reason_notes || '',
        location: initialRecord.location || '',
        department: initialRecord.department || '',
        cost_centre: initialRecord.cost_centre || '',
        site_id: initialRecord.site_id || '',
        incident_reference: initialRecord.incident_reference || '',
        evidence_reference: initialRecord.evidence_reference || '',
        estimated_value: originalEstimatedValue,
      }),
      new_value: JSON.stringify({
        quantity: Number(form.quantity),
        reason_category: form.reason_category,
        reason_notes: form.reason_notes || '',
        location: form.location || '',
        department: form.department || '',
        cost_centre: form.cost_centre || '',
        site_id: form.site_id || '',
        incident_reference: form.incident_reference || '',
        evidence_reference: form.evidence_reference || '',
        estimated_value: estimatedValue,
        changed_fields: changedFields,
        updated_at: now,
      }),
      changed_by: user?.email || user?.id || 'unknown',
      actor_role: user?.role || 'unknown',
      source_module: 'StockOut',
      action_type: 'STOCK_OUT_DRAFT_UPDATED',
      linked_source_record: initialRecord.id,
      source_record_id: initialRecord.id,
      notes: 'Draft stock-out updated before submission. No StockMovement was created.',
      environment: initialRecord.environment || 'LIVE',
    });
  };

  const handleSubmit = async () => {
    if (!form.item_id || !form.quantity || !form.reason_category) {
      alert('Please fill in required fields');
      return;
    }

    if (quantityInvalid) {
      alert('Please enter a valid quantity that does not exceed available stock');
      return;
    }

    if (isEditMode && !hasChanges) {
      alert('No draft changes to save');
      return;
    }

    setLoading(true);
    try {
      if (isEditMode) {
        await updateDraft();
      } else if (isControlledLoss) {
        await createControlledLossSubmission();
      } else {
        await createDraft();
      }
      onSuccess();
    } catch (error) {
      console.error(`Error ${isEditMode ? 'updating' : 'creating'} record:`, error);
      alert(`Failed to ${isEditMode ? 'save draft' : isControlledLoss ? 'submit controlled loss event' : 'create record'}`);
    } finally {
      setLoading(false);
    }
  };

  if (step === 'class') {
    return (
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
        <div className="bg-card rounded-2xl border border-border max-w-3xl w-full shadow-lg">
          <div className="flex items-center justify-between p-4 border-b border-border">
            <div>
              <h2 className="text-base font-semibold text-foreground">Record Stock-Out</h2>
              <p className="text-xs text-muted-foreground mt-1">Choose the safest stock-out class for this event.</p>
            </div>
            <button onClick={onClose} className="text-muted-foreground hover:text-foreground">
              <X size={18} />
            </button>
          </div>
          <div className="p-4 space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {RECORDABLE_STOCK_OUT_CLASSES.map((classKey) => {
                const config = getStockOutClassConfig(classKey);
                const controlled = requiresControlledLossReview(classKey);
                return (
                  <button
                    key={classKey}
                    onClick={() => {
                      setStockOutClass(classKey);
                      setStep('details');
                    }}
                    className="p-4 rounded-xl border-2 border-border hover:border-primary hover:bg-primary/5 transition-all text-left min-h-[118px]"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <p className="font-semibold text-sm text-foreground">{config.label}</p>
                      {controlled && (
                        <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-50 text-amber-700 border border-amber-200 font-medium">
                          Review
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground mt-2">{config.description}</p>
                  </button>
                );
              })}
            </div>
            <div className="rounded-xl border border-muted bg-muted/20 p-3">
              <p className="text-xs text-muted-foreground">
                Confirmed theft is intentionally not available as a staff entry type. It can only become a reviewed manager outcome later.
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
      <div className="bg-card rounded-2xl border border-border max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-lg">
        <div className="sticky top-0 flex items-center justify-between p-4 border-b border-border bg-card z-10">
          <div>
            <h2 className="text-base font-semibold text-foreground">
              {isEditMode ? 'Edit Stock-Out Draft' : `Record ${getStockOutClassLabel(stockOutClass)}`}
            </h2>
            <p className="text-xs text-muted-foreground mt-1">
              {isEditMode
                ? 'Correct draft details before submission. No stock movement has posted yet.'
                : isControlledLoss
                  ? 'Submit this controlled loss event for review. Stock will not adjust until approved.'
                  : 'Create a draft stock-out record'}
            </p>
          </div>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground">
            <X size={18} />
          </button>
        </div>

        <div className="p-4 space-y-4">
          {isControlledLoss && (
            <div className="rounded-xl border border-amber-200 bg-amber-50 p-3 flex gap-3">
              <AlertTriangle size={18} className="text-amber-700 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-semibold text-amber-900">Controlled Loss Review Required</p>
                <p className="text-xs text-amber-900 mt-1">
                  This event will be submitted for manager review and will not adjust stock until approved.
                </p>
              </div>
            </div>
          )}

          <div>
            <div className="flex items-center justify-between gap-3 mb-2">
              <label className="text-xs font-medium text-muted-foreground block">
                {isEditMode ? 'Selected Item' : 'Item'}
              </label>
              {form.item_id && !isEditMode && (
                <button
                  type="button"
                  onClick={handleChangeItem}
                  className="text-xs font-medium text-primary hover:underline"
                >
                  Change item
                </button>
              )}
            </div>

            {form.item_id ? (
              <div className="p-3 rounded-xl border border-primary bg-primary/5">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-sm font-semibold text-foreground">{form.item_name}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {form.sku || 'No SKU'} · Available stock: {selectedAvailableStock}
                    </p>
                    {isEditMode && (
                      <p className="text-[11px] text-muted-foreground mt-1">
                        Item is locked in edit mode. Delete this draft and create a new one if the item is wrong.
                      </p>
                    )}
                  </div>
                  <span className="inline-flex items-center gap-1 rounded-full bg-primary/10 px-2 py-1 text-[11px] font-medium text-primary">
                    <CheckCircle2 size={13} />
                    Selected
                  </span>
                </div>
              </div>
            ) : (
              <div className="space-y-3">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={16} />
                  <Input
                    value={itemSearch}
                    onChange={(e) => setItemSearch(e.target.value)}
                    placeholder="Search by item name, SKU, or barcode..."
                    className="pl-9"
                    autoFocus
                  />
                </div>

                <div className="flex items-center justify-between text-xs text-muted-foreground">
                  <span>{filteredItems.length} {filteredItems.length === 1 ? 'item' : 'items'} found</span>
                  {itemSearch && (
                    <button
                      type="button"
                      onClick={() => setItemSearch('')}
                      className="font-medium text-primary hover:underline"
                    >
                      Clear search
                    </button>
                  )}
                </div>

                {filteredItems.length > 0 ? (
                  <div className="space-y-2 max-h-[240px] overflow-y-auto pr-1">
                    {filteredItems.map(item => (
                      <button
                        key={item.id}
                        onClick={() => handleSelectItem(item)}
                        className="w-full p-3 rounded-xl border border-border hover:border-primary hover:bg-primary/5 text-left transition-colors"
                      >
                        <p className="text-sm font-medium text-foreground">{item.name}</p>
                        <p className="text-xs text-muted-foreground mt-0.5">
                          {item.sku || 'No SKU'} · Stock: {item.stock ?? 0}
                        </p>
                      </button>
                    ))}
                  </div>
                ) : (
                  <div className="rounded-xl border border-dashed border-border bg-muted/20 p-6 text-center">
                    <p className="text-sm font-medium text-foreground">No items found</p>
                    <p className="text-xs text-muted-foreground mt-1">Try searching by item name, SKU, or barcode.</p>
                  </div>
                )}
              </div>
            )}
          </div>

          {form.item_id && (
            <>
              <div className="rounded-xl border border-border bg-muted/20 p-3">
                <div className="flex items-center justify-between gap-3 flex-wrap">
                  <div>
                    <p className="text-xs font-medium text-muted-foreground">Event Type</p>
                    <p className="text-sm font-semibold text-foreground mt-0.5">{classConfig.label}</p>
                  </div>
                  {!isEditMode && (
                    <button
                      type="button"
                      onClick={() => setStep('class')}
                      className="px-3 h-8 rounded-lg border border-border text-xs font-medium hover:bg-muted"
                    >
                      Change type
                    </button>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-medium text-muted-foreground block mb-1.5">Quantity</label>
                  <Input
                    type="number"
                    min="1"
                    max={selectedAvailableStock || undefined}
                    value={form.quantity}
                    onChange={(e) => setForm(prev => ({ ...prev, quantity: e.target.value }))}
                    placeholder="0"
                    className={quantityInvalid ? 'border-destructive focus-visible:ring-destructive' : ''}
                  />
                  {quantityInvalid && (
                    <p className="text-[11px] text-destructive mt-1">
                      Quantity must be 1{selectedAvailableStock > 0 ? `–${selectedAvailableStock}` : ' or more'}.
                    </p>
                  )}
                </div>
                <div>
                  <label className="text-xs font-medium text-muted-foreground block mb-1.5">Reason</label>
                  <select
                    value={form.reason_category}
                    onChange={(e) => setForm(prev => ({ ...prev, reason_category: e.target.value }))}
                    className="w-full h-10 rounded-xl border border-input bg-background px-3 text-sm"
                  >
                    <option value="">Select...</option>
                    {reasonOptions.map(([value, label]) => (
                      <option key={value} value={value}>{label}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-medium text-muted-foreground block mb-1.5">Site / Branch</label>
                  <select
                    value={form.site_id}
                    onChange={(e) => {
                      const selectedSite = sites.find(site => site.id === e.target.value);
                      setForm(prev => ({
                        ...prev,
                        site_id: e.target.value,
                        location: selectedSite?.name || prev.location,
                      }));
                    }}
                    className="w-full h-10 rounded-xl border border-input bg-background px-3 text-sm"
                  >
                    <option value="">No site selected</option>
                    {sites.map(site => (
                      <option key={site.id} value={site.id}>{site.name}</option>
                    ))}
                  </select>
                  <p className="text-[11px] text-muted-foreground mt-1">Selecting a site enables site-level stock guards.</p>
                </div>
                <div>
                  <label className="text-xs font-medium text-muted-foreground block mb-1.5">Location / Zone</label>
                  <Input
                    value={form.location}
                    onChange={(e) => setForm(prev => ({ ...prev, location: e.target.value }))}
                    placeholder="e.g., Floor 2, Storage A"
                  />
                </div>
              </div>

              {stockOutClass === 'STORE_USE' && (
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs font-medium text-muted-foreground block mb-1.5">Department</label>
                    <Input
                      value={form.department}
                      onChange={(e) => setForm(prev => ({ ...prev, department: e.target.value }))}
                      placeholder="e.g., Facility Ops"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-medium text-muted-foreground block mb-1.5">Cost Centre</label>
                    <Input
                      value={form.cost_centre}
                      onChange={(e) => setForm(prev => ({ ...prev, cost_centre: e.target.value }))}
                      placeholder="e.g., CC-101"
                    />
                  </div>
                </div>
              )}

              {isControlledLoss && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs font-medium text-muted-foreground block mb-1.5">Incident Reference</label>
                    <Input
                      value={form.incident_reference}
                      onChange={(e) => setForm(prev => ({ ...prev, incident_reference: e.target.value }))}
                      placeholder="Optional reference only"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-medium text-muted-foreground block mb-1.5">Evidence Reference</label>
                    <Input
                      value={form.evidence_reference}
                      onChange={(e) => setForm(prev => ({ ...prev, evidence_reference: e.target.value }))}
                      placeholder="Optional reference only"
                    />
                  </div>
                </div>
              )}

              <div>
                <label className="text-xs font-medium text-muted-foreground block mb-1.5">Additional Notes</label>
                <textarea
                  value={form.reason_notes}
                  onChange={(e) => setForm(prev => ({ ...prev, reason_notes: e.target.value }))}
                  placeholder={isControlledLoss ? 'Describe the stock observation without naming or accusing people.' : 'Optional context...'}
                  className="w-full p-3 rounded-xl border border-input bg-background text-sm resize-none"
                  rows="3"
                />
              </div>

              {isEditMode && hasChanges && (
                <div className="rounded-xl border border-amber-200 bg-amber-50 p-3">
                  <p className="text-xs font-semibold text-amber-900 mb-2">Draft Change Preview</p>
                  <div className="space-y-1 text-xs text-amber-900">
                    {changedFields.map(change => (
                      <p key={change.field}>
                        {change.field.replaceAll('_', ' ')}: <span className="font-medium">{String(change.old_value || 'Blank')}</span> → <span className="font-medium">{String(change.new_value || 'Blank')}</span>
                      </p>
                    ))}
                    {estimatedValueChanged && (
                      <p>
                        Estimated value: <span className="font-medium">{formatMoney(originalEstimatedValue)}</span> → <span className="font-medium">{formatMoney(estimatedValue)}</span>
                      </p>
                    )}
                    <p className="font-medium">Stock movement: None until approval</p>
                  </div>
                </div>
              )}
            </>
          )}
        </div>

        <div className="sticky bottom-0 flex items-center justify-between gap-3 p-4 border-t border-border bg-card">
          <p className="hidden sm:block text-xs text-muted-foreground">
            {isEditMode
              ? 'Draft changes are audit logged. No stock movement posts until approval.'
              : isControlledLoss
                ? 'Controlled loss events are review-only until a manager posts them.'
                : 'Stock movement will only post after approval.'}
          </p>
          <div className="flex items-center gap-2 ml-auto">
            <button
              onClick={onClose}
              className="px-4 h-9 rounded-xl border border-border text-sm font-medium text-foreground hover:bg-muted transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleSubmit}
              disabled={!canSaveDraft}
              className="px-4 h-9 rounded-xl bg-primary text-primary-foreground text-sm font-medium hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed transition-opacity"
            >
              {loading
                ? (isEditMode ? 'Saving...' : isControlledLoss ? 'Submitting...' : 'Creating...')
                : (isEditMode ? 'Save Draft' : isControlledLoss ? 'Submit for Review' : 'Create Draft')}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
