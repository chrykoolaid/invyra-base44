import { useState, useEffect, useCallback } from 'react';
import { base44 } from '@/api/base44Client';
import { envFilter, ENV_LIVE } from '@/lib/envFilter';
import {
  Plus, RefreshCw, Upload, X, Eye
} from 'lucide-react';
import BulkStockUpload from '@/components/BulkStockUpload';
import ReorderHeatmap from '@/components/inventory/ReorderHeatmap';
import ItemDetailsWorkspace from '@/components/ItemDetailsWorkspace';
import {
  getLocalDevInventoryItems,
  isLocalDevInventoryFallbackEnabled,
  localDevInventoryFallbackNotice,
  withLocalDevTimeout,
} from '@/lib/localDevInventoryFallback';

const actions = [
  { label: 'Add / Update Item', icon: Plus },
  { label: 'Reload', icon: RefreshCw },
];

const blankItemForm = {
  sku: '',
  name: '',
  unit: 'pcs',
  cost_per_unit: '',
  preferred_supplier: '',
  reorder_point: '',
  reorder_qty: '',
  is_active: true,
};

function itemFormFromRecord(item) {
  if (!item) return blankItemForm;
  return {
    sku: item.sku || '',
    name: item.name || '',
    unit: item.unit || 'pcs',
    cost_per_unit: item.cost_per_unit ?? '',
    preferred_supplier: item.preferred_supplier || '',
    reorder_point: item.reorder_point ?? '',
    reorder_qty: item.reorder_qty ?? '',
    is_active: item.is_active !== false,
  };
}

function parseOptionalNumber(value) {
  if (value === '' || value === null || value === undefined) return null;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : NaN;
}

