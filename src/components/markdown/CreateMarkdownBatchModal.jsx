import { useEffect, useMemo, useState } from 'react';
import { base44 } from '@/api/base44Client';
import {
  AlertCircle,
  CheckCircle2,
  ClipboardCheck,
  ScanLine,
  Search,
  Tag,
  X,
} from 'lucide-react';

const REASONS = [
  { key: 'near_expiry', label: 'Near expiry' },
  { key: 'short_dated', label: 'Short dated' },
  { key: 'quality_recovery', label: 'Quality recovery' },
  { key: 'packaging_damage', label: 'Packaging damage' },
  { key: 'manager_direction', label: 'Manager direction' },
];

const CAPTURE_METHODS = [
  { key: 'handheld_scan', label: 'Handheld scan' },
  { key: 'shelf_count', label: 'Shelf count' },
  { key: 'manual_fallback', label: 'Manual fallback' },
];

const moneyFields = ['retail_price', 'sale_price', 'unit_price', 'price', 'cost_per_unit'];

function formatMoney(value) {
  if (value === null || value === undefined || value === '' || Number.isNaN(Number(value))) return '—';
  return `₱${Number(value).toFixed(2)}`;
}

function getItemPrice(item) {
  if (!item) return '';
  const found = moneyFields.find((field) => item[field] !== null && item[field] !== undefined && item[field] !== '');
  return found ? String(item[found]) : '';
}

