import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
import {
  Plus, ArrowUpDown, RotateCcw, Trash2, ArrowLeftRight, RefreshCw, History, Upload, X
} from 'lucide-react';
import BulkStockUpload from '@/components/BulkStockUpload';
import TransferModal from '@/components/TransferModal';
import StockHistoryModal from '@/components/StockHistoryModal';

const actions = [
  { label: 'Add / Update Item', icon: Plus },
  { label: 'Adjust Stock (+/-)', icon: ArrowUpDown },
  { label: 'Return / Refund', icon: RotateCcw },
  { label: 'Wastage', icon: Trash2 },
  { label: 'Transfer', icon: ArrowLeftRight },
  { label: 'Reload', icon: RefreshCw },
  { label: 'Stock History', icon: History },
];

export default function Inventory() {
  const navigate = useNavigate();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState('');
  const [search, setSearch] = useState('');
  const [selected, setSelected] = useState(new Set());
  const [showBulkUpload, setShowBulkUpload] = useState(false);
  const [showTransfer, setShowTransfer] = useState(false);
  const [showStockHistory, setShowStockHistory] = useState(false);
  const [editingPrice, setEditingPrice] = useState(null);
  const [priceInput, setPriceInput] = useState('');

  const loadItems = useCallback(async () => {
    setLoading(true);
    const rows = await base44.entities.InventoryItem.filter({ is_active: true }, '-updated_date', 200);
    setItems(rows || []);
    setLoading(false);
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

    await base44.entities.InventoryItem.update(editingPrice, { cost_per_unit: price });
    
    // Log the audit entry
    await base44.entities.AuditLog.create({
      item_id: editingPrice,
      sku: item.sku,
      item_name: item.name,
      change_type: 'PRICE_UPDATE',
      field_name: 'cost_per_unit',
      old_value: String(item.cost_per_unit || ''),
      new_value: String(price || ''),
      changed_by: changedBy,
    });

    setItems(prev => prev.map(i => i.id === editingPrice ? { ...i, cost_per_unit: price } : i));
    setEditingPrice(null);
    setPriceInput('');
  };

  return (
    <div className="p-6">
      {showStockHistory && (
        <StockHistoryModal
          onClose={() => setShowStockHistory(false)}
          selectedSkus={items.filter(i => selected.has(i.id)).map(i => i.sku)}
        />
      )}

      {showTransfer && (
        <TransferModal
          allItems={items}
          onClose={() => setShowTransfer(false)}
          onDone={loadItems}
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
              label === 'Reload' ? loadItems :
              label === 'Transfer' ? () => setShowTransfer(true) :
              label === 'Wastage' ? () => {
                const selectedItems = items.filter(i => selected.has(i.id));
                const params = selectedItems.length === 1
                  ? `?sku=${encodeURIComponent(selectedItems[0].sku)}`
                  : '';
                navigate(`/Wastage/workspace${params}`);
              } :
              label === 'Stock History' ? () => setShowStockHistory(true) :
              undefined
            }
            className="flex items-center gap-1.5 h-8 px-3 text-sm border border-border rounded bg-card hover:bg-muted transition-colors text-foreground"
          >
            <Icon size={13} className={label === 'Reload' && loading ? 'animate-spin' : ''} />
            {label}
          </button>
        ))}
      </div>

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
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={8} className="px-4 py-8 text-center text-muted-foreground text-sm">Loading inventory…</td></tr>
            ) : filtered.map((item, i) => {
              const belowReorder = item.reorder_point != null && (item.stock || 0) <= item.reorder_point;
              return (
                <tr
                  key={item.id}
                  onClick={() => toggleRow(item.id)}
                  className={`border-t border-border cursor-pointer transition-colors ${
                    selected.has(item.id) ? 'bg-primary/5' : i % 2 === 0 ? 'bg-card' : 'bg-background'
                  } hover:bg-accent/40`}
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
                  <td className={`px-4 py-2.5 font-semibold ${belowReorder ? 'text-red-600' : 'text-foreground'}`}>
                    {(item.stock ?? 0).toLocaleString()}
                    {belowReorder && <span className="ml-1.5 text-[10px] font-semibold bg-red-50 text-red-600 border border-red-200 rounded-full px-1.5 py-0.5">Low</span>}
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
                </tr>
              );
            })}
            {!loading && filtered.length === 0 && (
              <tr>
                <td colSpan={8} className="px-4 py-8 text-center text-muted-foreground text-sm">
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