function ItemMasterModal({ item, items, onClose, onSaved }) {
  const [form, setForm] = useState(() => itemFormFromRecord(item));
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const isEditMode = Boolean(item?.id);

  const updateField = (field, value) => {
    setForm(prev => ({ ...prev, [field]: value }));
    setError('');
    setSuccess('');
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (saving) return;

    const sku = form.sku.trim().toUpperCase();
    const name = form.name.trim();
    if (!sku) {
      setError('SKU is required.');
      return;
    }
    if (!name) {
      setError('Item name is required.');
      return;
    }

    const cost = parseOptionalNumber(form.cost_per_unit);
    const reorderPoint = parseOptionalNumber(form.reorder_point);
    const reorderQty = parseOptionalNumber(form.reorder_qty);
    if ([cost, reorderPoint, reorderQty].some(value => Number.isNaN(value))) {
      setError('Unit price, reorder point, and reorder quantity must be valid numbers.');
      return;
    }
    if ([cost, reorderPoint, reorderQty].some(value => value !== null && value < 0)) {
      setError('Unit price, reorder point, and reorder quantity cannot be negative.');
      return;
    }

    setSaving(true);
    try {
      const user = await base44.auth.me();
      const changedBy = user?.email || user?.full_name || 'unknown';
      const actorRole = user?.role || user?.app_role || 'unknown';

      const existingMatch = items.find(row =>
        row.environment === ENV_LIVE &&
        (row.sku || '').toUpperCase() === sku &&
        row.id !== item?.id
      );

      const target = existingMatch || item;
      const payload = {
        sku,
        name,
        unit: form.unit.trim() || 'pcs',
        cost_per_unit: cost,
        preferred_supplier: form.preferred_supplier.trim(),
        reorder_point: reorderPoint,
        reorder_qty: reorderQty,
        is_active: form.is_active,
        environment: ENV_LIVE,
      };

      let saved;
      let changeType;
      let oldValue;

      if (target?.id) {
        oldValue = JSON.stringify({
          sku: target.sku || '',
          name: target.name || '',
          unit: target.unit || '',
          cost_per_unit: target.cost_per_unit ?? null,
          preferred_supplier: target.preferred_supplier || '',
          reorder_point: target.reorder_point ?? null,
          reorder_qty: target.reorder_qty ?? null,
          is_active: target.is_active !== false,
        });
        saved = await base44.entities.InventoryItem.update(target.id, payload);
        changeType = 'ITEM_UPDATE';
      } else {
        saved = await base44.entities.InventoryItem.create({
          ...payload,
          stock: 0,
          stock_per_site: {},
        });
        changeType = 'ITEM_CREATE';
        oldValue = '';
      }

      const savedId = saved?.id || target?.id;
      await base44.entities.AuditLog.create({
        item_id: savedId,
        sku,
        item_name: name,
        change_type: changeType,
        field_name: 'item_master',
        old_value: oldValue,
        new_value: JSON.stringify({ ...payload, stock: target?.stock ?? 0 }),
        changed_by: changedBy,
        actor_role: actorRole,
        source_module: 'Inventory',
        action_type: changeType,
        linked_source_record: savedId,
        source_record_id: savedId,
        notes: target?.id || existingMatch?.id
          ? 'LIVE item master updated. Stock-on-hand was not changed by Add / Update Item.'
          : 'LIVE item master created at 0 stock. Opening balance must be posted through Adjustments.',
        environment: ENV_LIVE,
      });

      setSuccess(target?.id || existingMatch?.id
        ? 'LIVE item master updated. Stock was not changed.'
        : 'LIVE item master created at 0 stock. Add opening stock through Adjustments.'
      );
      await onSaved();
      setTimeout(onClose, 500);
    } catch (err) {
      setError(err?.message || 'Could not save the LIVE item master.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/30 flex items-center justify-center p-4">
      <div className="w-full max-w-2xl bg-card border border-border rounded-lg shadow-xl">
        <div className="flex items-center justify-between px-5 py-4 border-b border-border">
          <div>
            <h2 className="text-lg font-semibold text-foreground">Add / Update LIVE Item</h2>
            <p className="text-xs text-muted-foreground mt-1">
              Item master only. Stock starts at 0 and opening balances must be posted through Adjustments.
            </p>
          </div>
          <button
            onClick={onClose}
            className="h-8 w-8 flex items-center justify-center rounded hover:bg-muted text-muted-foreground"
            aria-label="Close add/update item"
          >
            <X size={16} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="px-5 py-4 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <label className="space-y-1.5">
              <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">SKU *</span>
              <input
                type="text"
                value={form.sku}
                onChange={event => updateField('sku', event.target.value)}
                placeholder="LIVE-TEST-001"
                className="h-9 w-full border border-border rounded px-3 text-sm bg-background focus:outline-none focus:ring-1 focus:ring-ring"
                disabled={saving}
              />
            </label>

            <label className="space-y-1.5">
              <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Item name *</span>
              <input
                type="text"
                value={form.name}
                onChange={event => updateField('name', event.target.value)}
                placeholder="Live Verification Item"
                className="h-9 w-full border border-border rounded px-3 text-sm bg-background focus:outline-none focus:ring-1 focus:ring-ring"
                disabled={saving}
              />
            </label>

            <label className="space-y-1.5">
              <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Unit</span>
              <input
                type="text"
                value={form.unit}
                onChange={event => updateField('unit', event.target.value)}
                placeholder="pcs"
                className="h-9 w-full border border-border rounded px-3 text-sm bg-background focus:outline-none focus:ring-1 focus:ring-ring"
                disabled={saving}
              />
            </label>

            <label className="space-y-1.5">
              <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Unit price</span>
              <input
                type="number"
                min="0"
                step="0.01"
                value={form.cost_per_unit}
                onChange={event => updateField('cost_per_unit', event.target.value)}
                placeholder="10.00"
                className="h-9 w-full border border-border rounded px-3 text-sm bg-background focus:outline-none focus:ring-1 focus:ring-ring"
                disabled={saving}
              />
            </label>

            <label className="space-y-1.5">
              <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Reorder point</span>
              <input
                type="number"
                min="0"
                step="1"
                value={form.reorder_point}
                onChange={event => updateField('reorder_point', event.target.value)}
                placeholder="5"
                className="h-9 w-full border border-border rounded px-3 text-sm bg-background focus:outline-none focus:ring-1 focus:ring-ring"
                disabled={saving}
              />
            </label>

            <label className="space-y-1.5">
              <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Reorder qty</span>
              <input
                type="number"
                min="0"
                step="1"
                value={form.reorder_qty}
                onChange={event => updateField('reorder_qty', event.target.value)}
                placeholder="20"
                className="h-9 w-full border border-border rounded px-3 text-sm bg-background focus:outline-none focus:ring-1 focus:ring-ring"
                disabled={saving}
              />
            </label>
          </div>

          <label className="space-y-1.5 block">
            <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Preferred supplier</span>
            <input
              type="text"
              value={form.preferred_supplier}
              onChange={event => updateField('preferred_supplier', event.target.value)}
              placeholder="Test Supplier"
              className="h-9 w-full border border-border rounded px-3 text-sm bg-background focus:outline-none focus:ring-1 focus:ring-ring"
              disabled={saving}
            />
          </label>

          <div className="rounded border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
            <strong>Verification rule:</strong> this form does not post stock. New LIVE items are created with stock 0. Use Adjustments to post opening balance and create movement/audit proof.
          </div>

          <label className="flex items-center gap-2 text-sm text-foreground">
            <input
              type="checkbox"
              checked={form.is_active}
              onChange={event => updateField('is_active', event.target.checked)}
              disabled={saving}
            />
            Active LIVE item
          </label>

          {error && <div className="rounded border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">{error}</div>}
          {success && <div className="rounded border border-green-200 bg-green-50 px-3 py-2 text-sm text-green-700">{success}</div>}

          <div className="flex items-center justify-end gap-2 pt-2 border-t border-border">
            <button
              type="button"
              onClick={onClose}
              className="h-9 px-4 text-sm border border-border rounded hover:bg-muted transition-colors"
              disabled={saving}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="h-9 px-4 text-sm bg-primary text-primary-foreground rounded hover:opacity-90 disabled:opacity-50 transition-opacity"
              disabled={saving}
            >
              {saving ? 'Saving…' : isEditMode ? 'Update LIVE Item' : 'Save LIVE Item'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default function Inventory() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadNotice, setLoadNotice] = useState('');
  const [query, setQuery] = useState('');
  const [search, setSearch] = useState('');
  const [selected, setSelected] = useState(new Set());
  const [showBulkUpload, setShowBulkUpload] = useState(false);
  const [showItemMaster, setShowItemMaster] = useState(false);
  const [editingPrice, setEditingPrice] = useState(null);
  const [priceInput, setPriceInput] = useState('');
  const [detailsItem, setDetailsItem] = useState(null);

  const loadItems = useCallback(async () => {
    setLoading(true);
    setLoadNotice('');

    try {
      const request = base44.entities.InventoryItem.filter({ ...envFilter(), is_active: true }, '-updated_date', 200);
      const rows = await withLocalDevTimeout(request, 4000, 'InventoryItem.filter');
      setItems(rows || []);
    } catch (err) {
      if (isLocalDevInventoryFallbackEnabled()) {
        setItems(getLocalDevInventoryItems());
        setLoadNotice(localDevInventoryFallbackNotice('Inventory items'));
      } else {
        setItems([]);
        setLoadNotice(err?.message || 'Could not load inventory items.');
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadItems(); }, [loadItems]);

  const filtered = items.filter(item =>
    (item.name || '').toLowerCase().includes(search.toLowerCase()) ||
    (item.sku || '').toLowerCase().includes(search.toLowerCase()) ||
    (item.unit || '').toLowerCase().includes(search.toLowerCase())
  );

  const toggleRow = (id) => {
    setSelected(prev => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  const toggleAll = () => {
    setSelected(prev => prev.size === filtered.length ? new Set() : new Set(filtered.map(i => i.id)));
  };

  const handlePriceEdit = (item) => {
    setEditingPrice(item.id);
    setPriceInput(item.cost_per_unit ? String(item.cost_per_unit) : '');
  };

  const handlePriceSave = async () => {
    if (!editingPrice) return;
    const price = priceInput.trim() ? parseFloat(priceInput) : null;
    if (price !== null && isNaN(price)) return;
    
    const item = items.find(i => i.id === editingPrice);
    if (!item) return;

    const user = await base44.auth.me();
    const changedBy = user?.email || user?.full_name || 'unknown';

    await base44.entities.InventoryItem.update(editingPrice, { cost_per_unit: price, environment: ENV_LIVE });

    // Log the audit entry — scoped to LIVE environment
    await base44.entities.AuditLog.create({
      item_id: editingPrice,
      sku: item.sku,
      item_name: item.name,
      change_type: 'PRICE_UPDATE',
      field_name: 'cost_per_unit',
      old_value: String(item.cost_per_unit || ''),
      new_value: String(price || ''),
      changed_by: changedBy,
      actor_role: user?.role || user?.app_role || 'unknown',
      source_module: 'Inventory',
      action_type: 'PRICE_UPDATE',
      linked_source_record: editingPrice,
      environment: ENV_LIVE,
    });

    setItems(prev => prev.map(i => i.id === editingPrice ? { ...i, cost_per_unit: price } : i));
    setEditingPrice(null);
    setPriceInput('');
  };

  const selectedItemForForm = selected.size === 1
    ? items.find(item => selected.has(item.id))
    : null;

  if (detailsItem) {
    return (
      <ItemDetailsWorkspace
        item={detailsItem}
        onBack={() => {
          setDetailsItem(null);
          loadItems();
        }}
      />
    );
  }

  return (
    <div className="p-6">
      {showItemMaster && (
        <ItemMasterModal
          item={selectedItemForForm}
          items={items}
          onClose={() => setShowItemMaster(false)}
          onSaved={loadItems}
        />
      )}

      {showBulkUpload && (
        <BulkStockUpload
          allItems={items}
          onClose={() => setShowBulkUpload(false)}
          onDone={loadItems}
        />
      )}

      {/* Title */}
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-xl font-semibold text-foreground">Inventory</h1>
        <button
          onClick={() => setShowBulkUpload(true)}
          className="flex items-center gap-1.5 h-8 px-3 text-sm border border-border rounded bg-card hover:bg-muted transition-colors text-foreground"
        >
          <Upload size={13} /> Bulk Stock Update
        </button>
      </div>

      {loadNotice && (
        <div className="mb-4 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
          {loadNotice}
        </div>
      )}

      {/* Search row */}
      <div className="flex items-center gap-2 mb-4">
        <input
          type="text"
          value={query}
          onChange={e => setQuery(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && setSearch(query)}
          placeholder="Search by SKU, name, or supplier…"
          className="h-8 w-80 border border-border rounded px-3 text-sm focus:outline-none focus:ring-1 focus:ring-ring bg-card"
        />
        <button
          onClick={() => setSearch(query)}
          className="h-8 px-3 text-sm bg-primary text-primary-foreground rounded hover:opacity-90 transition-opacity"
        >
          Search
        </button>
        <button
          onClick={() => { setQuery(''); setSearch(''); }}
          className="h-8 px-3 text-sm border border-border rounded hover:bg-muted transition-colors text-foreground"
        >
          Clear
        </button>
      </div>

      {/* Action row */}
      <div className="flex flex-wrap items-center gap-2 mb-5">
        {actions.map(({ label, icon: Icon }) => (
          <button
            key={label}
            onClick={
              label === 'Add / Update Item' ? () => setShowItemMaster(true) :
              label === 'Reload' ? loadItems :
              undefined
            }
            className="flex items-center gap-1.5 h-8 px-3 text-sm border border-border rounded bg-card hover:bg-muted transition-colors text-foreground"
          >
            <Icon size={13} className={label === 'Reload' && loading ? 'animate-spin' : ''} />
            {label}
          </button>
        ))}
      </div>

      {/* Reorder Heatmap */}
      {!loading && <ReorderHeatmap items={filtered} />}

      {/* Table */}
      <div className="border border-border rounded overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-muted text-muted-foreground text-xs uppercase tracking-wide">
            <tr>
              <th className="px-4 py-2.5 w-8">
                <input
                  type="checkbox"
                  checked={filtered.length > 0 && selected.size === filtered.length}
                  onChange={toggleAll}
                  className="cursor-pointer"
                />
              </th>
              {['SKU', 'Name', 'On Hand', 'Unit', 'Unit Price', 'Reorder Point', 'Reorder Qty'].map(h => (
                <th key={h} className="text-left px-4 py-2.5 font-medium whitespace-nowrap">{h}</th>
              ))}
              <th className="text-left px-4 py-2.5 font-medium whitespace-nowrap">Action</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={9} className="px-4 py-8 text-center text-muted-foreground text-sm">Loading inventory…</td></tr>
            ) : filtered.map((item, i) => {
              const stock = item.stock ?? 0;
              const rp = item.reorder_point;
              const isOut = rp != null && stock <= 0;
              const isCritical = rp != null && stock > 0 && stock <= rp;
              const isLow = rp != null && stock > rp && stock <= rp * 1.5;
              const rowHeat = isOut ? 'bg-red-50 hover:bg-red-100/60'
                : isCritical ? 'bg-orange-50 hover:bg-orange-100/60'
                : isLow ? 'bg-amber-50/60 hover:bg-amber-100/40'
                : i % 2 === 0 ? 'bg-card hover:bg-accent/40' : 'bg-background hover:bg-accent/40';
              return (
                <tr
                  key={item.id}
                  onClick={() => toggleRow(item.id)}
                  className={`border-t border-border cursor-pointer transition-colors ${
                    selected.has(item.id) ? 'bg-primary/5' : rowHeat
                  }`}
                >
                  <td className="px-4 py-2.5">
                    <input
                      type="checkbox"
                      checked={selected.has(item.id)}
                      onChange={() => toggleRow(item.id)}
                      onClick={e => e.stopPropagation()}
                      className="cursor-pointer"
                    />
                  </td>
                  <td className="px-4 py-2.5 font-mono text-xs text-muted-foreground">{item.sku}</td>
                  <td className="px-4 py-2.5 font-medium">{item.name}</td>
                  <td className={`px-4 py-2.5 font-semibold ${(isOut || isCritical) ? 'text-red-600' : isLow ? 'text-amber-700' : 'text-foreground'}`}>
                    {(item.stock ?? 0).toLocaleString()}
                    {(isOut || isCritical) && <span className="ml-1.5 text-[10px] font-semibold bg-red-50 text-red-600 border border-red-200 rounded-full px-1.5 py-0.5">Low</span>}
                  </td>
                  <td className="px-4 py-2.5 text-muted-foreground">{item.unit || '—'}</td>
                   <td className="px-4 py-2.5">
                     {editingPrice === item.id ? (
                       <div className="flex items-center gap-2">
                         <input
                           type="number"
                           value={priceInput}
                           onChange={e => setPriceInput(e.target.value)}
                           placeholder="₱0.00"
                           step="0.01"
                           className="w-20 h-6 px-2 text-sm border border-border rounded focus:outline-none focus:ring-1 focus:ring-ring bg-card"
                           autoFocus
                         />
                         <button
                           onClick={handlePriceSave}
                           className="text-xs px-2 py-1 bg-primary text-primary-foreground rounded hover:opacity-90"
                         >
                           Save
                         </button>
                         <button
                           onClick={() => setEditingPrice(null)}
                           className="text-xs text-muted-foreground hover:text-foreground"
                         >
                           <X size={14} />
                         </button>
                       </div>
                     ) : (
                       <button
                         onClick={() => handlePriceEdit(item)}
                         className="text-muted-foreground hover:text-primary transition-colors"
                       >
                         {item.cost_per_unit ? `₱${item.cost_per_unit.toFixed(2)}` : '—'}
                       </button>
                     )}
                   </td>
                   <td className="px-4 py-2.5 text-muted-foreground">{item.reorder_point ?? '—'}</td>
                   <td className="px-4 py-2.5 text-muted-foreground">{item.reorder_qty ?? '—'}</td>
                   <td className="px-4 py-2.5">
                     <button
                       type="button"
                       onClick={event => {
                         event.stopPropagation();
                         setDetailsItem(item);
                       }}
                       className="inline-flex items-center gap-1.5 h-7 px-2.5 text-xs border border-border rounded bg-card hover:bg-muted transition-colors text-foreground"
                       aria-label={`View details for ${item.name || item.sku || 'item'}`}
                     >
                       <Eye size={12} /> View
                     </button>
                   </td>
                </tr>
              );
            })}
            {!loading && filtered.length === 0 && (
              <tr>
                <td colSpan={9} className="px-4 py-8 text-center text-muted-foreground text-sm">
                  {items.length === 0 ? 'No inventory items found. Seed items via InventoryItem entity.' : 'No items match your search.'}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <p className="text-xs text-muted-foreground mt-3">{filtered.length} item{filtered.length !== 1 ? 's' : ''}</p>
    </div>
  );
}