function getStock(item) {
  return Number(item?.stock ?? item?.on_hand_qty ?? item?.quantity_on_hand ?? 0);
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

export default function CreateMarkdownBatchModal({ onClose, onCreated }) {
  const [items, setItems] = useState([]);
  const [query, setQuery] = useState('');
  const [form, setForm] = useState({
    item_id: '',
    allocated_qty: '',
    site_id: '',
    capture_method: 'handheld_scan',
    markdown_reason: 'near_expiry',
    initial_original_price: '',
    initial_markdown_price: '',
    initial_expiry_date: '',
    request_notes: '',
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [result, setResult] = useState(null);

  useEffect(() => {
    let mounted = true;
    base44.entities.InventoryItem.filter({ environment: 'LIVE', is_active: true }, 'name', 300)
      .then((data) => {
        if (mounted) setItems(data || []);
      })
      .catch(() => {
        if (mounted) setItems([]);
      });
    return () => { mounted = false; };
  }, []);

  const selectedItem = items.find((item) => item.id === form.item_id);

  const filteredItems = useMemo(() => {
    const search = query.trim().toLowerCase();
    const source = search
      ? items.filter((item) => [item.name, item.sku, item.barcode, item.item_code]
        .filter(Boolean)
        .some((value) => String(value).toLowerCase().includes(search)))
      : items;
    return source.slice(0, 8);
  }, [items, query]);

  const selectedStock = getStock(selectedItem);
  const originalPrice = Number(form.initial_original_price || 0);
  const markdownPrice = Number(form.initial_markdown_price || 0);
  const discountPercent = originalPrice > 0 && markdownPrice > 0
    ? Math.max(0, Math.round((1 - markdownPrice / originalPrice) * 10000) / 100)
    : null;

  const selectItem = (item) => {
    const fallbackPrice = getItemPrice(item);
    setForm((current) => ({
      ...current,
      item_id: item.id,
      initial_original_price: current.initial_original_price || fallbackPrice,
    }));
    setQuery(`${item.name || 'Unnamed item'} ${item.sku ? `(${item.sku})` : ''}`);
    setError('');
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (!selectedItem) {
      setError('Scan, search, or select the item being marked down.');
      return;
    }

    const allocatedQty = Number(form.allocated_qty);
    if (!allocatedQty || allocatedQty <= 0) {
      setError('Enter the counted markdown quantity from the shelf or handheld scan.');
      return;
    }

    if (allocatedQty > selectedStock) {
      setError(`Counted markdown quantity (${allocatedQty}) exceeds available stock (${selectedStock}).`);
      return;
    }

    if (!form.initial_expiry_date) {
      setError('Enter the expiry / sell-by date that will control the markdown label.');
      return;
    }

    if (!originalPrice || originalPrice <= 0 || !markdownPrice || markdownPrice <= 0) {
      setError('Enter both the original price and the proposed markdown price.');
      return;
    }

    if (markdownPrice > originalPrice) {
      setError('Markdown price cannot be higher than the original price.');
      return;
    }

    setSaving(true);
    setError('');

    try {
      const res = await base44.functions.invoke('createMarkdownBatch', {
        sku: selectedItem.sku,
        item_id: selectedItem.id,
        item_name: selectedItem.name,
        allocated_qty: allocatedQty,
        site_id: form.site_id,
        environment: 'LIVE',
        capture_method: form.capture_method,
        markdown_reason: form.markdown_reason,
        initial_original_price: originalPrice,
        initial_markdown_price: markdownPrice,
        initial_expiry_date: form.initial_expiry_date,
        label_qty: allocatedQty,
        request_notes: form.request_notes,
        scanner_session_ref: query.trim(),
        requested_source: 'MarkdownControlBoard',
      });

      if (res.data?.success) {
        setResult(res.data);
        onCreated();
      } else {
        setError(res.data?.error || 'Failed to submit markdown request.');
      }
    } catch (submitError) {
      setError(submitError?.message || 'Failed to submit markdown request.');
    } finally {
      setSaving(false);
    }
  };

  if (result) {
    return (
      <div className="fixed inset-0 z-50 bg-black/30 flex items-center justify-center p-4">
        <div className="w-full max-w-md bg-card border border-border rounded-xl shadow-xl p-6 text-center">
          <div className="w-12 h-12 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-4">
            <CheckCircle2 className="text-green-600" size={24} />
          </div>
          <h2 className="text-lg font-semibold text-foreground mb-1">Markdown Request Submitted</h2>
          <p className="text-sm text-muted-foreground mb-3">
            {result.batch?.batch_ref || 'Batch'} — {(result.batch?.status || '').replace(/_/g, ' ')}
          </p>
          <div className="mb-4 p-3 rounded-lg border border-border bg-muted/30 text-xs text-muted-foreground text-left space-y-1">
            <p><strong className="text-foreground">Item:</strong> {result.batch?.item_name || selectedItem?.name || '—'}</p>
            <p><strong className="text-foreground">Qty:</strong> {result.batch?.allocated_qty || form.allocated_qty}</p>
            {result.round1 && <p><strong className="text-foreground">Round 1:</strong> {formatMoney(result.round1.markdown_unit_price)} · expires {result.round1.expiry_date}</p>}
          </div>
          {result.requires_approval ? (
            <div className="mb-4 p-3 rounded-lg border border-amber-200 bg-amber-50 text-xs text-amber-700">
              This request is staged for Supervisor/Manager approval before labels can be printed.
            </div>
          ) : (
            <div className="mb-4 p-3 rounded-lg border border-green-200 bg-green-50 text-xs text-green-700">
              Approved-role request created. Round 1 is ready for controlled label printing.
            </div>
          )}
          <button onClick={onClose} className="h-9 px-6 bg-primary text-primary-foreground rounded hover:opacity-90 text-sm">
            Done
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-50 bg-black/30 flex items-center justify-center p-4">
      <div className="w-full max-w-3xl bg-card border border-border rounded-xl shadow-xl max-h-[92vh] overflow-hidden flex flex-col">
        <div className="flex items-center justify-between px-5 py-4 border-b border-border">
          <div>
            <h2 className="text-base font-semibold text-foreground">Start Markdown Request</h2>
            <p className="text-xs text-muted-foreground mt-0.5">Scan/select item → confirm shelf count → propose label price/date → submit for approval</p>
          </div>
          <button onClick={onClose} className="w-7 h-7 flex items-center justify-center rounded hover:bg-muted text-muted-foreground">
            <X size={15} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 space-y-5 overflow-y-auto">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-3">
            <div className="rounded-xl border border-border bg-muted/20 p-3">
              <div className="flex items-center gap-2 text-sm font-semibold text-foreground"><ScanLine size={16} /> 1. Identify item</div>
              <p className="text-xs text-muted-foreground mt-1">Use scanner input, SKU, barcode, or item name.</p>
            </div>
            <div className="rounded-xl border border-border bg-muted/20 p-3">
              <div className="flex items-center gap-2 text-sm font-semibold text-foreground"><ClipboardCheck size={16} /> 2. Count floor qty</div>
              <p className="text-xs text-muted-foreground mt-1">Only counted units enter the markdown request.</p>
            </div>
            <div className="rounded-xl border border-border bg-muted/20 p-3">
              <div className="flex items-center gap-2 text-sm font-semibold text-foreground"><Tag size={16} /> 3. Price/date label</div>
              <p className="text-xs text-muted-foreground mt-1">Approval controls Round 1 before printing.</p>
            </div>
          </div>

          <section className="space-y-2">
            <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Scan barcode / Search SKU or item *</label>
            <div className="relative">
              <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
              <input
                value={query}
                onChange={(event) => { setQuery(event.target.value); setForm((current) => ({ ...current, item_id: '' })); setError(''); }}
                placeholder="Scan barcode or search by SKU / item name"
                className="w-full h-10 border border-border rounded-lg pl-9 pr-3 text-sm bg-background focus:outline-none focus:ring-1 focus:ring-ring"
              />
            </div>

            {!selectedItem && (
              <div className="border border-border rounded-xl divide-y divide-border max-h-56 overflow-y-auto">
                {filteredItems.length === 0 ? (
                  <div className="px-3 py-5 text-sm text-muted-foreground text-center">No matching active items found.</div>
                ) : filteredItems.map((item) => (
                  <button
                    type="button"
                    key={item.id}
                    onClick={() => selectItem(item)}
                    className="w-full px-3 py-2.5 text-left hover:bg-muted/50 transition-colors"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <p className="text-sm font-semibold text-foreground truncate">{item.name || 'Unnamed item'}</p>
                        <p className="text-xs text-muted-foreground font-mono truncate">{item.sku || 'No SKU'}{item.barcode ? ` · ${item.barcode}` : ''}</p>
                      </div>
                      <span className="text-xs text-muted-foreground whitespace-nowrap">{getStock(item)} on hand</span>
                    </div>
                  </button>
                ))}
              </div>
            )}

            {selectedItem && (
              <div className="p-3 rounded-xl bg-muted/40 border border-border text-xs grid grid-cols-2 md:grid-cols-4 gap-3">
                <div><span className="block font-semibold text-foreground">Selected Item</span><span className="text-muted-foreground">{selectedItem.name}</span></div>
                <div><span className="block font-semibold text-foreground">SKU</span><span className="text-muted-foreground font-mono">{selectedItem.sku || '—'}</span></div>
                <div><span className="block font-semibold text-foreground">On Hand</span><span className="text-muted-foreground">{selectedStock} {selectedItem.unit || selectedItem.uom || ''}</span></div>
                <div><span className="block font-semibold text-foreground">Known Price</span><span className="text-muted-foreground">{formatMoney(getItemPrice(selectedItem))}</span></div>
              </div>
            )}
          </section>

          <section className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Counted markdown quantity *</label>
              <input
                type="number"
                min="1"
                max={selectedItem ? selectedStock : undefined}
                value={form.allocated_qty}
                onChange={(event) => { setForm((current) => ({ ...current, allocated_qty: event.target.value })); setError(''); }}
                placeholder="e.g. 24"
                className="w-full h-10 border border-border rounded-lg px-3 text-sm bg-background focus:outline-none focus:ring-1 focus:ring-ring"
                required
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Expiry / sell-by date *</label>
              <input
                type="date"
                value={form.initial_expiry_date}
                onChange={(event) => { setForm((current) => ({ ...current, initial_expiry_date: event.target.value })); setError(''); }}
                className="w-full h-10 border border-border rounded-lg px-3 text-sm bg-background focus:outline-none focus:ring-1 focus:ring-ring"
                required
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Original shelf price (₱) *</label>
              <input
                type="number"
                step="0.01"
                min="0.01"
                value={form.initial_original_price}
                onChange={(event) => { setForm((current) => ({ ...current, initial_original_price: event.target.value })); setError(''); }}
                placeholder="Full price before markdown"
                className="w-full h-10 border border-border rounded-lg px-3 text-sm bg-background focus:outline-none focus:ring-1 focus:ring-ring"
                required
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Proposed markdown price (₱) *</label>
              <input
                type="number"
                step="0.01"
                min="0.01"
                value={form.initial_markdown_price}
                onChange={(event) => { setForm((current) => ({ ...current, initial_markdown_price: event.target.value })); setError(''); }}
                placeholder="New label price"
                className="w-full h-10 border border-border rounded-lg px-3 text-sm bg-background focus:outline-none focus:ring-1 focus:ring-ring"
                required
              />
              {discountPercent !== null && <p className="text-xs text-muted-foreground">Calculated markdown: {discountPercent.toFixed(1)}% off</p>}
            </div>
          </section>

          <section className="space-y-3">
            <div>
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-2">Capture method</p>
              <div className="flex flex-wrap gap-2">
                {CAPTURE_METHODS.map((method) => (
                  <PillButton
                    key={method.key}
                    active={form.capture_method === method.key}
                    onClick={() => setForm((current) => ({ ...current, capture_method: method.key }))}
                  >
                    {method.label}
                  </PillButton>
                ))}
              </div>
            </div>

            <div>
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-2">Markdown reason</p>
              <div className="flex flex-wrap gap-2">
                {REASONS.map((reason) => (
                  <PillButton
                    key={reason.key}
                    active={form.markdown_reason === reason.key}
                    onClick={() => setForm((current) => ({ ...current, markdown_reason: reason.key }))}
                  >
                    {reason.label}
                  </PillButton>
                ))}
              </div>
            </div>
          </section>

          <div className="space-y-1.5">
            <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Operator notes</label>
            <textarea
              value={form.request_notes}
              onChange={(event) => setForm((current) => ({ ...current, request_notes: event.target.value }))}
              placeholder="Optional: shelf location, reason detail, scanner/session note"
              rows={2}
              className="w-full border border-border rounded-lg px-3 py-2 text-sm bg-background focus:outline-none focus:ring-1 focus:ring-ring resize-none"
            />
          </div>

          <div className="p-3 rounded-lg border border-amber-200 bg-amber-50 text-xs text-amber-800">
            <strong>Governance:</strong> This stages a controlled markdown request. KPI cards remain read-only. Stock is not deducted at request stage; final stock movement still depends on POS sale, recovery, or confirmed disposition.
          </div>

          {error && (
            <div className="flex items-start gap-2 p-3 rounded border border-red-200 bg-red-50 text-xs text-red-700">
              <AlertCircle size={13} className="mt-0.5 flex-shrink-0" />
              {error}
            </div>
          )}

          <div className="flex justify-end gap-2 pt-1 border-t border-border pt-4">
            <button type="button" onClick={onClose} className="h-9 px-4 text-sm border border-border rounded hover:bg-muted">Cancel</button>
            <button type="submit" disabled={saving} className="h-9 px-4 text-sm bg-primary text-primary-foreground rounded hover:opacity-90 disabled:opacity-50">
              {saving ? 'Submitting…' : 'Submit Markdown Request'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
